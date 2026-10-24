<!-- 数学1几何互动图解：根据考纲节点呈现角度、构型、坐标、投影和测量模型。 -->
<template>
  <figure class="geometry-atlas" :aria-label="heading">
    <figcaption>
      <span>MATHEMATICS 1 · GEOMETRY</span>
      <h5>{{ heading }}</h5>
    </figcaption>
    <p class="lead">{{ lead }}</p>

    <template v-if="mode === 1 || mode === 2">
      <div class="controls" role="group" aria-label="选择正多边形边数">
        <AppButton
          v-for="value in [3, 4, 5, 6, 8]"
          :key="value"
          size="small"
          :type="sides === value ? 'primary' : 'secondary'"
          :aria-pressed="sides === value"
          @click="sides = value"
          >{{ value }} 边形</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 310" role="img" :aria-label="polygonDescription">
          <polygon :points="polygonPoints" class="shape" />
          <g v-for="(point, index) in polygonVertices" :key="index">
            <circle :cx="point.x" :cy="point.y" r="4" class="dot" />
            <text
              :x="point.x + (point.x - 220) * 0.16"
              :y="point.y + (point.y - 155) * 0.16 + 5"
              text-anchor="middle"
            >
              {{ String.fromCharCode(65 + index) }}
            </text>
          </g>
          <template v-if="mode === 1">
            <path d="M220 27V283" class="aux" />
            <text x="365" y="112">全部边等长</text>
            <text x="365" y="148">全部内角相等</text>
            <text x="365" y="184">对称轴 {{ sides }} 条</text>
            <text x="365" y="220">旋转阶数 {{ sides }}</text>
          </template>
          <template v-else>
            <line
              :x1="polygonVertices[0]!.x"
              :y1="polygonVertices[0]!.y"
              :x2="polygonExtension.x"
              :y2="polygonExtension.y"
              class="accent"
            />
            <text x="365" y="112">每个外角 {{ format(360 / sides) }}°</text>
            <text x="365" y="148">每个内角 {{ format(180 - 360 / sides) }}°</text>
            <text x="365" y="184">外角和 360°</text>
            <text x="365" y="220">内角和 {{ (sides - 2) * 180 }}°</text>
          </template>
        </svg>
      </div>
      <p class="result">{{ polygonDescription }}</p>
    </template>

    <template v-else-if="mode === 3">
      <div class="controls" role="group" aria-label="选择四边形">
        <AppButton
          v-for="(item, index) in quadrilaterals"
          :key="item.name"
          size="small"
          :type="quad === index ? 'primary' : 'secondary'"
          :aria-pressed="quad === index"
          @click="quad = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 280" role="img" :aria-label="currentQuad.note">
          <polygon :points="currentQuad.points" class="shape" />
          <path :d="currentQuad.diagonals" class="aux" />
          <text x="390" y="95">{{ currentQuad.name }}</text>
          <text x="390" y="133">观察对角线</text>
          <text x="390" y="171">再判断性质</text>
        </svg>
      </div>
      <p class="result">{{ currentQuad.note }}</p>
    </template>

    <template v-else-if="mode === 4">
      <div class="controls" role="group" aria-label="选择全等判据">
        <AppButton
          v-for="item in congruence"
          :key="item.key"
          size="small"
          :type="criterion === item.key ? 'primary' : 'secondary'"
          :aria-pressed="criterion === item.key"
          @click="criterion = item.key"
          >{{ item.key }}</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 270" role="img" :aria-label="congruenceText">
          <g
            v-for="(offset, index) in [35, 325]"
            :key="offset"
            :transform="`translate(${offset},0)`"
          >
            <path d="M0 215H160V95Z" class="shape" />
            <path v-if="criterion === 'RHS'" d="M144 215V199H160" class="accent" />
            <text x="-12" y="236">{{ index ? 'D' : 'A' }}</text>
            <text x="164" y="236">{{ index ? 'E' : 'B' }}</text>
            <text x="164" y="88">{{ index ? 'F' : 'C' }}</text>
            <text x="65" y="244">4</text>
            <text x="175" y="161">3</text>
            <text x="55" y="140">5</text>
            <path
              v-if="criterion === 'SAS' || criterion === 'ASA'"
              d="M140 215V195H160"
              class="accent"
            />
            <path v-if="criterion === 'ASA'" d="M29 215A29 29 0 0 0 23.2 197.6" class="accent" />
          </g>
          <text x="265" y="165" text-anchor="middle" class="large">≅</text>
        </svg>
      </div>
      <p class="result">{{ congruenceText }} 图中数值用于核对，判据只取所需的那组已知量。</p>
    </template>

    <template v-else-if="mode === 5 || mode === 17">
      <div class="controls" role="group" aria-label="选择小三角形长度比例">
        <AppButton
          v-for="item in [0.25, 0.5, 0.75]"
          :key="item"
          size="small"
          :type="ratio === item ? 'primary' : 'secondary'"
          :aria-pressed="ratio === item"
          @click="ratio = item"
          >长度比 {{ item }}</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 300" role="img" :aria-label="similarityText">
          <polygon points="230,35 70,250 390,250" class="shape" />
          <polygon :points="smallTriangle" class="highlight" />
          <line
            :x1="230 - 160 * ratio"
            :x2="230 + 160 * ratio"
            :y1="35 + 215 * ratio"
            :y2="35 + 215 * ratio"
            class="accent"
          />
          <text x="222" y="25">P</text>
          <text x="46" y="260">Q</text>
          <text x="401" y="260">R</text>
          <text :x="207 - 160 * ratio" :y="40 + 215 * ratio">S</text>
          <text :x="240 + 160 * ratio" :y="40 + 215 * ratio">T</text>
          <text x="420" y="115">ST ∥ QR</text>
          <text x="420" y="154">角相等</text>
          <text x="420" y="193">边成比例</text>
        </svg>
      </div>
      <p class="result">{{ similarityText }}</p>
      <div v-if="mode === 17" class="metrics">
        <span
          >长度 <strong>{{ ratio }}</strong></span
        ><span
          >面积 <strong>{{ ratio ** 2 }}</strong></span
        ><span
          >相似立体体积 <strong>{{ ratio ** 3 }}</strong></span
        >
      </div>
    </template>

    <template v-else-if="mode === 6 || mode === 10 || mode === 19">
      <div v-if="mode === 6" class="controls" role="group" aria-label="选择几何变换">
        <AppButton
          v-for="item in transforms"
          :key="item.key"
          size="small"
          :type="transform === item.key ? 'primary' : 'secondary'"
          :aria-pressed="transform === item.key"
          @click="transform = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <div v-else class="controls" role="group" aria-label="显示几何推理步骤">
        <AppButton
          size="small"
          :type="showRoute ? 'primary' : 'secondary'"
          :aria-pressed="showRoute"
          @click="showRoute = !showRoute"
          >{{ showRoute ? '隐藏辅助路径' : '显示辅助路径' }}</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 365" role="img" :aria-label="coordinateText">
          <g class="grid">
            <path v-for="i in 15" :key="`v${i}`" :d="`M${40 + i * 25} 20V345`" />
            <path v-for="i in 14" :key="`h${i}`" :d="`M65 ${20 + i * 25}H440`" />
          </g>
          <path
            d="M65 245H450L443 240M450 245L443 250 M190 345V15L185 22M190 15L195 22"
            class="axis"
          />
          <text x="451" y="266">x</text>
          <text x="175" y="18">y</text>
          <text x="171" y="261">O</text>
          <text
            v-for="i in [-4, -2, 2, 4, 6, 8]"
            :key="i"
            :x="190 + i * 25"
            y="261"
            text-anchor="middle"
          >
            {{ i }}
          </text>
          <text
            v-for="i in [-2, 2, 4, 6, 8]"
            :key="i"
            x="171"
            :y="250 - i * 25"
            text-anchor="middle"
          >
            {{ i }}
          </text>
          <template v-if="mode === 6">
            <polygon :points="coordinatePolygon(originalTriangle)" class="shape" />
            <polygon :points="coordinatePolygon(transformedTriangle)" class="highlight" />
            <text x="451" y="80">原图：蓝</text>
            <text x="451" y="110">新图：绿</text>
            <text x="451" y="165">原点 O</text>
            <text x="451" y="192">是旋转/</text>
            <text x="451" y="219">放缩中心</text>
          </template>
          <template v-else-if="mode === 10">
            <path d="M165 195L315 95" class="accent" />
            <path v-if="showRoute" d="M165 195H315V95" class="aux" />
            <circle cx="165" cy="195" r="5" class="dot" />
            <circle cx="315" cy="95" r="5" class="dot" />
            <circle v-if="showRoute" cx="240" cy="145" r="5" class="green-dot" />
            <text x="75" y="180">A(−1,2)</text>
            <text x="325" y="87">B(5,6)</text>
            <text v-if="showRoute" x="250" y="145">M(2,4)</text>
            <text v-if="showRoute" x="230" y="218">Δx=6</text>
            <text v-if="showRoute" x="325" y="150">Δy=4</text>
          </template>
          <template v-else>
            <path d="M190 245L290 195L340 95" class="accent" />
            <path d="M190 245L340 95" class="green-line" />
            <path v-if="showRoute" d="M190 245L240 145L340 95" class="aux" />
            <circle cx="290" cy="195" r="4" class="dot" />
            <circle cx="340" cy="95" r="4" class="green-dot" />
            <text x="288" y="218">A(4,2)</text>
            <text x="348" y="90">B(6,6)</text>
            <text x="242" y="237">u=(4,2)</text>
            <text x="330" y="160">v=(2,4)</text>
            <text x="225" y="145">u+v</text>
          </template>
        </svg>
      </div>
      <p class="result"><LatexText :text="coordinateText" /></p>
    </template>

    <template v-else-if="mode === 7 || mode === 18">
      <div
        class="controls"
        role="group"
        :aria-label="mode === 7 ? '选择直角边长度' : '选择特殊锐角'"
      >
        <AppButton
          v-for="value in mode === 7 ? [3, 6, 9] : [30, 45, 60]"
          :key="value"
          size="small"
          :type="(mode === 7 ? leg : angle) === value ? 'primary' : 'secondary'"
          :aria-pressed="(mode === 7 ? leg : angle) === value"
          @click="setTriangleValue(value)"
          >{{ mode === 7 ? `水平直角边 ${value}` : `${value}°` }}</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 310" role="img" :aria-label="triangleText">
          <polygon :points="rightTriangle" class="shape" />
          <path :d="`M${triangleRight - 18} 250V232H${triangleRight}`" class="accent" />
          <path :d="triangleAngleArc" class="accent" />
          <text x="75" y="275">A</text>
          <text :x="triangleRight + 10" y="270">B</text>
          <text :x="triangleRight + 10" :y="triangleTop - 5">C</text>
          <text :x="(80 + triangleRight) / 2" y="280" text-anchor="middle">
            {{ mode === 7 ? leg : '邻边' }}
          </text>
          <text :x="triangleRight + 15" :y="(250 + triangleTop) / 2">
            {{ mode === 7 ? 4 : '对边' }}
          </text>
          <text :x="(80 + triangleRight) / 2 - 35" :y="(250 + triangleTop) / 2 - 12">
            {{ mode === 7 ? `√${leg * leg + 16}` : '斜边 = 1' }}
          </text>
          <text x="126" y="237">{{ mode === 7 ? 'θ' : `${angle}°` }}</text>
        </svg>
      </div>
      <p class="result"><LatexText :text="triangleText" /></p>
      <p v-if="mode === 7" class="hint">水平边改变时，直角仍在 B；斜边长度由两条直角边一起决定。</p>
      <div v-else class="metrics">
        <span
          >sinθ <strong><LatexText :text="trigValues.sin" /></strong></span
        ><span
          >cosθ <strong><LatexText :text="trigValues.cos" /></strong></span
        ><span
          >tanθ <strong><LatexText :text="trigValues.tan" /></strong
        ></span>
      </div>
    </template>

    <template v-else-if="mode === 8 || mode === 9 || mode === 16">
      <div v-if="mode === 8" class="controls" role="group" aria-label="选择圆的组成部分">
        <AppButton
          v-for="item in circleParts"
          :key="item.key"
          size="small"
          :type="circlePart === item.key ? 'primary' : 'secondary'"
          :aria-pressed="circlePart === item.key"
          @click="circlePart = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <div v-else-if="mode === 9" class="controls" role="group" aria-label="选择圆定理">
        <AppButton
          v-for="item in circleTheorems"
          :key="item.key"
          size="small"
          :type="theorem === item.key ? 'primary' : 'secondary'"
          :aria-pressed="theorem === item.key"
          @click="theorem = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <div v-else class="controls" role="group" aria-label="选择扇形圆心角">
        <AppButton
          v-for="value in [60, 90, 120, 270]"
          :key="value"
          size="small"
          :type="sectorAngle === value ? 'primary' : 'secondary'"
          :aria-pressed="sectorAngle === value"
          @click="sectorAngle = value"
          >{{ value }}°</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 310" role="img" :aria-label="circleText">
          <circle cx="250" cy="150" r="100" class="circle-outline" />
          <template v-if="mode === 16">
            <path :d="sectorPath(sectorAngle)" class="highlight" />
            <text x="274" y="139">{{ sectorAngle }}°</text>
            <text x="295" y="174">r=4</text>
          </template>
          <template v-else-if="mode === 8">
            <path v-if="circlePart === 'sector'" :d="sectorPath(120)" class="highlight" />
            <path v-else-if="circlePart === 'segment'" :d="segmentPath" class="highlight" />
            <path
              v-if="['radius', 'sector'].includes(circlePart)"
              d="M250 150H350"
              class="accent"
            />
            <path v-if="circlePart === 'diameter'" d="M150 150H350" class="accent" />
            <path
              v-if="['chord', 'segment'].includes(circlePart)"
              :d="`M350 150L${circlePoint(120).x} ${circlePoint(120).y}`"
              class="accent"
            />
            <path v-if="circlePart === 'arc'" :d="arcPath(120)" class="green-line" />
            <path
              v-if="circlePart === 'tangent'"
              d="M350 25V275 M250 150H350 M334 150V134H350"
              class="accent"
            />
          </template>
          <template v-else-if="theorem === 'diameter'">
            <path d="M150 150H350L250 50Z" class="shape" />
            <path d="M239 61L250 72L261 61" class="accent" />
            <text x="237" y="35">90°</text>
            <text x="136" y="173">A</text>
            <text x="355" y="173">B</text>
          </template>
          <template v-else-if="theorem === 'tangent'">
            <path d="M350 25V275 M250 150H350 M334 150V134H350" class="accent" />
            <path
              :d="`M350 150L${circlePoint(120).x} ${circlePoint(120).y}L${circlePoint(240).x} ${circlePoint(240).y}Z`"
              class="shape"
            />
            <text x="363" y="150">切点 A</text>
            <text x="365" y="180">OA ⟂ 切线</text>
            <text x="180" y="254">C</text>
            <text x="180" y="55">B</text>
          </template>
          <template v-else-if="theorem === 'cyclic'">
            <polygon
              :points="
                [0, 120, 210, 300]
                  .map((a) => circlePoint(a))
                  .map((p) => `${p.x},${p.y}`)
                  .join(' ')
              "
              class="shape"
            />
            <text x="356" y="150">A：90°</text>
            <text x="178" y="47">B：75°</text>
            <text x="90" y="220">C：90°</text>
            <text x="301" y="262">D：105°</text>
          </template>
          <template v-else>
            <path
              :d="`M350 150L250 150L${circlePoint(120).x} ${circlePoint(120).y} M350 150L${circlePoint(240).x} ${circlePoint(240).y}L${circlePoint(120).x} ${circlePoint(120).y}`"
              class="accent"
            />
            <text x="270" y="115">120°</text>
            <text x="207" y="216">60°</text>
            <text x="356" y="153">A</text>
            <text x="178" y="47">B</text>
            <text x="178" y="255">C</text>
          </template>
          <circle cx="250" cy="150" r="4" class="dot" />
          <text x="230" y="171">O</text>
        </svg>
      </div>
      <p class="result"><LatexText :text="circleText" /></p>
    </template>

    <template v-else-if="mode === 11">
      <div class="controls" role="group" aria-label="选择三维图形">
        <AppButton
          v-for="item in solids"
          :key="item.key"
          size="small"
          :type="solid === item.key ? 'primary' : 'secondary'"
          :aria-pressed="solid === item.key"
          @click="solid = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 290" role="img" :aria-label="solidText">
          <template v-if="solid === 'cuboid'">
            <path
              d="M100 110H300V245H100Z M100 110L170 55H370V190L300 245 M300 110L370 55"
              class="shape"
            />
            <path d="M100 245L170 190H370 M170 190V55" class="aux" />
            <path d="M100 245L370 55" class="green-line" />
            <text x="395" y="115">6 面</text>
            <text x="395" y="151">12 棱</text>
            <text x="395" y="187">8 顶点</text>
            <text x="185" y="275">绿色：体对角线</text>
          </template>
          <template v-else-if="solid === 'prism'">
            <path
              d="M110 240L190 100L270 240Z M190 100L300 55L380 195L270 240 M300 55L220 195L110 240"
              class="shape"
            />
            <path d="M220 195H380" class="aux" />
            <text x="405" y="115">5 面</text>
            <text x="405" y="151">9 棱</text>
            <text x="405" y="187">6 顶点</text>
          </template>
          <template v-else-if="solid === 'pyramid'">
            <path
              d="M100 225L260 40L380 200L225 265Z M260 40L225 265 M100 225L255 160L380 200 M255 160L260 40"
              class="shape"
            />
            <text x="410" y="115">5 面</text>
            <text x="410" y="151">8 棱</text>
            <text x="410" y="187">5 顶点</text>
          </template>
          <template v-else-if="solid === 'cylinder'">
            <path d="M140 80V230A100 26 0 0 0 340 230V80" class="shape" />
            <ellipse cx="240" cy="80" rx="100" ry="26" class="shape" />
            <path d="M140 230A100 26 0 0 1 340 230" class="aux" />
          </template>
          <template v-else-if="solid === 'cone'">
            <path d="M130 235L240 45L350 235A110 30 0 0 1 130 235Z" class="shape" />
            <path d="M130 235A110 30 0 0 1 350 235 M240 45V235" class="aux" />
            <text x="249" y="160">垂直高</text>
          </template>
          <template v-else-if="solid === 'hemisphere'">
            <path d="M130 180A110 110 0 0 1 350 180A110 30 0 0 1 130 180Z" class="shape" />
            <ellipse cx="240" cy="180" rx="110" ry="30" class="aux" />
            <text x="192" y="247">另有圆形底面</text>
          </template>
          <template v-else>
            <circle cx="240" cy="150" r="105" class="shape" />
            <ellipse cx="240" cy="150" rx="105" ry="30" class="aux" />
            <path d="M240 45A36 105 0 0 1 240 255" class="aux" />
            <text x="375" y="150">只有曲面</text>
          </template>
        </svg>
      </div>
      <p class="result">{{ solidText }}</p>
    </template>

    <template v-else-if="mode === 12">
      <div class="controls" role="group" aria-label="选择符合轮廓的堆叠">
        <AppButton
          :type="!maxStack ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="!maxStack"
          @click="maxStack = false"
          >一种较少方案</AppButton
        ><AppButton
          :type="maxStack ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="maxStack"
          @click="maxStack = true"
          >最大堆叠方案</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 290" role="img" :aria-label="planText">
          <text x="90" y="35">俯视 · 格内为高度</text>
          <g v-for="(cell, index) in planCells" :key="index">
            <rect
              :x="80 + cell.x * 60"
              :y="60 + cell.y * 60"
              width="60"
              height="60"
              class="shape"
            />
            <text :x="110 + cell.x * 60" :y="97 + cell.y * 60" text-anchor="middle" class="large">
              {{ stackHeights[index] }}
            </text>
          </g>
          <path d="M140 276V247L134 255M140 247L146 255" class="accent" />
          <text x="173" y="274">正视方向</text>
          <text x="344" y="35">正视 · 只看最高处</text>
          <g v-for="(height, col) in [3, 2]" :key="col">
            <rect
              v-for="level in height"
              :key="level"
              :x="350 + col * 60"
              :y="240 - level * 60"
              width="60"
              height="60"
              class="highlight"
            />
          </g>
        </svg>
      </div>
      <p class="result">{{ planText }}</p>
    </template>

    <template v-else-if="mode === 13">
      <div class="controls" role="group" aria-label="选择方位角">
        <AppButton
          v-for="value in [30, 60, 120, 240]"
          :key="value"
          size="small"
          :type="bearing === value ? 'primary' : 'secondary'"
          :aria-pressed="bearing === value"
          @click="bearing = value"
          >{{ String(value).padStart(3, '0') }}°</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 310" role="img" :aria-label="bearingText">
          <circle cx="250" cy="155" r="105" class="aux" />
          <path d="M250 275V35L245 43M250 35L255 43 M125 155H375" class="axis" />
          <text x="244" y="23">N</text>
          <text x="382" y="162">E</text>
          <text x="244" y="296">S</text>
          <text x="102" y="162">W</text>
          <path :d="bearingArc" class="green-line" />
          <line x1="250" y1="155" :x2="bearingPoint.x" :y2="bearingPoint.y" class="accent" />
          <circle :cx="bearingPoint.x" :cy="bearingPoint.y" r="5" class="dot" />
          <text :x="bearingPoint.x + 8" :y="bearingPoint.y - 10">目标</text>
          <text x="400" y="105">从北开始</text>
          <text x="400" y="143">顺时针</text>
          <text x="400" y="181">{{ String(bearing).padStart(3, '0') }}°</text>
        </svg>
      </div>
      <p class="result">{{ bearingText }}</p>
    </template>

    <template v-else-if="mode === 14">
      <div class="controls" role="group" aria-label="选择面积模型">
        <AppButton
          v-for="(item, index) in areaShapes"
          :key="item.name"
          size="small"
          :type="areaShape === index ? 'primary' : 'secondary'"
          :aria-pressed="areaShape === index"
          @click="areaShape = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 280" role="img" :aria-label="areaText">
          <polygon :points="currentArea.points" class="shape" />
          <path d="M160 70V220 M160 204H176V220" class="aux" />
          <text x="118" y="151">h=4</text>
          <text x="235" y="249">b=8</text>
          <text v-if="areaShape === 2" x="210" y="57">a=4</text>
          <text x="402" y="130">垂直高固定</text>
          <text x="402" y="169">面积 {{ currentArea.value }}</text>
        </svg>
      </div>
      <p class="result"><LatexText :text="areaText" /></p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="选择圆柱表面">
        <AppButton
          v-for="item in cylinderModes"
          :key="item.key"
          size="small"
          :type="cylinderMode === item.key ? 'primary' : 'secondary'"
          :aria-pressed="cylinderMode === item.key"
          @click="cylinderMode = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="scene">
        <svg viewBox="0 0 560 290" role="img" :aria-label="cylinderText">
          <path d="M115 80V230A100 25 0 0 0 315 230V80" class="shape" />
          <ellipse
            cx="215"
            cy="80"
            rx="100"
            ry="25"
            :class="cylinderMode === 'closed' ? 'highlight' : 'circle-outline'"
          />
          <path d="M115 230A100 25 0 0 1 315 230" class="aux" />
          <ellipse v-if="cylinderMode === 'pipe'" cx="215" cy="80" rx="60" ry="15" class="hole" />
          <path d="M215 80H315 M333 80V230" class="accent" />
          <text x="258" y="72">R=5</text>
          <text x="340" y="158">h=6</text>
          <text v-if="cylinderMode === 'pipe'" x="177" y="111">r=3</text>
          <text x="395" y="116">
            {{
              cylinderMode === 'closed'
                ? '侧面 + 两底面'
                : cylinderMode === 'lateral'
                  ? '只计算侧面'
                  : '外圆柱 − 内孔'
            }}
          </text>
        </svg>
      </div>
      <p class="result"><LatexText :text="cylinderText" /></p>
    </template>
    <p class="footnote">互动示意用于理解关系；考试图是否按比例，仍以原题说明为准。</p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
// 节点后两位直接对应官方几何十九个小节，保持切换后的模型针对性。
const mode = computed(() => Number(props.topic.slice(-2)))
const headings = [
  '读记号，认条件',
  '正多边形：转向一圈',
  '四边形的性质地图',
  '全等：够用的条件是哪一组',
  '平行截线如何产生相似',
  '在坐标网格里做变换',
  '勾股：直角两边决定斜边',
  '弧、弦、扇形与弓形',
  '同弧、切点与圆上的角',
  '距离、中点和坐标差',
  '从表面走进立体',
  '同一轮廓，可以藏多少方块',
  '从北向顺时针量',
  '底与垂直高决定面积',
  '圆柱：数清边界与材料',
  '整圆的几分之几',
  '长度、面积、体积三层比例',
  '不用计算器重建特殊角',
  '不同路径，同一个终点',
]
// 标题从当前知识点派生，避免跨节点复用时留下上一节说明。
const heading = computed(() => headings[mode.value - 1] || '几何关系')
const leads = [
  '切换边数，观察正多边形的对称性；角的中间字母是顶点。',
  '边数增加时，外角变小、内角变大，外角总和仍是一周。',
  '虚线是对角线；对角线“相等”“垂直”“互相平分”是不同性质。',
  '同一对三角形可以用不同证据证明全等；不是看到两个角就足够。',
  '移动平行截线，观察小三角形与下方梯形的面积变化。',
  '蓝色为原图，绿色为变换后图形；每个顶点遵循同一个规则。',
  '只改变水平边，观察斜边如何随平方和改变。',
  '点击术语，高亮对应的线或区域。',
  '模型固定同一个圆，切换定理看条件如何对应。',
  '打开辅助路径，把斜距离拆成横纵方向，并定位中点。',
  '切换立体，区分平面面、曲面、棱、顶点与体对角线。',
  '两种方案拥有相同俯视占地和正视轮廓，总方块数却不同。',
  '每个方位角都以观察者所在点的正北方向为起点。',
  '同样的底与高，三角形面积是平行四边形的一半。',
  '保持外半径与高度，改变计算对象：侧面积、封闭表面积或空心材料。',
  '半径固定为 4，圆心角同时控制弧长与扇形面积。',
  '相似三角形的线性比平方后才是面积比，立体还要再乘一次。',
  '在直角三角形中，以左下角为 θ，观察对边、邻边与斜边。',
  '蓝色路径先 u 后 v，绿色线直接抵达终点；交换路径仍到同一点。',
]
// 提示只描述本节可操作模型，不依赖题目答案或后端状态。
const lead = computed(() => leads[mode.value - 1] || '')
const sides = ref(5)
const quad = ref(0)
const criterion = ref('SSS')
const ratio = ref(0.5)
const transform = ref('translate')
const showRoute = ref(false)
const leg = ref(3)
const angle = ref(30)
const circlePart = ref('radius')
const theorem = ref('centre')
const sectorAngle = ref(90)
const solid = ref('cuboid')
const maxStack = ref(false)
const bearing = ref(60)
const areaShape = ref(0)
const cylinderMode = ref('closed')

// SVG 数字保留两位，避免动态比例出现长小数挤占标签。
function format(value: number) {
  return Number(value.toFixed(2)).toString()
}
// 统一按数学正方向获取圆周点，SVG 的纵轴方向在这里反转。
function circlePoint(degrees: number) {
  const r = (degrees * Math.PI) / 180
  return { x: 250 + 100 * Math.cos(r), y: 150 - 100 * Math.sin(r) }
}
// 同一个圆的弧与扇形共用端点及大弧标志，保证优扇形显示正确。
function arcPath(degrees: number) {
  const p = circlePoint(degrees)
  return `M350 150A100 100 0 ${degrees > 180 ? 1 : 0} 0 ${p.x} ${p.y}`
}
// 扇形由两条半径闭合，区别于只由弦闭合的弓形。
function sectorPath(degrees: number) {
  return `M250 150L350 150${arcPath(degrees).slice(8)}Z`
}
// 正多边形在固定外接圆上生成，边数变化保持几何关系正确。
const polygonVertices = computed(() =>
  Array.from({ length: sides.value }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / sides.value
    return { x: 220 + 110 * Math.cos(a), y: 155 + 110 * Math.sin(a) }
  }),
)
// 将同一顶点集合投影为闭合轮廓，避免图形与角度说明脱节。
const polygonPoints = computed(() => polygonVertices.value.map((p) => `${p.x},${p.y}`).join(' '))
// 将最后一边向首顶点外延，用以区分内角与转向外角。
const polygonExtension = computed(() => {
  const a = polygonVertices.value[0]!
  const b = polygonVertices.value.at(-1)!
  const d = Math.hypot(a.x - b.x, a.y - b.y)
  return { x: a.x + (45 * (a.x - b.x)) / d, y: a.y + (45 * (a.y - b.y)) / d }
})
// 边数同时决定内外角与对称阶数，按当前考点选择结论。
const polygonDescription = computed(() =>
  mode.value === 1
    ? `正 ${sides.value} 边形有 ${sides.value} 条反射对称轴，最小正旋转角为 ${format(360 / sides.value)}°。图中的虚线是一条对称轴。`
    : `每次转向 ${format(360 / sides.value)}°，转 ${sides.value} 次合计 360°；相邻内角为 ${format(180 - 360 / sides.value)}°。`,
)
const quadrilaterals = [
  {
    name: '矩形',
    points: '90,75 320,75 320,225 90,225',
    diagonals: 'M90 75L320 225M320 75L90 225',
    note: '矩形的两条对角线等长且互相平分；一般不垂直。正方形是特殊的矩形。',
  },
  {
    name: '菱形',
    points: '70,150 210,60 350,150 210,240',
    diagonals: 'M70 150H350M210 60V240',
    note: '菱形四边等长，对角线垂直且互相平分，但一般不等长。四个直角时才是正方形。',
  },
  {
    name: '平行四边形',
    points: '80,225 280,225 350,75 150,75',
    diagonals: 'M80 225L350 75M280 225L150 75',
    note: '平行四边形对边平行且等长，对角线互相平分；一般既不等长也不垂直。',
  },
  {
    name: '风筝形',
    points: '210,35 320,115 210,245 100,115',
    diagonals: 'M210 35V245M100 115H320',
    note: '这幅风筝形有两组相邻等边。竖直对角线垂直平分水平对角线，但水平对角线不平分竖直对角线。',
  },
  {
    name: '梯形',
    points: '70,225 350,225 290,75 150,75',
    diagonals: 'M70 225L290 75M350 225L150 75',
    note: '梯形有一组平行对边；一般不能假定对角线互相平分、等长或垂直。',
  },
]
// 当前构型的性质来自同一记录，防止图形与对角线说明错配。
const currentQuad = computed(() => quadrilaterals[quad.value]!)
const congruence = [
  { key: 'SSS', text: '三边 3、4、5 分别对应相等，得到 △ABC ≅ △DEF。' },
  { key: 'SAS', text: 'AB=DE=4，BC=EF=3，夹角 B=E=90°，两边与夹角确定全等。' },
  { key: 'ASA', text: '角 A=角 D，角 B=角 E=90°，夹边 AB=DE=4，确定全等。' },
  { key: 'RHS', text: '两个三角形都是直角三角形，斜边 AC=DF=5，直角边 BC=EF=3，确定全等。' },
]
// 只强调选中判据所需要的条件，其余尺寸用于复核。
const congruenceText = computed(() => congruence.find((c) => c.key === criterion.value)!.text)
// 平行截线按顶点到基底的相同比率构造小三角形。
const smallTriangle = computed(
  () =>
    `230,35 ${230 - 160 * ratio.value},${35 + 215 * ratio.value} ${230 + 160 * ratio.value},${35 + 215 * ratio.value}`,
)
// 对应长度平方给面积，剩余梯形以整体减去小三角形。
const similarityText = computed(
  () =>
    `PS/PQ=ST/QR=${ratio.value}，小三角形面积占 ${ratio.value ** 2}；下方梯形占 ${1 - ratio.value ** 2}。比例用小边与整条大边对应，不能用剩余那一段。`,
)
const transforms = [
  { key: 'translate', label: '平移 (2,−1)' },
  { key: 'rotate', label: '顺时针 90°' },
  { key: 'reflect', label: '关于 x 轴反射' },
  { key: 'half', label: '放缩 1/2' },
  { key: 'negative', label: '放缩 −1' },
]
type Point = { x: number; y: number }
const originalTriangle: Point[] = [
  { x: 1, y: 1 },
  { x: 4, y: 1 },
  { x: 2, y: 3 },
]
// 所有顶点应用同一仿射规则；负倍数关于原点反向，长度仍非负。
const transformedTriangle = computed(() =>
  originalTriangle.map((p) =>
    transform.value === 'rotate'
      ? { x: p.y, y: -p.x }
      : transform.value === 'reflect'
        ? { x: p.x, y: -p.y }
        : transform.value === 'half'
          ? { x: p.x / 2, y: p.y / 2 }
          : transform.value === 'negative'
            ? { x: -p.x, y: -p.y }
            : { x: p.x + 2, y: p.y - 1 },
  ),
)
// 坐标网格所有模型共享同一坐标映射，避免视图变化误导位移方向。
function coordinatePolygon(points: Point[]) {
  return points.map((p) => `${190 + p.x * 25},${245 - p.y * 25}`).join(' ')
}
// 用当前模型的真实坐标输出距离、变换或向量结论。
const coordinateText = computed(() => {
  if (mode.value === 10)
    return String.raw`横向差 6、纵向差 4，因此 $AB=\sqrt{6^2+4^2}=2\sqrt{13}$；中点是 $(2,4)$，斜率 $4/6=2/3$。`
  if (mode.value === 19)
    return 'u=(4,2)，v=(2,4)，u+v=(6,6)。辅助路径交换了先后顺序，但终点仍为 B；从 B 回 O 的向量是 (−6,−6)。'
  return (
    {
      translate: '所有点都向右 2、向下 1；形状、长度与角度不变。',
      rotate: '原点顺时针 90°：(x,y) → (y,−x)。围绕其他中心不能直接套这个公式。',
      reflect: '关于 x 轴反射：(x,y) → (x,−y)。边长不变，图形朝向翻转。',
      half: '中心为 O、倍数 1/2：每个坐标减半，长度减半，面积变为 1/4。',
      negative: '中心为 O、倍数 −1：每点移到 O 的另一侧，长度不变，等价于绕 O 旋转 180°。',
    } as Record<string, string>
  )[transform.value]!
})
// 同一按钮组依章节修改长度或角度，保持图形与文字计算同步。
function setTriangleValue(value: number) {
  if (mode.value === 7) leg.value = value
  else angle.value = value
}
// 根据边长或单位斜边确定直角顶点的水平位置。
const triangleRight = computed(() =>
  mode.value === 7 ? 80 + leg.value * 30 : 80 + 220 * Math.cos((angle.value * Math.PI) / 180),
)
// 对边高度随边长或锐角变化，始终保持 B 点为直角。
const triangleTop = computed(() =>
  mode.value === 7 ? 130 : 250 - 220 * Math.sin((angle.value * Math.PI) / 180),
)
// 三顶点与标注共享坐标，确保勾股和三角比图按实际关系构造。
const rightTriangle = computed(
  () => `80,250 ${triangleRight.value},250 ${triangleRight.value},${triangleTop.value}`,
)
// 角弧沿当前两条射线绘制，不能使用固定角弧暗示角度不变。
const triangleAngleArc = computed(() => {
  const a = Math.atan2(250 - triangleTop.value, triangleRight.value - 80)
  return `M112 250A32 32 0 0 0 ${80 + 32 * Math.cos(a)} ${250 - 32 * Math.sin(a)}`
})
// 关系式由图中边长或角度派生，不以图上像素代替实际尺寸。
const triangleText = computed(() =>
  mode.value === 7
    ? `$c^2=${leg.value}^2+4^2=${leg.value ** 2 + 16}$，因此 $c=\\sqrt{${leg.value ** 2 + 16}}$。只有直角对面的边才是斜边。`
    : `斜边归一为 1，对边长度就是 sin${angle.value}°，邻边长度就是 cos${angle.value}°；图中 θ 始终在 A 点。`,
)
// 特殊角显示精确根式，避免用小数损失无计算器解题的结构。
const trigValues = computed(() =>
  angle.value === 30
    ? { sin: '$1/2$', cos: '$\\sqrt{3}/2$', tan: '$\\sqrt{3}/3$' }
    : angle.value === 45
      ? { sin: '$\\sqrt{2}/2$', cos: '$\\sqrt{2}/2$', tan: '$1$' }
      : { sin: '$\\sqrt{3}/2$', cos: '$1/2$', tan: '$\\sqrt{3}$' },
)
const circleParts = [
  { key: 'radius', label: '半径' },
  { key: 'diameter', label: '直径' },
  { key: 'chord', label: '弦' },
  { key: 'arc', label: '弧' },
  { key: 'tangent', label: '切线' },
  { key: 'sector', label: '扇形' },
  { key: 'segment', label: '弓形' },
]
const circleTheorems = [
  { key: 'centre', label: '圆心角与圆周角' },
  { key: 'diameter', label: '半圆直角' },
  { key: 'tangent', label: '切线与弦' },
  { key: 'cyclic', label: '内接四边形' },
]
// 弓形用弦直接闭合弧，与经圆心闭合的扇形区分。
const segmentPath = computed(() => `${arcPath(120)}Z`)
// 圆的术语、角定理和扇形计算各取当前选择的条件。
const circleText = computed(() => {
  if (mode.value === 16)
    return `角度占整周 $${sectorAngle.value}/360$；弧长 $l=${sectorAngle.value}/360\\times8\\pi$，面积 $A=${sectorAngle.value}/360\\times16\\pi$。扇形周长还要加 $2r=8$。`
  if (mode.value === 9)
    return (
      {
        centre:
          '劣弧 AB 对应圆心角 120°、圆周角 ACB=60°；C 处于另一段弧上。若改变所对弧，必须重新选圆心角。',
        diameter: 'AB 是直径，圆周上的第三点与 A、B 连线必形成 90°；直角的顶点在圆周，不在圆心。',
        tangent:
          '切点 A 处 OA 与切线垂直；图中弦 AB 与向上的切线夹角为 60°，也等于另一弓形的 ∠ACB。',
        cyclic: 'A 与 C 对角相加 180°，B 与 D 对角也相加 180°。这里四个顶点都在同一个圆上。',
      } as Record<string, string>
    )[theorem.value]!
  return (
    {
      radius: '半径：连接圆心 O 与圆上一点。',
      diameter: '直径：经过圆心的弦，长度等于两倍半径。',
      chord: '弦：两端都在圆上的线段；不必经过圆心。',
      arc: '绿色曲线是劣弧；同一对端点之间还有另一条优弧。',
      tangent: '切线只在切点接触圆，与该点半径垂直；不能把切线与任意弦都看成垂直。',
      sector: '绿色劣扇形由两条半径和一条劣弧围成；圆心在边界上。',
      segment: '绿色劣弓形由一条弦和一条劣弧围成，不能套成完整扇形。',
    } as Record<string, string>
  )[circlePart.value]!
})
const solids = [
  { key: 'cuboid', label: '长方体' },
  { key: 'prism', label: '三角柱' },
  { key: 'pyramid', label: '四棱锥' },
  { key: 'cylinder', label: '圆柱' },
  { key: 'cone', label: '圆锥' },
  { key: 'sphere', label: '球' },
  { key: 'hemisphere', label: '半球' },
]
// 多面体计数与曲面图形术语分开，避免把球套入面棱顶点规则。
const solidText = computed(
  () =>
    (
      ({
        cuboid: '体对角线跨越三个互相垂直的方向；面内对角线只涉及两个方向。',
        prism: '两个三角形底面全等且平行；三角柱有 5 个平面面、9 条棱和 6 个顶点。',
        pyramid:
          '四棱锥有一个四边形底面和四个三角形侧面，侧面汇聚于同一顶点。图中透视线只表达结构。',
        cylinder: '圆柱有两个圆形平面底面和一个曲面；图里的椭圆是圆的透视表示。',
        cone: '圆锥底面是圆，曲面汇聚成尖顶。图中的竖直虚线是高，斜边长不是这个高。',
        sphere: '球面是连续曲面，没有多面体意义下的棱或顶点；虚线只是帮助观察的截面示意。',
        hemisphere: '半球有一个半球曲面和一个圆形平面底面；总表面积与曲面面积不同。',
      }) as Record<string, string>
    )[solid.value]!,
)
const planCells = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: 2 },
  { x: 1, y: 1 },
]
// 两种堆叠保持相同的占地与正视最大高度，演示遮挡产生的不唯一性。
const stackHeights = computed(() => (maxStack.value ? [3, 3, 3, 2] : [3, 1, 1, 2]))
// 总数按逐格高度求和，正视轮廓则仍取各列最高处。
const planText = computed(
  () =>
    `左列最高为 3，右列最高为 2，所以正视轮廓相同。当前总数 ${stackHeights.value.reduce((a, b) => a + b, 0)}；最大方案可把左列每摞都加到 3，右列加到 2。`,
)
// 方位角从北顺时针量，故东分量用正弦、北分量用余弦。
const bearingPoint = computed(() => ({
  x: 250 + 105 * Math.sin((bearing.value * Math.PI) / 180),
  y: 155 - 105 * Math.cos((bearing.value * Math.PI) / 180),
}))
// 方位角超过半周时启用大弧，保持转向与三位数标识一致。
const bearingArc = computed(() => {
  const a = (bearing.value * Math.PI) / 180
  return `M250 117A38 38 0 ${bearing.value > 180 ? 1 : 0} 1 ${250 + 38 * Math.sin(a)} ${155 - 38 * Math.cos(a)}`
})
// 反向路线统一加半周并归一到一周以内。
const bearingText = computed(
  () =>
    `从当前位置看目标为 ${String(bearing.value).padStart(3, '0')}°；反过来从目标看当前位置为 ${String((bearing.value + 180) % 360).padStart(3, '0')}°。两者相差半周。`,
)
const areaShapes = [
  { name: '平行四边形', points: '80,220 380,220 460,70 160,70', value: 32 },
  { name: '三角形', points: '80,220 380,220 160,70', value: 16 },
  { name: '梯形', points: '80,220 380,220 310,70 160,70', value: 24 },
]
// 面积模型与数值共用记录，保持截面和计算的一致性。
const currentArea = computed(() => areaShapes[areaShape.value]!)
// 同一底高通过完整面积、一半面积或平行边平均得到结论。
const areaText = computed(
  () =>
    [
      String.raw`平行四边形面积 $8\times4=32$。将一端三角形平移到另一端，可拼成长方形。`,
      String.raw`三角形面积 $8\times4/2=16$；高是虚线的垂直距离，不是左侧斜边。`,
      String.raw`梯形面积 $(4+8)\times4/2=24$；先把两条平行边加起来。`,
    ][areaShape.value]!,
)
const cylinderModes = [
  { key: 'closed', label: '封闭总表面积' },
  { key: 'lateral', label: '仅侧面积' },
  { key: 'pipe', label: '空心材料体积' },
]
// 区分侧面、封闭表面和空心材料三个不同计算对象。
const cylinderText = computed(() =>
  cylinderMode.value === 'closed'
    ? String.raw`侧面积 $2\pi\times5\times6=60\pi$，两底面 $2\pi\times5^2=50\pi$，总表面积 $110\pi$。`
    : cylinderMode.value === 'lateral'
      ? String.raw`只取侧面积 $2\pi Rh=60\pi$。展开矩形的两边是 $10\pi$ 和 $6$；这里没有计入底面。`
      : String.raw`外半径 5、内半径 3、高 6，材料体积为 $\pi(5^2-3^2)\times6=96\pi$；不能把厚度 2 直接当半径。`,
)
</script>

<style scoped lang="scss">
.geometry-atlas {
  margin: 0;
  min-width: 0;
  max-width: 100%;
  padding: 22px;
  border: 1px solid #d8e6f7;
  border-radius: 14px;
  background: linear-gradient(145deg, #f4f8ff, #f7fcfb);
  color: #223954;
}
figcaption > span {
  color: #447093;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
h5 {
  margin: 9px 0 10px;
  font-size: 20px;
  color: #132f50;
}
p {
  line-height: 1.75;
  margin: 10px 0;
  overflow-wrap: anywhere;
}
.lead {
  color: #51647c;
  font-size: 14px;
}
.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 15px 0;
}
.controls :deep(.app-button.el-button) {
  white-space: normal;
  max-width: 100%;
  margin: 0;
  height: auto;
  min-height: 32px;
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-border: var(--color-learning-blue-line);
  --app-button-active-bg: var(--color-learning-blue-soft);
  --app-button-active-border: var(--color-learning-blue);
}
.controls :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue);
  --app-button-color: var(--color-ink-inverse);
  --app-button-hover-bg: var(--color-learning-blue);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue);
  --app-button-active-border: var(--color-learning-blue);
}
.scene {
  max-width: 100%;
  overflow-x: auto;
  border-radius: 10px;
  background: #fff;
}
svg {
  display: block;
  width: 100%;
  min-width: 400px;
  max-height: 365px;
}
svg text {
  fill: #294762;
  font: 15px sans-serif;
}
.shape {
  fill: #eaf2ff;
  stroke: #416bc3;
  stroke-width: 2;
  stroke-linejoin: round;
}
.highlight {
  fill: #d9f2eb;
  fill-opacity: 0.8;
  stroke: #148578;
  stroke-width: 2.5;
}
.circle-outline {
  fill: none;
  stroke: #7392bb;
  stroke-width: 2;
}
.hole {
  fill: white;
  stroke: #148578;
  stroke-width: 2;
}
.aux {
  fill: none;
  stroke: #8da0b6;
  stroke-width: 1.6;
  stroke-dasharray: 5 5;
}
.accent {
  fill: none;
  stroke: #315ed1;
  stroke-width: 2.5;
}
.green-line {
  fill: none;
  stroke: #148578;
  stroke-width: 3;
}
.axis {
  fill: none;
  stroke: #59708a;
  stroke-width: 1.4;
}
.grid {
  fill: none;
  stroke: #e8eef5;
  stroke-width: 1;
}
.dot {
  fill: #315ed1;
}
.green-dot {
  fill: #148578;
}
.large {
  font-size: 24px;
  font-weight: 700;
}
.result {
  background: #edf4ff;
  border-left: 3px solid #3b6bda;
  padding: 12px 15px;
  font-size: 15px;
}
.metrics {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 0;
}
.metrics > span {
  flex: 1 1 100px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #60758a;
}
.metrics strong {
  color: #176f66;
  font-size: 18px;
}
.hint,
.footnote {
  color: #75869a;
  font-size: 12px;
}
.footnote {
  margin-bottom: 0;
}
@media (max-width: 640px) {
  .geometry-atlas {
    padding: 15px;
  }
  h5 {
    font-size: 18px;
  }
  .controls {
    gap: 6px;
  }
  .result {
    padding: 10px 12px;
  }
}
</style>
