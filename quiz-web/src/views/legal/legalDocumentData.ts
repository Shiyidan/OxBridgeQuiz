// 法律文档入口配置：集中维护公开路由、标题和待补充的 Markdown 正文。
import membershipPurchaseNotice from '@/content/legal/membership-purchase-notice.md?raw'
import membershipServiceAgreement from '@/content/legal/membership-service-agreement.md?raw'
import privacyPolicy from '@/content/legal/privacy-policy.md?raw'
import userAgreement from '@/content/legal/user-agreement.md?raw'

export type LegalDocumentType =
  | 'user-agreement'
  | 'privacy-policy'
  | 'membership-service-agreement'
  | 'membership-purchase-notice'

export interface LegalDocumentDefinition {
  type: LegalDocumentType
  title: string
  shortTitle: string
  markdown: string
}

export const legalDocuments: Record<LegalDocumentType, LegalDocumentDefinition> = {
  'user-agreement': {
    type: 'user-agreement',
    title: '用户服务协议',
    shortTitle: '用户协议',
    markdown: userAgreement,
  },
  'privacy-policy': {
    type: 'privacy-policy',
    title: '隐私政策',
    shortTitle: '隐私政策',
    markdown: privacyPolicy,
  },
  'membership-service-agreement': {
    type: 'membership-service-agreement',
    title: '会员服务协议',
    shortTitle: '会员服务协议',
    markdown: membershipServiceAgreement,
  },
  'membership-purchase-notice': {
    type: 'membership-purchase-notice',
    title: '会员购买须知与权益说明',
    shortTitle: '购买须知与权益',
    markdown: membershipPurchaseNotice,
  },
}

export const legalDocumentList = Object.values(legalDocuments)

// 路由参数只接受已经配置的四类法律文档，避免页面读取任意未知键值。
export function isLegalDocumentType(value: string): value is LegalDocumentType {
  return value in legalDocuments
}
