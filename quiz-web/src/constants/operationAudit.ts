// 操作审计展示常量：供操作日志与学生行为分析统一使用模块和行为中文标签。
export interface OperationAuditOption {
  label: string
  value: string
}

export const OPERATION_AUDIT_MODULE_OPTIONS: OperationAuditOption[] = [
  { label: '认证安全', value: 'auth' },
  { label: '个人资料', value: 'profile' },
  { label: '考试作答', value: 'exam' },
  { label: '支付订阅', value: 'payment' },
  { label: '用户管理', value: 'user' },
  { label: '试卷题库', value: 'paper' },
  { label: '教学大纲', value: 'syllabus' },
  { label: '营收成本', value: 'revenue' },
  { label: '学习资料', value: 'resource' },
]

export const STUDENT_BEHAVIOR_MODULE_OPTIONS = OPERATION_AUDIT_MODULE_OPTIONS.filter((option) =>
  ['profile', 'exam', 'payment'].includes(option.value),
)

export const OPERATION_AUDIT_ACTION_LABELS: Record<string, string> = {
  'profile.update': '修改个人资料',
  'profile.exam_preferences.update': '修改备考偏好',
  'profile.study_preferences.update': '修改学习偏好',
  'exam.start': '开始考试',
  'exam.submit': '提交考试',
  'diagnostic_report.view': '查看诊断分析报告',
  'mistake_notebook.view': '查看错题本',
  'mock_exam.start': '开始模考',
  'mock_exam.abandon': '放弃模考',
  'payment.order.create': '创建支付订单',
  'payment.order.close': '关闭支付订单',
  'admin.user.gift_cards.create': '管理员赠送日卡',
  'admin.study_resource.upload': '上传学习资料',
  'admin.study_resource.past_paper_upload': '上传年度真题资料组',
  'admin.study_resource.status_update': '更新学习资料发布状态',
  'admin.study_resource.delete': '删除学习资料',
}

// 未知扩展模块保留原始编码，避免新增后端模块时页面显示为空。
export function operationModuleLabel(module: string): string {
  return OPERATION_AUDIT_MODULE_OPTIONS.find((item) => item.value === module)?.label || module
}

// 未配置的行为使用编码兜底，确保排行与下钻条件始终可辨识。
export function operationActionLabel(action: string): string {
  return OPERATION_AUDIT_ACTION_LABELS[action] || action
}
