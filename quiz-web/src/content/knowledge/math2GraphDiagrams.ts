// 函数图像章的分块辅助图：同轴比较关键特征，按正文方法就近展示，避免不同方法重复整组图。
import { sample, type Math2MethodDiagram } from './math2MethodDiagrams'

const blue = '#2453cd'
const green = '#087f76'
const amber = '#b86e21'
const gray = '#91a0b5'
const integerTicks = [-1, 0, 1, 2].map((value) => ({ value, label: String(value) }))
const piTicks = [
  { value: -Math.PI, label: '−π' },
  { value: -Math.PI / 2, label: '−π/2' },
  { value: 0, label: '0' },
  { value: Math.PI / 2, label: 'π/2' },
  { value: Math.PI, label: 'π' },
]

export const math2GraphDiagrams: Record<string, Record<string, Math2MethodDiagram[]>> = {
  '120801': {
    用少量特征识别基本图像: [
      {
        title: '平方与立方：对称和升降不同',
        description:
          '同一坐标系中，平方函数关于纵轴对称且先减后增，立方函数关于原点对称且持续递增，两者均经过原点。',
        caption:
          'x² 在原点转向；x³ 只在原点变平，仍持续递增。过同一点、斜率同为零，不能推出相同形状。',
        domain: [-2, 2],
        range: [-3.5, 3.5],
        curves: [
          { points: sample((x) => x * x, -1.8, 1.8), color: blue },
          { points: sample((x) => x ** 3, -1.5, 1.5), color: green },
        ],
        dots: [[0, 0]],
        labels: [],
        xTicks: integerTicks.filter((t) => t.value < 2),
        yTicks: [
          { value: -2, label: '−2' },
          { value: 2, label: '2' },
        ],
        legend: [
          { text: 'y＝x²', color: blue },
          { text: 'y＝x³', color: green },
        ],
      },
      {
        title: '平方根与绝对值：范围不同',
        description: '平方根函数从原点向右延伸，绝对值函数在原点形成 V 形，并关于纵轴对称。',
        caption: '√x 只接受非负输入；|x| 在两侧都有定义。二者都不取负值，但定义域和对称性不同。',
        domain: [-2.5, 2.5],
        range: [-0.4, 2.8],
        curves: [
          { points: sample((x) => Math.sqrt(x), 0, 2.4), color: blue },
          {
            points: [
              [-2.4, 2.4],
              [0, 0],
              [2.4, 2.4],
            ],
            color: green,
          },
        ],
        dots: [
          [0, 0],
          [1, 1],
        ],
        labels: [],
        xTicks: integerTicks,
        yTicks: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
        ],
        legend: [
          { text: 'y＝√x', color: blue },
          { text: 'y＝|x|', color: green },
        ],
      },
      {
        title: '正弦与余弦：同周期、不同起点',
        description: '在负 π 到 π 区间，正弦经过原点，余弦在零处取一，两者值域均为负一到一。',
        caption:
          'sin 0＝0，cos 0＝1；两者周期都是 2π。先定位零点和峰谷，再判断当前所在的升降区间。',
        domain: [-3.5, 3.5],
        range: [-1.5, 1.5],
        curves: [
          { points: sample(Math.sin, -Math.PI, Math.PI), color: blue },
          { points: sample(Math.cos, -Math.PI, Math.PI), color: green },
        ],
        labels: [],
        xTicks: piTicks,
        yTicks: [
          { value: -1, label: '−1' },
          { value: 1, label: '1' },
        ],
        legend: [
          { text: 'y＝sin x', color: blue },
          { text: 'y＝cos x', color: green },
        ],
      },
      {
        title: '正切：渐近线处分支',
        description: '正切函数在正负 π/2 处无定义，各分支递增，曲线不跨越两条竖直渐近线。',
        caption:
          '虚线 x＝±π/2 处无定义；每一支递增，但不能把相隔渐近线的两点直接按同一递增区间比较。周期为 π。',
        domain: [-3.5, 3.5],
        range: [-3, 3],
        curves: [
          ...[-1, 1].map((sign) => ({
            points: [
              [(sign * Math.PI) / 2, -3],
              [(sign * Math.PI) / 2, 3],
            ] as [number, number][],
            color: gray,
            dashed: true,
          })),
          { points: sample(Math.tan, -Math.PI, -Math.PI + Math.atan(2.8)), color: blue },
          { points: sample(Math.tan, -Math.atan(2.8), Math.atan(2.8)), color: blue },
          { points: sample(Math.tan, Math.PI - Math.atan(2.8), Math.PI), color: blue },
        ],
        labels: [],
        xTicks: piTicks,
        yTicks: [
          { value: -2, label: '−2' },
          { value: 2, label: '2' },
        ],
        legend: [
          { text: 'y＝tan x', color: blue },
          { text: '竖直渐近线', color: gray, dashed: true },
        ],
      },
    ],
    '先检查定义域，再谈对称或变换': [
      {
        title: '互逆函数：点的横纵坐标交换',
        description:
          '指数函数 2 的 x 次幂与同底对数函数关于直线 y 等于 x 对称，点 (0,1) 对应点 (1,0)。两轴采用相同单位长度。',
        caption:
          '蓝线过 (0,1)、(1,2)，绿线过 (1,0)、(2,1)。横纵坐标交换，对称轴为 y＝x；渐近的横轴与纵轴也相互对应。',
        domain: [-2, 5.5],
        range: [-1.5, 3.3],
        curves: [
          {
            points: [
              [-1.5, -1.5],
              [3.3, 3.3],
            ],
            color: gray,
            dashed: true,
          },
          { points: sample((x) => 2 ** x, -2, Math.log2(3.2)), color: blue },
          { points: sample(Math.log2, 2 ** -1.4, 5.4), color: green },
        ],
        dots: [
          [0, 1],
          [1, 0],
          [1, 2],
          [2, 1],
        ],
        labels: [],
        xTicks: [...integerTicks, { value: 4, label: '4' }],
        yTicks: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
        ],
        legend: [
          { text: 'y＝2ˣ', color: blue },
          { text: 'y＝log₂x', color: green },
          { text: 'y＝x', color: gray, dashed: true },
        ],
      },
    ],
  },
  '120802': {
    '把旧输入保持为 u，就能推出水平倍率': [
      {
        title: '外乘 2：纵坐标变为两倍',
        description: '原函数 (x 减一) 平方，纵向乘二后，顶点保持 (1,0)，点 (2,1) 变为 (2,2)。',
        caption: '取 f(x)＝(x−1)²。变为 2f(x) 时，(2,1) → (2,2)，横坐标不动；顶点仍在 (1,0)。',
        domain: [-0.5, 3],
        range: [-0.6, 5],
        curves: [
          { points: sample((x) => (x - 1) ** 2, -0.5, 3), color: gray, dashed: true },
          { points: sample((x) => 2 * (x - 1) ** 2, -0.5, 2.5), color: blue },
          {
            points: [
              [2, 1],
              [2, 2],
            ],
            color: amber,
            dashed: true,
          },
        ],
        dots: [
          [1, 0],
          [2, 1],
          [2, 2],
        ],
        labels: [],
        xTicks: integerTicks.filter((t) => t.value >= 0),
        yTicks: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 4, label: '4' },
        ],
        legend: [
          { text: 'f(x)', color: gray, dashed: true },
          { text: '2f(x)', color: blue },
        ],
      },
      {
        title: '内乘 2：横坐标缩为一半',
        description:
          '原函数 (x 减一) 平方，输入改为二 x 后，顶点由 (1,0) 变为 (0.5,0)，点 (2,1) 变为 (1,1)。',
        caption: '同一个 f，变为 f(2x) 时，(2,1) → (1,1)，高度不动；顶点也从 x＝1 移到 x＝1/2。',
        domain: [-0.5, 3],
        range: [-0.6, 5],
        curves: [
          { points: sample((x) => (x - 1) ** 2, -0.5, 3), color: gray, dashed: true },
          { points: sample((x) => (2 * x - 1) ** 2, -0.5, 1.6), color: green },
          {
            points: [
              [2, 1],
              [1, 1],
            ],
            color: amber,
            dashed: true,
          },
        ],
        dots: [
          [0.5, 0],
          [1, 1],
          [2, 1],
        ],
        labels: [],
        xTicks: [
          { value: 0, label: '0' },
          { value: 0.5, label: '½' },
          { value: 1, label: '1' },
          { value: 2, label: '2' },
        ],
        yTicks: [
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 4, label: '4' },
        ],
        legend: [
          { text: 'f(x)', color: gray, dashed: true },
          { text: 'f(2x)', color: green },
        ],
      },
    ],
  },
  '120803': {
    '固定经过一点，m 与 c 就不能独立变化': [
      {
        title: '固定斜率：改变截距得到平行线',
        description: '直线 y 等于 x 加一与 y 等于 x 加三斜率相同，纵截距不同，彼此平行。',
        caption: 'm＝1 不变，c 从 1 增至 3，整条直线上移 2。相同横坐标处的高度差始终为 2。',
        domain: [-1, 4],
        range: [-1, 7],
        curves: [
          {
            points: [
              [-1, 0],
              [4, 5],
            ],
            color: blue,
          },
          {
            points: [
              [-1, 2],
              [4, 7],
            ],
            color: green,
          },
        ],
        dots: [
          [0, 1],
          [0, 3],
        ],
        labels: [],
        xTicks: [
          { value: 0, label: '0' },
          { value: 2, label: '2' },
          { value: 4, label: '4' },
        ],
        yTicks: [
          { value: 1, label: '1' },
          { value: 3, label: '3' },
          { value: 5, label: '5' },
        ],
        legend: [
          { text: 'y＝x＋1', color: blue },
          { text: 'y＝x＋3', color: green },
        ],
      },
      {
        title: '固定过点：斜率与截距一起变',
        description:
          '直线 y 等于 x 加一与 y 等于负 x 加五都经过点 (2,3)，斜率由一变为负一时截距由一变为五。',
        caption:
          '恒过 (2,3)，直线族为 y＝m(x−2)＋3。m 由 1 变为 −1，c 必须从 1 变为 5；不能只改斜率。',
        domain: [-1, 4],
        range: [-1, 7],
        curves: [
          {
            points: [
              [-1, 0],
              [4, 5],
            ],
            color: blue,
          },
          {
            points: [
              [-1, 6],
              [4, 1],
            ],
            color: green,
          },
        ],
        dots: [
          [0, 1],
          [0, 5],
          [2, 3],
        ],
        labels: [{ x: 201, y: 90, text: '(2,3)' }],
        xTicks: [
          { value: 0, label: '0' },
          { value: 2, label: '2' },
          { value: 4, label: '4' },
        ],
        yTicks: [
          { value: 1, label: '1' },
          { value: 3, label: '3' },
          { value: 5, label: '5' },
        ],
        legend: [
          { text: 'y＝x＋1', color: blue },
          { text: 'y＝−x＋5', color: green },
        ],
      },
    ],
  },
  '120804': {
    '三种形式，对应三种直接信息': [
      {
        title: '改变 a：开口方向与宽窄',
        description:
          '同一顶点在原点的三条抛物线：x 平方、二 x 平方与负 x 平方；绝对值更大的系数使抛物线更窄，负系数使开口向下。',
        caption:
          '顶点都在 (0,0)。a 从 1 变为 2，相同 x 处高度翻倍；a＝−1 则关于横轴反射，开口向下。',
        domain: [-2, 2],
        range: [-4, 4],
        curves: [
          { points: sample((x) => x * x, -1.9, 1.9), color: gray, dashed: true },
          { points: sample((x) => 2 * x * x, -1.38, 1.38), color: blue },
          { points: sample((x) => -x * x, -1.9, 1.9), color: green },
        ],
        dots: [[0, 0]],
        labels: [],
        xTicks: integerTicks.filter((t) => t.value < 2),
        yTicks: [
          { value: -2, label: '−2' },
          { value: 2, label: '2' },
        ],
        legend: [
          { text: 'x²', color: gray, dashed: true },
          { text: '2x²', color: blue },
          { text: '−x²', color: green },
        ],
      },
      {
        title: '改变 h、k：顶点移动，形状不变',
        description:
          '抛物线 x 平方的顶点在原点，向右平移一、向下平移一后成为 (x 减一) 平方减一，顶点在 (1,负一)。',
        caption: 'x² → (x−1)²−1，顶点 (0,0) → (1,−1)，对称轴从 x＝0 移至 x＝1，开口宽窄不变。',
        domain: [-2, 3],
        range: [-2, 5],
        curves: [
          {
            points: [
              [1, -2],
              [1, 5],
            ],
            color: amber,
            dashed: true,
          },
          { points: sample((x) => x * x, -2, 2.2), color: gray, dashed: true },
          { points: sample((x) => (x - 1) ** 2 - 1, -1.4, 3), color: blue },
        ],
        dots: [
          [0, 0],
          [1, -1],
        ],
        labels: [{ x: 200, y: 165, text: '(1,−1)' }],
        xTicks: integerTicks,
        yTicks: [
          { value: -1, label: '−1' },
          { value: 2, label: '2' },
          { value: 4, label: '4' },
        ],
        legend: [
          { text: 'x²', color: gray, dashed: true },
          { text: '(x−1)²−1', color: blue },
        ],
      },
    ],
  },
  '120807': {
    '直线与抛物线，判别式给相交数量': [
      {
        title: '两个交点：Δ＞0',
        description:
          '直线 y 等于二 x 与抛物线 y 等于 x 平方相交于原点和 (2,4)，联立方程有两个不同实根。',
        caption: 'x²＝2x → x(x−2)＝0。两个不同横坐标 0、2，对应 (0,0)、(2,4) 两个交点。',
        domain: [-1, 3],
        range: [-3, 7],
        curves: [
          { points: sample((x) => x * x, -1, 2.6), color: blue },
          {
            points: [
              [-1, -2],
              [3, 6],
            ],
            color: green,
          },
        ],
        dots: [
          [0, 0],
          [2, 4],
        ],
        labels: [{ x: 220, y: 61, text: '(2,4)', anchor: 'end' }],
        xTicks: integerTicks,
        yTicks: [
          { value: 2, label: '2' },
          { value: 4, label: '4' },
          { value: 6, label: '6' },
        ],
        legend: [
          { text: 'y＝x²', color: blue },
          { text: 'y＝2x', color: green },
        ],
      },
      {
        title: '相切与无交点：Δ＝0、Δ＜0',
        description:
          '直线 y 等于二 x 减一在 (1,1) 处与抛物线相切，平行下移到 y 等于二 x 减二后没有交点。',
        caption: 'x²＝2x−1 → (x−1)²＝0，只算一个交点。再下移 1，得到 (x−1)²＝−1，没有实交点。',
        domain: [-1, 3],
        range: [-3, 7],
        curves: [
          { points: sample((x) => x * x, -1, 2.6), color: blue },
          {
            points: [
              [-1, -3],
              [3, 5],
            ],
            color: green,
          },
          {
            points: [
              [-0.5, -3],
              [3, 4],
            ],
            color: amber,
            dashed: true,
          },
        ],
        dots: [[1, 1]],
        labels: [{ x: 175, y: 138, text: '(1,1)' }],
        xTicks: integerTicks,
        yTicks: [
          { value: 2, label: '2' },
          { value: 4, label: '4' },
          { value: 6, label: '6' },
        ],
        legend: [
          { text: 'x²', color: blue },
          { text: '2x−1', color: green },
          { text: '2x−2', color: amber, dashed: true },
        ],
      },
    ],
  },
}
