import { escapeHtml, isMailConfigured, type MailResult, sendExternalMail } from './mail.js'
import { prisma } from './prisma.js'
import { buildWebUrl, PASSWORD_RESET_PATH, PASSWORD_RESET_QUERY } from './return-path.js'
import { hashUrlToken, mintUrlToken } from './token.js'
import { config } from '../config.js'

export const issuePasswordResetToken = async (userId: string): Promise<string> => {
  const token = mintUrlToken()
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetTokenHash: hashUrlToken(token),
      passwordResetExpiresAt: new Date(Date.now() + config.passwordResetTtlMs),
    },
  })
  return token
}

export const buildPasswordResetUrl = (token: string): string =>
  buildWebUrl(config.corsOrigin, PASSWORD_RESET_PATH, { [PASSWORD_RESET_QUERY]: token })

const SUBJECT = 'Գաղտնաբառի վերականգնում — Ռեզյումե'

const text = (url: string): string =>
  `Ինչ-որ մեկը խնդրել է վերականգնել ձեր Ռեզյումե հաշվի գաղտնաբառը։\n\n${url}\n\n` +
  'Հղումը գործում է մեկ ժամ և կարող է օգտագործվել մեկ անգամ։ Եթե դա դուք չեք եղել, ' +
  'անտեսեք այս նամակը․ ձեր գաղտնաբառը չի փոխվել։'

const html = (url: string): string =>
  '<p>Ինչ-որ մեկը խնդրել է վերականգնել ձեր Ռեզյումե հաշվի գաղտնաբառը։</p>' +
  `<p><a href="${escapeHtml(url)}">Ընտրել նոր գաղտնաբառ</a></p>` +
  '<p>Հղումը գործում է մեկ ժամ և կարող է օգտագործվել մեկ անգամ։ Եթե դա դուք չեք եղել, ' +
  'անտեսեք այս նամակը․ ձեր գաղտնաբառը չի փոխվել։</p>'

/** Unconfigured is normal in dev (the link prints here) and an outage in production. */
export const sendPasswordResetEmail = async (to: string, url: string): Promise<MailResult> => {
  if (!isMailConfigured()) {
    if (config.nodeEnv === 'production') return { ok: false, status: 0, message: 'Mail engine is not configured' }
    console.log(`[mail] Password reset for ${to}\n${url}`)
    return { ok: true }
  }
  return sendExternalMail({ to, subject: SUBJECT, text: text(url), html: html(url) })
}
