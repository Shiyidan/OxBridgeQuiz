// ESAT 生物 B3：用知识总结、原创例题和分阶段图解解释细胞分裂、繁殖与性别决定。
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'

const mitosisExamples: KnowledgeExamFocus['examples'] = [
  {
    title: 'DNA 已经加倍，染色体数也加倍了吗？',
    question:
      'A diploid animal cell has 8 chromosomes and 10 arbitrary units of nuclear DNA before DNA replication. It completes replication but has not started separating sister chromatids. What does this cell now contain?',
    options: [
      '8 chromosomes and 10 units of DNA',
      '8 chromosomes and 20 units of DNA',
      '16 chromosomes and 10 units of DNA',
      '16 chromosomes and 20 units of DNA',
    ],
    answer: 'B：8 条染色体，20 单位核 DNA。',
    steps: [
      '先把两个数量分开：题目同时问 chromosomes（染色体）和 DNA。**复制增加 DNA 的量，但姐妹染色单体还没有分开时，染色体数不变**。',
      '原来的每条染色体复制后都有两条姐妹染色单体，仍作为一条复制后的染色体计数。因此还是 8 条染色体，共 16 条染色单体。',
      '每条染色单体含一条 DNA 双链分子。DNA 从 10 增至 20 单位，所以选 B。这里的 20 是相对含量，不能说成 20 个 DNA 分子。',
    ],
    optionNotes: [
      'A：染色体数正确，但漏掉了 DNA 复制。',
      'B：复制后的姐妹染色单体仍相连，染色体为 8 条，DNA 已加倍。',
      'C：把染色体数加倍，却没有把 DNA 量加倍，两个判断都不符。',
      'D：DNA 量正确，但把两条仍相连的姐妹染色单体算成了两条染色体。',
    ],
    takeaway:
      '看到“复制后”，先问姐妹染色单体是否已经分开。==复制后、分离前：DNA 加倍，染色体数不变==。',
    variant: {
      question:
        'The same cell completes normal mitosis and cytokinesis, without mutation. How many chromosomes and how much nuclear DNA does each daughter cell contain, before any further replication?',
      answer: '每个子细胞有 8 条染色体、10 单位核 DNA。',
      explanation:
        '注意 each（每个），不是把两个子细胞加在一起。复制所得的两份遗传信息平均分开，每个子细胞获得原有的一套完整信息。**每个子细胞的染色体数和核 DNA 量都回到复制前的水平**。',
    },
  },
  {
    title: '修复伤口时细胞分裂，为什么不等于癌症？',
    question:
      'Cells at a wound divide, replace damaged cells and stop dividing when repair is complete. In a second tissue, mutations affecting cell-cycle control allow cells to continue dividing despite signals to stop. Which conclusion is best supported?',
    options: [
      'Both tissues must be cancerous because mitosis occurs.',
      'The first tissue uses meiosis to replace body cells.',
      'Loss of control in the second tissue can contribute to cancer.',
      'Every mutation in a body cell immediately causes cancer.',
    ],
    answer: 'C：第二组细胞的分裂调控失常可以促成癌症。',
    steps: [
      '第一组细胞在有需要时分裂，修复完成后停止。这正是有丝分裂维持组织的正常作用，**发生分裂本身不是癌症的证据**。',
      '第二组的关键条件是“影响细胞周期控制的突变”及“忽略停止信号”。正常调控失效，细胞可能持续增殖。',
      '因此 C 最有依据。题目没有说所有突变都会破坏调控，也没有说一次突变必然立即形成癌症，不能选 D。',
    ],
    optionNotes: [
      'A：把正常生长和修复也误判成癌症。',
      'B：正常补充体细胞主要靠有丝分裂，不是制造单倍体的减数分裂。',
      'C：把已给出的调控变化与失控分裂联系起来，因果解释成立。',
      'D：不同突变的影响不同，“每个”“立即”都超出了证据。',
    ],
    takeaway: '判断癌变要看**分裂是否失去正常控制**，不能只看有没有分裂、分裂是否较快。',
    variant: {
      question:
        'A DNA mutation is detected in a skin cell, but its division remains normally regulated. Does the mutation alone prove that this cell is cancerous?',
      answer: '不能。',
      explanation:
        '突变说明 DNA 发生了改变，却没有证明分裂已经失控。突变可能没有影响控制细胞周期的功能。还需要相应的细胞行为和调控证据，不能把“有突变”直接等同于“患癌”。',
    },
  },
]

const meiosisExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '减数第一次分裂后，细胞里还剩什么？',
    question:
      'A diploid cell has 12 chromosomes before replication. It undergoes normal meiosis. Immediately after meiosis I and cytokinesis, before meiosis II, what is present in each daughter cell?',
    options: [
      '6 chromosomes, each with one chromatid',
      '6 chromosomes, each with two chromatids',
      '12 chromosomes, each with one chromatid',
      '12 chromosomes, each with two chromatids',
    ],
    answer: 'B：每个细胞有 6 条染色体，每条仍含两条姐妹染色单体。',
    steps: [
      '先确定计数位置：题目问第一次分裂及胞质分裂完成后、第二次分裂之前的**每一个**细胞。不要用原细胞或两个子细胞的合计作答。',
      '减数第一次分裂分开的是同源染色体。原来 12 条、6 对；每对各取一条进入一个子细胞，所以每细胞是 6 条。',
      '这一阶段姐妹染色单体通常还连在一起，需等第二次分裂才分开，因此每条染色体仍有两条染色单体。选 B。',
      '这个细胞已经是单倍体，因为每对同源染色体只剩一条。**单倍体不是“每条染色体只有一条染色单体”的意思**。',
    ],
    optionNotes: [
      'A：这是正常第二次分裂结束后的状态，时间点提前了。',
      'B：同源染色体已经分开，姐妹染色单体还没有分开。',
      'C：既保留了原数目，又过早拆开了姐妹染色单体。',
      'D：相当于忽略了第一次分裂对同源染色体的分配。',
    ],
    takeaway:
      '==第一次分开同源染色体，第二次分开姐妹染色单体==。先说清“分开的是什么”，数目就容易判断。',
    variant: {
      question:
        'The same original cell completes meiosis II normally. How many daughter cells are produced in total, and how many chromosomes does each contain?',
      answer: '共 4 个子细胞，每个有 6 条染色体。',
      explanation:
        '两个细胞再各分一次，得到四个。第二次分裂把姐妹染色单体分配到不同子细胞，最终每细胞仍有 6 条染色体，每条含一个 DNA 双链分子。分裂两次不代表染色体数连续减半两次。',
    },
  },
  {
    title: '受精为什么不会让每一代的染色体翻倍？',
    question:
      'In an animal species, normal diploid body cells contain 18 chromosomes. Which sequence maintains this chromosome number from one generation to the next?',
    options: [
      'Gametes with 18 chromosomes fuse to form a zygote with 36.',
      'Gametes with 9 chromosomes fuse to form a zygote with 18.',
      'Gametes with 9 chromosomes fuse to form a zygote with 9.',
      'Gametes with 18 chromosomes fuse and the zygote immediately loses half at random.',
    ],
    answer: 'B：9 条的配子相结合，恢复为含 18 条染色体的受精卵。',
    steps: [
      '体细胞是二倍体 2n=18，正常配子是单倍体 n=9。这一减半发生在配子形成的减数分裂过程中。',
      '受精时两个配子的遗传物质结合，染色体数相加：9+9=18。**减数分裂先减半，受精再恢复二倍体**。',
      '受精卵随后主要通过有丝分裂增加细胞数，并在正常分裂中保持染色体数。因此只有 B 能让代际数目保持稳定。',
    ],
    optionNotes: [
      'A：未先减半，染色体数会加倍。',
      'B：正确体现 n+n=2n。',
      'C：漏掉了另一配子贡献的一套染色体。',
      'D：正常过程不是先加倍，再随机丢掉染色体。',
    ],
    takeaway:
      '画出“二倍体亲本 → 单倍体配子 → 二倍体受精卵”，把每一步的数量写在旁边，比只记“减半”更不容易混。',
    variant: {
      question:
        'An abnormal gamete with 18 chromosomes fuses with a normal gamete with 9 chromosomes. Assuming none are lost, how many chromosomes does the resulting zygote contain?',
      answer: '27 条。',
      explanation:
        '这次题干明确给出一个未减半的异常配子，不能继续套用正常结果。受精时相加，18+9=27。这里仅能计算染色体数，不能仅凭这一条件判断后代是否存活。',
    },
  },
]

const reproductionExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '克隆外表不同，就一定发生了突变吗？',
    question:
      'Two strawberry plants develop from runners of the same parent. No mutation occurs. One is grown in bright light and the other in shade; their final sizes differ. Which statement is best supported?',
    options: [
      'Their different sizes prove that their DNA sequences differ.',
      'Runner formation must involve fusion of gametes.',
      'They can have the same genotype but different phenotypes.',
      'Asexual offspring always look identical in every environment.',
    ],
    answer: 'C：基因型可以相同，表现型仍可不同。',
    steps: [
      '草莓匍匐茎形成新植株属于无性繁殖。题目还特别排除了突变，因此可以把这两株视为遗传组成相同的克隆。',
      '环境不同是另一条重要条件：光照能影响光合作用和生长。因此株高、质量等外在表现不必完全一样。',
      '所以 C 成立。**遗传相同，不等于在不同环境中一定长得相同**；也不能只凭外观差异倒推出 DNA 一定改变。',
    ],
    optionNotes: [
      'A：忽略了环境也能造成表现差异。',
      'B：匍匐茎无性繁殖不依赖配子融合。',
      'C：把遗传组成与受环境影响的表现分开，符合全部条件。',
      'D：将遗传相同扩大成了任何条件下外观都相同。',
    ],
    takeaway:
      '先分别看“遗传是否改变”和“生长条件是否改变”。这两个问题有关联，但不能用一个替代另一个。',
    variant: {
      question:
        'A mutation occurs in a cell that gives rise to a new runner plant. Must this offspring remain genetically identical to the parent at every DNA position?',
      answer: '不一定；发生突变的位置可能不同。',
      explanation:
        '克隆遗传相同的结论以“没有发生突变”为前提。现在前提改变，新植株可能带有变化后的 DNA。无性繁殖没有配子重组，并不意味着 DNA 永远不会改变。',
    },
  },
  {
    title: '同一株植物的花粉与卵细胞结合，属于哪种繁殖？',
    question:
      'A flowering plant produces male and female gametes. A male gamete fuses with an egg from the same plant to form a zygote. Which description is correct?',
    options: [
      'Asexual reproduction, because only one individual plant is involved.',
      'Sexual reproduction, because gametes fuse at fertilisation.',
      'Mitosis alone, because the zygote must be a clone.',
      'Binary fission, because two gametes are involved.',
    ],
    answer: 'B：有性繁殖；发生了配子融合与受精。',
    steps: [
      '通常有性繁殖由两个亲本提供配子，但有些生物可以自体受精。本题明确给出了同一株的两种配子融合。',
      '因此判断繁殖方式时，要以**是否发生配子融合**为关键，而不能只数看到了几株植物。选 B。',
      '自体受精的后代也不必都是克隆。如果亲本有关基因是杂合的，配子中等位基因的不同组合仍可产生遗传差异。',
    ],
    optionNotes: [
      'A：把“一个个体”误当作无性繁殖的充分条件，忽略了受精。',
      'B：正确抓住了有性繁殖的关键过程。',
      'C：受精卵之后可通过有丝分裂生长，但这不取消前面的有性过程，也不能保证它是亲本克隆。',
      'D：细菌二分裂是一个细胞复制遗传物质后分开，不是两个配子结合。',
    ],
    takeaway:
      '典型例子帮助记忆，题干的明确过程决定答案。==发生配子融合，即使配子来自同一个体，也不能归为普通无性繁殖==。',
    variant: {
      question:
        'Instead, a stem cutting from the same plant grows into a new plant without gamete fusion. No mutation occurs. What type of reproduction is this, and what is the expected genetic relationship?',
      answer: '无性繁殖；新植株与提供插条的亲本遗传组成相同。',
      explanation:
        '现在是营养器官上的细胞通过有丝分裂生长，没有受精。题目又排除了突变，因而可称为亲本的克隆。注意细菌也能无性繁殖，但其二分裂不属于有丝分裂。',
    },
  },
]

const sexExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '前几个孩子的性别，会改变下一次概率吗？',
    question:
      'In a simplified human XX/XY model, X-bearing and Y-bearing sperm are equally likely to fertilise an X-bearing egg. Births are independent. A couple has three XY children. What is the probability that their next child is XX?',
    options: ['0', '1/4', '1/2', '1'],
    answer: 'C：1/2。',
    steps: [
      '卵细胞提供 X；受精精子若提供 X，得到 XX，若提供 Y，得到 XY。题目假定两类精子受精机会相等。',
      '因此每次受精得到 XX 的概率是 1/2。independent（相互独立）表示前面的结果不会改变本次两种精子的机会。',
      '连续三个 XY 并不需要下一次“补回”一个 XX。**1:1 是理论比例，不是每个家庭必须凑齐的配额**。',
    ],
    optionNotes: [
      'A：之前都是 XY，不代表以后只能是 XY。',
      'B：1/4 可用于两个指定独立结果连续发生，本题只问下一次。',
      'C：下一次 XX 的机会仍为 1/2。',
      'D：随机事件不会为了平衡前面的结果而保证 XX。',
    ],
    takeaway:
      '读清题目问的是“接下来一次”，还是“接下来几次都怎样”。独立事件的单次概率不会因历史结果改变。',
    variant: {
      question:
        'Under the same assumptions, what is the probability that the next two children are both XX?',
      answer: '1/4。',
      explanation:
        '两次都要满足 XX，因此相乘：(1/2)×(1/2)=1/4。之前三个孩子的结果仍不进入这个乘式，因为题目已经把它们作为发生过的背景。',
    },
  },
  {
    title: '预期人数不是保证人数',
    question:
      'In a mammal with the usual XX/XY system, 200 independent offspring are produced under a model giving equal probabilities of XX and XY. Which statement is correct?',
    options: [
      'Exactly 100 must be XX.',
      'The expected number of XX offspring is 100, but the observed number may differ.',
      'Each egg can contribute either X or Y with equal probability.',
      'Every offspring receives its Y chromosome from its mother.',
    ],
    answer: 'B：XX 的预期数为 100，实际观察数可以不同。',
    steps: [
      '在通常 XX/XY 模型中，XX 亲本产生带 X 的卵细胞，XY 亲本产生带 X 或 Y 的精子。两种组合的理论概率各为 1/2。',
      '预期数是总次数乘单次概率，200×1/2=100。这是重复抽样意义上的平均预期，不是对这一组样本的保证。',
      '因此 B 正确。==样本比例不完全等于 1:1，并不自动说明性别决定规律错误==。还需考虑随机波动与题目给出的其他条件。',
    ],
    optionNotes: [
      'A：把理论预期误说成确定结果。',
      'B：计算正确，也保留了随机样本可有波动的含义。',
      'C：通常 XX 亲本的正常卵细胞只含 X，不含 Y。',
      'D：在此模型中，Y 来自 XY 亲本的精子。',
    ],
    takeaway:
      'expected（预期）与 observed（观察到）要分清。理论概率用来计算预期，不保证每一小组都严格符合理论比例。',
    variant: {
      question:
        'A sample contains 112 XX and 88 XY offspring. What is the observed XX percentage, and does this alone disprove the equal-probability model?',
      answer: '观察到的 XX 比例为 56%；仅凭这一事实不能推翻模型。',
      explanation:
        '112÷200×100%=56%。观察值与理论 50% 不同可以由随机波动产生；判断差异是否超出随机波动需要进一步统计依据，不能仅凭不相等就下结论。',
    },
  },
]

const sections: KnowledgeSection[] = [
  {
    code: '150301',
    title: '有丝分裂与细胞周期',
    visual: 'cell-division',
    summary: '把间期复制、染色体分配和细胞数增加连起来理解；区分正常修复与失控分裂。',
    paragraphs: [
      '一个细胞要变成两个，不能只是把细胞切成两半：两边都需要完整遗传信息。因此细胞先长大、复制 DNA，再把复制所得的信息分别送入两个子细胞。**间期是在积极准备，不是细胞什么也不做的“休息期”**。',
      '这部分最值得理清的是三个不同的问题：有几个细胞、每个细胞有几条染色体、每个细胞有多少 DNA。下面的图用两对染色体演示；真实人体细胞数目更多，但判断原则相同。',
    ],
    rules: [
      {
        title: '间期：生长、代谢与 DNA 复制',
        text: '细胞周期包括间期和分裂阶段。间期中细胞生长、增加分裂所需物质，并在 S 期复制 DNA；复制前后的阶段分别称 G1 和 G2。许多细胞活动仍在进行，**间期不等于停止代谢**。也不是所有成熟细胞都持续进入下一轮分裂。',
      },
      {
        title: '染色体与姐妹染色单体',
        text: '复制前一条染色体通常含一条 DNA 双链分子；复制后有两条姐妹染色单体，经着丝粒区域联系。在姐妹分开前，它们仍算一条复制后的染色体。==DNA 量加倍，不等于这一刻染色体数加倍==。X 形通常表示复制后的染色体，不是两条同源染色体。',
      },
      {
        title: '分配：姐妹染色单体分开',
        text: '有丝分裂时，复制后的染色体排列，纺锤体使姐妹染色单体向相反两极分离。分开后每条成为独立染色体。两个新细胞核形成，随后完成胞质分裂。**正常情况下，两边各得到完整、相同的一套遗传信息**。',
      },
      {
        title: '结果：两个子细胞保留原有染色体数',
        text: '正常有丝分裂及胞质分裂后，产生两个子细胞，染色体数与原细胞相同。无突变等异常时，遗传组成也相同。二倍体细胞分裂后仍是二倍体；若原细胞是单倍体，有丝分裂也保持单倍体，不能说“有丝分裂一定产生二倍体”。',
      },
      {
        title: '作用：生长、替换、修复与无性繁殖',
        text: '增加细胞数支持多细胞生物生长；补充磨损或死亡细胞维持组织；伤口修复也需要分裂。一些真核生物借此无性繁殖，例如草莓匍匐茎形成新植株。**细胞变大与细胞数增加是不同变化**，生长常涉及两者。',
      },
      {
        title: '癌症：细胞分裂失去正常控制',
        text: '细胞周期受到调控；某些突变和其他细胞变化可破坏调控，使细胞不再响应正常限制，持续增殖并促成肿瘤与癌症。不是所有突变都会致癌，也不是正常分裂较多就等于癌症。==关键是失去正常控制，不是仅仅发生有丝分裂==。',
      },
    ],
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
    summary: '一次复制、两次分裂；弄清同源染色体与姐妹染色单体分别何时分开。',
    paragraphs: [
      '如果卵和精子都带着体细胞那样的两套染色体，受精后就会变成四套。减数分裂解决这个问题：先把染色体套数减为一套，再在受精时把两套重新合起来。**减半与恢复相配合，保持世代间染色体数稳定**。',
      '你可以把同源染色体理解为同一类的两份：一份来自父方，一份来自母方；它们带有相应基因，但等位基因不必相同。姐妹染色单体则是一条染色体复制后得到的两份。先分清这两种关系，再看两次分裂，就不会把“分谁”记反。',
    ],
    rules: [
      {
        title: '单倍体与二倍体',
        text: '二倍体 diploid 有两套染色体，记作 2n；单倍体 haploid 有一套，记作 n。人类典型体细胞为 46 条，正常配子为 23 条。**套数看同类染色体有几份，不看染色体画成 I 还是 X**；复制后的单倍体仍然是单倍体。',
      },
      {
        title: '一次复制，两次分裂',
        text: '减数分裂前的间期有生长和 DNA 复制，随后进行减数第一次及第二次分裂。两次分裂之间不再进行一轮 DNA 复制。==先复制一次，再连续分裂两次==，是理解最终 DNA 含量的关键。',
      },
      {
        title: '第一次分裂：分开同源染色体',
        text: '同源染色体配对，随后同一对的两条被分到相反两极。每个子细胞得到一套，染色体数由 2n 减为 n，但每条通常仍含两条姐妹染色单体。分开的是同源的一对，不是把一个 X 的两半拆开。',
      },
      {
        title: '第二次分裂：分开姐妹染色单体',
        text: '两个细胞分别再次分裂，姐妹染色单体分开并成为独立染色体。通常形成四个单倍体产物，每个只保留每类染色体的一份。**并非每次分裂都让最终染色体数再减半**；减半的关键在第一次。',
      },
      {
        title: '遗传差异从哪里来',
        text: '不同对同源染色体在第一次分裂时可独立排列；配对期间同源的非姐妹染色单体还可交换对应 DNA 片段。这些过程使遗传组合出现差异。不是每一次简单模型都必然产生四种不同组合，也不能说每个基因都一定改变。',
      },
      {
        title: '配子与受精',
        text: '动物的减数分裂参与形成单倍体配子；受精使两个配子的遗传物质结合，n+n 恢复为 2n。受精卵再通过有丝分裂生长。概括为四个单倍体产物，不代表四个都是功能相同的成熟配子：哺乳动物卵细胞形成时胞质分配不均，还会形成极体。',
      },
    ],
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
    summary: '区分是否发生配子融合，理解克隆、遗传差异与环境影响各在说什么。',
    paragraphs: [
      '草莓可以通过匍匐茎长出新植株，也可以通过种子繁殖。前一种通常直接延续亲本的遗传组成，后一种经过配子形成和受精，产生新的遗传组合。**繁殖方式描述的是后代怎样产生，不只是外表像不像亲本**。',
      '无性繁殖有利于保留已有组合，有性繁殖可增加组合上的差异。哪种方式在某个环境更有利，要结合条件判断；遗传差异并不保证每个后代都更适应，克隆也不保证在不同环境中表现完全相同。',
    ],
    rules: [
      {
        title: '无性繁殖：一个亲本，不经配子融合',
        text: '无性繁殖通常由一个亲本形成后代，不通过受精把两个配子的遗传物质结合。无突变时，后代与亲本遗传组成相同，称为克隆 clone。草莓匍匐茎、植物插条和某些生物出芽都是例子。',
      },
      {
        title: '有丝分裂与二分裂要分清',
        text: '许多真核生物的无性繁殖涉及有丝分裂。细菌也能无性繁殖，但其复制环状染色体后发生的二分裂 binary fission，不属于有丝分裂。**“无性繁殖”是更大的类别，不能把它完全等同于有丝分裂**。',
      },
      {
        title: '有性繁殖：配子形成与受精',
        text: '典型有性繁殖由两个亲本提供配子，受精时配子融合，形成受精卵。减数分裂与随机受精使遗传组合产生差异。受精卵之后用有丝分裂增加细胞数；**同一生命周期可以同时用到两种分裂**。',
      },
      {
        title: '遗传变异不只来自突变',
        text: '突变能产生新的遗传变异；有性繁殖还可重新组合已有等位基因，即使没有新的突变，兄弟姐妹也可有不同遗传组合。无性后代也可能因突变出现遗传差异，所以“克隆相同”的说法要保留无突变这一条件。',
      },
      {
        title: '遗传相同与外表相同不是一回事',
        text: '许多表现型同时受遗传和环境影响。遗传相同的插条在不同光照、水分条件下可长得不同；外表相似的个体也不必遗传完全相同。==只看外观，通常不足以断定繁殖方式或 DNA 是否改变==。',
      },
      {
        title: '典型规律与例外',
        text: '自体受精时两个配子可来自同一个体，但仍属于有性繁殖；同卵双生子来自同一个受精卵分开，不能据此断言有性繁殖的后代绝不相同。比较方式时，说明一般趋势及题目条件，不把“两亲本”“后代有差异”改成无例外的绝对句。',
      },
    ],
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
    summary: '读懂通常的 XX/XY 遗传图，并区分单次概率、连续事件和实际样本比例。',
    paragraphs: [
      '在 ESAT 常用的人类及多数哺乳动物模型中，XX 对应雌性、XY 对应雄性。卵细胞通常提供 X，精子提供 X 或 Y。把这两步画清楚，后代为什么有两种组合就自然了。**这里讲的是通常 XX/XY 模型，不是所有生物都用同一套规则**。',
      '理论上两种精子受精机会相等时，XX 与 XY 各占一半。这是概率模型：一次只能出现一个结果，小家庭或一次实验不会自动凑成 1:1。读题时要分清“概率是多少”“预期多少个”和“实际观察多少个”。',
    ],
    rules: [
      {
        title: '性染色体与常染色体',
        text: '通常人类体细胞的 46 条染色体包括 44 条常染色体和 2 条性染色体；正常配子为 22 条常染色体加 1 条性染色体。**23 条染色体不是 23 对**。这里只用通常染色体组合解释考试模型。',
      },
      {
        title: 'XX 与 XY 亲本产生的配子',
        text: '正常 XX 亲本的卵细胞带 X；XY 亲本的精子有带 X 与带 Y 两类。不能给正常卵细胞分配一个 Y，也不能把成熟配子写成 XX 或 XY，因为配子只有一套染色体。',
      },
      {
        title: '受精后的两种组合',
        text: 'X 卵与 X 精子结合得到 XX；X 卵与 Y 精子结合得到 XY。通常模型中，两类精子的受精机会相等，因而 XX:XY 的理论比例为 1:1。**区别来自参与受精的精子带 X 还是 Y**，不是母亲能够选择。',
      },
      {
        title: '独立出生与连续事件',
        text: '题目若假设各次出生独立，前面的结果不改变下一次 XX 或 XY 各为 1/2 的概率。连续两次都是指定一类时，概率为 1/2×1/2=1/4；若只要求一 XX 一 XY，还要包含两种先后顺序。',
      },
      {
        title: '预期数与实际数',
        text: '预期数等于总次数乘单次概率，例如 200 次中预期 XX 为 100。实际数可能偏离 100，尤其样本较小时。==理论比例不要求每个家庭或每次样本严格各占一半==。观察比例要用真实人数计算。',
      },
      {
        title: '看清题目给出的物种和假设',
        text: '不是所有动物都采用通常哺乳动物 XX/XY 系统。有的物种规则不同；若题目提供其他模型，应根据给出的规则推断。即使在哺乳动物中，也不能把这个入门模型当成对所有染色体异常或发育情况的完整描述。',
      },
    ],
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
    '身体生长时需要保留完整遗传信息，形成配子时却要先把染色体套数减半。这一章从这两个目的出发，梳理有丝分裂、减数分裂和繁殖的关系。分阶段图解可以逐步核对染色体数；例题再带你处理“每个细胞”“复制以后”“恰好一个”等容易读漏的条件。',
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
      note: '内部核对 B3.1–B3.4 范围；知识总结与题目为原创。',
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
