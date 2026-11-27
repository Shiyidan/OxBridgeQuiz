// 已发布图谱注册表：ESAT 五科各取自己的关系与分层规则，其他考试不复用这些数据。
import { maths1KnowledgeGraph } from './maths1'
import { maths1Overview } from './maths1Overview'
import { maths2KnowledgeGraph } from './maths2'
import { maths2Overview } from './maths2Overview'
import { physicsKnowledgeGraph } from './physics'
import { physicsOverview } from './physicsOverview'
import { chemistryKnowledgeGraph } from './chemistry'
import { chemistryOverview } from './chemistryOverview'
import { biologyKnowledgeGraph } from './biology'
import { biologyOverview } from './biologyOverview'

const graphDefinitions = [
  { graph: maths1KnowledgeGraph, overview: maths1Overview },
  { graph: maths2KnowledgeGraph, overview: maths2Overview },
  { graph: physicsKnowledgeGraph, overview: physicsOverview },
  { graph: chemistryKnowledgeGraph, overview: chemistryOverview },
  { graph: biologyKnowledgeGraph, overview: biologyOverview },
] as const

// 考试类型参与匹配，避免相同页面在其他考试中展示 ESAT 的学习图谱。
export function getSubjectKnowledgeGraph(examType: string, subjectCode: string) {
  return graphDefinitions.find(
    ({ graph }) => graph.examType === examType && graph.subjectCode === subjectCode,
  )
}
