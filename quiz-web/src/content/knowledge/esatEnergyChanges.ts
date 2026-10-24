// ESAT 第十一章能量变化讲义：以体系、能级差和反应计量统一热效应、量热与键能计算。
import type { KnowledgeLesson, KnowledgeExamFocus } from './types'

const calorimetryPatterns: NonNullable<KnowledgeExamFocus['pastPaperPatterns']> = [
  {
    form: '燃烧加热：摩尔燃料与温升互推',
    description:
      '将燃料质量转换为放热量，再求被加热物的最终温度；或从目标温升倒推燃料质量，并处理非 100% 热传递效率。',
    reference: '2021、2023 NSAA',
    sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q054', 'NSAA_2023_S1-Q055'],
  },
  {
    form: '中和量热：混合质量、限量与温差',
    description:
      '把两份溶液的总质量用于 mcΔT，用实际反应摩尔数求摩尔焓变；温度峰值或外推图确定反应热，过量试剂不能作为分母。',
    reference: '2020—2022 NSAA',
    sourceCodes: [
      'ESAT-2020-CHEMISTRY-017',
      'ESAT_LEGACY_2021_NSAA_Q045',
      'ESAT_LEGACY_2022_NSAA_Q057',
    ],
  },
]
const bondPatterns: NonNullable<KnowledgeExamFocus['pastPaperPatterns']> = [
  {
    form: '用已知反应热反推未知键能',
    description:
      '乙烯水合、合成氨或乙烯加氢中，列反应物断键和产物成键，先约去相同项，再求 C—O、N≡N 或 C—H 键能。',
    reference: '2016、2017、2023 NSAA',
    sourceCodes: ['NSAA_2016_S1-Q054', 'NSAA_2017_S1-Q049', 'NSAA_2023_S1-Q050'],
  },
  {
    form: '从完整键数计算焓变',
    description:
      '按配平式统计全部键数，尤其注意 NH₃ 每分子三根 N—H、水每分子两根 O—H，最后用断键减成键判断吸放热。',
    reference: '2019、2021 NSAA',
    sourceCodes: ['NSAA_2019_S1-Q053', 'ESAT_LEGACY_2021_NSAA_Q055'],
  },
]

export const esatEnergyChanges: KnowledgeLesson = {
  code: '141100',
  title: 'Energetics · 能量变化',
  subtitle: '先定体系，再看两端；量热用 mcΔT，键能用断键减成键',
  intro:
    '温度上升是周围吸热，放热符号却属于反应体系。把这个观察方向统一后，能级图、逆反应、燃烧量热和键能都会落回同一套能量收支。',
  memory: [
    '**反应放热，体系 ΔH < 0，周围通常升温。**吸热方向相反。',
    '**逆转反应变号，方程倍乘则焓变同倍乘。**必须保留物态与反应量基准。',
    '**峰顶减起点是 Eₐ，终点减起点是 ΔH。**催化只改路径与能垒。',
    '**q = mcΔT：m 是被测温物体的质量。**先算焦耳，再按反应摩尔数换成 kJ/mol。',
    '**断键吸热、成键放热：ΔH ≈ Σ断键 − Σ成键。**每一种键乘上实际键数。',
  ],
  sections: [
    {
      code: '141101',
      title: '放热与吸热反应',
      summary: '同一份热，从反应看是流出，从周围看是流入；先明确你站在哪一边。',
      paragraphs: [
        '把参与反应的物质视为体系，把水、溶液、容器和空气视为周围。放热反应把能量转移到周围，体系焓降低，ΔH 为负；吸热反应从周围吸收能量，体系焓升高，ΔH 为正。温度计测到的通常是周围的温度变化，不是直接显示 ΔH 的符号。',
        '燃烧和许多中和反应放热；许多热分解过程需要持续供热。反应需要点火不说明总体吸热：火焰首先帮助粒子越过能垒，之后反应可以净释放能量。是否易启动和总体吸放热是两个维度。',
        '能量图上，产物低于反应物是放热，产物高于反应物是吸热。决定 ΔH 的只有两端差，不是峰顶有多高、图画得多宽，也不是曲线面积。放热越多不自动等于反应越快。',
        '在实验中，外部加热、散热、蒸发和容器吸热会影响温度读数。因此“温度上升说明这份周围吸热”可靠，但把读数直接当成无损反应热，需要题目给出的近似条件。混合后温度降低也要结合体系是否有外部散热解释。',
      ],
      rules: [
        {
          title: '符号从反应体系出发',
          text: '恒压、只考虑体积功时，反应焓变对应体系吸收的热。放热负，吸热正。',
        },
        {
          title: '能量守恒',
          text: '理想绝热量热装置中，$q_{reaction}+q_{surroundings}=0$。水升温时 q水 为正，q反应 为负。',
        },
        {
          title: '图像看端点',
          text: '$\\Delta H=H_{products}-H_{reactants}$，不包含从起点到峰顶再下降的“路程”。',
        },
        {
          title: '热量和产量',
          text: '固定反应条件下释放的总热量随实际反应量变化；限制试剂耗尽后再加过量另一试剂，不继续按同一比例放热。',
        },
      ],
      pitfalls: [
        '看到温度升高就写 ΔH > 0。',
        '把需要点燃判为吸热反应。',
        '认为催化剂让放热反应放出更多总热。',
      ],
      sourceIds: ['openstax-enthalpy'],
      visual: 'energy-changes',
      examFocus: {
        goal: '把温度观察和能级方向正确翻译为体系热效应。',
        pastPaperSummary:
          '相关真题以中和温度曲线、金属置换放热平台、燃烧热和带符号能垒信息为主；通常与反应量或限量条件一起出现。',
        pastPaperPatterns: [
          {
            form: '温升平台与限制试剂',
            description:
              '锌与硝酸银反应的温升随加入金属增加后不再增大，用平台转折反推出反应物恰好耗尽的位置。',
            reference: '2017 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q051'],
          },
          ...calorimetryPatterns,
          {
            form: '由负焓变识别放热能级关系',
            description: '给定放热反应与活化能，逆向能垒必须从较低的产物能级计算。',
            reference: '2016 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q048'],
          },
        ],
        examples: [
          {
            title: '两张能量图，三条判断',
            source: {
              kind: 'bank',
              subject: 'chemistry',
              questionCode: 'CHEM-MOCK-ADAPT-E02-023-R8-FINAL-20260818',
              why: '直接用端点位置比较放热、吸热，并排除催化改变焓变。',
            },
            question: '',
            answer: 'E · I 和 II。',
            steps: [
              'X 图中产物低于反应物，终点减起点为负，I 正确。',
              'Y 图中产物高于反应物，体系净吸热，II 正确。',
              '催化剂不改变反应物、产物能级，因此 X 的 ΔH 不会变得较不负，III 错误。',
              '真值组合为真、真、假，选 E。',
            ],
            takeaway: '==两端决定吸放热，峰顶决定门槛。==',
          },
        ],
        checklist: [
          '能解释体系与周围的相反热量符号。',
          '能从端点判断吸放热。',
          '能区分放热、启动能量和反应速率。',
        ],
      },
    },
    {
      code: '141102',
      title: '可逆反应能量方向',
      summary: '正反方向交换，能量收支变号；升温偏向吸热方向，不代表所有产物都增多。',
      paragraphs: [
        '若 A → B 在相同状态和相同反应量下释放能量，B → A 就需要吸收等量能量。因此逆反应 ΔH 与正反应大小相同、符号相反；反应式全部乘二时，所对应焓变也乘二。必须确认题目“每摩尔”指的是哪一种物质或所写反应。',
        '对达到平衡的体系，升温使平衡向吸热方向移动，降温使其向放热方向移动。若正向为放热，升温虽通常加快达到平衡的过程，却降低正向产物的平衡比例。必须把快慢与最终组成分别作答。',
        '气体平衡加压通常有利于气体摩尔数较少的一侧；若两侧气体总系数相同，压强变化对平衡组成可无影响，但碰撞更频繁仍可能使反应更快。这里气体的总系数与 ΔH 的符号是两项独立信息。',
        '催化剂让正逆反应更快，并不改变平衡常数或平衡位置。题目问平衡产物量，不能按反应“加快”就说“产物增加”。若反应并未完全转化，总放热应按实际已反应量或生成量计算，而不是按最初加入量。',
      ],
      rules: [
        {
          title: '逆转与倍乘',
          text: '$\\Delta H_{reverse}=-\\Delta H_{forward}$。倍乘方程时同步倍乘 ΔH，物态改变则不能直接照用原数值。',
        },
        {
          title: '温度判断顺序',
          text: '先圈出哪一个方向吸热，再决定升温使哪边增加，最后独立判断反应速率。',
        },
        {
          title: '按实际反应量算热',
          text: '若每 1 mol O₂ 反应放热 116 kJ，但平衡时仅生成 z mol NO₂，且 O₂:NO₂ = 1:2，则放热为 58z kJ。',
        },
        {
          title: '平衡不是停止',
          text: '平衡时正逆速率相等而非都为零；催化剂加快两方向，不改变原有平衡组成。',
        },
      ],
      pitfalls: [
        '升温总使“产物更多”，忘记正反应可能放热。',
        '把初始加入量当成可逆反应实际转化量。',
        '认为催化剂只加快正反应而推动平衡。',
      ],
      sourceIds: ['openstax-enthalpy', 'openstax-equilibrium'],
      visual: 'energy-changes',
      examFocus: {
        goal: '将热效应、速率和气体计量作为三条独立约束联合筛选。',
        pastPaperSummary:
          '真题通过温压改变后的速率与平衡产率反推反应式；也直接考催化是否改变平衡，以及按实际生成量计算释放的热。',
        pastPaperPatterns: [
          {
            form: '由温压变化反推反应方向',
            description:
              '升温同时加快反应并提高平衡产率，说明正向吸热；加压不改平衡产率说明两侧气体总系数相等。也可能将两个热效应相反的反应并列判断。',
            reference: '2016、2017 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q040', 'NSAA_2017_S1-Q040'],
          },
          {
            form: '平衡变化与实际反应热',
            description:
              '区分温度、浓度和催化剂的作用；放热量按达到平衡时的实际生成物数量计算，不能默认反应完全。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q38', 'ESAT_LEGACY_2018_NSAA_Q54'],
          },
        ],
        examples: [
          {
            title: '速度增加，产率不变，哪些条件可以同时成立？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2016_S1-Q040',
              why: '同题拆开热效应与气体总系数，不凭某一句就选答案。',
            },
            question: '',
            answer: 'C。',
            steps: [
              '升温使平衡产率增加，说明生成 R、S 的正向为吸热，ΔH 必须为正。',
              '压强增大使反应更快但不改变平衡产率，说明反应式两侧气体总摩尔系数相等。',
              'A 的气体数 4→5，B 为 4→3，不能满足压强条件。',
              'C 为 P + 2Q ⇌ 2R + S，两侧都是 3 份气体且 ΔH 为正，因此选 C。',
            ],
            takeaway: '==先用温度定热方向，再用压强定气体数。==',
          },
        ],
        checklist: [
          '能变换逆反应与倍乘反应的焓变。',
          '能分开判断速度和产率。',
          '能按平衡实际转化量计算总热。',
        ],
      },
    },
    {
      code: '141103',
      title: '能级图',
      summary: '把起点、每个峰、每个中间谷和终点标清，所有能量都是两层之间的差。',
      paragraphs: [
        '能级图的纵轴为能量，横轴为反应进程，不是时间。反应物和产物的水平高度表示相对能量；峰顶表示路径中的高能过渡状态。图的横向宽度不能告诉你反应用了几秒。',
        '单步图中，正向活化能从反应物量到峰顶，逆向从产物量到峰顶，反应焓只取产物减反应物。画图时可以自行选择零点，但换零点不会改变这些差值。',
        '多步图中，每一步的活化能必须从该步的起始物或中间体能级量到该步峰顶。例如第二步应从中间谷出发，不能仍从最初反应物或整张图的零点开始。中间体是谷，过渡状态是峰，两者不是同一个东西。',
        '加入催化剂后的路径可以有不同的峰数或更低的有效能垒，但若总体反应及物态相同，起点、终点和 ΔH 不变。比较能量图时先检查两端是否相同，再比较能垒，避免把完全不同反应误当成催化前后。',
      ],
      rules: [
        { title: '横轴不是时间', text: '用图求能量差，不从峰的位置或宽度直接读反应时间。' },
        {
          title: '分步从本步起点量',
          text: '$E_{a,2}=E_{peak,2}-E_{intermediate}$；第二个峰虽更低，仍需检查中间体的基准。',
        },
        {
          title: '总焓变与路径无关',
          text: '同样反应物、产物及物态，ΔH 为两端能级差，分成多步不重复计算峰的升降。',
        },
        {
          title: '催化对比核对项',
          text: '反应物高度不变、产物高度不变、门槛降低；净能量变化保持。',
        },
      ],
      pitfalls: [
        '把第二步活化能量自第一步反应物。',
        '把峰顶叫作稳定中间体。',
        '把曲线面积或横轴长度当作 ΔH 或反应时间。',
      ],
      sourceIds: ['openstax-collision', 'openstax-catalysis'],
      visual: 'energy-changes',
      examFocus: {
        goal: '用正确能级差解读单步、多步及催化路径。',
        pastPaperSummary:
          '年度题直接提供反应热和活化能来考能级差关系；本地年度题中未发现直接要求比较两步能级图的题，因此两步图使用现有试题库补充，不计为历年独立考法。',
        pastPaperPatterns: [
          {
            form: '从数值重建正逆能级差',
            description:
              '给 ΔH 和正向 Eₐ，确定产物相对位置，再求逆向活化能；本质是能级图的三个垂直距离。',
            reference: '2016 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q048'],
          },
        ],
        pastPaperNote: '多步能级与催化图作为知识迁移练习，以下精选来源明确标记为试题库。',
        examples: [
          {
            title: '两座峰，要从两个不同的起点量',
            source: {
              kind: 'bank',
              subject: 'chemistry',
              questionCode: 'CHEM-MOCK-ADAPT-E04-024-R8-FINAL-20260818',
              why: '原图包含两步路径，能检验是否把中间体作为第二步的基准。',
            },
            question: '',
            answer: 'H · I、II、III 都正确。',
            steps: [
              '第一步起点 40、峰顶 110，Eₐ₁ = 110 − 40 = 70。',
              '第二步起点是中间体 65，不是 40；Eₐ₂ = 95 − 65 = 30，所以 I 正确。',
              '产物 20 低于反应物 40，总 ΔH = −20，反应放热，II 正确。',
              '催化可降低能垒而不改变两端差，III 正确；三个判断都成立，选 H。',
            ],
            takeaway: '==每一步用自己的起点，总焓变只看最初和最后。==',
          },
        ],
        checklist: [
          '能识别峰和中间谷。',
          '能分别计算每步活化能。',
          '能判断催化图有没有错误改变两端。',
        ],
      },
    },
    {
      code: '141104',
      title: '量热能量变化',
      summary: '水或溶液先算吸收多少热，再按效率与实际反应量还原反应焓。',
      paragraphs: [
        '量热的起点是 $q=mc\\Delta T$。m 是被测温的水或溶液质量，c 是同一种物质的比热容，ΔT 是末温减初温。若题目已经说“温度升高 60°C”，60 就是 ΔT，不应再减去初温。',
        'J/(g·°C) 要搭配 g，kJ/(kg·K) 要搭配 kg；温差 1°C 与 1 K 的数值相同。求出 q 后，若题目要求 kJ/mol，先把 J 除以 1000，再除以实际反应的摩尔数，并按反应体系补上符号。',
        '燃烧加热水时，水吸收的热只是燃料释放热的一部分。若效率为 η，q水 = η × q燃料释放；由目标温升倒推燃料时，应除以 η。效率小于 1 时，需要的燃料更多，这是检查乘除方向的好方法。',
        '混合酸碱量热时，若题目给密度近似 1 g/cm³，m 通常为两份溶液总体积对应的总质量，而不是仅酸或仅碱。分母 n 则取限制试剂所对应的实际反应量。容器吸热和向空气散热若未计入，常使由温升估计的放热绝对值偏小。',
      ],
      rules: [
        {
          title: '四步书写',
          text: '温差 → 周围吸热 q → 实际反应摩尔数 n → ΔH。不要把总热量 kJ 写成 kJ/mol。',
        },
        {
          title: '效率反推',
          text: '$q_{released}=q_{water}/\\eta$。效率用 0.80，不用 80 直接参与乘除。',
        },
        {
          title: '中和焓符号',
          text: '若溶液升温且假设热量全被溶液吸收，$\\Delta H=-mc\\Delta T/n$，再按单位换算。',
        },
        { title: '最终温度', text: '若问末温，先求温升，再加初温；若问温升，不能重复加初温。' },
      ],
      pitfalls: [
        '把温升 60°C 误算成 60 − 12。',
        '用燃料质量替代被加热水的质量。',
        '效率反推时乘 0.8，或中和焓分母用过量试剂。',
      ],
      sourceIds: ['openstax-calorimetry'],
      visual: 'energy-changes',
      examFocus: {
        goal: '同时对齐测温对象、反应摩尔数、效率与单位。',
        pastPaperSummary:
          '量热真题涵盖燃料质量与温升互推、中和温度图外推，以及有限试剂决定的摩尔焓变。数值不复杂，主要考质量与热量的归属。',
        pastPaperPatterns: calorimetryPatterns,
        examples: [
          {
            title: '只有 80% 热量进入水，需要烧多少甲醇？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2023_S1-Q055',
              why: '同时检验温升表述、传热效率和燃料摩尔质量。',
            },
            question: '',
            answer: 'D · 2.00 g。',
            steps: [
              '题目要求水温升高 60°C，故 ΔT = 60°C；初温 12°C 不需要再次相减。',
              '150 g 水吸热 q = 150 × 4 × 60 = 36000 J = 36 kJ。',
              '这只是甲醇放热的 80%，甲醇须释放 36/0.80 = 45 kJ。',
              '甲醇为 45/720 = 0.0625 mol，质量为 0.0625 × 32 = 2.00 g，选 D。',
            ],
            takeaway: '==水需要多少热先算清；有损传热再向上补足燃料。==',
          },
        ],
        checklist: [
          '能区分初温、末温和温升。',
          '能解释效率反推为何用除法。',
          '能在中和量热中选择正确 m 和 n。',
        ],
      },
    },
    {
      code: '141105',
      title: '键能计算',
      summary: '先数每一侧的键，再做断键减成键；相同键可抵消，但不能漏掉系数。',
      paragraphs: [
        '断开化学键需要吸收能量，形成化学键释放能量。平均键能通常是气相中一摩尔特定类型键断裂所需能量的平均值，因此是正数。放热来自成键释放超过断键吸收，不是因为“断键释放能量”。',
        '计算反应焓近似用 Σ反应物断键能 − Σ产物成键能。先写配平方程并画出必要的结构，每种键数等于分子内键数乘化学计量系数。2NH₃ 含 6 根 N—H，不是 2 根；H₂O 含 2 根 O—H。',
        '两侧完全相同的键能项可以在代数上抵消，减少运算；但双键变单键时，C=C 与 C—C 是不同数据，不能把双键看成两根相同的单键随意替代。涉及未知键能时先设 x，保留其系数，最后再求解。',
        '平均键能是估算工具，不等于某一个分子中特定键的精确断裂能。题目给定物态和数据应优先使用；若水产物从气态改成液态，额外相变热不能由气相 O—H 平均键能自动包含。算完后检查符号与题目“释放”“吸收”的描述一致。',
      ],
      rules: [
        {
          title: '总公式',
          text: '$\\Delta H\\approx\\sum D(\\text{broken})-\\sum D(\\text{formed})$。断键项加，成键项减。',
        },
        {
          title: '先数后代',
          text: '列“键类型—每分子数量—方程系数—总数”四项，再代数据，避免只看化学式下标。',
        },
        {
          title: '约去相同项',
          text: '乙烯加氢中，两侧共有的 4 根 C—H 可抵消，净变化为断 1 C=C、1 H—H，成 1 C—C、2 C—H。',
        },
        {
          title: '逆算未知量',
          text: '把未知键能写成 x，使用带符号的 ΔH 建式；求得键能应为合理的正值，负值常提示符号或键数错误。',
        },
      ],
      pitfalls: [
        '断键写成放热。',
        '合成两分子 NH₃ 只数两根 N—H。',
        '把双键当两根单键，或忽略“每摩尔反应”的基准。',
      ],
      sourceIds: ['openstax-bond-energy'],
      visual: 'energy-changes',
      examFocus: {
        goal: '从结构和反应系数建立能量等式，独立检查未知键数。',
        pastPaperSummary:
          '历年题既正向求反应焓，也逆向求某类键能；常使用乙烯水合、加氢、合成氨和甲烷与水反应，核心始终是完整键数与断减成。',
        pastPaperPatterns: bondPatterns,
        examples: [
          {
            title: '乙烯加氢，未知 C—H 键能前为什么是 2？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2023_S1-Q050',
              why: '以真实加成反应训练键的抵消和未知量系数。',
            },
            question: '',
            answer: 'F · 415 kJ/mol。',
            steps: [
              '乙烯与乙烷共有的 4 根 C—H 在两侧抵消。净断开 1 根 C=C 和 1 根 H—H。',
              '净形成 1 根 C—C 和 2 根 C—H；令 C—H 键能为 x。',
              '按断减成：−150 = 600 + 430 − (350 + 2x)。',
              '整理得 2x = 830，x = 415 kJ/mol，选 F。830 是两根键的总能量，不是单根平均键能。',
            ],
            takeaway: '==约去旧键，数清新键，再用带符号的焓变解方程。==',
          },
        ],
        checklist: [
          '能说明断键和成键各自的能量方向。',
          '能正确统计配平式中的键数。',
          '能计算反应焓并反求未知平均键能。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-energy',
      title: 'UAT-UK · ESAT Content Specification — C11',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对吸放热符号、可逆方向、能级图、比热量热及键能计算。',
    },
    {
      id: 'openstax-enthalpy',
      title: 'OpenStax · Enthalpy',
      url: 'https://openstax.org/books/chemistry-2e/pages/5-3-enthalpy',
      note: '核对反应方向、符号与反应量基准；真题步骤按实际题目独立复算。',
    },
    {
      id: 'openstax-equilibrium',
      title: 'OpenStax · Shifting equilibria',
      url: 'https://openstax.org/books/chemistry-2e/pages/13-3-shifting-equilibria-le-chateliers-principle',
      note: '核对温度、压强和催化剂对平衡的不同作用。',
    },
    {
      id: 'openstax-collision',
      title: 'OpenStax · Collision theory',
      url: 'https://openstax.org/books/chemistry-2e/pages/12-5-collision-theory',
      note: '核对活化能与能级基准。',
    },
    {
      id: 'openstax-catalysis',
      title: 'OpenStax · Catalysis',
      url: 'https://openstax.org/books/chemistry-2e/pages/12-7-catalysis',
      note: '核对催化路径不改变总体反应焓。',
    },
    {
      id: 'openstax-calorimetry',
      title: 'OpenStax · Calorimetry',
      url: 'https://openstax.org/books/chemistry-2e/pages/5-2-calorimetry',
      note: '核对热容、量热及体系与周围的能量守恒。',
    },
    {
      id: 'openstax-bond-energy',
      title: 'OpenStax · Strengths of ionic and covalent bonds',
      url: 'https://openstax.org/books/chemistry-2e/pages/7-5-strengths-of-ionic-and-covalent-bonds',
      note: '核对平均键能估算的适用边界与断键减成键规则。',
    },
  ],
}
