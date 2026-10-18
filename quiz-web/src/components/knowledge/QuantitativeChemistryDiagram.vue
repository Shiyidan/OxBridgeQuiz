<!-- ESAT 定量化学图解：用可调整的计算路线呈现单位、粒子、限量和溶液数据，供第四章复习使用。 -->
<template>
  <figure class="quantity-atlas" :aria-label="view.title">
    <figcaption>
      <span class="atlas-eyebrow">CHEMISTRY LAB · 定量计算</span>
      <h5>{{ view.title }}</h5>
      <p>{{ view.subtitle }}</p>
    </figcaption>

    <template v-if="mode === 'formula'">
      <div class="controls" role="group" aria-label="选择化学式">
        <AppButton
          v-for="key in formulaChoices"
          :key="key"
          type="secondary"
          size="small"
          :aria-pressed="formulaKey === key"
          @click="formulaKey = key"
          >{{ formulas[key].label }}</AppButton
        >
      </div>
      <div class="table-scroll" tabindex="0" aria-label="化学式质量构成表">
        <table>
          <thead>
            <tr>
              <th>元素</th>
              <th>化学式中原子数</th>
              <th>相对原子质量</th>
              <th>质量贡献</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="atom in formula.atoms" :key="atom.symbol">
              <th>{{ atom.symbol }}</th>
              <td>{{ atom.count }}</td>
              <td>{{ atom.ar }}</td>
              <td>
                <strong>{{ atom.count * atom.ar }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="stack" :aria-label="formulaMassDescription">
        <span
          v-for="atom in formula.atoms"
          :key="atom.symbol"
          :style="{
            width: ((atom.count * atom.ar) / formulaMass) * 100 + '%',
            background: atom.color,
          }"
          ><span v-if="(atom.count * atom.ar) / formulaMass > 0.07">{{ atom.symbol }}</span></span
        >
      </div>
      <div class="result-line" aria-live="polite">
        <span
          >相对分子 / 式量 <strong>{{ formulaMass }}</strong
          >（无单位）</span
        ><span
          >摩尔质量 <strong>{{ formulaMass }} g mol⁻¹</strong></span
        >
      </div>
      <p class="atlas-note">{{ formula.note }} 方程式前的系数不改变单个化学式的相对质量。</p>
    </template>

    <template v-else-if="mode === 'particles'">
      <div class="controls" role="group" aria-label="选择计数对象">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="particleMaterial === 'co2'"
          @click="particleMaterial = 'co2'"
          >CO₂ 分子 → 原子</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="particleMaterial === 'nitrate'"
          @click="particleMaterial = 'nitrate'"
          >Mg(NO₃)₂ → 离子</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="选择物质的量">
        <span class="control-label">取样</span
        ><AppButton
          v-for="n in [0.25, 0.5, 1, 2]"
          :key="n"
          type="secondary"
          size="small"
          :aria-pressed="particleMoles === n"
          @click="particleMoles = n"
          >{{ n }} mol</AppButton
        >
      </div>
      <div class="particle-row" aria-label="一个化学式对应三个待计数粒子的计数示意">
        <strong>{{
          particleMaterial === 'co2' ? '1 个 CO₂ 分子' : '1 个 Mg(NO₃)₂ 化学式单位'
        }}</strong
        ><span class="route-arrow">→</span>
        <span
          v-for="(label, index) in particleMaterial === 'co2'
            ? ['C', 'O', 'O']
            : ['Mg²⁺', 'NO₃⁻', 'NO₃⁻']"
          :key="index"
          class="particle"
          :class="{ 'particle-secondary': index > 0 }"
          >{{ label }}</span
        >
      </div>
      <ol class="calculation-route" aria-live="polite">
        <li>
          <span>化学式对应的 mol</span><strong>{{ particleMoles }} mol</strong>
        </li>
        <li>
          <span>{{ particleMaterial === 'co2' ? '全部原子' : '完全溶解所得离子' }}的 mol</span
          ><strong>{{ particleMoles }} × 3 = {{ particleMoles * 3 }} mol</strong>
        </li>
        <li>
          <span>指定粒子数</span><strong>{{ format(particleMoles * 18) }} × 10²³</strong>
        </li>
      </ol>
      <p class="atlas-note">
        此处按题目常用近似 Nₐ = 6.00 × 10²³ mol⁻¹
        计算。圆圈表示一个化学式的计数关系，不是样品中的全部粒子，也不是空间结构图。{{
          particleMaterial === 'nitrate'
            ? '每个 NO₃⁻ 整体算 1 个离子；不计水的电离及其他反应。'
            : '每个 CO₂ 含 3 个原子，其中 2 个是氧原子。'
        }}
      </p>
    </template>

    <template v-else-if="mode === 'mass'">
      <div class="controls" role="group" aria-label="调整水的样品量">
        <span class="control-label">水的物质的量</span
        ><AppButton
          v-for="n in [0.5, 1, 2, 3]"
          :key="n"
          type="secondary"
          size="small"
          :aria-pressed="waterMoles === n"
          @click="waterMoles = n"
          >{{ n }} mol</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="切换质量单位">
        <span class="control-label">显示单位</span
        ><AppButton
          v-for="unit in massUnits"
          :key="unit.key"
          type="secondary"
          size="small"
          :aria-pressed="massUnit === unit.key"
          @click="massUnit = unit.key"
          >{{ unit.label }}</AppButton
        >
      </div>
      <div class="mass-bridge" aria-live="polite">
        <div class="sample-vessel">
          <span>H₂O</span><strong>{{ massDisplay }} {{ activeMassUnit.label }}</strong
          ><small>同一份样品</small>
        </div>
        <ol class="calculation-route">
          <li>
            <span>先统一成 g</span
            ><strong
              >{{ massDisplay }} × {{ activeMassUnit.grams }} = {{ waterMoles * 18 }} g</strong
            >
          </li>
          <li>
            <span>用 M = 18 g mol⁻¹</span
            ><strong>{{ waterMoles * 18 }} ÷ 18 = {{ waterMoles }} mol</strong>
          </li>
        </ol>
      </div>
      <p class="atlas-note">
        切换单位不改变样品本身。1 kg = 10³ g；1 tonne（吨）= 10⁶
        g。先让质量单位与摩尔质量配套，再代入 n = m / M。
      </p>
    </template>

    <template v-else-if="mode === 'composition'">
      <div class="controls" role="group" aria-label="选择百分组成化学式">
        <AppButton
          v-for="key in compositionChoices"
          :key="key"
          type="secondary"
          size="small"
          :aria-pressed="compositionKey === key"
          @click="selectComposition(key)"
          >{{ formulas[key].label }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="选择要计算的元素">
        <span class="control-label">关注元素</span
        ><AppButton
          v-for="atom in composition.atoms"
          :key="atom.symbol"
          type="secondary"
          size="small"
          :aria-pressed="compositionElement === atom.symbol"
          @click="compositionElement = atom.symbol"
          >{{ atom.symbol }}</AppButton
        >
      </div>
      <div class="comparison-bars">
        <div>
          <span>原子个数占比</span>
          <div class="stack">
            <span
              v-for="atom in composition.atoms"
              :key="atom.symbol"
              :style="{
                width: (atom.count / compositionCount) * 100 + '%',
                background: atom.color,
                opacity: atom.symbol === compositionElement ? 1 : 0.3,
              }"
              >{{ atom.symbol }}</span
            >
          </div>
          <strong>{{ compositionAtom.count }} / {{ compositionCount }}</strong>
        </div>
        <div>
          <span>元素质量占比</span>
          <div class="stack">
            <span
              v-for="atom in composition.atoms"
              :key="atom.symbol"
              :style="{
                width: ((atom.count * atom.ar) / compositionMass) * 100 + '%',
                background: atom.color,
                opacity: atom.symbol === compositionElement ? 1 : 0.3,
              }"
              ><span v-if="(atom.count * atom.ar) / compositionMass > 0.08">{{
                atom.symbol
              }}</span></span
            >
          </div>
          <strong>{{ compositionAtom.count * compositionAtom.ar }} / {{ compositionMass }}</strong>
        </div>
      </div>
      <div class="legend">
        <span v-for="atom in composition.atoms" :key="atom.symbol"
          ><i :style="{ background: atom.color }"></i>{{ atom.symbol }}：{{ atom.count }} ×
          {{ atom.ar }} = {{ atom.count * atom.ar }}</span
        >
      </div>
      <div class="result-line" aria-live="polite">
        {{ compositionElement }} 的质量百分数 = {{ compositionAtom.count }} ×
        {{ compositionAtom.ar }} / {{ compositionMass }} × 100% =
        <strong
          >{{
            format(((compositionAtom.count * compositionAtom.ar) / compositionMass) * 100)
          }}%</strong
        >
      </div>
      <p class="atlas-note">
        两条色带分别比较“个数”和“质量”。较多的原子不一定贡献较大的质量；质量百分数的分子必须包含该元素的下标。
      </p>
    </template>

    <template v-else-if="mode === 'empirical'">
      <div class="controls" role="group" aria-label="选择真题数据">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="empiricalKey === 'iron'"
          @click="selectEmpirical('iron')"
          >2019 NSAA · 铁氧化物</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="empiricalKey === 'fluoro'"
          @click="selectEmpirical('fluoro')"
          >2017 NSAA · 氟碳化合物</AppButton
        >
      </div>
      <div class="controls numbered-steps" role="group" aria-label="逐步展开计算">
        <AppButton
          v-for="(label, index) in ['补全质量', '分别除 Aᵣ', '化成整数比', '判断分子倍数']"
          :key="label"
          type="secondary"
          size="small"
          :aria-pressed="empiricalStep === index"
          @click="empiricalStep = index"
          >{{ index + 1 }} · {{ label }}</AppButton
        >
      </div>
      <p class="model-intro">
        {{
          empiricalKey === 'iron'
            ? '116 g 铁氧化物含 84 g 铁，余下为氧。'
            : '81 g 氟碳化合物含 57 g 氟，余下为碳；其相对分子质量是经验式量的 2 倍。'
        }}
      </p>
      <div class="table-scroll" tabindex="0" aria-label="质量到经验式的逐步计算">
        <table>
          <thead>
            <tr>
              <th>元素</th>
              <th>质量 / g</th>
              <th>n = m / Aᵣ</th>
              <th>最简整数比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="atom in empiricalAtoms" :key="atom.symbol">
              <th>{{ atom.symbol }}</th>
              <td>{{ atom.mass }}</td>
              <td>
                {{
                  empiricalStep >= 1
                    ? atom.mass + ' ÷ ' + atom.ar + ' = ' + format(atom.mass / atom.ar)
                    : '先完成质量账本'
                }}
              </td>
              <td>{{ empiricalStep >= 2 ? atom.ratio : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="result-line" aria-live="polite">
        <template v-if="empiricalStep < 2"
          >质量比需要先除以各自的相对原子质量，才能变成原子数比。</template
        ><template v-else-if="empiricalKey === 'iron'"
          ><strong>经验式 Fe₃O₄</strong
          ><span v-if="empiricalStep === 3">离子氧化物不另设一个“分子式倍数”。</span></template
        ><template v-else
          ><strong>经验式 C₂F₃</strong
          ><span v-if="empiricalStep === 3"
            >经验式量 81 → Mᵣ 162 → 分子式 <strong>C₄F₆</strong></span
          ></template
        >
      </div>
      <p class="atlas-note">
        {{
          empiricalKey === 'iron'
            ? '1.5 : 2 同除以 0.5 得 3 : 4；不要将 1 : 1.333… 直接四舍五入成 1 : 1。'
            : '2 : 3 已经是最简整数比；分子式的所有下标都乘以同一个整数倍。'
        }}
      </p>
    </template>

    <template v-else-if="mode === 'stoichiometry'">
      <p class="equation"><LatexText text="$\mathrm{N_2+3H_2\rightarrow2NH_3}$" /></p>
      <div class="controls" role="group" aria-label="调整氮气的物质的量">
        <span class="control-label">N₂</span
        ><AppButton
          v-for="n in [1, 2, 3]"
          :key="n"
          type="secondary"
          size="small"
          :aria-pressed="nitrogenMoles === n"
          @click="nitrogenMoles = n"
          >{{ n }} mol</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="调整氢气的物质的量">
        <span class="control-label">H₂</span
        ><AppButton
          v-for="n in [2, 3, 6, 9]"
          :key="n"
          type="secondary"
          size="small"
          :aria-pressed="hydrogenMoles === n"
          @click="hydrogenMoles = n"
          >{{ n }} mol</AppButton
        >
      </div>
      <div class="ratio-bars">
        <div>
          <span>N₂：n / 系数 = {{ nitrogenMoles }} / 1</span>
          <div><i :style="{ width: (nitrogenMoles / 3) * 100 + '%' }"></i></div>
          <strong>{{ nitrogenMoles }}</strong>
        </div>
        <div>
          <span>H₂：n / 系数 = {{ hydrogenMoles }} / 3</span>
          <div><i class="blue-fill" :style="{ width: (hydrogenMoles / 9) * 100 + '%' }"></i></div>
          <strong>{{ format(hydrogenMoles / 3) }}</strong>
        </div>
      </div>
      <div class="result-line" aria-live="polite">
        <strong>{{ limitingLabel }}</strong
        ><span
          >理论最多 NH₃：{{ format(reactionExtent * 2) }} mol =
          {{ format(reactionExtent * 34) }} g</span
        >
      </div>
      <div class="inline-stats">
        <span
          >剩余 N₂：<strong>{{ format(nitrogenMoles - reactionExtent) }} mol</strong></span
        ><span
          >剩余 H₂：<strong>{{ format(hydrogenMoles - reactionExtent * 3) }} mol</strong></span
        >
      </div>
      <p class="atlas-note">
        较短色带决定理论最大反应程度。这里假设按所写方程完全反应，用于计算理论上限；真实合成氨还受平衡等条件限制。
      </p>
    </template>

    <template v-else-if="mode === 'equation'">
      <div class="controls" role="group" aria-label="选择恰好消耗的氧气体积">
        <span class="control-label">100 cm³ 烷烃耗 O₂</span
        ><AppButton
          v-for="ratio in [2, 3.5, 5, 6.5]"
          :key="ratio"
          type="secondary"
          size="small"
          :aria-pressed="oxygenRatio === ratio"
          @click="oxygenRatio = ratio"
          >{{ ratio * 100 }} cm³</AppButton
        >
      </div>
      <div class="ratio-bars">
        <div>
          <span>烷烃体积</span>
          <div><i :style="{ width: (100 / 650) * 100 + '%' }"></i></div>
          <strong>100</strong>
        </div>
        <div>
          <span>恰好耗氧体积</span>
          <div><i class="blue-fill" :style="{ width: (oxygenRatio / 6.5) * 100 + '%' }"></i></div>
          <strong>{{ oxygenRatio * 100 }}</strong>
        </div>
      </div>
      <ol class="calculation-route" aria-live="polite">
        <li>
          <span>同温同压：体积比 = mol 比</span><strong>烷烃 : O₂ = 1 : {{ oxygenRatio }}</strong>
        </li>
        <li>
          <span>CₙH₂ₙ₊₂ 完全燃烧</span
          ><strong>(3n + 1) / 2 = {{ oxygenRatio }} → n = {{ alkaneCarbons }}</strong>
        </li>
      </ol>
      <p class="equation equation-result"><LatexText :text="alkaneEquation" /></p>
      <p class="atlas-note">
        先配碳、氢，再配氧。此处把烷烃系数固定为
        1，允许出现分数系数；输入量是“实际消耗”的氧气，不是过量加入的初始体积。650 cm³ 档对应 2022
        NSAA 真题数据，其余为演示参数。
      </p>
    </template>

    <template v-else-if="mode === 'gas'">
      <p class="equation">
        <LatexText text="$\mathrm{4NH_3(g)+5O_2(g)\rightarrow4NO(g)+6H_2O(g)}$" />
      </p>
      <div class="controls" role="group" aria-label="选择初始氧气体积">
        <span class="control-label">NH₃ 固定 50 dm³；O₂</span
        ><AppButton
          v-for="v in [25, 50, 75]"
          :key="v"
          type="secondary"
          size="small"
          :aria-pressed="oxygenVolume === v"
          @click="oxygenVolume = v"
          >{{ v }} dm³</AppButton
        >
      </div>
      <div class="table-scroll" tabindex="0" aria-label="气体反应前后体积账本，单位立方分米">
        <table>
          <thead>
            <tr>
              <th>体积 / dm³</th>
              <th>NH₃</th>
              <th>O₂</th>
              <th>NO</th>
              <th>H₂O(g)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>初始</th>
              <td>50</td>
              <td>{{ oxygenVolume }}</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <th>变化</th>
              <td>−{{ format(gasExtent * 4) }}</td>
              <td>−{{ format(gasExtent * 5) }}</td>
              <td>+{{ format(gasExtent * 4) }}</td>
              <td>+{{ format(gasExtent * 6) }}</td>
            </tr>
            <tr class="total-row">
              <th>最终</th>
              <td>{{ format(50 - gasExtent * 4) }}</td>
              <td>{{ format(oxygenVolume - gasExtent * 5) }}</td>
              <td>{{ format(gasExtent * 4) }}</td>
              <td>{{ format(gasExtent * 6) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="result-line" aria-live="polite">
        <span
          >产物 {{ format(gasExtent * 10) }} + 剩余反应物
          {{ format(50 + oxygenVolume - gasExtent * 9) }}</span
        ><strong>总气体 {{ format(50 + oxygenVolume + gasExtent) }} dm³</strong>
      </div>
      <p class="atlas-note">
        沿用 2021 NSAA 的 850°C、1 atm
        条件，各体积在相同温度和压力下比较，水为蒸气，必须计入。若冷却后水凝结，要重新判断气体组成和体积条件，不能照抄此合计。
      </p>
    </template>

    <template v-else-if="mode === 'solution'">
      <div class="controls" role="group" aria-label="选择溶液计算模型">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="solutionMode === 'concentration'"
          @click="solutionMode = 'concentration'"
          >浓度：先记 mol 账本</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="solutionMode === 'solubility'"
          @click="solutionMode = 'solubility'"
          >溶解度：先看水的质量</AppButton
        >
      </div>
      <template v-if="solutionMode === 'concentration'">
        <div class="controls" role="group" aria-label="选择析出铜的质量">
          <span class="control-label">析出 Cu</span
          ><AppButton
            v-for="mass in [0, 8, 16, 24]"
            :key="mass"
            type="secondary"
            size="small"
            :aria-pressed="copperRemoved === mass"
            @click="copperRemoved = mass"
            >{{ mass }} g</AppButton
          >
        </div>
        <div class="controls" role="group" aria-label="选择最终溶液体积">
          <span class="control-label">最终溶液</span
          ><AppButton
            v-for="v in [500, 750, 1000]"
            :key="v"
            type="secondary"
            size="small"
            :aria-pressed="solutionVolume === v"
            @click="solutionVolume = v"
            >{{ v }} cm³</AppButton
          >
        </div>
        <div class="solution-workbench">
          <div class="ion-beaker" aria-label="溶液中剩余铜离子的示意">
            <div class="ion-water" :style="{ height: (solutionVolume / 1000) * 75 + '%' }">
              <span
                v-for="index in Math.round(copperRemaining / 0.025)"
                :key="index"
                class="ion-dot"
              ></span>
            </div>
            <span class="beaker-volume">{{ solutionVolume }} cm³</span>
          </div>
          <ol class="calculation-route" aria-live="polite">
            <li><span>80 g CuSO₄，M = 160</span><strong>初始 Cu²⁺：0.500 mol</strong></li>
            <li>
              <span>析出量 ÷ 64</span
              ><strong
                >消耗 {{ format(copperRemoved / 64) }} mol → 剩
                {{ format(copperRemaining) }} mol</strong
              >
            </li>
            <li>
              <span>除以最终溶液体积（dm³）</span
              ><strong
                >{{ format(copperRemaining) }} / {{ solutionVolume / 1000 }} =
                {{ format(copperRemaining / (solutionVolume / 1000)) }} mol dm⁻³</strong
              >
            </li>
          </ol>
        </div>
        <p class="atlas-note">
          沿用 2023 NSAA 的石墨电极条件，阳极不补回 Cu²⁺。每个蓝点代表 0.025 mol
          Cu²⁺，省略其他离子；示意容器不用于量取体积。默认 8 g、500 cm³ 为原题，其他档用于比较。
        </p>
      </template>
      <template v-else>
        <div class="controls" role="group" aria-label="选择冷却终温">
          <span class="control-label">从 60°C 降到</span
          ><AppButton
            v-for="t in [20, 40, 60]"
            :key="t"
            type="secondary"
            size="small"
            :aria-pressed="solutionTemperature === t"
            @click="solutionTemperature = t"
            >{{ t }}°C</AppButton
          >
        </div>
        <div class="controls" role="group" aria-label="选择溶剂和溶质质量">
          <span class="control-label">水</span
          ><AppButton
            v-for="m in [100, 200]"
            :key="m"
            type="secondary"
            size="small"
            :aria-pressed="waterMass === m"
            @click="waterMass = m"
            >{{ m }} g</AppButton
          ><span class="control-label">加入溶质</span
          ><AppButton
            v-for="m in [20, 60, 100]"
            :key="m"
            type="secondary"
            size="small"
            :aria-pressed="soluteAdded === m"
            @click="soluteAdded = m"
            >{{ m }} g</AppButton
          >
        </div>
        <div class="solubility-workbench">
          <svg
            viewBox="0 0 350 240"
            role="img"
            aria-label="教学模型的溶解度曲线：20摄氏度30，40摄氏度50，60摄氏度80克每100克水"
          >
            <text x="15" y="17" class="axis-title">溶解度 / g（每 100 g 水）</text>
            <path d="M52 30V190H322" class="chart-axis" />
            <g v-for="s in [0, 20, 40, 60, 80]" :key="s">
              <line x1="52" x2="312" :y1="184 - s * 1.8" :y2="184 - s * 1.8" class="grid-line" />
              <text x="42" :y="188 - s * 1.8" text-anchor="end">{{ s }}</text>
            </g>
            <path d="M82 130L182 94L282 40" class="curve-line" />
            <g v-for="point in solubilityPoints" :key="point.temperature">
              <circle
                :cx="82 + (point.temperature - 20) * 5"
                :cy="184 - point.solubility * 1.8"
                :r="point.temperature === solutionTemperature ? 8 : 5"
                :class="
                  point.temperature === solutionTemperature ? 'selected-point' : 'curve-point'
                "
              />
              <text :x="82 + (point.temperature - 20) * 5" y="211" text-anchor="middle">
                {{ point.temperature }}
              </text>
            </g>
            <text x="315" y="231" text-anchor="end">温度 / °C</text>
          </svg>
          <div class="solubility-ledger" aria-live="polite">
            <p>
              当前溶解度 <strong>{{ currentSolubility }} g / 100 g 水</strong>
            </p>
            <p>
              最多可溶
              <strong
                >{{ currentSolubility }} × {{ waterMass }} / 100 =
                {{ solubilityCapacity }} g</strong
              >
            </p>
            <p>
              实际溶解 <strong>{{ dissolvedMass }} g</strong> ·
              {{ soluteAdded >= solubilityCapacity ? '已饱和' : '未饱和' }}
            </p>
            <p>
              未溶固体合计 <strong>{{ soluteAdded - dissolvedMass }} g</strong>
            </p>
            <p class="crystal-result">
              本次降温新析出 <strong>{{ newCrystals }} g</strong>
            </p>
          </div>
        </div>
        <p class="atlas-note">
          曲线为教学用模型数据，不代表某种实际物质；假设充分达到溶解平衡、水不蒸发、晶体不带结晶水。60°C
          时已经未溶的固体，不属于本次降温“新析出”的质量。
        </p>
      </template>
    </template>

    <template v-else-if="mode === 'titration'">
      <div class="controls" role="group" aria-label="选择滴定路线">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="titrationMode === 'direct'"
          @click="titrationMode = 'direct'"
          >直接滴定 · 二元酸</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="titrationMode === 'back'"
          @click="titrationMode = 'back'"
          >反滴定 · 算已经消耗的酸</AppButton
        >
      </div>
      <template v-if="titrationMode === 'direct'">
        <p class="equation">
          <LatexText text="$\mathrm{H_2C_2O_4+2NaOH\rightarrow Na_2C_2O_4+2H_2O}$" />
        </p>
        <div class="controls" role="group" aria-label="加入二元酸的体积">
          <span class="control-label">2.5 mol dm⁻³ 酸</span
          ><AppButton
            v-for="v in [5, 10, 15]"
            :key="v"
            type="secondary"
            size="small"
            :aria-pressed="acidVolume === v"
            @click="acidVolume = v"
            >{{ v }} cm³</AppButton
          >
        </div>
        <ol class="calculation-route">
          <li><span>(25 / 1000) dm³ × 2 mol dm⁻³</span><strong>NaOH：0.050 mol</strong></li>
          <li>
            <span>加入的二元酸</span
            ><strong>{{ acidVolume }} / 1000 × 2.5 = {{ format(acidVolume * 0.0025) }} mol</strong>
          </li>
          <li>
            <span>能中和的 NaOH</span
            ><strong
              >2 × {{ format(acidVolume * 0.0025) }} = {{ format(acidVolume * 0.005) }} mol</strong
            >
          </li>
        </ol>
        <div class="titration-track">
          <span>碱过量</span>
          <div><i :style="{ left: ((acidVolume - 5) / 10) * 100 + '%' }"></i><b></b></div>
          <span>酸过量</span>
        </div>
        <div class="result-line" aria-live="polite">
          <strong>{{
            acidVolume === 10
              ? '10 cm³：恰好达到计量点'
              : acidVolume < 10
                ? '酸不足，还有 NaOH 未中和'
                : '已越过计量点，酸过量'
          }}</strong>
        </div>
        <p class="atlas-note">
          沿用 2021 NSAA 的数据。轨道只表示酸碱的化学计量关系，不表示 pH
          的线性变化，也不模拟指示剂颜色。
        </p>
      </template>
      <template v-else>
        <div class="controls" role="group" aria-label="选择反滴定所需氢氧化钠体积">
          <span class="control-label">滴定剩余 HCl 所需 0.2 mol dm⁻³ NaOH</span
          ><AppButton
            v-for="v in [2.5, 5, 10]"
            :key="v"
            type="secondary"
            size="small"
            :aria-pressed="backVolume === v"
            @click="backVolume = v"
            >{{ v }} cm³</AppButton
          >
        </div>
        <div class="stack back-stack" aria-label="初始盐酸分为已经反应和剩余两部分">
          <span :style="{ width: (acidConsumed / 0.005) * 100 + '%' }">与样品反应</span
          ><span :style="{ width: (acidResidual / 0.005) * 100 + '%' }">剩余</span>
        </div>
        <ol class="calculation-route" aria-live="polite">
          <li><span>初加：(50 / 1000) dm³ × 0.1 mol dm⁻³</span><strong>HCl：0.005 mol</strong></li>
          <li>
            <span>NaOH : 剩余 HCl = 1 : 1</span
            ><strong
              >剩余 {{ format(acidResidual) }} → 已反应 {{ format(acidConsumed) }} mol</strong
            >
          </li>
          <li>
            <span>MgCO₃ : 已反应 HCl = 1 : 2</span
            ><strong
              >MgCO₃：{{ format(acidConsumed / 2) }} mol =
              {{ format((acidConsumed / 2) * 84000) }} mg</strong
            >
          </li>
        </ol>
        <p class="atlas-note">
          默认 5 cm³ 为 2022 NSAA
          真题数据，其余为演示参数。反滴定先测出“剩余”，用初加减剩余，再回到样品的反应比例；两次反应的系数不能混用。
        </p>
      </template>
    </template>

    <template v-else-if="mode === 'yield'">
      <p class="equation"><LatexText text="$\mathrm{CaCO_3\rightarrow CaO+CO_2}$" /></p>
      <div class="controls" role="group" aria-label="选择石灰石纯度">
        <span class="control-label">10 g 石灰石，CaCO₃ 纯度</span
        ><AppButton
          v-for="p in [60, 80, 100]"
          :key="p"
          type="secondary"
          size="small"
          :aria-pressed="purity === p"
          @click="purity = p"
          >{{ p }}%</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="选择称得的氧化钙质量">
        <span class="control-label">称得 CaO</span
        ><AppButton
          v-for="m in [2.24, 3.36, 4.48]"
          :key="m"
          type="secondary"
          size="small"
          :aria-pressed="actualYield === m"
          @click="actualYield = m"
          >{{ m }} g</AppButton
        >
      </div>
      <ol class="calculation-route">
        <li>
          <span>先扣除原料杂质</span
          ><strong>CaCO₃：10 × {{ purity }}% = {{ purity / 10 }} g</strong>
        </li>
        <li>
          <span>质量 → mol → 理论产品质量</span
          ><strong>{{ purity / 10 }} / 100 × 56 = {{ format(theoreticalYield) }} g CaO</strong>
        </li>
      </ol>
      <div class="ratio-bars">
        <div>
          <span>理论产量</span>
          <div>
            <i
              :style="{
                width: (theoreticalYield / Math.max(theoreticalYield, actualYield)) * 100 + '%',
              }"
            ></i>
          </div>
          <strong>{{ format(theoreticalYield) }} g</strong>
        </div>
        <div>
          <span>称得产量</span>
          <div>
            <i
              class="blue-fill"
              :style="{
                width: (actualYield / Math.max(theoreticalYield, actualYield)) * 100 + '%',
              }"
            ></i>
          </div>
          <strong>{{ actualYield }} g</strong>
        </div>
      </div>
      <div
        class="result-line"
        :class="{ 'result-warning': percentageYield > 100.001 }"
        aria-live="polite"
      >
        <strong
          >{{ actualYield }} / {{ format(theoreticalYield) }} × 100% =
          {{ format(percentageYield) }}%</strong
        ><span>{{
          percentageYield > 100.001
            ? '超过 100% 的表观结果：应检查干燥、杂质、称量或理论量。'
            : '分子、分母都指同一种产品 CaO。'
        }}</span>
      </div>
      <p class="atlas-note">
        默认 80% 纯度、3.36 g 产品来自已收录题库例题，其余为比较参数。纯度与产率是两种比例；表观超过
        100% 不表示反应突破了理论上限。
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
type Mode =
  | 'formula'
  | 'particles'
  | 'mass'
  | 'composition'
  | 'empirical'
  | 'stoichiometry'
  | 'equation'
  | 'gas'
  | 'solution'
  | 'titration'
  | 'yield'
const modes: Record<string, Mode> = {
  '140401': 'formula',
  '140402': 'particles',
  '140403': 'mass',
  '140404': 'composition',
  '140405': 'empirical',
  '140406': 'stoichiometry',
  '140407': 'equation',
  '140408': 'gas',
  '140409': 'solution',
  '140410': 'titration',
  '140411': 'yield',
}
const views: Record<Mode, { title: string; subtitle: string }> = {
  formula: {
    title: '把化学式拆开，再把质量加回来',
    subtitle: '括号外的下标和结晶水都要展开；相对质量与摩尔质量只有数值对应，单位不同。',
  },
  particles: {
    title: '先写清楚：数的是哪一种粒子',
    subtitle: '从化学式单位到原子或离子，先乘粒子倍数，再乘阿伏伽德罗常数。',
  },
  mass: {
    title: '质量单位变了，样品并没有变',
    subtitle: '在质量与 mol 之间搭桥，先统一单位，再使用摩尔质量。',
  },
  composition: {
    title: '看质量占比，不看原子个数占比',
    subtitle: '点击一个元素，对比它的数量份额与质量份额。',
  },
  empirical: {
    title: '质量账本 → mol 比 → 最简式',
    subtitle: '用已收录真题的数据逐步展开；最简整数比和分子式倍数分开判断。',
  },
  stoichiometry: {
    title: '谁先用完，谁决定理论产量',
    subtitle: '比较 n / 方程系数，不直接比较克数，也不只比较 mol 数。',
  },
  equation: {
    title: '从用掉的气体反推方程式',
    subtitle: '同温同压的体积比给出 mol 比；固定一个系数后，再用原子守恒补全其余系数。',
  },
  gas: {
    title: '最终气体 = 生成的 + 没用完的',
    subtitle: '把每种物质的初始、变化和最终体积写在同一张账本里。',
  },
  solution: {
    title: '浓度和溶解度，分母不一样',
    subtitle: '浓度用最终溶液体积；溶解度通常用每 100 g 水，不能混为同一个比例。',
  },
  titration: {
    title: '从滴定体积走回反应比例',
    subtitle: '直接滴定看计量点；反滴定先求剩余，再用初加减剩余。',
  },
  yield: {
    title: '先算理论上限，再比较实际收获',
    subtitle: '原料纯度先影响可反应的量，产品产率再与理论产量比较。',
  },
}
// 每个最小知识点打开独立的计算模型，整章入口使用质量换算示意。
const mode = computed(() => modes[props.topic] ?? 'mass')
// 标题与操作提示随当前计算模型同步切换。
const view = computed(() => views[mode.value])

type FormulaKey = 'water' | 'hydroxide' | 'hydrate' | 'carbonate' | 'iron'
type Atom = { symbol: string; count: number; ar: number; color: string }
const formulas: Record<FormulaKey, { label: string; atoms: Atom[]; note: string }> = {
  water: {
    label: 'H₂O',
    atoms: [
      { symbol: 'H', count: 2, ar: 1, color: '#527edc' },
      { symbol: 'O', count: 1, ar: 16, color: '#138b85' },
    ],
    note: 'H₂O 为分子，用相对分子质量。',
  },
  hydroxide: {
    label: 'Ca(OH)₂',
    atoms: [
      { symbol: 'Ca', count: 1, ar: 40, color: '#8b6bc1' },
      { symbol: 'O', count: 2, ar: 16, color: '#138b85' },
      { symbol: 'H', count: 2, ar: 1, color: '#527edc' },
    ],
    note: '括号外的 2 同时乘 O 和 H；离子化合物使用相对式量。',
  },
  hydrate: {
    label: 'CuSO₄·5H₂O',
    atoms: [
      { symbol: 'Cu', count: 1, ar: 64, color: '#527edc' },
      { symbol: 'S', count: 1, ar: 32, color: '#aa7722' },
      { symbol: 'O', count: 9, ar: 16, color: '#138b85' },
      { symbol: 'H', count: 10, ar: 1, color: '#8b6bc1' },
    ],
    note: '5H₂O 贡献 10 个 H 与 5 个 O；再加 CuSO₄ 中的 4 个 O，共 9 个 O。这里计算相对式量。',
  },
  carbonate: {
    label: 'CaCO₃',
    atoms: [
      { symbol: 'Ca', count: 1, ar: 40, color: '#8b6bc1' },
      { symbol: 'C', count: 1, ar: 12, color: '#527edc' },
      { symbol: 'O', count: 3, ar: 16, color: '#138b85' },
    ],
    note: 'CaCO₃ 为离子化合物，使用相对式量。',
  },
  iron: {
    label: 'Fe₂O₃',
    atoms: [
      { symbol: 'Fe', count: 2, ar: 56, color: '#8b6bc1' },
      { symbol: 'O', count: 3, ar: 16, color: '#138b85' },
    ],
    note: 'Fe₂O₃ 为离子化合物，使用相对式量。',
  },
}
const formulaChoices: FormulaKey[] = ['water', 'hydroxide', 'hydrate']
const compositionChoices: FormulaKey[] = ['carbonate', 'water', 'iron']
const formulaKey = ref<FormulaKey>('hydrate')
// 化学式切换只改变计数数据，不对真实题库内容作写入。
const formula = computed(() => formulas[formulaKey.value])
// 相对式量按每种元素的个数乘相对原子质量求和。
const formulaMass = computed(() =>
  formula.value.atoms.reduce((sum, atom) => sum + atom.count * atom.ar, 0),
)
// 色带提供文字等价描述，让质量贡献不依赖颜色识别。
const formulaMassDescription = computed(() =>
  formula.value.atoms.map((atom) => atom.symbol + ' 贡献 ' + atom.count * atom.ar).join('；'),
)
const particleMaterial = ref<'co2' | 'nitrate'>('co2')
const particleMoles = ref(1)
const waterMoles = ref(1)
const massUnits = [
  { key: 'mg', label: 'mg', grams: 0.001 },
  { key: 'g', label: 'g', grams: 1 },
  { key: 'kg', label: 'kg', grams: 1000 },
  { key: 'tonne', label: 'tonne', grams: 1000000 },
]
const massUnit = ref('mg')
// 同一样品转换显示单位时，保留 g 与所选单位之间的比例。
const activeMassUnit = computed(
  () => massUnits.find((unit) => unit.key === massUnit.value) ?? massUnits[0]!,
)
// 小于一吨的样品仍保留有效数字，避免固定小数位将其显示成零。
const massDisplay = computed(() =>
  Number(((waterMoles.value * 18) / activeMassUnit.value.grams).toPrecision(8)).toString(),
)
const compositionKey = ref<FormulaKey>('carbonate')
const compositionElement = ref('O')
// 百分组成复用同一化学式计数，保持数量比和质量比的比较可追溯。
const composition = computed(() => formulas[compositionKey.value])
// 质量百分数的分母是完整化学式的质量总和。
const compositionMass = computed(() =>
  composition.value.atoms.reduce((sum, atom) => sum + atom.count * atom.ar, 0),
)
// 数量色带只表示化学式内原子的相对个数。
const compositionCount = computed(() =>
  composition.value.atoms.reduce((sum, atom) => sum + atom.count, 0),
)
// 当前选中的元素决定两种占比的高亮和文字结果。
const compositionAtom = computed(
  () =>
    composition.value.atoms.find((atom) => atom.symbol === compositionElement.value) ??
    composition.value.atoms[0]!,
)
// 切换化合物时继续优先比较共有的氧元素，避免保留无效选择。
function selectComposition(key: FormulaKey) {
  compositionKey.value = key
  compositionElement.value = 'O'
}
const empiricalKey = ref<'iron' | 'fluoro'>('iron')
const empiricalStep = ref(0)
// 两套数据来自已收录年度真题，展示经验式和分子式的不同终点。
const empiricalAtoms = computed(() =>
  empiricalKey.value === 'iron'
    ? [
        { symbol: 'Fe', mass: 84, ar: 56, ratio: 3 },
        { symbol: 'O', mass: 32, ar: 16, ratio: 4 },
      ]
    : [
        { symbol: 'C', mass: 24, ar: 12, ratio: 2 },
        { symbol: 'F', mass: 57, ar: 19, ratio: 3 },
      ],
)
// 更换真题数据后从质量账本开始，避免直接跳到另一题的结论。
function selectEmpirical(key: 'iron' | 'fluoro') {
  empiricalKey.value = key
  empiricalStep.value = 0
}
const nitrogenMoles = ref(1)
const hydrogenMoles = ref(2)
// 理论最大反应程度由最小的 n / 化学计量系数决定。
const reactionExtent = computed(() => Math.min(nitrogenMoles.value, hydrogenMoles.value / 3))
// 恰好按比例投料时，明确两种反应物同时用完。
const limitingLabel = computed(() =>
  hydrogenMoles.value === nitrogenMoles.value * 3
    ? '恰好按 1 : 3 投料'
    : hydrogenMoles.value < nitrogenMoles.value * 3
      ? 'H₂ 是限量反应物'
      : 'N₂ 是限量反应物',
)
const oxygenRatio = ref(6.5)
// 演示档位均对应整数碳数的烷烃，依据完全燃烧的耗氧关系反求。
const alkaneCarbons = computed(() => Math.round((2 * oxygenRatio.value - 1) / 3))
// 保留烷烃系数为一，展示原题要求的归一化方程而不擅自倍乘。
const alkaneEquation = computed(
  () =>
    '$\\mathrm{C_{' +
    alkaneCarbons.value +
    '}H_{' +
    (2 * alkaneCarbons.value + 2) +
    '}+' +
    oxygenRatio.value +
    'O_2\\rightarrow ' +
    alkaneCarbons.value +
    'CO_2+' +
    (alkaneCarbons.value + 1) +
    'H_2O}$',
)
const oxygenVolume = ref(50)
// 同温同压下可用体积除方程系数判断本例的限量物。
const gasExtent = computed(() => Math.min(50 / 4, oxygenVolume.value / 5))
const solutionMode = ref<'concentration' | 'solubility'>('concentration')
const copperRemoved = ref(8)
const solutionVolume = ref(500)
// 惰性阳极不补回铜离子，剩余 mol 等于初始减去析出的铜。
const copperRemaining = computed(() => 0.5 - copperRemoved.value / 64)
const solubilityPoints = [
  { temperature: 20, solubility: 30 },
  { temperature: 40, solubility: 50 },
  { temperature: 60, solubility: 80 },
]
const solutionTemperature = ref(20)
const waterMass = ref(100)
const soluteAdded = ref(60)
// 只使用图中离散教学模型数据，不暗示未经来源核验的真实物质曲线。
const currentSolubility = computed(
  () =>
    solubilityPoints.find((point) => point.temperature === solutionTemperature.value)?.solubility ??
    30,
)
// 溶解度按水的质量换算，分母不是溶液总质量。
const solubilityCapacity = computed(() => (currentSolubility.value * waterMass.value) / 100)
// 实际溶解量同时受加入量和当前温度下容量的约束。
const dissolvedMass = computed(() => Math.min(soluteAdded.value, solubilityCapacity.value))
// 新析晶只计从高温已溶部分移出的质量，排除起始就未溶的固体。
const newCrystals = computed(
  () => Math.min(soluteAdded.value, 0.8 * waterMass.value) - dissolvedMass.value,
)
const titrationMode = ref<'direct' | 'back'>('direct')
const acidVolume = ref(10)
const backVolume = ref(5)
// 反滴定的 NaOH 与剩余 HCl 是一比一，而非与样品一比一。
const acidResidual = computed(() => (backVolume.value / 1000) * 0.2)
// 初加减剩余后，才能进入碳酸镁与酸的另一套计量关系。
const acidConsumed = computed(() => 0.005 - acidResidual.value)
const purity = ref(80)
const actualYield = ref(3.36)
// 先按纯度扣除惰性杂质，再以 CaCO₃ 与 CaO 的一比一关系求理论质量。
const theoreticalYield = computed(() => ((10 * purity.value) / 100 / 100) * 56)
// 保留超过百分之百的表观值供查错，不通过截断掩盖称量或样品问题。
const percentageYield = computed(() => (actualYield.value / theoreticalYield.value) * 100)

// 计算展示保留足够小数位，同时去除浮点尾差与无意义的尾零。
function format(value: number) {
  return Number((Math.abs(value) < 1e-10 ? 0 : value).toFixed(4)).toString()
}
// 学习范围切换后恢复每个模型的说明默认值，演示操作不保存为学习记录。
function resetLessonDiagram() {
  formulaKey.value = 'hydrate'
  particleMaterial.value = 'co2'
  particleMoles.value = 1
  waterMoles.value = 1
  massUnit.value = 'mg'
  compositionKey.value = 'carbonate'
  compositionElement.value = 'O'
  empiricalKey.value = 'iron'
  empiricalStep.value = 0
  nitrogenMoles.value = 1
  hydrogenMoles.value = 2
  oxygenRatio.value = 6.5
  oxygenVolume.value = 50
  solutionMode.value = 'concentration'
  copperRemoved.value = 8
  solutionVolume.value = 500
  solutionTemperature.value = 20
  waterMass.value = 100
  soluteAdded.value = 60
  titrationMode.value = 'direct'
  acidVolume.value = 10
  backVolume.value = 5
  purity.value = 80
  actualYield.value = 3.36
}
watch(() => props.topic, resetLessonDiagram)
</script>

<style scoped lang="scss">
.quantity-atlas {
  min-width: 0;
  margin: 0;
  padding: 24px 26px;
  border: 1px solid #bae3df;
  border-radius: 16px;
  color: #203b49;
  background: linear-gradient(125deg, #f0faf8, #fff 72%);
  line-height: 1.65;
  figcaption {
    margin-bottom: 19px;
  }
  h5 {
    margin: 9px 0 6px;
    color: #123d42;
    font-size: 21px;
    line-height: 1.45;
  }
  figcaption p {
    margin: 0;
    color: #557078;
    font-size: 14px;
  }
}
.atlas-eyebrow {
  color: #087d80;
  font: 600 12px/1.5 var(--font-family-base, sans-serif);
  letter-spacing: 1.3px;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
}
.controls :deep(.app-button) {
  margin-left: 0;
  --el-button-bg-color: #fff;
  --el-button-text-color: #087879;
  --el-button-border-color: #b9dedc;
  --el-button-hover-bg-color: #edf9f7;
  --el-button-hover-text-color: #07696a;
  --el-button-hover-border-color: #79bdb9;
  --el-button-active-bg-color: #e0f4f0;
  --el-button-active-text-color: #07696a;
  --el-button-active-border-color: #56aaa6;
  background: #fff;
  color: #087879;
  border-color: #b9dedc;
  white-space: normal;
  height: auto;
  min-height: 32px;
  line-height: 1.45;
  &:hover {
    background: #edf9f7;
    color: #07696a;
    border-color: #79bdb9;
  }
  &[aria-pressed='true'] {
    background: #ddf2ef;
    border-color: #43a49c;
    color: #075f62;
    font-weight: 600;
  }
  &:focus-visible {
    outline: 3px solid #7ca9ef;
    outline-offset: 3px;
  }
}
.control-label {
  color: #5b7379;
  font-size: 13px;
  margin-right: 3px;
}
.table-scroll {
  max-width: 100%;
  overflow-x: auto;
  margin: 18px 0;
  border: 1px solid #d7e6e5;
  border-radius: 10px;
  background: #fff;
  &:focus-visible {
    outline: 2px solid #7ca9ef;
    outline-offset: 2px;
  }
}
table {
  width: 100%;
  min-width: 420px;
  border-collapse: collapse;
  font-size: 14px;
  text-align: left;
  th,
  td {
    padding: 11px 13px;
    border-bottom: 1px solid #e4eeed;
  }
  thead {
    background: #edf7f5;
    color: #46656a;
  }
  th {
    font-weight: 600;
  }
  tbody tr:last-child > * {
    border-bottom: 0;
  }
  .total-row {
    background: #eff8f6;
    font-weight: 600;
    color: #087779;
  }
}
.stack {
  display: flex;
  min-height: 34px;
  overflow: hidden;
  border-radius: 7px;
  background: #e8f1f0;
  > span {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    transition:
      width 0.2s,
      opacity 0.2s;
  }
}
.result-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 24px;
  padding: 15px 0 5px;
  color: #166967;
  font-size: 15px;
  strong {
    font-size: 18px;
    font-variant-numeric: tabular-nums;
  }
}
.atlas-note {
  color: #62777e;
  font-size: 12px;
  line-height: 1.8;
  margin: 15px 0 0;
  border-top: 1px solid #dcecea;
  padding-top: 12px;
}
.particle-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 22px 8px;
  strong {
    font-size: 14px;
  }
}
.particle {
  display: inline-flex;
  width: 60px;
  height: 60px;
  align-items: center;
  justify-content: center;
  border: 2px solid #559898;
  border-radius: 50%;
  background: #d7efeb;
  color: #195c5d;
  font-weight: 600;
}
.particle-secondary {
  border-color: #819ed7;
  background: #e7efff;
  color: #375d96;
}
.route-arrow {
  font-size: 24px;
  color: #718d92;
}
.calculation-route {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  list-style: none;
  margin: 18px 0;
  padding: 0;
  counter-reset: route;
  li {
    flex: 1 1 160px;
    min-width: 0;
    border-left: 3px solid #8ccac3;
    padding-left: 13px;
    counter-increment: route;
  }
  li::before {
    content: '0' counter(route);
    color: #83aaa9;
    font-size: 12px;
    display: block;
  }
  span,
  strong {
    display: block;
  }
  span {
    color: #5a7379;
    font-size: 12px;
  }
  strong {
    margin-top: 4px;
    font-size: 16px;
    color: #165e62;
    line-height: 1.65;
    overflow-wrap: anywhere;
  }
}
.mass-bridge {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  align-items: center;
  gap: 25px;
  margin-top: 22px;
}
.sample-vessel {
  display: flex;
  flex-direction: column;
  justify-content: end;
  text-align: center;
  min-height: 130px;
  padding: 18px 10px;
  border: 2px solid #93bbb9;
  border-top: 0;
  border-radius: 0 0 18px 18px;
  background: linear-gradient(to top, #e2f1fb 70%, transparent 70%);
  strong {
    color: #17636b;
    font-size: 18px;
    overflow-wrap: anywhere;
  }
  small {
    font-size: 11px;
    color: #6b838a;
  }
}
.comparison-bars {
  display: grid;
  gap: 20px;
  margin: 23px 0;
  > div {
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr) 76px;
    gap: 12px;
    align-items: center;
    font-size: 13px;
  }
  strong {
    color: #2f5a64;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 9px 20px;
  font-size: 12px;
  color: #617178;
  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }
  i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
}
.model-intro {
  font-size: 14px;
  margin: 20px 0 10px;
}
.equation {
  margin: 20px 0;
  color: #135967;
  text-align: center;
  font-size: 18px;
  overflow-x: auto;
}
.equation-result {
  background: #edf7f5;
  padding: 14px;
  border-radius: 9px;
}
.ratio-bars {
  display: grid;
  gap: 19px;
  margin: 24px 0;
  > div {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr) 76px;
    gap: 14px;
    align-items: center;
    font-size: 13px;
    > div {
      height: 18px;
      background: #e5efee;
      border-radius: 5px;
      overflow: hidden;
    }
  }
  i {
    height: 100%;
    display: block;
    background: #329b92;
    border-radius: 5px;
    transition: width 0.2s;
  }
  i.blue-fill {
    background: #668bd0;
  }
  strong {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}
.inline-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 25px;
  margin-top: 10px;
  font-size: 13px;
  color: #5f737a;
}
.solution-workbench {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  align-items: center;
  gap: 30px;
  margin-top: 20px;
}
.ion-beaker {
  position: relative;
  height: 175px;
  border: 2px solid #9bbabf;
  border-top: 0;
  border-radius: 0 0 17px 17px;
  overflow: hidden;
}
.ion-water {
  position: absolute;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  gap: 8px;
  padding: 12px;
  box-sizing: border-box;
  bottom: 0;
  width: 100%;
  background: #e4f1fd;
  border-top: 2px solid #9ec7e8;
  transition: height 0.2s;
}
.ion-dot {
  display: block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #598dc8;
}
.beaker-volume {
  position: absolute;
  top: 7px;
  width: 100%;
  text-align: center;
  font-size: 13px;
  color: #5b7a84;
}
.solubility-workbench {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(240px, 1fr);
  align-items: center;
  gap: 24px;
  margin-top: 24px;
  svg {
    width: 100%;
    max-width: 420px;
    font: 12px sans-serif;
    fill: #5e767a;
  }
  .axis-title {
    font-size: 11px;
  }
}
.chart-axis {
  fill: none;
  stroke: #829ba0;
  stroke-width: 1.5;
}
.grid-line {
  stroke: #dbe7e6;
}
.curve-line {
  fill: none;
  stroke: #329b92;
  stroke-width: 3;
}
.curve-point {
  fill: #329b92;
}
.selected-point {
  fill: #4269b5;
  stroke: #e4edff;
  stroke-width: 5;
}
.solubility-ledger {
  font-size: 13px;
  p {
    margin: 8px 0;
  }
  strong {
    color: #176d6a;
  }
  .crystal-result {
    border-top: 1px solid #cee3df;
    padding-top: 12px;
    font-size: 15px;
  }
}
.titration-track {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 12px;
  color: #68818a;
  font-size: 12px;
  > div {
    position: relative;
    flex: 1;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, #e0eafb, #a3d3c9, #e6e7f8);
  }
  i {
    position: absolute;
    top: -5px;
    width: 16px;
    height: 16px;
    margin-left: -8px;
    border-radius: 50%;
    background: #267f7a;
    border: 2px solid white;
    box-shadow: 0 0 0 1px #267f7a;
  }
  b {
    position: absolute;
    height: 22px;
    border-left: 1px dashed #7a9693;
    left: 50%;
    top: -7px;
  }
}
.back-stack {
  margin: 24px 0;
  > span:first-child {
    background: #359b91;
  }
  > span:last-child {
    background: #6d8bc5;
  }
}
.result-warning {
  color: #95581c;
}
@media (max-width: 780px) {
  .quantity-atlas {
    padding: 20px 18px;
  }
  .ratio-bars > div {
    grid-template-columns: 150px minmax(0, 1fr) 60px;
    gap: 9px;
  }
  .solution-workbench,
  .mass-bridge {
    grid-template-columns: 130px minmax(0, 1fr);
    gap: 20px;
  }
  .solubility-workbench {
    grid-template-columns: 1fr;
    gap: 8px;
    svg {
      margin: auto;
    }
  }
  .solution-workbench .calculation-route,
  .mass-bridge .calculation-route {
    flex-direction: column;
    li {
      flex: auto;
    }
  }
}
@media (max-width: 460px) {
  .quantity-atlas {
    padding: 18px 13px;
    h5 {
      font-size: 19px;
    }
  }
  .controls {
    gap: 7px;
  }
  .control-label {
    flex-basis: 100%;
  }
  .calculation-route {
    flex-direction: column;
    li {
      flex: auto;
    }
  }
  .comparison-bars > div {
    grid-template-columns: 1fr 65px;
    > span {
      grid-column: 1 / -1;
    }
  }
  .ratio-bars > div {
    grid-template-columns: minmax(0, 1fr) 65px;
    > span {
      grid-column: 1 / -1;
    }
  }
  .solution-workbench,
  .mass-bridge {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .ion-beaker,
  .sample-vessel {
    width: 150px;
    margin: 10px auto;
  }
  .particle-row {
    gap: 9px;
    justify-content: flex-start;
    strong {
      flex-basis: 100%;
    }
  }
  .particle {
    width: 51px;
    height: 51px;
    font-size: 13px;
  }
  .titration-track {
    gap: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .stack > span,
  .ratio-bars i,
  .ion-water {
    transition: none;
  }
}
</style>
