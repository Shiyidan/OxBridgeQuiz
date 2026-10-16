// 试题库 ESAT 生物 DNA：连接遗传信息的储存、碱基配对、蛋白质合成与突变后果。
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'

const genomeExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '基因、DNA 与染色体，谁包含谁？',
    question:
      'A scientist studies an unreplicated chromosome in the nucleus of a plant cell. Which statement correctly describes its organisation?',
    options: [
      'It is a protein molecule containing many separate DNA bases but no genes.',
      'It contains a long DNA molecule associated with proteins, with many genes along the DNA.',
      'It is one gene, and each nucleotide within it is a chromosome.',
      'It contains only DNA that codes for proteins; all other DNA lies outside chromosomes.',
    ],
    answer: 'B：未复制的核染色体包含一条长 DNA 分子及相关蛋白质，DNA 上有许多基因。',
    steps: [
      '先从组成关系理解：染色体不是与 DNA 并列的另一种遗传物质，**DNA 是染色体的重要组成部分**，并与蛋白质结合。',
      '一条染色体上的 DNA 很长，包含许多基因以及其他序列。基因是一段 DNA，而核苷酸是构成 DNA 的小单位。',
      '因此 B 同时说对了材料和层级。题干特意给出 unreplicated（未复制），避免把复制后的两条姐妹染色单体当成一条 DNA 分子。',
    ],
    optionNotes: [
      'A：染色体包含 DNA，不能把它说成只有蛋白质；DNA 的碱基也不是零散堆在其中。',
      'B：DNA 与蛋白质组成染色体，一条 DNA 上可包含多个基因，层级正确。',
      'C：把染色体、基因和核苷酸的大小关系完全颠倒了。',
      'D：染色体 DNA 也包含不编码蛋白质的序列，这些序列仍属于遗传物质。',
    ],
    takeaway:
      '记住一条清楚的关系：**核苷酸组成 DNA；基因是 DNA 上的特定片段；核染色体由 DNA 与蛋白质组成**。',
    variant: {
      question:
        'The same chromosome has now replicated but its sister chromatids have not separated. How many double-stranded DNA molecules does this replicated chromosome contain?',
      answer: '2 条双链 DNA 分子，每条姐妹染色单体各含一条。',
      explanation:
        '复制得到两份 DNA，它们分别位于两条姐妹染色单体中。此时仍按一条复制后的染色体计数。**“双链 DNA”里的两条链，与“两条姐妹染色单体”不是一回事**：每条染色单体中的 DNA 本身就是双链。',
    },
  },
  {
    title: '只把编码蛋白质的部分测完，算完整基因组吗？',
    question:
      'An organism has DNA sequences that code for proteins and other DNA sequences that do not. Researchers determine every protein-coding sequence but leave the other DNA unexamined. Which conclusion is justified?',
    options: [
      'The entire genome has been determined because a genome contains only protein-coding sequences.',
      'The unexamined DNA cannot be part of a chromosome.',
      'The genome is incomplete because it includes both coding and non-coding DNA.',
      'The unexamined DNA must consist of amino acids rather than nucleotides.',
    ],
    answer: 'C：基因组包括全部遗传物质，不能只算编码蛋白质的部分。',
    steps: [
      'genome 的关键是“全套遗传物质”。题目已明确还有一部分 DNA 未被研究，所以完整性不能只靠已测出的基因数量判断。',
      '不编码蛋白质的 DNA 也属于基因组。其中一些序列参与调节基因表达，不能因为不编码就说它不属于 DNA 或没有作用。',
      '因此只能选 C。题目也没有提供染色体数量、全部基因数量或生物复杂程度的信息，不需要自行猜测。',
    ],
    optionNotes: [
      'A：把“全部 DNA”缩小成“编码蛋白质的 DNA”，漏掉题干明确提到的一部分。',
      'B：非编码序列可以位于染色体上，位置与是否编码蛋白质不是同一分类。',
      'C：保留了 genome 的完整范围，与题干信息一致。',
      'D：DNA 由核苷酸组成；氨基酸组成的是多肽。',
    ],
    takeaway:
      '==基因组不等于全部蛋白质编码片段的合集==。题目一旦出现 all、entire 或 complete，就检查有没有漏掉非编码部分。',
    variant: {
      question:
        'A bacterium has no membrane-bound nucleus but has a chromosome and a plasmid. Does the absence of a nucleus mean it has no genetic material?',
      answer: '不意味着。细菌的染色体与该细菌携带的质粒都含 DNA。',
      explanation:
        '细胞核是主要遗传物质在真核细胞中的存放位置，不是 DNA 存在的必要条件。**没有核膜包围的细胞核，不等于没有 DNA**；这里还已明确给出了染色体和质粒。',
    },
  },
]

const structureExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '先分清碱基对与核苷酸，再算数量',
    question:
      'A double-stranded DNA molecule contains 200 base pairs. Across both strands together, 120 of its bases are adenine. How many guanine bases does the molecule contain?',
    options: ['40', '80', '120', '160'],
    answer: 'B：80 个 G。',
    steps: [
      '200 base pairs 是 200 对，每对有两个碱基，因此两条链总共含 400 个碱基，也就是 400 个核苷酸。',
      '双链整体中 A 与 T 数量相等：A 有 120 个，所以 T 也有 120 个。剩下 G 与 C 共 400−120−120=160 个。',
      'G 与 C 也一一配对，所以各占一半：G=160÷2=80。**先明确统计范围，再用配对关系**，选 B。',
    ],
    optionNotes: [
      'A：通常来自把总数或剩余数多除了一次 2。',
      'B：总碱基 400，扣除 A 与 T 后剩 160，G 占其中一半。',
      'C：A=120 不代表 G=120；相等的是 A 与 T、G 与 C。',
      'D：160 是 G 与 C 的合计，不是 G 的单独数量。',
    ],
    takeaway:
      '双链 DNA 的 $n$ 对碱基，对应 **$2n$ 个碱基、$2n$ 个核苷酸**。A=T、G=C 的等量关系用于双链整体。',
    variant: {
      question:
        'In another double-stranded DNA molecule, 30% of all bases are adenine. What percentage are cytosine?',
      answer: '20%。',
      explanation:
        'T 也占 30%，A 与 T 合计 60%；剩下 40% 由 G 与 C 平分，因此 C 占 20%。百分比的分母是**两条链上的全部碱基**。',
    },
  },
  {
    title: '单独一条链，也一定 A 与 T 一样多吗？',
    question:
      'One strand of a DNA molecule contains 30 A, 20 T, 40 G and 10 C bases. What are the numbers of A and G bases in its complementary strand?',
    options: ['A = 30; G = 40', 'A = 20; G = 10', 'A = 20; G = 40', 'A = 50; G = 50'],
    answer: 'B：互补链有 20 个 A、10 个 G。',
    steps: [
      '原链的 T 要与互补链的 A 配对。因此互补链 A 的数量等于原链 T 的数量，是 20。',
      '原链的 C 要与互补链的 G 配对。因此互补链 G 的数量等于原链 C 的数量，是 10。',
      '不要直接复制原链的 A 与 G 数量，也不要在一条链里强行让 A=T。**互补的是对应位置上的碱基**，因此选 B。',
    ],
    optionNotes: [
      'A：直接抄了原链的 A、G 数量，没有作互补配对。',
      'B：原链 T 对应新链 A，原链 C 对应新链 G，正确。',
      'C：A 换对了，G 却仍用了原链 G 的数量。',
      'D：这是双链整体的 A 与 G 数量，题目只问互补链。',
    ],
    takeaway:
      '单链数据先逐项互补：**原链 A→对链 T，原链 T→对链 A，原链 G→对链 C，原链 C→对链 G**。不要把双链整体规律套进任意单链。',
    variant: {
      question:
        'Only one isolated single-stranded DNA molecule is available. Adenine makes up 30% of its bases. Can the thymine percentage be determined from this information alone?',
      answer: '不能确定。',
      explanation:
        '题目只给了单链的 A 比例，没有给它与另一条链的配对数据。单链自身的 A 与 T 数量不必相等，因此 T 不一定是 30%。**条件从双链改成单链，原来的等量结论就不能照搬**。',
    },
  },
]

const synthesisExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '三个碱基一个单位，哪些三联体不增加氨基酸？',
    question:
      'A mature mRNA has a translated region of 303 nucleotides, measured from the first base of its start codon to the last base of its stop codon. There are no internal stop codons. The stop codon does not specify an amino acid. How many amino acids are in the newly made polypeptide?',
    options: ['99', '100', '101', '303'],
    answer: 'B：100 个氨基酸。',
    steps: [
      '这里给的是从起始到终止的成熟 mRNA 区段，没有要求把整条基因或非编码区算进去。每三个碱基组成一个密码子，因此 303÷3=101 个密码子。',
      '题干明确提醒终止密码子不指定氨基酸，所以要从 101 中减去 1，得到 100。起始密码子本身指定氨基酸，不能再减一次。',
      '因此选 B。题目问刚合成的多肽，避免后续加工可能切除部分氨基酸带来的变化。',
    ],
    optionNotes: [
      'A：把起始与终止都减去了；起始密码子也编码一个氨基酸。',
      'B：101 个密码子中，只有最后一个是这里给定的终止信号，故为 100。',
      'C：把终止密码子也当成了一个氨基酸。',
      'D：把一个碱基当成一个氨基酸，忘记三联体关系。',
    ],
    takeaway:
      '先看给的是**实际被翻译的序列、完整基因，还是双链总碱基数**。只有明确了范围，才能用“每三个碱基”换算；终止信号不贡献氨基酸。',
    variant: {
      question:
        'Two identical newly made polypeptides assemble into one functional protein. Each is translated from a region of 306 nucleotides, including one stop codon and no internal stops. Before any processing, how many amino acids are present in the protein in total?',
      answer: '202 个。',
      explanation:
        '每条多肽有 306÷3−1=101 个氨基酸，两条合起来是 202。**一个功能蛋白质可以由不止一条多肽组成**，所以最后还要看题目问“一条链”还是“整个蛋白质”。',
    },
  },
  {
    title: '一样的原料数量，不一定得到一样的蛋白质',
    question:
      'Polypeptides P and Q contain the same numbers of each type of amino acid, but the amino acids occur in different orders. Which statement is most accurate?',
    options: [
      'P and Q must have identical three-dimensional shapes because their amino acid totals match.',
      'P and Q may fold differently and have different functions because their amino acid sequences differ.',
      'P and Q must contain different types of DNA nucleotide as their building blocks.',
      'P and Q cannot be proteins unless each contains only one type of amino acid.',
    ],
    answer: 'B：氨基酸顺序不同，可能改变折叠方式及功能。',
    steps: [
      'same numbers 只说明组成数量相同，different orders 则明确顺序不同。蛋白质的性质不仅取决于“有哪些氨基酸”，也取决于“按什么顺序连接”。',
      '不同位置上的氨基酸基团相互作用，影响多肽折叠。因此两条链可能形成不同的三维结构，并表现出不同功能。',
      '选 B 的 may 很重要：题目没有给出实际结构或功能测量，不能把“可能改变”说成“一定完全失去功能”。',
    ],
    optionNotes: [
      'A：相同组成数量不保证相同排列，不能据此保证形状相同。',
      'B：把顺序、折叠和功能联系起来，并保留了合理的可能性。',
      'C：多肽的直接组成单位是氨基酸，不是 DNA 核苷酸。',
      'D：多肽通常包含多种氨基酸；同一种氨基酸也不是什么必要条件。',
    ],
    takeaway:
      '==碱基顺序 → 氨基酸顺序 → 折叠与三维形状 → 功能==。解释基因如何影响性状时，把中间的蛋白质补上，不要只说“基因控制一切”。',
    variant: {
      question:
        'Two DNA sequences differ at one base, but the polypeptides produced have the same amino acid sequence. Under the same conditions, does the DNA difference alone prove that the proteins have different shapes?',
      answer: '不能。仅有 DNA 差异不足以证明蛋白质形状不同。',
      explanation:
        '多个密码子可以指定同一种氨基酸，因此有些碱基改变不改变氨基酸序列。本题已经明确序列相同，不能跳过这个条件，直接断定结构改变。实际蛋白质还受折叠环境与加工等影响，但这里没有给出这些差异。',
    },
  },
]

const mutationExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '碱基已经改变，为什么氨基酸还能相同？',
    question:
      'For the mRNA codons used here, GAA and GAG specify glutamate, GUA specifies valine, and UAA is a stop signal. A substitution changes one DNA coding-strand triplet from GAA to GAG. The mRNA matches the coding strand except that U replaces T. What follows directly?',
    options: [
      'No mutation has occurred because glutamate is still specified.',
      'A mutation has occurred, but the amino acid at this position remains glutamate.',
      'A mutation has occurred and must change glutamate to valine.',
      'A mutation has occurred and must shift every subsequent reading group by one base.',
    ],
    answer: 'B：DNA 序列发生了突变，但该位置仍编码谷氨酸。',
    steps: [
      '突变的判断依据是 DNA 序列是否改变。GAA 变成 GAG，最后一个碱基已经改变，所以确实发生了突变。',
      '再用题目给出的密码子信息检查蛋白质：转录后的 GAA 与 GAG 都指定谷氨酸，因此该位置氨基酸不变。',
      '这里是一个碱基被替换，序列长度没有增减，不能据此声称阅读框整体移动。选 B，区分**序列改变**与**功能改变**。',
    ],
    optionNotes: [
      'A：氨基酸没变不代表 DNA 没变；这两层判断必须分开。',
      'B：同时承认 DNA 突变和氨基酸未变，符合给出的表。',
      'C：题干说的是 GAG，不是指定缬氨酸的 GUA。',
      'D：替换没有插入或删除核苷酸，不会因为这次替换而使阅读框整体移位。',
    ],
    takeaway:
      '先问“DNA 变没变”，再问“氨基酸变没变”，最后才问“功能与性状变没变”。==这三个问题的答案可以不同==。',
    variant: {
      question:
        'Instead, the DNA coding triplet changes from GAA to TAA. Using the same codon information, what happens if this triplet lies within the translated region before the original stop?',
      answer: '对应 mRNA 由 GAA 变成 UAA，出现提前终止，产生较短的多肽。',
      explanation:
        'coding strand（编码链）中的 T 在对应 mRNA 中写作 U，因此 TAA 对应 UAA。题目已规定 UAA 是终止信号，且位置在原终止之前，所以翻译提前结束。较短多肽可能影响功能，但**不能只凭长度改变就断言一定致死**。',
    },
  },
  {
    title: '插入一个碱基，与插入三个碱基有何区别？',
    question:
      'A coding sequence is read in consecutive groups of three bases from a fixed start. Within this sequence, mutation X inserts one base and mutation Y inserts three bases at a boundary between two groups. No other changes occur. Which statement is correct?',
    options: [
      'Both insertions necessarily leave every later group unchanged.',
      'X changes the grouping downstream; Y preserves the grouping of the original downstream sequence.',
      'Y changes the downstream reading frame, but X cannot do so.',
      'Neither event is a mutation because none of the original bases has been replaced.',
    ],
    answer: 'B：插入 1 个碱基使后续阅读框移位；在三联体边界插入 3 个碱基保留原下游分组。',
    steps: [
      '假设原来按 ABC｜DEF｜GHI 分组。在第一组之后插入一个 X，就变成 ABC｜XDE｜FGH｜I…，后面的分组从插入处开始发生变化。',
      '如果在同一边界插入 XYZ，序列是 ABC｜XYZ｜DEF｜GHI。多了一组，但原来的 DEF 和 GHI 仍各自成组。',
      '所以 B 正确。保留阅读框不等于蛋白质完全不受影响：新增密码子可能编码氨基酸，也可能是终止信号；这里只能判断分组变化。',
    ],
    optionNotes: [
      'A：一个碱基的插入改变后续按三分组的位置，不能说两者都无影响。',
      'B：抓住了插入数是否为 3 的倍数，以及题目给出的三联体边界。',
      'C：恰好把两种插入的后果颠倒了。',
      'D：突变也包括插入与缺失，不只有替换。',
    ],
    takeaway:
      '先按题目指定的起点每三个一组，再看增减的碱基数。**保留阅读框，只说明后续原有分组不移位，不保证功能正常**。',
    variant: {
      question:
        'In a human, a mutation occurs only in a skin cell and its descendants. The egg and sperm cells do not carry it. Is that mutation expected to be passed to a child by sexual reproduction?',
      answer: '通常不会通过这次有性生殖传给孩子。',
      explanation:
        '题目把突变限定在皮肤体细胞及其后代中，并明确配子没有携带它。皮肤细胞的突变可以传给其有丝分裂产生的子细胞，却不会因此自动进入精子或卵。**传给子细胞与传给下一代个体，是不同的传播路径**。',
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
      summary: '把全套遗传物质、染色体、DNA 与基因的关系放在同一张图中理解。',
      paragraphs: [
        '想象你要保存一整套生物的遗传信息：DNA 是记录这些信息的分子，核染色体把长 DNA 与蛋白质组织在一起，基因则是 DNA 上具有特定作用的片段。**基因组 genome 强调的是全部遗传物质**，不能只挑正在表达或编码蛋白质的部分来算。',
        '这里的层级不是“越大就越重要”。一条染色体上可以有许多基因，而一个性状也可能受到多个基因和环境共同影响。后面比较 DNA 数量、基因数与性状数时，不能在它们之间建立简单的一一对应。',
      ],
      rules: [
        {
          title: '基因组的完整范围',
          text: '基因组 genome 是生物的全套遗传物质。它包括蛋白质编码序列和非编码序列；**没有参与某一时刻的蛋白质合成，也仍然属于基因组**。一些非编码序列参与调控，并不能统称为没有作用。',
        },
        {
          title: '染色体是 DNA 的组织形式',
          text: '真核细胞核的染色体含长 DNA 分子和相关蛋白质。DNA 不一定时时呈现显微图里的 X 形：未分裂时通常较松散，分裂时可高度凝缩。**看不见独立染色体，不等于核内没有 DNA**。',
        },
        {
          title: '一条染色体可以有许多基因',
          text: '基因 gene 是 DNA 上的特定片段；在本章蛋白质合成的情境中，关注编码多肽的基因。一个核苷酸不是一个基因，一条染色体也不是一个基因。染色体上还有基因以外的 DNA 序列。',
        },
        {
          title: '复制改变份数，不是创造一套新基因',
          text: '未复制的核染色体通常包含一条双链 DNA 分子；复制后、姐妹染色单体尚未分离时，每条姐妹染色单体各含一条双链 DNA。无复制错误时，它们的序列相同。**DNA 份数加倍，不代表不同基因的种类加倍**。',
        },
        {
          title: 'DNA 不只存在于真核细胞核',
          text: '真核细胞的大部分 DNA 位于细胞核内，线粒体以及植物叶绿体也有自己的 DNA。细菌虽然无核膜包围的细胞核，仍有染色体 DNA，部分还携带质粒。==“主要在核内”不能换成“只能在核内”==。',
        },
        {
          title: 'DNA 多，不直接等于基因多或生物复杂',
          text: '比较两种生物时，DNA 总长度、染色体条数、基因数量是不同指标。非编码部分的多少也可能不同，不能只凭染色体数更多，就认定它的基因更多或结构更复杂。',
        },
      ],
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
      summary: '用核苷酸组成和互补配对，解释双螺旋及碱基数量关系。',
      paragraphs: [
        'DNA 看起来像扭转的梯子，但这幅图不只是外形。两侧由糖和磷酸交替连接，中央的碱基按 A—T、G—C 配对；每一侧本身都是一条核苷酸长链。**信息主要体现在碱基的排列顺序中，而不是糖和磷酸的种类中**。',
        '算数量时，先问清题目说的是一条单链、整条双链分子，还是碱基对。许多看似不同的题，都是在考你有没有把这三个统计范围区分开。',
      ],
      rules: [
        {
          title: '一个核苷酸有三个部分',
          text: 'DNA 核苷酸 nucleotide 含一个脱氧核糖、一个磷酸基团和一个含氮碱基。四种核苷酸的糖与磷酸相同，主要区别在碱基：A、T、G、C。**碱基只是核苷酸的一部分**，不能把两个词当成完全同义。',
        },
        {
          title: '单链本身也是聚合物',
          text: '许多核苷酸首尾连接形成一条 DNA 单链，单链 DNA（ssDNA）本身就属于聚合物。连接的糖与磷酸形成主链；碱基从糖这一部分向侧面伸出，不是替代糖磷酸主链。',
        },
        {
          title: '两条互补链形成双螺旋',
          text: '双链 DNA（dsDNA）由两条互补链组成，整体呈双螺旋。两条链方向相反；图上标出的 5′、3′ 用来区分方向。看互补序列时，应先对齐对应位置；若题目还要求统一书写方向，要再检查是否需要反向书写。',
        },
        {
          title: 'A 配 T，G 配 C',
          text: '腺嘌呤 A 与胸腺嘧啶 T 配对，鸟嘌呤 G 与胞嘧啶 C 配对。两链之间的碱基通过氢键联系；链内主链的连接不同。**“互补”不是“相同”**，已知一条链可按配对关系推出另一条。',
        },
        {
          title: '双链整体的数量关系',
          text: '在正常互补双链整体中，A 数=T 数，G 数=C 数，因此 A+G=T+C。若 A 占全部碱基的 30%，T 也占 30%，G 与 C 就各占 20%。==这不是任意单链内部必然成立的关系==。',
        },
        {
          title: '碱基对、碱基与核苷酸',
          text: '$n$ 对碱基意味着两链合计有 $2n$ 个碱基，对应 $2n$ 个核苷酸。每条链有 $n$ 个核苷酸。碱基对用 bp 表示；若题目说的是“总核苷酸数”，不能再不加区分地乘 2。',
        },
        {
          title: '数量相同，顺序仍可不同',
          text: '两段 DNA 即使长度与 A、T、G、C 的总数完全相同，排列也可能不同，所含信息未必相同。**组成比例不能替代具体碱基序列**。例如 ATGC 与 AGTC 的组成相同，顺序却不同。',
        },
      ],
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
      summary: '连接 DNA 碱基顺序、氨基酸顺序、蛋白质形状与功能。',
      paragraphs: [
        'DNA 中保存的信息，需要通过制造蛋白质才能影响许多细胞活动。可以把这条关系读成一句话：**基因的碱基顺序决定多肽的氨基酸顺序，氨基酸顺序影响折叠后的形状，形状又与功能密切相关**。因此基因与性状之间不是凭空跳过去的，中间有可以解释的过程。',
        '图解用转录和翻译帮助你看清信息怎样传递：在典型真核细胞中，相关 DNA 信息先转录为 RNA，成熟 mRNA 再在核糖体上被翻译。备考重点是理解这条关系和三联体计数，不必为本节死背完整密码子表；遇到具体序列判断，使用题目给出的信息。',
      ],
      rules: [
        {
          title: '多肽的组成单位是氨基酸',
          text: '蛋白质合成将氨基酸按一定顺序连接成多肽 polypeptide。DNA 的组成单位是核苷酸，蛋白质的组成单位是氨基酸。**不是把 DNA 的碱基直接变成氨基酸**，而是按照遗传信息组装已有原料。',
        },
        {
          title: '一个蛋白质可有一条或多条多肽',
          text: '多肽折叠后可以形成功能蛋白质；有的蛋白质还需要多条多肽组合。题目问“一条链的氨基酸数”与“整个蛋白质的氨基酸总数”时，答案可能不同，应检查链的条数。',
        },
        {
          title: '顺序决定折叠的重要基础',
          text: '氨基酸侧链之间的相互作用使多肽形成特定三维结构。氨基酸顺序改变，可能改变折叠或活性部位，进而影响功能。**相同的氨基酸总数甚至相同组成比例，都不保证顺序和形状相同**。',
        },
        {
          title: 'DNA 中的信息经 RNA 到达核糖体',
          text: '典型真核细胞的核基因先在核内转录形成 RNA，经过所需加工的 mRNA 可离开细胞核，在核糖体上指导翻译。DNA 通常留在核内；**离开核的“信息副本”不等于整条染色体离开核**。细菌没有这样的核膜分隔。',
        },
        {
          title: '三个碱基组成一个阅读单位',
          text: '蛋白质编码序列按连续三联体读取；mRNA 上的三联体称密码子 codon。通常一个编码氨基酸的密码子对应一个氨基酸，但不同密码子可指定同一种氨基酸。**终止密码子是结束信号，不指定氨基酸**。',
        },
        {
          title: '计数前先限定有效序列',
          text: '若给出的是一条链上编码 $n$ 个氨基酸的碱基数，且不计终止密码子，需要 $3n$ 个碱基；对应双链片段有 $6n$ 个核苷酸。完整基因可能还含非翻译部分，不能对任意整段 DNA 都直接除以 3。',
        },
        {
          title: '编码链与模板链不要混用',
          text: 'mRNA 与 DNA 模板链按互补规则形成；与对应的 DNA 编码链相比，mRNA 以 U 代替 T。题目若标明 coding strand 或 template strand，应先分清是哪一条。**RNA 中 A 配 U，不能把 DNA 的 A—T 原样套用到 RNA 配对**。',
        },
      ],
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
      summary: '区分 DNA 序列改变、蛋白质改变与表型改变，并理解三者为何不总是同时发生。',
      paragraphs: [
        '突变 mutation 指 DNA 的核苷酸序列发生改变。这个定义只回答“遗传信息有没有变”，并没有自动回答“生物会不会表现出变化”。**多数突变对表型没有影响；有些影响较小，少数可能产生显著影响**。看到 mutation，不要立刻把它等同于有害、致死或肉眼可见。',
        '理解后果时，可以顺着已经学过的关系往下走：变的是哪一段 DNA，是否影响氨基酸或蛋白质产生的数量，这种改变是否影响功能，最终是否影响表型。下面的替换、插入和缺失，是帮助你分析给定序列的具体例子。',
      ],
      rules: [
        {
          title: '突变是序列改变',
          text: '替换一个碱基、插入碱基或删除碱基，都可能改变 DNA 序列。突变可由复制错误等原因产生，某些辐射或化学因素能提高发生概率。**生物需要某种性状，不意味着它会按需要产生指定的突变**。',
        },
        {
          title: 'DNA 改变不一定改变氨基酸',
          text: '不同密码子可指定同一种氨基酸，因此一次碱基替换可能不改变对应氨基酸。还有突变位于不编码蛋白质的区域。**氨基酸相同不能反过来证明 DNA 完全相同**。',
        },
        {
          title: '氨基酸改变也不一定明显改变功能',
          text: '改变的位置与替换后的氨基酸性质都会影响后果。有的替换不明显影响蛋白质功能，有的改变活性部位、稳定性或折叠；不能只凭“变了一个”判断一定无害或一定有害。',
        },
        {
          title: '提前终止可能使多肽变短',
          text: '若编码区内的变化产生提前终止密码子，翻译会更早结束，可能形成较短多肽或影响蛋白质产量。**较短不等于必然致死**，仍需看具体蛋白质与细胞、个体的影响。',
        },
        {
          title: '插入或缺失可能改变阅读框',
          text: '在被翻译区段内，插入或删除的碱基数不是 3 的倍数时，会使后续按三分组的阅读框移位。增减 3 的倍数通常保留其后原序列的阅读框，但仍可能改变部分氨基酸或产生终止信号。**保留阅读框不保证功能不变**。',
        },
        {
          title: '表型影响有不同程度',
          text: '有的突变不改变氨基酸，有的改变对功能影响很小，或其作用受到其他基因和环境影响；也有突变显著影响表型。非编码序列中的调控变化还可能改变蛋白质的表达量。==“不编码蛋白质”不能推成“突变一定无效”==。',
        },
        {
          title: '遗传给子细胞与遗传给后代个体',
          text: '突变可以随有丝分裂传给后代细胞。对于人的有性生殖，能否传给孩子要看配子是否携带；只发生在皮肤等体细胞且未进入生殖系的突变，通常不会传给孩子。**有遗传物质的变化，不代表一定在家系中代代相传**。',
        },
      ],
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
      note: '内部核对 B5.1–B5.4 范围；讲解、例题与变式为原创。',
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
