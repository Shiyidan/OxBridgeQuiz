/** 正式协议版本：认证与支付请求提交用户当前看到的文档版本。 */
export const AUTH_LEGAL_VERSIONS = {
  userAgreement: 'V1.0',
  privacyPolicy: 'V1.0',
} as const

export const MEMBERSHIP_LEGAL_VERSIONS = {
  membershipServiceAgreement: 'V1.0',
  membershipPurchaseNotice: 'V1.0',
} as const

export interface AuthLegalVersions {
  userAgreement: string
  privacyPolicy: string
}

export interface MembershipLegalVersions {
  membershipServiceAgreement: string
  membershipPurchaseNotice: string
}
