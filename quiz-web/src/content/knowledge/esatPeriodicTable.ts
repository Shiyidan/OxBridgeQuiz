// ESAT 化学周期表讲义：把元素位置、电子排布和反应性串成可用于真题与题库练习的复习路径。
import type { KnowledgeExamFocus, KnowledgeLesson } from './types'
import { periodicTableMethods } from './periodicTableMethods'

const positionExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '定位一个原子，再检查它上下左右的元素',
    question: '',
    source: {
      subject: 'chemistry',
      kind: 'annual',
      questionCode: 'NSAA_2023_S1-Q047',
      why: '用电子排布锁定中心元素，再把同族、同周期和相邻原子序数放到同一张位置图里判断。',
    },
    answer: 'A。',
    steps: [
      '先把题干中的层数翻译出来：前两层已满，第三层还差 1 个电子达到这一周期稀有气体的排布，因此 Q 的排布为 **2,8,7**。三个已占据电子层给出第 3 周期，7 个最外层电子给出第 17 族；Q 对应氯。',
      '上下先看族：上方是氟，位于第 2 周期，外层还差 1 个电子；下方是溴，同属卤素，但得电子的能力较弱。这是卤素族的比较，不能套用碱金属向下更活泼的方向。',
      '左右再看序号：左方硫比 Q 少 1 个质子；右方氩比 Q 多 1 个质子，并具有已充满的外层，通常很不活泼。**横向相邻看原子序数，纵向同族看相似外层排布**。',
      '把每个选项给出的方向与元素逐一核对。一个选项中只要有一个位置描述不符，就不能整体成立；A 的描述均与定位结果相符。',
    ],
    optionNotes: [
      'A：上方的氟外层差 1 个电子；下方的溴得电子能力较弱；左方少 1 个质子；右方是很不活泼的氩，方向与性质相符。',
      'B：右方元素是第 18 族的氩，不是卤素。',
      'C：左方元素是第 16 族的硫，不是第 2 族碱土金属。',
      'D：上方元素在第 2 周期，不是第 3 周期。',
      'E：左方元素的原子序数比 Q 小，不是更大。',
    ],
    takeaway:
      '画一个小十字，先写中心元素的位置，再写上下族、左右序号。==先定位再判断性质==，比同时在脑中比较四个方向更稳。',
  },
]

const sequenceExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '电子数相同，原子序数一定相邻吗？',
    question: '',
    source: {
      subject: 'chemistry',
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2018_NSAA_Q44',
      why: '用等电子粒子区分电子数、质子数与元素次序，练习识别题目中的“必然正确”。',
    },
    answer: 'A：Y 的质子数少于 X。',
    steps: [
      '设三种粒子共有 n 个电子。X 是中性原子，所以 X 的质子数也是 n；Y 是阴离子，电子数比质子数多；Z 是阳离子，质子数比电子数多。',
      '由电荷直接得到 **Y 的质子数 < n = X 的质子数 < Z 的质子数**。原子序数就是质子数，因此元素的次序为 Y、X、Z。这里不必猜出具体元素名称。',
      '题干没有规定离子一定带一个单位电荷。因此虽然原子序数有大小顺序，却不能断定三者一定连续。它们也不必同族；相同的是这些粒子的电子排布，不是各自中性原子的排布。',
      '最后检查质量数：质量数还需要中子数，而题目未给中子数关系，不能从相同电子排布推出质量数相同。',
    ],
    optionNotes: [
      'A：阴离子 Y 的电子数大于质子数，而中性 X 的两者相等，所以 Y 的质子数少于 X，必然正确。',
      'B：阳离子 Z 应当质子多于电子，该说法把电荷方向反了。',
      'C：等电子粒子不必来自同族元素；定位要用各元素的原子序数或中性原子排布。',
      'D：原子序数的顺序可确定，但离子电荷数没有限定，不能推出连续。',
      'E：没有中子数条件，无法推出质量数相同。',
    ],
    takeaway:
      '遇到“中性＋阴离子＋阳离子”但电子数相同，先设共同电子数，再用==质子数 − 电子数 = 电荷数==判断顺序；不要擅自补上电荷为 ±1 的条件。',
  },
]

const regionExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '用性质线索找到周期表中的中央区域',
    question: '',
    source: {
      subject: 'chemistry',
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E04-020-R8-FINAL-20260818',
      why: '从题目的简化周期表与性质线索识别过渡金属区域，练习看原图而非只背区域名称。',
    },
    answer: 'B：区域 Q。',
    steps: [
      '先读原图中的位置：P 在左侧，Q 在中央，R 在右侧，S 在最右列。图中用字母作区域标签，不能把 Q 当成化学元素符号。',
      '题目给出多种氧化态和催化作用这些线索，它们是许多过渡金属及其化合物的典型特征。在这道题的比较范围内，应找周期表中央的过渡金属区域。',
      '原图中央标为 Q，所以选 B。这里要把“由性质识别类别”和“由图中标签识别选项”分成两步，避免类别判断对了却选错字母。',
      '这些性质是本题提供的识别依据，不能反过来声称每个中央元素都具有完全相同的氧化态或催化性能。',
    ],
    optionNotes: [
      'A：P 是左侧区域，不对应题目要识别的中央过渡金属区。',
      'B：Q 位于中央，与所给典型性质线索相符。',
      'C：R 位于右侧，不是图中的中央过渡金属区。',
      'D：S 是最右列的稀有气体位置，不能据题述性质选它。',
      'E：题干已经给出可与原图匹配的性质线索，并非无法确定。',
    ],
    takeaway:
      '区域题先读图例，再把性质对应到类别，最后读选项字母。**元素族、金属类别、图中区域标签**分别记，避免混在一起。',
  },
]

const configurationExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '先从 X⁺ 还原中性原子，再判断族与化学式',
    question: '',
    source: {
      subject: 'chemistry',
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E01-003-R8-FINAL-20260818',
      why: '把离子电子数还原为中性原子电子排布，检查位置判断与电荷配比是否使用了同一个粒子。',
    },
    answer: 'F：只有陈述 I 和 III 正确。',
    steps: [
      'X⁺ 有 18 个电子，正电荷说明比中性原子少了 1 个电子。原子核没有因此改变，所以 X 的质子数为 **18 + 1 = 19**，陈述 I 正确。',
      '中性 X 有 19 个电子，排布为 **2,8,8,1**。它在第 4 周期、第 1 族，对应钾；不是把 X⁺ 的 2,8,8 直接当成元素位置。因此陈述 III 正确。',
      '再判断氧化物：X⁺ 每个带 +1 电荷，O²⁻ 每个带 −2 电荷。要使总体中性，需 2 个 X⁺ 对 1 个 O²⁻，化学式应为 X₂O，陈述 II 的 XO 不成立。',
      '题目所给 20 个中子可与 19 个质子合出质量数 39，但中子数不决定族和周期。先找对当前问题需要的量，避免让额外条件打乱电子计数。',
    ],
    optionNotes: [
      'A：全部否定，漏掉正确的 I 和 III。',
      'B：I 正确，但 III 的中性原子排布也正确。',
      'C：只选 II，而 XO 的正负电荷不能抵消。',
      'D：III 正确，但不能漏掉 I 的原子序数判断。',
      'E：虽然保留了 I，却多选错误的 II 并漏掉 III。',
      'F：恰好保留 I、III，排除电荷配比错误的 II。',
      'G：III 正确，但 II 错误，且遗漏 I。',
      'H：多选 II；X⁺ 与 O²⁻ 应组成 X₂O。',
    ],
    takeaway:
      '题目给离子时，==先还原中性原子，再定位元素==；写化学式时再回到离子电荷。原子位置与化合物配比是相连的两步，但使用的数据不同。',
  },
]

const trendExamples: KnowledgeExamFocus['examples'] = [
  {
    title: 'LiBr 的两种元素，分别沿哪条趋势找？',
    question: '',
    source: {
      subject: 'chemistry',
      kind: 'annual',
      questionCode: 'ESAT-2020-CHEMISTRY-001',
      why: '把碱金属、卤素以及物理性质分开比较，避免用一条“向下增大”口诀处理所有量。',
    },
    answer: 'F：只有陈述 1 和 3 正确。',
    steps: [
      '先圈定比较范围：碱金属只比较 Li、Na、K，卤素只比较 F、Cl、Br。LiBr 由锂与溴构成；题目问的是这两种元素在各自组内的性质，不是 LiBr 这种盐自身的性质。',
      '反应性分两条：Li → Na → K，碱金属反应性增强；F → Cl → Br，卤素反应性减弱。Br 是给定三种卤素中反应性最低的，所以陈述 1 正确。',
      '陈述 2 的前半部分符合 Li：它是给定三种碱金属中最不活泼的。但卤素单质的沸点向下升高，给定三者中沸点最低的是 F₂，不是 Br₂。**合取陈述有一部分错误，整句就错误**。',
      'Li、Na、K 的熔点总体向下降低，因此这三种碱金属中熔点最高的是 Li，陈述 3 正确。保留 1、3，对照原题组合选 F。',
      '反应性讨论电子得失；熔点、沸点讨论物质结构及粒子间作用。不能因为两个量都随族变化，就把它们的变化方向或原因混为一谈。',
    ],
    optionNotes: [
      'A：全部否定，漏掉陈述 1、3。',
      'B：陈述 1 正确，但陈述 3 也正确。',
      'C：只选错误的陈述 2，混淆了溴与最低沸点的氟。',
      'D：陈述 3 正确，但不能漏掉陈述 1。',
      'E：保留了陈述 1，却多选错误的陈述 2 并漏掉 3。',
      'F：恰好保留 1、3，符合两个元素各自的比较结果。',
      'G：陈述 3 正确，但陈述 2 错误，且遗漏 1。',
      'H：多选陈述 2；“锂最不活泼”不能弥补另一半沸点判断的错误。',
    ],
    takeaway:
      '先写“比较范围”，再把**反应性、熔点、沸点分成不同栏**。同一句话里的两个条件要分别核验，不能前半句对就直接选。',
  },
]

export const esatPeriodicTable: KnowledgeLesson = {
  code: '140200',
  title: 'The Periodic Table · 周期表',
  subtitle: '从位置读结构，用结构解释性质',
  intro:
    '原子序数决定元素位置，电子排布连接周期、族与化学性质；同族反应性的变化要结合电子得失判断。',
  memory: [
    '==横排周期，竖列元素族==；本章采用 IUPAC 的第 1—18 族编号。',
    '**原子序数 = 质子数**。得失电子、改变中子数都不会把元素移动到另一个格子。',
    '前 20 号中性基态原子：**已占据电子层数看周期，最外层电子数看主族**；13—18 族按外层数加 10，He 单独记。',
    '左侧与中央多金属，右上多非金属；**H 是非金属，He 外层 2 个就满，B、Si 常单列类金属**。',
    '==碱金属向下更容易失电子，卤素向下得电子能力减弱==；不能泛化为所有元素的统一趋势。',
    '**先看粒子是原子还是离子，再看题目比较什么量**。位置、反应性、熔点与沸点各用各的依据。',
  ],
  sections: [
    {
      code: '140201',
      title: '周期与族',
      summary: periodicTableMethods['140201'].summary,
      paragraphs: [periodicTableMethods['140201'].intro],
      memory: periodicTableMethods['140201'].memory,
      rules: periodicTableMethods['140201'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把 period 和 group 读反，导致第 3 周期第 17 族变成不存在的第 17 周期。',
        '看到同一横排就认定最外层电子数相同。',
        '把旧资料的 Group 7 直接套入本章 1—18 族编号。',
      ],
      sourceIds: ['uat-c2', 'iupac-table', 'openstax-periodic'],
      visual: 'periodic-table',
      examFocus: {
        goal: '看到元素位置图，能分别说清上下与左右的关系，再用电子结构核验。',
        pastPaperSummary:
          '真题把“周期、族”当作解题坐标：既要从粒子信息定位，也要从位置继续判断邻居、结构或性质。多列选项须逐格检查。',
        pastPaperPatterns: [
          {
            form: '粒子信息 → 周期与族',
            description:
              '用原子序数或电子层的文字线索代替元素名，要求选出周期、族及其他信息同时符合的一行；质量数据与位置数据需要分开处理。',
            reference: '2018、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q40', 'NSAA_2023_S1-Q047'],
          },
          {
            form: '周期—族坐标 → 性质判断（综合）',
            description:
              '直接给出陌生元素的周期与族，再把外层电子、化合物性质或同位素计算放进多陈述选择；定位是后续判断的入口。',
            reference: '2020、2023 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-008', 'NSAA_2023_S1-Q052'],
          },
          {
            form: '局部位置图与邻位关系',
            description:
              '只展示部分元素，或描述一个元素上、下、左、右的邻居；据此核对位置关系。综合题还会混合不同元素及其化合物的性质排序。',
            reference: '2021、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q044', 'NSAA_2023_S1-Q047'],
          },
          {
            form: '等电子条件下的同族判断',
            description:
              '让不同电荷的粒子具有相同电子排布，询问它们是否必定同族；需要核对“粒子的排布”和“所属元素的位置”是否是同一条件。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q44'],
          },
        ],
        comparison: {
          title: '先分清两种方向',
          columns: ['比较方向', '相同的是什么', '不要推出'],
          rows: [
            [
              '同一周期：横向',
              '前 20 号中性基态原子的已占据电子层数',
              '最外层电子数或化学性质相同',
            ],
            ['同一主族：纵向', '相似的最外层排布与化学性质', '总电子数相同；所有性质完全相同'],
            ['第 18 族的 He 与 Ne', '最外层均已充满', 'He 也有 8 个外层电子'],
          ],
        },
        examples: positionExamples,
        checklist: [
          '能在空白简图中指出周期与族的方向。',
          '能把 Na、Cl、Ar 放在同一周期的正确族。',
          '能说明为什么“同周期”不能当作“同性质”。',
        ],
      },
    },
    {
      code: '140202',
      title: '按原子序数排列',
      summary: periodicTableMethods['140202'].summary,
      paragraphs: [periodicTableMethods['140202'].intro],
      memory: periodicTableMethods['140202'].memory,
      rules: periodicTableMethods['140202'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '按相对原子质量的小数从小到大重新给元素排序。',
        '把阴离子的电子数当成该元素的原子序数。',
        '把等电子粒子理解为同一元素，或直接认定它们原子序数连续。',
      ],
      sourceIds: ['uat-c2', 'iupac-table', 'openstax-periodic'],
      visual: 'periodic-table',
      examFocus: {
        goal: '从粒子数据恢复质子数，用确定的信息判断元素次序。',
        pastPaperSummary:
          '原子序数既用于辨认元素，也用于判断先后关系。真题会混入质量信息或离子条件，关键是只用确定的质子数结论继续推理。',
        pastPaperPatterns: [
          {
            form: '原子序数作为综合题入口',
            description:
              '给出原子序数，要求定位元素并判断周期、族或氧化物；有时同时给质谱数据，让位置判断与相对原子质量计算并列出现。',
            reference: '2017、2018 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q042', 'ESAT_LEGACY_2018_NSAA_Q40'],
          },
          {
            form: '等电子粒子的序号关系',
            description:
              '给出电子排布相同的中性原子、阴离子与阳离子，询问哪项关系必然成立；考查能否由电荷判断质子数，并区分顺序与连续。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q44'],
          },
          {
            form: '邻位元素的质子数判断',
            description:
              '把左邻、右邻的质子数或原子序数比较放进综合选项，要求把周期表中的左右位置翻译成数量关系。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q047'],
          },
        ],
        comparison: {
          title: '改变一种粒子，元素位置会变吗？',
          columns: ['改变', '通常得到', '原子序数与位置'],
          rows: [
            ['同一原子得失电子', '该元素的离子', '不变'],
            ['同一元素中子数不同', '该元素的不同同位素', '不变'],
            ['核内质子数改变', '另一种元素', '改变；不属于普通化学反应中的电子得失'],
          ],
        },
        examples: sequenceExamples,
        checklist: [
          '能用质子数说明周期表的排序规则。',
          '能说明为什么同位素和离子不另占一个元素格。',
          '能区分“原子序数有大小关系”和“原子序数连续”。',
        ],
      },
    },
    {
      code: '140203',
      title: '金属与非金属的位置',
      summary: periodicTableMethods['140203'].summary,
      paragraphs: [periodicTableMethods['140203'].intro],
      memory: periodicTableMethods['140203'].memory,
      rules: periodicTableMethods['140203'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把氢算进碱金属，或因为氦外层有 2 个电子把它算进碱土金属。',
        '忽略 B、Si 等分界附近的元素，把整张表机械分成左金属、右非金属。',
        '把中央空白理解为前 3 周期缺失了一批元素。',
      ],
      sourceIds: ['uat-c2', 'iupac-table', 'openstax-periodic'],
      visual: 'periodic-table',
      examFocus: {
        goal: '把族名、代表元素与区域位置联系起来，能读懂换了字母标签的简化周期表。',
        pastPaperSummary:
          '类别判断通常嵌在综合题中：先由位置识别元素，再用成键、氧化物或实验用途核验性质；不能只凭“在左边或右边”直接下结论。',
        pastPaperPatterns: [
          {
            form: '元素位置 → 类别与化合物（综合）',
            description:
              '以原子序数或周期—族坐标指定元素，继续判断其氧化物、与其他元素形成的化合物及酸碱行为；金属或非金属的识别是推理的一步。',
            reference: '2017、2020、2023 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q042', 'ESAT-2020-CHEMISTRY-008', 'NSAA_2023_S1-Q052'],
          },
          {
            form: '相邻元素的类别辨认',
            description:
              '在相邻元素的描述中混入“卤素”“碱土金属”等族名，要求先确定位置，再检查类别标签是否与该位置相符。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q047'],
          },
          {
            form: '局部周期表中的性质排错（综合）',
            description:
              '给出局部周期表，混合比较金属单质、盐和共价物质的导电性、熔点与键型；先辨认对象，再用结构与成键知识排错。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q044'],
          },
          {
            form: '元素类别与实验角色（综合）',
            description:
              '在金属提取实验中加入稀有气体气氛，让你辨别它承担的角色；考查能否把元素类别与具体实验目的联系起来。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q049'],
          },
        ],
        pastPaperNote:
          '已收录的 2016—2023 年真题中，未见直接要求划出整张表的金属、非金属或过渡金属区域的题目；下方区域定位例题来自试题库。结构与用途题属于跨章运用。',
        comparison: {
          title: '位置速查',
          columns: ['元素族 / 区域', '位置与代表', '特别注意'],
          rows: [
            ['碱金属', '第 1 族：Li、Na、K', '不含 H'],
            ['碱土金属', '第 2 族：Be、Mg、Ca', '不含 He'],
            ['第 16 族常见非金属', 'O、S', '不能推成全族都是非金属'],
            ['卤素 / 稀有气体', '第 17 族 / 第 18 族', 'He 属第 18 族'],
            ['过渡金属', '中央区域；如 Fe、Cu', '不使用简单主族外层电子速算法'],
          ],
        },
        examples: regionExamples,
        checklist: [
          '能不依靠配色指出碱金属、卤素和稀有气体的位置。',
          '能指出 H 与 He 各自容易误判的地方。',
          '能在简化表中定位中央过渡金属区域。',
        ],
      },
    },
    {
      code: '140204',
      title: '位置与电子排布',
      summary: periodicTableMethods['140204'].summary,
      paragraphs: [periodicTableMethods['140204'].intro],
      memory: periodicTableMethods['140204'].memory,
      rules: periodicTableMethods['140204'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '直接用阳离子已占据的层数决定所属元素周期。',
        '把第 17 族理解成有 17 个最外层电子。',
        '把氦的 2 个外层电子与第 2 族混同。',
        '把“前 20 号常用 2,8,8…”当成所有电子层的普遍容量规则。',
      ],
      sourceIds: ['uat-c2', 'iupac-table', 'openstax-electron'],
      visual: 'periodic-table',
      examFocus: {
        goal: '能在原子序数、电子排布、周期族位置之间双向转换，并处理离子条件。',
        pastPaperSummary:
          '真题会双向连接“位置”和“电子结构”，再延伸到常见电荷与化学式。先确认讨论的是中性原子还是离子，再处理其他数据。',
        pastPaperPatterns: [
          {
            form: '原子序数或排布 → 元素位置',
            description:
              '从原子序数、已占据电子层或某层还差几个电子恢复中性原子的排布，再选周期与族或判断周围元素；同位素质量不是定位依据。',
            reference: '2018、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q40', 'NSAA_2023_S1-Q047'],
          },
          {
            form: '周期与族 → 外层电子判断',
            description:
              '给出周期—族坐标，把最外层电子数与同位素丰度、化合物性质放在同一组选项中；需要分清各条陈述分别使用哪一项条件。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q052'],
          },
          {
            form: '相同排布能推出什么',
            description:
              '让不同电荷的粒子具有相同电子排布，再询问同族、序号或粒子数等结论是否必然成立，考查原子与离子的条件边界。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q44'],
          },
          {
            form: '主族常见电荷 → 化学式（综合）',
            description:
              '由主族位置或熟悉元素的外层电子判断常见电荷，核对化学式、反应流程或计量关系。式子正确后，还要继续检查题给的成键、酸碱或电解条件。',
            reference: '2017、2018、2020、2022、2023 NSAA',
            sourceCodes: [
              'NSAA_2017_S1-Q042',
              'ESAT_LEGACY_2018_NSAA_Q48',
              'ESAT-2020-CHEMISTRY-005',
              'ESAT-2020-CHEMISTRY-008',
              'ESAT_LEGACY_2022_NSAA_Q042',
              'ESAT_LEGACY_2022_NSAA_Q050',
              'NSAA_2023_S1-Q049',
              'NSAA_2023_S1-Q052',
            ],
          },
        ],
        comparison: {
          title: '同样的电子数，不同的元素位置',
          columns: ['粒子', '粒子电子排布', '元素的周期与族'],
          rows: [
            ['Ne 中性原子', '2,8', '第 2 周期、第 18 族'],
            ['Na⁺', '2,8', 'Na 中性为 2,8,1：第 3 周期、第 1 族'],
            ['Mg²⁺', '2,8', 'Mg 中性为 2,8,2：第 3 周期、第 2 族'],
            ['He 中性原子', '2', '第 1 周期、第 18 族'],
          ],
        },
        examples: configurationExamples,
        checklist: [
          '能把 2,8,6 对应到第 3 周期、第 16 族。',
          '能从离子电子数与电荷还原中性原子。',
          '能解释氦为何在第 18 族，以及这条速算法为什么不用于过渡金属。',
        ],
      },
    },
    {
      code: '140205',
      title: '族性质与反应性趋势',
      summary: periodicTableMethods['140205'].summary,
      paragraphs: [periodicTableMethods['140205'].intro],
      memory: periodicTableMethods['140205'].memory,
      rules: periodicTableMethods['140205'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '只说“向下质子更多，所以更容易吸引电子”，漏掉层数、距离和屏蔽变化。',
        '把碱金属的反应性方向用到卤素。',
        '把相同族理解为熔点、沸点、反应速度全部相同。',
        '没有读清“所给三种元素”的比较范围，擅自加入题目没有要求的元素。',
      ],
      sourceIds: [
        'uat-c2',
        'openstax-trends',
        'aqa-groups',
        'rsc-lithium',
        'rsc-sodium',
        'rsc-potassium',
      ],
      visual: 'periodic-table',
      examFocus: {
        goal: '先说清元素族与电子得失，再解释趋势；遇到多条件选项逐条核对。',
        pastPaperSummary:
          '真题既问同族性质怎样变化，也把族共性放进反应与计算中。审题先分清元素单质、化合物还是离子，再分清比较反应性、物理性质还是反应终点。',
        pastPaperPatterns: [
          {
            form: '电子得失与趋势适用范围',
            description:
              '判断同族元素失去或获得电子的倾向，或检查一个反应性说法能否推广到所有元素族；也会与周期、族名和氧化还原陈述混合设问。',
            reference: '2020、2022、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-008',
              'ESAT_LEGACY_2022_NSAA_Q044',
              'NSAA_2023_S1-Q047',
            ],
          },
          {
            form: '多族、多性质的排序与排错',
            description:
              '混合比较碱金属、卤素的反应性与熔沸点，要求选择成立的组合，或排除综合排序中的错误项。每一种性质都要单独核对方向与比较范围。',
            reference: '2018、2020、2021 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q48',
              'ESAT-2020-CHEMISTRY-001',
              'ESAT_LEGACY_2021_NSAA_Q044',
            ],
          },
          {
            form: '卤素置换 → 实验现象（综合）',
            description:
              '检查一种卤素能否把另一种卤素从卤化物中置换出来，或把置换藏在电解产物、溶液混合与颜色变化中；先判断方向，再解释现象。',
            reference: '2018、2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q42',
              'ESAT_LEGACY_2018_NSAA_Q48',
              'ESAT_LEGACY_2022_NSAA_Q041',
            ],
          },
          {
            form: '族共性 → 产物与后续判断（综合）',
            description:
              '先用常见族价态和反应方式确定化学式或产物，再判断氧化物性质、流程是否成立，或计算气量、质量与限量产率。只记反应性顺序不能完成这类题。',
            reference: '2016—2018、2020、2022、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q051',
              'NSAA_2017_S1-Q042',
              'NSAA_2017_S1-Q044',
              'ESAT_LEGACY_2018_NSAA_Q48',
              'ESAT_LEGACY_2018_NSAA_Q53',
              'ESAT-2020-CHEMISTRY-005',
              'ESAT-2020-CHEMISTRY-008',
              'ESAT_LEGACY_2022_NSAA_Q042',
              'ESAT_LEGACY_2022_NSAA_Q050',
              'NSAA_2023_S1-Q049',
              'NSAA_2023_S1-Q052',
            ],
          },
          {
            form: '性质比较的对象与条件',
            description:
              '并排比较同族金属的实验，却询问反应完成后的质量，或改用这些金属的盐溶液比较沉淀。要检查真正参与反应的粒子与计量条件，不能直接套单质反应性。',
            reference: '2020、2023 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-018', 'NSAA_2023_S1-Q044'],
          },
          {
            form: '稀有气体的性质与用途（综合）',
            description:
              '在高温提取金属的实验中给出稀有气体气氛，将其用途与催化作用等角色作比较；考查元素性质是否支持所给实验解释。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q049'],
          },
        ],
        pastPaperNote:
          '“综合”题还需要后续成键、酸碱、计量或电解知识。一般金属活动性排序不等同于同族趋势；本节不把两者混为一种考法。',
        comparison: {
          title: '两种反应性，分别记方向',
          columns: ['比较范围', '关键电子变化', '向下的趋势'],
          rows: [
            ['Li → Na → K', '失去 1 个最外层电子', '更容易失去，反应性增强'],
            ['Cl → Br → I', '卤素单质取得电子', '氧化性减弱，置换能力降低'],
            ['He、Ne、Ar', '中性原子外层已满', '通常很不活泼，不套上述一条方向'],
          ],
        },
        examples: trendExamples,
        checklist: [
          '能用外层距离与屏蔽说明 Li、Na、K 的趋势。',
          '能判断 Cl₂ 与溴化物溶液的置换方向。',
          '能把反应性与熔点、沸点分开比较。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-c2',
      title: 'UAT-UK · ESAT Content Specification（2026/27）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对 C2.1—C2.5 范围与 1—18 族编号；趋势以碱金属、卤素等具体元素族说明，不将简化措辞无限外推。',
    },
    {
      id: 'iupac-table',
      title: 'IUPAC · Periodic Table of Elements',
      url: 'https://iupac.org/what-we-do/periodic-table-of-elements/',
      note: '核对元素符号、原子序数、周期与族的位置；互动表原创绘制，不复制资料图像。',
    },
    {
      id: 'openstax-periodic',
      title: 'OpenStax · Chemistry 2e: The Periodic Table',
      url: 'https://openstax.org/books/chemistry-2e/pages/2-5-the-periodic-table',
      note: '核对横向周期、纵向族、按原子序数排列，以及金属、类金属与非金属分布。',
    },
    {
      id: 'openstax-electron',
      title: 'OpenStax · Chemistry 2e: Electronic Structure of Atoms',
      url: 'https://openstax.org/books/chemistry-2e/pages/6-4-electronic-structure-of-atoms-electron-configurations',
      note: '核对中性基态原子排布与周期位置、前 20 号元素范围、氦的特殊外层与离子排布边界。',
    },
    {
      id: 'openstax-trends',
      title: 'OpenStax · Chemistry 2e: Periodicity',
      url: 'https://openstax.org/books/chemistry-2e/pages/18-1-periodicity',
      note: '核对碱金属失电子与反应性，以及不能将第 1、2 族的变化方向推广到所有金属族。',
    },
    {
      id: 'aqa-groups',
      title: 'AQA · Atomic structure and the periodic table',
      url: 'https://www.aqa.org.uk/subjects/chemistry/gcse/chemistry-8462/specification/subject-content/atomic-structure-and-the-periodic-table',
      note: '核对碱金属与卤素的反应及置换趋势、卤素熔沸点；该资料旧编号 Group 7 / Group 0 在本文换为 IUPAC 第 17 / 18 族。',
    },
    {
      id: 'rsc-lithium',
      title: 'Royal Society of Chemistry · Lithium',
      url: 'https://periodic-table.rsc.org/element/3/lithium',
      note: '核对锂的物理性质，与 Na、K 的熔点比较用于已入库真题讲解。',
    },
    {
      id: 'rsc-sodium',
      title: 'Royal Society of Chemistry · Sodium',
      url: 'https://periodic-table.rsc.org/element/11/sodium',
      note: '核对钠的物理性质；不向讲义引入无关数据表。',
    },
    {
      id: 'rsc-potassium',
      title: 'Royal Society of Chemistry · Potassium',
      url: 'https://periodic-table.rsc.org/element/19/potassium',
      note: '核对钾的物理性质，与 Li、Na 对比核验真题条件。',
    },
  ],
}
