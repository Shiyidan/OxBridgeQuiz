// 物理32个叶子知识点固定自测映射，避免随机选题偏离当前学习范围。
import { physicsElectricityMagnetismThermalSelfChecks } from "./physicsElectricityMagnetismThermal.js";
import { physicsMechanicsMatterSelfChecks } from "./physicsMechanicsMatter.js";
import { physicsWavesRadioactivitySelfChecks } from "./physicsWavesRadioactivity.js";
import type { PhysicsLearningSelection } from "./physicsLearningTypes.js";

export const physicsLearningSelfChecks: Record<
  string,
  { title: string; selection: PhysicsLearningSelection | null }
> = {
  ...physicsElectricityMagnetismThermalSelfChecks,
  ...physicsMechanicsMatterSelfChecks,
  ...physicsWavesRadioactivitySelfChecks,
};
