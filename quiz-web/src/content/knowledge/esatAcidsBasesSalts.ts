// ESAT 第九章酸碱盐讲义：区分酸的强弱、碱的溶解性与中和计量，衔接真实题源练习。
import type { KnowledgeLesson } from './types'
import { acidsMethods } from './acidsMethods'

export const esatAcidsBasesSalts: KnowledgeLesson = {
  code: '140900',
  title: 'Acids, bases and salts · 酸、碱和盐',
  subtitle: '强弱看电离，浓稀看用量，中和先数可交换的氢离子',
  intro:
    '把酸碱题拆成三个问题：溶液中现在有什么粒子？每摩尔能中和多少？实验到底测速度、总量还是剩余量？这样可以同时处理性质判断、盐的制备和滴定计算。',
  memory: [
    '**强酸不等于浓酸，弱酸不等于不能反应。**强弱是电离程度，浓度是单位体积所含酸的量。',
    '**碱能接受 H⁺；可溶于水并形成碱性溶液的碱叫 alkali。**不溶性金属氧化物也可以中和酸。',
    '**先配平，再用 n = cV。**H₂SO₄ 完全中和需 2 份 OH⁻，H₃PO₄ 完全中和需 3 份。',
    '**回滴先减后除，取样先算局部再放大。**温度或气体测量不能自动证明酸的强弱。',
  ],
  sections: [
    {
      code: '140901',
      title: '酸',
      summary: acidsMethods['140901']!.summary,
      paragraphs: [acidsMethods['140901']!.intro],
      rules: acidsMethods['140901']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: acidsMethods['140901']!.memory,
      pitfalls: [
        '用“弱”推断乙酸不能中和或不能与碳酸盐反应。',
        '把相同酸浓度当成相同 H⁺ 浓度。',
        '由完全中和所需体积或单纯冒泡断言酸强弱。',
      ],
      sourceIds: ['openstax-acids', 'openstax-reactions'],
      visual: 'acids-bases-salts',
      examFocus: {
        goal: '看清实验测的是电离程度还是总酸量，并从证据判断能推导到哪一步。',
        pastPaperSummary:
          '相关真题反复把强弱、元数和中和总量放在一起；也将酸的典型反应接到盐质量、纯度与鉴别上。要先分组解释每条实验结果。',
        pastPaperPatterns: [
          {
            form: '强弱与共同酸性分开判断',
            description:
              '对比强、弱一元酸的导电性、与镁反应速度、石蕊和碳酸盐现象；完全中和的耗碱量不能单独区分酸强弱。',
            reference: '2016、2017、2023 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q049', 'NSAA_2017_S1-Q039', 'NSAA_2023_S1-Q054'],
          },
          {
            form: '多元酸、逐步电离与质子转移',
            description:
              '结合磷酸的分步电离、草酸的二元性或实验中和比例，判断供受质子能力与每摩尔耗碱量；弱酸仍按完全中和计量。',
            reference: '2020、2021、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-013',
              'ESAT_LEGACY_2021_NSAA_Q053',
              'NSAA_2023_S1-Q054',
            ],
          },
          {
            form: '典型反应连接气体和盐的计量',
            description:
              '由碳酸盐放气求纯度，或先排除不与稀酸反应的金属，再比较盐量。硝酸与铜的题目需另外结合氧化还原与守恒，不能沿用放氢模板。',
            reference: '2016—2019、2021—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q050',
              'NSAA_2017_S1-Q053',
              'ESAT_LEGACY_2018_NSAA_Q52',
              'NSAA_2019_S1-Q051',
              'ESAT_LEGACY_2021_NSAA_Q047',
              'ESAT_LEGACY_2022_NSAA_Q056',
              'NSAA_2023_S1-Q053',
            ],
          },
        ],
        examples: [
          {
            title: '哪些实验真正区分强酸与弱酸？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2016_S1-Q049',
              why: '同一道真题将速度、耗碱量和导电性并列，直接拆开三个常见混淆。',
            },
            question: '',
            answer: 'F · 只有 1 和 3。',
            steps: [
              '两酸都是一元酸，浓度同为 1 mol/dm³；比较的是强弱，不是酸的浓稀或元数。',
              '强酸的 H⁺ 浓度更高，相同镁条在相同条件下反应更快，实验 1 可以区分。',
              '20 cm³ 的两种酸均含 0.020 mol 可中和的一元酸，均需 20 cm³ 的 1 mol/dm³ NaOH；实验 2 不能区分。',
              '强酸电离程度更大，可移动离子更多，导电性较强，实验 3 可以区分。因此选 1 和 3。',
            ],
            takeaway: '==速度和导电性看溶液中的离子；完全中和看总量。==',
          },
        ],
        checklist: [
          '能说明强酸与浓酸的区别。',
          '能写出酸与金属、碱及碳酸盐的常见产物。',
          '能指出哪些观察不足以判断酸强弱。',
        ],
      },
    },
    {
      code: '140902',
      title: '碱',
      summary: acidsMethods['140902']!.summary,
      paragraphs: [acidsMethods['140902']!.intro],
      rules: acidsMethods['140902']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: acidsMethods['140902']!.memory,
      pitfalls: [
        '把 base 和 alkali 完全等同。',
        '因为 NH₃ 不含 OH 就否认氨水碱性。',
        '忽略 Ca(OH)₂ 每摩尔含两个 OH⁻，或把不溶物算进滤液。',
      ],
      sourceIds: ['openstax-acids', 'openstax-reactions'],
      visual: 'acids-bases-salts',
      examFocus: {
        goal: '由物质类型确定反应角色，再用溶解性和离子数量解释实验。',
        pastPaperSummary:
          '真题常把碱性氧化物与周期表、成键联考；氢氧化物则与过滤、酸碱余量和量热结合，不能只背碱的名称。',
        pastPaperPatterns: [
          {
            form: '元素位置 → 氧化物 → 酸碱性',
            description:
              '由原子序数或族位置写离子电荷及氧化物式，并判断是否与酸反应；同一选项还可能要求区分离子键与共价键。',
            reference: '2017、2023 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q042', 'NSAA_2023_S1-Q052'],
          },
          {
            form: '溶解性决定中和对象',
            description:
              '过滤混合氢氧化物后仅对滤液滴定，用酸量反推可溶性碱，再由总质量求不溶成分。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-011'],
          },
          {
            form: 'OH⁻ 数量与氨的受质子能力',
            description:
              '多元酸与氢氧化钙按当量配比；混合后先求过量 OH⁻；氨与盐酸量热先判断限制试剂。',
            reference: '2020、2022 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-013',
              'ESAT_LEGACY_2022_NSAA_Q048',
              'ESAT_LEGACY_2022_NSAA_Q057',
            ],
          },
        ],
        examples: [
          {
            title: '从原子序数推到氧化物的碱性',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2017_S1-Q042',
              why: '把元素定位、化学式和酸碱性三个判断串起来。',
            },
            question: '',
            answer: 'C · XO，离子键，碱性。',
            steps: [
              '原子序数 20 对应 Ca，通常形成 Ca²⁺。',
              '氧离子为 O²⁻，正负电荷 1:1 抵消，所以简单氧化物为 CaO，即 XO。',
              'CaO 是离子晶体，不能因为只含两个元素就判作简单分子。',
              'CaO 与酸生成钙盐和水，表现碱性。因此三个条件同时对应 C。',
            ],
            takeaway: '==电荷决定式，结构决定键型，反应决定酸碱性。==',
          },
        ],
        checklist: [
          '能区分碱与可溶性碱。',
          '能解释氨水为什么有碱性。',
          '能根据过滤结果正确确定耗酸的成分。',
        ],
      },
    },
    {
      code: '140903',
      title: '中和',
      summary: acidsMethods['140903']!.summary,
      paragraphs: [acidsMethods['140903']!.intro],
      rules: acidsMethods['140903']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: acidsMethods['140903']!.memory,
      pitfalls: [
        '所有酸碱组合都直接套 c₁V₁ = c₂V₂。',
        '回滴把剩余酸当成样品消耗的酸。',
        '把“中和完全”“pH = 7”和“所有离子消失”视为同一件事。',
      ],
      sourceIds: ['openstax-acids', 'openstax-reactions'],
      visual: 'acids-bases-salts',
      examFocus: {
        goal: '用反应比例搭好计量骨架，再接稀释、取样或回滴。',
        pastPaperSummary:
          '中和的历年题型覆盖直接滴定、多元酸、先稀释后取样、过量酸回滴，以及混合后余量和量热。统一的第一步都是把 cV 转为反应的摩尔数。',
        pastPaperPatterns: [
          {
            form: '直接滴定与多元酸系数',
            description:
              '从体积浓度推另一试剂浓度、质量浓度或酸的元数，重点排除忽略二元、三元酸系数的答案。',
            reference: '2016、2017、2020、2021、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q052',
              'NSAA_2017_S1-Q039',
              'ESAT-2020-CHEMISTRY-013',
              'ESAT_LEGACY_2021_NSAA_Q053',
              'NSAA_2023_S1-Q054',
            ],
          },
          {
            form: '稀释取样与回滴',
            description:
              '由小份滴定数据还原整瓶酸量、原液浓度或样品纯度；过量酸法必须先减去回滴测得的剩余量。',
            reference: '2018—2020、2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q52',
              'NSAA_2019_S1-Q052',
              'ESAT-2020-CHEMISTRY-019',
              'ESAT_LEGACY_2022_NSAA_Q056',
            ],
          },
          {
            form: '余量、分离与温度数据',
            description: '混合强酸强碱后求剩余离子，或由温度峰值、限制试剂及过滤结果求反应量。',
            reference: '2020—2022 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-011',
              'ESAT-2020-CHEMISTRY-017',
              'ESAT_LEGACY_2021_NSAA_Q045',
              'ESAT_LEGACY_2022_NSAA_Q048',
              'ESAT_LEGACY_2022_NSAA_Q057',
            ],
          },
        ],
        examples: [
          {
            title: '弱二元酸完全中和，体积怎么算？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q053',
              why: '用草酸练习“弱”不改完全中和比例这一高频陷阱。',
            },
            question: '',
            answer: 'A · 10.0 cm³。',
            steps: [
              'NaOH 的量为 2.00 × 25.0/1000 = 0.0500 mol。',
              '草酸是二元酸，每摩尔完全中和 2 mol NaOH，所以所需酸为 0.0250 mol。',
              '酸浓度为 2.50 mol/dm³，体积为 0.0250/2.50 = 0.0100 dm³。',
              '换算为 10.0 cm³，选 A。弱酸会随 H⁺ 被消耗继续电离，不额外乘“电离百分比”。',
            ],
            takeaway: '==弱看平衡，几元看计量；完全中和先看系数。==',
          },
        ],
        checklist: [
          '能处理中和的非 1:1 比例。',
          '能解释回滴为什么先减后除。',
          '能根据试剂溶解性选择盐的制备方法。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-acids',
      title: 'UAT-UK · ESAT Content Specification — C9',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '逐项核对酸与碱定义、强弱浓稀、氧化物与水、pH 十倍关系、多元酸及中和。',
    },
    {
      id: 'openstax-acids',
      title: 'OpenStax · Brønsted–Lowry acids and bases',
      url: 'https://openstax.org/books/chemistry-2e/pages/14-1-bronsted-lowry-acids-and-bases',
      note: '核对质子供受体定义与氨的碱性；题目归纳来自本地已发布年度 Question。',
    },
    {
      id: 'openstax-reactions',
      title: 'OpenStax · Classifying chemical reactions',
      url: 'https://openstax.org/books/chemistry-2e/pages/4-2-classifying-chemical-reactions',
      note: '核对酸碱反应及净离子式；计算步骤按精选原题独立复核。',
    },
  ],
}
