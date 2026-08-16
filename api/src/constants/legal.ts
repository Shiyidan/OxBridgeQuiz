// 协议版本常量：认证与支付审计统一记录用户操作当时对应的正式文档版本。
export const LEGAL_DOCUMENT_VERSIONS = {
  userAgreement: 'V1.0',
  privacyPolicy: 'V1.0',
  membershipServiceAgreement: 'V1.2',
  membershipPurchaseNotice: 'V1.2',
} as const

export const LEGAL_DOCUMENT_TYPE = {
  USER_AGREEMENT: 'user_agreement',
  PRIVACY_POLICY: 'privacy_policy',
  MEMBERSHIP_SERVICE_AGREEMENT: 'membership_service_agreement',
  MEMBERSHIP_PURCHASE_NOTICE: 'membership_purchase_notice',
} as const

export const LEGAL_ACCEPTANCE_SOURCE = {
  REGISTER: 'register',
  LOGIN: 'login',
  PAYMENT_ORDER: 'payment_order',
} as const

export type LegalDocumentType = (typeof LEGAL_DOCUMENT_TYPE)[keyof typeof LEGAL_DOCUMENT_TYPE]
export type LegalAcceptanceSource =
  (typeof LEGAL_ACCEPTANCE_SOURCE)[keyof typeof LEGAL_ACCEPTANCE_SOURCE]
