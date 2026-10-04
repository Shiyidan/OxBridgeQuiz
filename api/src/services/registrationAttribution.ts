// 注册转化归因：用服务端签名 Cookie 记录本浏览器首次匿名访问，不使用 IP 拼接用户身份。
import crypto from "node:crypto";
import type { Request, Response } from "express";
import { config } from "../config.js";

export const REGISTRATION_VISIT_COOKIE = "quiz_first_visit";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

// 签名限定归因用途，浏览器不能自行回填访问时间。
function signature(value: string): string {
  return crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`registration-visit:v1:${value}`)
    .digest("hex");
}

// 无签名、过期或未来时间返回未知，历史注册不会被伪造为零时长。
export function readRegistrationVisit(
  req: Pick<Request, "cookies">,
  now = new Date(),
): Date | null {
  const cookie: unknown = req.cookies?.[REGISTRATION_VISIT_COOKIE];
  if (typeof cookie !== "string" || cookie.length > 100) return null;
  const [value, signed, extra] = cookie.split(".");
  if (
    !value ||
    !signed ||
    extra ||
    !/^\d{13}$/.test(value) ||
    !/^[a-f0-9]{64}$/.test(signed)
  )
    return null;
  if (
    !crypto.timingSafeEqual(
      Buffer.from(signed, "hex"),
      Buffer.from(signature(value), "hex"),
    )
  )
    return null;
  const time = Number(value);
  if (time > now.getTime() || now.getTime() - time > MAX_AGE_MS) return null;
  return new Date(time);
}

// 同一浏览器的重复访问保留起点，只在第一次可统计的匿名访问时写入。
export function recordRegistrationVisit(
  req: Request,
  res: Response,
  now = new Date(),
): void {
  if (readRegistrationVisit(req, now)) return;
  const value = String(now.getTime());
  res.cookie(REGISTRATION_VISIT_COOKIE, `${value}.${signature(value)}`, {
    httpOnly: true,
    secure: config.refreshCookieSecure,
    sameSite: config.refreshCookieSameSite,
    path: "/api",
    maxAge: MAX_AGE_MS,
  });
}

// 注册完成后消费归因，避免同一浏览器后续注册复用上一个账号的访问起点。
export function clearRegistrationVisit(res: Response): void {
  res.clearCookie(REGISTRATION_VISIT_COOKIE, {
    httpOnly: true,
    secure: config.refreshCookieSecure,
    sameSite: config.refreshCookieSameSite,
    path: "/api",
  });
}
