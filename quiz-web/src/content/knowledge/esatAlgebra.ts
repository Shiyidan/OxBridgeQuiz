// ESAT 数学1代数讲义：覆盖19个考纲叶节点，真实题源由学习接口读取，考法保留全量相关年度证据。
import type { KnowledgeLesson } from './types'
import { algebraFoundationsMethods } from './algebraFoundationsMethods'
import { algebraManipulationMethods } from './algebraManipulationMethods'
import { algebraGraphMethods } from './algebraGraphMethods'
import { algebraApplicationsMethods } from './algebraApplicationsMethods'
import { algebraFinalMethods } from './algebraFinalMethods'

export const esatAlgebra: KnowledgeLesson = {
  code: '110400',
  title: 'Algebra · 代数',
  subtitle: '从符号、方程到图像和数列，把每一步都变成可检查的关系',
  intro:
    '先识别结构，再选工具：展开与分解互为逆过程，方程与交点互相验证，数列的项号与函数输入相对应。每个知识点配有可操作的示意和真实题源练习，帮助把复习直接转为解题动作。',
  memory: [
    '**分式先记定义域，约分只约公共因式。**化简不能恢复原来不存在的取值。',
    '**不等式遇负数乘除要反向，平方根恢复未知量要检查正负。**',
    '**直线看斜率，二次式三种形式各有用途。**一般式看截距，因式看根，配方看顶点。',
    '**斜率是除法，面积是乘法；数列先分项号与项值。**用单位和首项检查结果。',
  ],
  sections: [
    {
      code: '110401',
      title: '代数记号',
      summary: algebraFoundationsMethods['110401'].summary,
      paragraphs: [algebraFoundationsMethods['110401'].intro],
      memory: algebraFoundationsMethods['110401'].memory,
      rules: algebraFoundationsMethods['110401'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '把3x读作x的三次方。',
        '把“少于”和“除以”的前后对象写反。',
        '人数表里同一人重复计入或漏掉一个类别。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '字母代表量，括号保留整体；先翻译关系，再计算。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '文字关系翻译为含字母的表达式',
            description:
              '把分类人数、单位换算及单价连续转成加减乘除，考查每个字母对应的对象与整体关系。',
            reference: '2017、2021 年度真题',
            sourceCodes: ['ENGAA_2017_S1-Q015', 'ESAT_LEGACY_2021_NSAA_Q019'],
          },
          {
            form: '总量与平均量之间列式',
            description:
              '购物费用和平均数题把总量藏在文字里，需先写数量×单价或人数×均值，再整理目标表达式。',
            reference: '2017、2018 年度真题',
            sourceCodes: ['ENGAA_2017_S1-Q007', 'ESAT_LEGACY_2018_NSAA_Q07'],
          },
        ],
        examples: [
          {
            title: '按分类人数列式，不急着代数值',
            source: {
              questionCode: 'ENGAA_2017_S1-Q015',
              why: '按分类人数列式，不急着代数值',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'F',
            steps: [
              '女生共3X，其中法语女生X，西班牙语女生为35−Y。',
              '德语女生是3X−X−(35−Y)=2X+Y−35。',
              '再加德语男生2Y，德语总人数为2X+3Y−35，选F。',
            ],
            takeaway: '先把“总人数”和“某一性别人数”分开，再逐项相减相加。',
          },
        ],
        checklist: [
          '能解释并正确使用：乘法可省略，次序不能乱。',
          '能解释并正确使用：整体量加括号。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110402',
      title: '代数指数律',
      summary: algebraFoundationsMethods['110402'].summary,
      paragraphs: [algebraFoundationsMethods['110402'].intro],
      memory: algebraFoundationsMethods['110402'].memory,
      rules: algebraFoundationsMethods['110402'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '只平方字母，忘记系数3也变成9。',
        '把负指数写成负号。',
        '约去到零次幂后误认为结果是0。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '先分底数、再算指数；负指数取倒数，外层幂作用于每个因子。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '同底数化简或比较指数',
            description: '把9、27、81或2、4、8统一为同底数后，处理含字母的指数并解出参数。',
            reference: '2016、2017、2019、2023 年度真题',
            sourceCodes: [
              'ENGAA_2016_S1-Q025',
              'ENGAA_2017_S1-Q013',
              'NSAA_2019_S1-Q009',
              'NSAA_2023_S1-Q007',
            ],
          },
          {
            form: '多字母与负幂、分数幂混合',
            description: '外层幂同时作用于系数与每个字母，再合并幂次；重点干扰来自漏乘系数及负号。',
            reference: '2021、2022 年度真题',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q001', 'ESAT_LEGACY_2022_NSAA_Q001'],
          },
        ],
        examples: [
          {
            title: '负三次幂作用到系数和每个字母',
            source: {
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q001',
              why: '负三次幂作用到系数和每个字母',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'E',
            steps: [
              '把括号拆成$(5x^2y)^{-3}=5^{-3}x^{-6}y^{-3}$。',
              '将系数相乘：$5^{1-3+1}=5^{-1}$；x指数为$1-6+2=-3$。',
              'y指数为$2-3+1=0$，因此结果为$1/(5x^3)$，选E。',
            ],
            takeaway: '把数值系数也当一种底数记账，零次幂留下1。',
          },
        ],
        checklist: [
          '能解释并正确使用：逐底数记账。',
          '能解释并正确使用：倒数和根式顺序。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110403',
      title: '代入与代数术语',
      summary: algebraFoundationsMethods['110403'].summary,
      paragraphs: [algebraFoundationsMethods['110403'].intro],
      memory: algebraFoundationsMethods['110403'].memory,
      rules: algebraFoundationsMethods['110403'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '负数平方时漏括号。',
        '把函数记号f(x)误当成f乘x。',
        '把x坐标代到y，或忘记先乘方。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '代入整个数值并保留括号；分清求式值与解方程。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '给定代入结果，反求系数',
            description: '把指定x值或曲线上的坐标代入多项式，得到参数关系；常与联立方程合在一起。',
            reference: '2016、2019 年度真题',
            sourceCodes: ['ENGAA_2016_S1-Q029', 'NSAA_2019_S1-Q005'],
          },
          {
            form: '代入项号，再计算目标表达式',
            description:
              '题目先给数列某项之间的关系，再要求另一个项值或参数组合；项号与项值不可交换。',
            reference: '2018、2022 年度真题',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q25', 'ESAT_LEGACY_2022_NSAA_Q006'],
          },
        ],
        examples: [
          {
            title: '把曲线上的两点变成两条系数条件',
            source: {
              questionCode: 'NSAA_2019_S1-Q005',
              why: '把曲线上的两点变成两条系数条件',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'E',
            steps: [
              '将(2,6)代入，得4p+2q=6，即2p+q=3。',
              '将(4,−4)代入，得16p+4q=−4，即4p+q=−1。',
              '两式相减得2p=−4，所以p=−2，回代q=7；题目问q−p=9，选E。',
            ],
            takeaway: '坐标提供的是成对的x、y值；求完参数再读目标组合。',
          },
        ],
        checklist: [
          '能解释并正确使用：看清项与因式。',
          '能解释并正确使用：点代入后成为条件。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110404',
      title: '合并、展开与提公因式',
      summary: algebraFoundationsMethods['110404'].summary,
      paragraphs: [algebraFoundationsMethods['110404'].intro],
      memory: algebraFoundationsMethods['110404'].memory,
      rules: algebraFoundationsMethods['110404'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '把(a+b)²写成a²+b²。',
        '括号前的负号只作用于第一项。',
        '提因式后漏掉常数项或提少一个x。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '同类项只合系数；展开逐项相乘，提因式反向检查。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '展开和提因式作为后续步骤',
            description:
              '平方相减接配方，或先提公因式、识别平方差再约分；真题通常把基本操作嵌进多步化简。',
            reference: '2020、2016、2017、2019、2021、2022、2023 年度真题',
            sourceCodes: [
              'ESAT-2020-MATHS1-010',
              'ENGAA_2016_S1-Q021',
              'ENGAA_2017_S1-Q011',
              'NSAA_2019_S1-Q006',
              'ESAT_LEGACY_2021_NSAA_Q002',
              'ESAT_LEGACY_2022_NSAA_Q007',
              'NSAA_2023_S1-Q006',
            ],
          },
        ],
        examples: [
          {
            title: '两个乘积相减，逐项检查符号',
            source: {
              questionCode: 'ESAT-M1-MOCK-ADAPT-E09-017',
              why: '两个乘积相减，逐项检查符号',
              subject: 'mathematics1',
              kind: 'bank',
            },
            question: '',
            answer: 'B',
            steps: [
              '第一项展开为2xy+6xz−y²−3yz。',
              '第二项先独立展开为2xy−xz+4y²−2yz。',
              '减去第二项时四项都变号：2xy抵消，xz合为7xz，y²合为−5y²，yz合为−yz。',
              '结果为7xz−5y²−yz，选B。',
            ],
            takeaway: '先把被减括号完整展开，再整体变号，漏负号的机会最小。',
          },
        ],
        checklist: [
          '能解释并正确使用：展开保留中间项。',
          '能解释并正确使用：多个括号逐次处理。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110405',
      title: '二次式因式分解',
      summary: algebraManipulationMethods['110405'].summary,
      paragraphs: [algebraManipulationMethods['110405'].intro],
      memory: algebraManipulationMethods['110405'].memory,
      rules: algebraManipulationMethods['110405'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '只检查常数乘积，没检查中间项。',
        '把平方差当完全平方。',
        '在还没有等于0时把因式各自设为0。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '找乘积与和；首项非1时拆中项，平方差先认结构。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '分式中识别平方差和一般二次因式',
            description:
              '因式分解不是最后一步，需看分解后的因式能否约去或与另一个分式配对，包含首项系数不为1的情况。',
            reference: '2016、2017、2019、2021、2022、2023 年度真题',
            sourceCodes: [
              'ENGAA_2016_S1-Q021',
              'ENGAA_2017_S1-Q011',
              'NSAA_2019_S1-Q006',
              'ESAT_LEGACY_2021_NSAA_Q002',
              'ESAT_LEGACY_2022_NSAA_Q007',
              'NSAA_2023_S1-Q006',
            ],
          },
          {
            form: '零乘积与反向构造二次式',
            description: '由图像交点、几何面积或重复整体建立二次式，再用因式结构求根或比较系数。',
            reference: '2016、2019、2020、2022 年度真题',
            sourceCodes: [
              'NSAA_2016_S1-Q016',
              'NSAA_2019_S1-Q010',
              'ESAT-2020-MATHS1-007',
              'ESAT_LEGACY_2022_NSAA_Q009',
            ],
          },
        ],
        examples: [
          {
            title: '非首一二次式先分解再约分',
            source: {
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q002',
              why: '非首一二次式先分解再约分',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'B',
            steps: [
              '分母12x²+x−1拆中项：12x²+4x−3x−1=(3x+1)(4x−1)。',
              '分子x+3x²=x(3x+1)，约去公共因式后为2−x/(4x−1)。',
              '通分得到(8x−2−x)/(4x−1)=(7x−2)/(4x−1)，选B。',
              '题目给x>1，原分母不为0，约分合法。',
            ],
            takeaway: '分解后的同一括号才是可约因式；外面的2仍须通分。',
          },
        ],
        checklist: [
          '能解释并正确使用：先提，再分。',
          '能解释并正确使用：平方差保留两个因式。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110406',
      title: '表达式与代数分式化简',
      summary: algebraManipulationMethods['110406'].summary,
      paragraphs: [algebraManipulationMethods['110406'].intro],
      memory: algebraManipulationMethods['110406'].memory,
      rules: algebraManipulationMethods['110406'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '直接约掉加法中的一项。',
        '除以分式却不取倒数。',
        '化简成多项式后忘记原来的禁值。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '只约公共因式；先写原定义域，再通分或乘倒数。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '整式加减分式，先约再通分',
            description:
              '共同因式和相反因式藏在分子分母里，化简后还要处理外部常数；负号错误是主要干扰。',
            reference: '2016、2017、2019、2021 年度真题',
            sourceCodes: [
              'ENGAA_2016_S1-Q021',
              'ENGAA_2017_S1-Q011',
              'NSAA_2019_S1-Q006',
              'ESAT_LEGACY_2021_NSAA_Q002',
            ],
          },
          {
            form: '分式相除与多重因式约分',
            description:
              '先拆所有二次式或立方式，再乘倒数、约公共因式，保留原分母和除式的非零条件。',
            reference: '2022、2023 年度真题',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q007', 'NSAA_2023_S1-Q006'],
          },
          {
            form: '嵌套分式的运算层级',
            description: '两个看似相同的复合分数其实分组不同；分数线决定哪一整体被除，再统一分母。',
            reference: '2020 年度真题',
            sourceCodes: ['ESAT-2020-MATHS1-009'],
          },
        ],
        examples: [
          {
            title: '分式相除先因式分解再倒置',
            source: {
              questionCode: 'NSAA_2023_S1-Q006',
              why: '分式相除先因式分解再倒置',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'D',
            steps: [
              '原分母要求x≠2、−6、0、6，除式也必须非零。',
              '4x−8=4(x−2)，x²+4x−12=(x+6)(x−2)，x³−36x=x(x−6)(x+6)。',
              '原式化为$\\frac{4(x-2)}{(x+6)(x-2)}\\times\\frac{x(x-6)(x+6)}{x-6}$。',
              '约去公共因式得4x，选D；仍保留原来的四个禁值。',
            ],
            takeaway: '答案看起来简单，并不意味着原式在每个x上都有意义。',
          },
        ],
        checklist: [
          '能解释并正确使用：约掉因式，不恢复禁值。',
          '能解释并正确使用：分式除法检查两处。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110407',
      title: '公式变形',
      summary: algebraManipulationMethods['110407'].summary,
      paragraphs: [algebraManipulationMethods['110407'].intro],
      memory: algebraManipulationMethods['110407'].memory,
      rules: algebraManipulationMethods['110407'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '交叉相乘后漏乘括号内的常数。',
        '开平方只保留正根而题目没有正数条件。',
        '分母出现目标字母时直接交换字母位置。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '把目标字母集中成一个整体，最后才开方或除以系数。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '平方或立方整体的逆运算',
            description: '先把目标的幂当一个整体，收集后再开根；平方有正负分支，立方实根唯一。',
            reference: '2016、2017、2019、2022 年度真题',
            sourceCodes: [
              'ENGAA_2016_S1-Q017',
              'ENGAA_2017_S1-Q005',
              'NSAA_2019_S1-Q003',
              'ESAT_LEGACY_2022_NSAA_Q015',
            ],
          },
          {
            form: '分母中的目标与含字母系数',
            description: '先移项或去分母，目标字母集中提取后再除；条件和单位常同时出现。',
            reference: '2021、2023、2018 年度真题',
            sourceCodes: [
              'ESAT_LEGACY_2021_NSAA_Q003',
              'NSAA_2023_S1-Q003',
              'ESAT_LEGACY_2018_NSAA_Q07',
            ],
          },
        ],
        examples: [
          {
            title: '目标字母在分式两处，先集中平方项',
            source: {
              questionCode: 'ENGAA_2016_S1-Q017',
              why: '目标字母在分式两处，先集中平方项',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'B',
            steps: [
              '由a=(b²+2)/(3b²−1)，交叉相乘得到3ab²−a=b²+2。',
              '把含b²的项移到一侧：(3a−1)b²=a+2。',
              '得到$b^2=(a+2)/(3a-1)$，再开平方为$b=\\pm\\sqrt{(a+2)/(3a-1)}$，选B。',
              '原分母3b²−1不能为0，开实数平方根还需根号内非负；题目未限制b为正，不能丢掉负分支。',
            ],
            takeaway: '先把b²当作整体，最后一步才恢复b。',
          },
        ],
        checklist: [
          '能解释并正确使用：目标在分母也先隔离。',
          '能解释并正确使用：平方和平方根不同。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110408',
      title: '方程、恒等式与等价证明',
      summary: algebraManipulationMethods['110408'].summary,
      paragraphs: [algebraManipulationMethods['110408'].intro],
      memory: algebraManipulationMethods['110408'].memory,
      rules: algebraManipulationMethods['110408'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '把等号两边各自为0当成解方程的必需条件。',
        '只代入x=0就宣称恒等成立。',
        '证明时除以可能为零的式子而未说明条件。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '解方程找允许的值；证恒等式必须覆盖所有允许值。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '从合法变形判断表达式等价',
            description:
              '现有年度题以“等价表达式”“化简”考查恒等变形，没有独立文字证明题；分式需保留定义域。',
            reference: '2016、2017、2019、2020、2021、2022、2023 年度真题',
            sourceCodes: [
              'ENGAA_2016_S1-Q021',
              'ENGAA_2017_S1-Q011',
              'NSAA_2019_S1-Q006',
              'ESAT-2020-MATHS1-009',
              'ESAT_LEGACY_2021_NSAA_Q002',
              'ESAT_LEGACY_2022_NSAA_Q007',
              'NSAA_2023_S1-Q006',
            ],
          },
          {
            form: '不同表达形式之间比较系数',
            description: '从根或配方形式反推系数，要求两种形式表示同一多项式；不能只挑一个x验证。',
            reference: '2016、2020 年度真题',
            sourceCodes: ['NSAA_2016_S1-Q016', 'ESAT-2020-MATHS1-010'],
          },
        ],
        examples: [
          {
            title: '恒等式比较系数，再筛选参数分支',
            source: {
              questionCode: 'ESAT-M1-AI-20260809-C13A2FCB8087-R3-V2',
              why: '恒等式比较系数，再筛选参数分支',
              subject: 'mathematics1',
              kind: 'bank',
            },
            question: '',
            answer: 'C',
            steps: [
              '展开左边为2x²+(p+2q)x+pq，因此p+2q=8且pq=2。',
              '由$p=8-2q$得$q^2-4q+1=0$，所以$q=2\\pm\\sqrt3$。',
              '条件$p>2q$选出$q=2-\\sqrt3,\\ p=4+2\\sqrt3$。',
              '第二个二次式给$\\alpha+\\beta=p-q=2+3\\sqrt3,\\ \\alpha\\beta=1$。于是$\\alpha^2+\\beta^2=(2+3\\sqrt3)^2-2=29+12\\sqrt3$，选C。',
            ],
            takeaway: '系数比较适用于对所有x成立的恒等式；随后仍要使用题干的次序条件。',
          },
        ],
        checklist: [
          '能解释并正确使用：恒等式带来多条系数关系。',
          '能用合法变形证明，而不把数值抽查当作证明。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110409',
      title: '四象限坐标',
      summary: algebraGraphMethods['110409'].summary,
      paragraphs: [algebraGraphMethods['110409'].intro],
      memory: algebraGraphMethods['110409'].memory,
      rules: algebraGraphMethods['110409'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '把(x,y)读成先纵后横。',
        '轴上的点也强行分配象限。',
        '对非原点旋转忘记先转换相对位置。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '先横后纵，符号定方向；坐标是位置，差值才是移动。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '位置、变换与坐标差联动',
            description:
              '象限和坐标读取通常作为坐标几何的基础，随后接平移、旋转、反射、中点或平行四边形关系。',
            reference: '2017、2019、2020、2022 年度真题',
            sourceCodes: [
              'NSAA_2017_S1-Q008',
              'NSAA_2019_S1-Q014',
              'ESAT-2020-MATHS1-017',
              'ESAT-2020-MATHS1-020',
              'ESAT_LEGACY_2022_NSAA_Q019',
            ],
          },
          {
            form: '含参数坐标接直线或曲线',
            description: '按x、y成对使用坐标，形成斜率或代入方程；符号顺序比机械套式更重要。',
            reference: '2016、2018、2019、2023 年度真题',
            sourceCodes: [
              'NSAA_2016_S1-Q018',
              'ESAT_LEGACY_2018_ENGAA_Q05',
              'NSAA_2019_S1-Q005',
              'NSAA_2023_S1-Q012',
            ],
          },
        ],
        examples: [
          {
            title: '非原点旋转先改为相对坐标',
            source: {
              questionCode: 'NSAA_2019_S1-Q014',
              why: '非原点旋转先改为相对坐标',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'G',
            steps: [
              '旋转中心P=(4,5)，R相对P的位置是(10−4,8−5)=(6,3)。',
              '顺时针90°把相对向量(6,3)变为(3,−6)。',
              '加回中心，旋转后的R是(7,−1)；再关于x轴反射，y变号，得到(7,1)，选G。',
            ],
            takeaway: '“先减中心、变换向量、再加中心”避免把非原点旋转当成原点旋转。',
          },
        ],
        checklist: [
          '能解释并正确使用：四象限用符号检查。',
          '能解释并正确使用：关于原点顺时针90°。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110410',
      title: '线性函数、斜率与直线',
      summary: algebraGraphMethods['110410'].summary,
      paragraphs: [algebraGraphMethods['110410'].intro],
      memory: algebraGraphMethods['110410'].memory,
      rules: algebraGraphMethods['110410'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '把方程x的系数直接当斜率。',
        '计算两点差时分子、分母方向相反。',
        '垂线斜率只变号却没取倒数。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '斜率是纵向变化除以横向变化；截距是与坐标轴相交的位置。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '一般式与两点式混合判断平行垂直',
            description: '先从一般式读取正确斜率，再用两点斜率或经过点条件求参数、截距。',
            reference: '2018、2019、2020、2023 年度真题',
            sourceCodes: [
              'ESAT_LEGACY_2018_ENGAA_Q05',
              'NSAA_2019_S1-Q013',
              'ESAT-2020-MATHS1-005',
              'NSAA_2023_S1-Q012',
            ],
          },
          {
            form: '斜率的取值条件和围成的面积',
            description: '检查斜率有限且正的参数范围，或联立直线求交点并计算围成图形面积。',
            reference: '2016、2018 年度真题',
            sourceCodes: ['NSAA_2016_S1-Q018', 'ESAT_LEGACY_2018_ENGAA_Q11'],
          },
        ],
        examples: [
          {
            title: '两点斜率与负倒数联立',
            source: {
              questionCode: 'NSAA_2023_S1-Q012',
              why: '两点斜率与负倒数联立',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'C',
            steps: [
              '3x−4y+5=0改写为y=3x/4+5/4，所以给定直线的斜率为3/4。',
              '所求连线与它垂直，斜率应为−4/3。两点差给斜率(2q−6)/(q+2)。',
              '解3(2q−6)=−4(q+2)，得10q=10，q=1，选C。',
              '代回两点为(1,1)、(4,−3)，斜率−4/3，且q+2≠0。',
            ],
            takeaway: '先把一般式变成y=mx+c，再比较斜率，不直接读x的系数。',
          },
        ],
        checklist: [
          '能解释并正确使用：点斜式减少代数步骤。',
          '能解释并正确使用：平行与垂直分清。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110411',
      title: '二次图像、根与转折点',
      summary: algebraGraphMethods['110411'].summary,
      paragraphs: [algebraGraphMethods['110411'].intro],
      memory: algebraGraphMethods['110411'].memory,
      rules: algebraGraphMethods['110411'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '顶点式x+3误读成顶点横坐标3。',
        '补平方时忘记乘外系数。',
        '只看开口方向便断言图像在x轴上方。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '三种形式各有用途：一般式看纵截距，因式看根，顶点式看转折点。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '配方读顶点与最小值',
            description: '从展开式或平方差改写为顶点式，求补偿常数，或判断最低点是否严格在轴上方。',
            reference: '2020、2022 年度真题',
            sourceCodes: ['ESAT-2020-MATHS1-010', 'ESAT_LEGACY_2022_NSAA_Q020'],
          },
          {
            form: '交点横坐标与二次根的关系',
            description:
              '将直线与抛物线相等，交点横坐标成为新二次方程的根；根差不是原抛物线顶点高度。',
            reference: '2016、2021 年度真题',
            sourceCodes: ['NSAA_2016_S1-Q016', 'ESAT_LEGACY_2021_NSAA_Q011'],
          },
        ],
        examples: [
          {
            title: '最低点在轴上方，转为最小值严格为正',
            source: {
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q020',
              why: '最低点在轴上方，转为最小值严格为正',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'C',
            steps: [
              '配方：y=x²+2ax+a=(x+a)²+a−a²。',
              '平方项最小是0，顶点为(−a,a−a²)。',
              '最低点在x轴上方意味着a−a²>0，即a(1−a)>0。',
              '由两因子的符号得到0<a<1，选C；a=0或1时最低点在轴上，不符合“上方”。',
            ],
            takeaway: '图像位置条件先转成顶点高度条件，再处理参数范围。',
          },
        ],
        checklist: [
          '能解释并正确使用：配方保留整体系数。',
          '能解释并正确使用：根与判别式对应。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110412',
      title: '常见函数图像',
      summary: algebraGraphMethods['110412'].summary,
      paragraphs: [algebraGraphMethods['110412'].intro],
      memory: algebraGraphMethods['110412'].memory,
      rules: algebraGraphMethods['110412'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '把三角函数度数当弧度。',
        '把1/x画成穿过原点。',
        '数交点时把渐近线与直线的相交也算进去。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '先认形状与定义域，再用关键点、对称和渐近线定位。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '按周期与渐近线数图像交点',
            description:
              '现有年度题出现正切与直线交点个数；必须按度数和指定闭区间分支检查，不能跨渐近线连图。',
            reference: '2021 年度真题',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q020'],
          },
          {
            form: '直线与抛物线的关键特征',
            description: '通过斜率、顶点、轴上位置和交点联结表达式与图像，不要求把所有点都算出。',
            reference: '2020、2016、2021、2022 年度真题',
            sourceCodes: [
              'ESAT-2020-MATHS1-005',
              'NSAA_2016_S1-Q016',
              'ESAT_LEGACY_2021_NSAA_Q011',
              'ESAT_LEGACY_2022_NSAA_Q020',
            ],
          },
        ],
        examples: [
          {
            title: '正切分支与陡直线的交点个数',
            source: {
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q020',
              why: '正切分支与陡直线的交点个数',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'F',
            steps: [
              '角度按度数。tan x在−270°、−90°、90°、270°处无定义，不能把这些位置算作解。',
              'x=0是一个解；对0<x<90°，曲线起初低于100x，临近90°时趋向正无穷，产生一个正根。',
              '在90°<x<180°正切为负而100x为正，无交点；在180°<x<270°，正切从0增长至正无穷，与直线再相交一次；270°<x≤360°无交点。',
              '上述正切正值分支向上弯曲，斜率递增，曲线与直线的差先减后增，每个所述分支只产生那一个正根。两函数均为奇函数，所以还有两个对称负根；总共5个，选F。',
            ],
            takeaway: '按渐近线分区、按符号排除，再检查对称和端点。',
          },
        ],
        checklist: [
          '能解释并正确使用：平移方向看输入。',
          '能解释并正确使用：正切不能跨断点。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110413',
      title: '实际情境中的图像',
      summary: algebraApplicationsMethods['110413'].summary,
      paragraphs: [algebraApplicationsMethods['110413'].intro],
      memory: algebraApplicationsMethods['110413'].memory,
      rules: algebraApplicationsMethods['110413'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '用往返净位移代替总路程。',
        '把位置图水平段解释成匀速前进。',
        '非线性曲线只按两个端点作直线插值却不说明估算。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '先读两条轴的物理意义，再判断高度、变化率和区间。',
        pastPaperSummary:
          '当前已导入的2016—2023年度数学1真题中，未找到直接考查本点的图像题。这里用已发布题库题练习，不据此推断往年频率。',
        pastPaperPatterns: [],
        pastPaperNote: '本节例题与自测来自已发布独立试题库，属于题库练习，不标作历年真题。',
        examples: [
          {
            title: '离家距离图不能直接当累计路程图',
            source: {
              questionCode: 'ESAT-TMUA-R22-M1-20260827-001-V3',
              why: '离家距离图不能直接当累计路程图',
              subject: 'mathematics1',
              kind: 'bank',
            },
            question: '',
            answer: 'D',
            steps: [
              '图中从家到10 km处，再回到家，实际路程为10+10=20 km。',
              '15到25分钟的水平段是停留；题目只问运动期间，运动时间是15+(50−25)=40分钟。',
              '40分钟为$\\frac23$小时，平均速率$20\\div\\frac23=30$ km/h，选D。',
              '如果把停车也算入，会得到24 km/h；那回答的是整个旅程，题目口径不同。',
            ],
            takeaway: '先读纵轴是“离家距离”，再读平均速率分母究竟包括哪段时间。',
          },
        ],
        checklist: [
          '能解释并正确使用：先问分母包括什么。',
          '能解释并正确使用：同一图高低不代表同一物理量。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110414',
      title: '图像斜率与面积',
      summary: algebraApplicationsMethods['110414'].summary,
      paragraphs: [algebraApplicationsMethods['110414'].intro],
      memory: algebraApplicationsMethods['110414'].memory,
      rules: algebraApplicationsMethods['110414'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '看到图像就算斜率，实际题目要的是面积。',
        '速度为负的面积直接抵消后当作总路程。',
        '分钟与km/h未换算就相乘。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '斜率做除法，面积做乘法；先用单位判断所求是什么。',
        pastPaperSummary:
          '当前已导入的2016—2023年度数学1真题中，未找到直接考查本点的图像题。这里用已发布题库题练习，不据此推断往年频率。',
        pastPaperPatterns: [],
        pastPaperNote: '本节例题与自测来自已发布独立试题库，属于题库练习，不标作历年真题。',
        examples: [
          {
            title: '速率曲线分成三角形和梯形',
            source: {
              questionCode: 'ESAT-M1-DIRECT-017-LR3',
              why: '速率曲线分成三角形和梯形',
              subject: 'mathematics1',
              kind: 'bank',
            },
            question: '',
            answer: 'C',
            steps: [
              '0到4秒形成三角形：面积=4×10/2=20 m。',
              '4到9秒的宽度是5秒，两个端点速率为10和6 m/s。',
              '后段梯形面积=(10+6)×5/2=40 m，总路程60 m，选C。',
              '单位(m/s)×s=m；若用全程最高速率乘9秒，会高估路程。',
            ],
            takeaway: '在每个折点处分块，每一块先认形状再计算面积。',
          },
        ],
        checklist: [
          '能解释并正确使用：梯形面积。',
          '能解释并正确使用：切线取大三角形。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110415',
      title: '方程与联立方程',
      summary: algebraApplicationsMethods['110415'].summary,
      paragraphs: [algebraApplicationsMethods['110415'].intro],
      memory: algebraApplicationsMethods['110415'].memory,
      rules: algebraApplicationsMethods['110415'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '只乘等号左边忘记右边。',
        '解出x就结束，或x、y没有一一对应。',
        '把平行无解和重合无穷多解混淆。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '先把情境翻译成独立条件，再用消元或代入锁定同一个解。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '生活总量与统计条件建方程',
            description:
              '购物、票价、平均数和中位数给出独立关系；用消元求目标组合，不必总把每个未知量都单独求完。',
            reference: '2017、2020、2018、2022、2023 年度真题',
            sourceCodes: [
              'ENGAA_2017_S1-Q007',
              'ESAT-2020-MATHS1-002',
              'ESAT_LEGACY_2018_NSAA_Q07',
              'ESAT_LEGACY_2022_NSAA_Q008',
              'NSAA_2023_S1-Q004',
            ],
          },
          {
            form: '坐标、代入结果与直线曲线联立',
            description: '利用指定函数值或交点求参数，线性与二次联立时需保留所有合法解并配对坐标。',
            reference: '2016、2019、2018、2021、2022 年度真题',
            sourceCodes: [
              'ENGAA_2016_S1-Q029',
              'NSAA_2019_S1-Q005',
              'NSAA_2016_S1-Q016',
              'ESAT_LEGACY_2018_ENGAA_Q11',
              'ESAT_LEGACY_2021_NSAA_Q011',
              'ESAT_LEGACY_2022_NSAA_Q019',
            ],
          },
        ],
        examples: [
          {
            title: '买水果列联立，只消掉不需要的变量',
            source: {
              questionCode: 'ENGAA_2017_S1-Q007',
              why: '买水果列联立，只消掉不需要的变量',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'G',
            steps: [
              '由购买清单写2x+5y=P、3x+2y=Q，题目只问梨价y。',
              '第一式乘3得6x+15y=3P，第二式乘2得6x+4y=2Q。',
              '前式减后式得到11y=3P−2Q，所以y=(3P−2Q)/11，选G。',
            ],
            takeaway: '目标是y，就让x的系数相同后消去；参数总价与数字一样参与运算。',
          },
        ],
        checklist: [
          '能解释并正确使用：消元整行相乘。',
          '能解释并正确使用：直线与曲线先相等。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110416',
      title: '二次方程',
      summary: algebraApplicationsMethods['110416'].summary,
      paragraphs: [algebraApplicationsMethods['110416'].intro],
      memory: algebraApplicationsMethods['110416'].memory,
      rules: algebraApplicationsMethods['110416'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '除以x丢掉零根。',
        '把−b或分母2a的符号写错。',
        '求出代换变量的根，却忘记换回原未知量。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '先整理成零，再选因式分解、配方或公式；两个根都要检查。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '几何或交点条件构造二次方程',
            description: '面积、勾股或直线抛物线相交先翻译成方程，求根后结合长度、坐标条件检查。',
            reference: '2016、2019、2018、2022 年度真题',
            sourceCodes: [
              'NSAA_2016_S1-Q016',
              'NSAA_2019_S1-Q010',
              'ESAT_LEGACY_2018_ENGAA_Q23',
              'NSAA_2019_S1-Q008',
              'ESAT_LEGACY_2022_NSAA_Q009',
            ],
          },
          {
            form: '根和、根差与根的组合',
            description:
              '由根的距离反推系数，或求两个根的线性组合；配方、判别式和根和积可以减少运算。',
            reference: '2020、2021、2022、2023 年度真题',
            sourceCodes: [
              'ESAT-2020-MATHS1-018',
              'ESAT_LEGACY_2021_NSAA_Q011',
              'ESAT_LEGACY_2022_NSAA_Q014',
              'NSAA_2023_S1-Q008',
            ],
          },
          {
            form: '换元或消元后出现二次式',
            description:
              '重复括号整体先设新变量，或由两个代入条件消元；最后要恢复题目原来的未知量。',
            reference: '2020、2016 年度真题',
            sourceCodes: ['ESAT-2020-MATHS1-007', 'ENGAA_2016_S1-Q029'],
          },
        ],
        examples: [
          {
            title: '先定位较大根，再算指定组合',
            source: {
              questionCode: 'NSAA_2023_S1-Q008',
              why: '先定位较大根，再算指定组合',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'E',
            steps: [
              '求根公式给$x=(6\\pm\\sqrt{36+24})/6=1\\pm\\sqrt{15}/3$。',
              '因为p>q，$p=1+\\sqrt{15}/3,\\ q=1-\\sqrt{15}/3$。',
              '因此$3p+2q=3+2+(3-2)\\sqrt{15}/3=5+\\sqrt{15}/3$，选E。',
              '用p+q=2检查常数部分，再看根式的正负分支是否与大小条件一致。',
            ],
            takeaway: '只需先确定两根的大小，再按权重合并常数项与根式项。',
          },
        ],
        checklist: [
          '能解释并正确使用：一项移到右边不是零乘积。',
          '能解释并正确使用：目标是根差先平方。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110417',
      title: '一次不等式',
      summary: algebraFinalMethods['110417'].summary,
      paragraphs: [algebraFinalMethods['110417'].intro],
      memory: algebraFinalMethods['110417'].memory,
      rules: algebraFinalMethods['110417'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '除以负数忘记反向。',
        '严格不等式的边界也包含进答案。',
        '两个条件取并集而不是交集。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '负数乘除翻方向；联立条件取交集，边界按含不含等号画。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '分数系数与多括号的一次不等式',
            description: '先正数通分、展开合并，再处理负系数与严格端点，要求完整实数解集。',
            reference: '2016、2019、2022 年度真题',
            sourceCodes: ['ENGAA_2016_S1-Q001', 'NSAA_2019_S1-Q002', 'ESAT_LEGACY_2022_NSAA_Q003'],
          },
        ],
        examples: [
          {
            title: '正数通分后合并，再处理负系数',
            source: {
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q003',
              why: '正数通分后合并，再处理负系数',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'D',
            steps: [
              '两边乘正数4，不等号不变：3(5−x)−2(6−x)−4x<0。',
              '展开合并得到3−5x<0，即−5x<−3。',
              '除以−5要反向，得到x>3/5，选D。',
              '在数轴上3/5处画空心点并向右延伸；用x=1代回可确认方向。',
            ],
            takeaway: '先用正公倍数去分母，最后只有一次负数除法需要翻方向。',
          },
        ],
        checklist: [
          '能解释并正确使用：负数除法翻方向。',
          '能解释并正确使用：整条链同时处理。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110418',
      title: '生成数列',
      summary: algebraFinalMethods['110418'].summary,
      paragraphs: [algebraFinalMethods['110418'].intro],
      memory: algebraFinalMethods['110418'].memory,
      rules: algebraFinalMethods['110418'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: [
        '把第n项的n与项值互换。',
        '递推每次都使用第一项。',
        '只看有限项就宣称规律一定唯一。',
      ],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra', 'openstax-sequences'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '项数是位置，项值是结果；递推向前走，通项直接定位。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '从通项生成、反查项号或待定系数',
            description: '通项与逐项变化规则相互转换，项号对应的取值顺序是关键。',
            reference: '2020、2018、2022 年度真题',
            sourceCodes: [
              'ESAT-2020-MATHS1-001',
              'ESAT_LEGACY_2018_ENGAA_Q25',
              'ESAT_LEGACY_2022_NSAA_Q006',
            ],
          },
          {
            form: '按二维数字排列继续规则',
            description:
              '从行长和连续数字分布定位一个较大数，再求正下方对应位置；不能只凭相邻数字猜差。',
            reference: '2021 年度真题',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q008'],
          },
        ],
        examples: [
          {
            title: '通项既能生成，也能反查位置',
            source: {
              questionCode: 'ESAT-2020-MATHS1-001',
              why: '通项既能生成，也能反查位置',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'G',
            steps: [
              '由aₙ=2n−5，代入n=1、2、3得到−3、−1、1，因此逐项规则为加2。',
              '当项值为17时，解2n−5=17，得n=11。',
              '正确组合是“add 2；第11项”，选G。',
            ],
            takeaway: '通项式中的2是公差，−5只是截距；反查项号时把整个式子等于目标项值。',
          },
        ],
        checklist: [
          '能解释并正确使用：通项的差是相邻两次代入之差。',
          '能解释并正确使用：递推与通项检查首项。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '110419',
      title: '数列第n项',
      summary: algebraFinalMethods['110419'].summary,
      paragraphs: [algebraFinalMethods['110419'].intro],
      memory: algebraFinalMethods['110419'].memory,
      rules: algebraFinalMethods['110419'].blocks.flatMap((block) =>
        block.points ?? (block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ),
      pitfalls: ['把公差直接当首项。', '二阶差忘记除以2。', '反解项号后不检查正整数条件。'],
      sourceIds: ['esat-algebra-spec', 'openstax-algebra', 'openstax-sequences'],
      visual: 'maths-algebra',
      examFocus: {
        goal: '先看一阶差，再看二阶差；拟出通项后回代多个项验证。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学1真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '一次通项与不同项的线性条件',
            description: '给定项之间的倍数关系，求首项公差或远处项；项号间隔必须减1或取正确差值。',
            reference: '2020、2023 年度真题',
            sourceCodes: ['ESAT-2020-MATHS1-001', 'NSAA_2023_S1-Q018'],
          },
          {
            form: '二次规律、比较及排列结构',
            description:
              '由二次项规律确定参数，把两数列比较转为不等式；行列数字题也依赖累计项数的二次增长。',
            reference: '2018、2022、2017、2021 年度真题',
            sourceCodes: [
              'ESAT_LEGACY_2018_ENGAA_Q25',
              'ESAT_LEGACY_2022_NSAA_Q006',
              'NSAA_2017_S1-Q006',
              'ESAT_LEGACY_2021_NSAA_Q008',
            ],
          },
        ],
        examples: [
          {
            title: '相隔项的倍数关系确定公差',
            source: {
              questionCode: 'NSAA_2023_S1-Q018',
              why: '相隔项的倍数关系确定公差',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'C',
            steps: [
              '设aₙ=a+(n−1)d。第二项等于第八项两倍：a+d=2(a+7d)，所以a=−13d。',
              '第五项$a+4d=9/4$，代入得$-9d=9/4$，所以$d=-1/4$。',
              '第20项$a+19d=6d=-3/2$，选C。',
              '检查第五项9/4，再看往后每项减少1/4，第20项为负并不矛盾。',
            ],
            takeaway: '按项号写a+(n−1)d；倍数条件要乘整个对应项。',
          },
        ],
        checklist: [
          '能解释并正确使用：项号从1开始。',
          '能解释并正确使用：二阶差确定二次系数。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'esat-algebra-spec',
      title: 'UAT-UK · ESAT 2026/2027 考纲 M4',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按数学1 M4.1—M4.19组织，包含非线性图像估算、二元不等式和二次数列。',
    },
    {
      id: 'openstax-algebra',
      title: 'OpenStax · Elementary Algebra 2e',
      url: 'https://openstax.org/books/elementary-algebra-2e/pages/1-2-use-the-language-of-algebra',
      note: '核对代数术语与基本运算；讲解、图解和选题围绕本项目考纲重新组织。',
    },
    {
      id: 'openstax-sequences',
      title: 'OpenStax · Sequences and Their Notations',
      url: 'https://openstax.org/books/college-algebra-2e/pages/9-1-sequences-and-their-notations',
      note: '对照递推与通项规则的区别，本章只按数学1要求讲一次和二次数列。',
    },
    {
      id: 'uat-annual-archive',
      title: 'UAT-UK · ENGAA / NSAA 真题档案',
      url: 'https://esat-tmua.ac.uk/esat-preparation-materials/',
      note: '考法证据来自当前库内2016—2023年度数学1题，不声称覆盖未导入的全部官方档案。',
    },
  ],
}
