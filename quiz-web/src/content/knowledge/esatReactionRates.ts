// ESAT 第十章反应速率讲义：用实验变量、曲线斜率和能垒连接宏观读数与微观解释。
import type { KnowledgeLesson, KnowledgeExamFocus } from './types'
import { reactionRateMethods } from './reactionRateMethods'

const rateGraphs: NonNullable<KnowledgeExamFocus['pastPaperPatterns']> = [
  {
    form: '条件变化同时影响斜率和平台',
    description:
      '改浓度时重新判限制试剂；改表面积或催化剂时主要比较速率。气体图像的起始陡峭程度与最终平台必须分别解释。',
    reference: '2016、2017、2020、2022 NSAA',
    sourceCodes: [
      'NSAA_2016_S1-Q044',
      'NSAA_2017_S1-Q048',
      'NSAA_2017_S1-Q053',
      'ESAT-2020-CHEMISTRY-014',
      'ESAT_LEGACY_2022_NSAA_Q046',
    ],
  },
  {
    form: '累计数据换算速率或剩余量',
    description:
      '从气体体积读反应进度，经反应比例换成金属消耗质量；或从逐分钟失重判断累计气体量，不能把总量当该分钟生成量。',
    reference: '2018、2021 NSAA',
    sourceCodes: [
      'ESAT_LEGACY_2018_NSAA_Q50',
      'ESAT_LEGACY_2021_NSAA_Q058',
      'ESAT_LEGACY_2021_NSAA_Q060',
    ],
  },
]
const rateYield: NonNullable<KnowledgeExamFocus['pastPaperPatterns']> = [
  {
    form: '快慢与平衡产量分别判断',
    description:
      '比较升温、加压、催化对初始速率及平衡组成的作用；同一改变可以加快反应却降低某一产物的平衡比例。',
    reference: '2016—2018 NSAA',
    sourceCodes: ['NSAA_2016_S1-Q040', 'NSAA_2017_S1-Q040', 'ESAT_LEGACY_2018_NSAA_Q38'],
  },
]

export const esatReactionRates: KnowledgeLesson = {
  code: '141000',
  title: 'Rates of reaction · 反应速率',
  subtitle: '斜率看快慢，平台看总量，粒子解释要说清变量改变了什么',
  intro:
    '速率题最常见的错误不是公式不会，而是把“更快”“更多”和“更放热”混成一个概念。先用实验量定义速率，再用碰撞与活化能解释快慢，最后单独检查限制试剂和最终产量。',
  memory: [
    '**更陡是更快，更高的平台是更多。**同一曲线上的高度不代表那一刻的速率。',
    '**浓度和气体压力主要影响碰撞频率；升温还增加能量足够的粒子比例。**',
    '**增大固体表面积要在相同用量下比较。**磨碎不增加物质的量。',
    '**催化剂换路径、降能垒，不改反应前后的能量差或平衡常数。**',
    '**平均速率用两点，瞬时速率用切线。**单位写明跟踪的量及时间。',
  ],
  sections: [
    {
      code: '141001',
      title: '影响速率的因素',
      summary: reactionRateMethods['141001']!.summary,
      paragraphs: [reactionRateMethods['141001']!.intro],
      rules: reactionRateMethods['141001']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: reactionRateMethods['141001']!.memory,
      pitfalls: [
        '见粉末就选最快，忘记它可能达不到目标产量。',
        '把加压的作用解释成平均动能增加。',
        '将浓度翻倍自动等同于最终产量或速率翻倍。',
      ],
      sourceIds: ['openstax-rate', 'openstax-collision'],
      visual: 'reaction-rates',
      examFocus: {
        goal: '把变量改变拆成速率与产量两条判断。',
        pastPaperSummary:
          '真题把控制变量、限制试剂、图像和微观理由组合考查；先查够不够量，再讨论快不快。',
        pastPaperPatterns: [
          ...rateGraphs.slice(0, 1),
          ...rateYield,
          {
            form: '压力及粒子身份的解释',
            description:
              '压缩气体比较碰撞频率；盐溶液沉淀比较真正参与反应的离子，不能照搬对应金属的活性趋势。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q041', 'NSAA_2023_S1-Q044'],
          },
        ],
        examples: [
          {
            title: '粉末一定是生成目标气体最快的选择吗？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2017_S1-Q053',
              why: '在多个同时变化的条件中先筛产量，再比较速率。',
            },
            question: '',
            answer: 'C。',
            steps: [
              '目标 8.8 g CO₂ 为 8.8/44 = 0.20 mol，需要 20 g CaCO₃ 和 0.40 mol HCl。',
              'A、D 的碳酸钙只有 10 g；B 的盐酸只有 0.100 × 2.0 = 0.20 mol，均不足。',
              'C 和 E 的两种反应物都够生成目标量，且都使用块状碳酸钙。',
              'C 的酸浓度是 2.0 mol/dm³，E 是 1.0 mol/dm³；在其他相关条件可比时 C 更快，选 C。',
            ],
            takeaway: '==达到目标是资格，比较快慢是下一步。==',
          },
        ],
        checklist: [
          '能控制变量设计速率比较。',
          '能分别计算浓度变化后的总量和限制试剂。',
          '能说明加热和催化加快反应的不同原因。',
        ],
      },
    },
    {
      code: '141002',
      title: '测量反应速率',
      summary: reactionRateMethods['141002']!.summary,
      paragraphs: [reactionRateMethods['141002']!.intro],
      rules: reactionRateMethods['141002']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: reactionRateMethods['141002']!.memory,
      pitfalls: [
        '把前两秒的总生成量直接写成每秒速率。',
        'cm³ 没换成 dm³ 就除以 24。',
        '将质量减少解释为质量不守恒，忽略气体离开测量系统。',
      ],
      sourceIds: ['openstax-rates-definition'],
      visual: 'reaction-rates',
      examFocus: {
        goal: '把仪器读数翻译为指定物质、指定单位的速率。',
        pastPaperSummary:
          '相关真题以体积—时间图和失重表为主，要求区分累计量、分段增量、剩余反应物及平均消耗速度。',
        pastPaperPatterns: [
          rateGraphs[1]!,
          {
            form: '从平台与早期斜率识别样品',
            description:
              '比较不同形态钙样品的气体曲线，先判断粉末对应的快反应，再由气体总量换算样品质量。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q046'],
          },
        ],
        examples: [
          {
            title: '气体图读出的体积，怎样变成镁的 g/s？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'ESAT_LEGACY_2018_NSAA_Q50',
              why: '同时练习读图、摩尔比与速率单位，避免只计算 cm³/s。',
            },
            question: '',
            answer: 'A · 0.012 g/s。',
            steps: [
              '从原图读出前 2 s 共生成 24 cm³ 氢气，即 0.024 dm³。',
              '氢气的量为 0.024/24 = 0.001 mol；Mg 与 H₂ 的摩尔比是 1:1。',
              '因此消耗 Mg 为 0.001 × 24 = 0.024 g。',
              '前两秒平均消耗速率为 0.024/2 = 0.012 g/s，选 A。',
            ],
            takeaway: '==先把累计读数换成目标物质的量，最后除以时间。==',
          },
        ],
        checklist: [
          '能选择适合反应的速率测量方法。',
          '能将气体速率转换为质量消耗速率。',
          '能从累计表计算分段速率。',
        ],
      },
    },
    {
      code: '141003',
      title: '速率图像数据',
      summary: reactionRateMethods['141003']!.summary,
      paragraphs: [reactionRateMethods['141003']!.intro],
      rules: reactionRateMethods['141003']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: reactionRateMethods['141003']!.memory,
      pitfalls: [
        '把最终体积大等同于初始速率快。',
        '按浓度倍数直接放大平台。',
        '把累计气体质量与容器剩余质量的趋势弄反。',
      ],
      sourceIds: ['openstax-rates-definition'],
      visual: 'reaction-rates',
      examFocus: {
        goal: '每次选图都独立核对斜率和平台两条证据。',
        pastPaperSummary:
          '图像题跨年重复考查速率与总量的拆分，并加入单位换算、限制试剂或固体形态，使只看一处特征的选项失效。',
        pastPaperPatterns: rateGraphs,
        examples: [
          {
            title: '浓度翻倍，气体平台为什么不翻倍？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2017_S1-Q048',
              why: '三个实验中限制试剂发生切换，能解释图像平台的非简单倍数。',
            },
            question: '',
            answer: 'D · Q 对应 2，R 对应 5。',
            steps: [
              '三次实验均用 1.2/24 = 0.050 mol Mg，Mg 与 H₂SO₄ 比例为 1:1。',
              'P 的酸为 0.040 mol，酸限制，最终产生 0.040 mol H₂。',
              'Q 的酸为 0.080 mol，改为 Mg 限制，最终为 0.050 mol H₂；初速较快但平台只变为 1.25 倍，对应线 2。',
              'R 的酸为 0.020 mol，初速较慢，平台是 P 的一半，对应线 5。组合选 D。',
            ],
            takeaway: '==斜率由反应条件判断，平台用限制试剂计算。==',
          },
        ],
        checklist: [
          '能从图像读平均与瞬时速率。',
          '能区分容器失重和累计产气图。',
          '能在浓度改变时重新计算平台。',
        ],
      },
    },
    {
      code: '141004',
      title: '碰撞理论',
      summary: reactionRateMethods['141004']!.summary,
      paragraphs: [reactionRateMethods['141004']!.intro],
      rules: reactionRateMethods['141004']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: reactionRateMethods['141004']!.memory,
      pitfalls: [
        '认为所有碰撞都能反应。',
        '恒温加压时说粒子平均动能增加。',
        '解释升温只写碰撞次数，不提能量足够的比例。',
      ],
      sourceIds: ['openstax-collision'],
      visual: 'reaction-rates',
      examFocus: {
        goal: '用正确的微观理由解释指定宏观变化。',
        pastPaperSummary:
          '直接考碰撞理论的真题强调恒温气体压力与碰撞频率；其他题把浓度和表面积隐藏在图像或实验比较中。',
        pastPaperPatterns: [
          {
            form: '恒温压强与碰撞频率',
            description:
              '通过改变容器体积调压，判断低压下反应更慢的原因；“平均动能变小”是典型错误解释。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q041'],
          },
          rateGraphs[0]!,
        ],
        examples: [
          {
            title: '低压反应变慢，是分子能量降低了吗？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2023_S1-Q041',
              why: '在明确恒温条件下排除动能解释，保留数密度解释。',
            },
            question: '',
            answer: 'D。',
            steps: [
              '题目保持其他条件相同，仅通过体积改变气体压力，因此温度不变。',
              '低压对应较大的容器体积，单位体积内 X、Y 粒子更少。',
              '粒子之间的碰撞频率降低，单位时间有效碰撞较少，反应较慢。',
              '平均动能相同不能推出速率相同；速率还受碰撞频率影响，因此选 D。',
            ],
            takeaway: '==恒温不变的是平均动能，不是不变的碰撞频率。==',
          },
        ],
        checklist: [
          '能区分碰撞频率与有效碰撞比例。',
          '能解释恒温压缩气体的影响。',
          '能把四类速率因素对应到不同微观原因。',
        ],
      },
    },
    {
      code: '141005',
      title: '活化能',
      summary: reactionRateMethods['141005']!.summary,
      paragraphs: [reactionRateMethods['141005']!.intro],
      rules: reactionRateMethods['141005']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: reactionRateMethods['141005']!.memory,
      pitfalls: [
        '把峰顶高度直接当活化能。',
        '放热反应的逆反应能垒用 150 − 100，而忽略 ΔH 的负号。',
        '用放热越多判断速率越快。',
      ],
      sourceIds: ['openstax-collision', 'openstax-catalysis'],
      visual: 'reaction-rates',
      examFocus: {
        goal: '使用同一基准，正确关联正逆能垒与反应焓。',
        pastPaperSummary:
          '当前收录年度真题中，直接考活化能的核心形式是由正向活化能和反应焓求逆向能垒；催化与快慢的边界还出现在平衡判断题中。',
        pastPaperPatterns: [
          {
            form: '正逆活化能差等于反应焓',
            description:
              '给出带符号的反应热和正反应活化能，求逆反应活化能；把放热量当正 ΔH 会选到较小的错误能垒。',
            reference: '2016 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q048'],
          },
          ...rateYield,
        ],
        examples: [
          {
            title: '放热 100，正向能垒 150，逆向是多少？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2016_S1-Q048',
              why: '用简单数值把正、逆向基准和焓变符号练清。',
            },
            question: '',
            answer: 'F · +250 kJ/mol。',
            steps: [
              '把反应物能级临时设为 0，峰顶比它高 150。',
              'ΔH = −100 表示产物能级为 −100。',
              '逆向从 −100 上升到 +150，需要 150 − (−100) = 250 kJ/mol。',
              '活化能是上升门槛，取正值，因此选 F。',
            ],
            takeaway: '==正反应放热，逆反应要多爬一段。==',
          },
        ],
        checklist: ['能从任意基准读出活化能。', '能计算正逆能垒关系。', '能区分能垒和净反应能量。'],
      },
    },
    {
      code: '141006',
      title: '催化剂',
      summary: reactionRateMethods['141006']!.summary,
      paragraphs: [reactionRateMethods['141006']!.intro],
      rules: reactionRateMethods['141006']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: reactionRateMethods['141006']!.memory,
      pitfalls: [
        '认为催化剂从不参与反应。',
        '把“有限时间产量增加”说成平衡产率增加。',
        '认为降低能垒必然同时改变 ΔH，或把保护气氛当催化剂。',
      ],
      sourceIds: ['openstax-catalysis'],
      visual: 'reaction-rates',
      examFocus: {
        goal: '能解释催化循环，并守住速率与热力学的边界。',
        pastPaperSummary:
          '年度真题主要把催化剂放进条件改变与平衡判断，也用惰性气体设置干扰；表面循环的具体步骤用现有题库题补充练习，不冒充历年真题考法。',
        pastPaperPatterns: [
          ...rateYield,
          {
            form: '催化用量或颗粒与气体曲线',
            description:
              '催化剂的表面或用量可改变反应进程，但不会单独改变同量过氧化氢完全分解的最终氧气量。',
            reference: '2016 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q044'],
          },
          {
            form: '保护气氛不是催化作用',
            description: '钛提取中氩气提供惰性环境；看到工业过程中的辅助物质，仍要区分保护与催化。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q049'],
          },
        ],
        examples: [
          {
            title: '表面催化的三个判断，哪一个越过了边界？',
            source: {
              kind: 'bank',
              subject: 'chemistry',
              questionCode: 'CHEM-MOCK-ADAPT-E03-007-R8-FINAL-20260818',
              why: '用题库的吸附—反应—解吸图补充催化机理，结合平衡边界自查。',
            },
            question: '',
            answer: 'E · I 和 II。',
            steps: [
              '吸附使反应物在活性位附近接近，并可能削弱反应物中的键，I 正确。',
              '产物必须解吸，才能让位点重新用于下一轮反应，II 正确。',
              '催化剂改变路径与速率，不改变固定温度下的平衡常数，III 错误。',
              '组合为真、真、假，对应 E；不能把“反应更快”解释成 K 变大。',
            ],
            takeaway: '==看循环能否再生，再查是否错误改变平衡。==',
          },
        ],
        checklist: [
          '能说明催化剂参与反应但整体再生。',
          '能解释吸附和解吸各自作用。',
          '能区分催化剂、反应中间体和保护气氛。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-rates',
      title: 'UAT-UK · ESAT Content Specification — C10',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对五类速率因素、测量物理量、图像、碰撞、活化能和催化边界。',
    },
    {
      id: 'openstax-rate',
      title: 'OpenStax · Factors affecting reaction rates',
      url: 'https://openstax.org/books/chemistry-2e/pages/12-2-factors-affecting-reaction-rates',
      note: '核对浓度、温度、表面积等变量；跨年考法按本地年度题正文归纳。',
    },
    {
      id: 'openstax-rates-definition',
      title: 'OpenStax · Chemical reaction rates',
      url: 'https://openstax.org/books/chemistry-2e/pages/12-1-chemical-reaction-rates',
      note: '核对平均与瞬时速率、图像斜率；题目计算按原图和原解析复核。',
    },
    {
      id: 'openstax-collision',
      title: 'OpenStax · Collision theory',
      url: 'https://openstax.org/books/chemistry-2e/pages/12-5-collision-theory',
      note: '核对有效碰撞、温度与活化能的区别。',
    },
    {
      id: 'openstax-catalysis',
      title: 'OpenStax · Catalysis',
      url: 'https://openstax.org/books/chemistry-2e/pages/12-7-catalysis',
      note: '核对替代路径、表面循环和催化剂的平衡边界。',
    },
  ],
}
