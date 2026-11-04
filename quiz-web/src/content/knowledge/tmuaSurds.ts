// TMUA 根式学习内容：用主平方根、结构化简和逻辑核验建立可迁移的解题思路。
import type { KnowledgeLesson } from './types'

export const tmuaSurds: KnowledgeLesson = {
  code: '221000',
  partial: true,
  title: 'Algebra and functions · 代数与函数',
  subtitle: '从根式的含义出发，掌握化简与判断',
  intro: '把根式看成有符号约束的运算：先确认表达式有意义，再利用结构化简，最后检验推理是否可逆。',
  memory: [
    '**主平方根非负。** $\\sqrt{a}$ 表示非负的那个平方根；$\\sqrt{x^2}=|x|$，不能不看符号直接写成 $x$。',
    '**乘除可以结合，和差不能拆开。** $a,b\\ge0$ 时 $\\sqrt a\\sqrt b=\\sqrt{ab}$，一般而言 $\\sqrt{a+b}\\ne\\sqrt a+\\sqrt b$。',
    '**看完全平方与共轭。** 提取平方因子、识别 $(a\\pm b)^2$，或使用 $(a+b)(a-b)=a^2-b^2$ 简化分母。',
    '**变形后回查原条件。** 开方、平方、约分和换元都可能需要定义域、符号或非零条件。',
  ],
  sections: [
    {
      code: '221002',
      title: '根式',
      summary: '理解主平方根与绝对值，辨认根式结构，并在化简与解方程时保留取值条件。',
      conceptFlow: {
        eyebrow: '从定义到推理',
        title: '先确定符号，再化简结构',
        lead: '平方会让正数和负数得到相同结果，但 $\\sqrt{\\phantom{x}}$ 只取非负值。==因此，$\\sqrt{x^2}=|x|$；恢复平方根之前先检查符号。==',
        visualPrompt:
          '在图中切换正、负和零，观察平方结果相同时，主平方根怎样对应到数轴上距原点的距离。',
        observations: [
          {
            title: '平方丢失符号',
            text: '$-3$ 与 $3$ 的平方都是 $9$；==$\\sqrt9=3$，不是 $\\pm3$==。',
          },
          {
            title: '一个根与一组解',
            text: '$\\sqrt9$ 是一个数，而方程 $x^2=9$ 有两个解 $x=\\pm3$。',
          },
        ],
        steps: [
          {
            label: '理解 01',
            title: '开平方为什么出现绝对值？',
            paragraphs: [
              '对任意实数 $x$，$x^2\\ge0$；$\\sqrt{x^2}$ 是平方等于 $x^2$ 的非负数，所以等于 $|x|$。',
              '图中选 $x=-3$，先平方得到 $9$，再开平方得到 $3$；选 $x=3$ 也得到 $3$。只有先知道 $x\\ge0$，才能写成 $\\sqrt{x^2}=x$。',
            ],
            takeaway: '==平方根是非负的；从平方恢复原数时要先判断符号。==',
          },
          {
            label: '方法 02',
            title: '提取平方因子，合并同类根式',
            paragraphs: [
              '将被开方数分成完全平方因子与剩余部分：$\\sqrt{18}=\\sqrt{9\\cdot2}=3\\sqrt2$。因此 $\\sqrt2+\\sqrt8=3\\sqrt2$。',
              '这个结果不是 $\\sqrt{10}$：根式乘法在非负条件下可以合并，加法却不能随意合并。含变量时，例如 $\\sqrt{9x^2}=3|x|$。',
            ],
            takeaway: '==先化到同类根式再合并；根号内的和不能直接拆开。==',
          },
          {
            label: '方法 03',
            title: '识别完全平方与共轭',
            paragraphs: [
              '看到两项与 $\\sqrt2$ 的组合，可尝试匹配 $(a-b\\sqrt2)^2$：$9-4\\sqrt2=(2\\sqrt2-1)^2$。因为 $2\\sqrt2>1$，所以 $\\sqrt{9-4\\sqrt2}=2\\sqrt2-1$。',
              '根式分母也能利用平方差：$\\frac1{\\sqrt2-1}=\\frac{\\sqrt2+1}{(\\sqrt2-1)(\\sqrt2+1)}=\\sqrt2+1$。有参数时须先确认原分母和共轭乘积均非零。',
            ],
            takeaway: '==配出平方以后仍要取绝对值；有理化不能改变原式定义域。==',
          },
          {
            label: '核验 04',
            title: '条件、候选解和论证方向',
            paragraphs: [
              '在实数范围内，$\\sqrt{A}$ 要求 $A\\ge0$，而 $\\frac1{\\sqrt A}$ 要求 $A>0$。把 $\\sqrt{A}=B$ 两边平方前，先记录 $B\\ge0$。',
              '平方后的方程可能产生增根；约去可能为零的因子也可能漏解。每个候选值都应代回原式，分母为零的情况要单独判断。证明“对所有数成立”时，可用一个合条件的反例推翻。',
            ],
            takeaway: '==先列定义域，变形后回代；必要条件不自动成为充分条件。==',
          },
        ],
      },
      paragraphs: [
        '$\\sqrt a$ 是 $a\\ge0$ 时的非负平方根。对所有实数 $x$，$\\sqrt{x^2}=|x|$。',
        '利用平方因子化简根式并合并同类项；$\\sqrt{a+b}$ 一般不能拆成两个根式的和。',
        '将嵌套根式被开方数写成完全平方，并在开平方后检查符号；分母有理化可使用共轭及平方差。',
        '解根式方程前列出定义域；平方、换元或约分后，检查候选解和被排除的零因子。',
      ],
      rules: [
        {
          title: '主平方根',
          text: '$a\\ge0$ 时 $\\sqrt a\\ge0$；对任意实数 $x$，$\\sqrt{x^2}=|x|$。',
        },
        {
          title: '运算与条件',
          text: '$a,b\\ge0$ 时 $\\sqrt a\\sqrt b=\\sqrt{ab}$；根式除法还要求分母非零。加减不满足对应拆分规则。',
        },
        {
          title: '完全平方和共轭',
          text: '匹配 $(a\\pm b)^2$ 的三项结构，或用 $(a+b)(a-b)=a^2-b^2$ 化简；开方后先判符号。',
        },
        {
          title: '方程与证明',
          text: '根式、分母及平方各自有条件；回代原式筛选结果，用反例辨别全称命题与证明方向。',
        },
      ],
      pitfalls: [
        '把 ==$\\sqrt{x^2}$ 写成 $x$==，忽略 $x<0$。',
        '把方程 $x^2=9$ 的两个解与 ==$\\sqrt9$ 的单个主平方根== 混为一谈。',
        '将 ==$\\sqrt{a+b}$ 拆成 $\\sqrt a+\\sqrt b$==，或未满足非负条件就合并根式。',
        '把 $\\sqrt{(a-b)^2}$ 直接写为 $a-b$，未比较符号；有理化时忘记检查分母。',
        '平方得到候选根后不回代，或 ==约去可能为零的因子== 而遗漏解。',
      ],
      visual: 'tmua-surds',
      sourceIds: ['tmua-spec', 'tmua-notes', 'tmua-logic', 'tmua-archive'],
      examFocus: {
        goal: '依据平方根定义、结构和取值范围，进行精确计算并识别证明中的错误。',
        pastPaperSummary:
          '逐题审阅本地已收录的 2017—2023 年 TMUA Paper 1 和 Paper 2。直接考查包括根式化简、方程条件与证明中的符号；根式也会作为函数图像、微积分和指数题的工具。以下按题目要求归纳，不以题量推断考试频率。',
        pastPaperPatterns: [
          {
            form: '直接考查：完全平方、精确比较与根式和积',
            description:
              '嵌套根式先识别完全平方再确定符号；比较根式数可使用界估计；已知二次根的和与积时，可构造平方根的和而不必分别求根。',
            reference: '2017、2019、2020 · Paper 1 / Paper 2',
            sourceCodes: ['TMUA-2017-P2-Q008', 'TMUA-2019-P2-Q019', 'TMUA-2020-P1-Q009'],
          },
          {
            form: '直接考查：主平方根的符号与论证错误',
            description:
              '平方开根须保留绝对值；题目可要求定位证明的第一处错误，或结合三角函数在不同象限的符号分类。',
            reference: '2018、2021 · Paper 2',
            sourceCodes: ['TMUA-2018-P2-Q013', 'TMUA_2021_P2_Q05', 'TMUA_2021_P2_Q19'],
          },
          {
            form: '直接考查：根式方程与定义域',
            description:
              '对根式方程进行平方、约分或换元时，分别检查根式非负、分母非零和可能被约掉的零因子；参数题还要求证明边界能否取到。',
            reference: '2018、2023 · Paper 2',
            sourceCodes: ['TMUA-2018-P2-Q009', 'TMUA-2018-P2-Q020', 'TMUA_2023_P2_Q01'],
          },
          {
            form: '关联应用：图像、换元与精确边界',
            description:
              '根式函数与其他图像相交时，先限制定义域或把 $\\sqrt{x}$ 换成非负变量，再筛选交点；根式图像与函数大小比较也可用于积分，根式边界可出现在不等式推理链里。',
            reference: '2019、2020、2022、2023 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA-2019-P1-Q009',
              'TMUA-2020-P1-Q012',
              'TMUA-2020-P1-Q017',
              'TMUA_2022_P2_Q12',
              'TMUA_2023_P1_Q10',
              'TMUA_2023_P2_Q10',
            ],
          },
          {
            form: '迁移应用：根式与指数、微积分和反例',
            description:
              '可先将根式写成分数指数，再处理递推、导数或定积分；平方差能化简含根式的分式。立方根需保留实数的符号，也可通过代入检验根式与指数的全称断言。作这些变形时仍要保留变量范围。',
            reference: '2018—2023 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA-2018-P1-Q001',
              'TMUA-2018-P1-Q015',
              'TMUA-2018-P2-Q001',
              'TMUA-2019-P1-Q004',
              'TMUA-2019-P1-Q012',
              'TMUA-2020-P1-Q001',
              'TMUA_2021_P2_Q01',
              'TMUA_2021_P2_Q17',
              'TMUA_2022_P1_Q13',
              'TMUA_2023_P2_Q02',
              'TMUA_2023_P2_Q03',
            ],
          },
        ],
        pastPaperNote:
          '以上区分直接根式推理与跨章节迁移，不把仅以根式书写答案的题目一律算作直接考查。例题仅展示两道；考法归纳保留其他相关年度题的来源。',
        selfCheckNote:
          '自测使用已发布的 TMUA 独立题库题，考查根式乘积与完全平方数之间的充分和必要条件。',
        examples: [
          {
            title: '知道根的和与积，能否直接求平方根的和？',
            source: {
              questionCode: 'TMUA-2020-P1-Q009',
              why: '用对称结构避免先解出两个根，并判断平方根的符号。',
              subject: 'tmua',
              kind: 'annual',
            },
            question: '',
            answer: 'C · $x^2-\\sqrt{20}x+3$',
            steps: [
              '由原式比较系数，$\\alpha+\\beta=14$、$\\alpha\\beta=9$，且题目明确 $\\alpha,\\beta>0$。',
              '展开目标式的常数项为 $\\sqrt\\alpha\\sqrt\\beta=\\sqrt{\\alpha\\beta}=3$。',
              '令 $s=\\sqrt\\alpha+\\sqrt\\beta$，则 $s^2=\\alpha+\\beta+2\\sqrt{\\alpha\\beta}=20$。由于 $s>0$，所以 $s=\\sqrt{20}$。',
              '目标式是 $x^2-sx+3=x^2-\\sqrt{20}x+3$，对应选项 C。',
            ],
            takeaway: '==先求平方再恢复值：要用正性决定取哪个平方根。==',
          },
          {
            title: '从平方恒等式开根，第一处错误在哪里？',
            source: {
              questionCode: 'TMUA_2021_P2_Q05',
              why: '通过符号与反例检查逐行推理，辨别平方根的真实含义。',
              subject: 'tmua',
              kind: 'annual',
            },
            question: '',
            answer: 'B · 开平方时丢失了绝对值',
            steps: [
              '第一行 $\\sin^2x+\\cos^2x=1$ 对所有实数 $x$ 成立，所以 $\\cos^2x=1-\\sin^2x$ 也成立。',
              '对两侧取主平方根得到 $|\\cos x|=\\sqrt{1-\\sin^2x}$，不能直接删除绝对值。',
              '令 $x=\\pi$：$\\cos x=-1$，而 $\\sqrt{1-\\sin^2x}=1$。第二行声称所有 $x$ 都相等，被这个反例推翻。',
              '之后的矛盾来自已经出错的前提；题目问第一处错误，应选 B。',
            ],
            takeaway: '==检查全称结论时，优先测试让表达式变号的情况。==',
          },
        ],
        checklist: [
          '能解释主平方根与方程 $x^2=a$ 的解有什么区别。',
          '能用绝对值写出 $\\sqrt{x^2}$，并根据符号去掉绝对值。',
          '能提取平方因子、识别同类根式和完全平方，必要时使用共轭。',
          '能列出根式与分母的定义条件，并检验平方或约分后的候选解。',
          '能通过反例、必要条件与充分条件检查根式相关论证。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'tmua-spec',
      title: 'UAT-UK · TMUA 考纲 MM1',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165619/TMUA_Content_Specification.pdf',
      note: '参考官方考纲中的根式及代数运算要求。',
    },
    {
      id: 'tmua-notes',
      title: 'UAT-UK · Notes on Mathematics',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/30103537/Notes_on_Mathematics_-for_TMUA_and_ESAT_M2.pdf',
      note: '参考数学知识说明整理根式结构、条件与计算。',
    },
    {
      id: 'tmua-logic',
      title: 'UAT-UK · Notes on Logic and Proof',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2025/06/25160507/Notes_on_Logic_and_Proof_June2025.pdf',
      note: '参考反例及必要、充分条件的推理要求。',
    },
    {
      id: 'tmua-archive',
      title: 'UAT-UK · TMUA 官方试题与练习材料',
      url: 'https://esat-tmua.ac.uk/tmua-preparation-materials/',
      note: '年度考法以本地已收录的 2017—2023 年 Paper 1 和 Paper 2 为依据。',
    },
  ],
}
