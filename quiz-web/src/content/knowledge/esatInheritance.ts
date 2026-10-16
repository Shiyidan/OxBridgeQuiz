// ESAT 生物遗传讲义：串联遗传物质、遗传术语与单基因概率，配套原创例题和图解。
import type { KnowledgeExamFocus, KnowledgeLesson } from './types'

const materialExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '细胞核带来了什么，细胞质又留下了什么？',
    question:
      'The nucleus of an unfertilised animal egg is removed and replaced with the nucleus of a diploid skin cell from another animal of the same species. Assume successful development, no mutation and that all mitochondria come from the egg. Which statement about the resulting animal is correct?',
    options: [
      'All of its DNA must come from the skin-cell donor.',
      'Its nuclear chromosomes come from the skin-cell donor, but its mitochondrial DNA comes from the egg.',
      'Its nuclear chromosomes come equally from the egg donor and the skin-cell donor.',
      'It cannot have nuclear genes because a skin cell has lost all genes needed by other cell types.',
    ],
    answer: 'B：核染色体来自皮肤细胞供体，线粒体 DNA 来自卵细胞。',
    steps: [
      '先追踪发生了什么变化：卵细胞原来的核被移走，放入的是皮肤细胞的核。因此，核染色体的来源是皮肤细胞供体，并没有发生两个细胞核的融合。',
      '再看没有被替换的部分。题干明确说线粒体全部来自卵细胞；线粒体也有自己的 DNA，所以这部分遗传物质仍来自卵细胞。',
      '**细胞核保存主要遗传物质，不等于保存全部 DNA**。B 把核 DNA 与线粒体 DNA 分开说明，因此完整符合题意。',
      '皮肤细胞已经特化，但一般仍保留形成其他细胞类型所需的核基因；不同细胞主要是使用的基因不同。因此 D 不能成立。题干已经假定发育成功，不需要再讨论实验成功率。',
    ],
    optionNotes: [
      'A：“全部”说得过满，忽略了卵细胞提供的线粒体 DNA。',
      'B：分别追踪细胞核和线粒体，两个来源都符合题干。',
      'C：没有受精或两个细胞核融合，不能套用“一半来自每个亲本”。',
      'D：特化通常改变基因的表达，不是把其他细胞会用到的基因全部删除。',
    ],
    takeaway:
      '遇到遗传物质来源题，把**核 DNA 与细胞器 DNA 分开追踪**。先看题干实际转移了什么，再决定哪些信息会跟着转移。',
    variant: {
      question:
        'A normal egg is fertilised by a normal sperm of the same species instead. Considering nuclear chromosomes only, what fraction of the zygote’s chromosome set comes from each gamete?',
      answer: '卵细胞和精子各提供一半核染色体。',
      explanation:
        '现在改成了正常受精：两个单倍体配子各带一套核染色体，结合成二倍体合子。**受精时的“一半加一半”不能用于上一题的细胞核替换**；两题发生的过程不同。',
    },
  },
  {
    title: '同一个位置上的 A 与 a，究竟是什么？',
    question:
      'Before DNA replication, a diploid cell has allele A at a particular locus on one autosome and allele a at the corresponding locus on its homologous partner. Which statement is correct?',
    options: [
      'A and a must be different genes because their DNA sequences differ.',
      'The two chromosomes are sister chromatids produced by replication.',
      'The cell has two copies of this gene, carrying different alleles.',
      'A and a must be on sex chromosomes because they differ.',
    ],
    answer: 'C：这个基因有两个拷贝，分别是 A 与 a 两种等位基因。',
    steps: [
      'locus 是基因在染色体上的位置。题目强调一对同源常染色体的对应位置，说明这里讨论的是**同一个基因的两个版本**，不是两个功能无关的基因。',
      '二倍体细胞的一对同源染色体通常一条来自母方、一条来自父方。复制前，每条在这个位置各有一份基因，因此合计两份。',
      'A 与 a 表明两个版本不同，也就是杂合。它们仍位于常染色体上；“是否相同”不会把常染色体变成性染色体。',
      '姐妹染色单体则是同一条染色体复制形成的两份；题目明确在复制之前，不能把两条同源染色体当作姐妹染色单体。',
    ],
    optionNotes: [
      'A：等位基因本来就可以有不同的 DNA 序列，不因此变成两个不同基因。',
      'B：同源染色体与姐妹染色单体来源不同，而且题目尚未发生 DNA 复制。',
      'C：两个拷贝、两个版本，正是这里的 Aa。',
      'D：常染色体上的同一基因也可以有不同等位基因。',
    ],
    takeaway:
      '分清三个问题：**有几份基因、这些版本是否相同、它们位于哪类染色体**。数量、版本和位置不能互相替代。',
    variant: {
      question:
        'The cell now replicates its DNA without mutation. Before the sister chromatids separate, how many DNA copies of this locus are present, and has the cell become homozygous?',
      answer: '共四份：两份 A、两份 a；仍是杂合，不会变成纯合。',
      explanation:
        '复制让原来带 A 的染色体形成两条带 A 的姐妹染色单体，带 a 的也同样复制。**拷贝数增加，不会把不同的等位基因变成相同版本**；该位点的基因型仍记为 Aa，不能因此称为四倍体或纯合。',
    },
  },
]

const termExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '显性性状也可以很少见',
    question:
      'A fictional plant trait is controlled by one autosomal gene. D is completely dominant to d: DD and Dd plants are striped, while dd plants are plain. In a population of 200 plants, only 10 are striped. Which statement must be correct?',
    options: [
      'D is recessive because striped plants are uncommon.',
      'Every striped plant has genotype DD.',
      'A plain plant must have genotype dd under this model.',
      'D must increase survival because it is dominant.',
    ],
    answer: 'C：在题目给定模型下，无条纹植株必为 dd。',
    steps: [
      '先直接读题目给出的基因型与表现型对应关系：DD、Dd 都有条纹，只有 dd 无条纹。**显性描述杂合子表现什么，不描述群体中谁更多**。',
      '因此无条纹可以确定为 dd，有条纹却只能确定为 DD 或 Dd。C 是唯一一定成立的结论。',
      '10 株占 200 株的 5%，说明这个表现型在本次群体中少见；它不能改变 D 在 Dd 中仍然表现出来的事实。',
      '题干没有任何存活或繁殖数据，也就不能凭“大写字母”认定 D 对生存有利。',
    ],
    optionNotes: [
      'A：把群体频率与显隐性关系混为一谈。',
      'B：忽略了同样有条纹的 Dd。',
      'C：符合给定的完整显性模型，且结论唯一。',
      'D：显性、常见和有利是三件不同的事。',
    ],
    takeaway:
      '从表现型推基因型时，先写出题目给定的对应关系。**完全显性模型里，显性表现型通常有两种可能基因型**。',
    variant: {
      question:
        'In a second population of the same species, 190 of 200 plants are striped. Does this change which allele is dominant?',
      answer: '不改变，D 仍对 d 显性。',
      explanation:
        '群体里有条纹的比例由 5% 变成 95%，改变的是频率。只要 Dd 的表现型仍与 DD 相同，D 对 d 的显性关系就未改变。',
    },
  },
  {
    title: '表现型改变，基因型一定改变了吗？',
    question:
      'Genetically identical cuttings of a fictional plant are grown in two environments. In bright light their leaves are purple; in shade their leaves are green. No DNA mutation occurs. Which explanation is best supported?',
    options: [
      'Shade changes every dominant allele into a recessive allele.',
      'The environment can change phenotype without changing genotype.',
      'Green leaves prove that the plants lack all pigment-related genes.',
      'All plant colour traits must therefore be controlled by a single gene.',
    ],
    answer: 'B：环境可以影响表现型，而基因型保持不变。',
    steps: [
      '先找实验保持相同的部分：插条遗传组成相同，而且题目排除了突变。我们没有理由把颜色变化解释为 DNA 版本改变。',
      '再看改变的条件：光照不同，叶色不同。这里支持的是**相同基因型在不同环境下可以出现不同表现型**。',
      '颜色没有表现出来，不等于相关基因被删除。基因怎样被使用、产生多少色素，都可能受环境影响。',
      '这个实验也没有提供控制叶色的基因数量。不能从“观察一种性状”直接跳到“只有一个基因参与”。',
    ],
    optionNotes: [
      'A：环境影响表现不等于把等位基因的 DNA 版本转换了。',
      'B：同时保留了遗传组成相同和环境不同这两个条件。',
      'C：把没有显示某种颜色误判成所有相关基因缺失。',
      'D：没有基因数量的信息，且许多性状受多个基因共同影响。',
    ],
    takeaway:
      '比较 genotype 与 phenotype 时，可以这样问自己：**变化的是遗传版本，还是最终表现出来的特征？** 看见表现差异，不能自动判定发生了突变。',
    variant: {
      question:
        'A different plant trait is stated to depend on several genes and nutrition. Is a 3:1 phenotypic ratio guaranteed when two plants showing that trait are crossed?',
      answer: '不保证，不能直接套用 3∶1。',
      explanation:
        '3∶1 是单基因、完全显性等条件下 Aa × Aa 的理论表现型比例。现在涉及多个基因和营养，已经不符合这个简单模型；亲本有相似表现型也不能确定它们都属于某个单基因的杂合子。',
    },
  },
]

const crossExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '杂交比例从配子来，不从口诀来',
    question:
      'In a fictional species, seed shape is controlled by one autosomal gene with complete dominance: R gives round seeds and rr gives angular seeds. A round-seeded plant crossed with an rr plant produces both round and angular offspring. Assume no mutation and equal viability. What is the expected proportion of angular offspring in further crosses between these same parents?',
    options: ['0', '1/4', '1/2', '3/4'],
    answer: 'C：1/2，也就是 50%。',
    steps: [
      'rr 亲本只能提供 r。已经出现角形 rr 后代，说明另一个圆形亲本也曾提供 r；而它自己是圆形，必须还有 R，所以它是 Rr。',
      '于是实际杂交是 Rr × rr。Rr 的配子一半带 R、一半带 r；rr 的配子都带 r，受精后得到一半 Rr、一半 rr。',
      '题目问角形，而不是杂合子的比例。本题角形是 rr，占 1/2，所以选 C。**先列配子，再把基因型翻译为表现型**。',
      '曾经生出哪种后代可以帮助我们判断亲本基因型；一旦亲本基因型确定，前面后代的结果不会“用掉”下一次的概率。',
    ],
    optionNotes: [
      'A：若圆形亲本是 RR 才会全为 Rr，但已出现 rr 后代，排除了这种情况。',
      'B：1/4 是 Rr × Rr 时 rr 的比例，本题第二个亲本明确为 rr。',
      'C：Rr × rr 得到 1/2 Rr 与 1/2 rr，符合题意。',
      'D：3/4 是另一个杂交中显性表现型的比例，本题既不是该杂交，也不是问显性表现型。',
    ],
    takeaway:
      '测交用隐性纯合亲本帮助判断另一方。**出现隐性后代可以证明显性亲本携带隐性等位基因；少量后代全显性却不能绝对证明它纯合**。',
    variant: {
      question:
        'Now two known Rr plants are crossed. Among 80 offspring with equal viability, how many angular offspring are expected, and must the observed number equal this value?',
      answer: '期望 20 个；实际数量不必恰好为 20。',
      explanation:
        'Rr × Rr 中 rr 的概率是 1/4，因此期望数为 80 × 1/4 = 20。随机受精会带来抽样波动，**理论比例不是规定每四个后代必须分配出一个 rr**。',
    },
  },
  {
    title: '未患病的兄弟姐妹，为什么携带概率不是一半？',
    question:
      'A condition is autosomal recessive, with aa affected and AA or Aa unaffected. Penetrance is complete, and there is no new mutation. Two unaffected parents have an affected daughter and an unaffected son. The son has a child with a woman known to be Aa. Before any children are born, what is the probability that their child will be affected?',
    options: ['1/8', '1/6', '1/4', '1/2'],
    answer: 'B：1/6。',
    steps: [
      '先看父母：女儿是 aa，说明父母各提供了一个 a；父母自己都未患病，所以都必须是 Aa。这一步利用的是孩子已经出现的基因型。',
      'Aa × Aa 的四种等可能配子组合是 AA、Aa、aA、aa。儿子已经确定未患病，就要排除 aa；**剩下的三种组合中，两种是杂合**，因此儿子是 Aa 的概率为 2/3，AA 的概率为 1/3。',
      '如果儿子是 AA，他与 Aa 女性不会生出 aa；如果儿子是 Aa，则 Aa × Aa 生出 aa 的概率为 1/4。题干为常染色体遗传，儿子是男性不会改变这里的 2/3。',
      '把“儿子是携带者”与“双方再各传下 a”连起来：2/3 × 1/4 = 1/6。也可以算 2/3 × 1/2 × 1/2，含义相同。',
    ],
    optionNotes: [
      'A：把未患病儿子为携带者的概率误当成 1/2，再乘 1/4。',
      'B：先排除已知不可能的 aa，再乘传递概率，计算完整。',
      'C：把儿子直接当作已确认的 Aa，忽略了他也可能是 AA。',
      'D：只考虑了一方传递 a，未同时考虑另一方与儿子的基因型不确定性。',
    ],
    takeaway:
      '“已知未患病”会缩小候选范围。**先删去不符合已知条件的情况，再在剩下的等可能组合中计算**；不要把 AA 与 Aa 两个名字误当成两种等可能结果。',
    variant: {
      question:
        'A genetic test now confirms that the son is Aa. After he and the Aa woman have one affected child, what is the probability that their next child will be affected, assuming independent conceptions?',
      answer: '1/4。',
      explanation:
        '检测后，儿子的基因型不再有 2/3 这一层不确定性，直接使用 Aa × Aa。每次受精独立，因此第一胎患病不会让第二胎“补回正常”；**亲本基因型固定时，下一胎概率仍是 1/4**。',
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
      summary: '从细胞核找到染色体、DNA 和基因，分清同源染色体、等位基因与复制后的拷贝。',
      paragraphs: [
        '先把几个大小不同的结构放回原位。典型真核细胞的细胞核内有染色体，染色体由 DNA 与蛋白质组成，DNA 上的某些片段是基因。**基因不是漂浮在染色体外的小颗粒**，而是 DNA 序列的一部分。图中把结构逐层放大，是为了看清关系，实际大小并不按图中比例排列。',
        '遗传题还经常把“来自哪里”与“有几份”放在一起问。二倍体细胞的同源染色体通常一条来自母方、一条来自父方，携带相同种类的基因，但版本可以不同。DNA 复制会增加拷贝数，却不会自动增加等位基因的种类；这和下一节的 Aa、AA 正好连在一起。',
      ],
      rules: [
        {
          title: '细胞核是主要遗传物质的储存处',
          text: '真核细胞的核染色体位于细胞核中，携带大量调控细胞活动的遗传信息。**主要不等于全部**：线粒体也有 DNA，植物的叶绿体也有 DNA。成熟哺乳动物红细胞无核，是特化的例外，不能据此否定真核生物的一般结构。',
        },
        {
          title: '染色体、DNA 与基因',
          text: '染色体 chromosome 由长 DNA 分子与相关蛋白质组成，一条染色体通常携带许多基因 gene。基因是具有功能的 DNA 片段；本阶段常见的是携带制造某种蛋白质信息的基因。==一个基因不等于一条染色体，一个性状也不一定只由一个基因控制==。',
        },
        {
          title: '同源染色体与基因位点',
          text: '二倍体细胞的一对同源染色体通常形态相近，并在对应位置携带同类基因。这个位置叫位点 locus。同一位置可以是 A 与 A，也可以是 A 与 a；**同源不要求两条染色体每个 DNA 序列都完全相同**。',
        },
        {
          title: '等位基因是版本差别',
          text: '等位基因 allele 是同一个基因的不同形式，可能来自 DNA 序列的差异。例如同一位点的 A 与 a，可以影响同一种蛋白质的功能或产量。它们不一定造成肉眼可见差别，也不是“一个控制性状、另一个完全没用”。',
        },
        {
          title: '复制增加拷贝，不改变亲本来源',
          text: '一条染色体复制后形成两条姐妹染色单体；忽略突变时，它们在相应位点带相同版本。一对同源染色体则来自两个亲本，可能携带不同等位基因。**同源染色体与姐妹染色单体不是同一对结构**；复制也不会把 Aa 变成 AA。',
        },
        {
          title: '遗传信息相同，不代表细胞功能相同',
          text: '同一个体的大多数有核体细胞通常拥有相同的核基因，但使用哪些基因、使用多少可以不同，因此形成不同的蛋白质与功能。皮肤细胞和肌肉细胞的差异通常来自基因表达，而不是各自只剩下完成自己工作的一小组基因。',
        },
      ],
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
      summary: '用 Aa、AA 与 aa 理解显隐性、纯合杂合、基因型表现型，以及常染色体和多基因性状。',
      paragraphs: [
        '这些术语可以围绕一个具体例子来记。假设一个常染色体基因有 A、a 两个版本，A 对 a 完全显性：AA 与 Aa 显示同一种性状，aa 显示另一种。AA、Aa、aa 是基因型；实际表现出来的颜色、形状或生理特征是表现型。**字母告诉你带了什么，表现型告诉你最后呈现什么**。',
        '这里特意写“假设一个基因”，因为真实生物的多数表现型并不是一个字母就能说明。多个基因常共同参与，环境也能影响表现。掌握单基因模型，是为了在题目明确给出这些条件时算清楚；不是把身高、肤色等复杂性状全部压成大写与小写两种情况。',
      ],
      rules: [
        {
          title: '基因型 genotype 与表现型 phenotype',
          text: '讨论一个位点时，基因型描述携带的等位基因组合，如 AA、Aa、aa；表现型是可观察或测量的特征，如颜色或酶活性。完全显性时，AA 与 Aa 可有相同表现型，因此**相同表现型不保证相同基因型**。表现型也可能受到环境影响。',
        },
        {
          title: '纯合 homozygous 与杂合 heterozygous',
          text: '在二倍体的这个位点，两个版本相同，如 AA 或 aa，叫纯合；不同，如 Aa，叫杂合。纯合不等于显性，aa 同样是纯合。杂合也不表示两种性状各占身体一半，它描述的是遗传组成。',
        },
        {
          title: '显性 dominant 与隐性 recessive',
          text: '完全显性模型中，杂合子 Aa 显示与 AA 相同的表现型，称 A 对 a 显性；a 所对应的隐性表现型在 aa 中表现。==显隐性关系看杂合子怎么表现，不看群体数量、字母大小或是否有利==。杂合子仍然可以把 a 传给后代。',
        },
        {
          title: '常染色体 autosome 与性染色体',
          text: '常染色体是性染色体以外的染色体。典型人类二倍体有核体细胞有 22 对常染色体和 1 对性染色体；正常配子也含常染色体，只是不成对。**常染色体不是“只在体细胞里的染色体”**，常染色体上的基因也不是只在某一种性别中存在。',
        },
        {
          title: '携带者 carrier 与遗传性状',
          text: '对于完全显现的常染色体隐性遗传病模型，Aa 个体未患病，却能把致病的 a 传给后代，称为携带者。aa 患病，AA 不携带这个 a。**未患病不一定不携带相关等位基因**；“患病”也不能一律写成小写，显性遗传病的致病版本同样可能用大写表示。',
        },
        {
          title: '单基因模型与多基因表现型',
          text: '单基因遗传只追踪一个基因的不同版本，适合本章的简单杂交。多数表现型由多个基因共同影响；如身高还受营养等环境因素影响。多基因不等于一个基因拥有很多等位基因，也不能直接沿用单基因 3∶1 比例。',
        },
        {
          title: '相同基因型也可能出现不同表现',
          text: '光照、营养和温度等环境条件可以影响基因表达或生理过程，使相同基因型表现不同。若 DNA 没有改变，这不是等位基因变成另一版本。另一方面，观察到两个个体表现不同，也不能只凭这一点判断差异一定来自基因或一定来自环境。',
        },
      ],
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
      summary: '从亲本、配子到后代比例，理解家系中的携带者、条件概率与每次生育的独立性。',
      paragraphs: [
        '杂交表 Punnett square 不是用四个格子预测四个孩子的出生顺序，而是把配子可能怎样相遇列出来。Aa 亲本在正常分离、没有传递偏倚时产生 A、a 两类配子，各占一半。亲本基因型确定后，后代的基因型概率就能从这些配子的组合得到。',
        '家系图则是用一家人已经观察到的表现，反过来判断哪些基因型可能成立。图中涂色通常表示具有某性状或患病，**不自动表示显性**。本节的简单推断需要题目给定单基因、常染色体、完全显现、无新突变等条件；如果这些条件不成立，就不能机械照搬。',
      ],
      rules: [
        {
          title: '单基因杂交的基本概率',
          text: '正常配子在一个常染色体位点通常只带一个等位基因。Aa × Aa 的四种等可能组合是 AA、Aa、aA、aa，合并后基因型比例为 1∶2∶1。**Aa 与 aA 是同一种基因型，却来自两种配子组合**，所以不能把三种基因型各算成 1/3。',
        },
        {
          title: '基因型比例与表现型比例',
          text: '只有在 A 对 a 完全显性、相应基因型具有预期表现等条件下，Aa × Aa 才得到显性∶隐性 = 3∶1。Aa × aa 则为 1∶1；AA × aa 全是 Aa。比较实验数据时，还要考虑各基因型存活机会是否相同。',
        },
        {
          title: '测交能告诉我们什么',
          text: '让显性表现型个体与隐性纯合 aa 杂交，可以检验前者是否携带 a。若产生 aa 后代，在没有突变等条件下，前者必能提供 a，因此为 Aa。但少量后代全部显性，也可能只是随机结果；**“没观察到隐性”不等于“已经证明纯合”**。',
        },
        {
          title: '家系图的符号与信息',
          text: '常见约定为方形表示男性、圆形表示女性、连线表示亲代关系，涂色表示题目定义的性状；罗马数字标代次，阿拉伯数字标个体。先以题目图例为准。未涂色只表示未表现该性状，不能自动排除隐性等位基因。',
        },
        {
          title: '隐性与显性家系的判断',
          text: '在单基因常染色体、完全显现且无新突变等假设下，两位未患病亲本有患病孩子，符合隐性遗传，且亲本必须都是 Aa。两位患病亲本生出未患病孩子，则与完全显性的 Aa × Aa 相容，排除了两位 aa 的简单隐性模型。**每代出现或只在男性中出现，都不能单独证明遗传方式**。',
        },
        {
          title: '已知条件会改变计算范围',
          text: 'Aa × Aa 的孩子事先为 Aa 的概率是 1/2；若已知孩子未患隐性病，排除 aa 后，剩下 AA、Aa、aA 三种等可能组合，携带者概率变成 2/3。==1/2 与 2/3 都可以正确，关键是是否已知未患病==。',
        },
        {
          title: '多次生育与独立事件',
          text: '亲本基因型固定、每次受精独立时，每胎概率相同。Aa × Aa 连续两胎都为 aa 的概率为 1/4 × 1/4 = 1/16；恰有一胎 aa 要包括“先患后不患”和“先不患后患”，为 2 × 1/4 × 3/4 = 3/8。先前孩子也可能提供新的亲本信息，所以要分清“概率不变”与“我们知道的条件变了”。',
        },
        {
          title: '比例、概率、百分比与期望数',
          text: '1∶3 是两类数量之比，相应第一类的概率是 1/(1+3) = 1/4 = 25%。若总数为 120，期望第一类为 30。期望不等于保证：小样本可以偏离理论比例，大样本通常更接近，但也不保证恰好相等。',
        },
      ],
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
      note: '核对 B4.1–B4.3 范围；讲解、例题与图解均为原创。',
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
      note: '核对相互独立与互斥事件的概率计算；数值例题另行原创。',
    },
    {
      id: 'openstax-inheritance',
      title: 'OpenStax · Biology 2e: Laws of Inheritance',
      url: 'https://openstax.org/books/biology-2e/pages/12-3-laws-of-inheritance',
      note: '核对配子分离、测交与多基因遗传的边界。',
    },
  ],
}
