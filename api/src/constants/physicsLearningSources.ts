// 物理七章共享已审核题源，正文仍从官方 Question 表读取。
import { physicsElectricityMagnetismThermalSources } from "./physicsElectricityMagnetismThermal.js";
import { physicsMechanicsMatterSources } from "./physicsMechanicsMatter.js";
import { physicsWavesRadioactivitySources } from "./physicsWavesRadioactivity.js";
import type { PhysicsLearningSelection } from "./physicsLearningTypes.js";

export const physicsLearningSources: Record<string, PhysicsLearningSelection> =
  {
    ...physicsElectricityMagnetismThermalSources,
    ...physicsMechanicsMatterSources,
    ...physicsWavesRadioactivitySources,
  };
