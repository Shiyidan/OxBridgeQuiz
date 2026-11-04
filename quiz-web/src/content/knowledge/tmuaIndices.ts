// TMUA 有理指数讲义：从根式、运算结构和取值条件理解指数律。
import type { KnowledgeLesson } from './types'

export const tmuaIndices: KnowledgeLesson = {
  code: '221000',
  partial: true,
  title: 'Algebra and functions · 代数与函数',
  subtitle: '从根式理解有理指数，再用指数律整理关系',
  intro: '将分数指数、根式和倒数联系起来；化简前先确定底数的取值范围。',
  memory: [
    String.raw`**分母表示开几次方，分子表示乘方。** 对 $a>0$，$a^{m/n}=(\sqrt[n]{a})^m$，其中 $n$ 是正整数。`,
    String.raw`**负指数表示倒数。** $a^{-r}=1/a^r$，因此底数不能为零。`,
    String.raw`**同底相乘指数相加、相除指数相减，幂的幂指数相乘。** 先检查各式有定义，再使用指数律。`,
    String.raw`**平方根取非负值。** 对实数 $x$，$\sqrt{x^2}=|x|$，不一定等于 $x$。`,
  ],
  sections: [
    {
      code: '221001',
      title: '有理指数指数律',
      summary: '用开方和倒数解释分数指数、负指数，并用条件与反例检验指数变形。',
      conceptFlow: {
        eyebrow: '从定义出发',
        title: '把指数当作运算结构',
        lead: String.raw`指数不是装饰：它记录乘方、开方与取倒数的关系。==统一底数之前，先确认底数和原式的取值条件。==`,
        visualPrompt: String.raw`图中选择底数 $4$、指数 $\frac32$，把“先开方，再立方”的结果与 $4^{3/2}$ 对照；再切换负指数观察倒数。`,
        observations: [
          {
            title: '指数的分母',
            text: String.raw`对正底数，$\frac{1}{n}$ 表示取正的 $n$ 次方根。==分母确定根的次数==。`,
          },
          {
            title: '指数的符号',
            text: String.raw`固定正底数后，正负相反的指数对应的值互为倒数；==负指数不是负数==。`,
          },
        ],
        steps: [
          {
            label: '定义 01',
            title: '为什么分数指数对应根式？',
            paragraphs: [
              String.raw`设 $a>0$、$n$ 是正整数。为了保持 $(a^{1/n})^n=a$，定义 $a^{1/n}=\sqrt[n]{a}$；再由幂的乘方法则得到 $a^{m/n}=(\sqrt[n]{a})^m$。`,
              String.raw`例如 $4^{3/2}=(\sqrt4)^3=2^3=8$。图中选择底数 $4$ 和指数 $\frac32$，查看根式和结果如何对应。`,
            ],
            takeaway: '==分母是根的次数，分子是乘方次数；这里先在正底数范围内使用。==',
          },
          {
            label: '推导 02',
            title: '为什么负指数是倒数？',
            paragraphs: [
              String.raw`同底相乘时希望 $a^r a^{-r}=a^0=1$，于是 $a^{-r}=1/a^r$，要求 $a\ne0$。例如 $4^{-1/2}=1/\sqrt4=1/2$。`,
              String.raw`正指数不总产生大于 $1$ 的数：若 $0<a<1$，正指数的值可以小于 $1$；相应负指数的值则为其倒数。`,
            ],
            takeaway: String.raw`==负号作用于整个幂，$a^{-r}$ 表示倒数，而不是 $-a^r$。==`,
          },
          {
            label: '方法 03',
            title: '同底化简：看乘、除与乘方的结构',
            paragraphs: [
              String.raw`对 $a>0$，$a^p a^q=a^{p+q}$、$a^p/a^q=a^{p-q}$、$(a^p)^q=a^{pq}$。例如 $8^{x-1}=4^{2x+1}$ 可先写成 $2^{3x-3}=2^{4x+2}$。`,
              String.raw`同一正底数 $a\ne1$ 的指数函数是一一对应的，因此 $a^u=a^v$ 可推出 $u=v$；底数 $a=1$ 时等式恒成立，不能据此比较指数。`,
            ],
            takeaway: String.raw`==乘加、除减、幂乘；同底比较指数前，还要检查底数不为 $1$。==`,
          },
          {
            label: '检查 04',
            title: '定义域与平方根的符号',
            paragraphs: [
              String.raw`对于实数，偶次根的被开方数不能为负；负指数还要求底数非零。零的正有理次幂可为零，但 $0^0$ 与零的负次幂不能在此作普通指数运算。`,
              String.raw`若底数可能为负，先看化简后的分母：奇次根有实数意义，偶次根没有。不要把正底数下的整套公式无条件扩展。例如 $\sqrt{x^2}=|x|$，当 $x=-2$ 时结果是 $2$。`,
            ],
            takeaway: '==保留原式定义域；取平方根得到非负主值，不能直接去掉绝对值。==',
          },
        ],
      },
      paragraphs: [
        String.raw`对 $a>0$ 和正整数 $n$，定义 $a^{1/n}=\sqrt[n]{a}$，因此 $a^{m/n}=(\sqrt[n]{a})^m$。例如 $4^{3/2}=8$。`,
        String.raw`负指数表示倒数：$a^{-r}=1/a^r$，使用时底数不能为零。`,
        String.raw`先检查底数与原式的定义域，再用同底乘加、同底除减和幂的乘方指数相乘。正底且不为 $1$ 时，等幂可比较指数。`,
        String.raw`变量可能为负时要区分奇次根与偶次根；$\sqrt{x^2}=|x|$。`,
      ],
      rules: [
        {
          title: '分数指数的含义',
          text: String.raw`$a>0$ 时，$a^{m/n}=(\sqrt[n]{a})^m$；分母对应根的次数。`,
        },
        {
          title: '倒数与零底数',
          text: String.raw`$a^{-r}=1/a^r$ 要求 $a\ne0$；零的负次幂无定义。`,
        },
        {
          title: '同底与比较指数',
          text: String.raw`同底乘法加指数，除法减指数，幂的乘方乘指数；$a>0$ 且 $a\ne1$ 时可由 $a^u=a^v$ 推出 $u=v$。`,
        },
        { title: '平方根的主值', text: String.raw`对任意实数 $x$，$\sqrt{x^2}=|x|$。` },
      ],
      pitfalls: [
        String.raw`把 $a^{-r}$ 当成 ==$-a^r$==，忽略负指数表示倒数。`,
        String.raw`把 $(a^p)^q$ 的指数写成 $p+q$，或把 $a^p+a^q$ 误合并为 $a^{p+q}$。`,
        String.raw`把 $\sqrt{x^2}$ 直接写成 $x$，==遗漏 $x<0$ 的情况==。`,
        String.raw`比较同底指数前未排除 ==底数为 $1$==；约分或取负指数前未排除零。`,
        String.raw`把嵌套幂 $a^{b^c}$ 错当成 $(a^b)^c$；先按括号或题目约定辨别结构。`,
      ],
      visual: 'tmua-indices',
      sourceIds: ['tmua-spec', 'tmua-notes', 'tmua-archive'],
      examFocus: {
        goal: '解释有理指数的来源，在定义域内应用指数律，并通过反例检查运算与逻辑。',
        pastPaperSummary:
          '逐题审阅本地已收录的 2017—2023 年 TMUA Paper 1 和 Paper 2；直接考法涉及分数指数、迭代开方和指数恒等式，其他题将指数改写用于方程、函数与微积分。',
        pastPaperPatterns: [
          {
            form: '直接考查：分数指数与换元',
            description:
              '把根号底数写成分数指数，统一指数单位后换元；求出新变量后还要还原原变量并保留其取值范围。',
            reference: '2018 · Paper 1',
            sourceCodes: ['TMUA-2018-P1-Q015'],
          },
          {
            form: '直接考查：重复开方与幂的层级',
            description:
              '连续开方会令指数反复乘以二分之一；数列从第 1 项到第 100 项经历 99 次操作，嵌套幂必须按题目给出的运算顺序理解。',
            reference: '2019 · Paper 1',
            sourceCodes: ['TMUA-2019-P1-Q004'],
          },
          {
            form: '直接考查：指数恒等式与反例',
            description:
              '区分对整个幂开方和对指数开方。检验全称命题时逐组比较两边，底数为 1 是需要单独留意的特殊值。',
            reference: '2023 · Paper 2',
            sourceCodes: ['TMUA_2023_P2_Q03'],
          },
          {
            form: '关联应用：统一底数研究函数与方程',
            description:
              '将不同底数化为同底，或令指数式为新变量后求解、比较函数大小或讨论最值；指数换元得到正数，还须结合三角函数的取值范围或恢复原未知量。',
            reference: '2017—2023 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA-2017-P1-Q014',
              'TMUA-2019-P1-Q013',
              'TMUA-2019-P1-Q015',
              'TMUA-2020-P1-Q006',
              'TMUA-2020-P1-Q007',
              'TMUA_2021_P1_Q04',
              'TMUA_2021_P1_Q19',
              'TMUA_2021_P2_Q17',
              'TMUA_2022_P2_Q12',
              'TMUA_2023_P1_Q07',
              'TMUA_2023_P1_Q12',
              'TMUA_2023_P1_Q15',
              'TMUA_2023_P2_Q06',
            ],
          },
          {
            form: '关联应用：根式化幂后进行微积分',
            description:
              '把分母中的根式与幂合并成负分数指数，或将根式写为分数次幂后再求导、积分；保留原式的定义范围。',
            reference: '2017、2018、2020、2021、2023 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA-2017-P2-Q001',
              'TMUA-2018-P1-Q001',
              'TMUA-2018-P2-Q001',
              'TMUA-2020-P1-Q001',
              'TMUA_2021_P2_Q01',
              'TMUA_2021_P1_Q11',
              'TMUA_2023_P2_Q02',
            ],
          },
          {
            form: '关联应用：比较精确数值',
            description: '不同表达式可包含负指数、根式和三角值，先分别化简或建立界限，再比较大小。',
            reference: '2017 · Paper 2',
            sourceCodes: ['TMUA-2017-P2-Q008'],
          },
        ],
        pastPaperNote:
          '直接题与关联题分别标出；关联题可能使用其他方法，并非每题都单独考查有理指数律。考法归纳依据本地已收录年度卷，不以题量推断考试频率。',
        selfCheckNote:
          '自测选用独立试题库中的同底指数方程，练习把不同底数改写成同一个底数后保留完整指数。',
        examples: [
          {
            title: '根号底数出现时，如何选换元单位？',
            source: {
              questionCode: 'TMUA-2018-P1-Q015',
              why: '把根号写成分数指数，再用换元连接平方与一次项。',
              subject: 'tmua',
              kind: 'annual',
            },
            question: '',
            answer: String.raw`E · $2\log_3 20$`,
            steps: [
              String.raw`因为 $\sqrt3=3^{1/2}$，令 $t=3^{x/2}>0$，则 $3^x=t^2$，$(\sqrt3)^{x+4}=3^{(x+4)/2}=9t$。`,
              String.raw`原方程化为 $t^2-9t+20=0$，即 $(t-4)(t-5)=0$。两个候选值 $4,5$ 都满足 $t>0$。`,
              String.raw`分别还原得 $x=2\log_3 4$ 与 $x=2\log_3 5$；所求和为 $2\log_3(4\cdot5)=2\log_3 20$，选 E。`,
            ],
            takeaway: '==先统一指数单位并保留换元范围；题目要的是原变量的解，不是换元后的根。==',
          },
          {
            title: '对幂开方，能否把根号移到指数上？',
            source: {
              questionCode: 'TMUA_2023_P2_Q03',
              why: '用指数律和反例区分对整式开方与对指数开方。',
              subject: 'tmua',
              kind: 'annual',
            },
            question: '',
            answer: 'C · 仅 II 是反例',
            steps: [
              String.raw`正底数 $x$ 下，$\sqrt{x^y}=x^{y/2}$；原命题右边是 $x^{\sqrt y}$，两个指数并不必然相同。`,
              String.raw`I 中 $x=1$，两边均为 $1$，所以不是反例。III 中 $y=4$，两边均为 $3^2=9$，也不是反例。`,
              String.raw`II 中 $(x,y)=(2,8)$：左边是 $\sqrt{2^8}=16$，右边为 $2^{\sqrt8}=2^{2\sqrt2}$。因为 $2\sqrt2<4$ 且底数 $2>1$，右边小于 $16$，所以 II 是反例。`,
              '只有 II 使原命题不成立，对应 C。',
            ],
            takeaway: String.raw`==$\sqrt{x^y}$ 的指数是 $y/2$，不是 $\sqrt y$；反例必须让两边实际不相等。==`,
          },
        ],
        checklist: [
          '能从根式解释分数指数、从倒数解释负指数。',
          '能在满足定义条件时使用乘、除和幂的乘方法则。',
          '能说明底数为零、为一或为负时需要额外检查什么。',
          '能在统一底数和指数换元后保留范围、还原变量。',
          '能识别平方根主值与嵌套幂顺序，并用反例检验命题。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'tmua-spec',
      title: 'UAT-UK · TMUA 考纲',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165619/TMUA_Content_Specification.pdf',
      note: '有理指数的运算与应用。',
    },
    {
      id: 'tmua-notes',
      title: 'UAT-UK · Notes on Mathematics',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/30103537/Notes_on_Mathematics_-for_TMUA_and_ESAT_M2.pdf',
      note: '参考指数与根式的基础概念。',
    },
    {
      id: 'tmua-archive',
      title: 'UAT-UK · TMUA 官方试题与练习材料',
      url: 'https://esat-tmua.ac.uk/tmua-preparation-materials/',
      note: '考法依据本地已收录的 2017—2023 年两卷。',
    },
  ],
}
