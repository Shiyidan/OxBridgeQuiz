// TMUA 多项式学习内容：由恒等变形、余式定理和反例连接代数结构与推理。
import type { KnowledgeLesson } from './types'

export const tmuaPolynomials: KnowledgeLesson = {
  code: '221000',
  partial: true,
  title: 'Algebra and functions · 代数与函数',
  subtitle: '从多项式结构出发，用余式、因式和根推理',
  intro: '先看表达式的结构，再选择展开、因式分解或代入；把结论放回题目的范围检验。',
  memory: [
    String.raw`**多项式恒等式可在每个实数处代入。** 若 $P(x)=(x-a)Q(x)+r$，则 $r=P(a)$。`,
    String.raw`**因式与根是同一关系的两种说法。** $P(a)=0$ 等价于 $(x-a)$ 是 $P(x)$ 的因式。`,
    String.raw`**留意重复根。** $(x-a)^2$ 是因式时 $a$ 仍只贡献一个不同的根。`,
    String.raw`**多项式不可约不等于取值一定是素数。** 一个合条件的反例可以推翻全称命题。`,
  ],
  sections: [
    {
      code: '221006',
      title: '多项式操作与定理',
      summary: '用结构化变形、余式定理与因式定理分析多项式，并检查根的数量和推理方向。',
      conceptFlow: {
        eyebrow: '从恒等式到推理',
        title: '余数、因式与根，为什么能互相转换？',
        lead: String.raw`多项式可以表示为“除式 × 商 + 余式”。==选择让除式为零的数代入，余式就直接显现==；余式为零时，这个数也是根。`,
        visualPrompt: String.raw`图中切换 $a$，比较 $P(a)$、图像中的点与除以 $x-a$ 的余数；特别观察 $a=-2$ 和 $a=1$。`,
        observations: [
          {
            title: '代入得到余数',
            text: String.raw`$P(x)=(x-a)Q(x)+r$ 中令 $x=a$，==余数就是 $P(a)$==。`,
          },
          {
            title: '余数为零',
            text: String.raw`图像上 $P(a)=0$ 时点落在 $x$ 轴，==$x-a$ 是因式==；重复因式不增加不同根的个数。`,
          },
        ],
        steps: [
          {
            label: '推导 01',
            title: '为什么除以一次式可直接代入？',
            paragraphs: [
              String.raw`多项式除以 $x-a$ 的余式是常数。恒等式 $P(x)=(x-a)Q(x)+r$ 对所有 $x$ 成立，代 $x=a$ 后第一项消失，得到 $r=P(a)$。`,
              String.raw`如图 $P(x)=x^3-3x+2$，取 $a=0$ 可见余数 $P(0)=2$；取 $a=1$ 可见余数为 $0$。`,
            ],
            takeaway: String.raw`==除以 $x+2$ 时令 $x=-2$，不是 $2$；除式为 $kx+b$ 时应代 $x=-b/k$（$k\ne0$）。==`,
          },
          {
            label: '观察 02',
            title: '从因式到根，也要留意重复',
            paragraphs: [
              String.raw`图中的 $P(x)=(x-1)^2(x+2)$，因此 $P(-2)=P(1)=0$，但只有 $-2$ 和 $1$ 两个不同的实根。`,
              String.raw`在 $-2$ 处，单次因式变号；在 $1$ 处，平方因式两侧不变号，图像与轴相切。这里的行为由给出的因式结构证明，不应仅凭截取的图像断言所有根。`,
            ],
            takeaway: '==“根的重数”和“不同根的个数”不是同一个量。==',
          },
          {
            label: '方法 03',
            title: '选择合适的表示，再比较系数',
            paragraphs: [
              String.raw`展开便于比较同次幂系数，因式形式便于看根、符号和余数；例如 $a^3-b^3=(a-b)(a^2+ab+b^2)$。`,
              String.raw`若两个多项式对所有实数 $x$ 恒相等，整理后各次幂的系数分别相等。若只知道它们在某一个 $x$ 相等，就不能直接逐项比较系数。`,
            ],
            takeaway: '==先识别题目给的是恒等关系，还是只在特定点成立的方程。==',
          },
          {
            label: '检查 04',
            title: '从候选因式到有效结论',
            paragraphs: [
              String.raw`求多项式方程时先保留所有因式，列出各因式为零的情况，再结合题目对实数、不同根或范围的限制筛选。若约去含未知数的因式，须单独检查该因式为零。`,
              String.raw`多项式不能分解成整数系数一次因式，并不能保证代入整数所得的值是素数：$3x^2+3x+1$ 的判别式是 $-3$，但 $x=5$ 时它等于 $91=7\times13$。`,
            ],
            takeaway: '==多项式的因式分解和某一次取值的整数分解，是两种不同的判断。==',
          },
        ],
      },
      paragraphs: [
        String.raw`由 $P(x)=(x-a)Q(x)+r$ 代入 $x=a$，得到余式 $r=P(a)$；余式为零时，$x-a$ 是因式。`,
        String.raw`$P(x)=(x-1)^2(x+2)$ 有两个不同实根 $1,-2$，其中 $1$ 是重根。`,
        '展开和比较系数适合处理恒等式；因式形式更适合识别根、符号和重复次数。',
        '不可约是对多项式因式的判断，不等于每个整数输入所得的数都是素数。',
      ],
      rules: [
        {
          title: '余式定理',
          text: String.raw`$P(x)$ 除以 $x-a$ 的余数是 $P(a)$；除以 $kx+b$ 时令 $x=-b/k$，其中 $k\ne0$。`,
        },
        { title: '因式定理', text: String.raw`$P(a)=0$ 当且仅当 $x-a$ 是 $P(x)$ 的因式。` },
        {
          title: '重根和符号',
          text: '同一个根的因式可能出现多次；只有题目要求按重数计数时才重复计算。',
        },
        { title: '恒等关系', text: '同变量多项式对所有实数恒相等，才能对对应次数比较系数。' },
      ],
      pitfalls: [
        String.raw`把除式 $x+2$ 对应的代入值误写为 ==$2$ 而不是 $-2$==。`,
        String.raw`已知 $P(a)=0$ 却误写因式 $x+a$；若除式为 $2x+1$，对应的根是 $-\frac12$。`,
        '将重根按多个不同根计数，或从有限范围内的图像推断全部根。',
        '只在一个点相等便把两个多项式的系数逐项比较。',
        '约去可能为零的因式而漏解；把多项式不可约误当成每个整数值都是素数。',
      ],
      visual: 'tmua-polynomials',
      sourceIds: ['tmua-spec', 'tmua-notes', 'tmua-logic', 'tmua-archive'],
      examFocus: {
        goal: '把余式、因式和根联系起来，并用代数结构与反例检查结论。',
        pastPaperSummary:
          '逐题审阅本地已收录的 2017—2023 年 TMUA Paper 1 和 Paper 2；直接题考查余式、因式或多项式推理，其他题将结构与根应用到展开、图像及根数问题。',
        pastPaperPatterns: [
          {
            form: '直接考查：余式定理与因式条件',
            description:
              '直接代入除式的零点求余式、比较两个余式，或把多个因式转成多个根条件求参数。2019 Paper 2 第 2 题与 2020 Paper 1 第 2 题在本地记录中题面相同，不视为两个不同题型。',
            reference: '2017—2020 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA-2017-P1-Q004',
              'TMUA-2018-P1-Q005',
              'TMUA-2019-P2-Q002',
              'TMUA-2020-P1-Q002',
            ],
          },
          {
            form: '直接考查：代数变形与证明是否有效',
            description:
              '立方差可因式分解，但一个数的乘积分解不必按因子的大小逐项对应；不可约多项式代入整数后仍可能得到合数。要找出证明中第一处失效的推理。',
            reference: '2017、2020、2022 · Paper 2',
            sourceCodes: ['TMUA-2017-P2-Q009', 'TMUA-2020-P2-Q003', 'TMUA_2022_P2_Q07'],
          },
          {
            form: '关联应用：展开与系数',
            description:
              '二项式或多项式展开中，根据次数选择项、合并同次幂，结合比值、整除或系数条件求值；这类题与数列和二项式展开内容交叉。',
            reference: '2017—2023 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA-2017-P1-Q013',
              'TMUA-2018-P1-Q007',
              'TMUA-2018-P2-Q002',
              'TMUA-2019-P1-Q003',
              'TMUA-2019-P2-Q001',
              'TMUA-2020-P1-Q013',
              'TMUA_2021_P1_Q16',
              'TMUA_2022_P2_Q02',
              'TMUA_2023_P1_Q06',
            ],
          },
          {
            form: '关联应用：多项式的根、图像与参数',
            description:
              '利用因式结构、换元、平移或导数研究不同实根、重根、曲线交点和参数范围；根与系数可构造新式，因式和平方结构也可判断不等式符号。四次方程可先令 $t=x^2$，并保留 $t\\ge0$。',
            reference: '2017—2023 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA-2017-P1-Q019',
              'TMUA-2017-P2-Q019',
              'TMUA-2018-P1-Q009',
              'TMUA-2018-P2-Q015',
              'TMUA-2019-P1-Q020',
              'TMUA-2020-P1-Q003',
              'TMUA-2020-P1-Q009',
              'TMUA-2020-P1-Q020',
              'TMUA-2020-P2-Q018',
              'TMUA_2021_P1_Q12',
              'TMUA_2021_P2_Q06',
              'TMUA_2021_P2_Q08',
              'TMUA_2021_P2_Q09',
              'TMUA_2022_P1_Q10',
              'TMUA_2022_P1_Q16',
              'TMUA_2022_P1_Q18',
              'TMUA_2022_P2_Q17',
              'TMUA_2023_P1_Q14',
              'TMUA_2023_P2_Q10',
              'TMUA_2023_P2_Q18',
              'TMUA_2023_P2_Q19',
            ],
          },
        ],
        pastPaperNote:
          '直接题与关联题分别列出；并非每道关联题都要求余式定理或因式定理。考法依据本地已收录的年度真题，不以数量推断考试频率。',
        selfCheckNote: '自测选自已发布的独立题库，以高次多项式换元和实根计数检查取值范围。',
        examples: [
          {
            title: '两个余式相减时，哪些系数会消失？',
            source: {
              questionCode: 'TMUA-2018-P1-Q005',
              why: '用余式定理代入两个除式的零点，再在有限排列中优化。',
              subject: 'tmua',
              kind: 'annual',
            },
            question: '',
            answer: 'D · $17$',
            steps: [
              String.raw`由余式定理，$R=f(-2)$、$S=f(-3)$。保持结构做差：$R-S=(-8+4a-2b+c)-(-27+9a-3b+c)=19-5a+b$。`,
              String.raw`$a,b,c$ 是 $1,2,3$ 的排列；要让 $19-5a+b$ 最大，取最小的 $a=1$ 和最大的 $b=3$，剩下 $c=2$。`,
              String.raw`于是 $R-S=19-5+3=17$，对应 D；常数 $c$ 在两次代入之差中抵消。`,
            ],
            takeaway: '==两次求余先作差，消去共同项后再利用参数范围优化。==',
          },
          {
            title: '多项式不能分解，代入后一定得到素数吗？',
            source: {
              questionCode: 'TMUA_2022_P2_Q07',
              why: '辨析多项式因式分解和整数值的素性，定位证明的第一处错误。',
              subject: 'tmua',
              kind: 'annual',
            },
            question: '',
            answer: 'F · 第一处错误在 IV',
            steps: [
              String.raw`I、II 正确展开立方差：$(x+1)^3-x^3=3x^2+3x+1$；III 的判别式为 $3^2-4\cdot3\cdot1=-3<0$，所以该多项式没有实系数一次因式分解。`,
              String.raw`IV 却把“多项式没有整数系数一次因式”推广为“对每个正整数 $x$，其整数值都不可分解”。这一步没有依据。`,
              String.raw`反例 $x=5$ 给出 $3(5)^2+3(5)+1=91=7\times13$。结论确实不成立，但应选第一处错误 IV，对应 F。`,
            ],
            takeaway: '==检验证明时区分代数对象与它的取值，先定位最早出错的推理。==',
          },
        ],
        checklist: [
          '能由除法恒等式说明余式定理和因式定理。',
          '能从一次除式准确确定代入值，并用多个条件求参数。',
          '能区分根的重数、不同实根数和图像交点。',
          '能判断何时可以比较系数，检查约分可能遗漏的零因子。',
          '能用反例辨别多项式结构与整数值的性质。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'tmua-spec',
      title: 'UAT-UK · TMUA 考纲',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165619/TMUA_Content_Specification.pdf',
      note: '参考多项式运算、余式与因式的考纲要求。',
    },
    {
      id: 'tmua-notes',
      title: 'UAT-UK · Notes on Mathematics',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/30103537/Notes_on_Mathematics_-for_TMUA_and_ESAT_M2.pdf',
      note: '参考代数与函数的数学说明。',
    },
    {
      id: 'tmua-logic',
      title: 'UAT-UK · Notes on Logic and Proof',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2025/06/25160507/Notes_on_Logic_and_Proof_June2025.pdf',
      note: '参考反例与推理方向。',
    },
    {
      id: 'tmua-archive',
      title: 'UAT-UK · TMUA 官方试题与练习材料',
      url: 'https://esat-tmua.ac.uk/tmua-preparation-materials/',
      note: '考法归纳依据本地已收录的 2017—2023 年两卷。',
    },
  ],
}
