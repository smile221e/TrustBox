import { initializeApp } from 'firebase-admin/app'
import { setGlobalOptions } from 'firebase-functions/v2'

initializeApp()

setGlobalOptions({
  region: 'europe-west1',
  maxInstances: 20,
})

export { submitFeedback } from './submitFeedback'
export { verifyAccessEmail } from './verifyAccessEmail'
