<!-- ESAT 第六章图解：在学习平台按知识点切换粒子分类、成键模型与结构性质，所有图形均为教学示意。 -->
<template>
  <figure class="bond-atlas" :aria-label="heading.title">
    <figcaption>
      <span class="eyebrow">CHEMISTRY ATLAS · 微观结构</span>
      <h5>{{ heading.title }}</h5>
      <p>{{ heading.subtitle }}</p>
    </figcaption>

    <template v-if="mode === 'classification'">
      <div class="controls" role="group" aria-label="选择样品组成">
        <AppButton
          v-for="item in samples"
          :key="item.key"
          type="secondary"
          size="small"
          :aria-pressed="sampleKey === item.key"
          @click="sampleKey = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <svg viewBox="0 0 640 230" role="img" :aria-label="sample.description">
        <rect x="30" y="18" width="580" height="185" rx="15" class="sample-box" />
        <g
          v-for="(cluster, i) in sampleClusters"
          :key="i"
          :transform="
            'translate(' + (110 + (i % 4) * 140) + ',' + (72 + Math.floor(i / 4) * 78) + ')'
          "
        >
          <line
            v-for="(edge, j) in cluster.edges"
            :key="'b' + j"
            :x1="cluster.atoms[edge[0]]!.x"
            :y1="cluster.atoms[edge[0]]!.y"
            :x2="cluster.atoms[edge[1]]!.x"
            :y2="cluster.atoms[edge[1]]!.y"
            class="bond-line"
          />
          <g v-for="(atom, j) in cluster.atoms" :key="j">
            <circle
              :cx="atom.x"
              :cy="atom.y"
              :r="atom.symbol === 'H' ? 10 : 17"
              :class="
                atom.symbol === 'H'
                  ? 'atom-light'
                  : atom.symbol === 'Ar'
                    ? 'atom-blue'
                    : 'atom-teal'
              "
            />
            <text :x="atom.x" :y="atom.y + 5" text-anchor="middle" class="atom-label">
              {{ atom.symbol }}
            </text>
          </g>
        </g>
      </svg>
      <div class="result" aria-live="polite">
        <strong>{{ sample.category }}</strong
        ><span>{{ sample.description }}</span>
      </div>
      <p class="note">
        连线只表示本图的连接关系，不表示真实键长、键级或三维形状。图中仅演示原子与分子样品；纯 NaCl
        虽含两种离子，仍是一种化合物。
      </p>
    </template>

    <template v-else-if="mode === 'stability'">
      <div class="controls" role="group" aria-label="选择成键路径">
        <AppButton
          v-for="item in bondingPaths"
          :key="item.key"
          type="secondary"
          size="small"
          :aria-pressed="pathKey === item.key"
          @click="pathKey = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="electron-route" aria-live="polite">
        <div>
          <small>起点</small><strong>{{ path.before }}</strong>
        </div>
        <span class="arrow">→</span>
        <div>
          <small>{{ path.action }}</small
          ><strong>{{ path.after }}</strong>
        </div>
      </div>
      <svg
        v-if="pathKey === 'ionic'"
        viewBox="0 0 640 210"
        role="img"
        aria-label="钠的一个外层电子转移给氯，形成Na正离子与Cl负离子"
      >
        <circle cx="150" cy="100" r="48" class="shell" />
        <text x="150" y="106" text-anchor="middle" class="symbol">Na</text>
        <circle cx="198" cy="100" r="5" class="electron-dot" />
        <path d="M220 95H367M357 88L367 95L357 102" class="arrow-line" />
        <text x="292" y="72" text-anchor="middle">转移 1 e⁻</text>
        <circle cx="450" cy="100" r="48" class="shell" />
        <text x="450" y="106" text-anchor="middle" class="symbol">Cl</text>
        <circle
          v-for="point in chlorineElectrons"
          :key="point.angle"
          :cx="point.x"
          :cy="point.y"
          r="4"
          class="electron-dot"
        />
        <text x="450" y="161" text-anchor="middle">7 个外层电子 → 得到 1 个</text>
        <text x="150" y="161" text-anchor="middle">2,8,1 → 2,8</text>
        <text x="320" y="197" text-anchor="middle" class="highlight">
          Na⁺ 与 Cl⁻ 的静电吸引形成离子键
        </text>
      </svg>
      <div v-else-if="pathKey === 'shared'" class="shared-hydrogen">
        <span>H</span><span class="shared-pair"><i></i><b>×</b></span
        ><span>H</span>
        <p>
          一个共享电子对：每个 H 周围可计到 2 个电子<br />整个 H₂ 分子一共只有 2
          个电子，没有凭空增加。
        </p>
      </div>
      <div v-else class="metal-summary">
        <span v-for="n in 6" :key="n" class="metal-core">Na⁺</span>
        <p>正离子实之间的外层电子在整体结构中离域；不是形成许多个独立 Na—Na 小分子。</p>
      </div>
      <div class="result">
        <strong>{{ path.bond }}</strong
        ><span>{{ path.explanation }}</span>
      </div>
      <p class="note">
        电子层、点叉与正号只用于计数和模型解释，不表示电子沿固定圆轨道运动。He 稳定外层为 2；“外层
        8”是许多主族例子的规律，不适用于一切粒子。
      </p>
    </template>

    <template v-else-if="mode === 'ionic'">
      <div class="controls" role="group" aria-label="选择氯化钠物态">
        <AppButton
          v-for="item in ionicStates"
          :key="item.key"
          type="secondary"
          size="small"
          :aria-pressed="ionicState === item.key"
          @click="ionicState = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <svg viewBox="0 0 640 260" role="img" :aria-label="ionicExplanation">
        <rect
          x="52"
          y="22"
          width="536"
          height="190"
          rx="12"
          :class="ionicState === 'aqueous' ? 'water-box' : 'sample-box'"
        />
        <g v-for="(ion, i) in saltIons" :key="i">
          <circle
            :cx="ion.x"
            :cy="ion.y"
            :r="ion.positive ? 18 : 22"
            :class="ion.positive ? 'atom-blue' : 'atom-teal'"
          />
          <text :x="ion.x" :y="ion.y + 5" text-anchor="middle" class="atom-label">
            {{ ion.positive ? 'Na⁺' : 'Cl⁻' }}
          </text>
          <path
            v-if="ionicState !== 'solid'"
            :d="
              'M' +
              (ion.x + (ion.positive ? 24 : -24)) +
              ' ' +
              ion.y +
              (ion.positive ? 'h22m-6 -4l6 4l-6 4' : 'h-22m6 -4l-6 4l6 4')
            "
            class="motion-line"
          />
        </g>
        <text x="320" y="244" text-anchor="middle" class="highlight">
          {{
            ionicState === 'solid'
              ? '有电荷，但离子不能穿过晶格迁移'
              : '外加电场下：Na⁺ 向负极，Cl⁻ 向正极'
          }}
        </text>
        <template v-if="ionicState !== 'solid'">
          <text x="40" y="15" class="electrode-label">正极 +</text>
          <text x="542" y="15" class="electrode-label">负极 −</text>
        </template>
      </svg>
      <div class="result" aria-live="polite">
        <strong>{{ ionicState === 'solid' ? '通常不导电' : '可由离子载流' }}</strong
        ><span>{{ ionicExplanation }}</span>
      </div>
      <div class="controls" role="group" aria-label="核对离子化学式">
        <span class="control-label">电荷配比</span
        ><AppButton
          v-for="item in ionFormulae"
          :key="item.formula"
          type="secondary"
          size="small"
          :aria-pressed="ionFormula === item.formula"
          @click="ionFormula = item.formula"
          >{{ item.formula }}</AppButton
        >
      </div>
      <p class="formula-check" aria-live="polite">
        {{ selectedIonFormula.ions }} → <strong>{{ selectedIonFormula.formula }}</strong> ·
        {{ selectedIonFormula.check }}
      </p>
      <p class="note">
        上图始终展示
        NaCl；下方另练化学式配比。晶格图是二维截面示意，不代表完整三维配位数；溶液省略水分子和水合层。色线提示电场下迁移方向，不表示真实轨迹；固态离子仍会在原位振动。
      </p>
    </template>

    <template v-else-if="mode === 'covalent'">
      <div class="controls" role="group" aria-label="选择共价分子">
        <AppButton
          v-for="item in molecules"
          :key="item.key"
          type="secondary"
          size="small"
          :aria-pressed="moleculeKey === item.key"
          @click="moleculeKey = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="切换电子对与键线">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="lewisView === 'electrons'"
          @click="lewisView = 'electrons'"
          >点叉图</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="lewisView === 'bonds'"
          @click="lewisView = 'bonds'"
          >键线图</AppButton
        >
      </div>
      <svg viewBox="0 0 640 270" role="img" :aria-label="molecule.label + '的价电子和共价键计数图'">
        <template v-if="lewisView === 'bonds'">
          <line
            v-for="(line, i) in bondLines"
            :key="i"
            :x1="line.x1"
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
            class="bond-line"
          />
        </template>
        <g v-for="(atom, i) in molecule.atoms" :key="i">
          <circle :cx="atom.x" :cy="atom.y" r="19" class="atom-background" />
          <text :x="atom.x" :y="atom.y + 7" text-anchor="middle" class="symbol">
            {{ atom.symbol }}
          </text>
        </g>
        <g v-if="lewisView === 'electrons'">
          <template v-for="(electron, i) in lewisElectrons" :key="i">
            <circle
              v-if="electron.kind === 'dot'"
              :cx="electron.x"
              :cy="electron.y"
              r="3.4"
              class="electron-dot"
            />
            <path
              v-else
              :d="'M' + (electron.x - 4) + ' ' + (electron.y - 4) + 'l8 8m-8 0l8 -8'"
              class="electron-cross"
            />
          </template>
        </g>
        <text x="320" y="255" text-anchor="middle" class="highlight">
          共享 {{ molecule.shared }} 对 · 孤对 {{ molecule.lone }} 对 · 价电子总数
          {{ 2 * (molecule.shared + molecule.lone) }}
        </text>
      </svg>
      <div class="result" aria-live="polite">
        <strong>{{ molecule.label }}</strong
        ><span>{{ molecule.note }}</span>
      </div>
      <p class="note">
        只画价电子，点和叉追踪相邻原子的电子来源，所有电子本质相同。平面图用于计数，不代表真实键角或三维形状；每个共享对在全分子只计一次。巨型共价网络请在“结构与性质”中比较。
      </p>
    </template>

    <template v-else-if="mode === 'metallic'">
      <div class="controls" role="group" aria-label="改变金属模型">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="metalView === 'rest'"
          @click="metalView = 'rest'"
          >无外加电场</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="metalView === 'current'"
          @click="metalView = 'current'"
          >施加电场</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="metalView === 'slide'"
          @click="metalView = 'slide'"
          >推动一层</AppButton
        >
      </div>
      <svg viewBox="0 0 640 270" role="img" :aria-label="metalExplanation">
        <rect x="45" y="27" width="550" height="190" rx="16" class="electron-sea" />
        <g v-for="(core, i) in metalCores" :key="i">
          <circle :cx="core.x" :cy="core.y" r="20" class="atom-blue" />
          <text :x="core.x" :y="core.y + 6" text-anchor="middle" class="symbol">+</text>
        </g>
        <g v-for="(electron, i) in metalElectrons" :key="i">
          <circle :cx="electron.x" :cy="electron.y" r="4" class="electron-dot" />
          <path
            v-if="metalView === 'current'"
            :d="'M' + (electron.x - 8) + ' ' + electron.y + 'h-20m6 -4l-6 4l6 4'"
            class="motion-line"
          />
        </g>
        <template v-if="metalView === 'current'">
          <text x="48" y="20">正极 +</text>
          <text x="543" y="20">负极 −</text>
        </template>
        <path
          v-if="metalView === 'slide'"
          d="M52 123H100M91 117L100 123L91 129"
          class="arrow-line"
        />
        <text x="320" y="246" text-anchor="middle" class="highlight">
          {{
            metalView === 'slide'
              ? '晶层错位，正离子与离域电子的吸引仍在'
              : metalView === 'current'
                ? '离域电子产生定向迁移，正离子不穿过固体'
                : '没有净定向电流，不代表电子静止'
          }}
        </text>
      </svg>
      <div class="result" aria-live="polite">
        <strong>{{ metalView === 'slide' ? '延展性' : '固态导电的载流者：电子' }}</strong
        ><span>{{ metalExplanation }}</span>
      </div>
      <p class="note">
        正号表示正离子实，不是裸质子；图形不按真实数量或比例绘制。底色表示电子体系遍及整体，圆点仅用于提示电子，不对应某种金属每个原子提供的精确电子数。滑移是形变示意，不是断开局域共价键。
      </p>
    </template>

    <template v-else-if="mode === 'intermolecular'">
      <div class="controls" role="group" aria-label="比较相同条件下的卤素">
        <AppButton
          v-for="item in halogens"
          :key="item.symbol"
          type="secondary"
          size="small"
          :aria-pressed="halogenKey === item.symbol"
          @click="halogenKey = item.symbol"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="分子间作用的观察方式">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="moleculesSeparated === false"
          @click="moleculesSeparated = false"
          >常温常压</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="moleculesSeparated === true"
          @click="moleculesSeparated = true"
          >分子彼此分开</AppButton
        >
      </div>
      <svg
        viewBox="0 0 640 245"
        role="img"
        :aria-label="halogen.label + '由双原子分子组成，分开后分子内共价键仍保留'"
      >
        <line
          v-if="!moleculesSeparated && halogenKey !== 'Cl'"
          x1="195"
          y1="117"
          x2="292"
          y2="117"
          class="intermolecular-line"
        />
        <line
          v-if="!moleculesSeparated && halogenKey !== 'Cl'"
          x1="350"
          y1="117"
          x2="447"
          y2="117"
          class="intermolecular-line"
        />
        <g
          v-for="(position, i) in halogenPositions"
          :key="i"
          :transform="'translate(' + position.x + ',' + position.y + ')'"
        >
          <line x1="-19" y1="0" x2="19" y2="0" class="bond-line" />
          <circle cx="-19" cy="0" r="18" class="atom-teal" />
          <circle cx="19" cy="0" r="18" class="atom-teal" />
          <text x="-19" y="5" text-anchor="middle" class="atom-label">{{ halogenKey }}</text>
          <text x="19" y="5" text-anchor="middle" class="atom-label">{{ halogenKey }}</text>
        </g>
        <text x="320" y="219" text-anchor="middle" class="highlight">
          实线：分子内共价键始终保留
        </text>
      </svg>
      <div class="result" aria-live="polite">
        <strong>{{ moleculesSeparated ? '仅演示分子分离，不设定温度数值' : halogen.state }}</strong
        ><span>{{ halogen.note }}</span>
      </div>
      <div class="trend-strip">
        <span>Cl₂：气体</span><span>→</span><span>Br₂：液体</span><span>→</span><span>I₂：固体</span
        ><small>相似分子比较：色散作用总体增强</small>
      </div>
      <p class="note">
        常温常压下的物态只对应第一档；第二档是分离过程示意，不声称升温后仍在常温。虚线表示相邻分子间吸引，省略虚线不代表作用力严格为零；圆点大小相同只是为了读图，不比较原子实际半径。
      </p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="选择结构进行比较">
        <AppButton
          v-for="item in structures"
          :key="item.key"
          type="secondary"
          size="small"
          :aria-pressed="structureKey === item.key"
          @click="structureKey = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="structure-workbench">
        <svg viewBox="0 0 380 270" role="img" :aria-label="structure.diagramDescription">
          <template v-if="structureKey === 'diamond' || structureKey === 'silica'">
            <line
              v-for="(point, i) in tetraNeighbours"
              :key="'edge' + i"
              x1="190"
              y1="125"
              :x2="point.x"
              :y2="point.y"
              class="bond-line"
              :stroke-dasharray="i === 3 ? '5 4' : undefined"
            />
            <template v-for="(point, i) in tetraNeighbours" :key="i">
              <line
                :x1="point.x"
                :y1="point.y"
                :x2="point.outerX"
                :y2="point.outerY"
                class="bond-line"
              />
              <circle :cx="point.x" :cy="point.y" r="18" class="atom-teal" />
              <text :x="point.x" :y="point.y + 5" text-anchor="middle" class="atom-label">
                {{ structureKey === 'diamond' ? 'C' : 'O' }}
              </text>
              <circle :cx="point.outerX" :cy="point.outerY" r="13" class="atom-blue" />
              <text :x="point.outerX" :y="point.outerY + 5" text-anchor="middle" class="atom-label">
                {{ structureKey === 'diamond' ? 'C' : 'Si' }}
              </text>
            </template>
            <circle cx="190" cy="125" r="23" class="atom-blue" />
            <text x="190" y="131" text-anchor="middle" class="symbol">
              {{ structureKey === 'diamond' ? 'C' : 'Si' }}
            </text>
            <text x="190" y="257" text-anchor="middle">
              {{
                structureKey === 'diamond'
                  ? '中心 C 的四个相邻 C；网络继续延伸'
                  : '每个桥联 O 连接两个 Si；网络继续延伸'
              }}
            </text>
          </template>
          <template v-else-if="structureKey === 'graphite'">
            <g
              v-for="layer in [0, 1]"
              :key="layer"
              :transform="
                'translate(' + (55 + layer * 15) + ',' + (10 + layer * 130) + ') scale(0.72)'
              "
            >
              <path
                d="M85 55L125 32L165 55L165 101L125 124L85 101ZM165 55L205 32L245 55L245 101L205 124L165 101M85 55L49 34M85 101L49 122M125 32V8M125 124V147M205 32V8M205 124V147M245 55L281 34M245 101L281 122"
                class="graphite-network"
              />
              <circle
                v-for="(point, i) in graphiteAtoms"
                :key="i"
                :cx="point.x"
                :cy="point.y"
                r="7"
                class="graphite-atom"
              />
            </g>
            <text x="24" y="70">片层 1</text>
            <text x="24" y="200">片层 2</text>
            <text x="190" y="133" text-anchor="middle">层间作用较弱</text>
            <text x="190" y="264" text-anchor="middle">每层向外延伸；层内三邻居，第四电子离域</text>
          </template>
          <template v-else-if="structureKey === 'salt'">
            <g v-for="(ion, i) in propertyIons" :key="i">
              <circle
                :cx="ion.x"
                :cy="ion.y"
                r="21"
                :class="ion.positive ? 'atom-blue' : 'atom-teal'"
              />
              <text :x="ion.x" :y="ion.y + 5" text-anchor="middle" class="atom-label">
                {{ ion.positive ? 'Na⁺' : 'Cl⁻' }}
              </text>
            </g>
            <text x="190" y="250" text-anchor="middle">晶格截面；不是一对对独立 NaCl 分子</text>
          </template>
          <template v-else-if="structureKey === 'metal'">
            <rect x="38" y="30" width="304" height="180" rx="14" class="electron-sea" />
            <g v-for="(core, i) in propertyIons" :key="i">
              <circle :cx="core.x" :cy="core.y" r="17" class="atom-blue" />
              <text :x="core.x" :y="core.y + 6" text-anchor="middle" class="symbol">+</text>
            </g>
            <text x="190" y="250" text-anchor="middle">正离子实 + 遍及整体的离域电子体系</text>
          </template>
          <template v-else>
            <g
              v-for="(point, i) in moleculeCloud"
              :key="i"
              :transform="'translate(' + point.x + ',' + point.y + ')'"
            >
              <line x1="-20" y1="0" x2="20" y2="0" class="bond-line" />
              <circle cx="-20" cy="0" r="12" class="atom-light" />
              <circle cx="20" cy="0" r="19" class="atom-teal" />
              <text x="-20" y="5" text-anchor="middle" class="atom-label">H</text>
              <text x="20" y="5" text-anchor="middle" class="atom-label">Cl</text>
            </g>
            <text x="190" y="250" text-anchor="middle">纯 HCl：独立分子；入水后另看粒子变化</text>
          </template>
        </svg>
        <dl class="property-ledger" aria-live="polite">
          <div>
            <dt>结构</dt>
            <dd>{{ structure.description }}</dd>
          </div>
          <div>
            <dt>熔沸 / 硬度</dt>
            <dd>{{ structure.thermal }}</dd>
          </div>
          <div>
            <dt>导电</dt>
            <dd>{{ structure.conductivity }}</dd>
          </div>
          <div>
            <dt>审题提醒</dt>
            <dd>{{ structure.caution }}</dd>
          </div>
        </dl>
      </div>
      <p class="note">
        网络图只画局部，边缘原子的其余连接已省略；金刚石和 SiO₂
        图中的虚线表示空间投影方向，仍是共价键。石墨为两个片层的投影示意，层间没有画成共价键；不按真实比例或角度绘制。
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
type Mode =
  | 'classification'
  | 'stability'
  | 'ionic'
  | 'covalent'
  | 'metallic'
  | 'intermolecular'
  | 'properties'
const props = defineProps<{ topic: string }>()
const modes: Record<string, Mode> = {
  '140601': 'classification',
  '140602': 'stability',
  '140603': 'ionic',
  '140604': 'covalent',
  '140605': 'metallic',
  '140606': 'intermolecular',
  '140607': 'properties',
}
// 每个最小知识点进入自己的模型，整章入口默认展示结构性质。
const mode = computed(() => modes[props.topic] ?? 'properties')
const headings: Record<Mode, { title: string; subtitle: string }> = {
  classification: {
    title: '先辨物质，再数元素',
    subtitle: '相同颜色表示同一种元素；连接关系决定这些原子属于什么物质。',
  },
  stability: {
    title: '稳定外层，可以走不同路径',
    subtitle: '电子转移、共享与离域是不同的模型，不把“凑满外层”当成唯一解释。',
  },
  ionic: {
    title: '带电还不够，必须能够移动',
    subtitle: '同一份 NaCl 改变状态，检查离子是否可以穿过样品迁移。',
  },
  covalent: {
    title: '共享几对？孤对几对？',
    subtitle: '把点叉与键线对照起来，再核对整个分子的价电子总数。',
  },
  metallic: {
    title: '晶层可以滑，电子可以走',
    subtitle: '固态金属中的载流与形变，来自同一套正离子实—离域电子模型。',
  },
  intermolecular: {
    title: '分子分开，分子内的键还在',
    subtitle: '用相似的卤素分子比较物态，不把分子间作用混成分子内共价键。',
  },
  properties: {
    title: '一幅结构图，解释多种性质',
    subtitle: '同时检查连接方式、需要克服的吸引与可移动电荷，不凭单一性质猜结构。',
  },
}
// 标题随模型切换，避免沿用上一知识点的说明。
const heading = computed(() => headings[mode.value])
type Atom = { symbol: string; x: number; y: number }
type Cluster = { atoms: Atom[]; edges: [number, number][] }
const clusters: Record<string, Cluster> = {
  Ar: { atoms: [{ symbol: 'Ar', x: 0, y: 0 }], edges: [] },
  O2: {
    atoms: [
      { symbol: 'O', x: -13, y: 0 },
      { symbol: 'O', x: 13, y: 0 },
    ],
    edges: [[0, 1]],
  },
  H2O: {
    atoms: [
      { symbol: 'O', x: 0, y: -6 },
      { symbol: 'H', x: -22, y: 17 },
      { symbol: 'H', x: 22, y: 17 },
    ],
    edges: [
      [0, 1],
      [0, 2],
    ],
  },
  O3: {
    atoms: [
      { symbol: 'O', x: 0, y: -12 },
      { symbol: 'O', x: -26, y: 10 },
      { symbol: 'O', x: 26, y: 10 },
    ],
    edges: [
      [0, 1],
      [0, 2],
    ],
  },
}
const samples = [
  {
    key: 'argon',
    label: 'Ar',
    category: '纯单质 · 单原子',
    description: '只有氩这一种物质，由独立 Ar 原子组成。',
    particles: ['Ar', 'Ar', 'Ar', 'Ar', 'Ar', 'Ar', 'Ar', 'Ar'],
  },
  {
    key: 'oxygen',
    label: 'O₂',
    category: '纯单质 · 分子',
    description: '每个分子有两个同种元素的原子，仍然不是化合物。',
    particles: ['O2', 'O2', 'O2', 'O2', 'O2', 'O2', 'O2', 'O2'],
  },
  {
    key: 'water',
    label: 'H₂O',
    category: '纯化合物',
    description: '不同元素在每个水分子中按固定比例结合，样品仍只有水一种物质。',
    particles: ['H2O', 'H2O', 'H2O', 'H2O', 'H2O', 'H2O', 'H2O', 'H2O'],
  },
  {
    key: 'mixture',
    label: 'O₂ + H₂O',
    category: '两种物质的混合物',
    description: '氧分子和水分子同时存在；两种物质之间的数量配比可以改变。',
    particles: ['O2', 'H2O', 'O2', 'H2O', 'H2O', 'O2', 'H2O', 'O2'],
  },
  {
    key: 'allotropes',
    label: 'O₂ + O₃',
    category: '同一元素形成的不同物质混合',
    description: '虽然只有氧元素，但 O₂ 和 O₃ 是不同单质，二者混在一起仍是混合物。',
    particles: ['O2', 'O3', 'O2', 'O3', 'O3', 'O2', 'O3', 'O2'],
  },
]
const sampleKey = ref('water')
// 分类依据样品中的物质身份，而非简单统计圆点颜色。
const sample = computed(() => samples.find((item) => item.key === sampleKey.value) ?? samples[2]!)
// 图中仅绘制少量代表粒子，不将图示数量作为宏观含量。
const sampleClusters = computed(() => sample.value.particles.map((key) => clusters[key]!))
const bondingPaths = [
  {
    key: 'ionic',
    label: 'Na + Cl · 转移',
    before: 'Na：2,8,1；Cl：2,8,7',
    action: '失去 / 得到电子',
    after: 'Na⁺：2,8；Cl⁻：2,8,8',
    bond: '离子键',
    explanation: '两种离子保留各自元素身份，通过静电吸引构成晶格。',
  },
  {
    key: 'shared',
    label: 'H + H · 共享',
    before: '每个 H 原子有 1 个电子',
    action: '共享一对电子',
    after: 'H—H：每个 H 周围可计 2 个',
    bond: '共价键',
    explanation: '共享电子对受到两个原子核吸引；并非一个原子把电子完全交给另一个。',
  },
  {
    key: 'metal',
    label: 'Na 金属 · 离域',
    before: '许多金属原子组成整体',
    action: '外层电子在整体中离域',
    after: '正离子实 + 离域电子',
    bond: '金属键',
    explanation: '电子不固定属于某两个原子；整个金属保持电中性。',
  },
]
const pathKey = ref('ionic')
// 三种路径采用不同模型，不将金属键解释成固定共享电子对。
const path = computed(
  () => bondingPaths.find((item) => item.key === pathKey.value) ?? bondingPaths[0]!,
)
const chlorineElectrons = Array.from({ length: 7 }, (_, i) => ({
  angle: i,
  x: 450 + 48 * Math.cos(((i + 1) * Math.PI) / 4),
  y: 100 + 48 * Math.sin(((i + 1) * Math.PI) / 4),
}))
const ionicStates = [
  { key: 'solid', label: '固体 NaCl' },
  { key: 'molten', label: '熔融 NaCl' },
  { key: 'aqueous', label: 'NaCl 水溶液' },
]
const ionicState = ref('solid')
// 有序和无序位置是状态示意，始终保持等量 Na⁺ 与 Cl⁻。
const saltIons = computed(() =>
  Array.from({ length: 18 }, (_, i) => {
    const row = Math.floor(i / 6),
      col = i % 6
    return {
      positive: (row + col) % 2 === 0,
      x: 105 + col * 86 + (ionicState.value === 'solid' ? 0 : ((i * 13) % 29) - 14),
      y: 64 + row * 57 + (ionicState.value === 'solid' ? 0 : ((i * 17) % 23) - 11),
    }
  }),
)
// 只在熔体或溶液中提供离子迁移的载流解释。
const ionicExplanation = computed(() =>
  ionicState.value === 'solid'
    ? '离子在晶格位置附近振动，无法在样品内持续定向迁移。'
    : ionicState.value === 'molten'
      ? '熔化后离子可移动；载流的是正、负离子，不是离域电子。'
      : '盐溶解后形成可移动的水合离子；并不是所有离子化合物都容易溶解。',
)
const ionFormulae = [
  { formula: 'NaCl', ions: 'Na⁺ + Cl⁻', check: '+1 − 1 = 0' },
  { formula: 'MgCl₂', ions: 'Mg²⁺ + 2Cl⁻', check: '+2 − 2 = 0' },
  { formula: 'Ca(OH)₂', ions: 'Ca²⁺ + 2OH⁻', check: '两个 OH⁻ 整体；+2 − 2 = 0' },
  { formula: 'Al₂(SO₄)₃', ions: '2Al³⁺ + 3SO₄²⁻', check: '+6 − 6 = 0' },
  { formula: 'FeCl₃', ions: 'Fe³⁺ + 3Cl⁻', check: 'iron(III) 表明 +3；+3 − 3 = 0' },
]
const ionFormula = ref('MgCl₂')
// 配式按完整离子电荷抵消，不拆散复合离子。
const selectedIonFormula = computed(
  () => ionFormulae.find((item) => item.formula === ionFormula.value) ?? ionFormulae[1]!,
)
type Molecule = {
  key: string
  label: string
  atoms: Atom[]
  bonds: [number, number, number][]
  lonePairs: { atom: number; x: number; y: number }[]
  shared: number
  lone: number
  note: string
}
const molecules: Molecule[] = [
  {
    key: 'h2',
    label: 'H₂',
    atoms: [
      { symbol: 'H', x: 270, y: 120 },
      { symbol: 'H', x: 370, y: 120 },
    ],
    bonds: [[0, 1, 1]],
    lonePairs: [],
    shared: 1,
    lone: 0,
    note: '1 个单键；每个 H 周围为 2 个电子。',
  },
  {
    key: 'water',
    label: 'H₂O',
    atoms: [
      { symbol: 'O', x: 320, y: 105 },
      { symbol: 'H', x: 225, y: 167 },
      { symbol: 'H', x: 415, y: 167 },
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
    ],
    lonePairs: [
      { atom: 0, x: 290, y: 70 },
      { atom: 0, x: 350, y: 70 },
    ],
    shared: 2,
    lone: 2,
    note: 'O 形成两个单键，另有两对孤对电子；两个 H 各共享一对。',
  },
  {
    key: 'ammonia',
    label: 'NH₃',
    atoms: [
      { symbol: 'N', x: 320, y: 115 },
      { symbol: 'H', x: 215, y: 115 },
      { symbol: 'H', x: 425, y: 115 },
      { symbol: 'H', x: 320, y: 210 },
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
    ],
    lonePairs: [{ atom: 0, x: 320, y: 65 }],
    shared: 3,
    lone: 1,
    note: 'N 形成三个单键并保留一对孤对电子；实际分子不是平面 T 形。',
  },
  {
    key: 'methane',
    label: 'CH₄',
    atoms: [
      { symbol: 'C', x: 320, y: 125 },
      { symbol: 'H', x: 215, y: 125 },
      { symbol: 'H', x: 425, y: 125 },
      { symbol: 'H', x: 320, y: 35 },
      { symbol: 'H', x: 320, y: 215 },
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
    ],
    lonePairs: [],
    shared: 4,
    lone: 0,
    note: 'C 形成四个单键；图用于计数，实际四面体结构不能读成平面十字形。',
  },
  {
    key: 'oxygen',
    label: 'O₂',
    atoms: [
      { symbol: 'O', x: 270, y: 120 },
      { symbol: 'O', x: 370, y: 120 },
    ],
    bonds: [[0, 1, 2]],
    lonePairs: [
      { atom: 0, x: 270, y: 75 },
      { atom: 0, x: 270, y: 165 },
      { atom: 1, x: 370, y: 75 },
      { atom: 1, x: 370, y: 165 },
    ],
    shared: 2,
    lone: 4,
    note: '一个双键包含两对共享电子；每个 O 还有两对孤对电子。',
  },
  {
    key: 'nitrogen',
    label: 'N₂',
    atoms: [
      { symbol: 'N', x: 270, y: 120 },
      { symbol: 'N', x: 370, y: 120 },
    ],
    bonds: [[0, 1, 3]],
    lonePairs: [
      { atom: 0, x: 225, y: 120 },
      { atom: 1, x: 415, y: 120 },
    ],
    shared: 3,
    lone: 2,
    note: '一个三键包含三对共享电子；每个 N 保留一对孤对电子。',
  },
  {
    key: 'co2',
    label: 'CO₂',
    atoms: [
      { symbol: 'C', x: 320, y: 120 },
      { symbol: 'O', x: 205, y: 120 },
      { symbol: 'O', x: 435, y: 120 },
    ],
    bonds: [
      [0, 1, 2],
      [0, 2, 2],
    ],
    lonePairs: [
      { atom: 1, x: 205, y: 75 },
      { atom: 1, x: 205, y: 165 },
      { atom: 2, x: 435, y: 75 },
      { atom: 2, x: 435, y: 165 },
    ],
    shared: 4,
    lone: 4,
    note: 'O=C=O 有两个双键，共四对共享电子；每个 O 两对孤对，C 无孤对。',
  },
]
const moleculeKey = ref('water')
const lewisView = ref<'electrons' | 'bonds'>('electrons')
// 各分子显式保存键级与孤对，电子图与键线图共用同一份结构数据。
const molecule = computed(
  () => molecules.find((item) => item.key === moleculeKey.value) ?? molecules[1]!,
)
// 同一共享对中两种符号仅表明来源；孤对使用所属原子的符号。
const lewisElectrons = computed(() => {
  const points: { x: number; y: number; kind: 'dot' | 'cross' }[] = []
  for (const [a, b, order] of molecule.value.bonds) {
    const first = molecule.value.atoms[a]!,
      second = molecule.value.atoms[b]!
    const length = Math.hypot(second.x - first.x, second.y - first.y),
      dx = (second.x - first.x) / length,
      dy = (second.y - first.y) / length
    for (let i = 0; i < order; i++) {
      const offset = (i - (order - 1) / 2) * 16
      const x = (first.x + second.x) / 2 - dy * offset,
        y = (first.y + second.y) / 2 + dx * offset
      points.push(
        { x: x - dx * 5, y: y - dy * 5, kind: 'dot' },
        { x: x + dx * 5, y: y + dy * 5, kind: 'cross' },
      )
    }
  }
  for (const pair of molecule.value.lonePairs) {
    const kind = pair.atom === 0 ? 'dot' : 'cross'
    points.push({ x: pair.x - 5, y: pair.y, kind }, { x: pair.x + 5, y: pair.y, kind })
  }
  return points
})
// 键线图按键级显示平行线，截短两端避免覆盖原子标签。
const bondLines = computed(() =>
  molecule.value.bonds.flatMap(([a, b, order]) => {
    const first = molecule.value.atoms[a]!,
      second = molecule.value.atoms[b]!
    const length = Math.hypot(second.x - first.x, second.y - first.y),
      dx = (second.x - first.x) / length,
      dy = (second.y - first.y) / length
    return Array.from({ length: order }, (_, i) => {
      const offset = (i - (order - 1) / 2) * 8
      return {
        x1: first.x + dx * 25 - dy * offset,
        y1: first.y + dy * 25 + dx * offset,
        x2: second.x - dx * 25 - dy * offset,
        y2: second.y - dy * 25 + dx * offset,
      }
    })
  }),
)
const metalView = ref('rest')
// 只将中间一层平移，电子体系仍遍及所有正离子位置。
const metalCores = computed(() =>
  Array.from({ length: 15 }, (_, i) => ({
    x: 105 + (i % 5) * 105 + (metalView.value === 'slide' && Math.floor(i / 5) === 1 ? 28 : 0),
    y: 65 + Math.floor(i / 5) * 58,
  })),
)
const metalElectrons = Array.from({ length: 16 }, (_, i) => ({
  x: 77 + (i % 8) * 68,
  y: 95 + Math.floor(i / 8) * 58,
}))
// 分清无净电流、电子定向迁移与晶层滑移的不同过程。
const metalExplanation = computed(() =>
  metalView.value === 'slide'
    ? '推动晶层后，正离子实仍受离域电子吸引，因此许多金属可发生塑性形变。'
    : metalView.value === 'current'
      ? '电场使电子运动具有净方向；正离子实仍在固体晶格位置附近振动。'
      : '离域电子本来就在运动；没有外加电场时，不产生图示方向的净定向电流。',
)
const halogens = [
  {
    symbol: 'Cl',
    label: 'Cl₂',
    state: '常温常压：气体',
    note: '三者中分子间色散作用较弱；独立 Cl₂ 分子在气体中相距较远。',
  },
  {
    symbol: 'Br',
    label: 'Br₂',
    state: '常温常压：液体',
    note: '相似分子比较中，Br₂ 的色散作用强于 Cl₂，常温下可形成液体。',
  },
  {
    symbol: 'I',
    label: 'I₂',
    state: '常温常压：固体',
    note: 'I₂ 的电子云更容易极化，分子间色散作用更强；固体仍由 I₂ 分子构成。',
  },
]
const halogenKey = ref('Br')
const moleculesSeparated = ref(false)
// 只比较相似双原子分子，不把质量趋势推广到所有分子物质。
const halogen = computed(
  () => halogens.find((item) => item.symbol === halogenKey.value) ?? halogens[1]!,
)
// 分离视图保留所有分子内连接，只改变分子彼此的位置。
const halogenPositions = computed(() =>
  moleculesSeparated.value || halogenKey.value === 'Cl'
    ? [
        { x: 110, y: 70 },
        { x: 320, y: 145 },
        { x: 530, y: 70 },
      ]
    : [
        { x: 160, y: 117 },
        { x: 320, y: 117 },
        { x: 480, y: 117 },
      ],
)
const structures = [
  {
    key: 'diamond',
    label: '金刚石',
    description: '每个 C 与 4 个 C 形成三维共价网络。',
    thermal: '结构坚硬；破坏网络需较多能量。常压下高温行为还涉及升华。',
    conductivity: '通常不导电：价电子用于共价成键，缺少可自由迁移的电子。',
    caution: '不能把高温性质解释成“金刚石分子间力很强”。',
    diagramDescription: '中心碳与四个相邻碳连接，边缘连接继续延伸的局部网络示意。',
  },
  {
    key: 'graphite',
    label: '石墨',
    description: '每个 C 有三个相邻 C；第四个价电子参与片层内离域。',
    thermal: '层内连接强，层间作用较弱，片层可滑移，因此较软。',
    conductivity: '可沿片层导电，主要载流者是离域电子。',
    caution: '软不等于层内共价键弱；相邻片层之间不是 C—C 共价键。',
    diagramDescription: '两个向外延伸的六角片层投影，每个内部碳有三邻居；层间不画共价连接。',
  },
  {
    key: 'silica',
    label: 'SiO₂',
    description: '每 Si 连四个 O，每 O 桥联两个 Si，构成巨型网络。',
    thermal: '通常熔点高，需破坏大量 Si—O 共价连接。',
    conductivity: '通常不导电，没有像金属或石墨那样的可移动电子。',
    caution: 'SiO₂ 表示 1:2 比例，不能画成独立三原子分子。',
    diagramDescription: '一个Si通过四个桥联O连向其他Si，显示每个桥联氧有两个Si邻居。',
  },
  {
    key: 'salt',
    label: 'NaCl',
    description: 'Na⁺ 与 Cl⁻ 通过静电吸引形成巨型离子晶格。',
    thermal: '通常熔点高；受力错位后同号排斥，晶体易碎。',
    conductivity: '固体通常不导电；熔体或水溶液由可移动离子载流。',
    caution: '有离子和离子能移动是两个条件；化学式不是分子。',
    diagramDescription: '正负离子交替的晶格二维截面。',
  },
  {
    key: 'metal',
    label: '金属',
    description: '正离子实与离域电子体系之间存在静电吸引。',
    thermal: '许多金属熔点较高且可延展，但熔点有差异与例外。',
    conductivity: '固态、液态都可由离域电子载流。',
    caution: '固态电流不是正离子穿过晶格；导电也并非金属专属。',
    diagramDescription: '正离子实置于表示离域电子体系的连续底色中。',
  },
  {
    key: 'hcl',
    label: 'HCl',
    description: '纯物质由独立的共价分子构成。',
    thermal: '熔沸点较低，普通物态变化主要克服分子间作用。',
    conductivity: '纯固体与纯液体导电差；入水形成 H₃O⁺、Cl⁻ 后溶液可导电。',
    caution: '溶液导电不能反推纯 HCl 是离子晶体；水改变了粒子存在形式。',
    diagramDescription: '多组独立HCl分子，分子内氢与氯连接，分子间无共价连接。',
  },
]
const structureKey = ref('silica')
// 每种结构同时给出连接、热学和载流条件，避免单凭一条性质猜测。
const structure = computed(
  () => structures.find((item) => item.key === structureKey.value) ?? structures[2]!,
)
const tetraNeighbours = [
  { x: 190, y: 60, outerX: 190, outerY: 18 },
  { x: 118, y: 153, outerX: 62, outerY: 175 },
  { x: 262, y: 153, outerX: 318, outerY: 175 },
  { x: 215, y: 195, outerX: 240, outerY: 232 },
]
const graphiteAtoms = [
  { x: 85, y: 55 },
  { x: 125, y: 32 },
  { x: 165, y: 55 },
  { x: 165, y: 101 },
  { x: 125, y: 124 },
  { x: 85, y: 101 },
  { x: 205, y: 32 },
  { x: 245, y: 55 },
  { x: 245, y: 101 },
  { x: 205, y: 124 },
]
const propertyIons = Array.from({ length: 12 }, (_, i) => ({
  x: 70 + (i % 4) * 80,
  y: 60 + Math.floor(i / 4) * 60,
  positive: ((i % 4) + Math.floor(i / 4)) % 2 === 0,
}))
const moleculeCloud = [
  { x: 100, y: 75 },
  { x: 260, y: 75 },
  { x: 100, y: 175 },
  { x: 260, y: 175 },
]
// 切换知识点恢复对应默认模型；教学演示不会写入学习进度或题库。
function resetDiagram() {
  sampleKey.value = 'water'
  pathKey.value = 'ionic'
  ionicState.value = 'solid'
  ionFormula.value = 'MgCl₂'
  moleculeKey.value = 'water'
  lewisView.value = 'electrons'
  metalView.value = 'rest'
  halogenKey.value = 'Br'
  moleculesSeparated.value = false
  structureKey.value = 'silica'
}
watch(() => props.topic, resetDiagram)
</script>

<style scoped lang="scss">
.bond-atlas {
  min-width: 0;
  margin: 0;
  padding: 24px 26px;
  border: 1px solid #bcdfde;
  border-radius: 16px;
  background: linear-gradient(120deg, #f0faf8, #fff 75%);
  color: #24434b;
  line-height: 1.65;
  h5 {
    font-size: 21px;
    margin: 8px 0 6px;
    color: #153d44;
  }
  figcaption p {
    font-size: 14px;
    margin: 0;
    color: #5a747b;
  }
  svg {
    display: block;
    width: 100%;
    max-width: 760px;
    margin: 15px auto;
    font: 13px sans-serif;
    fill: #536d77;
  }
  .symbol {
    font-size: 22px;
    fill: #143e49;
  }
  .atom-label {
    font-size: 12px;
    fill: #173e4b;
  }
}
.eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1.2px;
  color: #087c7e;
}
.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}
.control-label {
  font-size: 13px;
  color: #627b80;
}
.controls :deep(.app-button) {
  margin-left: 0;
  background: #fff;
  color: #08787b;
  border-color: #b5dcda;
  --el-button-hover-bg-color: #e9f7f4;
  --el-button-hover-text-color: #07696d;
  --el-button-hover-border-color: #79bdb7;
  white-space: normal;
  height: auto;
  min-height: 32px;
  line-height: 1.5;
  &:hover {
    background: #edf8f5;
    border-color: #79bdb7;
  }
  &[aria-pressed='true'] {
    background: #dff3ee;
    color: #08676b;
    border-color: #51a89f;
    font-weight: 600;
  }
  &:focus-visible {
    outline: 3px solid #88aee6;
    outline-offset: 3px;
  }
}
.sample-box {
  fill: #fbfefd;
  stroke: #c6e2dd;
  stroke-width: 1.5;
}
.water-box {
  fill: #eaf5ff;
  stroke: #accce8;
  stroke-width: 1.5;
}
.atom-teal {
  fill: #c2e6df;
  stroke: #5baba0;
  stroke-width: 1.5;
}
.atom-blue {
  fill: #dce9fa;
  stroke: #7c9ac7;
  stroke-width: 1.5;
}
.atom-light {
  fill: #fff;
  stroke: #91a7b6;
  stroke-width: 1.5;
}
.atom-background {
  fill: #f4fbf8;
}
.bond-line {
  stroke: #386f79;
  stroke-width: 3;
  stroke-linecap: round;
}
.shell {
  fill: none;
  stroke: #a7c4ca;
  stroke-width: 1.5;
}
.arrow-line {
  fill: none;
  stroke: #4d8e9b;
  stroke-width: 2;
}
.highlight {
  fill: #147b7b;
  font-size: 14px;
  font-weight: 600;
}
.electron-dot {
  fill: #3779ae;
}
.electron-cross {
  fill: none;
  stroke: #198a7d;
  stroke-width: 1.9;
  stroke-linecap: round;
}
.motion-line {
  fill: none;
  stroke: #638fae;
  stroke-width: 1.5;
}
.electrode-label {
  fill: #61768b;
  font-size: 12px;
}
.electron-sea {
  fill: #e5f3ee;
  stroke: #a7d7c8;
  stroke-dasharray: 5 4;
}
.intermolecular-line {
  stroke: #6a9b99;
  stroke-width: 2;
  stroke-dasharray: 5 6;
}
.graphite-network {
  fill: none;
  stroke: #557b83;
  stroke-width: 2;
}
.graphite-atom {
  fill: #547c83;
}
.result {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 18px;
  align-items: baseline;
  padding-top: 12px;
  color: #32676c;
  font-size: 14px;
  strong {
    font-size: 18px;
    color: #116d70;
  }
}
.note {
  margin: 16px 0 0;
  border-top: 1px solid #dceae7;
  padding-top: 12px;
  color: #687f84;
  font-size: 12px;
  line-height: 1.8;
}
.electron-route {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin: 25px 0;
  small,
  strong {
    display: block;
  }
  small {
    color: #758d91;
    font-size: 12px;
  }
  strong {
    color: #256b71;
    font-size: 16px;
  }
  .arrow {
    font-size: 24px;
    color: #8ba5aa;
  }
}
.shared-hydrogen {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 25px;
  padding: 20px 0;
  font-size: 32px;
  color: #245567;
  p {
    flex-basis: 100%;
    font-size: 14px;
    text-align: center;
  }
  .shared-pair {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  i {
    height: 9px;
    width: 9px;
    background: #3779ae;
    border-radius: 50%;
  }
  b {
    font-weight: 400;
    color: #198a7d;
  }
}
.metal-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  justify-content: center;
  padding: 20px;
  p {
    flex-basis: 100%;
    font-size: 14px;
    text-align: center;
  }
}
.metal-core {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #dce9fa;
  border: 1px solid #8da6ca;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  font-weight: 600;
}
.formula-check {
  padding: 13px 16px;
  border-left: 3px solid #8ccbc1;
  background: #eff8f5;
  font-size: 14px;
  margin: 12px 0;
}
.trend-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  color: #3a7375;
  font-size: 14px;
  padding: 17px 0;
  small {
    flex-basis: 100%;
    text-align: center;
    color: #6f8588;
  }
}
.structure-workbench {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(240px, 1fr);
  gap: 24px;
  align-items: center;
  svg {
    margin: 12px auto;
  }
}
.property-ledger {
  margin: 0;
  font-size: 13px;
  > div {
    display: grid;
    grid-template-columns: 78px 1fr;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid #dfebe7;
  }
  dt {
    font-weight: 600;
    color: #176b6e;
  }
  dd {
    margin: 0;
    color: #4f6a75;
  }
}
@media (max-width: 780px) {
  .bond-atlas {
    padding: 20px 18px;
  }
  .structure-workbench {
    grid-template-columns: 1fr;
    gap: 5px;
    svg {
      max-width: 470px;
    }
  }
  .electron-route {
    gap: 13px;
    strong {
      font-size: 14px;
    }
  }
}
@media (max-width: 460px) {
  .bond-atlas {
    padding: 18px 13px;
    h5 {
      font-size: 19px;
    }
  }
  .electron-route {
    align-items: flex-start;
    flex-direction: column;
    gap: 9px;
    .arrow {
      transform: rotate(90deg);
      align-self: center;
    }
  }
  .property-ledger > div {
    grid-template-columns: 65px 1fr;
  }
  .control-label {
    flex-basis: 100%;
  }
  .result strong {
    font-size: 16px;
  }
}
</style>
