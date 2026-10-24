// ESAT数学1单位学习讲义：概念图解、年度考法归纳与真实题源练习对齐现行考纲。
import type { KnowledgeLesson } from './types'

export const esatUnits: KnowledgeLesson = {
  code: '110100',
  title: 'Units · 单位',
  subtitle: '先读懂“每”，再让单位带着你计算',
  intro:
    '单位不是算完再补的标签，而是解题路线。先用总量与单位量连起速度、密度、压强和费用，再处理分子、分母与平方立方换算；例题和自测均读取真实题源。',
  memory: [
    '读到 per（每），就把“每”后面的量放到分母；乘回分母对应的量，可以找回总量。',
    '同一个量换成更小的单位，数值变大；面积换算看平方，体积换算看立方。',
    '分子、分母分别换；把单位写在每一步，比只背“乘还是除”更可靠。',
  ],
  sections: [
    {
      code: '110101',
      title: '标准单位与复合单位',
      summary: '把“每单位多少”翻成除法；平均速度始终从总路程和总时间出发。',
      paragraphs: [
        '“数量 = 数值 × 单位”。例如 $0.75\\,\\mathrm{kg}$ 和 $750\\,\\mathrm{g}$ 是同一质量的两种写法。常见量包括长度 length、质量 mass、时间 time、金额 money、面积 area 和体积 volume；单位可以是 m、kg、s、英镑、$\\mathrm{m^2}$ 和 $\\mathrm{m^3}$。单位要与量相配，也要适合实际尺度。',
        '标准单位不等于“所有单位都属于 SI 基本单位”。米、千克、秒是 SI 基本单位；分钟、小时、升和货币单位也常出现在题目中。质量用 kg 或 g，重力是力，要用 N，不能把两者当作可直接互换的单位。英国货币中 1 英镑 = 100 便士，因此 75 便士 = 0.75 英镑。',
        '复合单位 compound unit 由单位相乘或相除得到。$\\mathrm{m/s}$ 与 $\\mathrm{m\\,s^{-1}}$ 都表示“每秒多少米”；指数 $-1$ 表示这个单位在分母，不表示数值为负。把“每千克 4 英镑”读成“4 英镑 ÷ 1 千克”，就能判断该乘质量还是除质量。',
      ],
      rules: [
        {
          title: '速度 speed：路程 ÷ 时间',
          text: '平均速度 $v=\\dfrac{d}{t}$，其中 $d$ 是总路程，$t$ 是整个行程的总用时；相应地 $d=vt$、$t=d/v$。若用 m 和 s，答案单位就是 $\\mathrm{m/s}$。例如 90 m 用时 12 s，平均速度为 $7.5\\,\\mathrm{m/s}$。分段行程也先分别加总路程和时间。',
        },
        {
          title: '工资率 rate of pay：报酬 ÷ 工作时间',
          text: '固定时薪下，报酬 = 时薪 × 工时。每小时 12 英镑，工作 2 小时 15 分钟，工时是 $2+15/60=2.25$ 小时，因此报酬为 $12\\times2.25=27$ 英镑。若题目给出加班费、最低收费或分段费率，要先分段计算。',
        },
        {
          title: '单价 unit pricing：价格 ÷ 数量',
          text: '比较商品时，要把“每多少”统一。600 g 售价 2.40 英镑，相当于 $2.40/0.6=4$ 英镑/kg；另一包 1 kg 售价 3.80 英镑，后者每千克便宜。单价 × 购买数量 = 总价，但必须保证数量的单位与单价分母一致。',
        },
        {
          title: '密度 density：质量 ÷ 体积',
          text: '密度 $\\rho=\\dfrac{m}{V}$，所以 $m=\\rho V$、$V=m/\\rho$。例如 720 g 材料占 $300\\,\\mathrm{cm^3}$，密度是 $2.4\\,\\mathrm{g/cm^3}$。密度描述每单位体积含多少质量；“更重”本身不足以判断密度更大，还要看体积。',
        },
        {
          title: '压强 pressure：垂直于表面的力 ÷ 面积',
          text: '平均压强 $p=\\dfrac{F}{A}$，所以 $F=pA$。$1\\,\\mathrm{Pa}=1\\,\\mathrm{N/m^2}$。例如 72 N 均匀作用在 $30\\,\\mathrm{cm^2}$ 上，压强为 $2.4\\,\\mathrm{N/cm^2}$；若要求 Pa，必须把面积换成 $\\mathrm{m^2}$ 后再算。相同的力作用在更小面积上，压强更大。',
        },
        {
          title: '用单位检查公式',
          text: '“密度 × 体积”的单位是 $(\\mathrm{kg/m^3})\\times\\mathrm{m^3}=\\mathrm{kg}$，符合质量；“速度 ÷ 时间”的单位是 $\\mathrm{m/s^2}$，不能作为路程。单位不匹配说明关系有误；单位匹配只是必要检查，仍需确认题意与数值。',
        },
      ],
      pitfalls: [
        '2 小时 15 分钟不是 2.15 小时：分钟是六十进制，小数小时是十进制。',
        '比较工资率或商品单价时，先统一分母单位；每分钟、每小时，以及每 100 g、每 kg，不能直接比较数值。',
        '密度的分母是体积，压强的分母是面积；$\\mathrm{g/cm^3}$、$\\mathrm{N/cm^2}$ 和 Pa 是不同的单位写法，不能只删改单位标签。',
        '不要默认把各段速度直接取算术平均；各段用时相等时可以这样算，其余情况应回到总路程与总时间。',
      ],
      sourceIds: ['uat-spec', 'uat-maths1-guide', 'openstax-units'],
      visual: 'maths-units',
      examFocus: {
        goal: '把“每单位多少”翻成除法；平均速度始终从总路程和总时间出发。',
        pastPaperSummary:
          '本地2016—2023年度题把复合单位放进材料质量、分段路程、比赛速度与燃料费用中，关键是确定分母对应哪个总量。',
        pastPaperPatterns: [
          {
            form: '速度不同，用时权重也不同',
            description: '给定上、下坡平均速度或多阶段训练，先求每段用时；等距离不能直接平均速度。',
            reference: '2022 NSAA、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q012', 'NSAA_2023_S1-Q011'],
          },
          {
            form: '单位连接几何与材料',
            description: '先求空心管或比例模型的实际体积，再乘密度得到质量；空腔不计材料质量。',
            reference: '2017 ENGAA、2018 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q027', 'ESAT_LEGACY_2018_ENGAA_Q13'],
          },
          {
            form: '不同单位的费用与运动',
            description: '燃料题用距离÷每升行驶距离；同一时刻的赛跑用路程比对应速度比。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q019', 'ESAT_LEGACY_2021_NSAA_Q018'],
          },
        ],
        examples: [
          {
            title: '上、下坡的平均速度为什么不能直接平均？',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q012',
              why: '==先加总路程与时间，再求平均；单位一致以后才能相除。==',
            },
            question: '',
            answer: 'C',
            steps: [
              '上坡40分钟是 $2/3$ 小时，所以单程距离为 $12\\times2/3=8$ km。',
              '往返总路程16 km，全程平均15 km/h，总时间为 $16/15$ 小时，即64分钟。',
              '下坡用时 $64-40=24$ 分钟，即 $2/5$ 小时；速度为 $8\\div(2/5)=20$ km/h。',
              '检验：较慢的上坡占更多时间，所以全程15 km/h低于两段速度的算术平均16 km/h。',
            ],
            takeaway: '==先加总路程与时间，再求平均；单位一致以后才能相除。==',
          },
        ],
        checklist: [
          '能由单位写出速度、密度、压强和单价关系。',
          '能解释为何等距离的两段速度不能直接平均。',
          '结果既有数值也有与题目一致的单位。',
        ],
      },
    },
    {
      code: '110102',
      title: '单位换算',
      summary: '把换算写成能约去单位的乘法；面积平方、体积立方，复合单位逐项换。',
      paragraphs: [
        '换算可以看成“换尺子”：用厘米测量同一根长 2 m 的绳子，需要 200 个厘米。量没有变，只是单位缩小为原来的 $1/100$，数值扩大到 100 倍。先判断结果应该变大还是变小，再动笔计算，可抓出很多方向错误。',
        '最稳妥的工具是换算因子 conversion factor。由于 $1\\,\\mathrm{m}=100\\,\\mathrm{cm}$，分式 $\\dfrac{1\\,\\mathrm{m}}{100\\,\\mathrm{cm}}$ 的值为 1。于是 $250\\,\\mathrm{cm}\\times\\dfrac{1\\,\\mathrm{m}}{100\\,\\mathrm{cm}}=2.5\\,\\mathrm{m}$。把旧单位放到能够约去的位置，方向就由单位决定了。',
        '这套方法也适用于字母：若速度的数值为 $x$，单位为 $\\mathrm{cm/min}$，则 $x\\,\\mathrm{cm/min}=\\dfrac{x}{6000}\\,\\mathrm{m/s}$，因为长度要除以 100，时间分母中的 1 分钟要换成 60 秒。字母不改变换算因子。',
      ],
      rules: [
        {
          title: '前缀 prefixes：先还原成 10 的幂',
          text: '需要熟悉 nano（n）$10^{-9}$、micro（$\\mu$）$10^{-6}$、milli（m）$10^{-3}$、centi（c）$10^{-2}$、deci（d）$10^{-1}$、kilo（k）$10^3$、mega（M）$10^6$、giga（G）$10^9$。例如 $5\\,\\mathrm{mm}=5\\times10^{-3}\\,\\mathrm{m}$；作为前缀时 m 是 milli，M 是 mega，大小写不能混用。单独的 m 则是米的单位符号。',
        },
        {
          title: '长度与质量：记住关键等式',
          text: '$1\\,\\mathrm{km}=1000\\,\\mathrm{m}$，$1\\,\\mathrm{m}=100\\,\\mathrm{cm}=1000\\,\\mathrm{mm}$；$1\\,\\mathrm{t}=1000\\,\\mathrm{kg}$，$1\\,\\mathrm{kg}=1000\\,\\mathrm{g}$，$1\\,\\mathrm{g}=1000\\,\\mathrm{mg}$。例如 $0.045\\,\\mathrm{kg}=45\\,\\mathrm{g}=45000\\,\\mathrm{mg}$。这里 t 表示公吨 tonne。',
        },
        {
          title: '时间：分钟和小时不走十进制',
          text: '$1\\,\\mathrm{min}=60\\,\\mathrm{s}$，$1\\,\\mathrm{h}=60\\,\\mathrm{min}=3600\\,\\mathrm{s}$，$1\\,\\mathrm{day}=24\\,\\mathrm{h}$，1 周 = 7 天，1 年 = 12 个月。月份天数不固定；平年 365 天，闰年 366 天，应结合题意换算。例如 $1.4\\,\\mathrm{h}=1\\,\\mathrm{h}+0.4\\times60\\,\\mathrm{min}$，即 1 小时 24 分钟。',
        },
        {
          title: '面积与体积：换算因子也要乘方',
          text: '边长 1 m 的正方形，换成厘米后是 $100\\times100$ 个 $1\\,\\mathrm{cm^2}$，所以 $1\\,\\mathrm{m^2}=10000\\,\\mathrm{cm^2}$。立方体多一个方向，所以 $1\\,\\mathrm{m^3}=1000000\\,\\mathrm{cm^3}$。一般地，长度换算因子为 $k$，面积为 $k^2$，体积为 $k^3$。例如 $0.08\\,\\mathrm{m^2}=800\\,\\mathrm{cm^2}$。',
        },
        {
          title: '容量 capacity：升与立方单位接起来',
          text: '$1\\,\\mathrm{L}=1\\,\\mathrm{dm^3}=1000\\,\\mathrm{cm^3}$，$1\\,\\mathrm{mL}=1\\,\\mathrm{cm^3}$，$1\\,\\mathrm{m^3}=1000\\,\\mathrm{L}$。因此 $2.5\\,\\mathrm{L}=2500\\,\\mathrm{cm^3}=0.0025\\,\\mathrm{m^3}$。L 已经是体积单位，不要再对 L 与 mL 的 1000 倍关系取立方。',
        },
        {
          title: '复合单位：分子、分母分别换',
          text: '$54\\,\\mathrm{km/h}=\\dfrac{54000\\,\\mathrm{m}}{3600\\,\\mathrm{s}}=15\\,\\mathrm{m/s}$；所以 km/h 转 m/s 除以 3.6，反向乘以 3.6。$1\\,\\mathrm{g/cm^3}=\\dfrac{0.001\\,\\mathrm{kg}}{0.000001\\,\\mathrm{m^3}}=1000\\,\\mathrm{kg/m^3}$。$1\\,\\mathrm{N/cm^2}=10000\\,\\mathrm{Pa}$，因为分母 $1\\,\\mathrm{cm^2}=0.0001\\,\\mathrm{m^2}$。',
        },
        {
          title: '工资与价格换算：分母变大，单位时间或数量内的总额也变大',
          text: '0.20 英镑/min = 12 英镑/h：一小时有 60 分钟，应乘 60。30 便士/100 g = 3 英镑/kg：1 kg 有十份 100 g，先得 300 便士，再换成英镑。若单价为 $c$ 便士/100 g，则相当于 $c/10$ 英镑/kg。',
        },
      ],
      visual: 'maths-units',
      pitfalls: [
        '从 $\\mathrm{m^2}$ 到 $\\mathrm{cm^2}$ 要乘 $100^2$，从 $\\mathrm{m^3}$ 到 $\\mathrm{cm^3}$ 要乘 $100^3$；只乘 100 会漏掉维度。',
        '“大单位换小单位，数值变大”可直接用于单个量；复合单位要拆开分子、分母判断，不能套在整串单位上。',
        '$1\\,\\mathrm{L}=1000\\,\\mathrm{mL}$ 是容量换算；$1\\,\\mathrm{kg}$ 液体不一定是 $1\\,\\mathrm{L}$，质量与体积之间还需要密度。',
        '不要按英里、英尺、英寸的名字猜换算因子；遇到非公制单位，要使用题目给出的对应关系，并保留题目要求的精度。',
      ],
      sourceIds: ['uat-spec', 'uat-maths1-guide', 'bipm-prefixes', 'openstax-units'],
      examFocus: {
        goal: '把换算写成能约去单位的乘法；面积平方、体积立方，复合单位逐项换。',
        pastPaperSummary:
          '相关题既有纯数值的米/千米、分钟/小时，也有代数形式的英里/千米和便士/英镑；体积换算常与相似比及密度一起出现。',
        pastPaperPatterns: [
          {
            form: '距离、时间逐项统一',
            description: '每一阶段距离与速度用同一单位；分段求时间后累加，别把米直接除以km/h。',
            reference: '2022 NSAA、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q012', 'NSAA_2023_S1-Q011'],
          },
          {
            form: '代数换算保持单位链',
            description:
              '用题给的“1千米等于x英里”反推总千米数，再按每升公里数和每升便士数逐步转换。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q019'],
          },
          {
            form: '体积单位与长度比例同时变化',
            description: '模型体积先除以长度比例的立方，再把m³化为cm³，使体积与密度分母匹配。',
            reference: '2018 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q13'],
          },
        ],
        examples: [
          {
            title: '英里、公里、升、便士：让单位沿途消掉',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q019',
              why: '==先写换算等式，再沿单位链约去；不凭“换大换小”的口令猜方向。==',
            },
            question: '',
            answer: 'H',
            steps: [
              '题目给的是 $1\\,\\mathrm{km}=x\\,\\mathrm{miles}$，所以m英里的路程为 $m/x$ km，而不是mx。',
              '每升行驶f km，所需燃料为 $(m/x)/f=m/(xf)$ L。',
              '乘每升p便士，得到 $mp/(xf)$ 便士；再除100，得到 $mp/(100xf)$ 英镑。',
              '检查分母：每升能走更远或每公里折合的英里更多，总费用应降低；f、x都应在分母。',
            ],
            takeaway: '==先写换算等式，再沿单位链约去；不凭“换大换小”的口令猜方向。==',
          },
        ],
        checklist: [
          '能正确换算平方与立方单位。',
          '知道分钟换小时要除60。',
          '能将代数换算因子放到正确的分子或分母。',
        ],
      },
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
      note: '官方知识范围与术语参考；中文讲解为教学整理，例题和自测来自现有年度诊断题或独立试题库。',
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
