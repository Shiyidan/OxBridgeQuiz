// ESAT 数学2第六章微分讲义：按变化率、幂函数求导与应用组织复习，保留全部相关年度考法证据。
import type { KnowledgeLesson } from './types'
import { math2DifferentiationMethods } from './math2DifferentiationMethods'

export const esatMath2Differentiation: KnowledgeLesson = {
  code: '120600',
  title: 'Differentiation · 微分',
  subtitle: '从一条切线看变化，再用导数决定方向与最值',
  intro:
    '微分把“函数值是多少”和“函数怎样变化”分开。本章先理解斜率、瞬时变化率与二阶导数，再把根式和分式整理成幂的和，最后用导数处理切线、法线、单调与最值。每一步都保留定义域，求出驻点后还要判断它的意义。',
  memory: [
    "**先分清三个量。**$f(x)$ 是函数值，$f'(x)$ 是变化率，$f''(x)$ 是变化率怎样改变；三者不是同一个问题。",
    '**先化简再求导。**$x^n$ 的导数是 $nx^{n-1}$；根式写成分数指数，分母移成负指数，常数项变0。',
    '**切线用导数，法线用负倒数。**过点式中的点必须在原曲线上；水平切线对应竖直法线，不能除以0。',
    "**驻点只是候选。**先找 $f'=0$，再看左右符号或二阶导数；求全区间最值还要检查端点及可取范围。",
  ],
  sections: [
    {
      code: '120601',
      title: '导数作为斜率/变化率',
      summary: math2DifferentiationMethods['120601'].summary,
      paragraphs: [math2DifferentiationMethods['120601'].intro],
      rules: math2DifferentiationMethods['120601'].blocks.flatMap((block) => [
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
      memory: math2DifferentiationMethods['120601'].memory,
      pitfalls: [
        "把 $f'(a)$ 当作 $f(a)$，或把 $f''$ 当成 $(f')^2$。",
        '把负速度取绝对值后回答“速度”，丢失方向。',
        '先代入指定x得到常数，再把这个常数求导为0。',
        '看到二阶导数为正，就误认为函数值或一阶导数必为正。',
      ],
      examFocus: {
        goal: '把题目中的斜率、变化率与导数条件准确翻译成所需的函数或数值。',
        pastPaperSummary:
          '相关年度题会在不同位置给出一阶、二阶导数条件，要求反推参数；也会把“最大斜率”作为目标，检验能否把导函数本身当成研究对象。曲线切线题则直接连接导数值与直线斜率。',
        pastPaperPatterns: [
          {
            form: '一阶与二阶导数在不同点给条件',
            description:
              '分别写出两阶导数，按照各自指定位置代入；负数点的奇偶次幂必须分清，再联立求参数。',
            reference: '2023 ENGAA',
            sourceCodes: ['ENGAA_2023_S1-Q033'],
          },
          {
            form: '求斜率的最大值，而非曲线的最大高度',
            description:
              '先从原曲线得到梯度函数，再用代数化简或二阶导数判断梯度如何变化；最终返回导数的值。',
            reference: '2020 ENGAA',
            sourceCodes: ['ESAT-2020-MATHS2-010'],
          },
          {
            form: '由已知切线斜率定位切点',
            description:
              '将曲线导数等于直线斜率，求出切点横坐标后代回原曲线；斜率条件不能代替过点条件。',
            reference: '2018 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q33'],
          },
        ],
        pastPaperNote:
          '当前年度数学2题没有直接以“位移对时间求速度”为主问的题；这一变化率含义用明确标识的独立题库例题补足，不算作年度真题考法。',
        selfCheckNote:
          '自测要求先求斜率函数，再求它的最大值，连接本节的导数含义与后面最值方法；不要去求原函数的最大高度。',
        examples: [
          {
            title: '一阶、二阶导数给在不同位置，如何联立？',
            source: {
              questionCode: 'ENGAA_2023_S1-Q033',
              why: '区分一阶与二阶导数条件，先求导再在不同位置代入联立。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C · $a+b=-7/5$',
            steps: [
              "先整理成幂：$f(x)=ax^{-1}+bx^{-2}$，原定义域为 $x\\ne0$。求导得 $f'(x)=-ax^{-2}-2bx^{-3}$。",
              "由 $f'(1)=2$ 得 $-a-2b=2$。注意这是斜率条件，不能写成 $a+b=2$。",
              "再求导得 $f''(x)=2ax^{-3}+6bx^{-4}$。在 $x=-1$ 处，奇次幂为负、偶次幂为正，所以 $-2a+6b=-2$。",
              '由 $a=-2-2b$ 代入第二式，得 $4+10b=-2$，因此 $b=-3/5$、$a=-4/5$，所求和为 $-7/5$，选C。',
              '复核：$-a-2b=4/5+6/5=2$，$-2a+6b=8/5-18/5=-2$，两条导数条件均满足。',
            ],
            takeaway: '==导数阶数与代入位置分别对齐，再把微分条件变成代数方程。==',
          },
          {
            title: '瞬时速度为负，表示什么？',
            source: {
              questionCode: 'ESAT-M2-MOCK-ADAPT-R2-E05-004',
              why: '用位移对时间的导数求瞬时速度，并保留方向与单位。',
              subject: 'mathematics2',
              kind: 'bank',
            },
            question: '',
            answer: 'B · $-3\\,\\mathrm{m\\,s^{-1}}$',
            steps: [
              '题目给位移 $s(t)=t^3-6t^2+9t$，要求的是 $t=2$ 的瞬时速度，所以先求 $v(t)=ds/dt$。',
              '逐项求导：$v(t)=3t^2-12t+9$，单位是 $\\mathrm{m\\,s^{-1}}$；原式中的常数系数随求导保留。',
              '代入 $t=2$：$v(2)=12-24+9=-3$，选B。若题目问速率才取绝对值3，本题问速度要保留负号。',
              '原位移 $s(2)=2\\,\\mathrm m$ 与瞬时速度 $-3\\,\\mathrm{m\\,s^{-1}}$ 并不矛盾：位置仍在正方向一侧，但物体正在向反方向运动。',
            ],
            takeaway: '==先看“量对什么变量变化”，再求对应导数；正负号和单位都是答案的一部分。==',
          },
        ],
        checklist: [
          '能区分函数值、一阶导数、二阶导数及各自的代入位置。',
          '能区分平均变化率、瞬时变化率、速度与速率。',
          '能说明“斜率增大”和“函数递增”为什么不同。',
        ],
      },
      visual: 'maths2-differentiation',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120602',
      title: '幂函数求导',
      summary: math2DifferentiationMethods['120602'].summary,
      paragraphs: [math2DifferentiationMethods['120602'].intro],
      rules: math2DifferentiationMethods['120602'].blocks.flatMap((block) => [
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
      memory: math2DifferentiationMethods['120602'].memory,
      pitfalls: [
        '只把次数减1，却忘记把原次数乘到系数上。',
        '把 $-2-1$ 写成 $-1$，或对根式求导时忘记 $1/2$。',
        "漏掉平方展开的交叉项，或把 $(u/v)'$ 当成 $u'/v'$。",
        '题目问导函数的三次项，却直接找原函数的三次项系数。',
        '约分后给原先无定义的点补上函数值或导数值。',
      ],
      examFocus: {
        goal: '将表达式整理到可逐项求导的形态，准确处理系数、负指数和分数指数。',
        pastPaperSummary:
          '年度题常把求导嵌入代数整理：先展开根式平方、从二项式中提取目标次数、连续求导后用条件确定参数。并不需要先引入复杂求导规则。',
        pastPaperPatterns: [
          {
            form: '根式平方先展开，再求指定点的导数',
            description:
              '展开后只剩线性项、常数和倒数项；先求一般导函数，再代分数，避免把平方或分母算错。',
            reference: '2021 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2021_ENGAA_Q021'],
          },
          {
            form: '二项式系数与求导的降次相结合',
            description:
              '导数中某次幂来自原式高一次的幂，锁定该项后乘原次数即可；先展开目标项可避开对复合幂求导。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q043'],
          },
          {
            form: '负指数连续求导，再联立参数',
            description:
              '将分母幂改成负指数，分别求一阶与二阶导数，代入不同点；奇偶次负数幂是主要符号检查。',
            reference: '2023 ENGAA',
            sourceCodes: ['ENGAA_2023_S1-Q033'],
          },
          {
            form: '分数幂导数成为后续最值对象',
            description:
              '先正确写出含平方根的梯度，再通过换元或继续求导找其最值；求导的系数关系是后续全部判断的起点。',
            reference: '2020 ENGAA',
            sourceCodes: ['ESAT-2020-MATHS2-010'],
          },
        ],
        selfCheckNote:
          '自测用三次式逐项求导，并把给定驻点当作导函数的根比较系数；这是从求导计算衔接下一节导数应用的练习，驻点不是原函数的零点。',
        examples: [
          {
            title: '根式平方看着复杂，展开后只需三项',
            source: {
              questionCode: 'ESAT_LEGACY_2021_ENGAA_Q021',
              why: '先展开根式平方成为幂的和，再逐项求导和代入。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C · $3$',
            steps: [
              '原式含 $\\sqrt{x}$ 在分母，先记 $x>0$。展开平方：$y=4x-2+\\frac1{4x}$，交叉项是 $-2(2\\sqrt{x})(1/(2\\sqrt{x}))=-2$。',
              "写成幂的和：$y=4x-2+\\frac14x^{-1}$。逐项求导得 $y'=4-\\frac14x^{-2}=4-\\frac1{4x^2}$。",
              "代入 $x=1/2$：$4x^2=4(1/4)=1$，所以 $y'=4-1=3$，选C。",
              '求导后的常数项消失，倒数项的导数为负；注意即使交叉项本题求导后变0，展开时也应保留，避免原函数数值与后续判断出错。',
            ],
            takeaway: '==先把复杂外形化成幂的和，再套同一条规则。==',
          },
          {
            title: '导函数的三次项，要向原式找四次项',
            source: {
              questionCode: 'ENGAA_2017_S1-Q043',
              why: '从原多项式的四次项得到导函数的三次项系数，无需引入链式法则。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'E · $19440$',
            steps: [
              "原式是 $y=(2+3x)^6$。导数中的 $x^3$ 项，只可能来自原式的 $x^4$ 项，因为 $(Ax^4)'=4Ax^3$。",
              '二项式的四次项为 $\\binom64\\,2^2(3x)^4$，其系数是 $15\\cdot4\\cdot81=4860$。',
              '求导把该系数再乘4，得到 $4\\cdot4860=19440$，选E。其他次数求导后不会变成 $x^3$。',
              '这条路径只用二项式展开与幂函数求导；不必先记复合幂的求导公式，也无需展开全部七项。',
            ],
            takeaway: '==先追踪次数如何变化，再计算那一项的系数。==',
          },
        ],
        checklist: [
          '能把根式、倒数和可拆分的分式写成幂的和。',
          '能连续求导，正确处理负指数与分数系数。',
          '能先确定目标项次数再求系数，并保留原定义域。',
        ],
      },
      visual: 'maths2-differentiation',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120603',
      title: '导数应用',
      summary: math2DifferentiationMethods['120603'].summary,
      paragraphs: [math2DifferentiationMethods['120603'].intro],
      rules: math2DifferentiationMethods['120603'].blocks.flatMap((block) => [
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
      memory: math2DifferentiationMethods['120603'].memory,
      pitfalls: [
        '把切线斜率当法线斜率，或只取倒数却漏掉负号。',
        "把 $f'(x)>0$ 写成 $f(x)>0$，混淆升降与所在高度。",
        "看到 $f'=0$ 就断言极值，或看到 $f''=0$ 就断言不是极值。",
        '把两个不同驻点的条件写成 $\\Delta\\ge0$，把重根也计作两个。',
        '几何建模时写错宽度、漏掉体积约束或只求尺寸却未算目标量。',
      ],
      examFocus: {
        goal: '把曲线与几何条件转成导数关系，并用符号、过点与范围证明确实满足要求。',
        pastPaperSummary:
          '相关年度题涵盖切线截距、单调区间、由极值位置反推系数、转折点数量的参数条件、几何最值与水平线交点数。部分二次最值也能用配方；导数提供统一方法，但并非所有最值题都只能求导。',
        pastPaperPatterns: [
          {
            form: '切线斜率与曲线过点同时成立',
            description:
              '已知直线斜率先定位切点，再代入直线求截距；只有斜率相等而没有过同一点，不能保证相切。',
            reference: '2018 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q33'],
          },
          {
            form: '导数符号转为参数化单调区间',
            description:
              '三次函数的一阶导函数是二次多项式，解其正负区间；根式边界与负半轴分支要完整，单调区间端点的零导数也需正确解释。',
            reference: '2016 ENGAA',
            sourceCodes: ['ENGAA_2016_S1-Q043'],
          },
          {
            form: '给出极值横坐标，反推多项式参数',
            description:
              '将已知横坐标作为导函数的根，通过系数对比或联立求参数；原函数的零点与驻点不能混淆。',
            reference: '2017 ENGAA；2019 NSAA',
            sourceCodes: ['ENGAA_2017_S1-Q039', 'NSAA_2019_S1-Q075'],
          },
          {
            form: '两个不同转折点转为判别式严格为正',
            description:
              '三次曲线的导函数是二次式，两个不同实根才能给两个不同转折点；参数边界对应根合并，不能含入。',
            reference: '2020 ENGAA',
            sourceCodes: ['ESAT-2020-MATHS2-007'],
          },
          {
            form: '几何约束建立单变量目标函数',
            description:
              '用矩形宽高、扇形周长或三角形边长关系建立面积函数，再在合法范围内找最大值；二次目标可配方，分数幂目标可先展开后求导。',
            reference: '2017、2021、2022 ENGAA',
            sourceCodes: [
              'ENGAA_2017_S1-Q041',
              'ESAT_LEGACY_2021_ENGAA_Q039',
              'ESAT_LEGACY_2022_ENGAA_Q033',
            ],
          },
          {
            form: '曲线最低点决定几何尺寸',
            description:
              '抛物线的两个零点决定矩形底边，最低点决定矩形高度，最后求固定矩形的面积。这里是在定位曲线最低点，并非优化一个可变矩形的面积；可用配方或导数。',
            reference: '2022 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2022_ENGAA_Q035'],
          },
          {
            form: '带运动范围的竖直距离最小值',
            description:
              '先限制光标能到达的横坐标，再比较曲线高度与给定水平线，优化题目指定的竖直距离；不要改成两点欧氏距离。',
            reference: '2016 ENGAA',
            sourceCodes: ['ENGAA_2016_S1-Q049'],
          },
          {
            form: '用极值高度判断水平线交点数',
            description:
              '求多项式驻点及对应高度，按各单调区段判断水平线穿过次数；临界高度会让两个交点合并，求不同实根数时必须排除相等情形。',
            reference: '2016 ENGAA',
            sourceCodes: ['ENGAA_2016_S1-Q053'],
          },
        ],
        pastPaperNote:
          '当前相关年度题中没有直接以曲线法线为主问的题，本节用独立题库例题补足。几何二次最值题允许配方；图像交点题与后续函数图像章节交叉，不据此引入拐点计算或超出本章的求导规则。',
        examples: [
          {
            title: '切线斜率已知，还缺哪一个条件？',
            source: {
              questionCode: 'ESAT_LEGACY_2018_ENGAA_Q33',
              why: '先使曲线导数等于已知切线斜率，再用切点求截距。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C · $k=1/4$',
            steps: [
              "切线 $y=x+k$ 的斜率是1。曲线 $f(x)=3x^2-2x+1$ 的导数为 $f'(x)=6x-2$。",
              '设切点横坐标为a，令 $6a-2=1$，得到 $a=1/2$。',
              '切点必须在原曲线上：$f(1/2)=3/4-1+1=3/4$，所以切点是 $(1/2,3/4)$。',
              '代入切线 $3/4=1/2+k$，得到 $k=1/4$，选C。也可将直线与曲线联立，得 $3(x-1/2)^2=0$，只有一个重复交点。',
            ],
            takeaway: '==导数给方向，原函数给位置；两个条件一起决定切线。==',
          },
          {
            title: '递增区间的端点，导数可以是零吗？',
            source: {
              questionCode: 'ENGAA_2016_S1-Q043',
              why: '由导数的符号区间判断递增，并区分区间端点与处处正导数。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'G · $x\\le-a/\\sqrt3$ 或 $x\\ge a/\\sqrt3$',
            steps: [
              "参数 $a>0$。求导得到 $f'(x)=3x^2-a^2$，零点为 $x=\\pm a/\\sqrt3$。",
              '导函数是开口向上的二次式，在两根外侧为正、两根之间为负。因此原函数在左侧区间递增，中间递减，右侧区间再递增。',
              '严格正导数出现在 $x<-a/\\sqrt3$ 或 $x>a/\\sqrt3$；但本题问递增区间，边界处导数为0仍可作为每一段递增区间的端点。',
              '对应选项G：$(-\\infty,-a/\\sqrt3]$ 与 $[a/\\sqrt3,+\\infty)$。这是两个分别递增的区间，不是说把两区间并起来后任意两点的函数值仍保持递增。',
            ],
            takeaway: '==区间内部看导数符号；零导数的端点不等于整段失去递增性。==',
          },
          {
            title: '矩形右边固定在15，宽度应写成什么？',
            source: {
              questionCode: 'ESAT_LEGACY_2021_ENGAA_Q039',
              why: '从真实图形列矩形面积，展开为分数幂后求导并核验全区间最值。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'B · $10\\sqrt5$',
            steps: [
              '设 $S=(x,\\sqrt{x})$，则 $P=(x,0)$、$Q=(15,0)$。矩形宽为 $15-x$，高为 $\\sqrt{x}$，非退化矩形要求 $0<x<15$。',
              '面积 $A(x)=(15-x)\\sqrt{x}=15x^{1/2}-x^{3/2}$。先展开成幂的和，不需要乘积求导法则。',
              "求导：$A'(x)=15/(2\\sqrt{x})-(3/2)\\sqrt{x}=(15-3x)/(2\\sqrt{x})$。分母在合法范围内为正，故面积在 $0<x<5$ 递增，在 $5<x<15$ 递减。",
              '唯一内部最大值位于 $x=5$。当x趋近0或15时，面积趋近0，不会给更大值；因此 $A_{\\max}=10\\sqrt5$，选B。',
              '最后核对所问是面积：5是左边界横坐标，10是宽度，$\\sqrt5$ 是高度，不能把其中任一个当答案。',
            ],
            takeaway: '==先读图确定每条边的含义，求导后用符号变化证明最大。==',
          },
          {
            title: '法线经过另一点，怎样把几何条件串起来？',
            source: {
              questionCode: 'ESAT-TMUA-A20-M2-20260828-014-R2',
              why: '以同一交点连接曲线、直线与法线，再由截距条件筛选参数。',
              subject: 'mathematics2',
              kind: 'bank',
            },
            question: '',
            answer: 'B · $a=-3/8$',
            steps: [
              '设公共点为 $P=(t,2t)$，其中 $t>1$。它也在曲线 $y=x^3+a$ 上，所以 $a=2t-t^3$。',
              '切线斜率为 $3t^2$，非零；法线斜率为 $-1/(3t^2)$。过P的法线写成 $y-2t=-(x-t)/(3t^2)$。',
              '给定法线经过 $(0,29/9)$。在法线方程令 $x=0$，得 $2t+1/(3t)=29/9$，再乘 $9t$ 得 $18t^2-29t+3=0$。',
              '因式分解 $(2t-3)(9t-1)=0$，候选 $t=3/2$ 或 $1/9$。由 $t>1$ 只留 $t=3/2$。',
              '代回所求参数：$a=2(3/2)-(3/2)^3=3-27/8=-3/8$，选B。法线纵截距 $3+2/9=29/9$，复核成立。',
            ],
            takeaway: '==用一个参数表示同一切点，按“曲线—切线斜率—法线—过点”逐步连接。==',
          },
        ],
        checklist: [
          '能写出切线与法线，处理水平切线对应竖直法线的例外。',
          '能用导数符号判断单调与极值，知道零导数和零二阶导数各不能推出什么。',
          '能由几何约束建立目标函数，并检查驻点、范围和最终所求量。',
        ],
      },
      visual: 'maths2-differentiation',
      sourceIds: ['esat-maths2-spec'],
    },
  ],
  sources: [
    {
      id: 'esat-maths2-spec',
      title: 'UAT-UK · ESAT 2026/2027 考纲 MM6',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按MM6.1—MM6.3核对导数含义、二阶导数、幂的和差求导与应用；不要求第一性原理推导或拐点计算。全量审阅88道年度数学2题，归纳15道相关题；独立题库例题明确标识，不计作年度证据。',
    },
  ],
}
