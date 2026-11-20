// 化学后十一章的概念与方法注册表，统一供讲义入口与章节元数据引用。
import type { ChemistryMethodLesson } from './chemistryMethodTypes'
import { groupChemistryMethods } from './groupChemistryMethods'
import { separationMethods } from './separationMethods'
import { acidsMethods } from './acidsMethods'
import { reactionRateMethods } from './reactionRateMethods'
import { energyMethods } from './energyMethods'
import { electrolysisMethods } from './electrolysisMethods'
import { organicMethods } from './organicMethods'
import { metalsMethods } from './metalsMethods'
import { particleMethods } from './particleMethods'
import { chemicalTestMethods } from './chemicalTestMethods'
import { airWaterMethods } from './airWaterMethods'

export const chemistryRemainingMethods: Record<string, ChemistryMethodLesson> = {
  ...groupChemistryMethods,
  ...separationMethods,
  ...acidsMethods,
  ...reactionRateMethods,
  ...energyMethods,
  ...electrolysisMethods,
  ...organicMethods,
  ...metalsMethods,
  ...particleMethods,
  ...chemicalTestMethods,
  ...airWaterMethods,
}
