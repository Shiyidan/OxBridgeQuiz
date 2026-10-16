// ESAT 生物变异讲义：解释变异来源、自然选择与进化，配套原创数据题、变式及群体图解。
import type { KnowledgeExamFocus, KnowledgeLesson } from './types'

const selectionExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '数量变少，比例却可能上升',
    question:
      'Before an antibiotic treatment, a bacterial population contains 20 resistant and 980 susceptible bacteria. Immediately after treatment, 10 resistant and 90 susceptible bacteria remain alive. Assume that no reproduction, mutation or gene transfer occurs during treatment. Which statement is correct?',
    options: [
      'The number of resistant bacteria has increased fivefold.',
      'The resistant proportion has risen from 2% to 10% because resistant bacteria had a higher survival rate.',
      'The antibiotic converted 10 susceptible bacteria into resistant bacteria.',
      'Resistance must be disadvantageous because half the resistant bacteria died.',
    ],
    answer: 'B：耐药菌的比例从 2% 上升到 10%，因为它们在这次处理中的存活率更高。',
    steps: [
      '先分别算处理前后的总数：原来是 20 + 980 = 1000，处理后是 10 + 90 = 100。耐药菌比例因此从 20/1000 = 2% 变成 10/100 = 10%。',
      '**比例增加不等于数量增加**。耐药菌从 20 个减到 10 个，但敏感菌减少得更多，所以耐药菌在幸存者中所占的份额上升。',
      '比较存活率：耐药菌是 10/20 = 50%，敏感菌是 90/980，明显低于 10%。这里的优势是相对于另一类细菌而言，不要求耐药菌全部存活。',
      '题目排除了繁殖、突变和基因转移，因此不能把结果解释成细菌在处理时获得了耐药基因。若幸存者继续繁殖并传递耐药性，这种遗传差异就可能在后代中变得更常见。',
    ],
    optionNotes: [
      'A：增加五倍的是比例（10% ÷ 2% = 5），数量实际减半。',
      'B：分母、百分比与两类细菌的存活差异都判断正确。',
      'C：题目没有发生遗传改变，原有耐药菌的幸存已经足够解释结果。',
      'D：相对优势看的是两类细菌的存活和繁殖表现，不是某类是否零死亡。',
    ],
    takeaway:
      '读群体变化数据时，**数量、所占比例、存活率分别计算**。自然选择能提高某类个体的比例，即使整个群体和该类个体的数量都在减少。',
    variant: {
      question:
        'The 100 survivors are then grown without antibiotic. Each surviving bacterium divides exactly twice, all descendants survive, and resistance is inherited without change. How many resistant bacteria are present, and what proportion of the final population is resistant?',
      answer: '40 个耐药菌，占 10%。',
      explanation:
        '每个幸存者分裂两次后形成 4 个后代，耐药菌为 10 × 4 = 40，总数为 100 × 4 = 400。**两类按相同比例繁殖，数量都增加，但耐药比例不会继续上升**。要让比例再变，还需要不同的相对繁殖成功等条件。',
    },
  },
  {
    title: '分开生活以后，能说明什么？',
    question:
      'Two populations of a sexually reproducing animal become geographically isolated. After many generations, their inherited characteristics differ. Which additional observation provides the strongest evidence that they have become different species under the biological species concept?',
    options: [
      'The populations have lived apart for exactly 100 generations.',
      'The average body mass differs between the populations.',
      'Their habitats contain different types of food.',
      'When they meet again, reproductive barriers prevent them from producing fertile offspring with one another.',
    ],
    answer: 'D：重新接触后仍存在生殖隔离，不能彼此产生可育后代。',
    steps: [
      '地理隔离可以减少两个群体之间的基因交流。不同环境下的选择、突变等过程，会让它们逐渐积累遗传差异，但**分开生活本身还不等于已经形成新物种**。',
      '本题明确采用生物学物种概念，而且对象是有性生殖动物。关键证据是两个群体之间存在生殖隔离，不能彼此产生可育后代；D 直接提供了这一点。',
      '体重或食物不同可能仍然出现在同一物种内。它们能提示差异，却不足以单独证明两个群体已成为不同物种。',
      '也不存在“隔离满 100 代必定成为新物种”的固定期限。考纲说进化可能导致新物种形成，**可能不等于每次都一定发生**。',
    ],
    optionNotes: [
      'A：代数不是物种形成的固定门槛。',
      'B：同一物种内也可以有明显的体型差异。',
      'C：环境不同有助于解释选择方向不同，但不是生殖隔离的直接证据。',
      'D：与题目指定的物种判断标准直接对应。',
    ],
    takeaway:
      '区分**群体出现遗传变化**与**已经形成不同物种**。后者需要额外证据；对本题的有性生殖动物，重点是生殖隔离。',
    variant: {
      question:
        'The populations instead interbreed freely when reunited and produce fertile offspring. Their average body masses still differ. Must the observed mass difference show that they are different species?',
      answer: '不必；体重差异本身不能证明它们是不同物种。',
      explanation:
        '同种个体和群体之间可以有遗传或环境造成的表现差异。现在题干明确提供了自由交配并产生可育后代的信息，不能只凭体重不同就认定已形成生殖隔离。',
    },
  },
]

const sourceExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '同一组数据里，分清两种影响',
    question:
      'Two plant lines, A and B, have different genotypes. Genetically identical cuttings within each line are randomly assigned to low- or high-nutrient conditions. All other conditions are controlled and no mutation occurs. Mean heights are: A, low 12 cm and high 20 cm; B, low 18 cm and high 28 cm. The differences are reproducible. Which conclusion is best supported?',
    options: [
      'Height is determined only by genes because A and B differ.',
      'Height is determined only by nutrients because each line grows taller with more nutrients.',
      'Both genetic differences between the lines and nutrient conditions contribute to the height differences.',
      'High nutrient availability has converted the genotype of line A into that of line B.',
    ],
    answer: 'C：这些差异支持遗传因素与营养条件都影响株高。',
    steps: [
      '先固定遗传背景看环境：同为 A，低营养 12 cm、高营养 20 cm；同为 B，也从 18 cm 变成 28 cm。**基因型相同而处理条件不同**，支持营养对株高有影响。',
      '再固定环境看品系：低营养时 A 与 B 相差 6 cm，高营养时相差 8 cm。题目说明其余条件受控、差异可重复，因此也支持两条遗传不同的品系之间存在遗传影响。',
      '两组比较要合起来读，不能因为一种因素起作用就排除另一种因素。C 同时解释了同品系的环境差异和同环境的品系差异。',
      'A 的株高变大，是表现型变化；题目排除了突变，并没有说营养会把 A 的等位基因变成 B 的。这里也不能把 8 cm 或 10 cm 简单解释为所有环境下通用的“营养贡献”。',
    ],
    optionNotes: [
      'A：忽略了同一品系在两种营养条件下也有不同株高。',
      'B：忽略了同一营养条件下 A 与 B 仍有可重复的差异。',
      'C：同时保留两类受控比较支持的结论。',
      'D：把表现型变化误认为遗传版本发生转换。',
    ],
    takeaway:
      '看遗传与环境的比较实验，可以**先在同一遗传背景内比较环境，再在同一环境内比较遗传背景**。两种影响可以同时存在。',
    variant: {
      question:
        'In a new experiment, line A is grown only in low nutrients and line B only in high nutrients. Their mean heights differ. Can this experiment alone separate the effects of genotype and nutrients?',
      answer: '不能，两种因素同时改变，无法分清各自造成了多少差异。',
      explanation:
        'A 与 B 不仅遗传背景不同，营养条件也不同，因此缺少“只改变一个因素”的对照。需要把两条品系都放进两种营养环境，才能分别比较。**看到差异不等于已经找到了唯一原因**。',
    },
  },
  {
    title: '分布图能告诉我们什么？',
    question:
      'The body masses of many animals of the same age and sex form a continuous range, with many intermediate values. No information about their genotypes or diets is available. Which conclusion is justified?',
    options: [
      'Every different body mass must correspond to a different allele of one gene.',
      'The variation must be caused entirely by the environment.',
      'The pattern alone does not show how much of the variation is genetic or environmental.',
      'Genes cannot affect a characteristic with intermediate values.',
    ],
    answer: 'C：连续分布本身不能分清遗传与环境各自的影响。',
    steps: [
      '连续变异描述的是数据怎样分布：体重有许多中间值，可以沿数轴测量。它首先是一种**表现型的分布特征**。',
      '体重等性状常受多个基因和环境共同影响。不过本题没有提供基因型、饮食或对照实验，不能从一张分布图算出各因素的贡献。',
      '因此 C 的结论与证据范围相符。A 把许多测量值误当成单个基因的许多等位基因；B 和 D 则把遗传影响无根据地排除了。',
      '离散类别同样不能自动证明“只有遗传作用”。例如某次外伤是否留下疤痕可记录成有、无两类，但这种分类方式不能把外伤变成等位基因差异。',
    ],
    optionNotes: [
      'A：一个表现型数值不是一个等位基因的身份证，多基因和环境都可能影响测量值。',
      'B：连续分布没有排除遗传因素。',
      'C：把观察到的分布与尚未确定的成因分开了。',
      'D：多个基因的共同作用常可产生许多中间表现。',
    ],
    takeaway:
      '**连续或不连续说的是差异的形式，遗传或环境说的是差异的来源**。两组概念不能直接一一对应。',
    variant: {
      question:
        'Flower colours are recorded as red, purple or white. In genetically identical plants, a controlled change in soil conditions changes the recorded colour without mutation. Does the presence of three separate colour categories prove that the variation is entirely genetic?',
      answer: '不能；本题的对照已经说明环境可以改变颜色表现。',
      explanation:
        '红、紫、白是记录时的三个类别；类别清楚不代表成因必定只有基因。题目保持遗传背景相同并改变土壤，显示环境有作用，但也不能反过来断言所有植物的花色都不受基因影响。',
    },
  },
]

export const esatVariation: KnowledgeLesson = {
  code: '150700',
  title: 'Variation · 变异',
  subtitle: '理解个体为什么不同，以及这些差异怎样影响后代',
  intro:
    '同一物种的个体并不完全相同：有些差异来自遗传，有些与生长环境有关，很多性状同时受两者影响。这一章先把差异的来源讲清楚，再看自然选择怎样改变一个群体。耐药菌、植物培养和物种形成的例题，会帮助你区分“个体发生变化”“某类个体变得更常见”和“形成新物种”这几件不同的事。',
  memory: [
    '**群体通常先有遗传差异，环境再影响不同个体留下后代的机会**。不能写成生物因为需要某种特征，就主动产生对应突变。',
    '==自然选择中的优势与环境有关，也要落实到存活和繁殖==；“更强壮”“更显性”都不自动等于更有利。',
    '**进化描述群体的遗传特征跨代改变**。一个个体因锻炼或营养长得更大，不足以说明该群体已经进化。',
    '耐药比例上升可能发生在耐药菌数量下降时。**比例的分母是当时的群体总数**，不是处理前的总数。',
    '==表现型可以同时受基因与环境影响==。同基因型在不同环境下可以不同，不同基因型也可能表现相似。',
    '**连续或不连续是差异的形式，遗传或环境是差异的来源**；仅凭图表形状不能确定成因。',
  ],
  sections: [
    {
      code: '150701',
      title: '自然选择与进化',
      summary: '从群体原有差异、相对繁殖成功与遗传传递，理解耐药性变化和新物种形成的条件。',
      paragraphs: [
        '想一想一群细菌遇到抗生素时会发生什么。它们原来就可能不完全相同，有些已经带有耐药的遗传变化。如果这些细菌更容易存活，并把耐药性传给后代，经过多代后，耐药个体就可能占更大比例。**环境改变了谁更容易留下后代，并不是先告诉细菌应该往哪个方向突变**。',
        '这就是自然选择 natural selection 的基本思路。我们真正追踪的是一个群体中可遗传特征怎样随世代改变，而不是某个个体是否“努力适应”。遗传差异持续积累，有时还会形成生殖隔离和新物种；但出现适应性变化，不代表一定已经形成新物种。',
      ],
      rules: [
        {
          title: '群体内原有的遗传变异',
          text: '同一物种的群体通常有许多等位基因和基因型差异。突变能够产生新的遗传版本，有性生殖又能重新组合已有版本。**突变不会因为某种改变“有用”就按需发生**；环境可以影响突变发生的概率，但不能因此说突变专门朝有利方向产生。',
        },
        {
          title: '环境中的选择压力',
          text: '捕食、食物限制、气候或抗生素，都可能让不同表现型的存活和繁殖机会不同。这种影响叫选择压力 selection pressure。**有利与不利取决于环境**：一种颜色在某背景下利于隐蔽，换了背景却可能更显眼。',
        },
        {
          title: '存活优势还要连接繁殖',
          text: '自然选择看的是相对繁殖成功：哪些个体平均能给下一代留下更多可存活、可继续繁殖的后代。活得更久可能有帮助，但若完全不能繁殖，就不会靠自己把该遗传特征传下去。==“适应度高”不是单纯体格更强，也不是必须零死亡==。',
        },
        {
          title: '跨代改变的对象是群体',
          text: '若有利差异能够遗传，携带者留下更多后代，相关遗传特征便可能在后代群体中更常见。这种群体遗传特征随时间的改变属于进化 evolution。**个体一生中因环境而长大或改变行为，不等于它自己完成了群体层面的进化**；自然选择是进化的重要机制，也不是所有遗传频率变化的唯一机制。',
        },
        {
          title: '抗生素耐药性',
          text: '细菌可以通过突变或获得其他细菌的遗传物质产生耐药性。抗生素处理会使敏感菌受到更强抑制或被杀死，原有耐药菌可能更容易留下后代，耐药比例因而上升。**不是患者的身体“产生耐药基因”，也不是每个敏感菌都被药物训练成耐药菌**。耐药性通常也针对特定药物，不能推出对所有抗生素都耐药。',
        },
        {
          title: '数量、比例与繁殖速度',
          text: '某类个体的比例等于该类数量除以群体总数。群体大量死亡时，耐药菌的数量可以下降、比例却上升；若之后两类按相同倍数增长，比例就保持不变。**数量增加本身不能证明选择正在提高其比例**。',
        },
        {
          title: '新物种形成的可能路径',
          text: '地理等隔离减少基因交流后，不同群体可能逐渐积累不同遗传变化。在有性生殖生物中，若进一步形成生殖隔离，不能彼此产生可育后代，就可能形成不同物种。**外观不同、住得远或分开很多代，单独都不足以证明新物种已经形成**；这个判断标准也不能直接套给只进行无性生殖的细菌。',
        },
      ],
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
      summary: '区分遗传与环境的影响，理解两者共同作用，并用受控比较解释表现型差异。',
      paragraphs: [
        '两株植物一高一矮，可以有哪些解释？它们的遗传组成可能不同，也可能一株得到的光照、矿物质或水更多；这两类原因还可以同时存在。因此，**看到表现型不同，只能先确认存在差异，不能立刻断定是哪一种原因**。',
        '要把原因分清，可以比较同一遗传背景在不同环境中的表现，也可以把不同遗传背景放在相同环境中比较。这里最有价值的习惯，是把保持不变的条件与真正改变的条件分开看。连续与不连续变异则是在描述差异怎样分布，不是给成因贴好标签。',
      ],
      rules: [
        {
          title: '遗传变异与等位基因',
          text: '不同个体拥有不同等位基因或不同组合时，可能产生不同表现型。这类差异可以具有遗传基础。突变提供新的版本，减数分裂和受精重新组合已有版本。**同一物种并不代表基因型完全相同**；同胞兄弟姐妹也通常不是彼此的克隆。',
        },
        {
          title: '环境影响最终表现',
          text: '营养、温度、光照、运动等条件可以影响性状如何表现。相同基因型的个体在不同环境下，可能有不同身高、质量或颜色。**表现型改变不一定伴随 DNA 序列改变**，也不能因为某种特征没有表现出来，就认定相关基因不存在。',
        },
        {
          title: '基因与环境共同作用',
          text: '许多性状是基因与环境共同作用的结果。例如遗传差异影响生长潜力，营养又影响实际生长。同一环境下不同基因型可以不同，同一基因型在不同环境下也可以不同。==“受遗传影响”不等于环境完全不起作用，“受环境影响”也不等于没有遗传基础==。',
        },
        {
          title: '后天改变与传给后代',
          text: '日常的营养、锻炼或伤痕造成的个体变化，一般不能直接当成传给后代的等位基因改变。要说明差异能遗传，需要遗传或后代证据。**不能仅凭“由环境引起”就断言在任何情况下都绝不影响后代**；环境也可能造成突变等改变，关键在于改变了什么，以及能否进入遗传传递。',
        },
        {
          title: '连续变异',
          text: '连续变异 continuous variation 有许多中间值，常可沿数轴测量，如同龄群体的身高。许多连续性状受多个基因和环境共同影响。**这是一种常见联系，不是“连续就只能由环境决定”的规则**；测量精度也会让连续值在记录表中看起来像整数。',
        },
        {
          title: '不连续变异',
          text: '不连续变异 discontinuous variation 在给定分类中有较明确的类别，例如 ABO 血型的 A、B、AB、O。某些类别主要有遗传基础，但**类别清楚不自动证明只有一个基因、或完全不受环境影响**。人为记录成“有／无”的环境性差异，也可能形成分开的类别。',
        },
        {
          title: '受控比较与证据边界',
          text: '同一遗传背景、不同环境的比较可检验环境作用；同一环境、不同遗传背景的比较可检验遗传差异的影响。需要控制年龄等其他条件、足够样本与重复。如果两种因素同时改变，**单凭两组结果不能分离各自作用**。同一环境里恰好没有差异，也不能证明换环境后仍会完全相同。',
        },
      ],
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
      note: '核对 B7.1 自然选择、耐药性与物种形成，以及 B7.2 遗传和环境变异范围；内容与题目原创。',
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
