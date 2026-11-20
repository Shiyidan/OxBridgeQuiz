// ESAT 第十二章电解讲义：用电荷流向、条件判断与真实电极题连接概念和计算。
import type { KnowledgeLesson } from './types'
import { electrolysisMethods } from './electrolysisMethods'

export const esatElectrolysis: KnowledgeLesson = {
  code: '141200',
  title: 'Electrolysis · 电解',
  subtitle: '先标电极，再列粒子；先确定反应，再用电子数连接两端',
  intro:
    '电解题不是把化学式一分为二。电源使非自发的氧化还原反应发生，熔融或水溶液、电极材料和离子浓度共同决定产物。把装置图转成两条半方程，观察、质量和气体体积就有了共同的依据。',
  memory: [
    '**电解池：阴极接负极，得电子还原；阳极接正极，失电子氧化。**阴阳极的定义始终由反应决定。',
    '**导线靠电子，电解质靠离子。**固态离子晶格中离子不能自由移动；熔融或溶解后才有可移动离子。',
    '**水溶液多一个竞争者：水。**不能把 NaCl(aq) 当成 NaCl(l)，也不能忘记活性金属电极可能溶解。',
    '**两端先配电子，再比产物。**相同电子量不代表相同物质的量，更不代表相同质量。',
    '**镀件接阴极。**惰性阳极不补充金属离子，可溶性金属阳极可能补充；求浓度还要看最终体积。',
  ],
  sections: [
    {
      code: '141201',
      title: '电解术语',
      summary: electrolysisMethods['141201']!.summary,
      paragraphs: [electrolysisMethods['141201']!.intro],
      rules: electrolysisMethods['141201']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: electrolysisMethods['141201']!.memory,
      pitfalls: [
        '把阴极解释为“吸引阴离子的电极”。',
        '认为熔融盐靠自由电子导电。',
        '只看生成金属就断定它具有满外层排布。',
      ],
      visual: 'electrolysis',
      sourceIds: ['openstax-electrolysis'],
      examFocus: {
        goal: '能读装置图、判断载流子，并把产物数量与离子电荷联系起来。',
        pastPaperSummary:
          '术语经常嵌入熔融导电、电极位置和氧化还原判断，真题会把一个正确数量关系与两个概念陷阱并列。',
        pastPaperPatterns: [
          {
            form: '从物态判断载流子',
            description: '比较固态与熔融状态，识别电解质中移动的是离子，并结合产物量检验化学式。',
            reference: '2016 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q038'],
          },
          {
            form: '从电极名称追到电子得失',
            description: '不依赖装置左右位置，依据负极、阴极和还原的对应关系逐项判断。',
            reference: '2017、2019、2022 NSAA',
            sourceCodes: [
              'NSAA_2017_S1-Q045',
              'NSAA_2017_S1-Q050',
              'NSAA_2019_S1-Q054',
              'ESAT_LEGACY_2022_NSAA_Q044',
            ],
          },
        ],
        examples: [
          {
            title: '熔融氧化物：导电原因与化学式分开判断',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2016_S1-Q038',
              why: '同时检查电解术语、载流子和由产物确定化学式。',
            },
            question: '',
            answer: 'D · 只有陈述 3 正确。',
            steps: [
              '7.2 g Ti 对应 7.2 ÷ 48 = 0.15 mol；3.6 dm³ O₂ 对应 0.15 mol O₂，即 0.30 mol O 原子。',
              'Ti : O = 0.15 : 0.30 = 1 : 2，因此经验式为 TiO₂，陈述 3 正确。',
              '熔融氧化物由可移动离子导电，不是离域电子，陈述 2 错。',
              '生成的 Ti 是中性金属原子，不是原来的钛离子，也不具有稀有气体排布，陈述 1 错。',
            ],
            takeaway: '==先分清原子、离子和电子，再做比例==；数值算对不能替代概念判断。',
          },
        ],
        checklist: [
          '能解释固态盐与熔融盐导电差别。',
          '能说出阴阳极各发生什么反应。',
          '能分清金属原子和相应离子的电子数。',
        ],
      },
    },
    {
      code: '141202',
      title: '电解中的直流',
      summary: electrolysisMethods['141202']!.summary,
      paragraphs: [electrolysisMethods['141202']!.intro],
      rules: electrolysisMethods['141202']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: electrolysisMethods['141202']!.memory,
      pitfalls: [
        '把常规电流箭头当作电子箭头。',
        '认为一个 Br⁻ 直接生成一个 Br₂。',
        '把电源正负极换线后仍沿用原电极产物。',
      ],
      visual: 'electrolysis',
      sourceIds: ['openstax-electrolysis'],
      examFocus: {
        goal: '用固定极性解释持续电解，并由电子流量连接两极的产物量。',
        pastPaperSummary:
          '已收录真题以外电路电子方向和每秒通过的电子量考查直流作用；未发现要求比较交流波形的直接题。',
        pastPaperPatterns: [
          {
            form: '电子方向与两极产物综合判断',
            description: '把外电路电子流、电极产物和分子摩尔比放在同一道判断题中逐项核对。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q054'],
          },
          {
            form: '电子流率乘时间求产量',
            description: '先求电子摩尔数，再除以阳离子的电荷数，最后转成题目所用质量单位。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-020'],
          },
          {
            form: '相同电子量的跨装置比较',
            description: '统一到每摩尔电子对应的质量，不能只按原子量大小排序。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q057'],
          },
        ],
        examples: [
          {
            title: '电子方向对了，溴分子比例还要再查',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2019_S1-Q054',
              why: '用真实装置把直流方向与半反应比例连接起来。',
            },
            question: '',
            answer: 'E · 陈述 1、2 正确。',
            steps: [
              'Pb²⁺ 在阴极得到两个电子形成 Pb，因此负极生成铅，陈述 1 正确。',
              '阳极 Br⁻ 失电子，电子经外电路和电源转移并供应阴极；题目的外电路方向描述正确。',
              '2Br⁻ → Br₂ + 2e⁻；Pb²⁺ + 2e⁻ → Pb。同样两个电子产生一个 Br₂ 分子和一个 Pb 原子。',
              'Br₂ : Pb 的摩尔比是 1 : 1，而不是 2 : 1，排除陈述 3。',
            ],
            takeaway: '==用分子计数时，卤素的下标 2 必须保留==。',
          },
        ],
        checklist: ['能分别描述电子和离子移动。', '能解释为何使用直流。', '能由电子量计算产物量。'],
      },
    },
    {
      code: '141203',
      title: '电极过程',
      summary: electrolysisMethods['141203']!.summary,
      paragraphs: [electrolysisMethods['141203']!.intro],
      rules: electrolysisMethods['141203']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: electrolysisMethods['141203']!.memory,
      pitfalls: [
        '电子符号放对了，但电荷仍未配平。',
        '认为阳离子到阴极后失电子。',
        '见到含氯离子的溶液就忽略题图中的可溶性金属阳极。',
      ],
      visual: 'electrolysis',
      sourceIds: ['openstax-electrolysis'],
      examFocus: {
        goal: '根据电极材料与粒子种类，判断氧化还原并解释观察。',
        pastPaperSummary:
          '常见形式是选择两极半方程、判断“失电子”是否成立，以及分清局部酸碱变化和整体溶液变化。',
        pastPaperPatterns: [
          {
            form: '电极变化联系化学键',
            description:
              '在盐水电解等过程中区分水分子共价键断裂和气体分子形成，不把所有导电过程都理解为仅有离子移动。',
            reference: '2016 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q039'],
          },
          {
            form: '阴阳极半方程配对',
            description: '检查阴极得电子、阳极失电子，并核对是否把两侧反应或电极材料弄反。',
            reference: '2017、2018 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q045', 'ESAT_LEGACY_2018_NSAA_Q39'],
          },
          {
            form: '电子得失跨情境判断',
            description: '将电解、族趋势和还原剂的定义并列，要求逐项确认真正失电子的粒子。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q044'],
          },
          {
            form: '两极合并后的整体变化',
            description: '利用水的两条半方程判断产气比例、浓度变化及溶液整体酸碱性。',
            reference: '2016、2018 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q053', 'ESAT_LEGACY_2018_NSAA_Q42'],
          },
        ],
        examples: [
          {
            title: '铜盐溶液中，两极半方程如何配对',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2017_S1-Q045',
              why: '通过装置条件核对两极反应，避免凭盐名机械判断。',
            },
            question: '',
            answer: 'D',
            steps: [
              '负极是阴极，Cu²⁺ 得电子形成铜：Cu²⁺ + 2e⁻ → Cu。排除写成铜失电子或氯离子放电的阴极选项。',
              '依据题图电极条件，阳极不是用于补充 Cu²⁺ 的铜阳极；氯离子失电子：2Cl⁻ → Cl₂ + 2e⁻。',
              '同时满足两端的只有 D。A 对应另一种铜阳极过程，不能只因阴极正确就接受整行。',
              '核对两条半方程的氯原子数与电荷，确认并非形式相似的未配平式。',
            ],
            takeaway: '==表格题必须整行成立==；阴极正确不代表阳极也正确。',
          },
        ],
        checklist: [
          '能写铜离子的还原半方程。',
          '能说明惰性与可溶性电极的区别。',
          '能区分局部和整体酸碱变化。',
        ],
      },
    },
    {
      code: '141204',
      title: '预测电解产物',
      summary: electrolysisMethods['141204']!.summary,
      paragraphs: [electrolysisMethods['141204']!.intro],
      rules: electrolysisMethods['141204']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: electrolysisMethods['141204']!.memory,
      pitfalls: [
        '忽略 aqueous 与 molten 的区别。',
        '在水溶液中把 Na⁺还原为可收集的钠。',
        '把阴极和阳极产物互换，或从 SO₄²⁻直接猜出 S。',
      ],
      visual: 'electrolysis',
      sourceIds: ['openstax-electrolysis'],
      examFocus: {
        goal: '面对新电解质，能说明为什么选择某个放电粒子。',
        pastPaperSummary:
          '历年真题反复将熔融盐与水溶液对比，或要求同时判定两极产物、气体检验和残留溶液。',
        pastPaperPatterns: [
          {
            form: '同名盐的熔融与水溶液比较',
            description: '阴极是否出金属取决于是否有水参与竞争；再利用真实产物比较质量或气体量。',
            reference: '2017、2019、2021 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q050', 'NSAA_2019_S1-Q054', 'ESAT_LEGACY_2021_NSAA_Q057'],
          },
          {
            form: '逐行核对两极产物',
            description:
              '给出多种水溶液，判断是否得到溶质的组成元素，重点排除碱金属析出、两极颠倒和硫酸根析硫。',
            reference: '2018、2020、2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q39',
              'ESAT-2020-CHEMISTRY-007',
              'ESAT_LEGACY_2022_NSAA_Q047',
            ],
          },
          {
            form: '盐水产物与后续观察',
            description: '识别 H₂、Cl₂及碱性残液，再接气体体积、质量或卤素置换观察。',
            reference: '2016、2018 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q047', 'ESAT_LEGACY_2018_NSAA_Q42'],
          },
        ],
        examples: [
          {
            title: '哪些水溶液能真正收集到组成元素',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q047',
              why: '把水竞争的判断应用到三种浓溶液。',
            },
            question: '',
            answer: 'E · 1 和 2。',
            steps: [
              '浓 CuBr₂(aq)：阴极 Cu²⁺还原为 Cu，阳极 Br⁻氧化为 Br₂，可得到组成元素。',
              '浓 HCl(aq)：阴极得 H₂，阳极得 Cl₂，也可得到组成元素。',
              'KCl(aq)：阴极产生 H₂而不是 K，虽可得到 Cl₂，也不能收集到两个组成元素。',
              '因此只有 1、2，选 E；“有一个元素正确”不满足题意。',
            ],
            takeaway: '==先问水是否参与，再问是不是溶质的组成元素==。',
          },
        ],
        checklist: [
          '能比较熔融 NaCl 和浓盐水。',
          '能预测 Cu²⁺、Na⁺在水溶液阴极的常见结果。',
          '能结合浓度与材料判断阳极。',
        ],
      },
    },
    {
      code: '141205',
      title: '半方程',
      summary: electrolysisMethods['141205']!.summary,
      paragraphs: [electrolysisMethods['141205']!.intro],
      rules: electrolysisMethods['141205']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: electrolysisMethods['141205']!.memory,
      pitfalls: [
        '只配原子，不配电荷。',
        '把 H₂与 O₂摩尔比直接当质量比。',
        '比较金属质量时忘记每个离子需要的电子数。',
      ],
      visual: 'electrolysis',
      sourceIds: ['openstax-electrolysis'],
      examFocus: {
        goal: '能由半方程求气体比例、金属质量与溶液变化。',
        pastPaperSummary:
          '题目既直接给半方程要求推论，也要求先写反应再比较电子当量；计算陷阱主要在双原子分子、价态和单位。',
        pastPaperPatterns: [
          {
            form: '由水的半方程推总反应',
            description:
              '配电子后求气体比例，判断水消耗导致电解质浓度变化，并区分两极局部酸碱变化。',
            reference: '2016、2019 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q053', 'NSAA_2019_S1-Q046'],
          },
          {
            form: '等电子量计算或质量排序',
            description: '从电荷转到产物摩尔数，按各自的电子系数换算；最终统一质量单位。',
            reference: '2020、2021 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-020', 'ESAT_LEGACY_2021_NSAA_Q057'],
          },
          {
            form: '半方程与电极配对',
            description: '检查电子书写侧、电极名称和实际反应物是否同时正确。',
            reference: '2017、2018 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q045', 'ESAT_LEGACY_2018_NSAA_Q39'],
          },
        ],
        examples: [
          {
            title: '水少了，不代表整个溶液一定变酸',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2016_S1-Q053',
              why: '由两条已给半方程得出气体比例和整体变化。',
            },
            question: '',
            answer: 'C · 只有陈述 2。',
            steps: [
              '阳极每形成 1 mol O₂给出 4 mol 电子，阴极每形成 1 mol H₂需要 2 mol 电子，因此 H₂ : O₂ = 2 : 1，陈述 1 错。',
              '合并两式得到水被分解；在题目条件下 Na₂SO₄留在溶液而水减少，所以浓度增加，陈述 2 对。',
              '同样电子量在另一端形成对应 OH⁻；不能只凭阳极生成 H⁺就推断整个混合溶液变酸，陈述 3 错。',
              '分别核对产物量、溶剂量和整体电荷平衡，得到只有 2。',
            ],
            takeaway: '==先消电子看总反应，再判断整个装置==。',
          },
        ],
        checklist: [
          '能配平原子与电荷。',
          '能由电子数得到 H₂/O₂摩尔比。',
          '能比较等电子量下不同金属质量。',
        ],
      },
    },
    {
      code: '141206',
      title: '电镀',
      summary: electrolysisMethods['141206']!.summary,
      paragraphs: [electrolysisMethods['141206']!.intro],
      rules: electrolysisMethods['141206']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: electrolysisMethods['141206']!.memory,
      pitfalls: [
        '把待镀物接到阳极。',
        '不看石墨阳极，自动认为铜离子浓度保持不变。',
        '用沉积铜的摩尔数除体积，忘记题目问剩余浓度。',
      ],
      visual: 'electrolysis',
      sourceIds: ['openstax-electrolysis'],
      examFocus: {
        goal: '能解释镀层形成位置，并正确计算惰性阳极条件下的剩余离子浓度。',
        pastPaperSummary:
          '当前收录真题的直接电镀考查集中在镀铜后的离子浓度，需把电极材料、初始盐质量、沉积金属质量和最终体积连成一条物料守恒链。',
        pastPaperPatterns: [
          {
            form: '电镀后的剩余浓度',
            description:
              '从无水盐质量算初始金属离子，扣除镀层对应摩尔数，再用补水后的最终体积求浓度。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q056'],
          },
        ],
        pastPaperNote:
          '本节的可溶性阳极、库存上限与析氢竞争另用现有试题库训练，不将这些题库题标为历年真题。',
        examples: [
          {
            title: '补水到原体积，铜离子浓度会恢复吗',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2023_S1-Q056',
              why: '明确给出石墨阳极，适合区分补水与补充铜离子。',
            },
            question: '',
            answer: 'E · 0.75 mol dm⁻³。',
            steps: [
              '无水 CuSO₄的摩尔质量为 64 + 32 + 4 × 16 = 160 g mol⁻¹；80.0 g 提供 0.500 mol Cu²⁺。',
              '8.00 g 铜对应 8.00 ÷ 64 = 0.125 mol。石墨阳极不补充 Cu²⁺，因此剩余 0.375 mol。',
              '最终体积明确为 500 cm³ = 0.500 dm³，不能使用未给出的电解后体积。',
              'c = 0.375 ÷ 0.500 = 0.750 mol dm⁻³，选 E。',
            ],
            takeaway: '==补水改变分母，镀铜减少分子==；浓度要把两者一起考虑。',
          },
        ],
        checklist: [
          '能确定待镀物的接线。',
          '能区分惰性与铜阳极对浓度的影响。',
          '能检查库存与最终体积。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'openstax-electrolysis',
      title: 'OpenStax Chemistry 2e · Electrolysis',
      url: 'https://openstax.org/books/chemistry-2e/pages/17-7-electrolysis',
      note: '核对电解池、熔融与水溶液的竞争反应、电镀及电子计量；讲义以考纲范围重组。',
    },
  ],
}
