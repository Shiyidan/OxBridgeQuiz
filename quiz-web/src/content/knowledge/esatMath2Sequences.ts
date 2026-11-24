// ESAT 数学2数列与级数讲义：覆盖4个考纲叶节点，真实题源由学习接口读取，考法保留全量相关年度证据。
import type { KnowledgeLesson } from './types'
import { math2SequenceMethods } from './math2SequenceMethods'

export const esatMath2Sequences: KnowledgeLesson = {
  code: '120200',
  title: 'Sequences and series · 数列与级数',
  subtitle: '从递推到无穷和，把每一项的位置、比值与条件都变成可检查的等式',
  intro:
    '递推先看前后项的结构，等差求和用配对，等比求和用错位相减，二项展开用一般项定位。每种方法都保留项号、符号与适用条件，把公式转化为可解释的推导。',
  memory: [
    '**递推题逐项展开，常数每层都带上。**项号是位置，项值是内容，先分清再计算。',
    '**等差看差、等比看比；第n项的系数是n−1，不是n。**用首项代入自检。',
    '**无穷和只对$|r|<1$成立；参数多解时用“正项”“收敛”条件筛分支。**',
    '**二项式求指定项先写一般项：幂次定r，组合数与底数幂定系数。**',
  ],
  sections: [
    {
      code: '120201',
      title: '数列与递推',
      summary: math2SequenceMethods['120201'].summary,
      paragraphs: [math2SequenceMethods['120201'].intro],
      rules: math2SequenceMethods['120201'].blocks.flatMap((block) => [
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
      memory: math2SequenceMethods['120201'].memory,
      pitfalls: [
        '递推展开时漏掉每层的常数项。',
        '把项号当项值代入，或把 $u_4$ 误读为u的4次方。',
        '参数方程有多个解时，不回代检查整数、正项等附加条件。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-sequences'],
      visual: 'maths2-sequences',
      examFocus: {
        goal: '逐项展开保留常数；含参数时用附加条件试根筛选。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '含参数的递推式，由指定项反解参数',
            description:
              '给出 $u_{n+1}=pu_n+q$ 型递推和某项的值，逐项展开成参数方程，利用“参数为整数”试根，再求若干项的组合。',
            reference: '2017 年度真题',
            sourceCodes: ['ENGAA_2017_S1-Q047'],
          },
          {
            form: '文字条件翻译为项之间的关系',
            description:
              '把“第13项是首项的6倍”这类条件写成关于首项与公差的方程；项号与项值不可混用（该题主考点为等差级数，递推定位为关联技能）。',
            reference: '2018 年度真题',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q37'],
          },
        ],
        selfCheckNote:
          '本节已导入的年度真题仅一道且已用作例题，自测题取自已发布的数学2独立题库，考查同一递推动作。',
        examples: [
          {
            title: '含参递推逐项展开，整数条件试根',
            source: {
              questionCode: 'ENGAA_2017_S1-Q047',
              why: '含参递推逐项展开，整数条件试根',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C',
            steps: [
              '逐项展开：$u_2=2p+3$，$u_3=2p^2+3p+3$，$u_4=2p^3+3p^2+3p+3$；递推里的常数3每一步都保留。',
              '由 $u_4=-7$ 得 $2p^3+3p^2+3p+10=0$；p是整数，试 $p=-2$：$-16+12-6+10=0$，成立。',
              '回代得数列 $2,\\,-1,\\,5,\\,-7$。',
              '求和 $2-1+5-7=-1$，选C。',
            ],
            takeaway: '递推展开把常数项带进每一步；“p是整数”就是直接试根的许可。',
          },
        ],
        checklist: [
          '能解释并正确使用：逐项展开保留常数。',
          '能解释并正确使用：整数条件是试根许可。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120202',
      title: '等差级数',
      summary: math2SequenceMethods['120202'].summary,
      paragraphs: [math2SequenceMethods['120202'].intro],
      rules: math2SequenceMethods['120202'].blocks.flatMap((block) => [
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
      memory: math2SequenceMethods['120202'].memory,
      pitfalls: [
        '把第n项写成 $a+nd$，首项定位错一位。',
        '“13th term is six times the 1st”只乘了公差或漏乘整个首项。',
        '把“接下来20项”当成“前20项”代入求和公式。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-series'],
      visual: 'maths2-sequences',
      examFocus: {
        goal: '第n项系数是n−1；部分和之间的关系可直接还原为项。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '两条文字条件联立求首项与公差',
            description:
              '把“第m项与第n项的倍数或差”各自写成 $a+(n-1)d$ 的方程，联立解出a、d后回代求指定项。',
            reference: '2018 年度真题',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q37'],
          },
          {
            form: '部分和之差还原为具体项',
            description:
              '利用 $S_{n+1}-S_{n-1}=u_n+u_{n+1}$ 这类关系绕开求和公式，直接合并通项；下标从1开始是本类题的主要陷阱。',
            reference: '2021 年度真题',
            sourceCodes: ['ESAT_LEGACY_2021_ENGAA_Q023'],
          },
          {
            form: '用求和公式把和的条件翻译成参数关系',
            description:
              '给出若干部分和之间的等式（分段和、$S_9+S_{10}=S_{11}$），统一代入 $S_n=\\frac n2(2a+(n-1)d)$ 后化简出a与d的关系或目标值。',
            reference: '2020、2023 年度真题',
            sourceCodes: ['ESAT-2020-MATHS2-004', 'ENGAA_2023_S1-Q023'],
          },
        ],
        examples: [
          {
            title: '两条项关系联立解首项与公差',
            source: {
              questionCode: 'ESAT_LEGACY_2018_ENGAA_Q37',
              why: '两条项关系联立解首项与公差',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'E',
            steps: [
              '设首项a、公差d。第13项是首项的6倍：$a+12d=6a$，即 $12d=5a$。',
              '第11项比第5项的两倍少1：$a+10d=2(a+4d)-1$，化简得 $a=2d+1$。',
              '代入 $12d=5(2d+1)$，得 $2d=5$，$d=2.5$，$a=6$。',
              '第三项 $a+2d=6+5=11$，选E。',
            ],
            takeaway: '把“第几项”先翻成 $a+(n-1)d$；两条文字条件正好解两个未知量。',
          },
          {
            title: '“接下来20项”翻译为部分和之差',
            source: {
              questionCode: 'ESAT-2020-MATHS2-004',
              why: '“接下来20项”翻译为部分和之差',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'A',
            steps: [
              '用 $S_n=\\frac n2\\bigl(2a+(n-1)d\\bigr)$：$S_{20}=10(2a+19d)=50$，故 $2a+19d=5$。',
              '接下来20项和为−50，即 $S_{40}=50-50=0$，故 $20(2a+39d)=0$，$2a+39d=0$。',
              '两式相减：$20d=-5$，$d=-\\frac14$；回代得 $2a=5+\\frac{19}{4}=\\frac{39}{4}$。',
              '$S_{100}=50(2a+99d)=50\\left(\\frac{39}{4}-\\frac{99}{4}\\right)=50\\times(-15)=-750$，选A。',
            ],
            takeaway: '“接下来20项”就是 $S_{40}-S_{20}$；整段翻译比逐项展开快得多。',
          },
        ],
        checklist: [
          '能解释并正确使用：第n项公式。',
          '能解释并正确使用：部分和作差得项。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120203',
      title: '等比级数',
      summary: math2SequenceMethods['120203'].summary,
      paragraphs: [math2SequenceMethods['120203'].intro],
      rules: math2SequenceMethods['120203'].blocks.flatMap((block) => [
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
      memory: math2SequenceMethods['120203'].memory,
      pitfalls: [
        '由 $r^4=\\frac14$ 只取正根，或忘了用符号条件筛掉负根。',
        '参数二次方程的两个解不按收敛或正项条件筛选就代入求和。',
        '把偶数项子列的公比仍当r，或把首项仍当a。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-series'],
      visual: 'maths2-sequences',
      examFocus: {
        goal: '相邻项比相等列方程；无穷和先用收敛条件筛分支。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '含参数的前三项，用相邻项比相等列方程',
            description:
              '由 $u_2^2=u_1u_3$ 得参数的二次方程，两个分支用“各项为正”或“收敛”条件筛选后，再求指定项或无穷和。',
            reference: '2018、2023 年度真题',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q39', 'ENGAA_2023_S1-Q025'],
          },
          {
            form: '无穷和的正用与反用',
            description:
              '已知某项求 $S_\\infty$，或已知 $S_\\infty$ 反求参数；偶次幂给出公比两个候选时按符号条件筛选，子列重组时公比变为 $r^2$。',
            reference: '2016、2020、2021、2022 年度真题',
            sourceCodes: [
              'ENGAA_2016_S1-Q033',
              'ESAT-2020-MATHS2-006',
              'ESAT_LEGACY_2021_ENGAA_Q033',
              'ESAT_LEGACY_2022_ENGAA_Q029',
            ],
          },
          {
            form: '等比级数与三角方程串联',
            description:
              '公比含三角函数，由无穷和定出公比数值后解三角方程，并检查 $|r|<1$ 与给定区间。',
            reference: '2017 年度真题',
            sourceCodes: ['ENGAA_2017_S1-Q045'],
          },
        ],
        examples: [
          {
            title: '前三项列方程，收敛条件筛分支',
            source: {
              questionCode: 'ENGAA_2023_S1-Q025',
              why: '前三项列方程，收敛条件筛分支',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'G',
            steps: [
              '相邻项之比相等：$\\frac{p-3}{2p}=\\frac{p-7}{p-3}$，即 $(p-3)^2=2p(p-7)$。',
              '展开整理：$p^2-6p+9=2p^2-14p$，得 $p^2-8p-9=0$，故 $p=9$ 或 $p=-1$。',
              '$p=9$ 给出前三项 $18,\\,6,\\,2$，公比 $r=\\frac13$；$p=-1$ 给出 $-2,\\,-4,\\,-8$，公比 $r=2$ 不收敛，舍去。',
              '$S_\\infty=\\frac{18}{1-\\frac13}=\\frac{18}{\\frac23}=27$，选G。',
            ],
            takeaway: '参数有两个解时，用“convergent”（$|r|<1$）筛分支，不要两个都代入求和。',
          },
          {
            title: '偶数项子列公比为r²，先取比消首项',
            source: {
              questionCode: 'ESAT_LEGACY_2021_ENGAA_Q033',
              why: '偶数项子列公比为r²，先取比消首项',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'B',
            steps: [
              '偶数项 $u_2+u_4+\\cdots$ 是首项 $ar$、公比 $r^2$ 的等比级数，和为 $\\frac{ar}{1-r^2}$。',
              '两和相除消去a：$\\frac{ar/(1-r^2)}{a/(1-r)}=\\frac{r}{1+r}=\\frac{3/5}{8/5}=\\frac38$。',
              '解 $8r=3+3r$ 得 $r=\\frac35$，满足 $|r|<1$。',
              '由 $\\frac{a}{1-r}=\\frac85$ 得 $a=\\frac85\\times\\frac25=\\frac{16}{25}$。',
              '$a+r=\\frac{16}{25}+\\frac{15}{25}=\\frac{31}{25}$，选B。',
            ],
            takeaway: '隔项子列的公比是 $r^2$；两个级数并列时先取比值消去首项，再回代。',
          },
        ],
        checklist: [
          '能解释并正确使用：相邻项比相等。',
          '能解释并正确使用：收敛才谈无穷和。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120204',
      title: '二项式展开',
      summary: math2SequenceMethods['120204'].summary,
      paragraphs: [math2SequenceMethods['120204'].intro],
      rules: math2SequenceMethods['120204'].blocks.flatMap((block) => [
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
      memory: math2SequenceMethods['120204'].memory,
      pitfalls: [
        '只算幂因子 $2^4/4^4$，漏乘组合数 $\\binom84$。',
        '幂次方程解错（如把 $2r-8=0$ 解成 $r=2$），项定位错误。',
        '能先合并化简时硬展开，多次展开中算错符号。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-binomial'],
      visual: 'maths2-sequences',
      examFocus: {
        goal: '写一般项定位r；幂次定位置，组合数与底数幂定系数。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '写一般项，令幂次满足条件定位r',
            description:
              '对 $\\left(\\frac{2}{x}+\\frac{x}{4}\\right)^8$ 这类两项都含x的式子，先写一般项并合并x的幂次，令其为0（或指定值）解出r，再算系数。',
            reference: '2023 年度真题',
            sourceCodes: ['ENGAA_2023_S1-Q037'],
          },
          {
            form: '先合并或变形，再判断出现的幂次',
            description: '共轭因式先化简成 $(1-4x^2)^5$，直接看出只含偶次幂，避免十次逐项展开。',
            reference: '2018 年度真题',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q47'],
          },
          {
            form: '二项展开与积分等运算串联',
            description:
              '先在被积函数里定位产生目标幂次的那一项，展开系数后再执行积分，幂次与系数同步处理。',
            reference: '2019 年度真题',
            sourceCodes: ['NSAA_2019_S1-Q085'],
          },
        ],
        examples: [
          {
            title: '一般项幂次定位常数项',
            source: {
              questionCode: 'ENGAA_2023_S1-Q037',
              why: '一般项幂次定位常数项',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'B',
            steps: [
              '一般项 $\\binom{8}{r}\\left(\\frac{2}{x}\\right)^{8-r}\\left(\\frac{x}{4}\\right)^r=\\binom{8}{r}2^{8-r}4^{-r}x^{2r-8}$。',
              '常数项要求x的幂次为0：$2r-8=0$，得 $r=4$。',
              '代入：$\\binom84\\times2^4\\times4^{-4}=70\\times\\frac{16}{256}=70\\times\\frac1{16}=\\frac{35}{8}$，选B。',
            ],
            takeaway:
              '先写一般项并单独追踪x的幂次；组合数 $\\binom84=70$ 不要与 $\\binom83=56$ 混淆。',
          },
          {
            title: '积分后幂次抬一次，先定位t³项',
            source: {
              questionCode: 'NSAA_2019_S1-Q085',
              why: '积分后幂次抬一次，先定位t³项',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'E',
            steps: [
              '积分后的 $x^4$ 项只能来自被积函数 $(3+2t)^7$ 中的 $t^3$ 项。',
              '$t^3$ 项系数为 $\\binom{7}{3}3^{4}2^3=35\\times81\\times8=22680$。',
              '积分 $\\int_0^x 22680t^3\\,dt=\\frac{22680}{4}x^4=5670x^4$。',
              '$x^4$ 的系数是5670，选E。',
            ],
            takeaway: '积分把幂次抬一次：要 $x^4$ 先找被积函数的 $t^3$ 项，系数再除以4。',
          },
        ],
        checklist: [
          '能解释并正确使用：一般项定位。',
          '能解释并正确使用：组合数别记混。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'esat-maths2-spec',
      title: 'UAT-UK · ESAT 考纲（数学2）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '数学2 Sequences and series 部分的考纲依据，四个叶节点与本章四节一一对应。',
    },
    {
      id: 'openstax-sequences',
      title: 'OpenStax · College Algebra 2e · Sequences and Their Notations',
      url: 'https://openstax.org/books/college-algebra-2e/pages/9-1-sequences-and-their-notations',
      note: '递推与通项两种给法的对照讲解；本章按ESAT数学2范围取舍。',
    },
    {
      id: 'openstax-series',
      title: 'OpenStax · College Algebra 2e · Geometric Sequences',
      url: 'https://openstax.org/books/college-algebra-2e/pages/9-3-geometric-sequences',
      note: '等差、等比求和与无穷和推导的参照；收敛条件的讲法与本章一致。',
    },
    {
      id: 'openstax-binomial',
      title: 'OpenStax · College Algebra 2e · Binomial Theorem',
      url: 'https://openstax.org/books/college-algebra-2e/pages/9-5-binomial-theorem',
      note: '一般项写法与指定项系数定位的对照。',
    },
    {
      id: 'uat-annual-archive',
      title: 'UAT-UK · ENGAA / NSAA / ESAT 真题档案',
      url: 'https://esat-tmua.ac.uk/esat-preparation-materials/',
      note: '考法证据来自当前库内2016—2023年度数学2题，不声称覆盖未导入的全部官方档案。',
    },
  ],
}
