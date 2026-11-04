// TMUA 函数学习内容：以输入输出、复合值域和命题的推理方向组织讲解。
import type { KnowledgeLesson } from './types'

export const tmuaFunctions: KnowledgeLesson = {
  code: '221000',
  partial: true,
  title: 'Algebra and functions · 代数与函数',
  subtitle: '追踪函数的输入、输出与取值范围',
  intro: '从映射出发判断复合的顺序、定义域、值域与函数性质，使用反例检查推理。',
  memory: [
    String.raw`**复合由内向外。** $(f\circ g)(x)=f(g(x))$；先看 $g(x)$ 能否作为 $f$ 的输入。`,
    String.raw`**值域不是代入所有实数。** 外层函数的输入是内层函数实际能取到的值；最值还要检查能否取得。`,
    String.raw`**对称先看定义域。** 在关于零对称的定义域内，$f(-x)=f(x)$ 是偶函数，$f(-x)=-f(x)$ 是奇函数。`,
    String.raw`**反函数要一一对应。** 换入输出前先限制定义域，使每个输出恰好对应一个输入。`,
  ],
  sections: [
    {
      code: '221007',
      title: '函数与常见函数性质',
      summary: '从输入与输出理解复合、定义域、值域、对称性和反函数，并检查每一步是否可逆。',
      conceptFlow: {
        eyebrow: '从输入到输出',
        title: '把函数当作一条运算路径',
        lead: '函数给每个允许的输入指定唯一输出。==复合时先走内层，再走外层；每一层的输入都必须有定义。==',
        visualPrompt: String.raw`在图中比较 $f\circ g$ 与 $g\circ f$，以 $x=1$ 观察结果；再切到 $x\ge0$ 的平方函数，观察反函数如何还原输入。`,
        observations: [
          {
            title: '顺序会改变结果',
            text: String.raw`若 $f(x)=x^2$、$g(x)=x+1$，则 $f(g(1))=4$，而 $g(f(1))=2$。==复合通常不能交换顺序==。`,
          },
          {
            title: '反函数需要限制',
            text: String.raw`$(-1)^2=1^2$，所以在全体实数上不能唯一反推输入；只取 $x\ge0$ 才能用 $\sqrt{x}$ 还原。`,
          },
        ],
        steps: [
          {
            label: '路径 01',
            title: '由内向外，逐层检查输入',
            paragraphs: [
              String.raw`图中 $f(x)=x^2$，$g(x)=x+1$。先算 $g(x)$ 再送入 $f$，得到 $(f\circ g)(x)=(x+1)^2$；倒过来则是 $(g\circ f)(x)=x^2+1$。`,
              String.raw`定义域也要按路径检查：若 $f(x)=\sqrt{x}$、$g(x)=x-1$，则 $f(g(x))=\sqrt{x-1}$ 要求 $x\ge1$，而 $g(f(x))=\sqrt{x}-1$ 要求 $x\ge0$。`,
            ],
            takeaway: '==内层输出必须属于外层定义域；不能只检查最后化简后的式子。==',
          },
          {
            label: '反向 02',
            title: '反函数是把输出送回原输入',
            paragraphs: [
              String.raw`在 $x\ge0$ 时，$f(x)=x^2$ 严格递增且值域为 $[0,\infty)$；对该值域中的 $y$，原输入唯一为 $x=\sqrt y$。图中试 $x=2$，先得到 $4$，再反向返回 $2$。`,
              String.raw`如果原定义域为全体实数，$f(1)=f(-1)=1$，就不能把 $x^2$ 在该定义域上当作一一对应的可逆函数；选取 $x\le0$ 时反函数应是 $-\sqrt{x}$。`,
            ],
            takeaway: '==先看是否一一对应，再写反函数的定义域；平方根的符号由所选分支决定。==',
          },
          {
            label: '范围 03',
            title: '先求内层值域，再研究外层',
            paragraphs: [
              String.raw`若内层 $u=g(x)$ 只取 $[a,b]$，复合函数的值是 $f(u)$ 在该区间上的实际输出。不能把 $u$ 随意换成其他实数；端点和驻点也要核对是否可取。`,
              String.raw`例如 $-2\le g(x)\le2$，且 $g$ 取遍该区间时，令 $u=g(x)$，$u^2-u=(u-\frac12)^2-\frac14$ 的最小值是 $-\frac14$，最大值是 $6$。`,
            ],
            takeaway: '==范围与可达性是两件事：上下界成立，还要检查取等位置能否出现。==',
          },
          {
            label: '性质 04',
            title: '用定义检验对称、单调与反例',
            paragraphs: [
              String.raw`定义域关于零对称时，比较 $f(-x)$ 与 $f(x)$：相等为偶函数，相反为奇函数；两种条件可能都不满足，零函数两者均满足。`,
              String.raw`递增函数保持输入大小顺序，但不能推出函数值一定为正：$f(x)=x$ 在实数上严格递增，$f(-1)=-1<0$。一个满足前提而违反结论的例子即可推翻全称命题。`,
            ],
            takeaway: '==先检验前提，再检验结论；必要条件和充分条件不要互换。==',
          },
        ],
      },
      paragraphs: [
        String.raw`$(f\circ g)(x)=f(g(x))$，按内层到外层逐步代入并检查各层定义域。`,
        String.raw`限制平方函数在 $x\ge0$ 时其反函数为 $\sqrt{x}$；全体实数上的平方函数不是一一对应。`,
        String.raw`复合函数的外层输入来自内层实际值域，求最值要核实取等是否可达。`,
        String.raw`奇偶性先检查定义域关于零对称，再用定义核对；通过反例检验推理方向。`,
      ],
      rules: [
        {
          title: '复合顺序与定义域',
          text: String.raw`$f(g(x))$ 先满足 $x\in D_g$，再满足 $g(x)\in D_f$；一般不能交换。`,
        },
        {
          title: '反函数与分支',
          text: String.raw`函数一一对应到其值域时可反解；$x^2$ 在 $[0,\infty)$ 上的反函数是 $\sqrt{x}$。`,
        },
        {
          title: '内层值域与可达性',
          text: '将内层实际值域作为外层输入集合，最值要检查端点和内部候选点是否能取到。',
        },
        {
          title: '性质与逻辑方向',
          text: String.raw`定义域关于零对称时用 $f(-x)$ 检验奇偶；全称命题只需一个满足前提的反例即可否定。`,
        },
      ],
      pitfalls: [
        String.raw`把 $f(g(x))$ 当成 $g(f(x))$，==忽略复合顺序==。`,
        String.raw`只检查内层有定义，没有检查 ==内层输出是否可输入外层==。`,
        String.raw`把内层的上界当成必能达到的最大值，或将外层输入扩展到内层值域之外。`,
        String.raw`未限制定义域就把 $x^2$ 的反函数写成 $\sqrt{x}$；同时要区分 $1/f(x)$ 与反函数 $f^{-1}(x)$。`,
        String.raw`在不关于零对称的定义域上直接判断奇偶，或把 ==递增== 错当成 ==函数值恒正==。`,
      ],
      visual: 'tmua-functions',
      sourceIds: ['tmua-spec', 'tmua-notes', 'tmua-logic', 'tmua-archive'],
      examFocus: {
        goal: '追踪复合函数的输入和可达范围，按定义判断对称、可逆性与命题真假。',
        pastPaperSummary:
          '逐题审阅本地已收录的 2017—2023 年 TMUA Paper 1 与 Paper 2。直接考查集中于逐层复合与值域、变换和函数定义；其他题把性质判断迁移到指数、图像、证明及微积分。',
        pastPaperPatterns: [
          {
            form: '直接考查：复合顺序与逐层传播值域',
            description:
              '先确定内层可取范围，再结合外层单调性和可达性求最值或比较大小；绝对值或多层三角函数可能令范围逐层收缩。图像给出原函数的值域时，还可将输出作为新变量研究外层二次式。',
            reference: '2021—2023 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA_2021_P1_Q07',
              'TMUA_2021_P1_Q15',
              'TMUA_2021_P2_Q17',
              'TMUA_2021_P2_Q20',
              'TMUA_2022_P2_Q20',
              'TMUA_2023_P1_Q20',
            ],
          },
          {
            form: '直接考查：函数定义、对称及变换顺序',
            description:
              '分段、递推或向上取整规则要在每次调用时判断适用条件；图像对称转化为对应输入的函数值相等，不同变换的先后也可能影响结果。',
            reference: '2017—2023 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA-2017-P1-Q015',
              'TMUA-2017-P1-Q018',
              'TMUA-2017-P2-Q015',
              'TMUA-2018-P1-Q018',
              'TMUA-2018-P2-Q010',
              'TMUA-2018-P2-Q015',
              'TMUA-2019-P2-Q020',
              'TMUA-2020-P1-Q010',
              'TMUA_2021_P1_Q05',
              'TMUA_2022_P1_Q10',
              'TMUA_2023_P1_Q11',
              'TMUA_2023_P1_Q19',
              'TMUA_2023_P2_Q17',
            ],
          },
          {
            form: '关联应用：指数与常见函数的范围和图像',
            description:
              '将指数、三角表达式或平方视为中间变量，保留实际范围后求最值；由函数关系求出多个分支时，还要比较各分支的范围。图像比较需检查端点、函数增减和渐近行为。',
            reference: '2017—2023 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA-2017-P2-Q007',
              'TMUA-2018-P2-Q011',
              'TMUA-2019-P1-Q013',
              'TMUA-2020-P1-Q006',
              'TMUA-2020-P2-Q005',
              'TMUA_2021_P1_Q04',
              'TMUA_2021_P1_Q06',
              'TMUA_2021_P1_Q12',
              'TMUA_2022_P1_Q09',
              'TMUA_2022_P2_Q18',
              'TMUA_2023_P1_Q07',
              'TMUA_2023_P1_Q15',
            ],
          },
          {
            form: '关联应用：函数变换与积分估值',
            description:
              '比较原函数和变换后函数的梯形法估值，分析平移、反射或负号如何改变误差方向；常数平移不改变误差。',
            reference: '2019 · Paper 1',
            sourceCodes: ['TMUA-2019-P1-Q008'],
          },
          {
            form: '关联应用：从函数性质检查必要与充分',
            description:
              '判断函数递增、大小关系或对称性是否足以保证另一结论；可利用定义与反例分析，涉及导数或积分时还需说明推理方向。',
            reference: '2017—2023 · Paper 1 / Paper 2',
            sourceCodes: [
              'TMUA-2017-P1-Q016',
              'TMUA-2017-P2-Q010',
              'TMUA-2017-P2-Q016',
              'TMUA-2018-P2-Q006',
              'TMUA-2018-P2-Q018',
              'TMUA-2019-P2-Q014',
              'TMUA-2020-P2-Q006',
              'TMUA-2020-P2-Q018',
              'TMUA_2021_P2_Q06',
              'TMUA_2021_P2_Q09',
              'TMUA_2021_P2_Q12',
              'TMUA_2023_P2_Q19',
              'TMUA_2023_P2_Q20',
            ],
          },
        ],
        pastPaperNote:
          '以上区分本节直接考法与跨章节关联应用；相关题未必要求反函数或复合函数的符号运算。归纳依据本地已收录年度卷，不以数量推断考试频率。',
        selfCheckNote:
          '自测使用已发布的 TMUA 独立题库题，先确定三角函数取值范围，再比较外层平方的最大值。',
        examples: [
          {
            title: '原函数的值域，如何转成外层最值？',
            source: {
              questionCode: 'TMUA_2023_P1_Q20',
              why: '用原图像的实际值域求复合二次式的最值差。',
              subject: 'tmua',
              kind: 'annual',
            },
            question: '',
            answer: String.raw`F · $\frac{25}{4}$`,
            steps: [
              String.raw`令 $t=f(x)$。根据题图，函数在极小与极大之间连续取遍 $[-2,2]$，因此外层输入是 $t\in[-2,2]$。`,
              String.raw`配方得 $t^2-t=(t-\frac12)^2-\frac14$，顶点 $t=\frac12$ 在可取区间内，最小值为 $-\frac14$。`,
              String.raw`比较端点：$(-2)^2-(-2)=6$，$2^2-2=2$，故最大值为 $6$；两者之差为 $6-(-\frac14)=\frac{25}{4}$，选 F。`,
            ],
            takeaway: '==先核对内层取遍的范围，再在该范围内判断外层顶点和端点。==',
          },
          {
            title: '多层三角复合，最大值会一直等于 1 吗？',
            source: {
              questionCode: 'TMUA_2022_P2_Q20',
              why: '逐层追踪输入范围和端点可达性，辨别外层最大值。',
              subject: 'tmua',
              kind: 'annual',
            },
            question: '',
            answer: String.raw`E · $m_1=m_3=1$，$0<m_2=m_4<1$，$0<m_5<1$`,
            steps: [
              String.raw`$f_1=\cos x$ 取遍 $[-1,1]$，所以 $m_1=1$；$f_2=\sin(f_1)$ 的值域为 $[-\sin1,\sin1]$，$m_2=\sin1$。`,
              String.raw`因为 $f_2$ 能取 $0$，$f_3=\cos(f_2)$ 能取 $1$，值域是 $[\cos(\sin1),1]$；故 $m_3=1$。`,
              String.raw`$f_3$ 的值为正且不超过 $1$，正弦在该区间递增，所以 $f_4=\sin(f_3)$ 的最大值是 $\sin1$，即 $m_4=m_2$。`,
              String.raw`$f_4$ 有严格正的下界，因此 $f_5=\cos(f_4)$ 的输入不能为零，而且全部位于 $(0,1)$ 内，故 $0<m_5<1$。对应 E。`,
            ],
            takeaway: '==外层形式看似能取 1，也须确认内层确实能取到对应输入。==',
          },
        ],
        checklist: [
          '能正确写出两种复合顺序，并逐层检查定义域。',
          '能解释平方函数为什么要限制定义域才能得到反函数。',
          '能把内层实际值域传给外层，判断最值及可达性。',
          '能按定义检查奇偶、对称和单调，使用反例检验全称命题。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'tmua-spec',
      title: 'UAT-UK · TMUA 考纲',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165619/TMUA_Content_Specification.pdf',
      note: '参考函数和代数运算范围。',
    },
    {
      id: 'tmua-notes',
      title: 'UAT-UK · Notes on Mathematics',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/30103537/Notes_on_Mathematics_-for_TMUA_and_ESAT_M2.pdf',
      note: '参考函数、图像与取值范围。',
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
      note: '考法以本地已收录 2017—2023 年两卷为依据。',
    },
  ],
}
