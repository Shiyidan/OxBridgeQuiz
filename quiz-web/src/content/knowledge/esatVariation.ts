// ESAT 生物变异讲义：以诊断真题讲解变异来源和自然选择，配套原创变式及群体图解。
import type { KnowledgeExamFocus, KnowledgeLesson } from './types'
import { variationMethods } from './variationMethods'

const selectionExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '慈鲷的口型与食性：自然选择怎样发生？',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2022_NSAA_Q068',
      why: '用同一祖先演化出的不同鱼类，练习把图中的结构、食物和进化解释联系起来。',
    },
    answer: 'G：只有陈述 2 和 3 正确。',
    steps: [
      '先看图，不需要记住鱼的拉丁学名。注意它们的口部等结构和所吃食物不同：有的吃昆虫，有的吃其他鱼，有的吃软体动物。题目要你解释这些适应性差异怎样形成。',
      '陈述 1 把“存在不同食物”直接当作祖先 DNA 发生相应突变的原因，这个解释不成立。**食物能够形成选择压力，但不能因为鱼需要某种口型，就按需要产生对应突变**。这里也没有证据说明这些食物具有致突变作用。',
      '陈述 2 正确。影响这些性状的基因存在不同等位基因，群体就可能具有可遗传的差异。不同个体不是一开始都完全一样，自然选择才有差异可以作用。',
      '陈述 3 正确。适合某种食物或环境的表现型，可能使个体更容易获得食物、存活并留下后代。经过许多代，相应遗传特征在该环境中的群体里就可能更常见。',
      '把三个判断连起来：**可遗传差异提供材料，环境影响繁殖成功，群体随世代改变**。不要把顺序写成“先需要，再定向突变”。',
    ],
    optionNotes: [
      'A：把三个陈述全否定，漏掉可遗传差异和环境选择这两个关键条件。',
      'B：只保留陈述 1，反而选中了错误的突变因果解释。',
      'C：陈述 2 正确，但陈述 3 所说的环境选择也成立。',
      'D：陈述 3 正确，但不能漏掉陈述 2 中的遗传变异基础。',
      'E：包含错误的陈述 1，并漏掉正确的陈述 3。',
      'F：包含错误的陈述 1，并漏掉正确的陈述 2。',
      'G：恰好保留正确的陈述 2 和 3。',
      'H：多选了陈述 1；不同食物不是相应突变按需发生的证据。',
    ],
    takeaway:
      '解释适应性进化时，先说群体具有**可遗传差异**，再说环境怎样影响**相对繁殖成功**。结构与食物相配，不代表食物主动“制造”了这种结构的基因。',
    variant: {
      question:
        'Two groups of cichlid fish develop different feeding structures while living in different parts of a lake. When brought together, they interbreed freely and produce fertile offspring. Does the difference in feeding structures alone establish that they are separate species under the biological species concept? Explain.',
      answer: '不能。结构不同不足以证明它们已经成为不同物种。',
      explanation:
        '这道变式把问题从“怎样形成适应性差异”改成“是否已经形成新物种”。同种群体之间也可以有明显差异；题目又明确说它们能够自由交配并产生可育后代，因此没有提供生殖隔离的证据。**出现适应性差异与形成新物种，需要的证据不同**。',
    },
  },
  {
    title: '疟疾与镰状细胞贫血：优势取决于什么？',
    question: '',
    source: {
      questionCode: 'ESAT-2020-BIOLOGY-009',
      why: '从三种基因型的表现表格出发，比较不同环境中的选择，并检查结论是否说得过于绝对。',
    },
    answer: 'B：只有陈述 1 正确。',
    steps: [
      '先把表格完整读一遍：MM 不表现镰状细胞贫血，但可感染疟疾；Mm 不表现该贫血，并有疟疾抗性；mm 的疟疾抗性更强，却表现镰状细胞贫血。**不能只看一列的抗性高低，就认定整体生存和繁殖表现一定更好**。',
      '陈述 1 正确。在没有疟疾的地区，m 带来的抗疟优势不再起作用，而 mm 仍有镰状细胞贫血的风险。因此，在题目讨论的选择作用下，携带 m 的人数倾向较少。这是趋势判断，不是说 m 会立即消失，也不是每个携带者都会患病。',
      '陈述 2 错在 only。两种疾病都“可能致死”，不等于 MM 和 mm 的所有人都一定在繁殖前死亡。杂合子可能有相对优势，但不能推出只有杂合子能把等位基因传给下一代。',
      '陈述 3 把疟疾的选择作用误写成定向产生 m 的原因。相关变异并不是为了抵抗疟疾才按需出现；疟疾改变的是不同基因型的相对存活与繁殖机会。',
    ],
    optionNotes: [
      'A：漏掉了陈述 1 所描述的无疟疾环境中的选择趋势。',
      'B：只保留陈述 1，符合表格和题目措辞。',
      'C：陈述 2 中“只有杂合子能繁殖”的结论过于绝对。',
      'D：陈述 3 把选择压力当成了有利突变按需发生的原因。',
      'E：虽然保留了陈述 1，但多选了陈述 2。',
      'F：虽然保留了陈述 1，但多选了陈述 3。',
      'G：同时选择两个错误陈述，并漏掉陈述 1。',
      'H：把“相对优势”误扩展成“只有它能繁殖”，又接受了错误的突变因果解释。',
    ],
    takeaway:
      '**优势要结合环境和整个生存、繁殖过程判断**。抗一种病更强，不一定总体更有利；“可能致死”也不能改写成“全部无法繁殖”。',
    variant: {
      question:
        'Malaria is eliminated from a large, randomly mating population in which both M and m are present. Assume there is no migration or new mutation, MM and Mm have equal reproductive success, and mm has lower reproductive success. Is the frequency of m expected to fall over generations? Must m disappear in the next generation?',
      answer: 'm 的频率预计会随世代下降，但不必在下一代消失。',
      explanation:
        'mm 的相对繁殖成功较低，使选择倾向于减少 m。不过 m 也存在于能正常繁殖的 Mm 中，这些携带者仍能将它传给后代。**选择造成的频率变化，与一代之内完全清除某个等位基因，是两回事**。',
    },
  },
]

const sourceExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '克隆植物的生长实验：相同结果能怎样解释？',
    question: '',
    source: {
      questionCode: 'NSAA_2019_S1-Q070',
      why: '把克隆、控制变量和柱状图放在同一道实验题里，练习判断哪些解释仍然可能成立。',
    },
    answer: 'H：陈述 1、2、3 都可能解释结果。',
    steps: [
      '先整理实验：20 株来自同一植物的克隆，初始高度相同，每组 5 株，生长时间都是六个月。温度是组间改变的条件；土壤质量、养分、浇水量和光照强度被控制。**克隆控制了遗传差异，并没有让基因对生长失去作用**。',
      '陈述 1 可以成立。盆 1 与盆 2 的平均高度不同，而温度不同属于环境差异，所以环境可以解释这种差异。题目问 could，不需要把温度宣称为已被证明的唯一原因。',
      '陈述 2 也可以成立。盆 3 与盆 4 的温度不同、平均高度却相等，可能是另一个环境因素限制了两组生长。**被保持相同的因素仍可能成为共同的限制**；例如相同但不足的资源供应，可以使继续升温不再增加最终高度。',
      '陈述 3 同样可以成立。它们共享基因型，可能具有相同的生长潜力或反应上限；在盆 3 与盆 4 的条件下，都可能接近这一限制。因此，基因型也可以解释为什么最终平均高度相同。',
      '这里不必在 2 和 3 之间二选一。题目问的是哪些解释“可能”，现有实验并未进一步区分共同的环境限制和遗传限制，三个陈述都可保留。**可能解释不等于实验已经证明的原因**。',
    ],
    optionNotes: [
      'A：全部排除，没有承认环境和共同基因型都可能影响结果。',
      'B：只接受温度对盆 1、2 的可能影响，漏掉盆 3、4 结果的两种可能解释。',
      'C：接受其他环境因素，却漏掉温度影响和共同基因型的可能作用。',
      'D：只接受基因型，忽略环境条件也会影响克隆的表现。',
      'E：漏掉陈述 3；克隆共享基因型，不代表基因型不能解释相同的生长表现。',
      'F：漏掉陈述 2；某个环境因素被控制为相同值，也仍可能限制两组生长。',
      'G：漏掉陈述 1；温度差异本来就是环境差异。',
      'H：保留所有仍与实验相容的可能解释，没有把其中一种说成唯一结论。',
    ],
    takeaway:
      '读实验题时，分清**变量被控制、变量不起作用、原因已被证明**这三件事。相同基因型仍影响生长，相同环境因素也仍可能限制生长。',
    variant: {
      question:
        'The experiment is changed so that plant line A is grown only at 15 degrees Celsius and genetically different line B only at 25 degrees Celsius. Their mean heights differ after six months. Can this comparison alone separate the effects of genotype and temperature? Describe a better comparison.',
      answer: '不能；应把 A、B 两条品系都分别放在两个温度下培养。',
      explanation:
        '原真题用克隆尽量保持遗传背景相同；变式却同时改变了遗传背景和温度，差异便无法单独归给其中一项。把两条品系都放在两个温度下，再控制其余条件并设置足够重复，就能比较同品系的温度影响，以及同温度下的品系差异。',
    },
  },
  {
    title: '身高累计频数图：读出的是什么，解释又是什么？',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2022_NSAA_Q065',
      why: '同时练习累计频数图的统计量识别，以及连续性状中遗传、环境解释的证据范围。',
    },
    answer: 'D：只有陈述 3 正确。',
    steps: [
      '先看纵轴：两组累计频数都到 25，表示各有 25 人。累计频数 12.5 位于总数的一半，在这种累计频数图上用于估计中位数位置。**在这里读出的身高不是算术平均数 mean**，所以陈述 1 不成立。',
      '陈述 2 说男性之间的身高差异完全由环境解释，alone 把话说过头了。同一性别的人也有遗传差异，身高通常受到多个基因及营养等环境因素共同影响；图上的连续分布没有排除遗传因素。',
      '陈述 3 只说 could。Y 染色体上的基因可以通过影响性别发育及相关激素，间接参与两组身高分布的差异，因此这是一种可能的解释。**这并不表示身高只由 Y 染色体决定，也不表示图已经找到了某个具体致因基因**。',
      '最后分开两种判断：图告诉我们样本身高怎样分布；生物学知识帮助判断哪些成因可能成立。不能把曲线分开这一现象，直接当成某种遗传机制已经被证明。',
    ],
    optionNotes: [
      'A：陈述 3 提出的是可能解释，不能把它一并排除。',
      'B：把累计频数中点读出的中位数误称为平均数。',
      'C：把男性之间的身高差异全部归给环境，忽略遗传差异。',
      'D：仅陈述 3 与题目所要求的“可能”解释相符。',
      'E：同时接受了统计量混淆和“仅环境造成”的错误解释。',
      'F：虽然保留陈述 3，却多选了错误的陈述 1。',
      'G：虽然保留陈述 3，却多选了错误的陈述 2。',
      'H：陈述 1、2 都不能成立，不能全选。',
    ],
    takeaway:
      '**分布形式、统计量和变异成因要分别判断**。累计频数一半处用于估计中位数；连续变异不等于纯环境作用；“可能参与”不等于“唯一决定”。',
    variant: {
      question:
        'For a new sample of 40 students, a height is read from a cumulative-frequency curve at a cumulative frequency of 20. Which measure of central tendency is being estimated? Does the continuous distribution of heights show that environmental factors alone caused the variation?',
      answer: '估计的是中位数；连续分布不能证明变异只来自环境。',
      explanation:
        '20 是 40 的一半，因此仍是在累计频数图上估计中位数。人数改变不会把这个方法变成求平均数的方法。连续分布描述的是表现型有许多中间值；要分清遗传与环境的影响，还需要额外的比较或实验。',
    },
  },
]

export const esatVariation: KnowledgeLesson = {
  code: '150700',
  title: 'Variation · 变异',
  subtitle: '理解个体为什么不同，以及这些差异怎样影响后代',
  intro:
    '从变异来源与受控比较出发，解释自然选择怎样改变群体；区分遗传差异、环境影响及物种形成所需的证据。',
  memory: [...variationMethods['150701'].memory, ...variationMethods['150702'].memory],
  sections: [
    {
      code: '150701',
      title: '自然选择与进化',
      summary: variationMethods['150701'].summary,
      paragraphs: [variationMethods['150701'].intro],
      memory: variationMethods['150701'].memory,
      rules: variationMethods['150701'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      example: {
        question: selectionExamples[0]!.question,
        steps: selectionExamples[0]!.steps,
        answer: selectionExamples[0]!.answer,
      },
      pitfalls: [
        '把“使用抗生素之后发现更多耐药菌”写成“抗生素为细菌定向制造耐药突变”，忽略原有变异和选择。',
        '只比较存活个体的数量，不比较原来各有多少，导致存活率或比例的分母用错。',
        '把选择优势等同于显性、大型或强壮；题目需要的是具体环境下的存活与繁殖证据。',
        '把群体出现差异直接等同于形成新物种，或把固定代数当成物种形成门槛。',
      ],
      check: {
        question:
          '某种昆虫有可遗传的浅色与深色。环境变暗后，深色个体更少被捕食，且平均留下更多后代。经过许多代，深色比例上升。哪一解释最合适？',
        options: [
          '浅色个体为了躲避捕食，主动把相关基因改成深色版本。',
          '深色一定是显性，所以它必然成为唯一颜色。',
          '所有个体都在一生中变深，说明个体完成了进化。',
          '原有的可遗传差异影响繁殖成功，使深色相关遗传特征在后代中更常见。',
        ],
        answerIndex: 3,
        explanation:
          'D 把原有变异、环境中的优势、繁殖和遗传连接起来。题目没有说明显隐性，也没有说深色最后一定达到 100%；自然选择同样不要求浅色个体主动改变自己的基因。',
      },
      sourceIds: ['uat-b7', 'openstax-population', 'openstax-adaptation', 'openstax-speciation'],
      visual: 'variation',
      examFocus: {
        goal: '理解自然选择中“差异从哪里来、谁留下更多后代、群体怎样改变”，并分清数量、比例与物种形成。',
        comparison: {
          title: '三个层次的变化，证据不同',
          columns: ['现象', '主要看什么', '不能单独推出什么'],
          rows: [
            ['个体受环境影响', '同一个体或同基因型的表现改变', '群体遗传频率已经改变'],
            [
              '自然选择推动进化',
              '可遗传差异与相对繁殖成功，后代群体随之改变',
              '所有个体都主动改变了基因',
            ],
            ['新物种形成', '遗传分化，并出现相应的物种隔离证据', '外观不同就必定是不同物种'],
          ],
        },
        examples: selectionExamples,
        checklist: [
          '能把原有遗传变异、环境中的相对优势、繁殖和遗传按因果关系连起来。',
          '能分别算数量、群体比例与各类型存活率，不把三个分母混用。',
          '能解释物种形成为什么需要超出“两个群体有差异”的证据。',
        ],
      },
    },
    {
      code: '150702',
      title: '变异的来源',
      summary: variationMethods['150702'].summary,
      paragraphs: [variationMethods['150702'].intro],
      memory: variationMethods['150702'].memory,
      rules: variationMethods['150702'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      example: {
        question: sourceExamples[0]!.question,
        steps: sourceExamples[0]!.steps,
        answer: sourceExamples[0]!.answer,
      },
      pitfalls: [
        '看到两个人表现型相同，就认定所有相关基因型相同；显隐性和环境都可能隐藏遗传差异。',
        '把克隆理解成在任何环境、任何年龄下都必须完全同高、同重。',
        '认为连续变异只能来自环境、不连续变异只能来自遗传。分布形式和成因需要分别判断。',
        '把两条不同品系同时放在不同环境，再把全部差异归给其中一个因素。',
      ],
      check: {
        question:
          '某品种的遗传组成相同的插条被随机分到不同光照条件，其他条件一致且未发生突变。两组的平均叶面积出现可重复差异。哪一结论最合理？',
        options: [
          '本实验支持光照影响叶面积的表现。',
          '两组的 DNA 序列一定已经不同。',
          '所有植物的叶面积都与基因无关。',
          '有差异的叶面积一定会原样传给每个后代。',
        ],
        answerIndex: 0,
        explanation:
          'A 与控制条件一致：遗传背景相同、其他条件一致，改变光照后表现不同，支持环境作用。实验没有证明基因对叶面积完全无影响，也没有提供后代遗传的证据。',
      },
      sourceIds: ['uat-b7', 'openstax-population'],
      visual: 'variation',
      examFocus: {
        goal: '把表现型差异的形式与来源分开，并从受控实验中判断遗传、环境及两者共同影响。',
        comparison: {
          title: '把“看到什么”与“说明什么”分开',
          columns: ['观察或比较', '能够支持', '仍不能直接说明'],
          rows: [
            ['同基因型、不同环境，有稳定差异', '该环境条件影响表现型', '这种性状完全不受基因影响'],
            [
              '不同基因型、相同受控环境，有稳定差异',
              '遗传差异对表现有影响',
              '在所有环境中差异大小都相同',
            ],
            ['数据呈连续范围或几个类别', '表现型差异的分布形式', '遗传与环境各贡献了多少'],
          ],
        },
        examples: sourceExamples,
        checklist: [
          '能用同基因型、不同环境的例子说明表现型与基因型不是同一回事。',
          '能在两因素数据里找到固定环境与固定遗传背景的比较。',
          '能说明连续／不连续并不能替代对遗传／环境成因的判断。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-b7',
      title: 'UAT-UK · ESAT Content Specification（2026/27）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对 B7.1 自然选择、耐药性与物种形成，以及 B7.2 遗传和环境变异范围；知识点讲解、真题解析与改条件变式为原创编写；例题引用诊断题库中的历史真题。',
    },
    {
      id: 'openstax-population',
      title: 'OpenStax · Biology 2e: Population Genetics',
      url: 'https://openstax.org/books/biology-2e/pages/19-2-population-genetics',
      note: '核对遗传与环境影响、变异来源及群体遗传变化的科学边界；未转载原图或题目。',
    },
    {
      id: 'openstax-adaptation',
      title: 'OpenStax · Biology 2e: Adaptive Evolution',
      url: 'https://openstax.org/books/biology-2e/pages/19-3-adaptive-evolution',
      note: '核对相对适应度、选择压力与环境相关的选择优势。',
    },
    {
      id: 'openstax-speciation',
      title: 'OpenStax · Biology 2e: Formation of New Species',
      url: 'https://openstax.org/books/biology-2e/pages/18-2-formation-of-new-species',
      note: '核对地理隔离、生殖隔离和生物学物种概念的适用范围。',
    },
  ],
}
