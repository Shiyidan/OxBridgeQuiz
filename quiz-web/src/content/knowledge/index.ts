// 按考试与精确考纲编号匹配讲解，避免章节前缀或名称相似时串用内容。
import { esatUnits } from './esatUnits'
import { esatNumber } from './esatNumber'
import { esatRatioProportion } from './esatRatioProportion'
import { esatAlgebra } from './esatAlgebra'
import { esatGeometry } from './esatGeometry'
import { esatMath2Algebra } from './esatMath2Algebra'
import { esatMath2Sequences } from './esatMath2Sequences'
import { esatMath2Coordinate } from './esatMath2Coordinate'
import { esatMath2Trigonometry } from './esatMath2Trigonometry'
import { esatMath2Exponentials } from './esatMath2Exponentials'
import { esatMath2Differentiation } from './esatMath2Differentiation'
import { esatStatistics } from './esatStatistics'
import { esatProbability } from './esatProbability'
import { esatElectricity } from './esatElectricity'
import { esatMagnetism } from './esatMagnetism'
import { esatMechanics } from './esatMechanics'
import { esatThermalPhysics } from './esatThermalPhysics'
import { esatMatter } from './esatMatter'
import { esatWaves } from './esatWaves'
import { esatRadioactivity } from './esatRadioactivity'
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
import { esatAtomicStructure } from './esatAtomicStructure'
import { esatPeriodicTable } from './esatPeriodicTable'
import { esatChemicalReactions } from './esatChemicalReactions'
import { esatQuantitativeChemistry } from './esatQuantitativeChemistry'
import { esatRedox } from './esatRedox'
import { esatChemicalBonding } from './esatChemicalBonding'
import { esatGroupChemistry } from './esatGroupChemistry'
import { esatSeparationTechniques } from './esatSeparationTechniques'
import { esatAcidsBasesSalts } from './esatAcidsBasesSalts'
import { esatReactionRates } from './esatReactionRates'
import { esatEnergyChanges } from './esatEnergyChanges'
import { esatElectrolysis } from './esatElectrolysis'
import { esatOrganicChemistry } from './esatOrganicChemistry'
import { esatMetals } from './esatMetals'
import { esatParticleTheory } from './esatParticleTheory'
import { esatChemicalTests } from './esatChemicalTests'
import { esatAirWater } from './esatAirWater'
import type { KnowledgeLesson } from './types'

const esatLessons: KnowledgeLesson[] = [
  esatUnits,
  esatNumber,
  esatRatioProportion,
  esatAlgebra,
  esatGeometry,
  esatStatistics,
  esatProbability,
  esatMath2Algebra,
  esatMath2Sequences,
  esatMath2Coordinate,
  esatMath2Trigonometry,
  esatMath2Exponentials,
  esatMath2Differentiation,
  esatElectricity,
  esatMagnetism,
  esatMechanics,
  esatThermalPhysics,
  esatMatter,
  esatWaves,
  esatRadioactivity,
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
  esatAtomicStructure,
  esatPeriodicTable,
  esatChemicalReactions,
  esatQuantitativeChemistry,
  esatRedox,
  esatChemicalBonding,
  esatGroupChemistry,
  esatSeparationTechniques,
  esatAcidsBasesSalts,
  esatReactionRates,
  esatEnergyChanges,
  esatElectrolysis,
  esatOrganicChemistry,
  esatMetals,
  esatParticleTheory,
  esatChemicalTests,
  esatAirWater,
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
