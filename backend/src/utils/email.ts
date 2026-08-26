import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import config from '../config/index'
import logger from './logger'

// ── Logo attachment for CID embedding ──────────────────────────────────────────

// Load the logo file for email embedding - try multiple paths
const LOGO_PATHS = [
  resolve(process.cwd(), 'backend', 'public', 'assets', 'logo.jpg'),  // Canonical backend assets
  resolve(process.cwd(), 'public', 'assets', 'logo.jpg'),             // Alternative public dir
  resolve(__dirname, '../../public/assets/logo.jpg'),                 // From compiled dist
  resolve(__dirname, '../../../src/assets/logo.jpg'),                 // Fallback to src
]

let logoBuffer: Buffer | null = null
let logoPath = ''

for (const path of LOGO_PATHS) {
  try {
    logoBuffer = readFileSync(path)
    logoPath = path
    logger.info(`[EMAIL] Logo loaded (${logoBuffer.length} bytes) from ${path}`)
    break
  } catch (err) {
    // Try next path
  }
}

if (!logoBuffer) {
  logger.warn(`[EMAIL] Logo not found. Checked: ${LOGO_PATHS.join(', ')}`)
}

// ── Diagnostics ───────────────────────────────────────────────────────────────

export function getEmailConfig() {
  return {
    host:     config.email.host,
    port:     config.email.port,
    secure:   config.email.port === 465,
    user:     config.email.user   ? `${config.email.user.slice(0, 4)}****` : '(not set)',
    password: config.email.password ? '(set)' : '(not set)',
    from:     config.email.from,
    ready:    !!(config.email.user && config.email.password),
  }
}

// ── Transport ─────────────────────────────────────────────────────────────────

function createTransport() {
  if (!config.email.user || !config.email.password) {
    logger.warn('[EMAIL] SMTP credentials not set — SMTP_USER and SMTP_PASSWORD are required')
    return null
  }

  logger.debug(`[EMAIL] Creating transport — host:${config.email.host} port:${config.email.port} user:${config.email.user}`)

  return nodemailer.createTransport({
    host:   config.email.host,
    port:   config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
    tls: { rejectUnauthorized: false },
    debug: true,   // logs SMTP conversation
    logger: false, // use our own logger below
  })
}

// ── Verify connection (call on startup or via test endpoint) ──────────────────

export async function verifyEmailConfig(): Promise<{ ok: boolean; message: string }> {
  const cfg = getEmailConfig()
  logger.info(`[EMAIL] Config: ${JSON.stringify(cfg)}`)

  if (!cfg.ready) {
    const msg = '[EMAIL] SMTP not configured — SMTP_USER or SMTP_PASSWORD missing'
    logger.warn(msg)
    return { ok: false, message: msg }
  }

  const transport = createTransport()!
  try {
    await transport.verify()
    logger.info('[EMAIL] SMTP connection verified OK')
    return { ok: true, message: 'SMTP connection successful' }
  } catch (err: any) {
    const msg = `[EMAIL] SMTP verify failed: ${err?.message ?? err}`
    logger.error(msg)
    return { ok: false, message: msg }
  }
}

// ── Send helper ───────────────────────────────────────────────────────────────

export interface MailOptions {
  to:      string | string[]
  subject: string
  html:    string
  text?:   string
}

export async function sendEmail(opts: MailOptions): Promise<{ ok: boolean; error?: string }> {
  const transport = createTransport()

  if (!transport) {
    const msg = `[EMAIL] Skipped (no SMTP config) — To:${opts.to} Subject:${opts.subject}`
    logger.warn(msg)
    return { ok: false, error: 'SMTP not configured' }
  }

  try {
    // Build email with CID-embedded logo if available
    const mailOptions: any = {
      from:    `"ARSA Real Estate" <${config.email.user}>`,
      to:      Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
      subject: opts.subject,
      html:    opts.html,
      text:    opts.text ?? opts.html.replace(/<[^>]+>/g, ''),
    }

    // Attach logo for CID embedding (development & email client display)
    if (logoBuffer) {
      mailOptions.attachments = [
        {
          filename: 'logo.jpg',
          content: logoBuffer,
          cid: 'arsa-logo', // Referenced as cid:arsa-logo in HTML
          contentDisposition: 'inline',
        },
      ]
    }

    const info = await transport.sendMail(mailOptions)
    logger.info(`[EMAIL] Sent OK — id:${info.messageId} to:${opts.to} subject:"${opts.subject}"`)
    return { ok: true }
  } catch (err: any) {
    const msg = `[EMAIL] Send failed — to:${opts.to} subject:"${opts.subject}" error:${err?.message ?? err}`
    logger.error(msg)
    return { ok: false, error: err?.message ?? String(err) }
  }
}

// ── Templates ─────────────────────────────────────────────────────────────────

// Get the logo URL that works in both development and production email clients
function getLogoUrl(): string {
  // In production: use API_URL (server hostname) + /assets/logo.jpg
  // In development: use backend CID embedding (cid:arsa-logo)
  
  if (config.isDevelopment) {
    // CID embedding via attachment in sendEmail()
    return 'cid:arsa-logo'
  }
  
  // Production: use backend's public /assets/ endpoint with HTTPS
  let url = config.apiUrl || 'http://localhost:5000'
  
  // Ensure HTTPS in production for email clients
  if (config.isProduction && url.startsWith('http://')) {
    url = url.replace('http://', 'https://')
  }
  
  // Remove trailing slash if present
  url = url.replace(/\/$/, '')
  
  // Append logo path
  return `${url}/assets/logo.jpg`
}

const baseLayout = (content: string) => {
  // Development: Use CID (logo embedded as inline attachment)
  // Production: Use backend URL for email clients to fetch logo
  const logoSrc = config.isDevelopment ? 'cid:arsa-logo' : getLogoUrl()
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>ARSA Real Estate</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f5; font-family:'DM Sans',Arial,sans-serif; color:#111827; }
    .wrap { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.07); }
    .header { background:linear-gradient(135deg,#2d6a4f,#1b4332); padding:36px 40px; text-align:center; }
    .header-logo { max-width:120px; height:auto; display:inline-block; margin-bottom:12px; }
    .header h1 { margin:0; color:#fff; font-size:24px; letter-spacing:2px; font-weight:700; }
    .header p  { margin:6px 0 0; color:rgba(255,255,255,0.75); font-size:13px; }
    .body   { padding:36px 40px; }
    .footer { background:#f4f6f5; padding:24px 40px; text-align:center; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb; }
    .footer a { color:#2d6a4f; text-decoration:none; }
    .btn { display:inline-block; background:#2d6a4f; color:#fff!important; text-decoration:none; padding:12px 28px; border-radius:8px; font-weight:600; font-size:14px; margin:16px 0; }
    h2 { color:#111827; font-size:22px; margin-top:0; }
    p  { color:#374151; line-height:1.7; font-size:15px; }
    .divider { border:none; border-top:1px solid #e5e7eb; margin:24px 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <img src="${logoSrc}" alt="ARSA Real Estate" class="header-logo" style="border-radius:4px;"/>
      <h1>ARSA · REALESTATE</h1>
      <p>Curated Luxury · Exceptional Properties</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ARSA Real Estate. All rights reserved.</p>
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> from this list.</p>
    </div>
  </div>
</body>
</html>`
}

export const templates = {

  welcome: (email: string, unsubUrl: string) => {
    const html = baseLayout(`
      <h2>Welcome to ARSA Real Estate</h2>
      <p>Thank you for subscribing to our newsletter. You'll be the first to know about:</p>
      <ul style="color:#374151;line-height:2;font-size:15px;">
        <li>🏡 New luxury property listings</li>
        <li>📈 Market insights and trends</li>
        <li>🎯 Exclusive off-market opportunities</li>
        <li>💡 Real estate investment tips</li>
      </ul>
      <hr class="divider"/>
      <p style="font-size:13px;color:#6b7280;">
        You subscribed with <strong>${email}</strong>.
        If this was a mistake, you can unsubscribe at any time using the link below.
      </p>
    `).replace('{{unsubscribeUrl}}', unsubUrl)

    return {
      subject: 'Welcome to ARSA Real Estate Newsletter',
      html,
      text: `Welcome to ARSA Real Estate! You've successfully subscribed.\nUnsubscribe: ${unsubUrl}`,
    }
  },

  blast: (subject: string, content: string, unsubUrl: string) => {
    const html = baseLayout(`
      <h2>${subject}</h2>
      <div style="color:#374151;line-height:1.8;font-size:15px;">${content.replace(/\n/g, '<br/>')}</div>
      <hr class="divider"/>
      <p style="font-size:13px;color:#6b7280;">
        You're receiving this because you subscribed to ARSA Real Estate updates.
      </p>
    `).replace(/\{\{unsubscribeUrl\}\}/g, unsubUrl)

    return {
      subject,
      html,
      text: `${subject}\n\n${content}\n\nUnsubscribe: ${unsubUrl}`,
    }
  },
}
