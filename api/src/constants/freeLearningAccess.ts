// ESAT 数学1前四节的公开学习资源；后续课程继续按考试学习会员授权。
export const FREE_LEARNING_SECTION_CODES = ['110101', '110102', '110201', '110202'] as const

// 仅包含四节已配置的精选例题与考法题源，不能由客户端传知识点编号扩大题目范围。
const freeExampleCodes = new Set([
  'ESAT_LEGACY_2022_NSAA_Q012',
  'NSAA_2023_S1-Q011',
  'ENGAA_2017_S1-Q027',
  'ESAT_LEGACY_2018_ENGAA_Q13',
  'ESAT_LEGACY_2021_NSAA_Q019',
  'ESAT_LEGACY_2021_NSAA_Q018',
  'ENGAA_2016_S1-Q001',
  'ENGAA_2017_S1-Q003',
  'NSAA_2019_S1-Q002',
  'ESAT_LEGACY_2022_NSAA_Q003',
  'ESAT_LEGACY_2022_NSAA_Q008',
  'NSAA_2023_S1-Q004',
  'NSAA_2023_S1-Q008',
  'ESAT_LEGACY_2021_NSAA_Q005',
  'ESAT_LEGACY_2018_ENGAA_Q01',
  'ENGAA_2016_S1-Q023',
  'ENGAA_2016_S1-Q007',
  'ENGAA_2017_S1-Q007',
  'ESAT-2020-MATHS1-002',
  'ESAT-M1-MOCK-ADAPT-E02-015',
  'ESAT-M1-AI-20260809-D5728C365ACE-R3',
])

// 按资源自身路径与题源白名单开放，免费自测仍由服务层校验固定题目和作答选项。
export function isFreeLearningResource(method: string, path: string): boolean {
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'esat' && parts[1] === 'self-check' &&
    FREE_LEARNING_SECTION_CODES.some((code) => code === parts[2])) {
    return (method === 'GET' && parts.length === 3) ||
      (method === 'POST' && parts.length === 4 && parts[3] === 'answer')
  }
  return method === 'GET' && ['mathematics1', 'pattern'].includes(parts[0] || '') &&
    parts[1] === 'examples' && freeExampleCodes.has(parts[2] || '') &&
    (parts.length === 3 || (parts.length === 4 && parts[3] === 'analysis'))
}
