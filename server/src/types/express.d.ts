import type { OAuthFlowContext } from '../lib/oauth-state.js'
import type { CvOwner } from '../middleware/auth.js'
import type { SessionPayload } from '../lib/session.js'

declare global {
  namespace Express {
    interface Request {
      session?: SessionPayload
      /** Set by `requireCvOwner`: the account, or the guest key, a CV route acts for. */
      cvOwner?: CvOwner
      /** Set by `oauthStateStore.verify` once the Google `state` nonce has matched. */
      oauthFlow?: OAuthFlowContext
    }
  }
}

export {}
