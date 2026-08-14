// 为认证验证码和活动通知提供彼此隔离的 SMTP 通道及部署预检。
import { lookup } from 'node:dns/promises'
import nodemailer from 'nodemailer'
import { config } from '../config.js'
import type { EmailCodePurpose } from '../constants/auth.js'

type MailChannelConfig = {
  label: 'transactional' | 'bulk'
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

const transactionalChannel: MailChannelConfig = {
  label: 'transactional',
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpSecure,
  user: config.smtpUser,
  pass: config.smtpPass,
  from: config.mailFrom,
}

const bulkChannel: MailChannelConfig = {
  label: 'bulk',
  host: config.bulkSmtpHost,
  port: config.bulkSmtpPort,
  secure: config.bulkSmtpSecure,
  user: config.bulkSmtpUser,
  pass: config.bulkSmtpPass,
  from: config.bulkMailFrom,
}

// 使用指定业务通道创建 SMTP 连接，并通过系统 DNS 避免 Windows 下的 c-ares 阻塞。
async function createTransporter(channel: MailChannelConfig): Promise<nodemailer.Transporter> {
  if (!channel.user || !channel.pass || !channel.from) {
    throw new Error(`${channel.label} SMTP credentials and sender are required`)
  }
  const { address } = await lookup(channel.host, { family: 4 })
  return nodemailer.createTransport({
    host: address,
    port: channel.port,
    secure: channel.secure,
    authMethod: 'LOGIN',
    connectionTimeout: config.smtpConnectionTimeoutMs,
    greetingTimeout: config.smtpGreetingTimeoutMs,
    socketTimeout: config.smtpSocketTimeoutMs,
    tls: {
      servername: channel.host,
    },
    auth: {
      user: channel.user,
      pass: channel.pass,
    },
  })
}

// 验证指定 SMTP 通道的网络和账号，不发送邮件。
async function verifyTransport(channel: MailChannelConfig): Promise<void> {
  const transporter = await createTransporter(channel)
  try {
    await transporter.verify()
  } finally {
    transporter.close()
  }
}

// 部署预检通过真实握手验证 SMTP 地址、网络连通性与账号凭据，不发送邮件。
export async function verifyMailTransport(): Promise<void> {
  await verifyTransport(transactionalChannel)
}

// 部署预检单独验证活动群发账号，防止误用交易邮件发件人。
export async function verifyBulkMailTransport(): Promise<void> {
  await verifyTransport(bulkChannel)
}

const purposeLabels: Record<EmailCodePurpose, string> = {
  REGISTER: '注册账号',
  RESET_PASSWORD: '重置密码',
  CHANGE_EMAIL: '修改邮箱',
}

// 将验证码邮件提交给 SMTP 服务，并返回服务端生成的邮件标识。
export async function sendVerificationCodeEmail(input: {
  to: string
  code: string
  purpose: EmailCodePurpose
  expiresInMinutes: number
}): Promise<string> {
  const action = purposeLabels[input.purpose]
  const transporter = await createTransporter(transactionalChannel)
  try {
    const info = await transporter.sendMail({
      from: transactionalChannel.from,
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
  } finally {
    transporter.close()
  }
}
