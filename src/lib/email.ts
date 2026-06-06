import nodemailer from "nodemailer"

const APP_URL = process.env.NEXTAUTH_URL ?? "https://prode-2026-tau.vercel.app/"

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function baseTemplate(icon: string, tagline: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f4f5;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#18181b;padding:24px 32px;">
      <div style="font-size:24px;margin-bottom:6px;">${icon}</div>
      <div style="color:#ffffff;font-size:16px;font-weight:700;">Prode Mundial 2026</div>
      <div style="color:#a1a1aa;font-size:13px;margin-top:2px;">${tagline}</div>
    </div>
    <div style="padding:28px 32px;color:#18181b;">
      ${content}
    </div>
    <div style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #f0f0f0;font-size:12px;color:#a1a1aa;text-align:center;">
      Prode Mundial 2026 · <a href="${APP_URL}" style="color:#71717a;text-decoration:none;">${APP_URL.replace(/^https?:\/\//, "")}</a>
    </div>
  </div>
</body>
</html>`
}

export function reminderEmail(userName: string | null): { subject: string; html: string } {
  const name = userName ?? "jugador"
  const content = `
    <p style="font-size:15px;margin:0 0 14px;color:#3f3f46;">Hola <strong>${name}</strong>,</p>
    <p style="font-size:15px;margin:0 0 20px;color:#52525b;line-height:1.6;">
      ¡El Mundial 2026 se acerca! Todavía estás a tiempo de completar tus predicciones de partidos y tus picks del torneo.
    </p>
    <a href="${APP_URL}/predicciones"
       style="display:inline-block;background:#18181b;color:#ffffff;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      Completar mis predicciones →
    </a>
  `
  return {
    subject: "Completá tus predicciones — Mundial 2026",
    html: baseTemplate("🏆", "Recordatorio de predicciones", content),
  }
}

export function announcementEmail(
  userName: string | null,
  subject: string,
  body: string,
): { subject: string; html: string } {
  const name = userName ?? "jugador"
  const bodyHtml = body
    .split("\n")
    .map((line) => `<p style="font-size:15px;margin:0 0 12px;color:#52525b;line-height:1.6;">${line || "&nbsp;"}</p>`)
    .join("")
  const content = `
    <p style="font-size:15px;margin:0 0 20px;color:#3f3f46;">Hola <strong>${name}</strong>,</p>
    ${bodyHtml}
    <a href="${APP_URL}"
       style="display:inline-block;margin-top:8px;background:#18181b;color:#ffffff;padding:11px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      Ir al Prode →
    </a>
  `
  return { subject, html: baseTemplate("📢", subject, content) }
}

export async function sendBulkEmail(
  users: { email: string; name: string | null }[],
  buildEmail: (user: { email: string; name: string | null }) => { subject: string; html: string },
): Promise<{ sent: number; failed: number }> {
  const transporter = getTransporter()
  const from = `Prode 2026 <${process.env.GMAIL_USER}>`

  let sent = 0
  let failed = 0

  for (const user of users) {
    try {
      const { subject, html } = buildEmail(user)
      await transporter.sendMail({ from, to: user.email, subject, html })
      sent++
    } catch {
      failed++
    }
  }

  return { sent, failed }
}
