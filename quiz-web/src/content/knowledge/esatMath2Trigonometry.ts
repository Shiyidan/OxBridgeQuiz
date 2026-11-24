// ESAT 数学2第四章三角讲义：按六个考纲叶子组织复习、真实例题与完整相关年度考法。
import type { KnowledgeLesson } from './types'
import { math2TrigonometryMethods } from './math2TrigonometryMethods'

export const esatMath2Trigonometry: KnowledgeLesson = {
  code: '120400',
  title: 'Trigonometry · 三角',
  subtitle: '用单位圆串起边角、弧度、图像与方程',
  intro:
    '本章先用边角关系解决几何问题，再用单位圆把精确值、象限、周期和恒等式连起来。每次计算都保留角度单位、定义域和题目所问的量；从概念图到真实例题，练习“选关系—分支—回代”的解题顺序。',
  memory: [
    '**边角先配对。**正弦定理看对边对角，余弦定理看三边或夹角，面积的角必须夹在两条已知边之间。',
    '**弧度先统一。**$\\ell=r\\theta$、$S=\\frac12r^2\\theta$ 的角必须用弧度；弓形是扇形减三角形。',
    '**精确值加象限。**用特殊三角形记绝对值，用单位圆看正负；tan在cos为0时无定义。',
    '**方程先分支。**统一函数但不约掉零根；换复合角时同步换区间，最后检查端点和重复解。',
  ],
  sections: [
    {
      code: '120401',
      title: '正弦/余弦定理与三角形面积',
      summary: math2TrigonometryMethods['120401'].summary,
      paragraphs: [math2TrigonometryMethods['120401'].intro],
      rules: math2TrigonometryMethods['120401'].blocks.flatMap((block) => [
        {
          title: block.title,
          text: [block.formula, ...(block.paragraphs ?? []), block.note].filter(Boolean).join(' '),
        },
        ...(block.points ?? []),
        ...(block.table?.rows.map((row) => ({
          title: row[0] ?? '',
          text: row.slice(1).join('；'),
        })) ?? []),
      ]),
      memory: math2TrigonometryMethods['120401'].memory,
      pitfalls: [
        '把边与邻角配成正弦定理的一组，或把非夹角代入面积公式。',
        '只保留反正弦给出的锐角，漏掉满足内角和的钝角三角形。',
        '把一般三角形当成直角三角形，或用透视图的画面角度替代空间角。',
        '先算出极值却忘记边长必须为正、三角形必须成立。',
      ],
      examFocus: {
        goal: '从边角条件选关系，将面积题转成可检查的表达式。',
        pastPaperSummary:
          '相关年度题把夹角面积与参数最值结合，也在切线、圆内接三角形和弓形中要求先求边角再计算面积。',
        pastPaperPatterns: [
          {
            form: '夹角面积转成二次函数',
            description:
              '两条边随同一参数变化，先用给定60°写面积，再配方或求顶点；合法边长范围必须保留。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q041'],
          },
          {
            form: '圆与切线中的三角形面积',
            description:
              '连接半径、作垂线，将切线外区域、钥匙孔或内接等边三角形分成三角形与圆形部分；需要精确角值与夹角面积。',
            reference: '2016、2017 ENGAA；2019 NSAA；2021 ENGAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q035',
              'ENGAA_2017_S1-Q035',
              'NSAA_2019_S1-Q079',
              'ESAT_LEGACY_2021_ENGAA_Q027',
            ],
          },
        ],
        pastPaperNote:
          '当前已收录数学2年度题中未找到直接以SSA两解或完整三维建模为主问的题；这些仍是考纲要求，不能据此跳过。例题练夹角面积，自测补练三边求最大角。',
        examples: [
          {
            title: '两边随参数变化，面积最大在哪里？',
            source: {
              questionCode: 'ENGAA_2017_S1-Q041',
              why: '用夹角面积公式建立二次函数，再用配方核对长度范围。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'D · $\\frac{16\\sqrt3}{3}\\,\\mathrm{cm^2}$',
            steps: [
              '夹角是两条已知边之间的 $60^\\circ$，所以 $S=\\frac12(4x)(8-3x)\\sin60^\\circ=\\sqrt3(8x-3x^2)$。',
              '两边为正要求 $0<x<8/3$；将面积配方：$S=\\sqrt3[-3(x-4/3)^2+16/3]$。',
              '平方项最小为0，且 $x=4/3$ 在合法范围内，因此最大面积为 $16\\sqrt3/3$，选D。',
              '回代两边为 $16/3$ 与4，面积 $\\frac12\\cdot\\frac{16}{3}\\cdot4\\cdot\\frac{\\sqrt3}{2}=\\frac{16\\sqrt3}{3}$。',
            ],
            takeaway: '==先把几何量写成函数，再检查取得极值的参数是否仍组成合法三角形。==',
          },
        ],
        checklist: [
          '能根据已知条件选择正弦或余弦定理。',
          '能列出SSA的补角候选并检查内角和。',
          '能在二维和空间图中选出真正含目标量的三角形。',
        ],
      },
      visual: 'maths2-trigonometry',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120402',
      title: '弧度制',
      summary: math2TrigonometryMethods['120402'].summary,
      paragraphs: [math2TrigonometryMethods['120402'].intro],
      rules: math2TrigonometryMethods['120402'].blocks.flatMap((block) => [
        {
          title: block.title,
          text: [block.formula, ...(block.paragraphs ?? []), block.note].filter(Boolean).join(' '),
        },
        ...(block.points ?? []),
        ...(block.table?.rows.map((row) => ({
          title: row[0] ?? '',
          text: row.slice(1).join('；'),
        })) ?? []),
      ]),
      memory: math2TrigonometryMethods['120402'].memory,
      pitfalls: [
        '把度数直接放进rθ或半径平方乘角的公式。',
        '把小扇形当小弓形，漏减三角形面积。',
        '弦心距求出的半角直接当完整圆心角使用。',
        '用增量角算出的弧长增量回答题目所问的总弧长。',
      ],
      examFocus: {
        goal: '辨清区域和边界，用同一个弧度角连接弧长与面积。',
        selfCheckNote:
          '本节自测选用已发布试题库中的2025回忆整理题，练习圆周角转圆心角后计算弧长；它不是官方年度原卷题，也不计入上方年度考法证据。',
        pastPaperSummary:
          '年度题覆盖切线围成的弓形、优弧钥匙孔、面积增量反求半径、圆内接三角形的剩余面积，以及固定扇形周长求最大面积。',
        pastPaperPatterns: [
          {
            form: '扇形减三角形，或圆减内接图形',
            description: '由半径和切线距离、弦心距或等边三角形先求角，再按阴影边界进行面积加减。',
            reference: '2016 ENGAA；2019 NSAA；2021 ENGAA',
            sourceCodes: ['ENGAA_2016_S1-Q035', 'NSAA_2019_S1-Q079', 'ESAT_LEGACY_2021_ENGAA_Q027'],
          },
          {
            form: '优弧和复合边界',
            description:
              '钥匙孔给大弧长度和缺口角，要先用2π减缺口角，再由弧长求半径，拼接扇形与三角形。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q035'],
          },
          {
            form: '面积增量与总弧长',
            description:
              '同半径条件下用面积差除以角度差确定半径平方，再计算最终扇形的总角和总弧长。',
            reference: '2018 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q35'],
          },
          {
            form: '固定周长的面积最值',
            description: '周长包括两条半径；消去弧长或角之后，面积成为关于半径的二次函数。',
            reference: '2022 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2022_ENGAA_Q033'],
          },
          {
            form: '弧度作为三角函数的自变量',
            description:
              '比较小数弧度的sin和cos，要先定位到第一象限，不能把0.5、0.75、1当成度数。主问为图像单调性。',
            reference: '2021 ENGAA · 关联应用',
            sourceCodes: ['ESAT_LEGACY_2021_ENGAA_Q031'],
          },
        ],
        examples: [
          {
            title: '圆被直线分开：小弓形不能只算扇形',
            source: {
              questionCode: 'ESAT_LEGACY_2021_ENGAA_Q027',
              why: '由弦心距确定完整圆心角，再用扇形减三角形。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'H · $\\frac{4\\pi}{3}-\\sqrt3$',
            steps: [
              '圆 $x^2+y^2=4$ 的半径为2，圆心到弦所在直线 $x=1$ 的距离为1。',
              '连接圆心与弦端点，垂线平分弦及圆心角。设半角为 $\\alpha$，则 $\\cos\\alpha=1/2$，故 $\\alpha=\\pi/3$，完整小扇形角为 $2\\pi/3$。',
              '小扇形面积为 $\\frac12(2^2)\\frac{2\\pi}{3}=\\frac{4\\pi}{3}$；其中等腰三角形面积为 $\\frac12(2)(2)\\sin(2\\pi/3)=\\sqrt3$。',
              '小弓形面积为 $\\frac{4\\pi}{3}-\\sqrt3$，选H。它小于半圆面积 $2\\pi$，数量级合理。',
            ],
            takeaway: '==弦心距求出的是半角；弓形再用完整扇形减去三角形。==',
          },
        ],
        checklist: [
          '能区别弧度、度数、弧长及面积的单位。',
          '能根据边界区分扇形、弓形和大弧。',
          '能用增量关系求半径，再还原题目要求的总量。',
        ],
      },
      visual: 'maths2-trigonometry',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120403',
      title: '三角函数精确值',
      summary: math2TrigonometryMethods['120403'].summary,
      paragraphs: [math2TrigonometryMethods['120403'].intro],
      rules: math2TrigonometryMethods['120403'].blocks.flatMap((block) => [
        {
          title: block.title,
          text: [block.formula, ...(block.paragraphs ?? []), block.note].filter(Boolean).join(' '),
        },
        ...(block.points ?? []),
        ...(block.table?.rows.map((row) => ({
          title: row[0] ?? '',
          text: row.slice(1).join('；'),
        })) ?? []),
      ]),
      memory: math2TrigonometryMethods['120403'].memory,
      pitfalls: [
        '把sin30°和cos30°交换，或把tan30°写成√3。',
        '只记数值绝对值，漏掉第二、三、四象限的符号。',
        '正弦有补角分支时只留下锐角，或忽略三角形的内角和。',
        '把tan90°当作0，或把根式过早近似造成选项误判。',
      ],
      examFocus: {
        goal: '在不使用计算器时，把精确值、象限和角域同时落实。',
        pastPaperSummary:
          '精确值既直接用于联立三角关系求角，也嵌在三角形面积、弓形面积、复合角方程和多周期计数中，重点是保留符号与全部合法角。',
        pastPaperPatterns: [
          {
            form: '联立函数值再恢复三角形内角',
            description: '先把tan与sin作为未知量消元，恢复正弦角时用三角形内角和排除不合法的补角。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q087'],
          },
          {
            form: '特殊角进入面积公式',
            description:
              '60°夹角、等边内接三角形或弦心距为半径一半时，需使用√3/2等精确值保留最终含π与根式的结果。',
            reference: '2016、2017 ENGAA；2019 NSAA；2021 ENGAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q035',
              'ENGAA_2017_S1-Q035',
              'ENGAA_2017_S1-Q041',
              'NSAA_2019_S1-Q079',
              'ESAT_LEGACY_2021_ENGAA_Q027',
            ],
          },
          {
            form: '特殊值反求全部角',
            description:
              'sin或cos取0、±1/2、±√2/2、±√3/2时，结合复合角范围与周期列解；不能把同值的不同角合成一个。',
            reference: '2017、2018 ENGAA；2020年度题',
            sourceCodes: [
              'ENGAA_2017_S1-Q031',
              'ENGAA_2017_S1-Q045',
              'ESAT_LEGACY_2018_ENGAA_Q31',
              'ESAT-2020-MATHS2-008',
            ],
          },
        ],
        examples: [
          {
            title: '两个三角函数联立，最后求的是第三个角',
            source: {
              questionCode: 'NSAA_2019_S1-Q087',
              why: '先将三角函数值视作代数未知量，恢复角时检查三角形的补角分支。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'D · $105^\\circ$',
            steps: [
              '设 $u=\\tan\\alpha$、$v=\\sin\\beta$，则 $3u-2v=2$、$5u+6v=8$。第一式乘3后相加，得 $14u=14$，所以 $u=1$。',
              '回代得 $3-2v=2$，故 $v=1/2$。三角形内角满足 $0^\\circ<\\alpha<180^\\circ$，其中 $\\tan\\alpha=1$ 给出 $\\alpha=45^\\circ$。',
              '$\\sin\\beta=1/2$ 给出 $\\beta=30^\\circ$ 或 $150^\\circ$；若取150°，与45°之和超过180°，不能组成三角形。',
              '因此 $\\theta=180^\\circ-45^\\circ-30^\\circ=105^\\circ$，选D。代回两条原式分别为2和8。',
            ],
            takeaway: '==联立时把函数值当未知数，恢复角时再用范围和内角和排除补角。==',
          },
        ],
        checklist: [
          '能由特殊直角三角形重建精确值表。',
          '能用单位圆定位参考角和符号。',
          '能从精确值恢复全部符合条件的角。',
        ],
      },
      visual: 'maths2-trigonometry',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120404',
      title: '三角图像、对称与周期',
      summary: math2TrigonometryMethods['120404'].summary,
      paragraphs: [math2TrigonometryMethods['120404'].intro],
      rules: math2TrigonometryMethods['120404'].blocks.flatMap((block) => [
        {
          title: block.title,
          text: [block.formula, ...(block.paragraphs ?? []), block.note].filter(Boolean).join(' '),
        },
        ...(block.points ?? []),
        ...(block.table?.rows.map((row) => ({
          title: row[0] ?? '',
          text: row.slice(1).join('；'),
        })) ?? []),
      ]),
      memory: math2TrigonometryMethods['120404'].memory,
      pitfalls: [
        '把横向压缩倍率1/2写成sin(x/2)，反而拉长周期。',
        '平移复合角时只移动常数，漏乘前面的频率系数。',
        '把tan图穿过渐近线连接，或以为tan与sin一样周期2π。',
        '将第一象限单调性错误推广到所有实数，或忽略指数底数小于1。',
      ],
      examFocus: {
        goal: '从图像结构判断周期、对称和可取范围，再处理变换与跨章组合。',
        pastPaperSummary:
          '年度题通过正弦图像压缩和平移、第一象限弧度值比较，以及正弦值域与指数函数结合考查图像性质；周期还支撑指定区间内的解数判断。',
        pastPaperPatterns: [
          {
            form: '按先后顺序变换图像',
            description: '先横向压缩再平移，函数内的倍数同时作用于自变量和位移；用周期与零点核对。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q051'],
          },
          {
            form: '弧度值比较与余函数关系',
            description: 'sin组和cos组先各自按单调性排序，再转为同一函数比较两组最大值。',
            reference: '2021 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2021_ENGAA_Q031'],
          },
          {
            form: '值域嵌入指数函数',
            description: '将两个幂合成同底幂，利用sin在一整周的[-1,1]与底数小于1的递减性求最大值。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q019'],
          },
          {
            form: '周期和对称用于数解',
            description:
              '正弦与余弦方程可能有公共根，也可能跨越多个周期；应先列各分支再按区间去重。',
            reference: '2017、2018 ENGAA；2020年度题',
            sourceCodes: [
              'ENGAA_2017_S1-Q031',
              'ENGAA_2017_S1-Q045',
              'ESAT_LEGACY_2018_ENGAA_Q31',
              'ESAT-2020-MATHS2-008',
            ],
          },
        ],
        examples: [
          {
            title: '先横向压缩，再向左平移',
            source: {
              questionCode: 'ENGAA_2017_S1-Q051',
              why: '按变换顺序替换自变量，检查整个相位都随横向伸缩改变。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'H · $y=\\sin(2x+\\pi/2)$',
            steps: [
              '平行于 $x$ 轴伸缩因子为 $1/2$，原横坐标压到一半，函数变为 $y=\\sin(2x)$；不是把函数值乘 $1/2$。',
              '再向左平移 $\\pi/4$，应把新函数中的每一个 $x$ 换成 $x+\\pi/4$。',
              '得到 $y=\\sin[2(x+\\pi/4)]=\\sin(2x+\\pi/2)$，选H。',
              '核对：周期已从 $2\\pi$ 变为 $\\pi$；原压缩图上的原点平移到 $(-\\pi/4,0)$，代入新式也为0。',
            ],
            takeaway: '==先完成一步，再对整个新函数替换自变量；括号可以保住相位系数。==',
          },
          {
            title: '指数底数小于1，正弦越大结果越大吗？',
            source: {
              questionCode: 'NSAA_2023_S1-Q019',
              why: '用正弦值域缩小参数范围，再判断指数函数的单调方向。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C · $\\frac32$',
            steps: [
              '合并为 $2^{\\sin x}3^{-\\sin x}=(2/3)^{\\sin x}$，设 $t=\\sin x$。',
              '在 $0^\\circ\\le x\\le360^\\circ$ 内，$-1\\le t\\le1$，且两端都能取到。',
              '底数 $0<2/3<1$，指数越小，函数值越大；最大值在 $t=-1$ 时取得。',
              '取 $x=270^\\circ$，最大值 $(2/3)^{-1}=3/2$，选C。不能把 $\\sin x=1$ 对应的 $2/3$ 当作最大值。',
            ],
            takeaway: '==先确定三角函数的可取值，再判断外层函数是增还是减。==',
          },
        ],
        checklist: [
          '能画出sin、cos、tan的一个基本周期及特殊点。',
          '能说明奇偶、对称轴与周期各表示什么。',
          '能用关键点核对先后变换，并正确处理值域复合。',
        ],
      },
      visual: 'maths2-trigonometry',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120405',
      title: '三角恒等式',
      summary: math2TrigonometryMethods['120405'].summary,
      paragraphs: [math2TrigonometryMethods['120405'].intro],
      rules: math2TrigonometryMethods['120405'].blocks.flatMap((block) => [
        {
          title: block.title,
          text: [block.formula, ...(block.paragraphs ?? []), block.note].filter(Boolean).join(' '),
        },
        ...(block.points ?? []),
        ...(block.table?.rows.map((row) => ({
          title: row[0] ?? '',
          text: row.slice(1).join('；'),
        })) ?? []),
      ]),
      memory: math2TrigonometryMethods['120405'].memory,
      pitfalls: [
        '把tanθsinθ写成sin²θ，漏掉分母cosθ。',
        '把sin²θ写成sin2θ，误用不同的角。',
        '代数方程得到根后不检查函数值域或分母非零。',
        '开平方只写正根，却没有锐角或象限条件支持。',
      ],
      examFocus: {
        goal: '在保持定义域的前提下，把混合三角表达式化成可核验的单变量代数。',
        pastPaperSummary:
          '直接年度题将tan与sin相乘后统一为cos的二次方程，或用平方和简化高次三角式；难点在保留定义域、零分支和最终所求函数。',
        pastPaperPatterns: [
          {
            form: '正切乘正弦，统一成余弦二次式',
            description:
              '把tan写成sin/cos，乘分母后用平方和消去sin²；一个题问cos的可能值，另一个还要根据锐角条件转成tan。',
            reference: '2016 ENGAA；2019 NSAA',
            sourceCodes: ['ENGAA_2016_S1-Q037', 'NSAA_2019_S1-Q077'],
          },
          {
            form: '平方和与公因式共同降次',
            description: 'cos³与sin²cos先提cos，再用平方和降成cos的二次因子，不能约掉cos=0这支。',
            reference: '2020年度题',
            sourceCodes: ['ESAT-2020-MATHS2-008'],
          },
          {
            form: '单函数高次式先分支',
            description:
              'sin³与sin移项后提取sin，用精确值解二次因子；此题不必强行引入另一个三角函数。',
            reference: '2018 ENGAA · 关联代数方法',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q31'],
          },
        ],
        examples: [
          {
            title: '混合正弦、余弦和正切，统一成一个未知量',
            source: {
              questionCode: 'ENGAA_2016_S1-Q037',
              why: '先保留正切的定义域，再用平方和将混合表达式变成二次方程。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'D · $\\cos\\theta=\\frac35$ 或 $-\\frac12$',
            steps: [
              '原式含 $\\tan\\theta$，所以 $\\cos\\theta\\ne0$。写 $\\tan\\theta\\sin\\theta=\\sin^2\\theta/\\cos\\theta$，可在原定义域内两边乘 $\\cos\\theta$。',
              '令 $c=\\cos\\theta$，并用 $\\sin^2\\theta=1-c^2$：$7c^2-3(1-c^2)=c$，即 $10c^2-c-3=0$。',
              '分解为 $(5c-3)(2c+1)=0$，所以 $c=3/5$ 或 $c=-1/2$。两者均在[-1,1]且非零，符合原定义域。',
              '取 $c=3/5$ 时，原左端为 $21/5-3(16/25)/(3/5)=1$；取 $c=-1/2$ 也得1。选D。',
            ],
            takeaway: '==统一函数前写定义域；二次方程的根还要满足三角函数值域。==',
          },
        ],
        checklist: [
          '能说明两条基本恒等式及其定义域。',
          '能将混合表达式统一成一个函数。',
          '能检查平方、除法与开根号是否改变原解集。',
        ],
      },
      visual: 'maths2-trigonometry',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120406',
      title: '三角方程',
      summary: math2TrigonometryMethods['120406'].summary,
      paragraphs: [math2TrigonometryMethods['120406'].intro],
      rules: math2TrigonometryMethods['120406'].blocks.flatMap((block) => [
        {
          title: block.title,
          text: [block.formula, ...(block.paragraphs ?? []), block.note].filter(Boolean).join(' '),
        },
        ...(block.points ?? []),
        ...(block.table?.rows.map((row) => ({
          title: row[0] ?? '',
          text: row.slice(1).join('；'),
        })) ?? []),
      ]),
      memory: math2TrigonometryMethods['120406'].memory,
      pitfalls: [
        '除以sin或cos后漏掉它等于零的解。',
        'sin²u=a只取正平方根，漏掉负值分支。',
        '复合角换元时仍使用原变量的区间。',
        '把公共根重复计入并集，或忽略开闭端点。',
      ],
      examFocus: {
        goal: '以分支清单和有界区间代替猜测解数，并连接数列等外层条件。',
        pastPaperSummary:
          '年度题包括多个方程的公共根与并集、从等比级数反求复合角、高次sin方程的有限区间计数，以及平方和降次后的多周期计数。',
        pastPaperPatterns: [
          {
            form: '两方程的交集决定边界，再数并集',
            description:
              '先找同时满足sin方程与cos复合角方程的最小正根k，再在[0,k]内合并两套解，公共根只记一次。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q031'],
          },
          {
            form: '数列条件转成复合角',
            description: '无穷和先确定公比，再得到sin2x的值；换成2x时给定区间必须同步加倍。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q045'],
          },
          {
            form: '高次方程保留零支与正负支',
            description:
              'sin³与sin需要保留sin=0；含sin²与cos³的混合式用平方和后保留cos=0，再按所给闭区间列根。',
            reference: '2018 ENGAA；2020年度题',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q31', 'ESAT-2020-MATHS2-008'],
          },
          {
            form: '角域为恢复函数值提供限制',
            description:
              '联立三角形内角条件或指定锐角范围后，二次根与补角候选需进一步筛选；不能把求函数值与求角混为一谈。',
            reference: '2016 ENGAA；2019 NSAA · 关联应用',
            sourceCodes: ['ENGAA_2016_S1-Q037', 'NSAA_2019_S1-Q077', 'NSAA_2019_S1-Q087'],
          },
        ],
        examples: [
          {
            title: '数解之前，别把正弦为零这一支约掉',
            source: {
              questionCode: 'ESAT_LEGACY_2018_ENGAA_Q31',
              why: '因式分解保留零因子，按给定闭区间逐个列解。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'D · 5个解',
            steps: [
              '移项并提公因式：$2\\sin^3\\theta-\\sin\\theta=\\sin\\theta(2\\sin^2\\theta-1)=0$。',
              '得到 $\\sin\\theta=0$、$\\sin\\theta=\\sqrt2/2$、$\\sin\\theta=-\\sqrt2/2$ 三种情况。',
              '在 $-\\pi/2\\le\\theta\\le\\pi$ 内，零值分支为 $0,\\pi$；正值分支为 $\\pi/4,3\\pi/4$；负值分支为 $-\\pi/4$。',
              '共5个互不相同的解，选D。左端 $-\\pi/2$ 不满足，右端 $\\pi$ 满足且必须计入。',
            ],
            takeaway: '==先分支、再筛区间、最后去重；直接除以函数可能把整支解丢掉。==',
          },
          {
            title: '从无穷和得到正弦方程，角的范围也要加倍',
            source: {
              questionCode: 'ENGAA_2017_S1-Q045',
              why: '先求公比，再将复合角及其区间一起换元。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'A · $x=\\frac{13\\pi}{12},\\frac{17\\pi}{12}$',
            steps: [
              '首项为1、和为 $4/3$，由 $1/(1-r)=4/3$ 得 $r=1/4$；它满足 $|r|<1$。',
              '由 $r=\\frac12\\sin2x$ 得 $\\sin2x=1/2$。设 $u=2x$，同时将 $\\pi\\le x\\le2\\pi$ 改为 $2\\pi\\le u\\le4\\pi$。',
              '在该区间，$u=13\\pi/6$ 或 $17\\pi/6$。不能继续使用 $x$ 的旧区间去筛 $u$。',
              '除以2还原：$x=13\\pi/12$ 或 $17\\pi/12$，选A。两者都在原区间，且都给出公比1/4。',
            ],
            takeaway: '==复合角换元时，方程和区间必须一起变；最后再还原原变量。==',
          },
        ],
        checklist: [
          '能从代数分支恢复全部合法角。',
          '能同步变换复合角和区间，并处理开闭端点。',
          '能区别公共解、至少一个方程的解及解的个数。',
        ],
      },
      visual: 'maths2-trigonometry',
      sourceIds: ['esat-maths2-spec'],
    },
  ],
  sources: [
    {
      id: 'esat-maths2-spec',
      title: 'UAT-UK · ESAT 2026/2027 考纲 MM4',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按MM4.1—MM4.6核对范围，包含SSA歧义、二维与三维、弧度和弓形、基本精确值、图像与周期、两条基本恒等式及区间方程。讲解独立编写，例题正文来自现有题源。',
    },
  ],
}
