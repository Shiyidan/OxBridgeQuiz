// ESAT 第十四章金属讲义：以电子转移、提取边界和材料结构解释真实金属题。
import type { KnowledgeLesson } from './types'
import { metalsMethods } from './metalsMethods'

export const esatMetals: KnowledgeLesson = {
  code: '141400',
  title: 'Metals · 金属',
  subtitle: '活性决定反应方向，结构决定用途，提取还要考虑实际条件',
  intro:
    '把金属题分成三个问题：它多容易失去电子？能用什么方法从化合物获得它？哪些物理或化学性质适合当前用途？同一张活性顺序表不能替代结构分析，也不能替代工业过程的条件与计量。',
  memory: [
    '**越活泼，通常越容易失电子形成阳离子。**较活泼金属能从合适的化合物中置换较不活泼金属。',
    '**先看金属在碳上还是碳下，再看矿物和工艺限制。**铝常用电解；铁可用 CO 还原；钛不能机械套成廉价碳还原。',
    '**矿石质量 ≠ 金属质量。**先扣无用组分，再用化学式换算，最后考虑回收率。',
    '**纯金属易滑层，合金常因原子大小不同而更难滑移。**更硬不等于所有性质都更优。',
    '**过渡金属常见多种价态、有色化合物和催化作用。**“常见”不是“每个化合物都如此”。',
  ],
  sections: [
    {
      code: '141401',
      title: '反应性与提取',
      summary: metalsMethods['141401']!.summary,
      paragraphs: [metalsMethods['141401']!.intro],
      rules: metalsMethods['141401']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: metalsMethods['141401']!.memory,
      pitfalls: [
        '把表面氧化膜造成的慢反应当作低活性。',
        '认为电解能从普通水溶液收集 Na。',
        '把 argon 保护气氛说成催化剂。',
      ],
      visual: 'metals',
      sourceIds: ['rsc-extraction', 'openstax-metals'],
      examFocus: {
        goal: '从提取方法反推活性，并解释还原剂与保护气氛的作用。',
        pastPaperSummary:
          '真题用陌生金属字母、能否碳还原及不同还原剂的计量建立推理链，也考查新提取工艺中的惰性气氛。',
        pastPaperPatterns: [
          {
            form: '由提取方法反推活性顺序',
            description: '先用碳能否还原分成两组，再用失电子倾向和金属置换完成组内排序。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q041'],
          },
          {
            form: '实际提取路线与还原剂比较',
            description: '配平 Mg/Na 还原 TiCl₄，比较所需质量并区分氩气保护与催化。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q049'],
          },
          {
            form: '金属与化合物反应网络识别',
            description: '把金属、氧化物和盐之间的变化同时用于判定金属身份，而不是只看一条反应。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q042'],
          },
        ],
        examples: [
          {
            title: '先按碳分组，再补上组内顺序',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2019_S1-Q041',
              why: '无需背出陌生金属名称，直接用证据构建活性链。',
            },
            question: '',
            answer: 'H · S > P > R > Q。',
            steps: [
              'P、S 不能用碳还原而需要电解；Q、R 可用碳还原，所以 P、S 整体在 Q、R 之前。',
              'S 比 P 更易形成阳离子，因此 S > P。',
              'R 能与 Q 的氧化物反应并置换 Q，因此 R > Q。',
              '合并两组和组内关系，得到 S > P > R > Q，选 H。',
            ],
            takeaway: '==先分层，再排序==；不用凭空猜金属名称。',
          },
        ],
        checklist: [
          '能用活性解释提取方法。',
          '能分清氧化膜和本征反应性。',
          '能解释钛提取的还原剂与气氛。',
        ],
      },
    },
    {
      code: '141402',
      title: '置换与反应性顺序',
      summary: metalsMethods['141402']!.summary,
      paragraphs: [metalsMethods['141402']!.intro],
      rules: metalsMethods['141402']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: metalsMethods['141402']!.memory,
      pitfalls: [
        '把“被置换出来”的金属认作更活泼。',
        '把不同参照的电压直接排序。',
        '把沉淀生成当作金属还原。',
      ],
      visual: 'metals',
      sourceIds: ['openstax-metals'],
      examFocus: {
        goal: '把实验结果转成活性关系，能解释置换与外电路电子方向。',
        pastPaperSummary:
          '当前直接真题既用提取与氧化物置换串联排序，也用电化学读数建立同一参照下的数轴；两者都在考“证据怎样合并”。',
        pastPaperPatterns: [
          {
            form: '提取、置换与成离子倾向综合排序',
            description: '分清跨组与组内证据，不凭单条观察完成全部排序。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q041'],
          },
          {
            form: '电子方向和电势差排序',
            description: '利用共同金属作参照，按差值定位其他金属，再检查电子从哪端流出。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q058'],
          },
          {
            form: '实际置换用于金属提取',
            description: '判断 Mg/Na 被氧化而 Ti(IV) 被还原，并比较不同电子数带来的计量。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q049'],
          },
        ],
        examples: [
          {
            title: '三次电压读数，放到同一条数轴上',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2023_S1-Q058',
              why: '以真实数据训练合并相对关系，而不是背活性表。',
            },
            question: '',
            answer: 'C · P > S > Q > R。',
            steps: [
              '把 Q 的相对失电子倾向设为参照 0；由第一、二次实验得到 P 对 Q 的差 0.62、S 对 Q 的差 0.30。',
              '因此 P > S > Q，不应只因某次电压更大就把 S 排第一。',
              '第三次 S 比 R 高 1.24，因此 R 相对 Q 为 0.30−1.24 = −0.94，低于 Q。',
              '得到 P > S > Q > R，逐条代回三组读数均成立。',
            ],
            takeaway: '==比较差值前先统一零点==。',
          },
        ],
        checklist: [
          '能从置换写出活性关系。',
          '能区分沉淀与氧化还原。',
          '能把相对差值放到共同参照。',
        ],
      },
    },
    {
      code: '141403',
      title: '金属与合金用途和性质',
      summary: metalsMethods['141403']!.summary,
      paragraphs: [metalsMethods['141403']!.intro],
      rules: metalsMethods['141403']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: metalsMethods['141403']!.memory,
      pitfalls: [
        '说合金更硬是因为所有原子更大。',
        '把导电归因于金属阳离子在固体中自由移动。',
        '认为合金必有固定化学式，或所有组分都与同一稀酸反应。',
      ],
      visual: 'metals',
      sourceIds: ['rsc-alloys', 'openstax-metals'],
      examFocus: {
        goal: '用结构说明金属和合金性质，并能利用组分反应差异分析合金。',
        pastPaperSummary:
          '当前收录的年度化学题中未找到直接以“合金硬度或用途配对”为核心的题；不把题干中仅出现某种金属当成材料性质考法。',
        pastPaperPatterns: [],
        pastPaperNote:
          '本节采用已发布试题库中的镁铜合金分析题，训练不同组分反应性；它不替代上面的晶格、延展性与用途知识。',
        examples: [
          {
            title: '镁铜合金中，只有哪一部分贡献氢气',
            source: {
              subject: 'chemistry',
              kind: 'bank',
              questionCode: 'ESAT-CHEM-AI-20260809-00F53B407A16-R4',
              why: '题目明确铜不溶，适合用组分性质差异分析真实合金。',
            },
            question: '',
            answer: 'A · 0.810 g。',
            steps: [
              '题目明确过量酸中 Cu 不溶，只有 Mg 贡献 H₂。Mg + 2H⁺ → Mg²⁺ + H₂，Mg : H₂ = 1 : 1。',
              '氢气物质的量为 0.800/24.0 = 0.03333… mol。',
              '镁质量 = 0.03333… × 24.3 = 0.810 g，注意使用题目给定的 24.3。',
              '0.810 g 小于合金总质量 2.00 g，剩余 1.190 g 为铜，质量检查一致。',
            ],
            takeaway: '==先确定谁反应，再把气体量归给那一部分==。',
          },
        ],
        checklist: [
          '能用结构解释金属导电与延展。',
          '能解释常见合金硬化。',
          '能为用途选择有依据的性能。',
        ],
      },
    },
    {
      code: '141404',
      title: '金属矿石与还原',
      summary: metalsMethods['141404']!.summary,
      paragraphs: [metalsMethods['141404']!.intro],
      rules: metalsMethods['141404']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: metalsMethods['141404']!.memory,
      pitfalls: [
        '把矿石纯度与金属质量分数混为同一个百分比。',
        '把结晶水中的质量也算作能产铝的部分。',
        '说石灰石在高炉中的作用是还原铁。',
      ],
      visual: 'metals',
      sourceIds: ['rsc-extraction', 'openstax-metals'],
      examFocus: {
        goal: '识别还原步骤与除杂步骤，准确处理矿石纯度和水合物。',
        pastPaperSummary:
          '真题一类给高炉多条方程逐项判断氧化还原；另一类给水合矿石和纯度反求所需原料。',
        pastPaperPatterns: [
          {
            form: '高炉过程逐反应辨析',
            description: '跟踪题目划线物质中的元素化合价，不把热分解或成渣归为氧化还原。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q43'],
          },
          {
            form: '矿石纯度与水合氧化物计量',
            description: '先求水合氧化物中金属质量比例，再处理矿石中有用组分的比例。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q059'],
          },
          {
            form: '铁氧化物与还原的组成基础',
            description: '利用铁、氧的质量反推经验式，或在含还原步骤的多个方程中辨认氧化。',
            reference: '2017、2019 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q038', 'NSAA_2019_S1-Q043'],
          },
        ],
        examples: [
          {
            title: '108 吨铝需要多少含水矿石',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2023_S1-Q059',
              why: '同时包含结晶水与矿石纯度，适合训练分层换算。',
            },
            question: '',
            answer: 'E · 368 吨。',
            steps: [
              '水合物为 Al₂O₃·2H₂O，式量为 2×27+3×16+2×18=138。',
              '138 份水合物包含 54 份铝，因此制 108 吨铝至少需要 108×138/54=276 吨纯水合物。',
              '矿石只有 75.0% 是该水合物，所以原矿质量为 276/0.750=368 吨。',
              '核查：368×0.75×54/138=108 吨，纯度方向正确。',
            ],
            takeaway: '==化合物里的金属比例，与矿石里的化合物比例，要分两次处理==。',
          },
        ],
        checklist: [
          '能解释 CO 与石灰石各自作用。',
          '能识别高炉里的非氧化还原步骤。',
          '能计算含水矿石的金属产量。',
        ],
      },
    },
    {
      code: '141405',
      title: '过渡金属性质',
      summary: metalsMethods['141405']!.summary,
      paragraphs: [metalsMethods['141405']!.intro],
      rules: metalsMethods['141405']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: metalsMethods['141405']!.memory,
      pitfalls: [
        '把过渡金属与冷水的反应性说成普遍强于第 1 族。',
        '把“有色化合物”改成“所有化合物都必有颜色”。',
        '认为催化剂增加平衡产量。',
      ],
      visual: 'metals',
      sourceIds: ['openstax-metals'],
      examFocus: {
        goal: '准确使用典型过渡金属特征，避免无条件的绝对化表述。',
        pastPaperSummary:
          '当前收录年度题中未找到以过渡金属典型性质组合为核心的直接题。含 Fe、Cu、Ti 的提取或计量题不能因此全部计作本考点。',
        pastPaperPatterns: [],
        pastPaperNote:
          '本节用已发布题库中专门比较有色化合物、可变价态与冷水反应性的题，并另配周期表位置自测。',
        examples: [
          {
            title: '有色、可变价、冷水反应：哪些是典型特征',
            source: {
              subject: 'chemistry',
              kind: 'bank',
              questionCode: 'CHEM-MOCK-ADAPT-E04-023-R8-FINAL-20260818',
              why: '直接覆盖本知识点，避免用仅出现铜铁名称的计算题充当性质题。',
            },
            question: '',
            answer: 'E · I 和 II。',
            steps: [
              'I 使用 may be coloured，说明化合物可能有颜色，符合典型特征，不声称全部有色。',
              'II 说明同一元素可形成不同电荷的稳定离子，例如 Fe²⁺与 Fe³⁺，正确。',
              'III 把它们与冷水的反应性说成一般强于第 1 族，方向错误。',
              '只保留 I、II，选 E；注意判断的是整条陈述的限定条件。',
            ],
            takeaway: '==典型特征要连着限定词一起记==。',
          },
        ],
        checklist: [
          '能举可变价态例子。',
          '能说明有色化合物不是无例外规律。',
          '能举催化应用并说明催化剂作用。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'rsc-extraction',
      title: 'RSC Education · Extracting metals',
      url: 'https://edu.rsc.org/resources/extracting-metals/4010861.article',
      note: '核对活性与提取方式之间的教学联系。',
    },
    {
      id: 'rsc-alloys',
      title: 'RSC Education · Elements, compounds, structure and reactions',
      url: 'https://edu.rsc.org/resources/elements-compounds-structure-and-reactions/1913.article',
      note: '金属、合金与结构教学资源。',
    },
    {
      id: 'openstax-metals',
      title: 'OpenStax Chemistry 2e · Transition Metals and Their Compounds',
      url: 'https://openstax.org/books/chemistry-2e/pages/19-1-occurrence-preparation-and-properties-of-transition-metals-and-their-compounds',
      note: '核对金属提取、过渡金属典型性质及其适用边界。',
    },
  ],
}
