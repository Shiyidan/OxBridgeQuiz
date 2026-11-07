<!-- 数学1统计交互图解：按叶子节点演示选图、密度与累计频数、统计量比较及预测边界。 -->
<template>
  <figure
    class="statistics-atlas"
    :class="{ 'statistics-atlas--compact': compact }"
    aria-label="统计概念交互图解"
  >
    <figcaption>
      <span v-if="!compact" class="eyebrow">MATHEMATICS 1 · STATISTICS</span>
      <h5>
        {{
          mode === 'summary' && summaryView === 'grouped'
            ? '组中点估计均值，累计位置估计分位数'
            : headings[mode]
        }}
      </h5>
      <p>{{ introductions[mode] }}</p>
    </figcaption>

    <template v-if="mode === 'tables'">
      <div class="atlas-layout">
        <div class="atlas-stage">
          <div class="controls" role="group" aria-label="选择数据展示形式">
            <AppButton
              v-for="(label, index) in chartLabels"
              :key="label"
              size="small"
              :type="chart === index ? 'primary' : 'secondary'"
              :aria-pressed="chart === index"
              @click="chart = index"
              >{{ label }}</AppButton
            >
          </div>
          <div v-if="chart === 0" class="table-scroll">
            <table>
              <caption>
                通勤方式示意：每人只按主要方式计入一类
              </caption>
              <thead>
                <tr>
                  <th scope="col">人数</th>
                  <th scope="col">步行</th>
                  <th scope="col">骑车</th>
                  <th scope="col">公交</th>
                  <th scope="col">合计</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">甲组</th>
                  <td>12</td>
                  <td>8</td>
                  <td>10</td>
                  <td>30</td>
                </tr>
                <tr>
                  <th scope="row">乙组</th>
                  <td>18</td>
                  <td>12</td>
                  <td>20</td>
                  <td>50</td>
                </tr>
                <tr class="total">
                  <th scope="row">合计</th>
                  <td>30</td>
                  <td>20</td>
                  <td>30</td>
                  <td>80</td>
                </tr>
              </tbody>
            </table>
          </div>
          <svg
            v-else-if="chart === 1"
            viewBox="0 0 600 300"
            role="img"
            aria-label="三种通勤方式人数的条形图，步行30、骑车20、公交30"
          >
            <title>类别之间留空，柱高表示人数</title>
            <path d="M70 30V250H560" class="axis" />
            <g v-for="tick in [0, 20, 40, 60]" :key="tick">
              <text x="58" :y="255 - tick * 3.4" text-anchor="end">{{ tick }}</text>
              <path :d="'M70 ' + (250 - tick * 3.4) + 'H550'" class="grid" />
            </g>
            <g v-for="(activity, index) in activities" :key="activity.label">
              <rect
                :x="110 + index * 150"
                :y="250 - activity.count * 3.4"
                width="85"
                :height="activity.count * 3.4"
                :fill="activity.color"
              />
              <text :x="152 + index * 150" :y="240 - activity.count * 3.4" text-anchor="middle">
                {{ activity.count }}
              </text>
              <text :x="152 + index * 150" y="278" text-anchor="middle">{{ activity.label }}</text>
            </g>
            <text x="28" y="25">人数</text>
          </svg>
          <div v-else-if="chart === 2" class="pie-layout">
            <svg
              viewBox="0 0 320 290"
              role="img"
              aria-label="通勤饼图：步行37.5%、骑车25%、公交37.5%"
            >
              <title>总数80，每个人对应4.5度</title>
              <path
                v-for="slice in pieSlices"
                :key="slice.label"
                :d="slice.path"
                :fill="slice.color"
                stroke="white"
                stroke-width="3"
              />
            </svg>
            <ul class="legend">
              <li v-for="activity in activities" :key="activity.label">
                <i :style="{ background: activity.color }" aria-hidden="true"></i>
                {{ activity.label }}：{{ activity.count }}人 · {{ (activity.count / 80) * 100 }}% ·
                {{ activity.count * 4.5 }}°
              </li>
            </ul>
          </div>
          <div v-else-if="chart === 3" class="pictograms">
            <p>图例：<span class="person-dot">●</span> = 5人。仍是同一组80人的通勤数据。</p>
            <div v-for="activity in activities" :key="activity.label" class="pictogram-row">
              <strong>{{ activity.label }}</strong>
              <span class="dots" :aria-label="activity.count + '人'"
                ><span
                  v-for="n in activity.count / 5"
                  :key="n"
                  :style="{ color: activity.color }"
                  aria-hidden="true"
                  >●</span
                ></span
              >
              <span>{{ activity.count }}人</span>
            </div>
          </div>
          <svg
            v-else-if="chart === 4"
            viewBox="0 0 600 300"
            role="img"
            aria-label="概念示意：每户自行车数0至4辆的频数分别为1、3、5、2、1"
          >
            <title>离散数值竖线图：横坐标是真实数量，纵坐标是频数</title>
            <path d="M70 35V250H560" class="axis" />
            <g v-for="tick in [0, 1, 2, 3, 4, 5]" :key="tick">
              <text x="58" :y="255 - tick * 38" text-anchor="end">{{ tick }}</text>
            </g>
            <g v-for="(frequency, index) in [1, 3, 5, 2, 1]" :key="index">
              <path
                :d="'M' + (120 + index * 90) + ' 250V' + (250 - frequency * 38)"
                class="vertical"
              />
              <circle :cx="120 + index * 90" :cy="250 - frequency * 38" r="5" class="point" />
              <text :x="120 + index * 90" y="274" text-anchor="middle">{{ index }}</text>
            </g>
            <text x="20" y="24">户数</text>
            <text x="575" y="297" text-anchor="end">每户自行车数 / 辆</text>
          </svg>
          <svg
            v-else
            viewBox="0 0 600 300"
            role="img"
            aria-label="概念示意：上午8、9、11、12时的气温分别为12、14、18、17摄氏度"
          >
            <title>不等时间间隔在横轴上也不等距，折线只连接已有观测</title>
            <path d="M70 25V250H560" class="axis" />
            <g v-for="tick in [0, 5, 10, 15, 20]" :key="tick">
              <text x="58" :y="255 - tick * 10" text-anchor="end">{{ tick }}</text>
            </g>
            <path d="M100 130L200 110L400 70L500 80" class="trend" />
            <g v-for="observation in timeData" :key="observation.time">
              <circle
                :cx="100 + (observation.time - 8) * 100"
                :cy="250 - observation.temperature * 10"
                r="5"
                class="point"
              />
              <text :x="100 + (observation.time - 8) * 100" y="277" text-anchor="middle">
                {{ observation.time }}时
              </text>
              <text
                :x="100 + (observation.time - 8) * 100"
                :y="238 - observation.temperature * 10"
                text-anchor="middle"
              >
                {{ observation.temperature }}°C
              </text>
            </g>
            <text x="12" y="20">气温 / °C</text>
          </svg>
        </div>
        <div class="atlas-notes">
          <p class="insight">{{ chartNotes[chart] }}</p>
        </div>
      </div>
    </template>

    <template v-else-if="mode === 'grouped'">
      <div class="atlas-layout">
        <div class="atlas-stage">
          <div class="controls" role="group" aria-label="选择分组图">
            <AppButton
              size="small"
              :type="cumulative ? 'secondary' : 'primary'"
              :aria-pressed="!cumulative"
              @click="cumulative = false"
              >直方图：看面积</AppButton
            >
            <AppButton
              size="small"
              :type="cumulative ? 'primary' : 'secondary'"
              :aria-pressed="cumulative"
              @click="cumulative = true"
              >累计图：看增量</AppButton
            >
          </div>
          <svg
            v-if="!cumulative"
            viewBox="0 0 600 320"
            role="img"
            aria-label="不等组距直方图：宽10、10、20，密度1、2、1，频数10、20、20"
          >
            <title>同为20人，宽组柱高更低；突出20至40分钟组对照密度和面积</title>
            <path d="M70 40V260H550" class="axis" />
            <g v-for="(group, index) in groups" :key="group.label">
              <rect
                :x="70 + group.lower * 11"
                :y="260 - group.density * 95"
                :width="group.width * 11"
                :height="group.density * 95"
                :class="groupIndex === index ? 'histogram selected' : 'histogram'"
              />
              <text
                :x="70 + (group.lower + group.width / 2) * 11"
                :y="247 - group.density * 95"
                text-anchor="middle"
              >
                {{ group.frequency }}人
              </text>
            </g>
            <g v-for="tick in [0, 10, 20, 30, 40]" :key="tick">
              <text :x="70 + tick * 11" y="286" text-anchor="middle">{{ tick }}</text>
            </g>
            <g v-for="tick in [0, 1, 2]" :key="tick">
              <text x="57" :y="265 - tick * 95" text-anchor="end">{{ tick }}</text>
            </g>
            <text x="12" y="23">频数密度 / 人每分钟</text>
            <text x="575" y="312" text-anchor="end">等待时间 / 分钟</text>
          </svg>
          <svg
            v-else
            viewBox="0 0 600 320"
            role="img"
            aria-label="累计图经0,0、10,10、20,30、40,50，突出20至40分钟组查看两端累计差"
          >
            <title>每一组的人数等于该段累计高度之差</title>
            <path d="M70 30V260H550" class="axis" />
            <rect
              :x="70 + activeGroup.lower * 11"
              y="35"
              :width="activeGroup.width * 11"
              height="225"
              class="highlight-area"
            />
            <path d="M70 260L180 218L290 134L510 50" class="trend" />
            <path
              :d="'M70 ' + (260 - activeGroup.before * 4.2) + 'H' + (70 + activeGroup.lower * 11)"
              class="guide"
            />
            <path
              :d="
                'M70 ' +
                (260 - activeGroup.after * 4.2) +
                'H' +
                (70 + (activeGroup.lower + activeGroup.width) * 11)
              "
              class="guide"
            />
            <g
              v-for="point in [
                { x: 0, y: 0 },
                { x: 10, y: 10 },
                { x: 20, y: 30 },
                { x: 40, y: 50 },
              ]"
              :key="point.x"
            >
              <circle :cx="70 + point.x * 11" :cy="260 - point.y * 4.2" r="5" class="point" />
              <text v-if="point.x > 0" :x="78 + point.x * 11" :y="248 - point.y * 4.2">
                {{ point.y }}
              </text>
            </g>
            <g v-for="tick in [0, 10, 20, 30, 40]" :key="tick">
              <text :x="70 + tick * 11" y="286" text-anchor="middle">{{ tick }}</text>
            </g>
            <g v-for="tick in [0, 10, 20, 30, 40, 50]" :key="tick">
              <text x="56" :y="265 - tick * 4.2" text-anchor="end">{{ tick }}</text>
            </g>
            <text x="10" y="20">累计人数</text>
            <text x="575" y="312" text-anchor="end">等待时间 / 分钟</text>
          </svg>
        </div>
        <div class="atlas-notes">
          <div class="metrics" aria-live="polite">
            <div>
              <span>组距</span><strong>{{ activeGroup.width }}分钟</strong>
            </div>
            <div>
              <span>频数密度</span><strong>{{ activeGroup.density }}人/分钟</strong>
            </div>
            <div>
              <span>频数</span><strong>{{ activeGroup.frequency }}人</strong>
            </div>
          </div>
          <p class="insight" aria-live="polite">
            {{
              cumulative
                ? '累计增量：' +
                  activeGroup.after +
                  ' − ' +
                  activeGroup.before +
                  ' = ' +
                  activeGroup.frequency +
                  '人。曲线的高度不能直接当这一组人数。'
                : '面积 = 宽 × 高：' +
                  activeGroup.width +
                  ' × ' +
                  activeGroup.density +
                  ' = ' +
                  activeGroup.frequency +
                  '人。第三组宽度加倍，人数相同也可以柱高减半。'
            }}
          </p>
          <p class="caption">
            概念示意，共50人。累计图按组内均匀分布用直线段连接，实际组内分布未知。
          </p>
        </div>
      </div>
    </template>

    <template v-else-if="mode === 'summary'">
      <div class="controls" role="group" aria-label="选择统计量观察">
        <AppButton
          size="small"
          :type="summaryView === 'raw' ? 'primary' : 'secondary'"
          :aria-pressed="summaryView === 'raw'"
          @click="summaryView = 'raw'"
          >极端值与箱线比较</AppButton
        >
        <AppButton
          size="small"
          :type="summaryView === 'grouped' ? 'primary' : 'secondary'"
          :aria-pressed="summaryView === 'grouped'"
          @click="summaryView = 'grouped'"
          >分组估计</AppButton
        >
      </div>
      <template v-if="summaryView === 'raw'">
        <div class="atlas-layout">
          <div class="atlas-stage">
            <div class="controls">
              <AppButton
                size="small"
                :type="extreme ? 'primary' : 'secondary'"
                :aria-pressed="extreme"
                @click="extreme = !extreme"
                >{{ extreme ? '还原最大值：27 → 7' : '只改最大值：7 → 27' }}</AppButton
              >
            </div>
            <div class="number-strip" aria-label="已排序的数据">
              <span
                v-for="(value, index) in rawData"
                :key="index"
                :class="{ changed: extreme && index === 8, median: index === 4 }"
                >{{ value }}</span
              >
            </div>
            <svg
              viewBox="0 0 600 250"
              role="img"
              :aria-label="
                '箱线图比较：原数据中位数4、四分位距2.5；当前中位数4、四分位距2.5，最大值' +
                (extreme ? 27 : 7)
              "
            >
              <title>同一尺度比较：中间50%不动，最大值影响均值和极差</title>
              <g v-for="(maximum, index) in [7, extreme ? 27 : 7]" :key="index">
                <text x="12" :y="67 + index * 70">{{ index ? '当前' : '原始' }}</text>
                <path
                  :d="'M' + scaleData(2) + ' ' + (60 + index * 70) + 'H' + scaleData(maximum)"
                  class="box-whisker"
                />
                <path
                  :d="
                    'M' +
                    scaleData(2) +
                    ' ' +
                    (46 + index * 70) +
                    'v28M' +
                    scaleData(maximum) +
                    ' ' +
                    (46 + index * 70) +
                    'v28'
                  "
                  class="box-whisker"
                />
                <rect
                  :x="scaleData(3)"
                  :y="41 + index * 70"
                  :width="scaleData(5.5) - scaleData(3)"
                  height="38"
                  class="box"
                />
                <path
                  :d="'M' + scaleData(4) + ' ' + (41 + index * 70) + 'v38'"
                  class="median-line"
                />
              </g>
              <path d="M85 180H565" class="axis" />
              <g v-for="tick in [0, 5, 10, 15, 20, 25, 30]" :key="tick">
                <text :x="scaleData(tick)" y="205" text-anchor="middle">{{ tick }}</text>
              </g>
              <text x="575" y="240" text-anchor="end">示意数值 / 同一单位</text>
            </svg>
          </div>
          <div class="atlas-notes">
            <div class="metrics" aria-live="polite">
              <div>
                <span>均值</span><strong>{{ mean.toFixed(2) }}</strong>
              </div>
              <div><span>中位数</span><strong>4</strong></div>
              <div>
                <span>极差</span><strong>{{ extreme ? 25 : 5 }}</strong>
              </div>
              <div><span>IQR</span><strong>2.5</strong></div>
            </div>
            <LatexText
              class="insight"
              text="9个数先排好；中位数为第5个。排除中位数后，$Q_1=(3+3)/2=3$，$Q_3=(5+6)/2=5.5$，所以 $IQR=2.5$。"
            />
            <p class="caption">
              概念示意。箱体覆盖中间50%，须线明确取最小值与最大值；这里不使用“1.5×IQR另标离群点”的画法。此例IQR不变，不代表所有样本都如此。
            </p>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="atlas-layout">
          <div class="atlas-stage">
            <div class="table-scroll">
              <table>
                <caption>
                  沿用50人等待时间示意：把组内每人暂放到中点
                </caption>
                <thead>
                  <tr>
                    <th scope="col">区间 / 分钟</th>
                    <th scope="col">频数 f</th>
                    <th scope="col">中点 m</th>
                    <th scope="col">fm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="group in groups" :key="group.label">
                    <th scope="row">{{ group.label }}</th>
                    <td>{{ group.frequency }}</td>
                    <td>{{ group.lower + group.width / 2 }}</td>
                    <td>{{ group.frequency * (group.lower + group.width / 2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="atlas-notes">
            <LatexText
              class="equation"
              text="估计均值 $=\dfrac{10\times5+20\times15+20\times30}{50}=19$ 分钟"
            />

            <div class="controls" role="group" aria-label="选择累计位置">
              <AppButton
                v-for="(item, index) in quartileReadings"
                :key="item.label"
                size="small"
                :type="quartileIndex === index ? 'primary' : 'secondary'"
                :aria-pressed="quartileIndex === index"
                @click="quartileIndex = index"
                >{{ item.label }}</AppButton
              >
            </div>
            <div class="calculation" aria-live="polite">
              <p>
                累计位置 {{ activeQuartile.rank }} / 50，落在 {{ activeQuartile.group }} 分钟组。
              </p>
              <LatexText :text="activeQuartile.formula" />
            </div>

            <p class="insight">
              估计IQR = 27.5 − 11.25 =
              16.25分钟。均值19与中位数17.5并不相同；前者用中点加权，后者找累计的一半。
            </p>
            <p class="caption">
              组内均匀是估计假设。人数最多的组有两组并列；密度最高的10至20分钟组最集中。组界给出的极差粗估40分钟，并不证明观测到了0与40。
            </p>
          </div>
        </div>
      </template>
    </template>

    <template v-else>
      <div class="atlas-layout">
        <div class="atlas-stage">
          <div class="controls" role="group" aria-label="选择散点关系">
            <AppButton
              v-for="(label, index) in scatterLabels"
              :key="label"
              size="small"
              :type="scatterIndex === index ? 'primary' : 'secondary'"
              :aria-pressed="scatterIndex === index"
              @click="scatterIndex = index"
              >{{ label }}</AppButton
            >
          </div>
          <div v-if="scatterIndex < 2" class="controls" role="group" aria-label="选择预测范围">
            <AppButton
              size="small"
              :type="prediction === 4 ? 'primary' : 'secondary'"
              :aria-pressed="prediction === 4"
              @click="prediction = 4"
              >内插：x = 4</AppButton
            >
            <AppButton
              size="small"
              :type="prediction === 11 ? 'primary' : 'secondary'"
              :aria-pressed="prediction === 11"
              @click="prediction = 11"
              >外推：x = 11</AppButton
            >
          </div>
          <svg viewBox="0 0 600 365" role="img" :aria-label="scatterDescription">
            <title>{{ scatterDescription }}</title>
            <rect x="105" y="35" width="280" height="280" class="observed-area" />
            <path d="M65 25V315H560" class="axis" />
            <text x="115" y="53" class="zone-label">观察范围：1～8</text>
            <g v-for="tick in [0, 2, 4, 6, 8, 10, 12]" :key="tick">
              <text :x="65 + tick * 40" y="339" text-anchor="middle">{{ tick }}</text>
            </g>
            <g v-for="tick in [0, 4, 8, 12, 16]" :key="tick">
              <text x="53" :y="320 - tick * 16" text-anchor="end">{{ tick }}</text>
            </g>
            <g v-if="scatterIndex < 2">
              <path :d="fitPath" class="fit" />
              <path :d="extensionPath" class="fit extension" />
              <path :d="'M' + predictionX + ' 315V' + predictionY + 'H65'" class="guide" />
              <circle :cx="predictionX" :cy="predictionY" r="7" class="prediction" />
              <text :x="predictionX - 8" :y="predictionY - 12" text-anchor="end">
                估计 {{ predictedValue }}
              </text>
            </g>
            <circle
              v-for="(point, index) in scatterPoints"
              :key="index"
              :cx="65 + point.x * 40"
              :cy="315 - point.y * 16"
              r="5.5"
              class="point"
            />
            <text x="25" y="20">y</text>
            <text x="558" y="360">x</text>
          </svg>
        </div>
        <div class="atlas-notes">
          <p class="insight" aria-live="polite">{{ scatterNote }}</p>
          <div class="causation">
            <strong>同向变化 ≠ 已证实因果</strong>
            <span>气温升高 → 冰淇淋销量增加</span>
            <span>气温升高 → 游泳人数增加</span>
          </div>
          <p class="caption">
            概念示意数据。直线是展示总体趋势的估计线，不是通过每个观测点的折线；没有显著直线趋势时不强画拟合直线。
          </p>
        </div>
      </div>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string; compact?: boolean }>()
type StatisticsMode = 'tables' | 'grouped' | 'summary' | 'scatter'
// 每个考纲叶子使用独立教学情景；整章入口回到图表选择。
const mode = computed<StatisticsMode>(
  () =>
    (
      ({
        '110601': 'tables',
        '110602': 'grouped',
        '110603': 'summary',
        '110604': 'scatter',
      }) as Record<string, StatisticsMode>
    )[props.topic] ?? 'tables',
)
const headings: Record<StatisticsMode, string> = {
  tables: '同一份数据，换一种读法',
  grouped: '宽度变了，柱高不能直接比人数',
  summary: '只改一个极端值，哪些统计量会动？',
  scatter: '先看关联，再看预测有没有越界',
}
const introductions: Record<StatisticsMode, string> = {
  tables: '通勤数据切换四种表达；离散数值与时间序列另用概念示意。',
  grouped: '以 20 ≤ t ≤ 40 分钟组为例，对照直方图面积与累计人数的增量。',
  summary: '同一尺度的箱线图看中心与分散；分组数据则需要明确估计假设。',
  scatter: '切换点的分布与预测位置，观察趋势、非线性关系和外推风险。',
}
const chart = ref(0)
const chartLabels = ['双向表', '条形图', '扇形图', '象形图', '离散竖线图', '时间折线图']
const activities = [
  { label: '步行', count: 30, color: '#3676d9' },
  { label: '骑车', count: 20, color: '#12928e' },
  { label: '公交', count: 30, color: '#9b79cc' },
]
const chartNotes = [
  '甲组步行12人，占甲组12/30，占全体12/80。分子相同，分母随所问人群改变。补表时可由行合计与列合计分别核对。',
  '柱高直接表示人数，三类合计80人。步行与公交同为30人；类别之间留空，不按柱面积读数。',
  '每人对应360÷80=4.5°。步行30人占37.5%，扇形角为135°；人数、百分比、角度是三种不同读数。',
  '每个圆点代表5人。步行6个圆点对应30人，骑车4个圆点对应20人；先看图例再计数。',
  '横轴是自行车数量，竖线高是对应户数。不要把竖线之间的面积当频数；总户数为1+3+5+2+1=12。',
  '9到11时跨两小时，所以横向间隔是8到9时的两倍。两段都升高2°C每小时，但连线不保证中间每刻按此速率变化。',
]
const timeData = [
  { time: 8, temperature: 12 },
  { time: 9, temperature: 14 },
  { time: 11, temperature: 18 },
  { time: 12, temperature: 17 },
]
// 按示意数据的实际人数比例计算SVG弧段，避免扇形面积与标注角度不一致。
const pieSlices = computed(() => {
  let angle = -Math.PI / 2
  return activities.map((activity) => {
    const start = angle
    angle += (activity.count / 80) * Math.PI * 2
    return {
      ...activity,
      path:
        'M160 145L' +
        (160 + 120 * Math.cos(start)) +
        ' ' +
        (145 + 120 * Math.sin(start)) +
        'A120 120 0 ' +
        (angle - start > Math.PI ? 1 : 0) +
        ' 1 ' +
        (160 + 120 * Math.cos(angle)) +
        ' ' +
        (145 + 120 * Math.sin(angle)) +
        'Z',
    }
  })
})
const groups = [
  { label: '0 ≤ t < 10', lower: 0, width: 10, frequency: 10, density: 1, before: 0, after: 10 },
  { label: '10 ≤ t < 20', lower: 10, width: 10, frequency: 20, density: 2, before: 10, after: 30 },
  { label: '20 ≤ t ≤ 40', lower: 20, width: 20, frequency: 20, density: 1, before: 30, after: 50 },
]
const cumulative = ref(false)
// 固定展示宽组，集中比较同一频数在直方图面积与累计增量中的表达。
const groupIndex = 2
const activeGroup = groups[groupIndex]!
const summaryView = ref<'raw' | 'grouped'>('raw')
const extreme = ref(false)
// 仅改变最大值，保留其他观察，隔离极端值对统计量的影响。
const rawData = computed(() => [2, 3, 3, 4, 4, 5, 5, 6, extreme.value ? 27 : 7])
// 均值始终来自当前全部观察，不用四舍五入后的均值反推总数。
const mean = computed(
  () => rawData.value.reduce((total, value) => total + value, 0) / rawData.value.length,
)
// 两幅箱线图共用0至30尺度，防止自动缩放掩盖分散程度的变化。
function scaleData(value: number): number {
  return 85 + value * 16
}
const quartileIndex = ref(1)
const quartileReadings = [
  {
    label: 'Q₁：累计25%',
    rank: 12.5,
    group: '10至20',
    formula: '$Q_1=10+\\dfrac{12.5-10}{20}\\times10=11.25$ 分钟',
  },
  {
    label: '中位数：累计50%',
    rank: 25,
    group: '10至20',
    formula: '$M=10+\\dfrac{25-10}{20}\\times10=17.5$ 分钟',
  },
  {
    label: 'Q₃：累计75%',
    rank: 37.5,
    group: '20至40',
    formula: '$Q_3=20+\\dfrac{37.5-30}{20}\\times20=27.5$ 分钟',
  },
]
// 连续分组采用累计比例内插，与原始离散数据的上下半组约定明确分开。
const activeQuartile = computed(() => quartileReadings[quartileIndex.value] ?? quartileReadings[1]!)
const scatterIndex = ref(0)
const prediction = ref(4)
const scatterLabels = ['正相关', '负相关', '曲线关系', '无明显趋势']
const scatterValues = [
  [2, 3.3, 3.7, 5.5, 5.8, 7.3, 7.5, 9],
  [12, 11.3, 9.7, 9.5, 7.8, 7.3, 5.5, 5],
  [12, 7, 4, 2, 2, 4, 7, 12],
  [5, 12, 3, 9, 11, 4, 12, 6],
]
// 每个点保留原有成对关系；曲线和无趋势情景不强制绘制线性拟合。
const scatterPoints = computed(() =>
  (scatterValues[scatterIndex.value] ?? scatterValues[0]!).map((y, index) => ({ x: index + 1, y })),
)
// 两条线均为整体趋势的教学估计，不声称是最小二乘计算结果。
function fitValue(x: number): number {
  return scatterIndex.value === 1 ? 13 - x : x + 1
}
// 实线只覆盖已有观测区间，虚线承担区间外的模型延伸。
const fitPath = computed(
  () => 'M105 ' + (315 - fitValue(1) * 16) + 'L385 ' + (315 - fitValue(8) * 16),
)
// 虚线从右侧已知边界出发，避免将外推包装为已观测事实。
const extensionPath = computed(
  () => 'M385 ' + (315 - fitValue(8) * 16) + 'L505 ' + (315 - fitValue(11) * 16),
)
// 预测值读取同一条拟合线，不取最近的散点作为线性预测值。
const predictedValue = computed(() => fitValue(prediction.value))
// 横坐标映射与所有散点、边界共用比例尺。
const predictionX = computed(() => 65 + prediction.value * 40)
// 纵坐标向下递增，映射时从横轴高度减去数值高度。
const predictionY = computed(() => 315 - predictedValue.value * 16)
// 图形替代文本同步交互状态，便于无图阅读当前预测范围。
const scatterDescription = computed(
  () =>
    scatterLabels[scatterIndex.value] +
    '的成对数据示意；' +
    (scatterIndex.value < 2
      ? '预测x=' +
        prediction.value +
        '，' +
        (prediction.value > 8 ? '超出已观察范围' : '在已观察范围内')
      : '不绘制直线预测'),
)
// 说明分别覆盖方向、非线性和未知关系，并对外推明确提示模型边界。
const scatterNote = computed(() => {
  if (scatterIndex.value === 2)
    return 'U形数据没有明显单向直线趋势，却有清晰的曲线关系。“没有线性相关”不等于“没有关系”。此时不强画直线。'
  if (scatterIndex.value === 3)
    return '这批点没有明显趋势；只能描述当前证据，不能断言总体绝无关系或因果。少量样本也可能隐藏模式。'
  return (
    (scatterIndex.value === 1 ? 'x增大时y总体减小，属负相关。' : 'x增大时y总体增大，属正相关。') +
    (prediction.value > 8
      ? 'x=11超出已观察的1至8，是外推；虚线假设趋势继续，现实可能改变。'
      : 'x=4在已观察的1至8内，是内插；估计线不必穿每个散点，个体值仍会波动。')
  )
})
// 切换知识点时回到该点的基础情景，避免带入上一节尚未解释的交互状态。
watch(
  () => props.topic,
  () => {
    chart.value = 0
    cumulative.value = false
    summaryView.value = 'raw'
    extreme.value = false
    quartileIndex.value = 1
    scatterIndex.value = 0
    prediction.value = 4
  },
)
</script>

<style scoped>
.statistics-atlas {
  margin: 0;
  padding: 22px;
  min-width: 0;
  background: var(--color-learning-blue-soft, #f1f6ff);
  border: 1px solid var(--color-learning-blue-line, #cedfff);
  border-radius: 12px;
  color: var(--color-text-primary, #23384d);
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 1.4px;
  color: var(--color-learning-blue, #2758cc);
}
h5 {
  margin: 8px 0;
  font-size: 21px;
}
p {
  line-height: 1.7;
  margin: 10px 0;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0;
}
.controls :deep(.app-button) {
  margin: 0;
  max-width: 100%;
  height: auto;
  min-height: 32px;
  white-space: normal;
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue-soft);
  --app-button-active-border: var(--color-learning-blue);
}
.controls :deep(.app-button--primary) {
  --app-button-bg: var(--color-learning-blue);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-blue);
  --app-button-hover-bg: var(--color-learning-blue);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue);
  --app-button-active-border: var(--color-learning-blue);
}
svg {
  display: block;
  width: 100%;
  max-height: 365px;
  font-size: 14px;
  fill: #294761;
  overflow: visible;
}
.axis {
  fill: none;
  stroke: #7891a6;
  stroke-width: 1.5;
}
.grid {
  fill: none;
  stroke: #dae5f0;
}
.point {
  fill: #2763be;
  stroke: white;
  stroke-width: 1.5;
}
.trend,
.vertical {
  fill: none;
  stroke: #217e9b;
  stroke-width: 3;
}
.histogram {
  fill: #d3e3fc;
  stroke: #487bb9;
}
.histogram.selected {
  fill: #79bcb7;
  stroke: #16776f;
  stroke-width: 2;
}
.highlight-area,
.observed-area {
  fill: #ccece6;
  opacity: 0.5;
}
.guide {
  fill: none;
  stroke: #9a6940;
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
}
.zone-label {
  font-size: 12px;
  fill: #267f72;
}
.fit {
  fill: none;
  stroke: #119182;
  stroke-width: 2;
}
.extension {
  stroke-dasharray: 6 5;
}
.prediction {
  fill: white;
  stroke: #a16a34;
  stroke-width: 2;
}
.table-scroll {
  width: 100%;
  overflow-x: auto;
  margin: 14px 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background: white;
}
caption {
  padding: 9px;
  font-size: 13px;
  text-align: left;
}
th,
td {
  padding: 11px 12px;
  border: 1px solid #d9e3ee;
  text-align: center;
  white-space: nowrap;
}
thead,
.total {
  background: #e6effb;
}
.pie-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}
.legend {
  list-style: none;
  margin: 0;
  padding: 0;
}
.legend li {
  margin: 12px 0;
  line-height: 1.7;
  font-size: 14px;
}
.legend i {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}
.pictogram-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  gap: 10px;
  align-items: center;
  padding: 12px 0;
}
.dots {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  font-size: 17px;
}
.person-dot {
  color: #3676d9;
}
.insight {
  display: block;
  border-left: 3px solid #139487;
  padding: 8px 0 8px 13px;
  margin-top: 15px;
  line-height: 1.8;
}
.caption {
  font-size: 12px;
  color: #5d7084;
}
.metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 12px 0;
}
.metrics > div {
  flex: 1 1 85px;
  padding: 10px;
  background: white;
  border-radius: 7px;
  display: grid;
  gap: 5px;
}
.metrics span {
  font-size: 12px;
  color: #60748c;
}
.metrics strong {
  font-size: 19px;
  color: #2758b6;
}
.number-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}
.number-strip span {
  padding: 6px 10px;
  border-radius: 5px;
  background: white;
}
.number-strip .median {
  background: #cee9e2;
  color: #096e61;
}
.number-strip .changed {
  color: #945a27;
  background: #fff0d7;
}
.box-whisker {
  fill: none;
  stroke: #417b96;
  stroke-width: 2;
}
.box {
  fill: #d0e7f2;
  stroke: #417b96;
  stroke-width: 2;
}
.median-line {
  stroke: #176b77;
  stroke-width: 3;
}
.equation,
.calculation {
  display: block;
  margin: 12px 0;
  padding: 14px;
  background: white;
  border-radius: 8px;
  overflow-x: auto;
  line-height: 1.8;
}
.causation {
  display: grid;
  gap: 8px;
  margin-top: 15px;
  padding: 14px;
  background: #e2f2ef;
  border-radius: 8px;
  font-size: 14px;
}
@media (max-width: 600px) {
  /* SVG随容器缩放，移动端提高设计字号，并用右端对齐的轴标签保留安全边距。 */
  .statistics-atlas svg text {
    font-size: 24px;
  }
  .statistics-atlas {
    padding: 14px;
  }
  h5 {
    font-size: 18px;
  }
  .pie-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .pie-layout svg {
    max-height: 220px;
  }
  .legend li {
    margin: 6px 0;
  }
}

/* 紧凑讲义按内容容器宽度分栏，图形最多600px，标注不随整页宽度被放大。 */
.atlas-layout,
.atlas-stage,
.atlas-notes {
  display: contents;
}
.statistics-atlas--compact {
  container-type: inline-size;
  padding: 14px 16px;
  border-radius: 8px;
  background: #f7faff;
}
.statistics-atlas--compact .atlas-layout {
  display: grid;
  gap: 12px 24px;
  align-items: start;
}
.statistics-atlas--compact .atlas-stage {
  display: block;
  width: 100%;
  max-width: 600px;
  min-width: 0;
  overflow-x: auto;
}
.statistics-atlas--compact .atlas-notes {
  display: block;
  min-width: 0;
}
.statistics-atlas--compact h5 {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 4px;
}
.statistics-atlas--compact figcaption p {
  font-size: 14px;
  margin: 0 0 8px;
}
.statistics-atlas--compact .controls {
  margin: 8px 0;
  gap: 6px;
}
.statistics-atlas--compact .atlas-stage > svg {
  max-width: 600px;
  min-width: 520px;
  max-height: none;
}
.statistics-atlas--compact .atlas-stage > svg text {
  font-size: 16px;
}
.statistics-atlas--compact .zone-label {
  font-size: 14px;
}
.statistics-atlas--compact .table-scroll {
  margin: 8px 0;
}
.statistics-atlas--compact .metrics {
  margin: 8px 0;
  gap: 6px;
}
.statistics-atlas--compact .metrics > div {
  padding: 6px 8px;
  border-radius: 4px;
}
.statistics-atlas--compact .metrics strong {
  font-size: 17px;
}
.statistics-atlas--compact .insight {
  margin-top: 8px;
  padding: 6px 0 6px 10px;
  font-size: 15px;
}
.statistics-atlas--compact .caption {
  font-size: 13px;
}
.statistics-atlas--compact .number-strip {
  margin: 8px 0;
  gap: 5px;
}
.statistics-atlas--compact .equation,
.statistics-atlas--compact .calculation {
  padding: 8px;
  margin: 8px 0;
}
.statistics-atlas--compact .causation {
  padding: 10px;
  border-radius: 4px;
}
@container (min-width: 880px) {
  .statistics-atlas--compact .atlas-layout {
    grid-template-columns: minmax(0, 600px) minmax(240px, 1fr);
  }
}
</style>
