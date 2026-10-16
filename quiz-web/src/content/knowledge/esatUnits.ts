// 试题库 ESAT 数学 1「单位」讲解：按现行考纲叶子节点组织原创说明、例题和自测。
import type { KnowledgeLesson } from './types'

export const esatUnits: KnowledgeLesson = {
  code: '110100',
  title: 'Units · 单位',
  subtitle: '先读懂“每”，再让单位带着你计算',
  intro:
    '一个数只有带上单位，才说明它在测量什么。本节从常见量出发，把速度、工资、单价、密度和压强放进同一种思路：先辨认量，再统一单位，最后检查结果是否合理。',
  memory: [
    '读到 per（每），就把“每”后面的量放到分母；乘回分母对应的量，可以找回总量。',
    '同一个量换成更小的单位，数值变大；面积换算看平方，体积换算看立方。',
    '分子、分母分别换；把单位写在每一步，比只背“乘还是除”更可靠。',
  ],
  sections: [
    {
      code: '110101',
      title: '标准单位与复合单位',
      summary: 'Standard and compound units：看懂单位，就能看出计算关系。',
      paragraphs: [
        String.raw`“数量 = 数值 × 单位”。例如 $0.75\,\mathrm{kg}$ 和 $750\,\mathrm{g}$ 是同一质量的两种写法。常见量包括长度 length、质量 mass、时间 time、金额 money、面积 area 和体积 volume；单位可以是 m、kg、s、英镑、$\mathrm{m^2}$ 和 $\mathrm{m^3}$。单位要与量相配，也要适合实际尺度。`,
        String.raw`标准单位不等于“所有单位都属于 SI 基本单位”。米、千克、秒是 SI 基本单位；分钟、小时、升和货币单位也常出现在题目中。质量用 kg 或 g，重力是力，要用 N，不能把两者当作可直接互换的单位。英国货币中 1 英镑 = 100 便士，因此 75 便士 = 0.75 英镑。`,
        String.raw`复合单位 compound unit 由单位相乘或相除得到。$\mathrm{m/s}$ 与 $\mathrm{m\,s^{-1}}$ 都表示“每秒多少米”；指数 $-1$ 表示这个单位在分母，不表示数值为负。把“每千克 4 英镑”读成“4 英镑 ÷ 1 千克”，就能判断该乘质量还是除质量。`,
      ],
      rules: [
        {
          title: '速度 speed：路程 ÷ 时间',
          text: String.raw`平均速度 $v=\dfrac{d}{t}$，其中 $d$ 是总路程，$t$ 是整个行程的总用时；相应地 $d=vt$、$t=d/v$。若用 m 和 s，答案单位就是 $\mathrm{m/s}$。例如 90 m 用时 12 s，平均速度为 $7.5\,\mathrm{m/s}$。分段行程也先分别加总路程和时间。`,
        },
        {
          title: '工资率 rate of pay：报酬 ÷ 工作时间',
          text: String.raw`固定时薪下，报酬 = 时薪 × 工时。每小时 12 英镑，工作 2 小时 15 分钟，工时是 $2+15/60=2.25$ 小时，因此报酬为 $12\times2.25=27$ 英镑。若题目给出加班费、最低收费或分段费率，要先分段计算。`,
        },
        {
          title: '单价 unit pricing：价格 ÷ 数量',
          text: String.raw`比较商品时，要把“每多少”统一。600 g 售价 2.40 英镑，相当于 $2.40/0.6=4$ 英镑/kg；另一包 1 kg 售价 3.80 英镑，后者每千克便宜。单价 × 购买数量 = 总价，但必须保证数量的单位与单价分母一致。`,
        },
        {
          title: '密度 density：质量 ÷ 体积',
          text: String.raw`密度 $\rho=\dfrac{m}{V}$，所以 $m=\rho V$、$V=m/\rho$。例如 720 g 材料占 $300\,\mathrm{cm^3}$，密度是 $2.4\,\mathrm{g/cm^3}$。密度描述每单位体积含多少质量；“更重”本身不足以判断密度更大，还要看体积。`,
        },
        {
          title: '压强 pressure：垂直于表面的力 ÷ 面积',
          text: String.raw`平均压强 $p=\dfrac{F}{A}$，所以 $F=pA$。$1\,\mathrm{Pa}=1\,\mathrm{N/m^2}$。例如 72 N 均匀作用在 $30\,\mathrm{cm^2}$ 上，压强为 $2.4\,\mathrm{N/cm^2}$；若要求 Pa，必须把面积换成 $\mathrm{m^2}$ 后再算。相同的力作用在更小面积上，压强更大。`,
        },
        {
          title: '用单位检查公式',
          text: String.raw`“密度 × 体积”的单位是 $(\mathrm{kg/m^3})\times\mathrm{m^3}=\mathrm{kg}$，符合质量；“速度 ÷ 时间”的单位是 $\mathrm{m/s^2}$，不能作为路程。单位不匹配说明关系有误；单位匹配只是必要检查，仍需确认题意与数值。`,
        },
      ],
      example: {
        question:
          '骑行者先用 30 分钟骑完 12 km，再用 60 分钟骑完 12 km，中间没有停留。整个行程的平均速度是多少 km/h？',
        steps: [
          String.raw`先确定平均速度的分子：总路程 $12+12=24\,\mathrm{km}$。`,
          String.raw`再统一分母单位：总时间 $30+60=90\,\mathrm{min}=1.5\,\mathrm{h}$。`,
          String.raw`用总量计算：$v=24/1.5=16\,\mathrm{km/h}$。`,
          String.raw`检查：两段速度分别是 $24\,\mathrm{km/h}$ 和 $12\,\mathrm{km/h}$。慢速段持续更久，所以平均速度应更接近 12；直接取 $(24+12)/2=18$ 会把两段用时误当成相同。`,
        ],
        answer: String.raw`$16\,\mathrm{km/h}$。平均速度是“总路程 ÷ 总时间”。`,
      },
      pitfalls: [
        '2 小时 15 分钟不是 2.15 小时：分钟是六十进制，小数小时是十进制。',
        '比较工资率或商品单价时，先统一分母单位；每分钟、每小时，以及每 100 g、每 kg，不能直接比较数值。',
        String.raw`密度的分母是体积，压强的分母是面积；$\mathrm{g/cm^3}$、$\mathrm{N/cm^2}$ 和 Pa 是不同的单位写法，不能只删改单位标签。`,
        '不要默认把各段速度直接取算术平均；各段用时相等时可以这样算，其余情况应回到总路程与总时间。',
      ],
      check: {
        question:
          '一份工作按固定时薪支付，45 分钟得到 10.80 英镑。工作 2 小时 30 分钟可得到多少英镑？',
        options: ['24.00 英镑', '32.40 英镑', '36.00 英镑', '43.20 英镑'],
        answerIndex: 2,
        explanation: String.raw`45 分钟是 $0.75$ 小时，时薪 $10.80/0.75=14.40$ 英镑；2 小时 30 分钟是 $2.5$ 小时，报酬 $14.40\times2.5=36.00$ 英镑。也可直接用时间比 $150/45=10/3$，得到 $10.80\times10/3=36.00$。`,
      },
      sourceIds: ['uat-spec', 'uat-maths1-guide', 'openstax-units'],
    },
    {
      code: '110102',
      title: '单位换算',
      summary: 'Unit conversion：量不变，变的是用多少个新单位来描述它。',
      paragraphs: [
        String.raw`换算可以看成“换尺子”：用厘米测量同一根长 2 m 的绳子，需要 200 个厘米。量没有变，只是单位缩小为原来的 $1/100$，数值扩大到 100 倍。先判断结果应该变大还是变小，再动笔计算，可抓出很多方向错误。`,
        String.raw`最稳妥的工具是换算因子 conversion factor。由于 $1\,\mathrm{m}=100\,\mathrm{cm}$，分式 $\dfrac{1\,\mathrm{m}}{100\,\mathrm{cm}}$ 的值为 1。于是 $250\,\mathrm{cm}\times\dfrac{1\,\mathrm{m}}{100\,\mathrm{cm}}=2.5\,\mathrm{m}$。把旧单位放到能够约去的位置，方向就由单位决定了。`,
        String.raw`这套方法也适用于字母：若速度的数值为 $x$，单位为 $\mathrm{cm/min}$，则 $x\,\mathrm{cm/min}=\dfrac{x}{6000}\,\mathrm{m/s}$，因为长度要除以 100，时间分母中的 1 分钟要换成 60 秒。字母不改变换算因子。`,
      ],
      rules: [
        {
          title: '前缀 prefixes：先还原成 10 的幂',
          text: String.raw`需要熟悉 nano（n）$10^{-9}$、micro（$\mu$）$10^{-6}$、milli（m）$10^{-3}$、centi（c）$10^{-2}$、deci（d）$10^{-1}$、kilo（k）$10^3$、mega（M）$10^6$、giga（G）$10^9$。例如 $5\,\mathrm{mm}=5\times10^{-3}\,\mathrm{m}$；作为前缀时 m 是 milli，M 是 mega，大小写不能混用。单独的 m 则是米的单位符号。`,
        },
        {
          title: '长度与质量：记住关键等式',
          text: String.raw`$1\,\mathrm{km}=1000\,\mathrm{m}$，$1\,\mathrm{m}=100\,\mathrm{cm}=1000\,\mathrm{mm}$；$1\,\mathrm{t}=1000\,\mathrm{kg}$，$1\,\mathrm{kg}=1000\,\mathrm{g}$，$1\,\mathrm{g}=1000\,\mathrm{mg}$。例如 $0.045\,\mathrm{kg}=45\,\mathrm{g}=45000\,\mathrm{mg}$。这里 t 表示公吨 tonne。`,
        },
        {
          title: '时间：分钟和小时不走十进制',
          text: String.raw`$1\,\mathrm{min}=60\,\mathrm{s}$，$1\,\mathrm{h}=60\,\mathrm{min}=3600\,\mathrm{s}$，$1\,\mathrm{day}=24\,\mathrm{h}$，1 周 = 7 天，1 年 = 12 个月。月份天数不固定；平年 365 天，闰年 366 天，应结合题意换算。例如 $1.4\,\mathrm{h}=1\,\mathrm{h}+0.4\times60\,\mathrm{min}$，即 1 小时 24 分钟。`,
        },
        {
          title: '面积与体积：换算因子也要乘方',
          text: String.raw`边长 1 m 的正方形，换成厘米后是 $100\times100$ 个 $1\,\mathrm{cm^2}$，所以 $1\,\mathrm{m^2}=10000\,\mathrm{cm^2}$。立方体多一个方向，所以 $1\,\mathrm{m^3}=1000000\,\mathrm{cm^3}$。一般地，长度换算因子为 $k$，面积为 $k^2$，体积为 $k^3$。例如 $0.08\,\mathrm{m^2}=800\,\mathrm{cm^2}$。`,
        },
        {
          title: '容量 capacity：升与立方单位接起来',
          text: String.raw`$1\,\mathrm{L}=1\,\mathrm{dm^3}=1000\,\mathrm{cm^3}$，$1\,\mathrm{mL}=1\,\mathrm{cm^3}$，$1\,\mathrm{m^3}=1000\,\mathrm{L}$。因此 $2.5\,\mathrm{L}=2500\,\mathrm{cm^3}=0.0025\,\mathrm{m^3}$。L 已经是体积单位，不要再对 L 与 mL 的 1000 倍关系取立方。`,
        },
        {
          title: '复合单位：分子、分母分别换',
          text: String.raw`$54\,\mathrm{km/h}=\dfrac{54000\,\mathrm{m}}{3600\,\mathrm{s}}=15\,\mathrm{m/s}$；所以 km/h 转 m/s 除以 3.6，反向乘以 3.6。$1\,\mathrm{g/cm^3}=\dfrac{0.001\,\mathrm{kg}}{0.000001\,\mathrm{m^3}}=1000\,\mathrm{kg/m^3}$。$1\,\mathrm{N/cm^2}=10000\,\mathrm{Pa}$，因为分母 $1\,\mathrm{cm^2}=0.0001\,\mathrm{m^2}$。`,
        },
        {
          title: '工资与价格换算：分母变大，单位时间或数量内的总额也变大',
          text: String.raw`0.20 英镑/min = 12 英镑/h：一小时有 60 分钟，应乘 60。30 便士/100 g = 3 英镑/kg：1 kg 有十份 100 g，先得 300 便士，再换成英镑。若单价为 $c$ 便士/100 g，则相当于 $c/10$ 英镑/kg。`,
        },
      ],
      visual: 'unit-scale',
      example: {
        question: String.raw`泵以恒定速率 $18\,\mathrm{L/min}$ 输送一种密度为 $0.8\,\mathrm{g/cm^3}$ 的液体。40 s 内输送液体的质量是多少 kg？`,
        steps: [
          String.raw`先把时间与流量分母统一：$40\,\mathrm{s}=40/60=2/3\,\mathrm{min}$。`,
          String.raw`体积 = 流量 × 时间：$18\times2/3=12\,\mathrm{L}$。L/min 中的 min 与时间的 min 约去，剩下 L。`,
          String.raw`把体积换成密度分母所用的单位：$12\,\mathrm{L}=12000\,\mathrm{cm^3}$。`,
          String.raw`质量 = 密度 × 体积：$0.8\times12000=9600\,\mathrm{g}=9.6\,\mathrm{kg}$。反查也可用 $0.8\,\mathrm{g/cm^3}=0.8\,\mathrm{kg/L}$，直接算 $0.8\times12=9.6\,\mathrm{kg}$。`,
        ],
        answer: String.raw`$9.6\,\mathrm{kg}$。每次相乘前，先让能约去的单位一致。`,
      },
      pitfalls: [
        String.raw`从 $\mathrm{m^2}$ 到 $\mathrm{cm^2}$ 要乘 $100^2$，从 $\mathrm{m^3}$ 到 $\mathrm{cm^3}$ 要乘 $100^3$；只乘 100 会漏掉维度。`,
        '“大单位换小单位，数值变大”可直接用于单个量；复合单位要拆开分子、分母判断，不能套在整串单位上。',
        String.raw`$1\,\mathrm{L}=1000\,\mathrm{mL}$ 是容量换算；$1\,\mathrm{kg}$ 液体不一定是 $1\,\mathrm{L}$，质量与体积之间还需要密度。`,
        '不要按英里、英尺、英寸的名字猜换算因子；遇到非公制单位，要使用题目给出的对应关系，并保留题目要求的精度。',
      ],
      check: {
        question: String.raw`75 N 的力垂直且均匀作用在 $25\,\mathrm{cm^2}$ 的面积上。压强是多少 Pa？`,
        options: [
          String.raw`$3\,\mathrm{Pa}$`,
          String.raw`$300\,\mathrm{Pa}$`,
          String.raw`$3000\,\mathrm{Pa}$`,
          String.raw`$30000\,\mathrm{Pa}$`,
        ],
        answerIndex: 3,
        explanation: String.raw`面积 $25\,\mathrm{cm^2}=25/10000=0.0025\,\mathrm{m^2}$，所以 $p=75/0.0025=30000\,\mathrm{N/m^2}=30000\,\mathrm{Pa}$。先算得 $75/25=3$ 时，单位仍是 $\mathrm{N/cm^2}$，不能直接写成 Pa。`,
      },
      sourceIds: ['uat-spec', 'uat-maths1-guide', 'bipm-prefixes', 'openstax-units'],
    },
  ],
  sources: [
    {
      id: 'uat-spec',
      title: 'UAT-UK · ESAT Content Specification（2026/27）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对 M1.1、M1.2 的覆盖范围及 Scientific Quantities and Units 中的 SI 前缀要求；官网当前版本适用于 2026 年 10 月和 2027 年 1 月。',
    },
    {
      id: 'uat-maths1-guide',
      title: 'UAT-UK · ESAT Guide: Mathematics 1',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/30103534/ESAT_Guide_Mathematics_1.pdf',
      note: '官方数学 1 学习指南，用于对照 Units 的术语与知识组织；本页中文说明、情境例题和自测均为原创整理。',
    },
    {
      id: 'bipm-prefixes',
      title: 'BIPM · SI prefixes',
      url: 'https://www.bipm.org/en/measurement-units/si-prefixes',
      note: '核对 SI 前缀的符号、大小写与十进制倍数。',
    },
    {
      id: 'openstax-units',
      title: 'OpenStax · Physical Quantities and Units',
      url: 'https://openstax.org/books/college-physics-2e/pages/1-2-physical-quantities-and-units',
      note: '参考标准量、复合单位和利用单位约去进行换算的方法；未转载教材例题。',
    },
  ],
}
