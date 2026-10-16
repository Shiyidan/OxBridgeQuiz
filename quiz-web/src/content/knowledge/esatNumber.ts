// 试题库 ESAT 数章节讲解：按当前考纲逐点提供原创解释、例题与即时自测。
import type { KnowledgeLesson } from './types'

export const esatNumber: KnowledgeLesson = {
  code: '110200',
  title: 'Number · 数',
  subtitle: '从看懂一个数，到算得准、判断得快',
  intro:
    '覆盖当前 Mathematics 1「数」的 14 个知识点。先理解数字背后的数量关系，再用分数、指数和根式把计算变简单；最后用上下界与估算检查答案。本页讲解、例题与自测均为原创，考纲范围对照 UAT-UK 官方资料。',
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
      summary: 'Order numbers and inequality symbols：把不同写法的数放回同一条数轴，越向右越大。',
      paragraphs: [
        String.raw`数轴上的位置决定大小。负数的绝对值越大，位置越靠左，例如 $-8<-3$；绝对值表示到零的距离，不表示这个数本身更大。`,
        String.raw`比较分数、小数和整数时，可先统一成小数或同分母分数。分母为正时，也可交叉相乘比较：$\frac{a}{b}<\frac{c}{d}$ 等价于 $ad<bc$（$b,d>0$）。不要用过早舍入的小数比较接近的数。`,
      ],
      rules: [
        {
          title: '符号要读完整',
          text: String.raw`$=$ 表示相等，$\ne$ 表示不等；$<$、$>$ 不包含相等，$\le$、$\ge$ 包含相等。“至少 3”写成 $x\ge3$，“小于 3”写成 $x<3$。`,
        },
        {
          title: '负号与方向',
          text: String.raw`两边加减同一个数，大小关系不变；同乘或同除一个负数，不等号反向，例如 $2<5$ 推出 $-2>-5$。`,
        },
        {
          title: '小数补零不改值',
          text: String.raw`$0.6=0.60$，按相同位值逐位比较，不能仅按小数位数判断大小。`,
        },
      ],
      example: {
        question: String.raw`将 $-\frac{7}{8}$、$-0.82$、$\frac{1}{5}$、$0.18$ 从小到大排列。`,
        steps: [
          String.raw`统一形式：$-\frac{7}{8}=-0.875$，$\frac15=0.2$。`,
          String.raw`负数先排：$-0.875<-0.82$；正数再排：$0.18<0.2$。`,
          '把各组放回数轴，所有负数都在这两个正数左边。',
        ],
        answer: String.raw`$-\frac78<-0.82<0.18<\frac15$。`,
      },
      pitfalls: [
        '负数排序不能只比较去掉负号后的数字。',
        String.raw`$\frac13$ 与 $0.333$ 并不相等，前者还带着无限循环的尾数。`,
      ],
      check: {
        question: String.raw`下列哪个数最大？`,
        options: [String.raw`$-\frac35$`, '$-0.58$', String.raw`$-\frac7{12}$`, '$-0.61$'],
        answerIndex: 1,
        explanation: String.raw`$-\frac35=-0.6$，$-\frac7{12}=-0.58333\ldots$，所以 $-0.58$ 最靠右。`,
      },
      visual: 'number-line',
      sourceIds: ['number-spec', 'number-decimals', 'number-fractions'],
    },
    {
      code: '110202',
      title: '四则运算与位值',
      summary: 'Four operations and place value：先看每个数字占什么位置，再处理符号和分母。',
      paragraphs: [
        String.raw`十进制相邻数位相差 10 倍。例如 $30.407=3\times10+4\times\frac1{10}+7\times\frac1{1000}$；这里的 0 占住百分位，不能删掉。乘 10 是每一位的值变为原来的 10 倍。`,
        String.raw`加减小数时对齐小数点；乘小数可先当整数相乘，再按原来的总小数位数还原。除以小数时，将被除数、除数同时乘同一个 10 的幂，把除数变为整数。负带分数 $-1\frac12$ 表示 $-(1+\frac12)$。`,
      ],
      rules: [
        {
          title: '符号规则',
          text: String.raw`减去负数等于加上对应正数。乘除同号得正、异号得负；零不能作除数。`,
        },
        {
          title: '分数四则',
          text: String.raw`加减先通分；乘法分子相乘、分母相乘；除以非零分数等于乘其倒数。带分数先化成假分数，例如 $2\frac13=\frac73$。`,
        },
        {
          title: '先估后算',
          text: String.raw`$0.48\div0.06$ 是“0.48 中有几个 0.06”，应得到 8；不能看到小数就猜结果也小于 1。`,
        },
      ],
      example: {
        question: String.raw`计算 $-1\frac12+0.75\div(-0.3)$。`,
        steps: [
          String.raw`先除法：$0.75\div(-0.3)=75\div(-30)=-2.5$。`,
          String.raw`负带分数转小数：$-1\frac12=-1.5$。`,
          String.raw`同为负数，相加后离零更远：$-1.5+(-2.5)=-4$。`,
        ],
        answer: '$-4$。',
      },
      pitfalls: [
        String.raw`$\frac12+\frac13$ 不是 $\frac25$；分母表示分成多大的份，必须先统一。`,
        '除法中只把除数扩大、没有同步扩大被除数，会改变答案。',
      ],
      check: {
        question: String.raw`$0.036\div0.12$ 的值是？`,
        options: ['$0.003$', '$0.03$', '$0.3$', '$3$'],
        answerIndex: 2,
        explanation: String.raw`同时乘 100：$3.6\div12=0.3$；验算 $0.12\times0.3=0.036$。`,
      },
      sourceIds: ['number-spec', 'number-arithmetic', 'number-fractions'],
    },
    {
      code: '110203',
      title: '素数、因数与倍数',
      summary:
        'Primes, factors and multiples：把整数拆成素数积，找“共同拥有”和“合起来需要”的因子。',
      paragraphs: [
        String.raw`正整数 $a$ 能整除 $b$ 时，$a$ 是 $b$ 的因数（factor / divisor），$b$ 是 $a$ 的倍数（multiple）。素数（prime）是大于 1、只有 1 和自身两个正因数的整数；1 不是素数，2 是唯一的偶素数。`,
        String.raw`大于 1 的整数都能分解成素数的乘积；除排列顺序外，分解唯一。最大公因数 HCF 取双方共有的素因子及较小指数；最小公倍数 LCM 要装下双方所需的全部素因子，取较大指数。`,
      ],
      rules: [
        {
          title: '因数成对找',
          text: String.raw`列 $n$ 的正因数时，从 1 检查到 $\sqrt n$，每找到 $d$ 就配上 $n/d$；完全平方数的中间一对只记一次。`,
        },
        {
          title: 'HCF 与 LCM',
          text: String.raw`例如 $a=2^3\times3$、$b=2\times3^2$，则 $\operatorname{HCF}=2\times3$，$\operatorname{LCM}=2^3\times3^2$。缺少的素因子视为指数 0。`,
        },
        {
          title: '快速验算',
          text: String.raw`对两个正整数，$\operatorname{HCF}(a,b)\times\operatorname{LCM}(a,b)=ab$；互素的两个数 HCF 为 1，但它们不一定都是素数。`,
        },
      ],
      example: {
        question: '求 84 和 126 的最大公因数与最小公倍数。',
        steps: [
          String.raw`分解：$84=2^2\times3\times7$，$126=2\times3^2\times7$。`,
          String.raw`共有部分取小指数：$\operatorname{HCF}=2\times3\times7=42$。`,
          String.raw`覆盖全部需求取大指数：$\operatorname{LCM}=2^2\times3^2\times7=252$。`,
        ],
        answer: String.raw`HCF 为 42，LCM 为 252；且 $42\times252=84\times126=10584$。`,
      },
      pitfalls: [
        '最小公倍数通常不是简单相乘；两数有共同因子时，相乘会多算。',
        '素数不是“所有奇数”；例如 21 是奇数，却等于 3 × 7。',
      ],
      check: {
        question: '两盏灯分别每 18 秒和每 24 秒闪一次，此刻同时闪。再过多少秒首次同时闪？',
        options: ['$6$', '$42$', '$72$', '$432$'],
        answerIndex: 2,
        explanation: String.raw`找最小公倍数：$18=2\times3^2$，$24=2^3\times3$，因此 $\operatorname{LCM}=2^3\times3^2=72$ 秒。`,
      },
      sourceIds: ['number-spec', 'number-factors'],
    },
    {
      code: '110204',
      title: '逆运算与运算顺序',
      summary:
        'Inverse operations and order of operations：先识别括号和整体结构；约分只消去因子，不消去加数。',
      paragraphs: [
        String.raw`逆运算（inverse operation）可以撤销原操作：加 7 对应减 7，乘 4 对应除以 4。非零数 $a$ 的倒数是 $1/a$，因为它们的乘积为 1；减法与除法不能随意交换顺序。`,
        String.raw`按“括号内 → 幂与根 → 乘除 → 加减”理解优先级。同级从左到右。分数横线把整个分子和整个分母分别分组，根号横线也限定了根号作用的范围。`,
      ],
      rules: [
        {
          title: '同级有先后',
          text: String.raw`$18\div3\times2=(18\div3)\times2=12$，不是 $18\div(3\times2)$。`,
        },
        {
          title: '约分的对象',
          text: String.raw`$\frac{6\times7}{6\times5}=\frac75$；但 $\frac{6+7}{6}$ 不能把两个 6 划掉。先提成公因子的乘积，才能约分。`,
        },
        {
          title: '括号保护负号',
          text: String.raw`$(-4)^2=16$，而 $-4^2=-(4^2)=-16$。平方与开平方互为逆操作时，还要留意正负号。`,
        },
      ],
      example: {
        question: String.raw`计算 $\dfrac{18\times14}{21}-\left(5-2^3\right)$。`,
        steps: [
          String.raw`分数部分先约分：$\frac{18\times14}{21}=18\times\frac23=12$。`,
          String.raw`括号内先算幂：$5-2^3=5-8=-3$。`,
          String.raw`最后减去负数：$12-(-3)=15$。`,
        ],
        answer: '$15$。',
      },
      pitfalls: [
        '口诀里的乘除是同一优先级，不是“所有乘法永远先于所有除法”。',
        '去括号时，括号前的减号必须作用于括号内整个表达式。',
      ],
      check: {
        question: String.raw`$24\div6\times2-3^2$ 等于多少？`,
        options: ['$-7$', '$-1$', '$7$', '$15$'],
        answerIndex: 1,
        explanation: String.raw`先算平方 9；乘除从左到右得 $24\div6\times2=8$，所以 $8-9=-1$。`,
      },
      sourceIds: ['number-spec', 'number-operations'],
    },
    {
      code: '110205',
      title: '系统列举策略',
      summary: 'Systematic listing strategies：把结果按固定顺序分组，让每一种可能只出现一次。',
      paragraphs: [
        '列举前先定义“一个结果”：是否区分顺序、是否允许重复、第一位是否可为零。按第一步分组，再在每组内列完第二步，可用表格或树状分支防止漏项。',
        String.raw`乘法计数原理不是随意把两个数字相乘：如果第一步有 $m$ 种选择，且每一种第一步之后都恰有 $n$ 种第二步选择，才可直接用 $mn$。各分支可选数量不同，就分别计数后相加；无需假设概率独立。`,
      ],
      rules: [
        {
          title: '顺序是否重要',
          text: '选队长与副队长时，甲乙和乙甲不同；只选两人组成小组时，它们是同一个小组。',
        },
        {
          title: '重复是否允许',
          text: String.raw`用 4 个不同数字组成两位代码，允许重复时有 $4\times4$ 种，不允许重复时有 $4\times3$ 种；若是两位整数，还须排除首位为 0。`,
        },
        {
          title: '分类后相加',
          text: '分类必须覆盖全部情况，并且类别互不重叠，否则会漏算或重复计算。',
        },
      ],
      example: {
        question: '用数字 0、1、2、3 组成不重复数字的两位偶数，共有多少个？',
        steps: [
          '个位为 0：十位可取 1、2、3，得到 10、20、30，共 3 个。',
          '个位为 2：十位不能为 0 或 2，只可取 1、3，得到 12、32，共 2 个。',
          '两个类别互不重叠且覆盖全部偶数，合计 3 + 2 = 5 个。',
        ],
        answer: '5 个：10、12、20、30、32。',
      },
      pitfalls: [
        '首位为 0 的代码可能合法，但首位为 0 的“两位整数”不合法。',
        '不能见到两个位置就直接相乘；限制可能让不同分支有不同数量的选项。',
      ],
      check: {
        question: '从甲、乙、丙、丁四人中选两人组成无职务区别的小组，共有多少种？',
        options: ['$4$', '$6$', '$8$', '$12$'],
        answerIndex: 1,
        explanation:
          '按固定顺序列出：甲乙、甲丙、甲丁、乙丙、乙丁、丙丁，共 6 种。按先选一人再选一人会把每个小组算两次。',
      },
      sourceIds: ['number-spec', 'number-counting'],
    },
    {
      code: '110206',
      title: '平方、根、立方',
      summary: 'Squares, roots, cubes and cube roots：平方丢失正负信息，立方保留正负信息。',
      paragraphs: [
        String.raw`平方（square）是数乘自身，立方（cube）是三个相同因数相乘。$5^2=(-5)^2=25$，所以 25 的平方根有 5 和 −5；但符号 $\sqrt{25}$ 专指非负的算术平方根，值为 5。`,
        String.raw`求根可反问：“哪个数的几次方得到它？”因为 $(-3)^3=-27$，所以 $\sqrt[3]{-27}=-3$。在实数范围，负数没有平方根，但任何实数都有且仅有一个实立方根。`,
      ],
      rules: [
        {
          title: '根号值与解方程',
          text: String.raw`$\sqrt a\ge0$（$a\ge0$）；$x^2=a$ 在 $a>0$ 时有 $x=\pm\sqrt a$，在 $a=0$ 时只有 $x=0$。`,
        },
        {
          title: '平方再开根',
          text: String.raw`$\sqrt{x^2}=|x|$，不是总等于 $x$。例如 $\sqrt{(-7)^2}=7$。`,
        },
        {
          title: '用邻近平方定位',
          text: String.raw`$7^2<55<8^2$ 推出 $7<\sqrt{55}<8$，可帮助判断根式的数量级。`,
        },
      ],
      example: {
        question: String.raw`求 $\sqrt{81}+\sqrt[3]{-64}$，并求方程 $x^2=81$ 的实数解。`,
        steps: [
          String.raw`$9^2=81$，所以 $\sqrt{81}=9$。`,
          String.raw`$(-4)^3=-64$，所以原式为 $9-4=5$。`,
          String.raw`方程询问所有平方等于 81 的数，$9$ 与 $-9$ 都满足。`,
        ],
        answer: String.raw`原式为 5；方程的解是 $x=\pm9$。`,
      },
      pitfalls: [
        String.raw`不能写 $\sqrt{81}=\pm9$；“±”属于解方程的结果。`,
        String.raw`根号一般不能拆加法：$\sqrt{9+16}=5$，而 $\sqrt9+\sqrt{16}=7$。`,
      ],
      check: {
        question: String.raw`$\sqrt{(-6)^2}-\sqrt[3]{-8}$ 等于多少？`,
        options: ['$-8$', '$-4$', '$4$', '$8$'],
        answerIndex: 3,
        explanation: String.raw`第一项为 $\sqrt{36}=6$，第二项为 $-2$，因此 $6-(-2)=8$。`,
      },
      sourceIds: ['number-spec', 'number-radicals'],
    },
    {
      code: '110207',
      title: '数值指数律',
      summary: 'Index laws for numbers：同底数相乘加指数；分数指数管开根，负指数管倒数。',
      paragraphs: [
        String.raw`$a^3a^2$ 是把 3 个 $a$ 与 2 个 $a$ 接在一起相乘，所以等于 $a^5$。同底数相除则约去公共因子。指数规律的本质是因子的个数和结构，不适用于把两个幂直接相加。`,
        String.raw`对正底数 $a$，$a^{m/n}=(\sqrt[n]{a})^m$（$n$ 为正整数），分母告诉你开几次根，分子告诉你取几次方；负指数再取倒数。先开根通常比先算大整数更省力。`,
      ],
      rules: [
        {
          title: '运算表',
          text: String.raw`对 $a>0$，$a^ma^n=a^{m+n}$，$a^m/a^n=a^{m-n}$，$(a^m)^n=a^{mn}$。对 $a,b>0$，$(ab)^n=a^nb^n$，$(a/b)^n=a^n/b^n$。`,
        },
        {
          title: '零次方与负指数',
          text: String.raw`$a^0=1$、$a^{-n}=1/a^n$ 都要求 $a\ne0$。$0^0$ 不在这里定义，零的负次方无意义。`,
        },
        {
          title: '负底数先判断定义域',
          text: String.raw`整数指数可用于负底数。分数指数先约成最简分数：奇数分母可按实数奇次根理解，如 $(-8)^{1/3}=-2$；偶数分母不对负数定义实数值。不要把正底数的全部变形规则无条件搬到负底数。`,
        },
      ],
      example: {
        question: String.raw`不使用计算器，计算 $\dfrac{16^{3/4}\times2^{-1}}{8^{1/3}}$。`,
        steps: [
          String.raw`$16^{3/4}=(\sqrt[4]{16})^3=2^3=8$。`,
          String.raw`$2^{-1}=\frac12$，$8^{1/3}=2$。`,
          String.raw`原式 $=\frac{8\times(1/2)}2=2$。`,
        ],
        answer: '$2$。',
      },
      pitfalls: [
        String.raw`$3^{-2}=\frac19$，不是 $-9$，也不是 $-\frac19$。`,
        String.raw`$2^3+2^2=12$，不能用乘法指数律写成 $2^5$。`,
      ],
      check: {
        question: String.raw`$27^{-2/3}$ 等于多少？`,
        options: [String.raw`$-\frac19$`, String.raw`$\frac19$`, String.raw`$\frac16$`, '$9$'],
        answerIndex: 1,
        explanation: String.raw`$27^{1/3}=3$，先平方得 9，再因负指数取倒数，得到 $1/9$。`,
      },
      sourceIds: ['number-spec', 'number-indices', 'number-radicals'],
    },
    {
      code: '110208',
      title: '科学计数法',
      summary: 'Standard form：系数描述有效数字，10 的幂描述数量级。',
      paragraphs: [
        String.raw`正数的标准形式（standard form）写成 $a\times10^n$，其中 $1\le a<10$、$n$ 为整数。大数通常对应正指数，小于 1 的正数对应负指数，例如 $0.00056=5.6\times10^{-4}$。负数可把负号保留在整个标准形式前。`,
        String.raw`乘除时把系数与 10 的幂分开处理，最后检查系数是否回到标准范围。加减时先把指数统一，否则是在把不同大小的“份”直接相加。比较正数时先比较指数，指数相同再比较系数。`,
      ],
      rules: [
        {
          title: '乘除分两路',
          text: String.raw`$(a\times10^m)(b\times10^n)=ab\times10^{m+n}$；除法把系数相除、指数相减，分母必须非零。`,
        },
        {
          title: '加减先对齐',
          text: String.raw`$3.2\times10^4+6\times10^3=(3.2+0.6)\times10^4$。`,
        },
        {
          title: '结果要标准化',
          text: String.raw`$24\times10^{-6}=2.4\times10^{-5}$；系数除以 10，10 的指数就加 1，保持原值不变。`,
        },
      ],
      example: {
        question: String.raw`将 $(6\times10^{-3})(4\times10^5)$ 写成标准形式。`,
        steps: [
          String.raw`系数相乘：$6\times4=24$。`,
          String.raw`指数相加：$10^{-3}\times10^5=10^2$。`,
          String.raw`$24\times10^2=2.4\times10^3$，现在系数在 1 与 10 之间。`,
        ],
        answer: String.raw`$2.4\times10^3$。`,
      },
      pitfalls: [
        '负指数表示倒数，不表示这个数为负。',
        '只把小数点移走、却忘记同步调整指数，会改变原数。',
      ],
      check: {
        question: String.raw`$\dfrac{8.4\times10^5}{2.1\times10^{-2}}$ 的标准形式是？`,
        options: [
          String.raw`$4\times10^3$`,
          String.raw`$4\times10^7$`,
          String.raw`$4\times10^{-7}$`,
          String.raw`$40\times10^7$`,
        ],
        answerIndex: 1,
        explanation: String.raw`系数 $8.4/2.1=4$，指数 $5-(-2)=7$，所以是 $4\times10^7$。`,
      },
      sourceIds: ['number-spec', 'number-indices'],
    },
    {
      code: '110209',
      title: '小数、百分数与分数转换',
      summary:
        'Decimals, percentages and fractions：三种写法表示同一个量；循环小数用“对齐尾巴再相减”化分数。',
      paragraphs: [
        String.raw`百分数（percentage）表示每一百份：$p\%=p/100$。有限小数可按位值写成分母为 10 的幂的分数再约分，例如 $0.045=45/1000=9/200=4.5\%$。分数转小数就是分子除以分母。`,
        String.raw`循环小数（recurring decimal）的横线只标循环部分：$0.1\overline6=0.1666\ldots$。设它等于 $x$，乘合适的 10 的幂，让两个式子的小数尾部完全对齐，相减即可消去无限重复部分。`,
      ],
      rules: [
        {
          title: '转换不改变值',
          text: String.raw`$\frac18=0.125=12.5\%$；从小数到百分数，将数值乘 100 并加上百分号。`,
        },
        {
          title: '纯循环与混循环',
          text: String.raw`$0.\overline{27}$ 可用 $100x-x$；$0.1\overline6$ 要用 $100x-10x$。关键是小数部分相同，不能只按小数位数机械添 9。`,
        },
        {
          title: '何时能写成有限小数',
          text: String.raw`最简分数的正分母只含素因子 2 与 5 时，小数会终止；否则小数会循环。先约分后判断，例如 $3/6=1/2$ 会终止。`,
        },
      ],
      example: {
        question: String.raw`将 $0.2\overline7$ 化成最简分数。`,
        steps: [
          String.raw`设 $x=0.2777\ldots$，则 $10x=2.7777\ldots$，$100x=27.7777\ldots$。`,
          String.raw`相减消去重复尾部：$100x-10x=27.7777\ldots-2.7777\ldots=25$。`,
          String.raw`$90x=25$，因此 $x=25/90=5/18$。`,
        ],
        answer: String.raw`$\frac5{18}$。`,
      },
      pitfalls: [
        String.raw`$0.\overline{27}$ 和 $0.2\overline7$ 不同；循环横线覆盖的数字必须读准。`,
        String.raw`$0.5\%=0.005$，不是 $0.5$。`,
      ],
      check: {
        question: String.raw`$0.\overline{36}$ 对应的最简分数是？`,
        options: [
          String.raw`$\frac9{25}$`,
          String.raw`$\frac4{11}$`,
          String.raw`$\frac{18}{55}$`,
          String.raw`$\frac{36}{90}$`,
        ],
        answerIndex: 1,
        explanation: String.raw`设 $x=0.3636\ldots$，则 $100x-x=36$，所以 $x=36/99=4/11$。`,
      },
      sourceIds: ['number-spec', 'number-decimal-fractions', 'number-percent', 'number-guide'],
    },
    {
      code: '110210',
      title: '分数小数百分数计算',
      summary:
        'Fractions, decimals and percentages in calculations：选最容易约分的写法，并明确“谁的百分之几”。',
      paragraphs: [
        String.raw`等值分数（equivalent fractions）的分子与分母同乘或同除一个非零数，大小不变。计算前换一种写法常能大幅简化：$12.5\%=1/8$，$0.75=3/4$，先约分比长除法更方便。`,
        String.raw`“某量的 $p\%$”是这个量乘 $p/100$。连续两次取比例时，第二次可能以剩余量为基准；只有百分比对应同一基数时才可直接相加。先写出基准量，再写运算。`,
      ],
      rules: [
        {
          title: '常用等值形式',
          text: String.raw`$\frac14=0.25=25\%$；$\frac25=0.4=40\%$；$\frac58=0.625=62.5\%$。记住几组，再由倍数拆分。`,
        },
        {
          title: '用倍数求部分',
          text: String.raw`$p\%$ of $N=N\times p/100$；如果已知部分 $A$ 是总量的 $p\%$，则总量为 $A\div(p/100)$（$p\ne0$）。`,
        },
        {
          title: '先保留精确形式',
          text: String.raw`$\frac13\times60=20$。若先把 $1/3$ 约为 0.33，就会得到错误的精确结果 19.8。`,
        },
      ],
      example: {
        question: '一瓶液体有 480 mL，先用去总量的 12.5%，再用去剩余量的 1/3，最后剩多少？',
        steps: [
          String.raw`$12.5\%=1/8$，第一次用去 $480\times1/8=60$ mL。`,
          String.raw`第一次后剩 $480-60=420$ mL；第二次的基数是 420。`,
          String.raw`再用去 $1/3$，即保留 $2/3$：$420\times2/3=280$ mL。`,
        ],
        answer: '280 mL。',
      },
      pitfalls: [
        '连续“用去 10%”与“用去剩余的 10%”不能合成用去原量的 20%。',
        '百分数超过 100% 合法，表示超过一整份；例如 150% 表示 1.5 倍。',
      ],
      check: {
        question: '一个数的 35% 是 84，这个数是多少？',
        options: ['$29.4$', '$120$', '$240$', '$294$'],
        answerIndex: 2,
        explanation: String.raw`$35\%=7/20$，总量为 $84\div(7/20)=84\times20/7=240$。`,
      },
      sourceIds: ['number-spec', 'number-fractions', 'number-percent'],
    },
    {
      code: '110211',
      title: '分数、根式与π的精确计算',
      summary:
        'Exact calculation with fractions, surds and pi：先提平方因子，保留精确符号，再利用共轭把分母有理化。',
      paragraphs: [
        String.raw`精确值（exact value）不丢失信息；$\sqrt2$ 和 $\pi$ 是精确符号，而 1.414 和 3.14 是近似值。根式化简先找完全平方因子：$\sqrt{75}=\sqrt{25\times3}=5\sqrt3$。`,
        String.raw`有理化（rationalising the denominator）是在分子、分母同乘一个非零量，保持原值却让分母不含根式。单项根式乘同一个根式；两项和差乘共轭（conjugate），利用平方差消去根式。`,
      ],
      rules: [
        {
          title: '根式计算条件',
          text: String.raw`$\sqrt{ab}=\sqrt a\sqrt b$（$a,b\ge0$），$\sqrt{a/b}=\sqrt a/\sqrt b$（$a\ge0,b>0$）。只合并同类根式，如 $2\sqrt3+5\sqrt3=7\sqrt3$。`,
        },
        {
          title: '两类有理化',
          text: String.raw`$\frac3{\sqrt5}=\frac{3\sqrt5}{5}$；$\frac1{2+\sqrt3}=\frac{2-\sqrt3}{4-3}=2-\sqrt3$。共轭只是改变两项之间的符号，分子也必须同步相乘。`,
        },
        {
          title: 'π 也可约分',
          text: String.raw`$\frac{15\pi}{6\pi}=\frac52$；$\pi\ne3.14$，题目要求精确值时保留 $\pi$。`,
        },
      ],
      example: {
        question: String.raw`精确计算 $\sqrt{48}+\dfrac6{\sqrt3+1}$。`,
        steps: [
          String.raw`$\sqrt{48}=\sqrt{16\times3}=4\sqrt3$。`,
          String.raw`分数同乘共轭：$\frac6{\sqrt3+1}=\frac{6(\sqrt3-1)}{(\sqrt3+1)(\sqrt3-1)}=\frac{6(\sqrt3-1)}2=3\sqrt3-3$。`,
          String.raw`合并同类根式：$4\sqrt3+3\sqrt3-3=7\sqrt3-3$。`,
        ],
        answer: String.raw`$7\sqrt3-3$。`,
      },
      pitfalls: [
        String.raw`$\sqrt{a+b}$ 通常不等于 $\sqrt a+\sqrt b$。`,
        '有理化只改变写法，不改变数值；乘完后检查分母正负与是否还可约分。',
      ],
      check: {
        question: String.raw`$\dfrac4{\sqrt5-1}$ 化简后是？`,
        options: [
          String.raw`$\sqrt5-1$`,
          String.raw`$\sqrt5+1$`,
          String.raw`$4\sqrt5+4$`,
          String.raw`$\frac{\sqrt5+1}{4}$`,
        ],
        answerIndex: 1,
        explanation: String.raw`同乘共轭 $\sqrt5+1$，分母变为 $5-1=4$，约分后得 $\sqrt5+1$。`,
      },
      sourceIds: ['number-spec', 'number-radicals'],
    },
    {
      code: '110212',
      title: '上下界',
      summary: 'Upper and lower bounds：把测量看成一个范围，再判断每个量变大时结果怎么变。',
      paragraphs: [
        String.raw`显示的测量值通常不是精确真值。例如正长度按最近的 1 cm 四舍五入显示 12 cm，真值满足 $11.5\le L<12.5$。下界（lower bound）与上界（upper bound）描述可能范围；上界可能只能趋近，不能真正取到。`,
        String.raw`求式子的范围，先判断它随每个量增大而增大还是减小。正数相乘时都取大得到上界；正数相除时，分子取大且分母取小才得到上界。若变量可能为负，需重新检查符号与端点，不能照搬正数口诀。`,
      ],
      rules: [
        {
          title: '加减看方向',
          text: String.raw`若 $a_L\le a\le a_U$、$b_L\le b\le b_U$，则和在 $[a_L+b_L,a_U+b_U]$ 内，差在 $[a_L-b_U,a_U-b_L]$ 内。实际端点是否可取还须看原区间。`,
        },
        {
          title: '正数乘除',
          text: String.raw`当 $a_L,b_L>0$，乘积边界为 $a_Lb_L$ 与 $a_Ub_U$；商的边界为 $a_L/b_U$ 与 $a_U/b_L$。分母区间含 0 时不能直接这样除。`,
        },
        {
          title: '端点与可达到性',
          text: '计算出边界后，回看取到该边界需要的原变量端点是否都允许；若有一个必要端点被排除，就用严格不等号。',
        },
      ],
      example: {
        question:
          '某物体走过的距离按最近 1 m 记录为 20 m，时间按最近 0.1 s 记录为 4.0 s。求平均速度的上下界。',
        steps: [
          String.raw`正值按四舍五入记录：$19.5\le d<20.5$ m，$3.95\le t<4.05$ s。`,
          String.raw`速度 $v=d/t$。下界用最小距离除以最大时间：$19.5/4.05=130/27$ m/s。`,
          String.raw`上界用最大距离除以最小时间：$20.5/3.95=410/79$ m/s。两个界都用到了一个不能取到的上端点。`,
        ],
        answer: String.raw`$\frac{130}{27}<v<\frac{410}{79}$ m/s；两端约为 4.815 与 5.190，这两个近似数只帮助理解，精确范围用前面的分数表示。`,
      },
      pitfalls: [
        '商的上界不是“上界 ÷ 上界”；分母越小，正数商越大。',
        '上界不一定是最大值。若上端点取不到，就不存在那个端点对应的最大值。',
      ],
      check: {
        question: String.raw`$4\le a<5$、$2\le b<3$，则 $a-b$ 的准确范围是？`,
        options: [
          String.raw`$2\le a-b<2$`,
          String.raw`$1\le a-b\le3$`,
          String.raw`$1<a-b<3$`,
          String.raw`$1\le a-b<3$`,
        ],
        answerIndex: 2,
        explanation: String.raw`下界为 $4-3=1$，但 $b=3$ 不允许；上界为 $5-2=3$，但 $a=5$ 不允许。因此两端均为严格不等号。`,
      },
      sourceIds: ['number-spec', 'number-guide'],
    },
    {
      code: '110213',
      title: '取近似与误差区间',
      summary: 'Rounding and error intervals：先确定舍入的那一位，再沿两侧各走半个单位。',
      paragraphs: [
        String.raw`小数位（decimal places, d.p.）从小数点后第一位开始数；有效数字（significant figures, s.f.）从第一个非零数字开始数。$0.004786$ 保留 2 位有效数字是 $0.0048$，保留 2 位小数则是 $0.00$。`,
        String.raw`误差区间（error interval）是所有会产生同一记录值的真值范围。正数按最近单位 $u>0$、恰好一半向上舍入，记录为正数 $r$ 时：$r-u/2\le x<r+u/2$。若舍入结果为 0，或题目另给范围限制，还须与原数的允许范围取交集。这里采用通常的四舍五入；若题目明确规定其他中点规则，端点归属随之改变。`,
      ],
      rules: [
        {
          title: '先找到舍入单位',
          text: String.raw`保留 1 位小数时 $u=0.1$，半单位是 0.05；保留到最近的 100 时 $u=100$，半单位是 50。`,
        },
        {
          title: '截断不等于四舍五入',
          text: String.raw`正数截断（truncation）到 1 位小数显示 2.4，范围是 $2.4\le x<2.5$；若对负数按向零截断，显示 −2.4 的范围是 $-2.5<x\le-2.4$。`,
        },
        {
          title: '保留精度的写法',
          text: String.raw`$9.96$ 保留 2 位有效数字写成 $1.0\times10^1$，明确两个有效数字。中间步骤尽量不舍入，避免连续舍入改变最终结果。`,
        },
      ],
      example: {
        question: '一个正数四舍五入到 1 位小数得到 6.2。写出误差区间，并说明 6.25 是否属于该区间。',
        steps: [
          String.raw`舍入单位为 $u=0.1$，半单位为 $0.05$。`,
          String.raw`下边界为 $6.2-0.05=6.15$，上边界为 $6.2+0.05=6.25$。`,
          '6.15 在中点向上舍入为 6.2，所以包含；6.25 舍入为 6.3，所以不包含。',
        ],
        answer: String.raw`$6.15\le x<6.25$，6.25 不属于该区间。`,
      },
      pitfalls: [
        '误差区间的宽度等于一个舍入单位，不是两倍舍入单位。',
        '不能把所有“保留几位”都当作小数位；有效数字前面的占位零不计数。',
      ],
      check: {
        question: String.raw`正数 $x$ 截断到 2 位小数后为 3.47，则正确范围是？`,
        options: [
          String.raw`$3.465\le x<3.475$`,
          String.raw`$3.47\le x<3.48$`,
          String.raw`$3.46<x\le3.47$`,
          String.raw`$3.47<x\le3.48$`,
        ],
        answerIndex: 1,
        explanation:
          '截断只去掉百分位后的数字，不进位；从 3.4700… 到小于 3.4800… 的所有正数都会显示 3.47。',
      },
      visual: 'bounds',
      sourceIds: ['number-spec', 'number-decimals', 'number-guide'],
    },
    {
      code: '110214',
      title: '估算',
      summary: 'Estimation：用容易算的邻近数快速定位答案；需要保证方向时，用不等式。',
      paragraphs: [
        String.raw`估算（estimation）是有目的地简化：为了判断数量级，可把数取成 1 位有效数字或容易约分的邻近数。例如 $\frac{39.8\times0.51}{1.98}\approx\frac{40\times0.5}{2}=10$。用 $\approx$ 表示近似，不要写成精确相等。`,
        String.raw`若要判断一定大于还是小于某值，就必须追踪近似方向。正数乘积的两个因子都调大，结果调大；正数商的分子调大、分母调小，结果调大。一个因子调大、另一个调小，误差可能抵消，也可能不抵消，不能直接宣布上下界。`,
      ],
      rules: [
        {
          title: 'π 与根式的近似',
          text: String.raw`粗估时可取 $\pi\approx3.14$ 或更粗的 3；根式可用邻近平方夹住，如 $1.4^2<2<1.5^2$，所以 $1.4<\sqrt2<1.5$。近似精度应服务于题目需求。`,
        },
        {
          title: '用界限排除选项',
          text: String.raw`若 $4<\sqrt{20}<5$，则 $\frac15<\frac1{\sqrt{20}}<\frac14$；取正数倒数后大小方向反转。`,
        },
        {
          title: '判断后再细化',
          text: '先用粗估排除数量级明显不对的答案；若剩余选项很接近，再保留更多数字或做精确计算。',
        },
      ],
      example: {
        question: String.raw`不算长小数，给 $\dfrac{\sqrt{50}}{3.9}$ 一个粗略估计，并给出可以保证的上下界。`,
        steps: [
          String.raw`取 $\sqrt{50}\approx7$、$3.9\approx4$，得到粗估 $7/4=1.75$。`,
          String.raw`用精确不等式：$7<\sqrt{50}<8$，且 $3<3.9<4$。`,
          String.raw`下界让分子小、分母大：$7/4$；上界让分子大、分母小：$8/3$。`,
        ],
        answer: String.raw`粗估约 1.75；能保证 $\frac74<\frac{\sqrt{50}}{3.9}<\frac83$。这次粗估恰好低于真值，因为分子调小且分母调大。`,
      },
      pitfalls: [
        '估算答案不代表精确答案，也不自动代表上界或下界。',
        '若答案选项很接近，粗略取 π 为 3 可能不足以区分选项。',
      ],
      check: {
        question: String.raw`将 $\dfrac{19.6}{0.49}$ 估为 $\dfrac{20}{0.5}=40$，哪项判断正确？`,
        options: [
          '一定高估',
          '一定低估',
          '恰好等于精确值',
          '由于两处都向上舍入，所以无法计算精确值',
        ],
        answerIndex: 2,
        explanation: String.raw`检查原式：$19.6/0.49=1960/49=40$。分子与分母都变大，不能仅凭方向判高估或低估；此处两者放大的倍数相同，误差恰好抵消。`,
      },
      sourceIds: ['number-spec', 'number-guide', 'number-arithmetic'],
    },
  ],
  sources: [
    {
      id: 'number-spec',
      title: 'UAT-UK · ESAT Content Specification（2026/2027）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '官方 M2.1–M2.14 范围对照；本页按项目考纲逐点组织，例题与自测为原创。',
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
