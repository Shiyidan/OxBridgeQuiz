// 数学2后四章的静态图解模型：用真实函数采样保持曲线、交点、切线和面积一致。
type Point = [number, number]
interface Curve {
  points: Point[]
  color: string
  dashed?: boolean
}
interface Label {
  x: number
  y: number
  text: string
  anchor?: 'start' | 'middle' | 'end'
}
export interface Math2MethodDiagram {
  title: string
  description: string
  caption: string
  domain: Point
  range: Point
  curves: Curve[]
  fills?: { points: Point[]; color: string }[]
  dots?: Point[]
  labels: Label[]
  xTicks?: { value: number; label: string }[]
  yTicks?: { value: number; label: string }[]
  legend?: { text: string; color: string; dashed?: boolean }[]
}

const blue = '#2453cd'
const green = '#087f76'
const amber = '#b86e21'
const gray = '#91a0b5'

// 坐标采样供讲义图使用；每条曲线只在有定义、落在画布内的选定区间生成。
export function sample(f: (x: number) => number, from: number, to: number): Point[] {
  return Array.from({ length: 81 }, (_, i) => {
    const x = from + ((to - from) * i) / 80
    return [x, f(x)]
  })
}

export const math2MethodDiagrams: Partial<Record<string, Math2MethodDiagram[]>> = {
  '120501': [
    {
      title: '同过 (0,1)，底数决定方向',
      description: '2 的 x 次幂递增，二分之一的 x 次幂递减，两图关于纵轴对称，始终在横轴上方。',
      caption: '蓝线 y＝2ˣ，绿线 y＝(1/2)ˣ。底数互为倒数，图像左右对称；两条曲线都不接触横轴。',
      domain: [-3, 3],
      range: [0, 8.5],
      curves: [
        { points: sample((x) => 2 ** x, -3, 3), color: blue },
        { points: sample((x) => 2 ** -x, -3, 3), color: green },
      ],
      dots: [[0, 1]],
      labels: [
        { x: 151, y: 199, text: '0' },
        { x: 151, y: 160, text: '1', anchor: 'end' },
        { x: 253, y: 48, text: '2ˣ', anchor: 'end' },
        { x: 58, y: 48, text: '(1/2)ˣ' },
      ],
    },
  ],
  '120601': [
    {
      title: '割线与切线斜率不同',
      description:
        '抛物线 y 等于 x 平方，原点和点 (2,4) 的割线斜率为 2，在 (2,4) 处的切线斜率为 4。',
      caption:
        '蓝线 y＝x²；绿线连接 (0,0) 与 (2,4)，斜率 2；橙线在 (2,4) 相切，斜率 4。相同终点不意味着相同变化率。',
      domain: [-0.3, 2.5],
      range: [-1, 6.5],
      curves: [
        { points: sample((x) => x * x, 0, 2.5), color: blue },
        {
          points: [
            [0, 0],
            [2.5, 5],
          ],
          color: green,
        },
        {
          points: [
            [0.8, -0.8],
            [2.5, 6],
          ],
          color: amber,
        },
      ],
      dots: [
        [0, 0],
        [2, 4],
      ],
      labels: [
        { x: 55, y: 178, text: '0' },
        { x: 218, y: 68, text: '(2,4)', anchor: 'end' },
        { x: 111, y: 66, text: 'y = x²' },
      ],
    },
  ],
  '120701': [
    {
      title: '下方面积被积分减去',
      description:
        'y 等于 x 在负一到二之间与横轴围成两块三角形。下方的面积为二分之一，上方面积为二。',
      caption: '蓝色上方面积 2，橙色下方面积 1/2。定积分为 2−1/2＝3/2；几何面积为 2＋1/2＝5/2。',
      domain: [-1.4, 2.5],
      range: [-1.5, 2.6],
      curves: [
        {
          points: [
            [-1, -1],
            [2, 2],
          ],
          color: blue,
        },
      ],
      fills: [
        {
          points: [
            [-1, 0],
            [-1, -1],
            [0, 0],
          ],
          color: '#fbe5cb',
        },
        {
          points: [
            [0, 0],
            [2, 2],
            [2, 0],
          ],
          color: '#dce8ff',
        },
      ],
      labels: [
        { x: 118, y: 140, text: '0' },
        { x: 66, y: 117, text: '−1', anchor: 'middle' },
        { x: 258, y: 139, text: '2', anchor: 'middle' },
        { x: 232, y: 42, text: 'y = x', anchor: 'end' },
      ],
    },
  ],
  '120705': [
    {
      title: '向上弯：弦在上方',
      description: 'y 等于 x 平方，在零到二之间用两个梯形估算，连接线在曲线上方，产生高估。',
      caption: 'y＝x²，两个梯形估计 3，实际积分 8/3。弦与曲线之间的橙色区域是多算的部分。',
      domain: [-0.15, 2.2],
      range: [-0.25, 4.5],
      curves: [
        { points: sample((x) => x * x, 0, 2), color: blue },
        {
          points: [
            [0, 0],
            [1, 1],
            [2, 4],
          ],
          color: amber,
        },
      ],
      fills: [
        { points: [[0, 0], [1, 1], ...sample((x) => x * x, 1, 0)], color: '#fbe5cb' },
        { points: [[1, 1], [2, 4], ...sample((x) => x * x, 2, 1)], color: '#fbe5cb' },
      ],
      dots: [
        [0, 0],
        [1, 1],
        [2, 4],
      ],
      labels: [
        { x: 47, y: 198, text: '0' },
        { x: 162, y: 198, text: '1' },
        { x: 267, y: 198, text: '2' },
        { x: 100, y: 44, text: 'y = x²' },
      ],
    },
    {
      title: '向下弯：弦在下方',
      description: 'y 等于四减 x 平方，在零到二之间用两个梯形估算，连接线在曲线下方，产生低估。',
      caption: 'y＝4−x²，两个梯形估计 5，实际积分 16/3。橙色区域是漏算的部分；判断依据是弯向。',
      domain: [-0.15, 2.2],
      range: [-0.25, 4.5],
      curves: [
        { points: sample((x) => 4 - x * x, 0, 2), color: blue },
        {
          points: [
            [0, 4],
            [1, 3],
            [2, 0],
          ],
          color: amber,
        },
      ],
      fills: [
        { points: [[0, 4], [1, 3], ...sample((x) => 4 - x * x, 1, 0)], color: '#fbe5cb' },
        { points: [[1, 3], [2, 0], ...sample((x) => 4 - x * x, 2, 1)], color: '#fbe5cb' },
      ],
      dots: [
        [0, 4],
        [1, 3],
        [2, 0],
      ],
      labels: [
        { x: 47, y: 198, text: '0' },
        { x: 162, y: 198, text: '1' },
        { x: 267, y: 198, text: '2' },
        { x: 115, y: 30, text: 'y = 4 − x²' },
      ],
    },
  ],
  '120802': [
    {
      title: '先上移，再反射',
      description: '原函数 x 平方减一先上移一再关于横轴反射，结果为负 x 平方，顶点在原点。',
      caption: '灰线 f(x)＝x²−1。先上移 1 再反射：−[f(x)＋1]＝−x²，顶点为 (0,0)。',
      domain: [-1.8, 1.8],
      range: [-3.5, 3.5],
      curves: [
        { points: sample((x) => x * x - 1, -1.7, 1.7), color: gray, dashed: true },
        { points: sample((x) => -x * x, -1.7, 1.7), color: blue },
      ],
      dots: [[0, 0]],
      labels: [
        { x: 173, y: 93, text: '(0,0)' },
        { x: 48, y: 39, text: '−f(x) − 1' },
      ],
    },
    {
      title: '先反射，再上移',
      description: '原函数 x 平方减一先关于横轴反射再上移一，结果为负 x 平方加二，顶点在 (0,2)。',
      caption: '同一灰线先反射再上移 1：−f(x)＋1＝−x²＋2，顶点为 (0,2)，比左图高 2。',
      domain: [-1.8, 1.8],
      range: [-3.5, 3.5],
      curves: [
        { points: sample((x) => x * x - 1, -1.7, 1.7), color: gray, dashed: true },
        { points: sample((x) => -x * x + 2, -1.7, 1.7), color: blue },
      ],
      dots: [[0, 2]],
      labels: [
        { x: 173, y: 48, text: '(0,2)' },
        { x: 48, y: 39, text: '−f(x) + 1' },
      ],
    },
  ],
  '120805': [
    {
      title: '极值高度划分根数',
      description:
        '三次函数 x 立方减三 x 在负一处极大为二，在一处极小为负二。水平线位于两极值之间时有三个交点。',
      caption:
        '蓝线 y＝x³−3x；绿虚线 y＝2 和 y＝−2 标出临界高度。y＝0 与曲线相交三次，到临界高度时两个交点合并。',
      domain: [-2.2, 2.2],
      range: [-3, 3],
      curves: [
        { points: sample((x) => x ** 3 - 3 * x, -2.1, 2.1), color: blue },
        {
          points: [
            [-2.1, 2],
            [2.1, 2],
          ],
          color: green,
          dashed: true,
        },
        {
          points: [
            [-2.1, -2],
            [2.1, -2],
          ],
          color: green,
          dashed: true,
        },
      ],
      dots: [
        [-1, 2],
        [1, -2],
      ],
      labels: [
        { x: 82, y: 34, text: '(−1,2)' },
        { x: 189, y: 176, text: '(1,−2)' },
        { x: 150, y: 121, text: '0' },
      ],
    },
  ],
  '120806': [
    {
      title: '双根接触，单根穿过',
      description: '多项式 (x 加一) 的平方乘 (x 减二)，在负一处接触横轴不变号，在二处穿过横轴。',
      caption:
        'y＝(x＋1)²(x−2)。x＝−1 为双根，左右仍为负；x＝2 为单根，两侧变号。全图只有两个不同实根。',
      domain: [-2.6, 2.6],
      range: [-5, 5.8],
      curves: [{ points: sample((x) => (x + 1) ** 2 * (x - 2), -2, 2.45), color: blue }],
      dots: [
        [-1, 0],
        [2, 0],
      ],
      labels: [
        { x: 117, y: 85, text: '−1', anchor: 'middle' },
        { x: 261, y: 85, text: '2', anchor: 'middle' },
        { x: 170, y: 114, text: '0' },
      ],
    },
  ],
}
