import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const DEFAULT_BASE = 'https://app.peopleforce.io/api/public/v3'
const DEFAULT_ROOT_IDS = [99123, 38131]

type Department = { id: number; parent_id: number | null }

/** Read a KEY=value from .env without relying on process.env (avoids BOM / load order issues). */
function readEnvFileValue(rootDir: string, key: string): string | undefined {
  for (const file of ['.env.local', '.env']) {
    const full = path.join(rootDir, file)
    if (!fs.existsSync(full)) continue
    const raw = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const k = trimmed.slice(0, eq).trim()
      if (k !== key) continue
      let v = trimmed.slice(eq + 1).trim()
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1)
      }
      return v
    }
  }
  return undefined
}

function envValue(rootDir: string, key: string): string | undefined {
  return process.env[key]?.trim() || readEnvFileValue(rootDir, key)?.trim() || undefined
}

function rootIds(rootDir: string): number[] {
  const raw = envValue(rootDir, 'PEOPLEFORCE_ALLOWED_DEPARTMENT_IDS')
  if (!raw) return DEFAULT_ROOT_IDS
  return raw
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

function expand(departments: Department[], roots: number[]): Set<number> {
  const allowed = new Set(roots)
  let grew = true
  while (grew) {
    grew = false
    for (const dept of departments) {
      if (dept.parent_id != null && allowed.has(dept.parent_id) && !allowed.has(dept.id)) {
        allowed.add(dept.id)
        grew = true
      }
    }
  }
  return allowed
}

async function pfJson<T>(baseUrl: string, apiKey: string, apiPath: string): Promise<T> {
  const res = await fetch(`${baseUrl}${apiPath}`, {
    headers: { 'X-API-KEY': apiKey, Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`peopleforce_${res.status}`)
  }
  return (await res.json()) as T
}

/**
 * Dev-only server endpoint so local `npm run dev` can verify emails
 * without deploying Cloud Functions. Uses PEOPLEFORCE_API_KEY from `.env`.
 */
export function accessApiPlugin(rootDir: string): Plugin {
  return {
    name: 'trustbox-access-api',
    configureServer(server) {
      server.middlewares.use('/api/verify-access', (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => {
          void (async () => {
            try {
              const apiKey = envValue(rootDir, 'PEOPLEFORCE_API_KEY')
              if (!apiKey) {
                console.error('[access-api] PEOPLEFORCE_API_KEY missing in .env')
                res.statusCode = 503
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ allowed: false, error: 'peopleforce_not_configured' }))
                return
              }

              const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as {
                email?: string
              }
              const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
              if (!email.endsWith('@221e.space')) {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ allowed: false }))
                return
              }

              const baseUrl = (
                envValue(rootDir, 'PEOPLEFORCE_BASE_URL') || DEFAULT_BASE
              ).replace(/\/$/, '')

              const empJson = await pfJson<{
                data: Array<{
                  email: string | null
                  department?: { id: number } | null
                }>
              }>(baseUrl, apiKey, `/employees?emails[]=${encodeURIComponent(email)}&status=active`)

              const employee = (empJson.data ?? []).find(
                (e) => (e.email ?? '').trim().toLowerCase() === email,
              )
              if (!employee?.department?.id) {
                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ allowed: false }))
                return
              }

              const deptJson = await pfJson<{ data: Department[] }>(
                baseUrl,
                apiKey,
                '/departments?page=1',
              )
              const allowedDepts = expand(deptJson.data ?? [], rootIds(rootDir))
              const allowed = allowedDepts.has(employee.department.id)

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ allowed, email: allowed ? email : undefined }))
            } catch (err) {
              console.error('[access-api]', err)
              res.statusCode = 503
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ allowed: false, error: 'peopleforce_unavailable' }))
            }
          })()
        })
        req.on('error', () => next())
      })
    },
  }
}
