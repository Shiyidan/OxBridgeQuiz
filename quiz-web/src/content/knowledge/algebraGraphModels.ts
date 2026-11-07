// 代数坐标与函数图示的数据：分段采样保留倒数、正切的断点，供讲义 SVG 共用。
import type { AlgebraGraphCode } from './algebraGraphMethods'

export interface GraphPoint {
  x: number
  y: number
}
export interface GraphMark extends GraphPoint {
  label: string
  dx?: number
  dy?: number
}
export interface GraphCurve {
  label: string
  color: string
  dash?: string
  segments: GraphPoint[][]
}
export interface GraphGuide {
  from: GraphPoint
  to: GraphPoint
  color?: string
}
export interface AlgebraGraphModel {
  title: string
  description: string
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  xTicks: number[]
  yTicks: number[]
  degreeAxis?: boolean
  curves: GraphCurve[]
  marks?: GraphMark[]
  guides?: GraphGuide[]
  notes: string[]
}

const blue = '#2453cd'
const teal = '#007b72'
const amber = '#a65d09'

// 每个连续区间单独采样，避免绘图库把无定义点两侧错误地连接起来。
function curve(
  label: string,
  color: string,
  value: (x: number) => number,
  intervals: [number, number][],
  dash?: string,
): GraphCurve {
  return {
    label,
    color,
    dash,
    segments: intervals.map(([start, end]) =>
      Array.from({ length: 241 }, (_, index) => {
        const x = start + ((end - start) * index) / 240
        return { x, y: value(x) }
      }),
    ),
  }
}

const coordinate: AlgebraGraphModel = {
  title: '点的位置与移动的方向',
  description: 'A 位于第二象限，B 位于第四象限；从 A 到 B 向右 5、向下 3。',
  xMin: -5,
  xMax: 5,
  yMin: -3,
  yMax: 4,
  xTicks: [-4, -2, 2, 4],
  yTicks: [-2, 2, 4],
  curves: [],
  marks: [
    { x: -3, y: 2, label: 'A (−3, 2)', dx: 9, dy: -12 },
    { x: 2, y: -1, label: 'B (2, −1)', dx: 9, dy: 21 },
  ],
  guides: [
    { from: { x: -3, y: 2 }, to: { x: 2, y: 2 }, color: teal },
    { from: { x: 2, y: 2 }, to: { x: 2, y: -1 }, color: teal },
  ],
  notes: [
    'A：横负纵正，在第二象限。B：横正纵负，在第四象限。',
    String.raw`从 A 到 B：$\Delta x=2-(-3)=5$，$\Delta y=-1-2=-3$，即**向右 5，向下 3**。`,
    '虚线显示两个方向的变化，不是 A、B 的直线距离。',
  ],
}

const line: AlgebraGraphModel = {
  title: '从两点的变化量读斜率',
  description: '直线经过 A(−1,0) 与 B(3,2)，横向增加 4，纵向增加 2，斜率为二分之一。',
  xMin: -3,
  xMax: 7,
  yMin: -2,
  yMax: 5,
  xTicks: [-2, 2, 4, 6],
  yTicks: [-1, 1, 3, 5],
  curves: [curve(String.raw`$y=\frac12x+\frac12$`, blue, (x) => 0.5 * x + 0.5, [[-3, 7]])],
  marks: [
    { x: -1, y: 0, label: 'A (−1, 0)', dx: -22, dy: 35 },
    { x: 3, y: 2, label: 'B (3, 2)', dx: -10, dy: -15 },
  ],
  guides: [
    { from: { x: -1, y: 0 }, to: { x: 3, y: 0 }, color: teal },
    { from: { x: 3, y: 0 }, to: { x: 3, y: 2 }, color: teal },
  ],
  notes: [
    String.raw`从 A 到 B：横向增加 4，纵向增加 2，所以 $m=2/4=1/2$。`,
    String.raw`代入 A：$y-0=\frac12(x+1)$。展开后读到纵截距为 $1/2$。`,
    'A 是横轴交点；纵轴交点是 (0, 1/2)，不是 (1/2, 0)。',
  ],
}

const quadratic: AlgebraGraphModel = {
  title: '同一条曲线，三种读取方式',
  description: '抛物线 y=(x−1)²−4 的根为 −1 与 3，顶点为 (1,−4)，对称轴为 x=1。',
  xMin: -3,
  xMax: 5,
  yMin: -5,
  yMax: 7,
  xTicks: [-2, 2, 4],
  yTicks: [-4, -2, 2, 4, 6],
  curves: [curve(String.raw`$y=(x-1)^2-4$`, blue, (x) => (x - 1) ** 2 - 4, [[-3, 5]])],
  marks: [
    { x: -1, y: 0, label: '(−1, 0)', dx: -56, dy: -12 },
    { x: 3, y: 0, label: '(3, 0)', dx: 10, dy: -12 },
    { x: 1, y: -4, label: '(1, −4)', dx: 10, dy: -10 },
  ],
  guides: [{ from: { x: 1, y: -5 }, to: { x: 1, y: 7 }, color: teal }],
  notes: [
    String.raw`**读根**：$y=(x+1)(x-3)$，两根为 $-1$、3。`,
    String.raw`**读顶点**：$y=(x-1)^2-4$，顶点 $(1,-4)$，虚线为对称轴 $x=1$。`,
    String.raw`**读纵截距**：$y=x^2-2x-3$，令 $x=0$ 得 $y=-3$。`,
  ],
}

const basicCurves: AlgebraGraphModel[] = [
  {
    title: '直线、二次与三次',
    description:
      '直线 y=x、抛物线 y=x² 与三次曲线 y=x³ 均过原点，二次关于 y 轴对称，另两条关于原点对称。',
    xMin: -2,
    xMax: 2,
    yMin: -3,
    yMax: 3,
    xTicks: [-2, -1, 1, 2],
    yTicks: [-2, -1, 1, 2],
    curves: [
      curve('$y=x$', blue, (x) => x, [[-2, 2]]),
      curve('$y=x^2$', teal, (x) => x ** 2, [[-2, 2]], '7 3'),
      curve('$y=x^3$', amber, (x) => x ** 3, [[-2, 2]], '2 4'),
    ],
    notes: ['三者定义域均为全体实数，均过 (0,0)。二次图关于 y 轴对称；直线与三次图关于原点对称。'],
  },
  {
    title: '反比例',
    description: 'y=1/x 在第一与第三象限有两个分支，x=0 无定义，两条坐标轴为渐近线。',
    xMin: -3,
    xMax: 3,
    yMin: -3,
    yMax: 3,
    xTicks: [-2, -1, 1, 2],
    yTicks: [-2, -1, 1, 2],
    curves: [
      curve('$y=1/x$', blue, (x) => 1 / x, [
        [-3, -0.04],
        [0.04, 3],
      ]),
    ],
    notes: [
      String.raw`$x\ne0$，且 $y\ne0$。两个分支分别在第一、三象限，关于原点对称；**两条坐标轴都是渐近线**。`,
    ],
  },
  {
    title: '指数增长与衰减',
    description: 'y=2^x 递增，y=(1/2)^x 递减，均过 (0,1) 且始终为正。',
    xMin: -3,
    xMax: 3,
    yMin: -1,
    yMax: 5,
    xTicks: [-2, -1, 1, 2],
    yTicks: [1, 2, 4],
    curves: [
      curve('$y=2^x$', blue, (x) => 2 ** x, [[-3, 3]]),
      curve(String.raw`$y=(\frac12)^x$`, teal, (x) => 0.5 ** x, [[-3, 3]], '7 3'),
    ],
    notes: [
      String.raw`$k^x$ 要求 $k>0$，定义域为全体实数，过 $(0,1)$。$k>1$ 递增，$0<k<1$ 递减；$k=1$ 时是水平线 $y=1$。`,
    ],
  },
  {
    title: '正弦',
    description: '正弦曲线按度数显示一个周期：0、90、180、270、360 度对应 0、1、0、−1、0。',
    xMin: 0,
    xMax: 360,
    yMin: -1.5,
    yMax: 1.5,
    xTicks: [90, 180, 270, 360],
    yTicks: [-1, 1],
    degreeAxis: true,
    curves: [curve(String.raw`$y=\sin x$`, blue, (x) => Math.sin((x * Math.PI) / 180), [[0, 360]])],
    notes: [
      String.raw`一周期的关键值依次为 $0,1,0,-1,0$。定义域为全体实数；值域 $[-1,1]$，周期 $360^\circ$。`,
    ],
  },
  {
    title: '余弦',
    description: '余弦曲线按度数显示一个周期：0、90、180、270、360 度对应 1、0、−1、0、1。',
    xMin: 0,
    xMax: 360,
    yMin: -1.5,
    yMax: 1.5,
    xTicks: [90, 180, 270, 360],
    yTicks: [-1, 1],
    degreeAxis: true,
    curves: [curve(String.raw`$y=\cos x$`, blue, (x) => Math.cos((x * Math.PI) / 180), [[0, 360]])],
    notes: [
      String.raw`一周期的关键值依次为 $1,0,-1,0,1$。定义域为全体实数；值域 $[-1,1]$，周期 $360^\circ$。`,
    ],
  },
  {
    title: '正切',
    description: '正切在 −90 与 90 度处断开，各连续分支递增，周期 180 度。',
    xMin: -180,
    xMax: 180,
    yMin: -3,
    yMax: 3,
    xTicks: [-180, -90, 90, 180],
    yTicks: [-2, -1, 1, 2],
    degreeAxis: true,
    curves: [
      curve(String.raw`$y=\tan x$`, blue, (x) => Math.tan((x * Math.PI) / 180), [
        [-180, -90.1],
        [-89.9, 89.9],
        [90.1, 180],
      ]),
    ],
    guides: [-90, 90].map((x) => ({ from: { x, y: -3 }, to: { x, y: 3 }, color: amber })),
    notes: [
      String.raw`值域为全体实数，周期 $180^\circ$；$90^\circ+180^\circ n$ 处无定义。虚线是渐近线，**不能跨线连接两个分支**。`,
    ],
  },
]

export const algebraGraphModels: Record<AlgebraGraphCode, AlgebraGraphModel[]> = {
  '110409': [coordinate],
  '110410': [line],
  '110411': [quadratic],
  '110412': basicCurves,
}

// 只绘制当前图窗内的连续片段；离开图窗后重新起笔，不连成虚假的边缘线。
export function graphPath(segment: GraphPoint[], model: AlgebraGraphModel): string {
  let drawing = false
  return segment
    .map(({ x, y }) => {
      if (!Number.isFinite(x) || !Number.isFinite(y) || y < model.yMin || y > model.yMax) {
        drawing = false
        return ''
      }
      const command = drawing ? 'L' : 'M'
      drawing = true
      return command + graphX(x, model).toFixed(2) + ',' + graphY(y, model).toFixed(2)
    })
    .join(' ')
}

// 统一画布边距使刻度留在图内，同时保持每幅图独立的真实坐标范围。
export function graphX(x: number, model: AlgebraGraphModel): number {
  return 48 + ((x - model.xMin) / (model.xMax - model.xMin)) * 300
}
// SVG 的纵向像素向下增长，需翻转数学坐标的正方向。
export function graphY(y: number, model: AlgebraGraphModel): number {
  return 22 + ((model.yMax - y) / (model.yMax - model.yMin)) * 210
}
