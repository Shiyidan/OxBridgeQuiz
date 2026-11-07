// 实际图像两节的固定模型：按时间、位置或速度的真实单位解释折线和面积。
export type ApplicationFigureCode = '110413' | '110414'
export type TimeGraphPoint = readonly [number, number]
export interface ApplicationFigure {
  title: string
  description: string
  xLabel: string
  yLabel: string
  xMax: number
  yMin: number
  yMax: number
  xTicks: number[]
  yTicks: number[]
  points: TimeGraphPoint[]
  areas?: { points: TimeGraphPoint[]; tone: 'positive' | 'negative' }[]
  notes: string[]
}

export const algebraApplicationFigures: Record<ApplicationFigureCode, ApplicationFigure> = {
  '110413': {
    title: '同一直线上的往返：位置归零，路程不归零',
    description: '沿直线运动，0 到 10 分钟从起点走到 2 千米处，停留 5 分钟，再用 10 分钟返回起点。',
    xLabel: 't / min',
    yLabel: '位置 s / km',
    xMax: 27,
    yMin: 0,
    yMax: 2.8,
    xTicks: [5, 10, 15, 20, 25],
    yTicks: [1, 2],
    points: [
      [0, 0],
      [10, 2],
      [15, 2],
      [25, 0],
    ],
    notes: [
      '先沿直线走出 2 km，停留 5 min，再沿原路返回。末位置为 0，总路程为 **4 km**。',
      String.raw`**全程平均速率**：$4\div(25/60)=9.6\ \mathrm{km/h}$。`,
      String.raw`**运动期间平均速率**：$4\div(20/60)=12\ \mathrm{km/h}$。分母扣掉停留的 5 min。`,
    ],
  },
  '110414': {
    title: '同一张速度图，分别读加速度、位移与路程',
    description:
      '速度从 0 在 4 秒内增至 8 米每秒，再均匀下降，8 秒时为 0，10 秒时为负 4 米每秒。上方三角形面积 32 米，下方面积大小 4 米。',
    xLabel: 't / s',
    yLabel: '速度 v / (m/s)',
    xMax: 10.8,
    yMin: -5,
    yMax: 10,
    xTicks: [2, 4, 6, 8, 10],
    yTicks: [-4, 4, 8],
    points: [
      [0, 0],
      [4, 8],
      [8, 0],
      [10, -4],
    ],
    areas: [
      {
        points: [
          [0, 0],
          [4, 8],
          [8, 0],
        ],
        tone: 'positive',
      },
      {
        points: [
          [8, 0],
          [10, -4],
          [10, 0],
        ],
        tone: 'negative',
      },
    ],
    notes: [
      String.raw`**斜率**：0–4 s 加速度为 $8/4=2\ \mathrm{m/s^2}$；4–10 s 为 $(-4-8)/6=-2\ \mathrm{m/s^2}$。`,
      String.raw`**面积**：蓝色块为 $\tfrac12\times8\times8=32\ \mathrm m$；橙色块大小为 $\tfrac12\times2\times4=4\ \mathrm m$。`,
      String.raw`**位移** $=32-4=28\ \mathrm m$；**路程** $=32+4=36\ \mathrm m$。8 s 后速度变负，开始反向运动。`,
    ],
  },
}

// 两图共用坐标画布而分别保留量程，防止位置与速度被误当成同一类纵量。
export function applicationX(value: number, model: ApplicationFigure): number {
  return 52 + (value / model.xMax) * 300
}
// 保留速度图的负半轴，面积不会因图窗截断而丢失。
export function applicationY(value: number, model: ApplicationFigure): number {
  return 36 + ((model.yMax - value) / (model.yMax - model.yMin)) * 186
}
// 图形使用原模型的折点生成，填色区与折线共用同一坐标映射。
export function applicationPoints(points: TimeGraphPoint[], model: ApplicationFigure): string {
  return points.map(([x, y]) => applicationX(x, model) + ',' + applicationY(y, model)).join(' ')
}
