import nodemailer from 'nodemailer'
import { config } from '../config.js'
import type { EmailCodePurpose } from '../constants/auth.js'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!config.smtpUser || !config.smtpPass || !config.mailFrom) {
    throw new Error('SMTP_USER, SMTP_PASS and MAIL_FROM are required')
  }
  transporter ??= nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })
  return transporter
}

const purposeLabels: Record<EmailCodePurpose, string> = {
  REGISTER: '注册账号',
  RESET_PASSWORD: '重置密码',
  CHANGE_EMAIL: '修改邮箱',
}

export async function sendVerificationCodeEmail(input: {
  to: string
  code: string
  purpose: EmailCodePurpose
  expiresInMinutes: number
}): Promise<string> {
  const action = purposeLabels[input.purpose]
  const info = await getTransporter().sendMail({
    from: config.mailFrom,
    to: input.to,
    subject: `AceMock ${action}验证码`,
    text: `你的验证码是 ${input.code}，${input.expiresInMinutes} 分钟内有效。如非本人操作，请忽略本邮件。请勿向任何人泄露验证码。`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.7">
        <h2 style="margin:0 0 16px">AceMock ${action}验证</h2>
        <p>你的验证码是：</p>
        <p style="font-size:30px;font-weight:700;letter-spacing:8px;margin:18px 0">${input.code}</p>
        <p>验证码在 ${input.expiresInMinutes} 分钟内有效。</p>
        <p style="color:#64748b">如非本人操作，请忽略本邮件。请勿向任何人泄露验证码。</p>
      </div>
    `,
  })
  return info.messageId
}

