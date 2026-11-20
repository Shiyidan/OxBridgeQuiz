// ESAT 第十三章有机化学讲义：把结构识别、官能团反应和原子守恒连接成可迁移的解题路径。
import type { KnowledgeLesson } from './types'
import { organicMethods } from './organicMethods'

export const esatOrganicChemistry: KnowledgeLesson = {
  code: '141300',
  title: 'Carbon / Organic chemistry · 碳与有机化学',
  subtitle: '先找官能团，再看条件；用碳骨架追踪反应前后发生的变化',
  intro:
    '有机题看似结构多，主线只有三条：碳的四价决定结构，官能团决定主要反应，原子守恒连接数量。练习时不要只记产物名，圈出变化位置，再保留未变化的碳骨架。',
  memory: [
    '**碳四键、氢一键、氧通常两键。**骨架式的端点和转角代表碳，补氢到四价。',
    '**烷烃饱和、烯烃有 C=C。**非环单烯烃 CₙH₂ₙ；相同分子式也可能是环烷烃。',
    '**加成打开双键；取代替换原子；加聚连接双键碳。**不要把三种变化混为一谈。',
    '**醇的 –OH 不是 OH⁻。**伯醇可氧化为醛再到酸，仲醇到酮，条件决定产物。',
    '**酸 + 醇 ⇌ 酯 + 水。**酯的相对分子质量为酸与醇之和减 18。',
  ],
  sections: [
    {
      code: '141301',
      title: '有机化学通用概念',
      summary: organicMethods['141301']!.summary,
      paragraphs: [organicMethods['141301']!.intro],
      rules: organicMethods['141301']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: organicMethods['141301']!.memory,
      pitfalls: [
        '见 CₙH₂ₙ就断定必为烯烃，忽略环。',
        '把骨架式的 O 当作另一个碳。',
        '把经验式当作唯一分子式。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-hydrocarbons'],
      examFocus: {
        goal: '先判断题目给的是哪种结构信息，再确认它能否唯一决定分子式。',
        pastPaperSummary:
          '真题将通式与质量分数、燃烧产物和加成信息结合，常要求判断“信息够不够”，而不只是认名称。',
        pastPaperPatterns: [
          {
            form: '最少信息确定分子式',
            description: '同一通式中质量分数可恒定，要额外用相对分子质量确定分子大小。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-003'],
          },
          {
            form: '多条结构证据交叉筛选',
            description: '燃烧确定碳数，加氢确定双键数，聚合物片段质量与支链信息进一步筛选结构。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q054'],
          },
          {
            form: '燃烧与加成反推原子组成',
            description: '依据氧耗量差、卤素质量分数或双键数建立守恒关系，而不是只套分子名称。',
            reference: '2020、2022、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-016',
              'ESAT_LEGACY_2022_NSAA_Q059',
              'NSAA_2023_S1-Q057',
            ],
          },
        ],
        examples: [
          {
            title: '为什么知道碳、氢百分比还不够',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'ESAT-2020-CHEMISTRY-003',
              why: '训练区分通式比例与实际分子大小。',
            },
            question: '',
            answer: 'B · 只需信息 3。',
            steps: [
              '直链且只有一个 C=C，通式为 CₙH₂ₙ。',
              '碳质量分数为 12n/(14n) = 6/7，氢为 1/7，均与 n 无关。',
              '所以碳、氢百分比只确认比例，不能区分乙烯、丙烯等不同大小分子。',
              '相对分子质量 Mᵣ = 14n，给出 Mᵣ即可确定 n，因此只需信息 3。',
            ],
            takeaway: '==比例信息不能自动变成大小信息==。',
          },
        ],
        checklist: ['能读分子式和骨架式。', '能识别官能团与同分异构。', '能说明通式的适用范围。'],
      },
    },
    {
      code: '141302',
      title: '烷烃',
      summary: organicMethods['141302']!.summary,
      paragraphs: [organicMethods['141302']!.intro],
      rules: organicMethods['141302']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: organicMethods['141302']!.memory,
      pitfalls: [
        '把燃烧方程的氧原子数当成 O₂系数。',
        '求最终气体体积时漏剩余氧气或水蒸气。',
        '把裂解和分馏都解释为按沸点分离。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-hydrocarbons'],
      examFocus: {
        goal: '从烷烃结构出发配平燃烧，并正确处理气体物态与过量反应物。',
        pastPaperSummary:
          '已收录真题对烷烃主要采用燃烧计量：由耗氧量反推碳链，或计算高温下全部剩余气体。',
        pastPaperPatterns: [
          {
            form: '耗氧量反推烷烃',
            description: '同温同压体积比等于摩尔比，将耗氧系数与 (3n+1)/2 对应。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q055'],
          },
          {
            form: '燃烧后总气体体积',
            description: '先配平乙烷燃烧，扣掉耗氧，再加二氧化碳与仍为气态的水。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-012'],
          },
        ],
        pastPaperNote: '取代、分馏和裂解属于本节基础复习；当前收录年度题中未据此虚构独立考法频次。',
        examples: [
          {
            title: '650 : 100 的耗氧比对应哪种烷烃',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q055',
              why: '从气体比反推通式并回答题目真正要求的系数和。',
            },
            question: '',
            answer: 'D · 15.5。',
            steps: [
              '气体同温同压，1 体积烷烃消耗 6.5 体积 O₂，所以 a = 6.5。',
              '设烷烃 CₙH₂ₙ₊₂，耗氧系数 (3n+1)/2 = 6.5，解得 n = 4。',
              '方程为 C₄H₁₀ + 6.5O₂ → 4CO₂ + 5H₂O。',
              '题目问 a+b+c，不是碳数或氧系数：6.5+4+5=15.5。',
            ],
            takeaway: '==先反推结构，最后回到问题要求的量==。',
          },
        ],
        checklist: ['能写烷烃通式。', '能配平完全与指定不完全燃烧。', '能处理气态水与剩余氧气。'],
      },
    },
    {
      code: '141303',
      title: '烯烃',
      summary: organicMethods['141303']!.summary,
      paragraphs: [organicMethods['141303']!.intro],
      rules: organicMethods['141303']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: organicMethods['141303']!.memory,
      pitfalls: [
        '看到一个分子就只乘 1 mol Br₂。',
        '把 Br₂中的两个 Br 当成两份反应试剂。',
        '由 cm³算得试剂体积后忘记浓度使用 dm³。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-hydrocarbons'],
      examFocus: {
        goal: '用双键结构预测加成产物，并完成密度、摩尔数与溶液体积的换算。',
        pastPaperSummary:
          '真题既用结构和加成次数筛选分子，也将加成接到质量分数、键能和试剂用量。结构识别是计算的第一步。',
        pastPaperPatterns: [
          {
            form: '氢卤酸与卤素的加成产物辨析',
            description: 'HBr 只提供一个 Br，不能把丙烯与 HBr 的产物写成加 Br₂形成的二溴化合物。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q049'],
          },
          {
            form: '双键数量决定试剂量',
            description: '识别环上两个双键，按密度把样品体积转成摩尔数，再求溴溶液体积。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q057'],
          },
          {
            form: '加成后质量与结构限制',
            description: '结合溴的质量分数求产物质量，或结合加氢、燃烧、聚合线索选择结构。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q059', 'ESAT_LEGACY_2022_NSAA_Q054'],
          },
          {
            form: '加成反应接键能计算',
            description: '识别双键改为单键和新形成的键，计算氢化或水合过程的键能差。',
            reference: '2016、2023 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q054', 'NSAA_2023_S1-Q050'],
          },
        ],
        examples: [
          {
            title: '两个双键，溴溶液要用多少',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2023_S1-Q057',
              why: '从真实结构图读双键数，避免只做数值换算。',
            },
            question: '',
            answer: 'H · 0.0084 dm³。',
            steps: [
              '样品质量为 0.10 cm³ × 0.84 g cm⁻³ = 0.084 g。',
              '有机物物质的量为 0.084/80 = 0.00105 mol。',
              '结构有两个 C=C，所需 Br₂为 0.00210 mol；Br₂本身的下标 2 不再额外乘。',
              'V = n/c = 0.00210/0.250 = 0.00840 dm³，即 8.40 cm³，选 H。',
            ],
            takeaway: '==先数反应位置，再换算用量==。',
          },
        ],
        checklist: ['能画加成前后结构。', '能按双键数求试剂消耗。', '能解释溴水检验的条件。'],
      },
    },
    {
      code: '141304',
      title: '聚合物',
      summary: organicMethods['141304']!.summary,
      paragraphs: [organicMethods['141304']!.intro],
      rules: organicMethods['141304']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: organicMethods['141304']!.memory,
      pitfalls: [
        '把所有单体碳都放进聚合物主链。',
        '重复单元里仍保留被用于加聚的 C=C。',
        '对缩聚直接使用“单体质量×n”而不扣小分子。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-hydrocarbons', 'openstax-carbonyl'],
      examFocus: {
        goal: '准确画出和反推加聚重复单元，并区分加聚与缩聚的原子守恒。',
        pastPaperSummary:
          '直接考法集中在加聚重复单元的主链和侧链位置，也有把聚合物片段质量作为筛选单体的一条证据。',
        pastPaperPatterns: [
          {
            form: '由单体选择重复单元',
            description: '对末端或内部烯烃，保留双键碳各自的侧链，检查括号、延伸键和是否仍有双键。',
            reference: '2021、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q046', 'NSAA_2023_S1-Q042'],
          },
          {
            form: '重复单元质量与结构交叉判断',
            description: '给定三个重复单元的质量范围，同时满足燃烧碳数、加氢次数与支链信息。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q054'],
          },
        ],
        pastPaperNote:
          '现有题库另有聚酯重复单元和有限链脱水题；它们用于补足缩聚训练，不作为历年真题证据。',
        examples: [
          {
            title: '丁-1-烯的乙基侧链必须留下',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2023_S1-Q042',
              why: '直接考主链与侧链，是聚合结构最典型的失分点。',
            },
            question: '',
            answer: 'E',
            steps: [
              '先写丁-1-烯：CH₂=CH–CH₂–CH₃。前两个碳才是双键碳。',
              '加聚将前两个碳连接成主链；第一个带两个 H，第二个带 H 和乙基 –CH₂CH₃。',
              '得到重复单元 –CH₂–CH(CH₂CH₃)–，外加括号、两侧延伸键和 n。',
              '检查总碳数仍为 4、总氢数仍为 8，并排除保留双键或把侧链丢失的结构，选 E。',
            ],
            takeaway: '==加聚改变连接，不丢失侧链==。',
          },
        ],
        checklist: ['能画丁-1-烯重复单元。', '能由重复单元恢复单体。', '能区分加聚与缩聚。'],
      },
    },
    {
      code: '141305',
      title: '醇',
      summary: organicMethods['141305']!.summary,
      paragraphs: [organicMethods['141305']!.intro],
      rules: organicMethods['141305']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: organicMethods['141305']!.memory,
      pitfalls: [
        '把乙醇与钠的产物写成乙酸钠。',
        '忽略蒸馏与回流对进一步氧化的影响。',
        '计燃烧耗氧时忘记醇自带的氧原子。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-alcohols', 'openstax-carbonyl'],
      examFocus: {
        goal: '由醇结构和条件预测反应，并用原子守恒处理产物与耗氧量。',
        pastPaperSummary:
          '历年题把醇放进产物判断、钠反应质量变化、水合键能、燃烧热和不完全燃烧计量等不同情境，不能只记“醇会燃烧”。',
        pastPaperPatterns: [
          {
            form: '反应物与产物配对',
            description: '区分醇与金属、羧酸的反应及加成产物，逐行检查官能团改变。',
            reference: '2021、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q049', 'ESAT_LEGACY_2022_NSAA_Q049'],
          },
          {
            form: '与碱金属反应后的质量变化',
            description: '等质量金属产生不同摩尔数 H₂，敞口容器变化还要计入加入的金属质量。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-018'],
          },
          {
            form: '燃烧与能量或氧气用量',
            description: '热量题先处理能量传递效率；不完全燃烧题按指定 CO、CO₂比例及醇内氧守恒。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q055', 'NSAA_2023_S1-Q060'],
          },
          {
            form: '乙烯水合生成乙醇的键能',
            description: '比较反应前后真正改变的键，不重复计入两侧相同的键。',
            reference: '2016 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q054'],
          },
        ],
        examples: [
          {
            title: '丙醇自身的氧，也要计入燃烧守恒',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2023_S1-Q060',
              why: '把醇的结构与不完全燃烧连接，训练不会被熟悉方程误导。',
            },
            question: '',
            answer: 'C · 7.5 mol O₂。',
            steps: [
              '2 mol C₃H₇OH 含 6 mol C 原子、16 mol H 原子、2 mol O 原子。',
              'CO₂和 CO 等物质的量，共分配 6 mol C，因此各为 3 mol；氢生成 8 mol H₂O。',
              '产物共需氧原子 3×2 + 3×1 + 8×1 = 17 mol。',
              '醇已经提供 2 mol O，氧气需提供 15 mol O 原子，所以 n(O₂)=7.5 mol。',
            ],
            takeaway: '==有机物里的氧不能漏扣，氧原子数还要除以 2 才是 O₂==。',
          },
        ],
        checklist: [
          '能区分伯醇与仲醇氧化产物。',
          '能解释回流和蒸馏条件。',
          '能处理含氧有机物燃烧。',
        ],
      },
    },
    {
      code: '141306',
      title: '羧酸',
      summary: organicMethods['141306']!.summary,
      paragraphs: [organicMethods['141306']!.intro],
      rules: organicMethods['141306']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: organicMethods['141306']!.memory,
      pitfalls: [
        '计算羧酸碳数时漏掉 –COOH 的碳。',
        '把弱酸理解为同浓度时需要更少碱才能完全中和。',
        '由酯质量反求酸时再次减 18。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-carbonyl'],
      examFocus: {
        goal: '同时掌握羧酸的酸性反应和酯化组成，区分电离程度、反应总量与平衡。',
        pastPaperSummary:
          '真题围绕弱酸性质、二元羧酸滴定、酯化质量关系和平衡变化出题。同一个 –COOH 会进入不同计算链。',
        pastPaperPatterns: [
          {
            form: '弱酸性质与完全中和',
            description:
              '比较乙酸与盐酸的指示剂、碳酸盐反应和等浓度完全中和量，不能把弱酸当作无反应。',
            reference: '2017 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q039'],
          },
          {
            form: '羧基个数决定滴定比例',
            description: '乙二酸有两个酸性氢，按酸与 OH⁻的 1 : 2 比例求体积。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q053'],
          },
          {
            form: '酯化产物与相对分子质量',
            description: '读出酸醇组成及失去的水，反推未知酸的相对分子质量。',
            reference: '2021、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q049', 'ESAT_LEGACY_2022_NSAA_Q049'],
          },
          {
            form: '酯化平衡改变',
            description: '区分温度、加水、加醇与催化剂对平衡位置的作用。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q38'],
          },
        ],
        examples: [
          {
            title: '酯的质量不是酸与醇简单相加',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q049',
              why: '用真实酯化情境突出失水和反求方向。',
            },
            question: '',
            answer: 'H · 74。',
            steps: [
              '丙醇 C₃H₈O 的 Mᵣ为 3×12+8+16=60。',
              '酯化由羧酸和醇生成酯及水，因此 116 = Mᵣ(酸)+60−18。',
              '反求 Mᵣ(酸)=116−60+18=74。',
              '把得到的 74 加回 60 并减 18，确实得到 116；反查可排除把水再次扣掉的错误。',
            ],
            takeaway: '==生成物少了水，反求反应物要把水加回==。',
          },
        ],
        checklist: [
          '能识别羧基及羧基中的碳。',
          '能区分弱酸与稀酸。',
          '能完成酯化质量和多元酸计量。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-organic',
      title: 'UAT-UK · ESAT Content Specification · C13',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/16150826/ESAT_Content_Specification_May2024.pdf',
      note: '与当前启用考纲的 C13 子要求对照：命名、烃性质、四类加成、聚酯与聚酰胺、醇及羧酸。',
    },
    {
      id: 'openstax-hydrocarbons',
      title: 'OpenStax Chemistry 2e · Hydrocarbons',
      url: 'https://openstax.org/books/chemistry-2e/pages/20-1-hydrocarbons',
      note: '核对碳骨架、烃的通式、异构和加成反应。',
    },
    {
      id: 'openstax-alcohols',
      title: 'OpenStax Chemistry 2e · Alcohols and Ethers',
      url: 'https://openstax.org/books/chemistry-2e/pages/20-2-alcohols-and-ethers',
      note: '核对醇官能团、发酵与乙烯水合。',
    },
    {
      id: 'openstax-carbonyl',
      title: 'OpenStax Chemistry 2e · Carboxylic Acids and Esters',
      url: 'https://openstax.org/books/chemistry-2e/pages/20-3-aldehydes-ketones-carboxylic-acids-and-esters',
      note: '核对羧酸、酯结构及官能团反应。',
    },
  ],
}
