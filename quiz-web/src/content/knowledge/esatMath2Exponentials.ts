// ESAT 数学2第五章讲义：用图像、对数互逆和正值换元组织复习，考法覆盖全部相关年度题。
import type { KnowledgeLesson } from './types'
import { math2ExponentialMethods } from './math2ExponentialMethods'

export const esatMath2Exponentials: KnowledgeLesson = {
  code: '120500',
  title: 'Exponentials and logarithms · 指数与对数',
  subtitle: '先看底数与范围，再把乘方问题变成指数问题',
  intro:
    '指数问“结果是多少”，对数问“需要几次方”。本章用同一条线串起图像、对数律与方程：先确认正值和定义域，再选择同底、合并或换元，最后回到题目所问的变量。无需计算器，也不把换底公式列为本章必背内容。',
  memory: [
    '**先看底数。**底数大于1时指数函数递增，底数在0与1之间时递减；指数小不代表函数值一定小。',
    '**对数是在问指数。**$a^u=v$ 与 $u=\\log_a v$ 是同一关系，要求 $a>0$、$a\\ne1$、$v>0$。',
    '**乘除变加减，幂次可前移。**只对同底对数使用这些法则；真数内的加减不能直接拆。',
    '**换元带上范围。**令 $t=a^x$ 就同时写 $t>0$；求出t还要还原x，不能把两者的根相混。',
  ],
  sections: [
    {
      code: '120501',
      title: '指数函数与图像',
      summary: math2ExponentialMethods['120501'].summary,
      paragraphs: [math2ExponentialMethods['120501'].intro],
      rules: math2ExponentialMethods['120501'].blocks.flatMap((block) => [
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
      memory: math2ExponentialMethods['120501'].memory,
      pitfalls: [
        '把负指数误读成负数，或画出指数图像与横轴相交。',
        '只看指数的最大值，不检查底数是否小于1，导致最值方向相反。',
        '把指数最小值当作整个表达式的最小值，忘记代回指数函数。',
        '看到 $a^{f(x)}$ 就认定随x单调，忽略内层函数可能转向。',
      ],
      examFocus: {
        goal: '从底数判断单调性，将指数范围准确转成函数值范围。',
        pastPaperSummary:
          '当前年度题主要把指数图像的增减性质用于复合函数最值：内层可能是二次式，也可能是有界的三角函数。关键是先处理指数，再由底数决定方向。',
        pastPaperPatterns: [
          {
            form: '二次指数配方后求最小值',
            description:
              '先把指数配成平方加常数，再利用大于1的底数保持大小关系；答案是幂的值，不是指数或顶点横坐标。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q016'],
          },
          {
            form: '统一底数后用三角值域取极值',
            description:
              '将不同底数、相反指数的乘积合成一个分数底数，再用正弦的范围；底数小于1使最大值出现在最小指数处。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q019'],
          },
        ],
        pastPaperNote:
          '当前已收录年度数学2题中，本点的直接证据是这两类最值应用，未找到单独要求选画基本指数曲线的题。过点、渐近线与递增递减仍需掌握，图解用于补足这一基础。',
        selfCheckNote: '自测把指数单调性与正弦范围结合；先合成同一底数，再决定取哪个端点。',
        examples: [
          {
            title: '指数的最低点，不是最终的最小值',
            source: {
              questionCode: 'NSAA_2023_S1-Q016',
              why: '先配方确定指数下界，再利用底数10的递增性求函数最小值。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'B · $0.01$',
            steps: [
              '指数配方：$x^2+6x+7=(x+3)^2-2$。平方项非负，所以指数最小为 $-2$，在 $x=-3$ 时取得。',
              '底数 $10>1$，指数越小，函数值越小。因此 $V(x)=10^{(x+3)^2-2}\\ge10^{-2}$。',
              '还原题目要的函数值：$10^{-2}=1/100=0.01$，选B；$-2$ 是指数下界，$-3$ 是取得下界的x，都不是最终答案。',
              '代回 $x=-3$ 得 $9-18+7=-2$，确认最小值确实能取到。图像始终为正，不能把趋近0误作本题最小值。',
            ],
            takeaway: '==内层先求范围，外层再看增减；最后回答函数值。==',
          },
        ],
        checklist: [
          '能不用计算器画出两类底数的基本指数图像。',
          '能区分底数、指数、自变量与函数值。',
          '能在二次或三角指数中选择正确端点，并检查能否取得。',
        ],
      },
      visual: 'maths2-exponentials',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120502',
      title: '对数律',
      summary: math2ExponentialMethods['120502'].summary,
      paragraphs: [math2ExponentialMethods['120502'].intro],
      rules: math2ExponentialMethods['120502'].blocks.flatMap((block) => [
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
      memory: math2ExponentialMethods['120502'].memory,
      pitfalls: [
        '把对数和误写成和的对数，或把对数差误写成差的对数。',
        '负指数与分母两个负号相遇时仍照抄成减号。',
        '混淆真数的平方与整个对数的平方，例如 $(2\\log_a x)^2$ 的系数是4。',
        '合并、约分或解二次方程后，遗漏原真数为正的限制。',
      ],
      examFocus: {
        goal: '有条件地合并、拆分对数，并用原定义域筛选代数结果。',
        pastPaperSummary:
          '相关年度题覆盖指数表达式的对数化简、连乘约分、对数的平均值、对数换元和带定义域的方程。共同要求是先看结构，再用法则；并非逐项算出对数小数。',
        pastPaperPatterns: [
          {
            form: '先统一幂的底数，再提取指数',
            description:
              '题目给出变量的幂表达式，要求化简商的对数；将8与1/2写成2的幂，连续处理幂的幂及分母负指数。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q037'],
          },
          {
            form: '对数和隐藏连乘约分或几何平均',
            description:
              '连续分式的对数和先合为乘积，再消去中间因子；多个对数的算术平均则对应原数乘积的相应次方根。两类都靠结构化简，不需要计算器近似。',
            reference: '2018、2021 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q41', 'ESAT_LEGACY_2021_ENGAA_Q029'],
          },
          {
            form: '对数值换元，最后还原原变量',
            description:
              '将 $\\log_{10}(x^2)$ 化为 $2\\log_{10}x$ 后再平方；令 $t=\\log_{10}x$ 得二次方程。所求若为x根的乘积，要由指数和恢复，而非直接用t根的乘积。',
            reference: '2020 ENGAA',
            sourceCodes: ['ESAT-2020-MATHS2-009'],
          },
          {
            form: '常数合为同底对数，再剔除非法根',
            description:
              '把常数写成相同底数的对数，比较真数后求代数候选；使任一原真数为0或负数的候选必须排除。',
            reference: '2023 ENGAA',
            sourceCodes: ['ENGAA_2023_S1-Q035'],
          },
        ],
        selfCheckNote: '自测来自独立试题库：辨认“对数和等于和的对数”何时偶然成立，并写全合法解集。',
        examples: [
          {
            title: '分母中的负指数，为什么最后变成加号？',
            source: {
              questionCode: 'ENGAA_2017_S1-Q037',
              why: '统一为2的幂，分清幂的幂、相除与负指数三层运算。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'F · $9p+4q$',
            steps: [
              '先统一底数：$y=8^p=2^{3p}$，$z=(1/2)^{2q}=2^{-2q}$。因为都是正底数的幂，y、z始终为正，对数合法。',
              '分别处理外层幂：$y^3=2^{9p}$、$z^2=2^{-4q}$。指数中的3和2都需要乘进去。',
              '同底幂相除，指数相减：$y^3/z^2=2^{9p-(-4q)}=2^{9p+4q}$。',
              '由指数与对数互逆，$\\log_2(2^{9p+4q})=9p+4q$，选F。也可用 $3\\log_2y-2\\log_2z$ 交叉检查。',
            ],
            takeaway: '==每层运算单独处理：内层幂、外层幂、分式、最后对数。==',
          },
          {
            title: '很多个对数相加，只剩首尾两个数',
            source: {
              questionCode: 'ESAT_LEGACY_2018_ENGAA_Q41',
              why: '先合并对数和，再识别连续分式的望远镜消去。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C · $4$',
            steps: [
              '所有真数为正且底数相同，可以把和合为 $\\log_2[(5/4)(6/5)(7/6)\\cdots(64/63)]$。',
              '分子里的5至63依次与下一项分母消去，乘积只留下 $64/4=16$。注意起始分母是4，不是5。',
              '因此结果为 $\\log_2 16=4$，选C。项数60不是最终真数，不能把对数和写成 $\\log_2 60$。',
              '可先用前三项检查结构：$(5/4)(6/5)(7/6)=7/4$，同样只保留末尾分子和开头分母。',
            ],
            takeaway: '==看到连续分式的对数和，先合成乘积，再看首尾。==',
          },
          {
            title: '代数解出了两个根，原对数只允许一个',
            source: {
              questionCode: 'ENGAA_2023_S1-Q035',
              why: '把常数变为同底对数，再用每个原真数的正性排除增根。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'A · $x=1/8$',
            steps: [
              '先写原条件：$(x+1)(x+2)>0$ 且 $x(x+2)>0$，合起来是 $x<-2$ 或 $x>0$。',
              '把 $2=\\log_3 9$ 合入右侧：$\\log_3(x^2+3x+2)=\\log_3[9(x^2+2x)]$。真数均为正时，可令它们相等。',
              '整理得 $8x^2+15x-2=0$，即 $(8x-1)(x+2)=0$，代数候选为 $x=1/8$ 或 $x=-2$。',
              '$x=-2$ 让两个原真数都等于0，不能取对数，必须剔除。$x=1/8$ 满足定义域，且真数比 $[(x+1)(x+2)]/[x(x+2)]=(x+1)/x=9$，所以对数差为2，选A。',
            ],
            takeaway: '==原式定义域随变形一起保留，不能用“二次方程有根”代替回代。==',
          },
        ],
        checklist: [
          '能用指数关系解释对数值为什么可以为负。',
          '能判断哪些乘除幂可以拆分，哪些加减不能拆。',
          '能保留原定义域，并区分真数平方与对数平方。',
        ],
      },
      visual: 'maths2-exponentials',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120503',
      title: '指数方程',
      summary: math2ExponentialMethods['120503'].summary,
      paragraphs: [math2ExponentialMethods['120503'].intro],
      rules: math2ExponentialMethods['120503'].blocks.flatMap((block) => [
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
      memory: math2ExponentialMethods['120503'].memory,
      pitfalls: [
        '误把 $a^{2x+1}$ 拆成 $a^{2x}+1$，丢掉本应相乘的底数。',
        '对带加减的整式逐项取对数，使用不存在的“和的对数”拆分法。',
        '保留换元方程的零根或负根，忘记指数始终大于0。',
        '求到了t就直接选答案，或由 $t=2^{x/2}$ 还原时漏乘2。',
      ],
      examFocus: {
        goal: '识别可复用的指数整体，把代数根准确转回原方程的解。',
        pastPaperSummary:
          '年度题从提取公共幂到二次换元，再到联立指数项消元与根的和，逐步增加代数整理量。共同核心不是背新公式，而是统一幂、保留正值范围并还原所求变量。',
        pastPaperPatterns: [
          {
            form: '提取公共指数因子，排除零分支',
            description:
              '将较高次幂拆成常数乘公共幂的平方，因式分解后利用指数项始终为正留下合法分支，再以对数写出精确解。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q033'],
          },
          {
            form: '二次换元后筛选正根',
            description:
              '含 $5^{2x+1}$ 与 $5^x$ 的式子先保留移位指数产生的系数；二次方程可能给出一个负根，只能将正根转回x。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q081'],
          },
          {
            form: '不同底数的指数项先整体消元',
            description:
              '由两式的和差先得到单独的 $8^x$ 或 $27^x$，再写成同底数幂求分数指数；最后需同时满足原来两式。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q006'],
          },
          {
            form: '半指数换元，所问是原变量的根之和',
            description:
              '将 $2^x$ 与 $(\\sqrt2)^{x+6}$ 统一为 $t=2^{x/2}$ 的二次式；两个正根都要还原，求和时合并对数并保留系数2。',
            reference: '2022 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2022_ENGAA_Q039'],
          },
        ],
        examples: [
          {
            title: '看似有两个因子，幂的值为零这一支不成立',
            source: {
              questionCode: 'ENGAA_2017_S1-Q033',
              why: '先提取始终为正的公共幂，再把合法分支转为对数。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'B · $x=\\log_3 2$',
            steps: [
              '令 $t=3^x>0$。由 $3^{2x+1}=3(3^x)^2=3t^2$，原式变成 $3t^2-6t=0$。',
              '因式分解 $3t(t-2)=0$，得到代数候选 $t=0$ 或 $t=2$。',
              '$t=3^x$ 对任意实数x都大于0，所以 $t=0$ 不对应实数解，只保留 $3^x=2$。',
              '由定义得 $x=\\log_3 2$，选B。回代时第一项是 $3\\cdot2^2=12$，第二项是 $6\\cdot2=12$，差为0。',
            ],
            takeaway: '==因式分解给的是代数候选，指数的正值范围决定哪些候选有效。==',
          },
          {
            title: '二次根是2和6，为什么答案不是8？',
            source: {
              questionCode: 'ESAT_LEGACY_2022_ENGAA_Q039',
              why: '半指数换元后求两正根，并将根之和正确还原到x。',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'F · $4+2\\log_2 3$',
            steps: [
              '令 $t=2^{x/2}>0$，则 $2^x=t^2$，$(\\sqrt2)^{x+6}=2^{x/2+3}=8t$。',
              '原式变为 $t^2-8t+12=0$，因式分解得 $(t-2)(t-6)=0$。两个根2和6都为正，因此对应两个实数x。',
              '由 $t=2^{x/2}$ 得 $x=2\\log_2t$。于是 $x_1=2$，$x_2=2\\log_2 6=2+2\\log_2 3$。',
              '题目问x根之和，因此 $x_1+x_2=4+2\\log_2 3$，选F。可用 $2\\log_2(2\\cdot6)=2\\log_2 12$ 再验；8只是t根之和。',
            ],
            takeaway: '==给换元量写清名字，最后沿原换元关系回到题目要的量。==',
          },
        ],
        checklist: [
          '能识别同底、公共幂、半指数和联立整体消元。',
          '能正确保留移位指数的系数与换元正值范围。',
          '能区分t根与x根，并按要求求全部解、和或个数。',
        ],
      },
      visual: 'maths2-exponentials',
      sourceIds: ['esat-maths2-spec'],
    },
  ],
  sources: [
    {
      id: 'esat-maths2-spec',
      title: 'UAT-UK · ESAT 2026/2027 考纲 MM5',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按MM5.1—MM5.3核对指数函数图像、对数律与可经代数整理的指数方程；不要求换底公式。讲解独立编写；考法核对库内全部88道年度数学2题，归纳其中11道相关题，题库自测不充作年度真题证据。',
    },
  ],
}
