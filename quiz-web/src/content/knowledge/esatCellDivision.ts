// ESAT 生物 B3：结合诊断测试真题、原创变式与分阶段图解讲解细胞分裂、繁殖及性别决定。
import { cellDivisionMethods } from './cellDivisionMethods'
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'

const mitosisExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '分离被阻断时，染色体会处于什么状态？',
    question: '',
    source: {
      questionCode: 'NSAA_2023_S1-Q066',
      why: '用药物干预情境检查有丝分裂的过程、产物与染色体计数，适合检验是否真正理解“复制”和“分离”。',
    },
    answer: 'D：只有陈述 3 正确。',
    steps: [
      '先圈出 mitosis。题目讨论的是**一次有丝分裂**，不能看到“分裂”就套用减数分裂的四个产物或单倍体配子。',
      '药物阻止复制后的染色体分离。姐妹染色单体还相连时，不能把两条染色单体各算成一条染色体。**DNA 已复制，并不等于染色体套数已经翻倍**。',
      '陈述 3 说细胞可能没有完成分裂，并保留二倍体数目的已复制染色体，这与题给干预相符。题目问 could（可能），不需要把这一结果说成药物作用的唯一结局。',
      '陈述 1 把一次有丝分裂说成形成四个子细胞；陈述 2 又引入形成单倍体配子。它们都不符合本题的分裂过程，因此只保留 3。',
    ],
    optionNotes: [
      'A：遗漏了与题给干预相符的陈述 3。',
      'B：陈述 1 的“四个子细胞”不符合一次有丝分裂。',
      'C：陈述 2 把本题的有丝分裂误当成产生单倍体配子的过程。',
      'D：仅保留 3，与分离受阻后的可能状态一致。',
      'E：同时选入错误的 1、2，却漏掉 3。',
      'F：虽然保留 3，但多选了 1。',
      'G：虽然保留 3，但多选了 2。',
      'H：把不符合题意的 1、2 也纳入。',
    ],
    takeaway:
      '==先区分复制与分离，再判断染色体数==。解释 could 时说明“为什么可能”，不要擅自改成“必然只有这一结果”。',
    variant: {
      question:
        'A diploid animal cell has 12 chromosomes before DNA replication. After replication, a chemical prevents sister chromatids from separating and cytokinesis does not occur. How many chromosomes and chromatids are present in this cell?',
      answer: '12 条染色体，24 条染色单体。',
      explanation:
        '每条染色体已复制成两条相连的姐妹染色单体，所以染色单体有 24 条；但它们还没有分开，染色体仍计 12 条。这里问的是整个未分裂细胞，不能再除以二。',
    },
  },
  {
    title: 'DNA 是配子的四倍，能确定是哪一种分裂吗？',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2022_NSAA_Q067',
      why: '同一个 DNA 含量对应多个细胞周期阶段，训练对时间词和“可能正确”的准确理解。',
    },
    answer: 'G：陈述 1、2、3、4 都可能正确。',
    steps: [
      '先把一个正常成熟配子的 DNA 量记为 1C。普通二倍体细胞复制前是 2C，复制后是 4C，所以题给细胞处于**DNA 已复制、尚未把这些 DNA 分到不同细胞**的状态。',
      'DNA 复制发生在有丝分裂开始之前，也发生在减数第一次分裂开始之前。因此“正要开始有丝分裂”和“正要开始减数分裂”都可以是 4C，陈述 1、2 都成立。',
      '“刚开始分裂”并不表示 DNA 已经分给子细胞。刚进入有丝分裂或减数第一次分裂时，每个原细胞仍可保有 4C，陈述 3、4 也成立。',
      '题目问 could be correct，不是让你认定细胞同时经历四种状态。四个描述各自都有可能，故选 G。',
    ],
    optionNotes: [
      'A：只接受 1，漏掉另外三个同样可为 4C 的状态。',
      'B：只接受 2，错误地把这一 DNA 含量限于有丝分裂开始前。',
      'C：接受分裂前，却误以为刚开始分裂就已经减少了每细胞 DNA 量。',
      'D：只保留减数分裂相关描述，遗漏有丝分裂。',
      'E：遗漏同样可能的 1 和 4。',
      'F：只保留有丝分裂相关描述，遗漏减数分裂。',
      'G：四个时点都可以出现在复制后、DNA 尚未分配到子细胞的阶段。',
    ],
    takeaway:
      '**4C 是 DNA 含量，不是四倍体的同义词。** 同一个 DNA 含量可以对应不同分裂类型和阶段。',
    variant: {
      question:
        'In a diploid animal, a mature gamete has a nuclear DNA mass of 3 pg. A primary spermatocyte has completed DNA replication. What is its nuclear DNA mass, and what is the mass in each cell after normal meiosis I and cytokinesis?',
      answer: '初级精母细胞为 12 pg；减数第一次分裂及胞质分裂后，每个细胞为 6 pg。',
      explanation:
        '配子是 1C＝3 pg，复制后的二倍体细胞是 4C＝12 pg。第一次分裂把同源染色体分给两个细胞，每个得到 2C＝6 pg；此时虽已是单倍体，每条染色体仍有两条染色单体。',
    },
  },
]

const meiosisExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '题目问的是 DNA 分子，还是 DNA 单链？',
    question: '',
    source: {
      questionCode: 'NSAA_2016_S1-Q067',
      why: '把染色体数、DNA 单链数和减数分裂产物数放在一张表中，集中检验容易混淆的三个数量。',
    },
    answer: 'D：每个精子有 8 条 DNA 单链，共形成 4 个精子。',
    steps: [
      '题给二倍体细胞有 8 条染色体，因此这个物种的单倍体数是 4。正常减数分裂完成后，每个精子有 4 条染色体。',
      '接着细读表头：它问 strands of DNA，即 **DNA 单链数**，不是染色体数，也不是 DNA 双链分子数。',
      '每个成熟精子的每条染色体含一个 DNA 双链分子；4 个双链分子共有 8 条单链。不要在这一步把“双链”误读成“两条姐妹染色单体”。',
      '正常精子发生中，一个进入减数分裂的细胞经两次分裂形成四个精细胞，随后成熟为四个精子。两列分别为 8 和 4，选 D。',
    ],
    optionNotes: [
      'A：把 4 条染色体当成 4 条 DNA 单链，又只计一次分裂的两个产物。',
      'B：精子数正确，但 DNA 单链数少算了一半。',
      'C：DNA 单链数正确，但把两次分裂只算成产生两个细胞。',
      'D：4 个 DNA 双链分子对应 8 条单链，精子数为 4。',
      'E：仍按二倍体细胞的 8 条染色体计算单链数，并少算产物。',
      'F：产物数正确，但没有把每个精子的染色体数减半。',
    ],
    takeaway:
      '==先求每个细胞的染色体数，再按题目所问换算 DNA 分子或单链数==；不要一开始就把所有数混在一起。',
    variant: {
      question:
        'In a different fly species, diploid cells have 10 chromosomes. After normal meiosis, how many double-stranded nuclear DNA molecules and how many individual DNA strands are present in each sperm cell?',
      answer: '每个精子有 5 个 DNA 双链分子、10 条 DNA 单链。',
      explanation:
        '二倍体 10 条，配子就有 5 条染色体。减数分裂完成后，每条染色体含一个 DNA 双链分子，所以是 5 个分子、10 条单链。改变的是物种的染色体数，换算关系没有改变。',
    },
  },
  {
    title: '雄蚁已经是单倍体，还能照搬人类的精子形成过程吗？',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2021_NSAA_Q078',
      why: '用不同于人类的生活史检查能否按图中的倍性变化判断分裂，避免只靠细胞名称套结论。',
    },
    answer: 'A：只有 P 表示减数分裂。',
    steps: [
      '先使用题目给定的规则：**本物种雄蚁为单倍体，雌蚁为二倍体**。这与人类雌雄体细胞都为二倍体不同，不能直接照搬人类的过程。',
      '在图上标数：成年雌蚁和受精卵为 2n；卵、雄蚁和精子为 n。P 从二倍体雌蚁到单倍体卵，需要把染色体套数减半。',
      'Q 是 2n 受精卵发育成 2n 雌蚁，S 是未受精的 n 卵发育成 n 雄蚁，都是生长发育时保持倍性的分裂。',
      'R 虽然通向精子，但雄蚁本身已经是 n，形成的精子仍是 n。按本题生活史，不能因为看见 sperm 就把 R 判为减数分裂。因此仅 P。',
    ],
    optionNotes: [
      'A：P 是唯一由 2n 降到 n 的路径。',
      'B：Q 是二倍体个体的生长发育，不使倍性减半。',
      'C：R 的起点雄蚁已经是单倍体，不能套用二倍体雄性产生精子的判断。',
      'D：S 是单倍体卵发育成单倍体雄蚁，倍性不变。',
      'E：正确的 P 之外，多选了 Q。',
      'F：正确的 P 之外，因“形成精子”而多选了 R。',
      'G：正确的 P 之外，多选了 S。',
      'H：Q 和 R 都没有题目要求的倍性减半，且遗漏 P。',
    ],
    takeaway:
      '**判断分裂先看起点和终点的倍性，再看细胞名称。** 人类的配子形成规律不能不加条件地推广到所有物种。',
    variant: {
      question:
        'In the ant species shown, a female has 24 chromosomes in each diploid body cell. How many chromosomes are present in an unfertilised egg, an adult male body cell, a sperm cell and a fertilised egg, respectively?',
      answer: '依次为 12、12、12、24 条。',
      explanation:
        '雌蚁经减数分裂产生含 12 条染色体的卵。未受精卵发育成单倍体雄蚁，雄蚁产生的精子仍有 12 条。受精时卵与精子各贡献 12 条，恢复为 24 条。',
    },
  },
]

const reproductionExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '细菌二分裂：无性繁殖就不会出现变异吗？',
    question: '',
    source: {
      questionCode: 'NSAA_2019_S1-Q064',
      why: '把无性繁殖、变异与种群数量计算结合起来，适合练习一题中逐项处理不同知识点。',
    },
    answer: 'C：只有陈述 2 正确。',
    steps: [
      '陈述 1 的问题在 cannot be any variation。无性繁殖通常保留亲代的遗传组成，但 **DNA 复制仍可能发生突变**，因此不能断言后代绝无变异。',
      '陈述 2 明确限定没有限制因素。在理想条件下，每一轮二分裂都可以使种群数量翻倍，所以这一项成立。',
      '24 小时有 1440 分钟；每 20 分钟一轮，共 72 轮。从一个细菌开始，每轮乘 2，最终应是 2 的 72 次方，**不是 72 的平方**。陈述 3 把底数和指数的含义弄反了。',
      '所以 1 错、2 对、3 错，对应 C。注意细菌二分裂属于无性繁殖，但细菌没有细胞核，不能把它称为有丝分裂。',
    ],
    optionNotes: [
      'A：否定了无生长限制条件下可以反复翻倍的陈述 2。',
      'B：错误接受“绝无变异”的陈述 1。',
      'C：只保留 2，正确。',
      'D：把 72 轮翻倍误写成 72 的平方。',
      'E：在正确的 2 之外，多选了过度绝对化的 1。',
      'F：选入两个错误陈述，并遗漏正确的 2。',
      'G：在正确的 2 之外，多选了算式错误的 3。',
      'H：没有排除“不会有任何变异”和错误的指数表达。',
    ],
    takeaway:
      '==无性繁殖不等于绝无突变；反复翻倍用 2 的轮数次方==。理想增长还必须满足题给“没有限制因素”的条件。',
    variant: {
      question:
        'A culture starts with 3 bacteria. Every bacterium divides once every 30 minutes, all offspring survive, and there are no limiting factors. How many bacteria are present after 3 hours?',
      answer: '192 个。',
      explanation:
        '3 小时是 180 分钟，共 6 轮分裂。每轮整个种群翻倍，因此数量为 3 × 2⁶＝192。起始 3 个是乘数，6 轮是指数；不能把二者交换。',
    },
  },
  {
    title: '克隆羊没有生物学父亲，为什么仍涉及减数分裂？',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2018_NSAA_Q66',
      why: '通过完整克隆流程区分核移植、配子形成和胚胎发育，检查能否逐步判断所需的生物学过程。',
    },
    answer: 'E：需要过程 2、3、4，即有丝分裂、减数分裂与分化。',
    steps: [
      '按图从上往下看。P 提供乳腺细胞的细胞核，Q 提供卵细胞；卵细胞原有的核被去掉，再放入供体核。**核移植本身不等于人为插入或改变某个基因**，所以并不要求过程 1 的 genetic engineering。',
      '重建的细胞要形成多细胞胚胎，必须不断增加细胞数，涉及有丝分裂，过程 2 必须有。',
      '最容易漏掉的是过程 3。图中使用了卵细胞；把卵细胞的来源也算进完整流程，卵的形成涉及减数分裂。**没有精卵受精，不代表整个流程从未用到减数分裂**。',
      '胚胎还要形成不同组织和器官，需要细胞分化，过程 4 也必须有。因此 2、3、4 都需要，选 E。',
    ],
    optionNotes: [
      'A：误把克隆必需过程认成基因工程，并遗漏卵形成与组织分化。',
      'B：有丝分裂和减数分裂都涉及，但漏掉了形成不同组织的分化。',
      'C：虽然有 2、4，却多选不必需的 1，并漏掉卵来源中的 3。',
      'D：遗漏胚胎增长所需的有丝分裂，又多选基因工程。',
      'E：把卵的形成、胚胎增长和组织发育三个阶段全部考虑在内。',
    ],
    takeaway:
      '**看完整流程，逐步说明每一种分裂发生在哪里。** 克隆方式与流程中曾使用哪种细胞，是两个不同问题。',
    variant: {
      question:
        'A plant cutting containing no flowers or seeds develops into a new plant. Consider only growth from this cutting after it is removed from the parent. Which are required: mitosis, meiosis, fertilisation and differentiation?',
      answer: '需要有丝分裂和分化；这一段营养繁殖不需要减数分裂或受精。',
      explanation:
        '变式把范围限定在取下插条之后，而且不经过花、种子或配子形成。细胞经有丝分裂增加，再分化形成根等结构。与克隆羊题相比，不能再把供体卵的形成过程带进来。',
    },
  },
]

const sexExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '每代都按 1∶1 分配，第四代有多少 XY 个体？',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2018_NSAA_Q59',
      why: '将性染色体、性别比例与逐代繁殖数量结合，训练分清“这一代总数”与“这一代某一性别的数量”。',
    },
    answer: 'E：256 个 XY 个体。',
    steps: [
      '题目说明大鼠的预期性别比例与人类相同，并且每一代都呈现这一比例。因此按本题条件，**每代一半为 XX 雌性，一半为 XY 雄性**。起始的一对亲代不算第一代后代。',
      '第一代有 8 只，其中 4 只雌性。每只雌性只生一窝 8 只，因此第二代有 4 × 8＝32 只，其中 16 只雌性。',
      '第三代有 16 × 8＝128 只，其中 64 只雌性；第四代有 64 × 8＝512 只。',
      '最后再回答问的是 XY 个体，而非全部第四代：512 ÷ 2＝256。真实的小窝中不保证严格一半雌雄，本题计算使用的是题目明确给出的预期比例及每代条件。',
    ],
    optionNotes: [
      'A（16）：这是第二代的雌性或雄性数量，代数提前了。',
      'B（32）：这是第二代总数，既错代数又没有区分性别。',
      'C（64）：这是第三代的某一性别数量，还少算一代。',
      'D（128）：这是第三代总数，不是第四代 XY 数量。',
      'E（256）：第四代总数 512 的一半。',
      'F（512）：求到了第四代总数，但漏掉最后的性别筛选。',
      'G（1024）：不能从每代只有一半个体为雌性、每只雌性生 8 只的规则推出该值。',
    ],
    takeaway:
      '==每一代先求能繁殖的雌性数，再乘每窝后代数==；最后检查题目要的是总数、雌性数还是 XY 个体数。',
    variant: {
      question:
        'A pair of rats produces six offspring per litter instead of eight. Each female produces exactly one litter, and every generation has equal numbers of males and females. How many XY individuals are there in the third generation of offspring?',
      answer: '27 个。',
      explanation:
        '第一代 6 只，其中 3 只雌性；第二代 3 × 6＝18 只，其中 9 只雌性；第三代 9 × 6＝54 只，其中 27 只为 XY。亲代不计入后代的代数。',
    },
  },
  {
    title: '沿精子形成图判断：X 或 Y 是由哪一方提供？',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2022_NSAA_Q078',
      why: '在精子发生图中同时检查倍性、DNA 复制时机和性别决定，帮助把独立知识连成完整过程。',
    },
    answer: 'G：陈述 2、3 正确。',
    steps: [
      '先认清图例。图中两条并排的线代表**一对同源染色体**，并不是凭线条就能数出每阶段的全部 DNA；题干还说明只画了 23 对中的一对。',
      '精原细胞是形成精子的起始干细胞，但它本身仍是二倍体。不能因为最终产物是单倍体，就把起点也叫单倍体，所以陈述 1 错。',
      '在人类通常的 XX／XY 模型中，卵细胞提供 X，精子提供 X 或 Y。受精后形成 XX 还是 XY 取决于参与受精的精子，所以陈述 2 对。这里说的是染色体组合的形成，没有任何人为选择或责任含义。',
      'DNA 在进入减数第一次分裂前已经复制，然后经两次分裂形成精细胞。陈述 3 说复制在精细胞形成之前，这是正确的；不要误读为精细胞成熟成精子时又复制一次。',
    ],
    optionNotes: [
      'A：漏掉正确的 2 和 3。',
      'B：把二倍体精原细胞错认作单倍体。',
      'C：性别决定判断正确，但遗漏减数分裂前的 DNA 复制。',
      'D：复制时序判断正确，但遗漏男性配子可提供 X 或 Y。',
      'E：选入错误的 1，并遗漏正确的 3。',
      'F：选入错误的 1，并遗漏正确的 2。',
      'G：只保留 2、3，与人类精子形成及受精过程一致。',
      'H：除了 2、3，还错误接受了 1。',
    ],
    takeaway:
      '**精原细胞是二倍体，成熟精子是单倍体；卵给 X，精子给 X 或 Y。** 看图时先读图例，别把简化图当成全部染色体或染色单体的计数图。',
    variant: {
      question:
        'Assume normal human XX/XY sex determination, equal chances of an X-bearing or Y-bearing sperm fertilising an egg, and independent births. What is the probability that exactly one of two children is XY?',
      answer: '1/2。',
      explanation:
        '“恰好一个”包括 XY 后 XX、XX 后 XY 两种顺序。每种顺序概率为 1/2 × 1/2＝1/4，相加为 1/2。两次出生独立不表示必定一男一女，也不表示第一次结果会改变第二次的概率。',
    },
  },
]

const sections: KnowledgeSection[] = [
  {
    code: '150301',
    title: '有丝分裂与细胞周期',
    visual: 'cell-division',
    summary: cellDivisionMethods['150301'].summary,
    paragraphs: [cellDivisionMethods['150301'].intro],
    rules: cellDivisionMethods['150301'].blocks.flatMap(block =>
      block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text })),
    ),
    memory: cellDivisionMethods['150301'].memory,
    example: mitosisExamples[0]!,
    pitfalls: [
      '看到复制就把染色体数翻倍；应先确认姐妹染色单体是否已经分开。',
      '用整细胞后期的染色体总数，回答“一个子细胞”或“一个新细胞核”的数目。',
      '把间期说成静止期，或把正常组织修复直接当成癌症。',
    ],
    check: {
      question:
        '一种细胞在复制前有 6 条染色体。正常有丝分裂后期，姐妹染色单体已经分离，但胞质尚未分裂。此时整个细胞共有多少条染色体？每一极将获得多少条？',
      options: [
        '整个 6 条；每极 3 条',
        '整个 6 条；每极 6 条',
        '整个 12 条；每极 6 条',
        '整个 12 条；每极 12 条',
      ],
      answerIndex: 2,
      explanation:
        '选 C。原来 6 条复制后形成 12 条姐妹染色单体；当姐妹分开，每条作为一条独立染色体计数，因此仍未一分为二的整个细胞中共有 12 条。两极各得 6 条，完成胞质分裂后每个子细胞也各有 6 条。**整个尚未分开的细胞，与其中一极/一个子细胞，计数范围不同**。',
    },
    examFocus: {
      goal: '细胞先复制 DNA，再把两份完整遗传信息分开。有丝分裂让细胞数增加，同时**保持每个子细胞的染色体数**。',
      comparison: {
        title: '以复制前 2n=4、核 DNA 含量为 2C 的细胞为例',
        columns: ['时间点', '每细胞染色体数', '每细胞核 DNA 总量', '要看清什么'],
        rows: [
          ['复制前 G1', '4', '2C', '每条染色体含一个 DNA 双链分子'],
          ['复制后、姐妹分离前', '4', '4C', '4 条复制后的染色体，共 8 条染色单体'],
          ['姐妹已分离、胞质未分开', '8', '4C', '这里数整个细胞；每一极各为 4 条、2C'],
          ['胞质分裂完成后', '每个 4', '每个 2C', '共两个子细胞；各自回到复制前的数目'],
        ],
      },
      examples: mitosisExamples,
      checklist: [
        '间期为什么不是休息期？DNA 在哪一阶段复制？',
        '一个 X 形结构为什么通常算一条复制后的染色体？',
        '为什么复制、姐妹分开和胞质分开会给出不同的计数变化？',
        '正常伤口修复与失控分裂的关键区别是什么？',
      ],
    },
    sourceIds: ['uat-spec-b3', 'uat-guide-b3', 'openstax-cycle'],
  },
  {
    code: '150302',
    title: '减数分裂与细胞周期',
    visual: 'cell-division',
    summary: cellDivisionMethods['150302'].summary,
    paragraphs: [cellDivisionMethods['150302'].intro],
    rules: cellDivisionMethods['150302'].blocks.flatMap(block =>
      block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text })),
    ),
    memory: cellDivisionMethods['150302'].memory,
    example: meiosisExamples[0]!,
    pitfalls: [
      '把同源染色体与复制所得的姐妹染色单体当成一回事。',
      '在减数第一次和第二次分裂之间再画一次 DNA 复制。',
      '把“一次减数分裂通常形成四个单倍体产物”说成必有四个成熟卵细胞。',
    ],
    check: {
      question:
        '某二倍体细胞在 DNA 复制前的核 DNA 含量为 8 单位。它完成正常减数分裂。每个最终单倍体产物在未再复制时，核 DNA 含量是多少？',
      options: ['2 单位', '4 单位', '8 单位', '16 单位'],
      answerIndex: 1,
      explanation:
        '选 B。复制前是二倍体 8 单位；复制后变为 16。第一次分裂后每细胞 8，第二次分裂后每细胞 4。也可以直接比较最终的一套与最初的两套：4 是 8 的一半。**不能从复制前的 8 连续除以 2 两次，忘掉前面发生的一次复制**。',
    },
    examFocus: {
      goal: '减数分裂先分同源、再分姐妹，使两套染色体变为一套，并为配子带来不同遗传组合；受精后重新恢复二倍体。',
      comparison: {
        title: '以原细胞 2n=4 为例，数每一个细胞',
        columns: ['时间点', '染色体数', '每条的 DNA 状态', '倍性 / DNA 含量'],
        rows: [
          ['复制前', '4', '每条一个 DNA 双链分子', '2n / 2C'],
          ['复制后、第一次分裂前', '4', '每条两条姐妹染色单体', '2n / 4C'],
          ['第一次分裂完成', '每个 2', '姐妹染色单体仍相连', 'n / 2C'],
          ['第二次分裂完成', '每个 2', '每条一个 DNA 双链分子', 'n / 1C'],
          ['两个正常配子受精', '4', '随后才为下一轮复制做准备', '2n / 2C'],
        ],
      },
      examples: meiosisExamples,
      checklist: [
        '同源染色体与姐妹染色单体有什么不同？',
        '为什么第一次分裂后已是单倍体，却仍能看到 X 形染色体？',
        '复制一次与分裂两次怎样共同改变 DNA 含量？',
        '受精时为什么要把两个配子的染色体数相加？',
      ],
    },
    sourceIds: ['uat-spec-b3', 'uat-guide-b3', 'openstax-meiosis'],
  },
  {
    code: '150303',
    title: '无性繁殖与有性繁殖',
    visual: 'cell-division',
    summary: cellDivisionMethods['150303'].summary,
    paragraphs: [cellDivisionMethods['150303'].intro],
    rules: cellDivisionMethods['150303'].blocks.flatMap(block =>
      block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text })),
    ),
    memory: cellDivisionMethods['150303'].memory,
    example: reproductionExamples[0]!,
    pitfalls: [
      '只数亲本个体，不看题目是否明确发生配子融合。',
      '把克隆的遗传相同说成任何环境下外观都相同。',
      '把细菌二分裂称为有丝分裂，或认为有性繁殖的后代生长时不用有丝分裂。',
    ],
    check: {
      question: '某植物的插条形成新植株，全程没有配子融合且未发生突变。哪一项正确？',
      options: [
        '新植株必须通过减数分裂把染色体数减半',
        '新植株遗传组成与亲本相同，但环境可能使外观不同',
        '新植株一定在所有环境下比亲本更适应',
        '新植株与亲本外观不同就能证明发生了受精',
      ],
      answerIndex: 1,
      explanation:
        '选 B。插条是无性繁殖，题目排除了突变，因而新植株是亲本的克隆。环境仍可影响表现型。A 把生长和配子形成混淆；C 没有环境或适应性证据；D 把外观差异错当成受精的证据。',
    },
    examFocus: {
      goal: '把繁殖过程、遗传组成和外在表现分别讲清楚：有没有配子融合，是否发生突变，生长环境是否相同。',
      comparison: {
        title: '两种繁殖方式放在一起理解',
        columns: ['比较项', '无性繁殖', '有性繁殖'],
        rows: [
          ['典型亲本来源', '一个亲本', '通常两个亲本；自体受精有例外'],
          ['配子融合', '无', '有，形成受精卵'],
          ['遗传组成', '无突变时为克隆', '通常产生新的遗传组合'],
          ['速度与条件', '常可较快繁殖，不必寻找配偶', '需完成配子形成与受精等过程'],
          ['环境改变时', '遗传差异较少可能增加共同受损风险', '差异可使部分后代更适应，但不是保证'],
          ['后代外观', '相同遗传也可受环境影响', '遗传与环境共同影响许多性状'],
        ],
      },
      examples: reproductionExamples,
      checklist: [
        '草莓匍匐茎和受精形成种子有什么关键差别？',
        '为什么细菌二分裂不是有丝分裂？',
        '克隆的外观不同是否一定说明 DNA 不同？',
        '为什么自体受精仍属于有性繁殖？',
      ],
    },
    sourceIds: ['uat-spec-b3', 'uat-guide-b3', 'openstax-reproduction'],
  },
  {
    code: '150304',
    title: '性别决定与后代比例',
    visual: 'cell-division',
    summary: cellDivisionMethods['150304'].summary,
    paragraphs: [cellDivisionMethods['150304'].intro],
    rules: cellDivisionMethods['150304'].blocks.flatMap(block =>
      block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text })),
    ),
    memory: cellDivisionMethods['150304'].memory,
    example: sexExamples[0]!,
    pitfalls: [
      '把 X 画给一半卵细胞、Y 画给另一半卵细胞。',
      '认为连续出现 XY 后，下次 XX 必须更有可能以“补足比例”。',
      '把 1:1 的预期比例当成小样本的确定结果。',
    ],
    check: {
      question:
        '在通常 XX/XY、每次概率相等且独立的模型中，两个孩子恰好一个 XX、一个 XY 的概率是多少？',
      options: ['1/4', '1/2', '3/4', '1'],
      answerIndex: 1,
      explanation:
        '选 B。有两种次序：先 XX 后 XY，或先 XY 后 XX。每种概率均为 1/2×1/2=1/4；两种互不重叠，所以相加为 1/2。**“一个各一种”没有限定先后，不能只算一种顺序**。',
    },
    examFocus: {
      goal: '从亲本性染色体写出配子，再组合成后代；用概率解释 1:1，并留意实际样本中的随机波动。',
      comparison: {
        title: '同一个模型，四种不同问法',
        columns: ['题目问什么', '通常 XX/XY、等机会模型的结果', '别误读成什么'],
        rows: [
          ['下一次为 XX', '1/2', '不受前几次结果“补偿”'],
          ['连续两次都为 XX', '1/4', '两个独立条件都要满足'],
          ['两个孩子恰好一 XX 一 XY', '1/2', '包括两种先后顺序'],
          ['200 次中 XX 的预期数', '100', '不是保证恰好 100'],
          ['观察到 112 个 XX / 200 个', '观察比例 56%', '不自动推翻理论 50%'],
        ],
      },
      examples: sexExamples,
      checklist: [
        '通常 XX 和 XY 亲本分别提供什么性染色体的配子？',
        '为什么不能给配子写两条性染色体？',
        '一各一个为什么要把两种先后顺序相加？',
        '预期比例与实际观察比例为什么可以不同？',
      ],
    },
    sourceIds: ['uat-spec-b3', 'uat-guide-b3'],
  },
]

export const esatCellDivision: KnowledgeLesson = {
  code: '150300',
  title: 'Cell division and sex determination · 细胞分裂与性别决定',
  subtitle: '先分清复制与分裂，再理解繁殖、配子和 XX/XY 概率',
  intro:
    '身体生长时需要保留完整遗传信息；在人类等通常二倍体动物模型中，形成配子则要先把染色体套数减半。这一章从这两个目的出发，梳理有丝分裂、减数分裂和繁殖的关系。分阶段图解可以逐步核对染色体数；诊断测试真题带你处理“每个细胞”“复制以后”“可能正确”等容易读漏的条件，原创变式再检查换了条件是否仍会判断。',
  memory: [
    '==复制后、姐妹分离前：DNA 加倍，染色体数不变==。先看阶段，再看题目数的是整个细胞还是一个子细胞。',
    '有丝分裂通常产生两个遗传相同的子细胞；无突变等异常时保持原来的染色体数，支持生长、修复与某些无性繁殖。',
    '**减数分裂复制一次、分裂两次：先分同源，再分姐妹**。最终为单倍体，受精后恢复二倍体。',
    '克隆的遗传相同要保留无突变条件；环境不同仍可导致外观不同。',
    '通常 XX/XY 模型下，卵提供 X，精子提供 X 或 Y；**1:1 是理论比例，不是家庭配额**。',
  ],
  sections,
  sources: [
    {
      id: 'uat-spec-b3',
      title: 'UAT-UK ESAT Content Specification 2026/27 · B3',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '内部核对 B3.1–B3.4 知识总结范围；例题引用已入库真题，变式为原创。',
    },
    {
      id: 'uat-guide-b3',
      title: 'UAT-UK ESAT Guide Biology · June 2025 · B3',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2025/07/06120052/ESAT_Guide_Biology_June_2025.pdf',
      note: '内部核对分裂、繁殖及性别决定教学范围。',
    },
    {
      id: 'openstax-cycle',
      title: 'OpenStax Biology 2e · The Cell Cycle',
      url: 'https://openstax.org/books/biology-2e/pages/10-2-the-cell-cycle',
      note: '核对染色体、姐妹染色单体和分裂阶段的计数。',
    },
    {
      id: 'openstax-meiosis',
      title: 'OpenStax Biology 2e · The Process of Meiosis',
      url: 'https://openstax.org/books/biology-2e/pages/11-1-the-process-of-meiosis',
      note: '核对两次分裂、同源分离、重组与单倍体。',
    },
    {
      id: 'openstax-reproduction',
      title: 'OpenStax Biology 2e · Reproduction Methods',
      url: 'https://openstax.org/books/biology-2e/pages/43-1-reproduction-methods',
      note: '核对自体受精、无性繁殖及遗传差异的边界。',
    },
  ],
}
