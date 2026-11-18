// 试题库 ESAT 生物 DNA：连接遗传信息的储存、碱基配对、蛋白质合成与突变后果。
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'
import { dnaMethods } from './dnaMethods'

const genomeExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '同一个人的细胞，遗传信息与蛋白质都相同吗？',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2021_NSAA_Q079',
      why: '把体细胞、配子和不同分化细胞放在同一道判断题中，练习区分遗传物质、染色体份数与基因表达。',
    },
    answer: 'A：只有陈述 1 正确。',
    steps: [
      '先看题干的限制：**同一个人，并且不考虑突变**。颊细胞和胚胎干细胞都来自同一受精卵，通常保留同一套等位基因，所以陈述 1 正确。分化成不同细胞，主要改变的是哪些基因被表达。',
      '精子经过减数分裂，只带一套染色体；颊细胞是二倍体，带两套。这里比较的是细胞实际携带的遗传物质，不能把“来自同一人”理解成“都带同样完整的两套遗传信息”，陈述 2 不正确。',
      '再看成熟红细胞这个例外：人的成熟红细胞没有细胞核，也没有线粒体；白细胞有细胞核。因此两者 DNA 碱基数不同，陈述 3 不正确。',
      '最后区分“有这个基因”和“正在制造这种蛋白质”。胚胎干细胞与白细胞承担的功能不同，表达的蛋白质并非全部相同，陈述 4 不正确。四条判断为真、假、假、假，选 A。',
    ],
    optionNotes: [
      'A：只保留陈述 1，正确。',
      'B：陈述 2 忽略了精子与颊细胞的单倍体、二倍体差别。',
      'C：陈述 3 忽略了人成熟红细胞不含 DNA 的特点。',
      'D：陈述 4 把相同遗传信息误当成相同的蛋白质表达。',
      'E：正确保留 1，但多选了 2。',
      'F：正确保留 1，但多选了 3。',
      'G：2 和 4 都不成立，而且漏掉了 1。',
      'H：3 和 4 都不成立，而且漏掉了 1。',
    ],
    takeaway:
      '==同一个人的不同体细胞通常保留相同遗传信息，但不一定制造相同蛋白质==。遇到配子或成熟红细胞，还要单独检查染色体份数和 DNA 是否存在。',
    variant: {
      question:
        'A human skin cell and a muscle cell have the same alleles and no mutations have occurred. Must they produce exactly the same proteins in the same amounts? Explain your answer.',
      answer: '不必。具有相同等位基因，不等于表达相同种类、相同数量的蛋白质。',
      explanation:
        '皮肤细胞与肌肉细胞承担不同功能，可以开启或关闭不同基因，也可以调节表达量。题干把 DNA 差异排除了，仍不能排除基因表达差异。**先分清“保存了什么信息”和“使用了哪些信息”**。',
    },
  },
]

const structureExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '从双链长度算碱基数量',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2018_NSAA_Q63',
      why: '用很短的一段 DNA 同时考查双链总数、碱基百分比和陈述组合，适合练清数量关系。',
    },
    answer: 'A：陈述 1 和 2 正确。',
    steps: [
      '先不要把 25 直接代入百分比。题目说的是**两条互补链，每条 25 个碱基**，所以这段双链 DNA 共 50 个碱基。',
      'A 占 14%，因此 A=50×14%=7。A 与 T 配对，T 也是 7；剩下 50−7−7=36 个由 G 与 C 平分，所以 G=C=18。',
      '代回四条陈述：1 中 A+C=7+18=25，正确；2 中 A+G=25，占总数 50%，正确；3 把 T 说成 14 个，错误；4 把 G+C 的合计 36 当成 G 的数量，错误。',
      '只有 1 和 2 同时成立，对应 A。最后快速复核：7+7+18+18=50，A=T、G=C，都满足。',
    ],
    optionNotes: [
      'A：1 和 2 都成立，正确。',
      'B：1 对，但 3 错；14 是题给百分数，不是 T 的个数。',
      'C：1 对，但 4 错；36 是 G 与 C 的合计。',
      'D：2 对，但 3 错，T 应为 7。',
      'E：2 对，但 4 错，G 应为 18。',
      'F：3 和 4 都把数量算错了。',
    ],
    takeaway:
      '**先把每条链的长度换成双链总碱基数，再算百分比**。双链中 A=T、G=C；这不意味着四种碱基各占四分之一。',
    variant: {
      question:
        'A double-stranded DNA section contains 80 base pairs. Adenine makes up 20% of all bases. How many cytosine bases are present?',
      answer: '48 个胞嘧啶碱基。',
      explanation:
        '80 对碱基共有 160 个碱基。A 与 T 各占 20%，剩下的 60% 由 C 与 G 平分，C 占 30%；160×30%=48。**base pairs 与 bases 的数量相差 2 倍**。',
    },
  },
  {
    title: '已知一条链，怎样填写互补链的表格？',
    question: '',
    source: {
      questionCode: 'NSAA_2016_S1-Q064',
      why: '用两条链的实验数据表考查互补关系，能够检验是否把单链比例与双链整体比例混淆。',
    },
    answer: 'E：P 和 Q 正确。',
    steps: [
      '先读完整第一条链：A=26%、G=28%、T=14%。四种碱基合计 100%，所以 C=100−26−28−14=32%。注意**单链内 A 不必等于 T**。',
      '现在一格一格对应到第二条链：第二条链的 A 对着第一条链的 T，所以 P=14%；第二条链的 C 对着第一条链的 G，所以 Q=28%。',
      '同理，第二条链的 G 对着第一条链的 C，所以 R=32%；第二条链的 T 对着第一条链的 A，所以 S=26%。两条链长度相同，配对后的个数相等，比例也相等。',
      '学生填的 P=14%、Q=28% 正确，R=26%、S=28% 都不正确，因此选 E。不要把第一条链的数值按原列照抄过去。',
    ],
    optionNotes: [
      'A：P 对，但漏掉了同样正确的 Q。',
      'B：Q 对，但漏掉了同样正确的 P。',
      'C：R 应为 32%，不是 26%。',
      'D：S 应为 26%，不是 28%。',
      'E：P=14%、Q=28%，两项都正确。',
      'F：R、S 的填写值都不正确。',
    ],
    takeaway:
      '==互补链要交换 A/T、C/G 的对应关系==。先补齐已知链，再按配对填写另一条链，不要强迫单链本身满足 A=T。',
    variant: {
      question:
        'One DNA strand contains 10% A, 20% T, 30% G and 40% C. What percentage of all bases in the complete double-stranded molecule are adenine?',
      answer: '15%。',
      explanation:
        '互补链的 A 占 20%。两条链长度相同，把两条链的 A 合并后，双链整体的 A 比例为 (10%+20%)÷2=15%。这里求的是**双链整体的比例**，不是互补链单独的 20%。',
    },
  },
]

const synthesisExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '不用背密码子表，也能还原氨基酸顺序',
    question: '',
    source: {
      questionCode: 'NSAA_2019_S1-Q072',
      why: '结合碱基序列、氨基酸计数表和长选项，练习按三联体分组并用重复位置核对翻译结果。',
    },
    answer: 'H：Leu–Val–Trp–Trp–Leu–Arg–Pro–Pro–Leu–Leu–Trp–Leu–Val–Val–Trp–Trp–Leu。',
    steps: [
      '先把序列从左至右每三个碱基分一组：CTA / GTC / TGG / TGG / CTA / CGT / CCT / CCT / CTA / CTA / TGG / CTA / GTC / GTC / TGG / TGG / CTA，共 17 组。表中氨基酸总数也是 1+6+2+5+3=17。',
      '再数各三联体出现几次：CTA 6 次、GTC 3 次、TGG 5 次、CGT 1 次、CCT 2 次。题给五种氨基酸的次数刚好都是不同的，**同一个三联体每次对应同一种氨基酸**，因此可以匹配 CTA→Leu、GTC→Val、TGG→Trp、CGT→Arg、CCT→Pro。',
      '按原顺序代入，前六个是 Leu–Val–Trp–Trp–Leu–Arg，第七、八个都是 Pro，最后一个仍是 Leu。先用这些关键位置排除选项，再核对全串，得到 H。',
      '这里不需要另做互补链，也不需要凭记忆换成 RNA 密码子：原题提供的序列与计数表已足够建立对应关系。每一种题给三联体都至少对应一种表内氨基酸；五种三联体与五种已出现的氨基酸在本题中形成一一对应。',
    ],
    optionNotes: [
      'A：只有 16 个氨基酸，而且第二个应为 Val，不是 Trp。',
      'B：只有 16 个，第二个也错；连续四个 Val 还与题给计数不符。',
      'C：前 16 个顺序正确，但漏掉最后 CTA 对应的 Leu。',
      'D：虽然有 17 个，但第二个应为 Val，不是 Trp。',
      'E：第二个应为 Val；末段多处把 Trp 与 Val 排错。',
      'F：第二个应为 Val，不是 Leu；末尾应为 Leu，不是 Val。',
      'G：第六组 CGT 对应唯一的 Arg，不能写成 Leu。',
      'H：长度、各氨基酸次数和全部位置均与序列相符。',
    ],
    takeaway:
      '**先每三个碱基分组，再核对相同三联体的位置**。长选项不用逐字硬比，长度、重复次数和几个关键位置就能帮你快速定位。',
    variant: {
      question:
        'Using the same triplet assignments, the coding sequence is changed to CTA GTC TGG TGG CTA CGT CCT CCT CTA CTA TGG CTA GTC GTC TGG TGG CTA GTC. What amino acid is added, and how many amino acids are now encoded?',
      answer: '末端增加一个 Val，共编码 18 个氨基酸。',
      explanation:
        '新增的 GTC 是一个完整三联体，按原题对应关系编码 Val。原来 17 组，现在 18 组；新增的是三个碱基，**不是三个氨基酸**。',
    },
  },
  {
    title: '两个碱基改变，会怎样影响蛋白质？',
    question: '',
    source: {
      questionCode: 'NSAA_2017_S1-Q070',
      why: '题给专用密码表与明确突变位置，适合把三联体分组、终止信号和氨基酸种类数放在一起练习。',
    },
    answer: 'H：陈述 1、2、3 都可能正确。',
    steps: [
      '先分组：ATG / CGA / GAC / ATG / TTA / AGG / TGG / GAC / CCC / CGA / GTC。第 4 个碱基是第二组三联体 CGA 的第一个 C；第 20 个碱基是第七组 TGG 的第二个 G。**先定位，才知道哪些氨基酸可能受影响**。',
      '看陈述 1：把第 20 位 G 换成 A，第七组就从 TGG 变成 TAG。题给表把 TAG 标为终止信号，翻译在此停止，因此这段可以只得到前六个氨基酸；终止信号本身不算一个氨基酸。第 4 位仍可发生不引入更早终止信号的替换。',
      '看陈述 2：把第 4 位 C 换成 A，第二组 CGA 变为 AGA。查题给表，两者都编码 Arg，所以第二个氨基酸可以不变。',
      '看陈述 3：给出一种符合条件的组合即可。第 4 位 C→G，使第二组变成 GGA（Gly）；第 20 位 G→T，使第七组变成 TTG（Leu）。这时全串包含 Met、Gly、Asp、Leu、Arg、Pro、Val，共七种。三条都“可能”，所以选 H；三条不必由同一对替换同时实现。',
    ],
    optionNotes: [
      'A：三条都能给出具体成立的替换方式，不能全否。',
      'B：1 成立，但漏掉了可以同义替换的 2，以及七种氨基酸的 3。',
      'C：2 成立，但终止信号情形证明 1 也可能，3 同样可成立。',
      'D：3 成立，但并不是唯一可能成立的陈述。',
      'E：1、2 正确，但漏掉了 3。',
      'F：1、3 正确，但漏掉了 CGA→AGA 仍编码 Arg 的情形。',
      'G：2、3 正确，但漏掉了 TGG→TAG 提前终止的情形。',
      'H：三条各自都有符合题意的例子，正确。',
    ],
    takeaway:
      '遇到 **could**，试着构造一种符合条件的具体替换。先定位三联体，再按**题给密码表**查结果；别把终止信号计入氨基酸数量。',
    variant: {
      question:
        'Using the table in the original question, the fourth base changes from C to A and the twentieth base changes from G to A. How many amino acids are translated from the displayed section, and does its second amino acid change?',
      answer: '翻译出 6 个氨基酸，第二个氨基酸不变，仍是 Arg。',
      explanation:
        '第二组 CGA→AGA，两者都编码 Arg；第七组 TGG→TAG，变成终止信号。读到第七组时停止，因此只得到前六个氨基酸。这个变式把原题的“可能发生”改成了**已经指定的两次替换**。',
    },
  },
]

const mutationExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '发生基因突变，哪些结果仍可能不变？',
    question: '',
    source: {
      questionCode: 'NSAA_2019_S1-Q065',
      why: '把突变是否遗传、是否改变蛋白质、是否改变表型拆成三个判断，覆盖本节最容易混淆的因果关系。',
    },
    answer: 'H：陈述 1、2、3 都可能保持不变。',
    steps: [
      '题目问的是 **may stay the same（可能不变）**。我们要为每条找到一种合理情况，不需要证明所有突变都没有影响。',
      '陈述 1 可以成立：例如突变只发生在皮肤体细胞中，没有进入形成下一代的配子，子代就不必携带这次突变，子代基因型可以不受影响。',
      '陈述 2 可以成立：有些突变并不改变蛋白质功能，或其影响没有表现为可见的个体表型。不能从“DNA 变了”直接跳到“性状一定变了”。',
      '陈述 3 也可以成立：不同三联体可能编码同一种氨基酸，替换一个碱基后仍编码原来的氨基酸，多肽序列可以不变。三条都有成立的可能，选 H。',
    ],
    optionNotes: [
      'A：把“突变”错误地理解成三个层面都必然改变。',
      'B：子代基因型可以不变，但蛋白质序列和个体表型也可以不变。',
      'C：只考虑表型，漏掉了未遗传的体细胞突变和同义替换。',
      'D：同义替换说明 3 可成立，但不能据此否定 1、2。',
      'E：漏掉了不同三联体编码同一种氨基酸的情况。',
      'F：漏掉了突变不改变个体表型的情况。',
      'G：漏掉了突变没有传入子代的情况。',
      'H：三个结果都可能不变，符合题目问法。',
    ],
    takeaway:
      '==DNA 序列改变，不等于氨基酸、表型、子代基因型都必然改变==。分别检查这三个环节，别把它们当成一步。',
    variant: {
      question:
        'A mutation changes one DNA triplet, but the new triplet codes for the same amino acid. All other triplets remain unchanged. Does the amino-acid sequence of the encoded polypeptide change?',
      answer: '不改变。',
      explanation:
        '题目已明确新旧三联体编码同一种氨基酸，其余三联体也没变，因此多肽氨基酸序列不变。这是**同义替换**。我们只据此回答序列问题，不额外断言基因表达量或其他过程必然完全不受影响。',
    },
  },
  {
    title: '两个人有两处序列差异，能直接数出突变次数吗？',
    question: '',
    source: {
      questionCode: 'NSAA_2023_S1-Q075',
      why: '用两个人的实际序列比较检验推断边界，同时复习三联体、氨基酸与表型之间的关系。',
    },
    answer: 'E：陈述 1 和 2 可能正确，陈述 3 错误。',
    steps: [
      '先找差异：第四组三联体是 CCC 与 CCG，第五组是 TTG 与 TTA，一共两处碱基不同。但题目没有说 person 1 就是原始序列，所以**两个人之间的差异数，不等于 person 2 的突变次数**。',
      '陈述 1 为什么可能？假设这段序列原本在这两组是 CCC、TTA。person 1 的第五组发生一次替换得到 TTG；person 2 的第四组发生一次替换得到 CCG。这样两个人相差两个碱基，而 person 2 只有一次突变，陈述 1 就有可能成立。这个例子不表示原题已经证明了真实的突变历史。',
      '陈述 2 也可能成立：不同 DNA 序列不一定产生不同表型。若这些是编码链三联体，CCC/CCG 可编码同一种氨基酸，TTG/TTA 也可编码同一种氨基酸；即使没有确定链的身份，也不能仅凭两处差异就断言表型不同。',
      '陈述 3 把编码对象说错了：图中有六个三联体，即单链上 18 个碱基；在这里讨论的蛋白质编码关系中，它们至多对应六个氨基酸，不是“编码最多六个碱基”。因此保留 1、2，选 E。',
    ],
    optionNotes: [
      'A：忽略了“可能”，把序列差异误当成确定的突变历史和表型变化。',
      'B：1 可能成立，但 2 也可能成立。',
      'C：2 可能成立，但不能默认 person 1 是原始序列来排除 1。',
      'D：3 混淆了 DNA 的组成单位与其编码的氨基酸。',
      'E：1、2 都有成立的可能，3 的编码对象错误，正确。',
      'F：1 可成立，但 3 错，而且漏掉 2。',
      'G：2 可成立，但 3 错，而且漏掉 1。',
      'H：错误地接受了陈述 3。',
    ],
    takeaway:
      '比较两条序列，先说清楚**观察到了什么**，再判断**能推出什么**。观察到两处差异，尚不足以指定谁发生了几次突变；序列不同也不保证表型不同。',
    variant: {
      question:
        'Person 1 is now explicitly stated to have the ancestral sequence. Person 2 differs at exactly two positions, and each mutation is restricted to a single-base substitution at one position. What is the minimum number of substitutions needed to produce person 2’s sequence?',
      answer: '至少 2 次单碱基替换。',
      explanation:
        '这个变式补上了原题没有给的两个条件：person 1 是原始序列，而且每次突变只能替换一个位置。两个不同位置各需至少一次替换，因此最少两次。**结论变得确定，是因为条件变明确了**。',
    },
  },
]

// 各知识点复用首道例题作为兼容字段，主页面仍按完整例题与变式展示。
function dnaSection(
  section: Omit<KnowledgeSection, 'visual' | 'example' | 'sourceIds'>,
): KnowledgeSection {
  const first = section.examFocus!.examples[0]!
  return {
    ...section,
    visual: 'dna',
    example: { question: first.question, steps: first.steps, answer: first.answer },
    sourceIds: [
      'uat-spec-b5',
      'nhgri-genome',
      'openstax-dna',
      'openstax-protein',
      'nhgri-mutations',
    ],
  }
}

export const esatDna: KnowledgeLesson = {
  code: '150500',
  title: 'DNA · 遗传信息与蛋白质',
  subtitle: '从染色体上的 DNA，理解碱基顺序怎样影响蛋白质和性状',
  intro:
    '这一章最容易混淆的，是把不同层次的东西数到一起：一条染色体不等于一个基因，一个碱基对也不等于一个核苷酸。我们先把这些关系整理清楚，再沿着“DNA 中的信息怎样用来制造蛋白质”往下看。这样遇到碱基数量、氨基酸数量或突变的题，就能知道每一步应该比较什么，而不是只记一个公式。',
  memory: [
    '==基因组是全套遗传物质，包括编码与非编码 DNA==；染色体上通常有许多基因。',
    '**一个 DNA 核苷酸＝一个脱氧核糖＋一个磷酸基团＋一个碱基**；两个互补核苷酸才形成一对碱基对应的结构。',
    '双链整体 A=T、G=C；**单独一条链不必满足 A=T、G=C**。$n$ 对碱基共有 $2n$ 个核苷酸。',
    '碱基顺序决定氨基酸顺序，氨基酸顺序影响蛋白质的三维形状与功能。**一个功能蛋白质可以由一条或多条多肽组成**。',
    '三个碱基组成一个阅读单位；算氨基酸时，先确认序列范围，**终止密码子不编码氨基酸**。',
    '==DNA 突变不一定改变氨基酸，更不一定改变表型==。多数突变对表型无可见影响，也有影响较小或显著的突变。',
  ],
  sections: [
    dnaSection({
      code: '150501',
      title: '基因组与染色体',
      summary: dnaMethods['150501'].summary,
      paragraphs: [dnaMethods['150501'].intro],
      memory: dnaMethods['150501'].memory,
      rules: dnaMethods['150501'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '把基因组只定义成全部蛋白质编码基因。',
        '把复制后的两条姐妹染色单体误称为一条 DNA 的两条链。',
        '看到无细胞核就判定没有遗传物质。',
      ],
      check: {
        question: '一条核染色体复制完成，但姐妹染色单体尚未分离。假设无突变，下列哪项正确？',
        options: [
          '它含两条双链 DNA 分子，姐妹染色单体上相应基因的序列相同。',
          '它含一条 DNA，其两条单链分别就是两条姐妹染色单体。',
          '它新增了一套完全不同的基因种类。',
          '它不再包含任何非编码 DNA。',
        ],
        answerIndex: 0,
        explanation:
          '选 A。每条姐妹染色单体含一条双链 DNA；复制提供的是原有信息的副本。**姐妹染色单体是两份 DNA 的组织结构，双链则是一份 DNA 分子本身的结构**。复制也不会自动删掉非编码部分。',
      },
      examFocus: {
        goal: '弄清遗传信息的存放层级，分开“信息种类”与“复制份数”。',
        comparison: {
          title: '同一套遗传信息的不同层级',
          columns: ['名称', '含义', '不要混同'],
          rows: [
            ['核苷酸', '组成 DNA 的基本单位', '不是一个完整基因'],
            ['DNA', '由核苷酸连接而成的分子', '不等于蛋白质'],
            ['基因', 'DNA 上具有特定作用的片段', '一条染色体不止一个基因'],
            ['核染色体', 'DNA 与蛋白质组成的结构', '复制前后 DNA 份数可不同'],
            ['基因组', '全套遗传物质', '不只包括编码蛋白质的序列'],
          ],
        },
        examples: genomeExamples,
        checklist: [
          '基因组为什么包括非编码 DNA？',
          '姐妹染色单体与 DNA 的两条链有什么区别？',
          '染色体数相同，能否保证基因序列完全相同？',
        ],
      },
    }),
    dnaSection({
      code: '150502',
      title: 'DNA 结构与碱基配对',
      summary: dnaMethods['150502'].summary,
      paragraphs: [dnaMethods['150502'].intro],
      memory: dnaMethods['150502'].memory,
      rules: dnaMethods['150502'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '把 200 bp 当成两链合计 200 个核苷酸。',
        '把 A=T 的双链规律套用到任意单链。',
        '忽略互补链方向，或把互补误写成原序列的直接复制。',
      ],
      check: {
        question: '某双链 DNA 两条链合计有 600 个核苷酸，其中 G 占 20%。它含多少对碱基，多少个 A？',
        options: ['600 对；120 个 A', '300 对；120 个 A', '300 对；180 个 A', '600 对；180 个 A'],
        answerIndex: 2,
        explanation:
          '选 C。600 个核苷酸对应 300 对碱基。G=20%，C 也为 20%，剩余 A+T=60%，所以 A=30%×600=180。**碱基对数除以 2，而 A 的比例乘的是双链总核苷酸数 600**。',
      },
      examFocus: {
        goal: '从结构出发理解配对规律，并始终标清数量的统计范围。',
        comparison: {
          title: '同一条 DNA 的三种计数',
          columns: ['题目给出的对象', '可用关系', '适用边界'],
          rows: [
            ['双链整体', 'A=T；G=C', '不要求四种碱基各占 25%'],
            ['某一条单链', '按 A↔T、G↔C 推出互补链', '单链内部不必 A=T'],
            ['n 对碱基', '总共 2n 个核苷酸', '每条链各 n 个'],
            ['两条序列组成比例相同', '碱基总数可以相同', '排列及遗传信息仍可不同'],
          ],
        },
        examples: structureExamples,
        checklist: [
          '题目的数字属于单链还是双链整体？',
          '一个碱基对对应几个核苷酸？',
          '同样比例为什么不保证同样序列？',
        ],
      },
    }),
    dnaSection({
      code: '150503',
      title: '蛋白质合成与三联体信息',
      summary: dnaMethods['150503'].summary,
      paragraphs: [dnaMethods['150503'].intro],
      memory: dnaMethods['150503'].memory,
      rules: dnaMethods['150503'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '把终止密码子也算成一个氨基酸，或把起始密码子也减掉。',
        '把整条双链 DNA 的总核苷酸直接除以 3。',
        '认为所有蛋白质都只有一条多肽，或认为 DNA 改变一定使蛋白质形状改变。',
      ],
      check: {
        question:
          '一段双链 DNA 的每条链都有 180 个核苷酸。这一段完整对应 60 个编码氨基酸的三联体，不含终止信号或其他非编码部分。它直接编码的一条多肽有多少个氨基酸？',
        options: ['30', '60', '120', '180'],
        answerIndex: 1,
        explanation:
          '选 B。每条链有 180 个核苷酸，按同一条链的信息每三个一组，是 180÷3=60。两条 DNA 链是互补的，**不能把 360 个总核苷酸当成连续编码 120 个氨基酸的序列**。',
      },
      examFocus: {
        goal: '理解遗传信息怎样决定蛋白质，并分清计数中的链数、三联体与终止信号。',
        comparison: {
          title: '信息与材料分别发生什么变化',
          columns: ['环节', '主要变化', '关键区分'],
          rows: [
            ['DNA → RNA', '相关基因的信息被转录', 'DNA 不是蛋白质的原料'],
            ['mRNA → 多肽', '核糖体按三联体连接氨基酸', '三个碱基通常对应一个氨基酸'],
            ['多肽 → 功能蛋白质', '折叠；部分蛋白质还需多条链组合', '多肽链数不一定为 1'],
            ['蛋白质 → 细胞功能', '例如催化、运输、受体识别', '功能与三维结构相关'],
          ],
        },
        examples: synthesisExamples,
        checklist: [
          '为何不能由双链总核苷酸数直接除以 3？',
          '终止密码子为何不增加氨基酸？',
          '氨基酸排列改变为什么可能影响蛋白质功能？',
        ],
      },
    }),
    dnaSection({
      code: '150504',
      title: '基因突变及其后果',
      summary: dnaMethods['150504'].summary,
      paragraphs: [dnaMethods['150504'].intro],
      memory: dnaMethods['150504'].memory,
      rules: dnaMethods['150504'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '把“无可见表型变化”误当成“没有突变”。',
        '认为任何碱基改变都会移码，或认为增加 3 个碱基一定无害。',
        '把体细胞的后代细胞与一个人的下一代子女混为一谈。',
      ],
      check: {
        question:
          '研究者发现某个体的一个基因有碱基替换，但对应蛋白质的氨基酸序列和检测到的功能均未改变。哪项判断最合理？',
        options: [
          '不算突变，因为表型没有改变。',
          '一定改变了染色体条数。',
          '仍属于 DNA 突变，但现有结果未显示该蛋白质序列或所测功能发生改变。',
          '一定会在下一代产生显著疾病。',
        ],
        answerIndex: 2,
        explanation:
          '选 C。突变由 DNA 序列是否变化来判断；本题已经检测到替换。氨基酸、所测功能和表型是后面的层级，不能据此否定突变，也不能凭空断言染色体数变化或下一代患病。**结论以已测出的变化为边界**。',
      },
      examFocus: {
        goal: '沿 DNA、蛋白质和表型逐层判断突变后果，保留“可能”与“一定”的区别。',
        comparison: {
          title: '几种变化能支持怎样的结论',
          columns: ['观察或变化', '可以说明', '不能直接保证'],
          rows: [
            ['碱基替换，仍编码同一氨基酸', 'DNA 已变，该位氨基酸未变', '所有层面的作用都一定为零'],
            ['替换后编码另一氨基酸', '氨基酸序列改变', '蛋白质一定完全失活'],
            ['提前出现终止密码子', '翻译提前结束', '个体一定死亡'],
            ['编码区插入 1 个碱基', '后续阅读框移位', '所有后续氨基酸都必然不同'],
            ['三联体边界插入 3 个碱基', '保留原序列后续分组', '蛋白质功能一定正常'],
          ],
        },
        examples: mutationExamples,
        checklist: [
          '突变的定义看 DNA 还是看外观？',
          '为什么不同 DNA 序列可以产生相同氨基酸序列？',
          '移码与功能丧失为什么不是完全相同的判断？',
        ],
      },
    }),
  ],
  sources: [
    {
      id: 'uat-spec-b5',
      title: 'UAT-UK ESAT Content Specification 2026/27 · B5',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '内部核对 B5.1–B5.4 范围；例题引用诊断题库真题，讲解与改条件变式为原创。',
    },
    {
      id: 'nhgri-genome',
      title: 'NHGRI · Genome',
      url: 'https://www.genome.gov/genetics-glossary/Genome',
      note: '核对基因组定义、核染色体与细胞器 DNA 的范围。',
    },
    {
      id: 'openstax-dna',
      title: 'OpenStax Biology 2e · DNA Structure and Sequencing',
      url: 'https://openstax.org/books/biology-2e/pages/14-2-dna-structure-and-sequencing',
      note: '核对核苷酸、互补链、双螺旋与方向关系。',
    },
    {
      id: 'openstax-protein',
      title: 'OpenStax Biology 2e · Ribosomes and Protein Synthesis',
      url: 'https://openstax.org/books/biology-2e/pages/15-5-ribosomes-and-protein-synthesis',
      note: '核对翻译、密码子、终止信号与多肽。',
    },
    {
      id: 'nhgri-mutations',
      title: 'NHGRI · Mutation',
      url: 'https://www.genome.gov/genetics-glossary/Mutation',
      note: '核对 DNA 序列变化、体细胞及生殖系突变的区别。',
    },
    {
      id: 'nhgri-frameshift',
      title: 'NHGRI · Frameshift Mutation',
      url: 'https://www.genome.gov/genetics-glossary/Frameshift-Mutation',
      note: '核对插入、缺失与三联体阅读框；图中序列为原创。',
    },
  ],
}
