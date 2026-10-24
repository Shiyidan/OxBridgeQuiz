// ESAT数学1数学习讲义：概念图解、年度考法归纳与真实题源练习对齐现行考纲。
import type { KnowledgeLesson } from './types'

export const esatNumber: KnowledgeLesson = {
  code: '110200',
  title: 'Number · 数',
  subtitle: '从看懂一个数，到算得准、判断得快',
  intro:
    '先判断数的结构，再选择最省力的形式：比较、因数、指数、根式与区间各有自己的捷径。本章以真实题源串联概念、历年考法和自测；没有直接年度题的知识点明确使用题库练习。',
  memory: [
    '比较先统一形式；运算先看结构，再动手算。',
    '分母不能为零；负指数取倒数；开平方先分清“根号值”和“方程的根”。',
    '精确值保留分数、根式与 π；近似值最后一步再舍入。',
    '求范围先看正负与增减关系，不能把所有数一起取大或取小。',
  ],
  sections: [
    {
      code: '110201',
      title: '数的大小与不等号',
      summary: '先统一形式，再判断数轴位置；比较含根式的正数可以比较平方。',
      paragraphs: [
        '数轴上的位置决定大小。负数的绝对值越大，位置越靠左，例如 $-8<-3$；绝对值表示到零的距离，不表示这个数本身更大。',
        '比较分数、小数和整数时，可先统一成小数或同分母分数。分母为正时，也可交叉相乘比较：$\\frac{a}{b}<\\frac{c}{d}$ 等价于 $ad<bc$（$b,d>0$）。不要用过早舍入的小数比较接近的数。',
      ],
      rules: [
        {
          title: '符号要读完整',
          text: '$=$ 表示相等，$\\ne$ 表示不等；$<$、$>$ 不包含相等，$\\le$、$\\ge$ 包含相等。“至少 3”写成 $x\\ge3$，“小于 3”写成 $x<3$。',
        },
        {
          title: '负号与方向',
          text: '两边加减同一个数，大小关系不变；同乘或同除一个负数，不等号反向，例如 $2<5$ 推出 $-2>-5$。',
        },
        {
          title: '小数补零不改值',
          text: '$0.6=0.60$，按相同位值逐位比较，不能仅按小数位数判断大小。',
        },
      ],
      pitfalls: [
        '负数排序不能只比较去掉负号后的数字。',
        '$\\frac13$ 与 $0.333$ 并不相等，前者还带着无限循环的尾数。',
      ],
      visual: 'maths-number',
      sourceIds: ['number-spec', 'number-decimals', 'number-fractions'],
      examFocus: {
        goal: '先统一形式，再判断数轴位置；比较含根式的正数可以比较平方。',
        pastPaperSummary:
          '年度题中的大小关系通常嵌入不等式、带范围的中位数或两个根的大小，鲜有单独的负数排序。这里用题库题把比较方法练清楚。',
        pastPaperPatterns: [
          {
            form: '不等式解集与端点',
            description: '移项后乘除负数必须反向；最终保留严格或非严格端点。',
            reference: '2016 ENGAA、2017 ENGAA、2019 NSAA、2022 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q001',
              'ENGAA_2017_S1-Q003',
              'NSAA_2019_S1-Q002',
              'ESAT_LEGACY_2022_NSAA_Q003',
            ],
          },
          {
            form: '有序数据与正负差',
            description: '利用题给递增顺序确定中位数，或明确较大的根/尺寸，再计算正差。',
            reference: '2022 NSAA、2023 NSAA、2021 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2022_NSAA_Q008',
              'NSAA_2023_S1-Q004',
              'NSAA_2023_S1-Q008',
              'ESAT_LEGACY_2021_NSAA_Q005',
            ],
          },
        ],
        examples: [
          {
            title: '0与1之间：为什么开根反而变大？',
            source: {
              kind: 'bank',
              subject: 'mathematics1',
              questionCode: 'ESAT-M1-MOCK-ADAPT-E02-015',
              why: '==先看范围，再用运算的大小变化；平方不一定使数变大。==',
            },
            question: '',
            answer: 'E',
            steps: [
              '先分正负：$-x<0$，其余选项为正，排除−x。',
              '因为 $0<x<1$，每多乘一次x，数值变小，所以 $x^3<x^2<x$。',
              '设 $t=\\sqrt{x}$，则 $0<t<1$ 且 $t^2=x<t$，所以 $\\sqrt{x}>x$。',
              '合并成 $-x<x^3<x^2<x<\\sqrt{x}$。代一个数只能作检验，这条链才解释“总是”。',
            ],
            takeaway: '==先看范围，再用运算的大小变化；平方不一定使数变大。==',
          },
        ],
        checklist: [
          '会比较正负数、分数与小数。',
          '知道不等号是否含端点。',
          '只在双方非负时直接用平方比较大小。',
        ],
      },
    },
    {
      code: '110202',
      title: '四则运算与位值',
      summary: '让每个数字回到它的位值，带分数与负数先转换后运算。',
      paragraphs: [
        '十进制相邻数位相差 10 倍。例如 $30.407=3\\times10+4\\times\\frac1{10}+7\\times\\frac1{1000}$；这里的 0 占住百分位，不能删掉。乘 10 是每一位的值变为原来的 10 倍。',
        '加减小数时对齐小数点；乘小数可先当整数相乘，再按原来的总小数位数还原。除以小数时，将被除数、除数同时乘同一个 10 的幂，把除数变为整数。负带分数 $-1\\frac12$ 表示 $-(1+\\frac12)$。',
      ],
      rules: [
        {
          title: '符号规则',
          text: '减去负数等于加上对应正数。乘除同号得正、异号得负；零不能作除数。',
        },
        {
          title: '分数四则',
          text: '加减先通分；乘法分子相乘、分母相乘；除以非零分数等于乘其倒数。带分数先化成假分数，例如 $2\\frac13=\\frac73$。',
        },
        {
          title: '先估后算',
          text: '$0.48\\div0.06$ 是“0.48 中有几个 0.06”，应得到 8；不能看到小数就猜结果也小于 1。',
        },
      ],
      pitfalls: [
        '$\\frac12+\\frac13$ 不是 $\\frac25$；分母表示分成多大的份，必须先统一。',
        '除法中只把除数扩大、没有同步扩大被除数，会改变答案。',
      ],
      sourceIds: ['number-spec', 'number-arithmetic', 'number-fractions'],
      visual: 'maths-number',
      examFocus: {
        goal: '让每个数字回到它的位值，带分数与负数先转换后运算。',
        pastPaperSummary:
          '年度题更常把四则运算隐藏在人数、费用和均值中，而不是单问竖式。数字反转的题库题则直接检验十位与个位的区别。',
        pastPaperPatterns: [
          {
            form: '总数减部分，逐层补全',
            description: '用总人数减未通过人数，再从总通过数扣去女性通过数，避免把不同组混减。',
            reference: '2018 ENGAA、2016 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q01', 'ENGAA_2016_S1-Q023'],
          },
          {
            form: '总量与单位量互相还原',
            description: '均值先乘人数得到总量，收费组合先列总价，再通过加减求目标费用。',
            reference: '2016 ENGAA、2017 ENGAA、2020 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q007',
              'ENGAA_2017_S1-Q007',
              'ESAT-2020-MATHS1-002',
              'NSAA_2023_S1-Q004',
            ],
          },
        ],
        examples: [
          {
            title: '两位数反转：数字相同，位值不同',
            source: {
              kind: 'bank',
              subject: 'mathematics1',
              questionCode: 'ESAT-M1-AI-20260809-D5728C365ACE-R3',
              why: '==数字是符号，位值决定它贡献多少：十位要乘10。==',
            },
            question: '',
            answer: 'A',
            steps: [
              '设十位为a、个位为b，原数为 $10a+b$，反转后的数为 $10b+a$。',
              '数字和给出 $a+b=11$；反转增加27，给出 $9(b-a)=27$，因此 $b-a=3$。',
              '两式相加得 $2b=14$，所以b=7、a=4，原数47。',
              '回代：4+7=11，74−47=27。若答74，就把原数和反转数互换了。',
            ],
            takeaway: '==数字是符号，位值决定它贡献多少：十位要乘10。==',
          },
        ],
        checklist: [
          '会把两位数写成10a+b。',
          '带分数参与乘除前先化假分数。',
          '负数相减可先改写为加其相反数。',
        ],
      },
    },
    {
      code: '110203',
      title: '素数、因数与倍数',
      summary: '把整数拆成素因子；公因数取少，公倍数取足。',
      paragraphs: [
        '正整数 $a$ 能整除 $b$ 时，$a$ 是 $b$ 的因数（factor / divisor），$b$ 是 $a$ 的倍数（multiple）。素数（prime）是大于 1、只有 1 和自身两个正因数的整数；1 不是素数，2 是唯一的偶素数。',
        '大于 1 的整数都能分解成素数的乘积；除排列顺序外，分解唯一。最大公因数 HCF 取双方共有的素因子及较小指数；最小公倍数 LCM 要装下双方所需的全部素因子，取较大指数。',
      ],
      rules: [
        {
          title: '因数成对找',
          text: '列 $n$ 的正因数时，从 1 检查到 $\\sqrt n$，每找到 $d$ 就配上 $n/d$；完全平方数的中间一对只记一次。',
        },
        {
          title: 'HCF 与 LCM',
          text: '例如 $a=2^3\\times3$、$b=2\\times3^2$，则 $\\operatorname{HCF}=2\\times3$，$\\operatorname{LCM}=2^3\\times3^2$。缺少的素因子视为指数 0。',
        },
        {
          title: '快速验算',
          text: '对两个正整数，$\\operatorname{HCF}(a,b)\\times\\operatorname{LCM}(a,b)=ab$；互素的两个数 HCF 为 1，但它们不一定都是素数。',
        },
      ],
      pitfalls: [
        '最小公倍数通常不是简单相乘；两数有共同因子时，相乘会多算。',
        '素数不是“所有奇数”；例如 21 是奇数，却等于 3 × 7。',
      ],
      sourceIds: ['number-spec', 'number-factors'],
      visual: 'maths-number',
      examFocus: {
        goal: '把整数拆成素因子；公因数取少，公倍数取足。',
        pastPaperSummary:
          '本次审阅的年度数学1题未发现直接考查素数判定、HCF或LCM的独立题。它们会辅助约分和计数，但不能把所有分数题都统计为素因数题；本节选已发布题库直接练习。',
        pastPaperPatterns: [],
        pastPaperNote: '暂无直接匹配年度题；以下是试题库题，不作为历年出题频率的证据。',
        examples: [
          {
            title: '三个数的最小公倍数：指数取足够大的',
            source: {
              kind: 'bank',
              subject: 'mathematics1',
              questionCode: 'ESAT-M1-MOCK-ADAPT-E05-001',
              why: '==LCM取各素因子最高指数；HCF只取共有素因子的最低指数。==',
            },
            question: '',
            answer: 'B',
            steps: [
              '$24=2^3\\times3$，$40=2^3\\times5$，$54=2\\times3^3$。',
              '公倍数要能被每个数整除，所以2至少取三次、3至少取三次、5至少取一次。',
              '最小公倍数为 $2^3\\times3^3\\times5=1080$。',
              '检查1080÷24=45、÷40=27、÷54=20，均为整数；少取任何一个需要的素因子都会失败。',
            ],
            takeaway: '==LCM取各素因子最高指数；HCF只取共有素因子的最低指数。==',
          },
        ],
        checklist: [
          '知道1不是素数，2是唯一偶素数。',
          '能进行唯一素因数分解。',
          '分清因数、倍数、HCF与LCM。',
        ],
      },
    },
    {
      code: '110204',
      title: '逆运算与运算顺序',
      summary: '先看整体结构，再按优先级算；分数线本身就是一层括号。',
      paragraphs: [
        '逆运算（inverse operation）可以撤销原操作：加 7 对应减 7，乘 4 对应除以 4。非零数 $a$ 的倒数是 $1/a$，因为它们的乘积为 1；减法与除法不能随意交换顺序。',
        '按“括号内 → 幂与根 → 乘除 → 加减”理解优先级。同级从左到右。分数横线把整个分子和整个分母分别分组，根号横线也限定了根号作用的范围。',
      ],
      rules: [
        {
          title: '同级有先后',
          text: '$18\\div3\\times2=(18\\div3)\\times2=12$，不是 $18\\div(3\\times2)$。',
        },
        {
          title: '约分的对象',
          text: '$\\frac{6\\times7}{6\\times5}=\\frac75$；但 $\\frac{6+7}{6}$ 不能把两个 6 划掉。先提成公因子的乘积，才能约分。',
        },
        {
          title: '括号保护负号',
          text: '$(-4)^2=16$，而 $-4^2=-(4^2)=-16$。平方与开平方互为逆操作时，还要留意正负号。',
        },
      ],
      pitfalls: [
        '口诀里的乘除是同一优先级，不是“所有乘法永远先于所有除法”。',
        '去括号时，括号前的减号必须作用于括号内整个表达式。',
      ],
      sourceIds: ['number-spec', 'number-operations'],
      visual: 'maths-number',
      examFocus: {
        goal: '先看整体结构，再按优先级算；分数线本身就是一层括号。',
        pastPaperSummary:
          '年度题通过嵌套分式、平方与根号、人数差值检验运算层级；最常见错误不是不会算，而是把括号或除号的作用范围读错。',
        pastPaperPatterns: [
          {
            form: '嵌套除法与倒数',
            description: '区分a÷(b÷c)与(a÷b)÷c；分母整体翻转后才能约分。',
            reference: '2020 NSAA、2023 NSAA',
            sourceCodes: ['ESAT-2020-MATHS1-009', 'NSAA_2023_S1-Q002'],
          },
          {
            form: '先算幂根，再算整体',
            description: '同类根式先合并，再处理平方或商；不能把分母中的差拆开逐项除。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q001', 'ENGAA_2017_S1-Q029'],
          },
          {
            form: '由剩余量倒推',
            description: '“没有通过”的人数要先从该组总数中扣除，逆运算的对象不能换组。',
            reference: '2018 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q01'],
          },
        ],
        examples: [
          {
            title: '分数线上下两块，先分别算完整',
            source: {
              kind: 'bank',
              subject: 'mathematics1',
              questionCode: 'ESAT-M1-MOCK-ADAPT-E10-013',
              why: '==分数线先分组；同级乘除从左到右，约分只约因子。==',
            },
            question: '',
            answer: 'C',
            steps: [
              '分数线将分子 $3+2^3$ 和分母 $\\sqrt{49}-5$ 各自作为一个整体。',
              '先做幂和根：$2^3=8$，$\\sqrt{49}=7$。',
              '分子为11，分母为2；最后做除法得 $11/2$。',
              '不能先把3与2相加再立方，也不能把−5放到整个分数外。',
            ],
            takeaway: '==分数线先分组；同级乘除从左到右，约分只约因子。==',
          },
        ],
        checklist: ['会区分−a²与(−a)²。', '会用倒数处理除以分数。', '只对乘积的共同因子约分。'],
      },
    },
    {
      code: '110205',
      title: '系统列举策略',
      summary: '先确定顺序与重复规则，再固定第一项逐行列举，不漏不重。',
      paragraphs: [
        '列举前先定义“一个结果”：是否区分顺序、是否允许重复、第一位是否可为零。按第一步分组，再在每组内列完第二步，可用表格或树状分支防止漏项。',
        '乘法计数原理不是随意把两个数字相乘：如果第一步有 $m$ 种选择，且每一种第一步之后都恰有 $n$ 种第二步选择，才可直接用 $mn$。各分支可选数量不同，就分别计数后相加；无需假设概率独立。',
      ],
      rules: [
        {
          title: '顺序是否重要',
          text: '选队长与副队长时，甲乙和乙甲不同；只选两人组成小组时，它们是同一个小组。',
        },
        {
          title: '重复是否允许',
          text: '用 4 个不同数字组成两位代码，允许重复时有 $4\\times4$ 种，不允许重复时有 $4\\times3$ 种；若是两位整数，还须排除首位为 0。',
        },
        {
          title: '分类后相加',
          text: '分类必须覆盖全部情况，并且类别互不重叠，否则会漏算或重复计算。',
        },
      ],
      pitfalls: [
        '首位为 0 的代码可能合法，但首位为 0 的“两位整数”不合法。',
        '不能见到两个位置就直接相乘；限制可能让不同分支有不同数量的选项。',
      ],
      sourceIds: ['number-spec', 'number-counting'],
      visual: 'maths-number',
      examFocus: {
        goal: '先确定顺序与重复规则，再固定第一项逐行列举，不漏不重。',
        pastPaperSummary:
          '相关年度题把列举放在骰子、转盘、容量配对和根式三角形中。每格应代表等可能的实际结果，数字相同的两个面不能合并成一个面。',
        pastPaperPatterns: [
          {
            form: '两阶段结果用网格逐格计数',
            description:
              '骰子或转盘重复出现同一数字，仍按每个面/扇区计数；先列完整结果，再筛满足和的格子。',
            reference: '2020 NSAA、2022 NSAA',
            sourceCodes: ['ESAT-2020-MATHS1-004', 'ESAT_LEGACY_2022_NSAA_Q004'],
          },
          {
            form: '组合先判是否区分顺序',
            description: '容器两两配容量，或从五个根式选三边，先排除重复组合，再检验目标条件。',
            reference: '2021 NSAA、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q012', 'ESAT_LEGACY_2022_NSAA_Q017'],
          },
          {
            form: '多步骤事件选更短的列举路线',
            description: '连续四次骰子求至少一个偶数，用反事件可避免列出所有正向情况。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-MATHS1-015'],
          },
        ],
        examples: [
          {
            title: '重复数字的骰子：两个6要算两个面',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q004',
              why: '==按实际选择列格子，再按条件筛；只有相同结果被重复列出时才去重。==',
            },
            question: '',
            answer: 'E',
            steps: [
              '两个骰子各有6个等可能的面，结果按“X的面，Y的面”排列，共36格。',
              '固定X：当X≤3，和不超过9；当X=4，只能配Y的两个6，得到2格。',
              '当X=5，可配Y的5及两个6，得到3格。因此有利格子共5个。',
              '概率为 $5/36$。Y的两个6数值相同，但对应不同的等可能面，不能去重。',
            ],
            takeaway: '==按实际选择列格子，再按条件筛；只有相同结果被重复列出时才去重。==',
          },
        ],
        checklist: [
          '先回答顺序重要吗、允许重复吗。',
          '能用表格或树固定顺序列举。',
          '乘法计数中的每步选择数应符合前一步限制。',
        ],
      },
    },
    {
      code: '110206',
      title: '平方、根、立方',
      summary: '根号取非负主值；平方方程考虑正负，长度再用情境筛选。',
      paragraphs: [
        '平方（square）是数乘自身，立方（cube）是三个相同因数相乘。$5^2=(-5)^2=25$，所以 25 的平方根有 5 和 −5；但符号 $\\sqrt{25}$ 专指非负的算术平方根，值为 5。',
        '求根可反问：“哪个数的几次方得到它？”因为 $(-3)^3=-27$，所以 $\\sqrt[3]{-27}=-3$。在实数范围，负数没有平方根，但任何实数都有且仅有一个实立方根。',
      ],
      rules: [
        {
          title: '根号值与解方程',
          text: '$\\sqrt a\\ge0$（$a\\ge0$）；$x^2=a$ 在 $a>0$ 时有 $x=\\pm\\sqrt a$，在 $a=0$ 时只有 $x=0$。',
        },
        {
          title: '平方再开根',
          text: '$\\sqrt{x^2}=|x|$，不是总等于 $x$。例如 $\\sqrt{(-7)^2}=7$。',
        },
        {
          title: '用邻近平方定位',
          text: '$7^2<55<8^2$ 推出 $7<\\sqrt{55}<8$，可帮助判断根式的数量级。',
        },
      ],
      pitfalls: [
        '不能写 $\\sqrt{81}=\\pm9$；“±”属于解方程的结果。',
        '根号一般不能拆加法：$\\sqrt{9+16}=5$，而 $\\sqrt9+\\sqrt{16}=7$。',
      ],
      sourceIds: ['number-spec', 'number-radicals'],
      visual: 'maths-number',
      examFocus: {
        goal: '根号取非负主值；平方方程考虑正负，长度再用情境筛选。',
        pastPaperSummary:
          '年度题常借助几何长度、比例与平方根计算，立方根还可能出现在反比关系和公式变形中。要区分“开根值”与“求方程全部解”。',
        pastPaperPatterns: [
          {
            form: '几何中的平方→开方',
            description:
              '用勾股或相似先求长度的平方，最后取正根；比例改变长度时，平方量须按平方比例变化。',
            reference: '2016 NSAA、2018 ENGAA、2021 NSAA、2022 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q017',
              'ESAT_LEGACY_2018_ENGAA_Q07',
              'ESAT_LEGACY_2018_ENGAA_Q23',
              'ESAT_LEGACY_2021_NSAA_Q017',
              'ESAT_LEGACY_2022_NSAA_Q002',
            ],
          },
          {
            form: '幂根与比例模型',
            description: '根式反比、温度平方与立方反比，均先隔离幂，再按正数情境开方或开立方。',
            reference: '2016 ENGAA、2018 NSAA、2020 NSAA、2022 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q013',
              'ESAT_LEGACY_2018_NSAA_Q05',
              'ESAT-2020-MATHS1-011',
              'ESAT_LEGACY_2022_NSAA_Q015',
            ],
          },
          {
            form: '平方判断和两个根',
            description: '平方整个带系数根式；平方方程出现两解时，计算正差不能只取主根。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q002', 'NSAA_2023_S1-Q015'],
          },
        ],
        examples: [
          {
            title: '长度缩半，平方量为什么缩成四分之一？',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q017',
              why: '==先平方保持分母也平方；开根后再按实际意义筛选符号。==',
            },
            question: '',
            answer: 'A',
            steps: [
              '小长方体的体对角线长为 $\\sqrt{77}/2$，其平方是 $77/4$，不是77/2。',
              '对小长方体用三维勾股：$2^2+3^2+x^2=77/4$。',
              '所以 $x^2=77/4-13=25/4$。',
              '方程的代数根有±5/2；x是边长，只能取 $5/2$ cm。',
            ],
            takeaway: '==先平方保持分母也平方；开根后再按实际意义筛选符号。==',
          },
        ],
        checklist: [
          '区分√a与x²=a。',
          '知道√(x²)=|x|。',
          '知道负数有实数立方根，但没有实数平方根。',
        ],
      },
    },
    {
      code: '110207',
      title: '数值指数律',
      summary: '先统一底数；乘法加指数，除法减指数，幂的幂乘指数。',
      paragraphs: [
        '$a^3a^2$ 是把 3 个 $a$ 与 2 个 $a$ 接在一起相乘，所以等于 $a^5$。同底数相除则约去公共因子。指数规律的本质是因子的个数和结构，不适用于把两个幂直接相加。',
        '对正底数 $a$，$a^{m/n}=(\\sqrt[n]{a})^m$（$n$ 为正整数），分母告诉你开几次根，分子告诉你取几次方；负指数再取倒数。先开根通常比先算大整数更省力。',
      ],
      rules: [
        {
          title: '运算表',
          text: '对 $a>0$，$a^ma^n=a^{m+n}$，$a^m/a^n=a^{m-n}$，$(a^m)^n=a^{mn}$。对 $a,b>0$，$(ab)^n=a^nb^n$，$(a/b)^n=a^n/b^n$。',
        },
        {
          title: '零次方与负指数',
          text: '$a^0=1$、$a^{-n}=1/a^n$ 都要求 $a\\ne0$。$0^0$ 不在这里定义，零的负次方无意义。',
        },
        {
          title: '负底数先判断定义域',
          text: '整数指数可用于负底数。分数指数先约成最简分数：奇数分母可按实数奇次根理解，如 $(-8)^{1/3}=-2$；偶数分母不对负数定义实数值。不要把正底数的全部变形规则无条件搬到负底数。',
        },
      ],
      pitfalls: [
        '$3^{-2}=\\frac19$，不是 $-9$，也不是 $-\\frac19$。',
        '$2^3+2^2=12$，不能用乘法指数律写成 $2^5$。',
      ],
      sourceIds: ['number-spec', 'number-indices', 'number-radicals'],
      visual: 'maths-number',
      examFocus: {
        goal: '先统一底数；乘法加指数，除法减指数，幂的幂乘指数。',
        pastPaperSummary:
          '2016、2017、2019、2023相关题反复把9、27、81或2、4、8混在一起；2021、2022还把负指数与分数指数放进代数式。核心始终是先认共同底数。',
        pastPaperPatterns: [
          {
            form: '换共同底数再合并',
            description:
              '把9、27、81改为3的幂，把4、8改为2的幂；先处理外层幂，再把乘除对应成指数加减。',
            reference: '2016 ENGAA、2017 ENGAA、2019 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q025',
              'ENGAA_2017_S1-Q013',
              'NSAA_2019_S1-Q009',
              'NSAA_2023_S1-Q007',
            ],
          },
          {
            form: '负指数与分数指数嵌套',
            description: '外层负幂影响括号内的所有因子，平方根指数与平方可以结合，但要遵守定义域。',
            reference: '2021 NSAA、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q001', 'ESAT_LEGACY_2022_NSAA_Q001'],
          },
        ],
        examples: [
          {
            title: '2、4、8看似三个底数，其实只有一个',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ENGAA_2017_S1-Q013',
              why: '==先换底，再合并指数；负指数是倒数，不是负号。==',
            },
            question: '',
            answer: 'D',
            steps: [
              '左边改写为 $2^{3+2x}\\times2^{2x}\\times2^{-3x}=2^{3+x}$。',
              '右边 $4\\sqrt2=2^2\\times2^{1/2}=2^{5/2}$。',
              '底数2相同且幂函数一一对应，所以 $3+x=5/2$，得 $x=-1/2$。',
              '负的x并不使整个幂为负；负指数表示倒数。',
            ],
            takeaway: '==先换底，再合并指数；负指数是倒数，不是负号。==',
          },
        ],
        checklist: [
          '会转换整数、分数与负指数。',
          '知道零次幂的底数不能为0。',
          '能说明指数律不能直接用于加法。',
        ],
      },
    },
    {
      code: '110208',
      title: '科学计数法',
      summary: '系数和10的幂分开算；加减先同指数，最后检查标准形式。',
      paragraphs: [
        '正数的标准形式（standard form）写成 $a\\times10^n$，其中 $1\\le a<10$、$n$ 为整数。大数通常对应正指数，小于 1 的正数对应负指数，例如 $0.00056=5.6\\times10^{-4}$。负数可把负号保留在整个标准形式前。',
        '乘除时把系数与 10 的幂分开处理，最后检查系数是否回到标准范围。加减时先把指数统一，否则是在把不同大小的“份”直接相加。比较正数时先比较指数，指数相同再比较系数。',
      ],
      rules: [
        {
          title: '乘除分两路',
          text: '$(a\\times10^m)(b\\times10^n)=ab\\times10^{m+n}$；除法把系数相除、指数相减，分母必须非零。',
        },
        {
          title: '加减先对齐',
          text: '$3.2\\times10^4+6\\times10^3=(3.2+0.6)\\times10^4$。',
        },
        {
          title: '结果要标准化',
          text: '$24\\times10^{-6}=2.4\\times10^{-5}$；系数除以 10，10 的指数就加 1，保持原值不变。',
        },
      ],
      pitfalls: [
        '负指数表示倒数，不表示这个数为负。',
        '只把小数点移走、却忘记同步调整指数，会改变原数。',
      ],
      sourceIds: ['number-spec', 'number-indices'],
      visual: 'maths-number',
      examFocus: {
        goal: '系数和10的幂分开算；加减先同指数，最后检查标准形式。',
        pastPaperSummary:
          '当前年度题中科学计数法既用于直接方程，也嵌入反比例计算。题目通常同时检查负指数、加法对齐、平方和正负两解。',
        pastPaperPatterns: [
          {
            form: '含加法和平方的科学计数方程',
            description: '分子先统一10的幂，处理分母负指数，再对整体平方；两解的正差需要保留±。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q015'],
          },
          {
            form: '很小的数进入比例关系',
            description: '把2×10⁻²连同系数一起平方，再利用正数条件恢复目标量。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q010'],
          },
        ],
        examples: [
          {
            title: '先对齐指数，再看两个解的距离',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'NSAA_2023_S1-Q015',
              why: '==加法先对齐，乘除分两路，平方别漏掉系数。==',
            },
            question: '',
            answer: 'B',
            steps: [
              '分子 $a\\times10^4+2a\\times10^3=1.2a\\times10^4$。',
              '除以 $3\\times10^{-1}$ 得 $4a\\times10^4$；平方为 $16a^2\\times10^8$。',
              '与 $8\\times10^9$ 相等，得 $a^2=5$，两解为±√5。',
              '正差为 $\\sqrt5-(-\\sqrt5)=2\\sqrt5$；不是只答√5。',
            ],
            takeaway: '==加法先对齐，乘除分两路，平方别漏掉系数。==',
          },
        ],
        checklist: [
          '标准形式系数满足1≤a<10。',
          '能处理10的负指数和乘方。',
          '加减时不会直接相加指数。',
        ],
      },
    },
    {
      code: '110209',
      title: '小数、百分数与分数转换',
      summary: '有限小数用位值；循环小数用错位相减，把“永远重复”变成整数关系。',
      paragraphs: [
        '百分数（percentage）表示每一百份：$p\\%=p/100$。有限小数可按位值写成分母为 10 的幂的分数再约分，例如 $0.045=45/1000=9/200=4.5\\%$。分数转小数就是分子除以分母。',
        '循环小数（recurring decimal）的横线只标循环部分：$0.1\\overline6=0.1666\\ldots$。设它等于 $x$，乘合适的 10 的幂，让两个式子的小数尾部完全对齐，相减即可消去无限重复部分。',
      ],
      rules: [
        {
          title: '转换不改变值',
          text: '$\\frac18=0.125=12.5\\%$；从小数到百分数，将数值乘 100 并加上百分号。',
        },
        {
          title: '纯循环与混循环',
          text: '$0.\\overline{27}$ 可用 $100x-x$；$0.1\\overline6$ 要用 $100x-10x$。关键是小数部分相同，不能只按小数位数机械添 9。',
        },
        {
          title: '何时能写成有限小数',
          text: '最简分数的正分母只含素因子 2 与 5 时，小数会终止；否则小数会循环。先约分后判断，例如 $3/6=1/2$ 会终止。',
        },
      ],
      pitfalls: [
        '$0.\\overline{27}$ 和 $0.2\\overline7$ 不同；循环横线覆盖的数字必须读准。',
        '$0.5\\%=0.005$，不是 $0.5$。',
      ],
      sourceIds: ['number-spec', 'number-decimal-fractions', 'number-percent', 'number-guide'],
      visual: 'maths-number',
      examFocus: {
        goal: '有限小数用位值；循环小数用错位相减，把“永远重复”变成整数关系。',
        pastPaperSummary:
          '年度题中百分数与分数通常直接混用，尤其是比例和概率情境。本次样本未发现直接把循环小数化分数的年度题，该细项用题库题补足。',
        pastPaperPatterns: [
          {
            form: '百分数与分数放进同一等式',
            description: '80%与2/3相等的数量关系须先统一成分数；百分比变化也应先改写成倍率。',
            reference: '2018 NSAA、2018 ENGAA、2023 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q12',
              'ESAT_LEGACY_2018_ENGAA_Q17',
              'NSAA_2023_S1-Q009',
            ],
          },
          {
            form: '小数概率回到精确分数',
            description: '把0.2视为1/5再写条件概率，避免不必要的小数近似。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q020'],
          },
        ],
        pastPaperNote: '下面的循环小数例题为试题库题；年度考法归纳只涵盖上述实际出现的转换情境。',
        examples: [
          {
            title: '循环三位，为什么分母是999？',
            source: {
              kind: 'bank',
              subject: 'mathematics1',
              questionCode: 'ESAT-M1-MOCK-ADAPT-E02-010',
              why: '==移动一整个循环节，减去原式消掉无限尾巴，再约分。==',
            },
            question: '',
            answer: 'E',
            steps: [
              '设 $x=0.237237\\ldots$。循环节有三位，乘1000使重复尾巴对齐。',
              '$1000x=237.237237\\ldots$；相减得 $999x=237$。',
              '$x=237/999=79/333$。分母999来自1000−1，不来自“小数有三位”。',
              '有限小数0.237应写237/1000；是否循环必须读清题目。',
            ],
            takeaway: '==移动一整个循环节，减去原式消掉无限尾巴，再约分。==',
          },
        ],
        checklist: [
          '会在有限小数、分数、百分数间转换。',
          '会处理纯循环和混循环小数。',
          '知道0.3与0.333…不是同一个数。',
        ],
      },
    },
    {
      code: '110210',
      title: '分数小数百分数计算',
      summary: '选择最省力的等值形式；每次求“几分之几”先圈出它的整体。',
      paragraphs: [
        '等值分数（equivalent fractions）的分子与分母同乘或同除一个非零数，大小不变。计算前换一种写法常能大幅简化：$12.5\\%=1/8$，$0.75=3/4$，先约分比长除法更方便。',
        '“某量的 $p\\%$”是这个量乘 $p/100$。连续两次取比例时，第二次可能以剩余量为基准；只有百分比对应同一基数时才可直接相加。先写出基准量，再写运算。',
      ],
      rules: [
        {
          title: '常用等值形式',
          text: '$\\frac14=0.25=25\\%$；$\\frac25=0.4=40\\%$；$\\frac58=0.625=62.5\\%$。记住几组，再由倍数拆分。',
        },
        {
          title: '用倍数求部分',
          text: '$p\\%$ of $N=N\\times p/100$；如果已知部分 $A$ 是总量的 $p\\%$，则总量为 $A\\div(p/100)$（$p\\ne0$）。',
        },
        {
          title: '先保留精确形式',
          text: '$\\frac13\\times60=20$。若先把 $1/3$ 约为 0.33，就会得到错误的精确结果 19.8。',
        },
      ],
      pitfalls: [
        '连续“用去 10%”与“用去剩余的 10%”不能合成用去原量的 20%。',
        '百分数超过 100% 合法，表示超过一整份；例如 150% 表示 1.5 倍。',
      ],
      sourceIds: ['number-spec', 'number-fractions', 'number-percent'],
      visual: 'maths-number',
      examFocus: {
        goal: '选择最省力的等值形式；每次求“几分之几”先圈出它的整体。',
        pastPaperSummary:
          '年度题不仅计算百分比，还用真假命题检验乘法结构；连续变化、剩余量、条件概率的共同难点是每一步基准量可能不同。',
        pastPaperPatterns: [
          {
            form: '等值形式与交换结构',
            description: '分数除法改乘倒数；a% of b与b% of a都等于ab/100。',
            reference: '2023 NSAA、2018 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q002', 'ESAT_LEGACY_2018_NSAA_Q12'],
          },
          {
            form: '先后变化不能相加抵消',
            description:
              '降价、加价、折扣反推和连续增长均要逐次乘倍率；百分数所对应的整体随步骤改变。',
            reference:
              '2016 ENGAA、2018 ENGAA、2019 NSAA、2020 NSAA、2021 NSAA、2022 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q009',
              'ESAT_LEGACY_2018_ENGAA_Q17',
              'NSAA_2019_S1-Q004',
              'ESAT-2020-MATHS1-006',
              'ESAT-2020-MATHS1-014',
              'ESAT_LEGACY_2021_NSAA_Q007',
              'ESAT_LEGACY_2022_NSAA_Q005',
              'NSAA_2023_S1-Q009',
            ],
          },
          {
            form: '分组部分与总部分',
            description: '不同组内的比例先乘各组权重，再相加；不能直接平均两个百分数。',
            reference: '2016 NSAA、2016 ENGAA、2019 NSAA、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q015',
              'ENGAA_2016_S1-Q023',
              'NSAA_2019_S1-Q015',
              'NSAA_2023_S1-Q020',
            ],
          },
        ],
        examples: [
          {
            title: '不急着算大数，先检查式子的结构',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'NSAA_2023_S1-Q002',
              why: '==能比较结构就不做长算；转换形式必须保持数值和基准量不变。==',
            },
            question: '',
            answer: 'E',
            steps: [
              '第1句两边都化成 $47\\times71/(93\\times33)$，只是乘法次序不同，所以正确。',
              '第2句两边都等于 $53\\times84/100$，所以正确；百分数交换的是两个乘数。',
              '第3句左边是 $4\\times3=12$，右边是 $9\\times2=18$，所以错误。',
              '结论只有1和2正确。先化结构，比把每个分数算成小数更快且精确。',
            ],
            takeaway: '==能比较结构就不做长算；转换形式必须保持数值和基准量不变。==',
          },
        ],
        checklist: [
          '会约分而不改变值。',
          '每次计算剩余部分前明确新整体。',
          '可以解释a% of b为何等于b% of a。',
        ],
      },
    },
    {
      code: '110211',
      title: '分数、根式与π的精确计算',
      summary: '提取平方因子、保留精确形式；分母含根式时用共轭把它变成有理数。',
      paragraphs: [
        '精确值（exact value）不丢失信息；$\\sqrt2$ 和 $\\pi$ 是精确符号，而 1.414 和 3.14 是近似值。根式化简先找完全平方因子：$\\sqrt{75}=\\sqrt{25\\times3}=5\\sqrt3$。',
        '有理化（rationalising the denominator）是在分子、分母同乘一个非零量，保持原值却让分母不含根式。单项根式乘同一个根式；两项和差乘共轭（conjugate），利用平方差消去根式。',
      ],
      rules: [
        {
          title: '根式计算条件',
          text: '$\\sqrt{ab}=\\sqrt a\\sqrt b$（$a,b\\ge0$），$\\sqrt{a/b}=\\sqrt a/\\sqrt b$（$a\\ge0,b>0$）。只合并同类根式，如 $2\\sqrt3+5\\sqrt3=7\\sqrt3$。',
        },
        {
          title: '两类有理化',
          text: '$\\frac3{\\sqrt5}=\\frac{3\\sqrt5}{5}$；$\\frac1{2+\\sqrt3}=\\frac{2-\\sqrt3}{4-3}=2-\\sqrt3$。共轭只是改变两项之间的符号，分子也必须同步相乘。',
        },
        {
          title: 'π 也可约分',
          text: '$\\frac{15\\pi}{6\\pi}=\\frac52$；$\\pi\\ne3.14$，题目要求精确值时保留 $\\pi$。',
        },
      ],
      pitfalls: [
        '$\\sqrt{a+b}$ 通常不等于 $\\sqrt a+\\sqrt b$。',
        '有理化只改变写法，不改变数值；乘完后检查分母正负与是否还可约分。',
      ],
      sourceIds: ['number-spec', 'number-radicals'],
      visual: 'maths-number',
      examFocus: {
        goal: '提取平方因子、保留精确形式；分母含根式时用共轭把它变成有理数。',
        pastPaperSummary:
          '年度真题既直接考根式展开、同类合并和有理化，也把根式与π放入图形、三角函数及两根组合中；提前近似通常只会增加工作量。',
        pastPaperPatterns: [
          {
            form: '平方展开与同类合并',
            description: '(a±b)²有交叉项；成对的平方相减时先用结构抵消，避免逐项长算。',
            reference: '2016 ENGAA、2017 ENGAA、2019 NSAA',
            sourceCodes: ['ENGAA_2016_S1-Q003', 'ENGAA_2017_S1-Q001', 'NSAA_2019_S1-Q001'],
          },
          {
            form: '有理化与根式混合运算',
            description: '根式分母用共轭，三角精确值代入后仍按根式运算，不先取小数。',
            reference: '2017 ENGAA、2021 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2017_S1-Q029',
              'ESAT_LEGACY_2021_NSAA_Q013',
              'NSAA_2023_S1-Q008',
              'NSAA_2023_S1-Q010',
              'NSAA_2023_S1-Q013',
            ],
          },
          {
            form: '几何中的π与根式精确结果',
            description: '半径、体积、面积或周长应保留π与根式；能约去共同π时，没必要使用3.14。',
            reference:
              '2016 ENGAA、2017 ENGAA、2017 NSAA、2018 ENGAA、2020 NSAA、2022 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q019',
              'ENGAA_2017_S1-Q025',
              'ENGAA_2017_S1-Q027',
              'NSAA_2017_S1-Q018',
              'ESAT_LEGACY_2018_ENGAA_Q03',
              'ESAT_LEGACY_2018_ENGAA_Q07',
              'ESAT_LEGACY_2018_ENGAA_Q13',
              'ESAT-2020-MATHS1-003',
              'ESAT-2020-MATHS1-008',
              'ESAT-2020-MATHS1-017',
              'ESAT-2020-MATHS1-019',
              'ESAT_LEGACY_2022_NSAA_Q013',
              'NSAA_2023_S1-Q001',
            ],
          },
        ],
        examples: [
          {
            title: '根式平方：中间的两倍积不能消失',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ENGAA_2016_S1-Q003',
              why: '==平方和不等于和的平方；根式能精确算，就不提前近似。==',
            },
            question: '',
            answer: 'B',
            steps: [
              '把 $(\\sqrt3-\\sqrt2)^2$ 看成 $(a-b)^2=a^2-2ab+b^2$。',
              '两端分别是3和2，交叉项为 $-2\\sqrt3\\sqrt2=-2\\sqrt6$。',
              '合并得 $5-2\\sqrt6$，与选项B等值。',
              '快速检验：√3与√2很接近，其差平方应是小正数；5−2√6符合，5+2√6明显不合。',
            ],
            takeaway: '==平方和不等于和的平方；根式能精确算，就不提前近似。==',
          },
          {
            title: '分母有根式：先用共轭把结构变简单',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ENGAA_2017_S1-Q029',
              why: '==共轭把差变成平方差；整体的负号要分配到每一项。==',
            },
            question: '',
            answer: 'E',
            steps: [
              '先把原分式写成 $(3+\\sqrt3)/(2(3-\\sqrt3))$，上下同乘 $3+\\sqrt3$。',
              '分母变为 $2(9-3)=12$，分子为 $12+6\\sqrt3$，所以原分式等于 $1+\\sqrt3/2$。',
              '平方得到 $7/4+\\sqrt3$；再用1减去它，得 $-3/4-\\sqrt3$。',
              '有理化时只乘分母会改变原值；最后的1减整个平方结果，负号要作用到全部项。',
            ],
            takeaway: '==共轭把差变成平方差；整体的负号要分配到每一项。==',
          },
        ],
        checklist: [
          '能提取平方因子并合并同类根式。',
          '会对一个或两个根式项的分母有理化。',
          '在精确题中保留π、分数与根式。',
        ],
      },
    },
    {
      code: '110212',
      title: '上下界',
      summary: '先写每个量的区间，再用表达式的增减关系选端点。',
      paragraphs: [
        '显示的测量值通常不是精确真值。例如正长度按最近的 1 cm 四舍五入显示 12 cm，真值满足 $11.5\\le L<12.5$。下界（lower bound）与上界（upper bound）描述可能范围；上界可能只能趋近，不能真正取到。',
        '求式子的范围，先判断它随每个量增大而增大还是减小。正数相乘时都取大得到上界；正数相除时，分子取大且分母取小才得到上界。若变量可能为负，需重新检查符号与端点，不能照搬正数口诀。',
      ],
      rules: [
        {
          title: '加减看方向',
          text: '若 $a_L\\le a\\le a_U$、$b_L\\le b\\le b_U$，则和在 $[a_L+b_L,a_U+b_U]$ 内，差在 $[a_L-b_U,a_U-b_L]$ 内。实际端点是否可取还须看原区间。',
        },
        {
          title: '正数乘除',
          text: '当 $a_L,b_L>0$，乘积边界为 $a_Lb_L$ 与 $a_Ub_U$；商的边界为 $a_L/b_U$ 与 $a_U/b_L$。分母区间含 0 时不能直接这样除。',
        },
        {
          title: '端点与可达到性',
          text: '计算出边界后，回看取到该边界需要的原变量端点是否都允许；若有一个必要端点被排除，就用严格不等号。',
        },
      ],
      pitfalls: [
        '商的上界不是“上界 ÷ 上界”；分母越小，正数商越大。',
        '上界不一定是最大值。若上端点取不到，就不存在那个端点对应的最大值。',
      ],
      sourceIds: ['number-spec', 'number-guide'],
      visual: 'maths-number',
      examFocus: {
        goal: '先写每个量的区间，再用表达式的增减关系选端点。',
        pastPaperSummary:
          '当前年度数学1样本未发现以测量误差上下界为直接目标的题目。不能把普通取值范围或不等式题当作测量误差题；此处以题库中的实测长宽练习。',
        pastPaperPatterns: [],
        pastPaperNote:
          '暂无直接匹配年度题；本节例题和自测均为题库题。上界与可达到的最大值需要区别。',
        examples: [
          {
            title: '矩形面积的上界：两个长度都往上取',
            source: {
              kind: 'bank',
              subject: 'mathematics1',
              questionCode: 'ESAT-M1-DIRECT-018-LR3',
              why: '==先列区间，再按单调性挑端点；上界不一定是能取到的最大值。==',
            },
            question: '',
            answer: 'C',
            steps: [
              '精确到0.1 cm意味着半个单位为0.05：$7.35\\le L<7.45$，$2.55\\le W<2.65$。',
              '长度和宽度均为正，面积LW随两者增加而增大，上界取 $7.45\\times2.65=19.7425$。',
              '按题目要求保留3位有效数字，边界结果为 $19.7\\,\\mathrm{cm^2}$，对应C。',
              '严格说面积只能无限接近19.7425而不能达到；题干“greatest possible”在这里按上界计算后取近似，不能把不含端点误写成可取等号。',
            ],
            takeaway: '==先列区间，再按单调性挑端点；上界不一定是能取到的最大值。==',
          },
        ],
        checklist: [
          '能写出测量值的半单位区间。',
          '正数除法上界用分子上界÷分母下界。',
          '能区分上界、最大值和四舍五入后的值。',
        ],
      },
    },
    {
      code: '110213',
      title: '取近似与误差区间',
      summary: '先定位要保留的最后一位；舍入用半格，截断用整格。',
      paragraphs: [
        '小数位（decimal places, d.p.）从小数点后第一位开始数；有效数字（significant figures, s.f.）从第一个非零数字开始数。$0.004786$ 保留 2 位有效数字是 $0.0048$，保留 2 位小数则是 $0.00$。',
        '误差区间（error interval）是所有会产生同一记录值的真值范围。正数按最近单位 $u>0$、恰好一半向上舍入，记录为正数 $r$ 时：$r-u/2\\le x<r+u/2$。若舍入结果为 0，或题目另给范围限制，还须与原数的允许范围取交集。这里采用通常的四舍五入；若题目明确规定其他中点规则，端点归属随之改变。',
      ],
      rules: [
        {
          title: '先找到舍入单位',
          text: '保留 1 位小数时 $u=0.1$，半单位是 0.05；保留到最近的 100 时 $u=100$，半单位是 50。',
        },
        {
          title: '截断不等于四舍五入',
          text: '正数截断（truncation）到 1 位小数显示 2.4，范围是 $2.4\\le x<2.5$；若对负数按向零截断，显示 −2.4 的范围是 $-2.5<x\\le-2.4$。',
        },
        {
          title: '保留精度的写法',
          text: '$9.96$ 保留 2 位有效数字写成 $1.0\\times10^1$，明确两个有效数字。中间步骤尽量不舍入，避免连续舍入改变最终结果。',
        },
      ],
      pitfalls: [
        '误差区间的宽度等于一个舍入单位，不是两倍舍入单位。',
        '不能把所有“保留几位”都当作小数位；有效数字前面的占位零不计数。',
      ],
      visual: 'maths-number',
      sourceIds: ['number-spec', 'number-decimals', 'number-guide'],
      examFocus: {
        goal: '先定位要保留的最后一位；舍入用半格，截断用整格。',
        pastPaperSummary:
          '本次年度样本未发现直接要求有效数字舍入或测量误差区间的题目；用题库的长度记录与全年总量练习，不把相关估算题当成同一种考法。',
        pastPaperPatterns: [],
        pastPaperNote:
          '暂无直接匹配年度题。例题包含“误差区间→倒数→有效数字”三步，自测考最终总量舍入。',
        examples: [
          {
            title: '先求真实长度范围，再决定倒数该取哪边',
            source: {
              kind: 'bank',
              subject: 'mathematics1',
              questionCode: 'ESAT-M1-DIRECT-014-LR3',
              why: '==先处理区间，再做运算，最后一次舍入；有效数字从首个非零位开始数。==',
            },
            question: '',
            answer: 'D',
            steps: [
              '记录4.8 cm、精确到0.1 cm，所以 $4.75\\le L<4.85$。',
              '在正数范围内1/L随L增大而减小，因此最大值用最小长度4.75。',
              '$1/4.75=4/19=0.210526\\ldots$。保留3位有效数字得到0.211。',
              '0.210的三个有效数字是2、1、0；下一位5要求进位，不能只保留三位小数就停止。',
            ],
            takeaway: '==先处理区间，再做运算，最后一次舍入；有效数字从首个非零位开始数。==',
          },
        ],
        checklist: [
          '分清小数位数和有效数字。',
          '能表达四舍五入与向零截断的误差区间。',
          '中间步骤不提前舍入。',
        ],
      },
    },
    {
      code: '110214',
      title: '估算',
      summary: '估算先定数量级；若答案是范围，就用能保证方向的界限。',
      paragraphs: [
        '估算（estimation）是有目的地简化：为了判断数量级，可把数取成 1 位有效数字或容易约分的邻近数。例如 $\\frac{39.8\\times0.51}{1.98}\\approx\\frac{40\\times0.5}{2}=10$。用 $\\approx$ 表示近似，不要写成精确相等。',
        '若要判断一定大于还是小于某值，就必须追踪近似方向。正数乘积的两个因子都调大，结果调大；正数商的分子调大、分母调小，结果调大。一个因子调大、另一个调小，误差可能抵消，也可能不抵消，不能直接宣布上下界。',
      ],
      rules: [
        {
          title: 'π 与根式的近似',
          text: '粗估时可取 $\\pi\\approx3.14$ 或更粗的 3；根式可用邻近平方夹住，如 $1.4^2<2<1.5^2$，所以 $1.4<\\sqrt2<1.5$。近似精度应服务于题目需求。',
        },
        {
          title: '用界限排除选项',
          text: '若 $4<\\sqrt{20}<5$，则 $\\frac15<\\frac1{\\sqrt{20}}<\\frac14$；取正数倒数后大小方向反转。',
        },
        {
          title: '判断后再细化',
          text: '先用粗估排除数量级明显不对的答案；若剩余选项很接近，再保留更多数字或做精确计算。',
        },
      ],
      pitfalls: [
        '估算答案不代表精确答案，也不自动代表上界或下界。',
        '若答案选项很接近，粗略取 π 为 3 可能不足以区分选项。',
      ],
      sourceIds: ['number-spec', 'number-guide', 'number-arithmetic'],
      visual: 'maths-number',
      examFocus: {
        goal: '估算先定数量级；若答案是范围，就用能保证方向的界限。',
        pastPaperSummary:
          '当前年度题最直接的估算形式，是给几何条件后判断根式长度落在哪两个整数之间。其余精确根式题也可用估算排除错误选项，但这只是验算策略，不是题目原本的独立考点。',
        pastPaperPatterns: [
          {
            form: '不求小数，只判断所在区间',
            description: '由面积及高底关系求长度平方，再用相邻整数的平方夹住目标长度。',
            reference: '2018 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q23'],
          },
          {
            form: '估算辅助精确结果验算',
            description:
              '平方差、共轭根式、含根式面积等最终仍须精确答案；估算只检查正负和量级，不能替代证明。',
            reference: '2016 ENGAA、2017 ENGAA、2019 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q003',
              'ENGAA_2017_S1-Q001',
              'NSAA_2019_S1-Q001',
              'NSAA_2023_S1-Q010',
            ],
          },
        ],
        pastPaperNote: '自测借助平方夹逼确定素数候选范围，属于估算方法的关联迁移。',
        examples: [
          {
            title: '已经知道s²=53，还需要算√53的小数吗？',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ESAT_LEGACY_2018_ENGAA_Q23',
              why: '==问区间就比平方；问近似才舍入，精确值仍要保留。==',
            },
            question: '',
            answer: 'C',
            steps: [
              '高h比底b长3，面积14给出 $b(b+3)/2=14$，即 $(b+7)(b-4)=0$。',
              '取正的底边b=4，高h=7；等腰三角形的高平分底边，每半底长2。',
              '斜边 $s^2=7^2+2^2=53$。',
              '由于 $49<53<64$，所以 $7<s<8$，直接选C；根本不需要计算√53的小数。',
            ],
            takeaway: '==问区间就比平方；问近似才舍入，精确值仍要保留。==',
          },
        ],
        checklist: [
          '能用相邻平方数估计根式。',
          '知道π≈3只适合粗估，选项接近时要细化。',
          '能区别粗略估算与有保证方向的上下界。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'number-spec',
      title: 'UAT-UK · ESAT Content Specification（2026/2027）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '官方知识范围与术语参考；中文讲解为教学整理，例题和自测来自现有年度诊断题或独立试题库。',
    },
    {
      id: 'number-guide',
      title: 'UAT-UK · ESAT Guide: Mathematics 1',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/30103534/ESAT_Guide_Mathematics_1.pdf',
      note: '官方备考入口提供的 Mathematics 1 指南；可进一步阅读 Number 章节。',
    },
    {
      id: 'number-decimals',
      title: 'OpenStax · Prealgebra 2e: Decimals',
      url: 'https://openstax.org/books/prealgebra-2e/pages/5-1-decimals',
      note: '位值、比较与舍入的基础参考。',
    },
    {
      id: 'number-arithmetic',
      title: 'OpenStax · Prealgebra 2e: Decimal Operations',
      url: 'https://openstax.org/books/prealgebra-2e/pages/5-2-decimal-operations',
      note: '小数四则与计算结果检查。',
    },
    {
      id: 'number-fractions',
      title: 'OpenStax · Prealgebra 2e: Visualize Fractions',
      url: 'https://openstax.org/books/prealgebra-2e/pages/4-1-visualize-fractions',
      note: '分数意义、带分数和等值形式。',
    },
    {
      id: 'number-factors',
      title: 'OpenStax · Prealgebra 2e: Find Multiples and Factors',
      url: 'https://openstax.org/books/prealgebra-2e/pages/2-4-find-multiples-and-factors',
      note: '素数、因数、倍数的定义与分解思路。',
    },
    {
      id: 'number-operations',
      title: 'OpenStax · Prealgebra 2e: Use the Language of Algebra',
      url: 'https://openstax.org/books/prealgebra-2e/pages/2-1-use-the-language-of-algebra',
      note: '运算优先级及同级运算从左到右。',
    },
    {
      id: 'number-counting',
      title: 'OpenStax · Contemporary Mathematics: The Multiplication Rule for Counting',
      url: 'https://openstax.org/books/contemporary-mathematics/pages/7-1-the-multiplication-rule-for-counting',
      note: '分步选择与乘法计数原理。',
    },
    {
      id: 'number-indices',
      title: 'OpenStax · Algebra and Trigonometry 2e: Exponents and Scientific Notation',
      url: 'https://openstax.org/books/algebra-and-trigonometry-2e/pages/1-2-exponents-and-scientific-notation',
      note: '整数指数、负指数与科学计数法。',
    },
    {
      id: 'number-radicals',
      title: 'OpenStax · College Algebra 2e: Radicals and Rational Exponents',
      url: 'https://openstax.org/books/college-algebra-2e/pages/1-3-radicals-and-rational-exponents',
      note: '实数根式、分数指数与共轭有理化。',
    },
    {
      id: 'number-decimal-fractions',
      title: 'OpenStax · Prealgebra 2e: Decimals and Fractions',
      url: 'https://openstax.org/books/prealgebra-2e/pages/5-3-decimals-and-fractions',
      note: '小数与分数之间的转换。',
    },
    {
      id: 'number-percent',
      title: 'OpenStax · Prealgebra 2e: Understand Percent',
      url: 'https://openstax.org/books/prealgebra-2e/pages/6-1-understand-percent',
      note: '百分数的含义及与小数、分数的联系。',
    },
  ],
}
