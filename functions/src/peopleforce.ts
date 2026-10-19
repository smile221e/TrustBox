import { logger } from 'firebase-functions'

const DEFAULT_BASE = 'https://app.peopleforce.io/api/public/v3'
/** Top-level departments: 221e + ITC (and all nested children). */
const DEFAULT_ROOT_DEPARTMENT_IDS = [99123, 38131]

type Department = {
  id: number
  name: string
  parent_id: number | null
}

type Employee = {
  id: number
  email: string | null
  status: string
  department?: { id: number; name: string; parent_id: number | null } | null
}

type ListResponse<T> = {
  data: T[]
  metadata?: { pagination?: { page: number; pages: number; count: number } }
}

let cachedAllowedDeptIds: { ids: Set<number>; fetchedAt: number } | null = null
const DEPT_CACHE_MS = 15 * 60 * 1000

function apiKey(): string {
  const key = process.env.PEOPLEFORCE_API_KEY?.trim()
  if (!key) {
    throw new Error('peopleforce_not_configured')
  }
  return key
}

function baseUrl(): string {
  return (process.env.PEOPLEFORCE_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/$/, '')
}

function rootDepartmentIds(): number[] {
  const raw = process.env.PEOPLEFORCE_ALLOWED_DEPARTMENT_IDS?.trim()
  if (!raw) return DEFAULT_ROOT_DEPARTMENT_IDS
  return raw
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

async function pfFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: {
      'X-API-KEY': apiKey(),
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    logger.error('peopleforce_http_error', { status: res.status, path })
    throw new Error('peopleforce_unavailable')
  }

  return (await res.json()) as T
}

async function listAllDepartments(): Promise<Department[]> {
  const all: Department[] = []
  let page = 1
  let pages = 1

  while (page <= pages) {
    const json = await pfFetch<ListResponse<Department>>(`/departments?page=${page}`)
    all.push(...(json.data ?? []))
    pages = json.metadata?.pagination?.pages ?? 1
    page += 1
  }

  return all
}

function expandDepartmentTree(departments: Department[], roots: number[]): Set<number> {
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

async function getAllowedDepartmentIds(): Promise<Set<number>> {
  const now = Date.now()
  if (cachedAllowedDeptIds && now - cachedAllowedDeptIds.fetchedAt < DEPT_CACHE_MS) {
    return cachedAllowedDeptIds.ids
  }

  const departments = await listAllDepartments()
  const ids = expandDepartmentTree(departments, rootDepartmentIds())
  cachedAllowedDeptIds = { ids, fetchedAt: now }
  return ids
}

async function findEmployeeByEmail(email: string): Promise<Employee | null> {
  const encoded = encodeURIComponent(email)
  const json = await pfFetch<ListResponse<Employee>>(
    `/employees?emails[]=${encoded}&status=active`,
  )
  const match = (json.data ?? []).find(
    (emp) => (emp.email ?? '').trim().toLowerCase() === email,
  )
  return match ?? null
}

/**
 * True when email belongs to an active PeopleForce employee in 221e / ITC tree.
 */
export async function isEmployeeAllowed(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  const employee = await findEmployeeByEmail(normalized)
  if (!employee) return false

  const departmentId = employee.department?.id
  if (!departmentId) return false

  const allowed = await getAllowedDepartmentIds()
  return allowed.has(departmentId)
}
