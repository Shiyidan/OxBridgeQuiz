// 按考试与精确考纲编号匹配讲解，避免章节前缀或名称相似时串用内容。
import { esatUnits } from './esatUnits'
import { esatNumber } from './esatNumber'
import { esatCells } from './esatCells'
import { esatMembraneTransport } from './esatMembraneTransport'
import { esatCellDivision } from './esatCellDivision'
import { esatInheritance } from './esatInheritance'
import { esatDna } from './esatDna'
import { esatGeneTechnologies } from './esatGeneTechnologies'
import { esatVariation } from './esatVariation'
import { esatEnzymes } from './esatEnzymes'
import { esatAnimalPhysiology } from './esatAnimalPhysiology'
import { esatEcosystems } from './esatEcosystems'
import { esatPlantPhysiology } from './esatPlantPhysiology'
import type { KnowledgeLesson } from './types'

const esatLessons: KnowledgeLesson[] = [
  esatUnits,
  esatNumber,
  esatCells,
  esatMembraneTransport,
  esatCellDivision,
  esatInheritance,
  esatDna,
  esatGeneTechnologies,
  esatVariation,
  esatEnzymes,
  esatAnimalPhysiology,
  esatEcosystems,
  esatPlantPhysiology,
]

// 仅已编写的章节与叶子节点可打开讲解；其他考试及学科总节点保持原有题库。
export function findKnowledgeLesson(examType: string, code: string): KnowledgeLesson | null {
  if (examType !== 'ESAT') return null
  return (
    esatLessons.find(
      (lesson) => lesson.code === code || lesson.sections.some((section) => section.code === code),
    ) ?? null
  )
}
