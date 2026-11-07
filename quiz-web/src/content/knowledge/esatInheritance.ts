// ESAT 生物遗传讲义：串联遗传物质、遗传术语与单基因概率，使用诊断真题分析及原创变式。
import { inheritanceMethods } from './inheritanceMethods'
import type { KnowledgeExamFocus, KnowledgeLesson } from './types'

const materialExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '一人取一个细胞，怎样数隐性等位基因？',
    source: {
      questionCode: 'NSAA_2016_S1-Q059',
      why: '把基因的拷贝数、隐性纯合子与携带者放在同一道计数题里，适合检查遗传字母是否真正对应到了细胞中的结构。',
    },
    question: '',
    answer: 'E：81 258 个白化病等位基因。',
    steps: [
      '先别被总人口 580 000 带着走。题目问的是白化病等位基因有多少个，不是有多少人，也不是所有基因的总数。用 a 表示白化病等位基因，A 表示正常等位基因。',
      '口腔细胞是体细胞。按题目的单基因隐性遗传模型，患者是 aa，每个所取细胞贡献两个 a；无症状携带者是 Aa，每个细胞贡献一个 a；其余 AA 个体贡献零个 a。',
      '所以目标等位基因数为 **29 × 2 + 81 200 × 1 = 81 258**，与 E 对应。总人口中的 AA 个体再多，也不会增加 a 的数目。',
      '这道题正好把“基因有两份”和“等位基因有不同版本”分开了：Aa 细胞有这个基因的两份拷贝，但其中只有一份是题目要数的 a。',
    ],
    optionNotes: [
      'A（0）：患病者和携带者都含有 a，不能因为只取体细胞就当作没有遗传物质。',
      'B（29）：这是患者人数；每位患者所取的细胞含两个 a，而且还漏掉了携带者。',
      'C（58）：数对了患者的 29 × 2，但没有加上 81 200 个携带者提供的 a。',
      'D（81 229）：把患者也按每个细胞一个 a 计算了，漏掉患者的另一份。',
      'E（81 258）：患者各两个、携带者各一个，两部分相加正确。',
      'F（162 458）：把 Aa 携带者也算成每个细胞两个 a，混淆了基因拷贝总数与隐性版本的数量。',
    ],
    takeaway:
      '数某一种等位基因时，先按 **AA、Aa、aa 分别贡献 0、1、2 个 a** 分类。题目问“多少人”还是“多少个等位基因”，计数单位不同。',
    variant: {
      question:
        'From the same population, two cheek cells are collected from each person instead of one. Assume that none of the collected cells has replicated its DNA. How many copies of the albinism allele are present in the collected cells?',
      answer: '162 516 个。',
      explanation:
        '人群的基因型没有改变，只是每人取样数翻倍：81 258 × 2 = 162 516。也可以按患者 29 × 2 个细胞 × 2 个 a，再加携带者 81 200 × 2 个细胞 × 1 个 a。**取样细胞数增加，不会把携带者 Aa 变成 aa**。',
    },
  },
]

const termExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '基因型、表现型和能否繁殖，不能混在一起数',
    source: {
      questionCode: 'ESAT_LEGACY_2022_NSAA_Q077',
      why: '同一道题分别改变孵化、繁殖能力和样本数量，适合练习把遗传术语落实到题目实际统计的成虫群体。',
    },
    question: '',
    answer: 'A：三条陈述都不正确。',
    steps: [
      '先写一个共同起点：两个杂合子 Aa × Aa，在受精时产生 AA、Aa、aA、aa 四种等可能组合。合并相同基因型后是 **1 AA∶2 Aa∶1 aa**。题目要求三条陈述各自独立考虑，不要把前一条的条件带到后一条。',
      '陈述 1：如果 AA 的卵不能孵化，就只删除 AA。长成的成虫中还剩 2 Aa∶1 aa，基因型比例应为 2∶1，不是 1∶1。**两种基因型不代表数量各占一半**。',
      '陈述 2：sterile 是不育，不是死亡或不能发育为成虫。aa 个体仍在这次统计的年轻成虫中，并表现为隐性性状；因此不能说所有成虫表现型相同。',
      '陈述 3：样本少，确实可能使实际数量偏离理论比例，但不会凭空多出一种表现型。按题目的显隐性关系，AA 与 Aa 属于同一种显性表现型，aa 属于隐性表现型，只有两类；1∶2∶1 是三种基因型的理论比例。',
      '三条都不成立，选择 A。做这类题时，要分别确认 **统计谁、统计哪个阶段、分的是基因型还是表现型**。',
    ],
    optionNotes: [
      'A（none）：三条陈述分别核对后都不成立。',
      'B（1 only）：删除不能孵化的 AA 后，仍有两份 Aa 和一份 aa，不能写成 1∶1。',
      'C（2 only）：不育的 aa 仍可属于年轻成虫群体；不育不能直接当作缺席。',
      'D（3 only）：小样本会改变数量比例，不会把两种表现型变成三种。',
      'E（1 and 2）：同时误把剩下的基因型等分，并把不育个体从成虫中删除。',
      'F（1 and 3）：既没有保留 Aa 的两份组合，也把基因型比例当成表现型比例。',
      'G（2 and 3）：不育与存活、基因型与表现型，这两组概念都被混淆了。',
      'H（1, 2 and 3）：三条各有不同错误，不能因为都带有熟悉的遗传术语就全部接受。',
    ],
    takeaway:
      '先列受精时的基因型，再根据条件判断哪些个体进入统计。==不育不等于死亡，基因型不同也不一定表现型不同==。',
    variant: {
      question:
        'In an Aa × Aa cross with complete dominance, AA embryos die before hatching. All Aa and aa embryos survive to adulthood. In a large population, what fraction of the surviving adults is heterozygous, and what is the expected ratio of dominant to recessive phenotypes?',
      answer: '杂合子占 2/3；显性∶隐性表现型为 2∶1。',
      explanation:
        '受精时为 1 AA∶2 Aa∶1 aa，删去 AA 后，幸存者是 2 Aa∶1 aa。杂合子的分母要改成幸存的三份，所以占 2/3；Aa 显性、aa 隐性，因此表现型比例也是 2∶1。**这次问的是幸存成虫，不能继续以全部受精卵作分母**。',
    },
  },
]

const crossExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '女儿没有患病，为什么仍能确定她是携带者？',
    source: {
      questionCode: 'NSAA_2017_S1-Q064',
      why: '把家系图中的亲子关系转成基因型，再比较两种配偶条件；同时练习读清“女孩且患病”这一完整事件。',
    },
    question: '',
    answer: 'B：男方为显性纯合子时是 0；男方为杂合子时是 0.125。',
    steps: [
      '先读图例：黑色表示患病，圆形是女性，方形是男性。图中父亲患病，而两个女儿都未患病。以 a 表示隐性致病等位基因，患病父亲是 aa，给每个女儿的都只能是 a。',
      '女儿已经从父亲处得到 a，自己却未患病，另一份就必须是 A。因此两个女儿都能确定为 **Aa**，不需要猜哪一位女儿去生孩子。',
      '第一列把女儿与 AA 男性配对：Aa × AA 的孩子只能是 AA 或 Aa，不会出现 aa，所以“女孩且患病”的概率是 0。',
      '第二列改成 Aa 男性：Aa × Aa 中 aa 占 1/4。题目问的是 **女孩且患病**，还要乘生女孩的 1/2，得到 1/4 × 1/2 = 1/8 = 0.125。',
      '核对表中两列的顺序，0 和 0.125 对应 B。这里没有先告诉我们孩子一定是女孩，所以不能省略性别这一半。',
    ],
    optionNotes: [
      'A（0；0）：第一列正确，但两个携带者可以各传下 a，第二列不能为零。',
      'B（0；0.125）：两种男方基因型分别计算，并在第二列计入女孩概率，正确。',
      'C（0；0.25）：第二列只算了患病概率，漏掉“还必须是女孩”。',
      'D（0.5；0）：AA 男性不会传下 a，第一列不可能有患病孩子；第二列也不是零。',
      'E（0.5；0.125）：第二列正确，但第一列不能直接拿生女孩的概率作答案。',
      'F（0.5；0.25）：第一列忽略必须患病，第二列忽略必须是女孩，两列都没有满足完整事件。',
    ],
    takeaway:
      '家系图先从**确定的隐性纯合子 aa**入手，沿亲子连线追踪 a；概率计算时再区分“女孩且患病”与“已知是女孩，是否患病”。',
    variant: {
      question:
        'The daughter in the original family tree has a child with a heterozygous man. A scan has already established that the child is a girl. What is the probability that she has the condition, assuming the condition is autosomal?',
      answer: '1/4。',
      explanation:
        '这次已经知道孩子是女孩，计算范围只剩女孩，不再乘一次 1/2。母亲 Aa、父亲 Aa，常染色体基因型与性别独立，因此女孩中的患病比例仍为 1/4。**原题问两件事同时发生；变式把其中一件事变成已知条件**。',
    },
  },
  {
    title: '已知女儿未患病，下一代风险该怎样算？',
    source: {
      questionCode: 'ESAT_LEGACY_2022_NSAA_Q080',
      why: '代表家系题中容易失分的一步：上一代的表现型已知时，先重新确定其基因型概率，再计算下一代。',
    },
    question: '',
    answer: 'C：1/6。',
    steps: [
      '从最上面一代开始：父母都是杂合子，所以是 Aa × Aa。四种等可能组合为 AA、Aa、aA、aa，其中 aa 患病。',
      '题目已经告诉我们女儿未患病，要把 aa 排除。剩下 AA、Aa、aA 三种等可能组合，其中两种是携带者，所以 **女儿为 Aa 的概率是 2/3，为 AA 的概率是 1/3**。',
      '接着才看女儿与 Aa 男性的孩子。女儿若为 AA，不会有 aa 孩子；女儿若为 Aa，Aa × Aa 生出 aa 的概率是 1/4。',
      '两层条件连起来，孩子患病概率为 **2/3 × 1/4 = 1/6**，选 C。也可以理解为女儿传下 a 的概率是 2/3 × 1/2，男方再传下 a 的概率是 1/2。',
      '不要因为女儿只有 AA、Aa 两种可能，就把它们各算一半。**两个基因型名称，不代表两种等可能结果**；Aa 来自两种配子组合。',
    ],
    optionNotes: [
      'A（1/12）：把携带者概率当成 1/3，再乘 1/4，会少算一种杂合组合。',
      'B（1/8）：仍用女儿出生前为 Aa 的 1/2，没有利用她已经未患病这一信息。',
      'C（1/6）：先算未患病女儿为携带者的 2/3，再乘生出 aa 的 1/4，正确。',
      'D（3/4）：这是第一代 Aa × Aa 的未患病比例，既不是本题的事件，也没有处理下一代。',
      'E（11/12）：本题问患病；正确患病概率为 1/6，未患病应为 5/6，也不是 11/12。',
    ],
    takeaway:
      '看到“已知未患病”，先在 AA、Aa、aA、aa 中划掉 aa，再计算余下组合的比例。**先处理已知条件，再进入下一代**。',
    variant: {
      question:
        'A genetic test confirms that this daughter is heterozygous. She and the same heterozygous man have one affected child. What is the probability that their next child is affected, assuming independent conceptions and no mutations?',
      answer: '1/4。',
      explanation:
        '检测把女儿的基因型确定为 Aa，不再需要乘 2/3。两个亲本都是 Aa，每次受精产生 aa 的概率都是 1/4；上一胎已经患病不会改变下一胎的概率。**基因型的不确定性消失了，但每次受精的随机性仍存在**。',
    },
  },
]

export const esatInheritance: KnowledgeLesson = {
  code: '150400',
  title: 'Inheritance · 遗传',
  subtitle: '把遗传信息的位置、基因型与表现型、家系概率连起来',
  intro:
    '遗传题里的字母并不是另一套需要死记的密码。A 与 a 是同一基因的不同版本，杂交表是在列出它们怎样从亲本传给后代。本章先讲清这些字母对应的真实结构，再说明哪些表现能确定基因型、哪些只能给出可能性，最后用杂交与家系题练习概率。这样遇到新物种、新性状，也能从题目给出的条件出发。',
  memory: [
    '**基因是 DNA 的一段，等位基因是同一基因的不同版本**；染色体上可以排列许多基因。',
    '常染色体 autosome 是性染色体以外的染色体。**“常”不表示常见，也不表示只存在于体细胞**。',
    '完全显性模型中，AA 与 Aa 可有相同表现型；==显性不等于常见、有利或更容易传给后代==。',
    'Aa × Aa 的基因型为 1∶2∶1；只有在完全显性等条件下，表现型才是 3∶1。',
    '在常染色体隐性病模型中，aa 患病且完全显现时，Aa × Aa 的未患病后代中，携带者概率为 2/3；==“已知未患病”改变的是计算范围==。',
    '亲本基因型固定、每次受精独立时，前一胎不会改变下一胎概率。多数表现型受多个基因影响，也可能受环境影响。',
  ],
  sections: [
    {
      code: '150401',
      title: '细胞核与遗传物质',
      summary: inheritanceMethods['150401'].summary,
      paragraphs: [inheritanceMethods['150401'].intro],
      rules: inheritanceMethods['150401'].blocks.flatMap(block =>
        block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text })),
      ),
      memory: inheritanceMethods['150401'].memory,
      visual: 'inheritance',
      example: {
        question: materialExamples[0]!.question,
        steps: materialExamples[0]!.steps,
        answer: materialExamples[0]!.answer,
      },
      pitfalls: [
        '把“核内有遗传物质”改成“全部 DNA 都在核内”，会漏掉细胞器 DNA。',
        '同源染色体上有相同种类的基因，但不保证等位基因相同。',
        'DNA 复制改变拷贝数，不会自动改变 Aa 的杂合身份或使细胞成为四倍体。',
      ],
      check: {
        question:
          '一个二倍体植物细胞在 DNA 复制前，某对同源常染色体的相同位点分别带 M 与 m。哪句话正确？',
        options: [
          'M 与 m 必须位于两个不同基因的位点。',
          '该位点有两份基因，版本不同；细胞核也不是这个细胞唯一含 DNA 的结构。',
          '两条同源染色体一定来自同一个亲本。',
          '只要细胞有叶绿体，其细胞核内就不再需要 DNA。',
        ],
        answerIndex: 1,
        explanation:
          '选 B。M 与 m 是同一基因的两个版本，分别在同源染色体的对应位置。植物细胞还可以在线粒体和叶绿体中含有 DNA；**细胞器 DNA 的存在不会代替核染色体**。同源染色体通常一条来自父方、一条来自母方。',
      },
      examFocus: {
        goal: '把**细胞核 → 染色体 → DNA 上的基因**这一关系讲清楚，再分清基因的版本与复制形成的拷贝，后面的遗传字母就有了具体含义。',
        comparison: {
          title: '这些名称分别在描述什么？',
          columns: ['名称', '描述的对象', '别混淆的地方'],
          rows: [
            ['染色体', 'DNA 与相关蛋白质组成的结构', '一条通常有许多基因'],
            ['基因', '具有功能的 DNA 片段', '不是一整个细胞核'],
            ['等位基因', '同一基因的不同版本', 'A 与 a 不是两个无关基因'],
            ['同源染色体', '通常分别来自两个亲本的一对染色体', '同类基因的版本可以不同'],
            ['姐妹染色单体', '同一染色体复制形成的两份', '忽略突变时对应版本相同'],
          ],
        },
        examples: materialExamples,
        checklist: [
          '能否在图上指出细胞核、染色体与基因的包含关系？',
          '为什么“核 DNA 来自谁”不一定等于“全部 DNA 来自谁”？',
          'A 与 a 有两种版本；复制后两份 A、两份 a，版本种类为什么没有增加？',
        ],
      },
      sourceIds: ['uat-spec-b4', 'uat-guide-b4', 'openstax-chromosomes'],
    },
    {
      code: '150402',
      title: '遗传术语',
      summary: inheritanceMethods['150402'].summary,
      paragraphs: [inheritanceMethods['150402'].intro],
      rules: inheritanceMethods['150402'].blocks.flatMap(block =>
        block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text })),
      ),
      memory: inheritanceMethods['150402'].memory,
      visual: 'inheritance',
      example: {
        question: termExamples[0]!.question,
        steps: termExamples[0]!.steps,
        answer: termExamples[0]!.answer,
      },
      pitfalls: [
        'aa 也是纯合；Aa 并不是“一半显性一半隐性表现”。',
        '显性不等于频率高、健康、有利，也不表示每次更容易进入配子。',
        '常染色体在正常配子中也存在，不能把 autosome 误译成仅属于体细胞。',
        '观察到一个性状，不等于证明只有一个基因参与。',
      ],
      check: {
        question:
          '某虚构物种的性状由常染色体单基因控制，A 对 a 完全显性，环境相同。以下哪项一定正确？',
        options: [
          'AA 与 Aa 可有相同表现型，但基因型不同。',
          '群体中 aa 最多时，a 就变成显性。',
          'AA 是纯合，aa 不是纯合。',
          'Aa 产生的正常配子中，A 一定比 a 多。',
        ],
        answerIndex: 0,
        explanation:
          '选 A。完全显性时，AA 与 Aa 在这个性状上可以表现相同，但携带的等位基因组合不同。aa 的两个版本也相同，所以也是纯合；正常分离且无偏倚时，Aa 的 A、a 配子理论上各占一半。**显性不会自动获得更多传递机会**。',
      },
      examFocus: {
        goal: '先弄清每个术语描述的是**位置、版本组合还是表现出来的特征**，再看它们之间有什么联系；不要把显性、纯合与常见当成同一件事。',
        comparison: {
          title: '同一个完全显性模型里的三种基因型',
          columns: ['基因型', '纯合 / 杂合', '表现型', '正常配子'],
          rows: [
            ['AA', '显性纯合', '显性表现型', '全部 A'],
            ['Aa', '杂合', '显性表现型', 'A、a 理论上各 1/2'],
            ['aa', '隐性纯合', '隐性表现型', '全部 a'],
          ],
        },
        examples: termExamples,
        checklist: [
          '能否说明为什么 AA 与 Aa 可以看起来相同？',
          '为什么显性表现型即使很少见，也不因此变成隐性？',
          '常染色体与体细胞不是同一分类，能否说出配子中的常染色体？',
          '为什么身高这类多基因性状不能直接套用一个 Aa × Aa？',
        ],
      },
      sourceIds: ['uat-spec-b4', 'uat-guide-b4', 'openstax-traits'],
    },
    {
      code: '150403',
      title: '单基因杂交与家系图',
      summary: inheritanceMethods['150403'].summary,
      paragraphs: [inheritanceMethods['150403'].intro],
      rules: inheritanceMethods['150403'].blocks.flatMap(block =>
        block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text })),
      ),
      memory: inheritanceMethods['150403'].memory,
      visual: 'inheritance',
      example: {
        question: crossExamples[0]!.question,
        steps: crossExamples[0]!.steps,
        answer: crossExamples[0]!.answer,
      },
      pitfalls: [
        '涂色表示图例定义的性状，不自动等于显性；未涂色也不自动等于 AA。',
        '3∶1 不是每四个后代的固定分配，更不是所有单基因杂交通用的比例。',
        '已知未患病时，Aa × Aa 的携带概率为 2/3；未提供该条件时是 1/2。',
        '连续两胎都患病与两胎中恰有一胎患病，是不同事件，不能用同一个乘法式。',
      ],
      check: {
        question:
          '父母已确认均为 Aa，aa 患病，AA 与 Aa 不患病。两次受精独立，且完全显现、没有新突变。接下来两个孩子中恰有一个患病的概率是多少？',
        options: ['1/16', '1/4', '3/16', '3/8'],
        answerIndex: 3,
        explanation:
          '选 D。恰有一个包括两种顺序：“第一胎患病、第二胎不患病”与“第一胎不患病、第二胎患病”。每种概率都是 1/4 × 3/4 = 3/16，互不重叠，相加得到 3/8。**只算 3/16 会漏掉另一种出生顺序**；1/16 则是两胎都患病。',
      },
      examFocus: {
        goal: '用配子组合解释杂交比例，再把家系提供的已知条件放进去。**先确定哪些情况可能，后计算它们的概率**，就不容易在 1/2、1/4 与 2/3 之间混淆。',
        comparison: {
          title: '完全显性模型下的三种常见杂交',
          columns: ['亲本', '后代基因型', '显性∶隐性表现型', '隐性后代概率'],
          rows: [
            ['AA × aa', '全部 Aa', '1∶0', '0'],
            ['Aa × aa', '1 Aa∶1 aa', '1∶1', '1/2 = 50%'],
            ['Aa × Aa', '1 AA∶2 Aa∶1 aa', '3∶1', '1/4 = 25%'],
          ],
        },
        examples: crossExamples,
        checklist: [
          '能否从配子重新画出比例，而不是先写 3∶1？',
          '家系图中的涂色表示什么，题目给了哪些遗传假设？',
          '已知某人未患病后，哪些原本可能的基因型要删去？',
          '题目问下一胎、连续两胎，还是恰有一胎？期望数与实际数量有何区别？',
        ],
      },
      sourceIds: ['uat-spec-b4', 'uat-guide-b4', 'openstax-probability', 'openstax-inheritance'],
    },
  ],
  sources: [
    {
      id: 'uat-spec-b4',
      title: 'UAT-UK · ESAT Content Specification（2026/27）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对 B4.1–B4.3 范围；例题引用已入库诊断真题，讲解、变式与图解另行编写。',
    },
    {
      id: 'uat-guide-b4',
      title: 'UAT-UK · ESAT Guide: Biology（June 2025）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2025/07/06120052/ESAT_Guide_Biology_June_2025.pdf',
      note: '核对遗传术语、单基因杂交、家系与多基因性状范围；不转载教材题目。',
    },
    {
      id: 'openstax-chromosomes',
      title: 'OpenStax · Biology 2e: Chromosomal Theory and Genetic Linkage',
      url: 'https://openstax.org/books/biology-2e/pages/13-1-chromosomal-theory-and-genetic-linkage',
      note: '核对基因位于染色体与遗传物质传递的关系。',
    },
    {
      id: 'openstax-traits',
      title: 'OpenStax · Biology 2e: Characteristics and Traits',
      url: 'https://openstax.org/books/biology-2e/pages/12-2-characteristics-and-traits',
      note: '核对基因型、表现型、显隐性与杂合纯合等概念。',
    },
    {
      id: 'openstax-probability',
      title: 'OpenStax · Biology 2e: Mendel’s Experiments and the Laws of Probability',
      url: 'https://openstax.org/books/biology-2e/pages/12-1-mendels-experiments-and-the-laws-of-probability',
      note: '核对相互独立与互斥事件的概率计算；真题讲解与改条件变式另行编写。',
    },
    {
      id: 'openstax-inheritance',
      title: 'OpenStax · Biology 2e: Laws of Inheritance',
      url: 'https://openstax.org/books/biology-2e/pages/12-3-laws-of-inheritance',
      note: '核对配子分离、测交与多基因遗传的边界。',
    },
  ],
}
