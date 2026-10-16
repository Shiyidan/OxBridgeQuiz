// ESAT 基因技术讲义：用重组 DNA、分化潜能和世代选择解释技术原理与应用边界。
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'

const engineeringExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '两个酶分别完成哪一步？',
    question:
      'A DNA fragment and a bacterial plasmid are cut to produce complementary sticky ends. The fragment pairs with the opened plasmid. Which enzyme is needed to seal the sugar–phosphate backbones and form a recombinant plasmid?',
    options: ['A restriction enzyme', 'DNA ligase', 'A protease', 'Amylase'],
    answer: 'B：DNA ligase（DNA 连接酶）。',
    steps: [
      '先把题目进行到哪一步说清楚：DNA 已经切开，互补末端也已经配上。因此，这里不缺“剪开”的步骤。',
      '黏性末端上的互补碱基可以配对，但两段 DNA 的糖—磷酸骨架仍需要连接。**末端配对与骨架封口是两件事**。',
      '连接酶形成连接 DNA 骨架的共价键，使插入片段与质粒连成重组 DNA，所以选 B。',
      '限制性内切酶负责在特定序列处切割 DNA；蛋白酶和淀粉酶处理的则分别是蛋白质和淀粉，都不完成这一步。',
    ],
    optionNotes: [
      'A：负责切割，题目中的切割步骤已经完成。',
      'B：把相邻 DNA 片段的糖—磷酸骨架连接起来。',
      'C：蛋白酶水解蛋白质，不能封闭 DNA 骨架。',
      'D：淀粉酶作用于淀粉，不是 DNA。',
    ],
    takeaway:
      '题目给出酶的名字时，先对应它真正改变了什么：**限制性内切酶切 DNA，连接酶接 DNA，核糖体才负责把氨基酸连成多肽**。',
    variant: {
      question:
        'The plasmid and insert instead have incompatible sticky ends. Is adding more DNA ligase alone a reliable way to obtain the intended recombinant plasmid?',
      answer: '不是。必须先使待连接的末端相容。',
      explanation:
        '这次障碍出现在末端匹配，而不是连接酶数量。连接酶不会把不互补的碱基改成互补序列；需要重新设计或处理片段。别把“同一种酶切割”当作唯一办法，但要记住**待连接末端必须适合连接**。',
    },
  },
  {
    title: '制造药物和改变患者细胞，有什么区别？',
    question:
      'Method P uses genetically engineered bacteria to produce a purified human protein that is injected into a patient. Method Q introduces a working gene copy into some of the patient’s liver cells. No gametes are altered. Which statement is justified?',
    options: [
      'P necessarily inserts the bacterial plasmid into the patient’s chromosomes.',
      'Q necessarily changes the genotype of every cell in the patient.',
      'Both methods necessarily make the genetic change heritable by the patient’s children.',
      'P supplies a protein, whereas Q aims to make some treated cells produce a functional gene product.',
    ],
    answer: 'D：P 提供蛋白质，Q 让被处理的细胞产生相应基因产物。',
    steps: [
      '先看进入患者体内的是什么。P 明确注射的是纯化后的蛋白质，不能把它说成质粒或细菌被注入了患者染色体。',
      'Q 转入的是功能基因拷贝，接受处理的是部分肝细胞。它有机会帮助这些细胞制造所需产物，但题干没有说全部细胞都接受了基因。',
      '两种方法都不能推出子女必然继承改动。尤其 Q 明确没有改动配子，**体细胞的基因改变通常不经有性生殖传给下一代**。',
      '因此 D 准确区分了两种医疗用途。至于效果持续多久、表达量是否合适、是否发生不良反应，还需要额外证据。',
    ],
    optionNotes: [
      'A：把注射蛋白质误当作转移 DNA。',
      'B：“部分肝细胞”不能扩大成“每个细胞”。',
      'C：忽略了体细胞和生殖细胞的区别。',
      'D：同时符合两种方法的实际作用对象。',
    ],
    takeaway:
      '比较医疗技术时，依次确认**转移的是 DNA、细胞还是蛋白质；改变了谁；结论能到哪一步**。名称相似，不代表作用过程相同。',
    variant: {
      question:
        'The inserted gene in Q disrupts a gene that normally limits cell division. What risk could this create even if the therapeutic protein is produced?',
      answer: '可能增加细胞异常增殖、形成肿瘤的风险。',
      explanation:
        '能够制造治疗所需的蛋白质，并不排除插入位置带来的副作用。若控制分裂的基因受到破坏，细胞可能失去正常调控。这里说的是**可能的风险，不是每次基因转移必然致癌**。',
    },
  },
]

const stemExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '能形成许多细胞，是否就能形成完整个体？',
    question:
      'Three cell populations are described. X can generate all cell types needed for a complete mammal, including the supporting extraembryonic tissues. Y can generate all body cell types but cannot by itself generate a complete mammal. Z can generate several blood cell types but not nerve cells. Which classification is correct?',
    options: [
      'X pluripotent; Y totipotent; Z multipotent',
      'X totipotent; Y multipotent; Z pluripotent',
      'X totipotent; Y pluripotent; Z multipotent',
      'X multipotent; Y pluripotent; Z totipotent',
    ],
    answer: 'C：X 全能，Y 多能，Z 多潜能。',
    steps: [
      'X 的关键条件是能形成完整个体所需的所有细胞，包括支持胚胎发育的胚外组织，因此对应 totipotent（全能）。',
      'Y 能形成身体各类细胞，却不能单独形成完整个体，符合 pluripotent（多能）。**“身体的各种细胞”与“完整个体所需的全部组织”不能混写**。',
      'Z 的分化范围限制在血细胞等相关类型，不能跨到所有身体细胞，符合 multipotent（多潜能）。',
      '用这三个能力范围逐个对应，只有 C 同时满足条件；不能仅凭“能形成很多种”就把 Y、Z 都判成全能。',
    ],
    optionNotes: [
      'A：把全能与多能的定义交换了。',
      'B：把 Y 的全身体细胞范围与 Z 的有限范围交换了。',
      'C：每一项都按实际分化能力分类。',
      'D：X 的范围最广，Z 的范围受限，与该项相反。',
    ],
    takeaway:
      '不要只数“能变几种”。记住分化范围：**完整个体所需的全部类型 → 身体各类细胞 → 有限的相关细胞类型**。',
    variant: {
      question:
        'A fourth culture is observed to produce nerve cells in one experiment. Is this observation alone enough to prove that the culture is pluripotent?',
      answer: '不够。一次形成神经细胞，只证明这一次表现出的分化能力。',
      explanation:
        '多能意味着具有形成身体各类细胞的潜能，不能只凭一个细胞类型就证明。观察结果与完整能力范围之间还有距离；反过来，本次没有观察到其他类型，也不等于已经证明它们绝不可能形成。',
    },
  },
  {
    title: '用自己的细胞，是否就没有风险？',
    question:
      'A proposed treatment uses a patient’s own cells to generate replacement tissue. Testing shows that a small number of undifferentiated, rapidly dividing cells remain in the final preparation. Which concern is most directly supported?',
    options: [
      'The remaining cells could divide uncontrollably or form inappropriate tissue.',
      'All replacement cells must be rejected because they come from the patient.',
      'Every transplanted cell will become a complete embryo.',
      'Using the patient’s own cells guarantees that no harmful mutations are present.',
    ],
    answer: 'A：残留细胞可能异常增殖，或形成不需要的组织。',
    steps: [
      '题干已经指出直接的问题：有尚未按目标方向分化、又能快速分裂的细胞残留。治疗需要的是功能合适、数量受控的细胞。',
      '这些残留细胞可能继续增殖，或分化成不合适的组织，因此 A 是数据直接支持的风险。',
      '自体来源通常有助于降低免疫不匹配的问题，但**降低一种风险，不等于消除全部风险**；仍要考虑突变、污染、异常增殖和功能是否正常。',
      '也不能把“未分化”自动理解成全能，更不能推断每个移植细胞都会形成胚胎。',
    ],
    optionNotes: [
      'A：正好对应残留细胞的增殖与分化控制问题。',
      'B：自体来源并不意味着所有细胞必然被排斥。',
      'C：未分化不等于全能，形成完整胚胎也不能这样推断。',
      'D：细胞来自本人不能排除原有或培养期间产生的有害变化。',
    ],
    takeaway:
      '评价细胞治疗时要把**分化正确、增殖受控、移植后存活并发挥功能**分别考虑；细胞来源只是其中一个条件。',
    variant: {
      question:
        'The same correctly differentiated cells are instead obtained from an unrelated donor. Which additional compatibility issue becomes particularly important?',
      answer: '供受者之间的免疫相容性及排斥风险。',
      explanation:
        '异体细胞可能被患者免疫系统识别为外来成分。即使细胞已经正确分化，也需要考虑组织匹配与排斥；同时，原有的质量控制仍然重要。',
    },
  },
]

const breedingExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '选择要经过繁殖，才能改变后代',
    question:
      'A crop population contains heritable variation in seed mass. A breeder grows plants under comparable conditions, selects plants with heavier seeds as parents, crosses them and repeats this process for several generations. Which explanation best accounts for a rise in mean seed mass?',
    options: [
      'The breeder causes every seed to mutate in the required direction.',
      'Plants acquire larger seeds because they know they have been selected.',
      'Selected parents contribute more of the inherited variants associated with heavier seeds to later generations.',
      'All offspring must be genetically identical because their parents were deliberately chosen.',
    ],
    answer: 'C：被选亲本向后代贡献了更多与较重种子有关的遗传变异。',
    steps: [
      '题目首先给出可遗传变异：原群体里已经有与种子质量差异有关的遗传因素。选择不是按需要制造突变。',
      '人挑选较重种子的植株繁殖，使这些亲本对下一代的遗传贡献增大。**选择通过繁殖改变后代群体，而不是让同一株植物主动改变基因**。',
      '反复进行选择与杂交后，相关遗传变异可能更常见，群体平均性状随之改变，所以 C 合理。',
      '题目使用有性杂交，后代仍可能有遗传差异。人工选择不等于克隆，也不保证每颗种子都比上一代重。',
    ],
    optionNotes: [
      'A：选择已有变异不等于定向诱发所有突变。',
      'B：生物不会因为“知道目标”而主动产生所需遗传变化。',
      'C：正确连接了可遗传变异、亲本选择和世代变化。',
      'D：有性生殖仍会重新组合遗传信息。',
    ],
    takeaway:
      '解释选择育种时，把链条讲完整：**有可遗传差异 → 选择亲本 → 繁殖传递 → 多代后群体改变**。',
    variant: {
      question:
        'In a second experiment all plants are genetically identical, and seed mass differs only because some receive more water. Does selecting the largest seeds alone demonstrate a heritable response to selection?',
      answer: '不能。这里的差异被说明为环境造成，不能据此证明遗传改良。',
      explanation:
        '原题最重要的条件“可遗传变异”被拿掉了。较大种子可能影响下一代早期生长，但这仍不等于相关等位基因频率已经改变；要比较遗传响应，需要排除水分和种子储备等环境影响。',
    },
  },
  {
    title: '育种成功以后，为什么还要保留多样性？',
    question:
      'A livestock population is repeatedly bred from a few closely related animals selected for high yield. Compared with breeding from many unrelated animals, which outcome is a plausible genetic risk?',
    options: [
      'A guaranteed increase in the number of different alleles at every locus.',
      'Greater homozygosity, allowing some harmful recessive alleles to be expressed more often.',
      'The immediate disappearance of every harmful allele.',
      'Complete protection against any future infectious disease.',
    ],
    answer: 'B：近交可增加纯合程度，使某些有害隐性等位基因更容易表现。',
    steps: [
      '“少数近亲反复繁殖”会让亲本携带相同等位基因的机会更高，后代更容易在一些位点得到相同的两个版本。',
      '某些有害隐性等位基因在杂合时未明显表现，变成隐性纯合后就可能出现不利性状，所以 B 是合理风险。',
      '只从少数个体繁殖还可能使群体丢失部分遗传变异。**产量提高与遗传多样性下降可以同时发生**。',
      '这些影响是风险而非对每个位点、每个个体的绝对断言；不能因此说所有疾病都会出现，也不能说所有有害等位基因都会消失。',
    ],
    optionNotes: [
      'A：少数亲本并不保证每个位点的等位基因种类增加。',
      'B：符合近交提高纯合度的遗传机制。',
      'C：有害等位基因可以保留，尤其可能在杂合个体中隐藏。',
      'D：遗传背景相似可能增加共同易感性，不保证抵抗所有新疾病。',
    ],
    takeaway:
      '评价育种结果，要同时看**目标性状有没有改善、群体保留了多少遗传差异、是否积累了其他代价**。',
    variant: {
      question:
        'If unrelated breeding animals carrying useful genetic variation are introduced, must the frequency of every harmful allele fall immediately?',
      answer:
        '不一定。引入无亲缘个体可以增加可用变异、降低近交程度，但不保证所有有害等位基因立刻减少。',
      explanation:
        '新亲本也可能携带某些有害等位基因。具体频率取决于原有与引入个体的遗传组成和后续选择；不要把降低近交风险说成“清除全部有害基因”。',
    },
  },
]

// 统一提供图解与内部来源，并让旧版例题字段沿用本节第一道讲解题。
function technologySection(
  section: Omit<KnowledgeSection, 'example' | 'sourceIds' | 'visual'> & {
    examFocus: KnowledgeExamFocus
  },
  sourceIds: string[],
): KnowledgeSection {
  const firstExample = section.examFocus.examples[0]!
  return {
    ...section,
    visual: 'gene-technologies',
    sourceIds,
    example: {
      question: firstExample.question,
      steps: firstExample.steps,
      answer: firstExample.answer,
    },
  }
}

export const esatGeneTechnologies: KnowledgeLesson = {
  code: '150600',
  title: 'Gene technologies（基因技术）',
  subtitle: '看清技术改变了什么，再判断它能带来什么',
  intro:
    '这一章的三种技术很容易混在一起。基因工程直接操作 DNA，干细胞技术利用细胞的增殖与分化能力，选择育种则让选定的亲本繁殖。先分清各自的原理，再看能实现的效果、需要满足的条件和可能付出的代价，题目中的“必然”“所有”“没有风险”就容易判断了。',
  memory: [
    '**限制性内切酶切割，DNA 连接酶连接**；基因进入细胞，还要能够正常表达。',
    '**全能可形成完整个体所需的全部类型；多能可形成身体各类细胞；多潜能范围更受限**。',
    '**选择育种依赖可遗传变异和繁殖**；改善目标性状不保证其他性状与遗传多样性都改善。',
  ],
  sections: [
    technologySection(
      {
        code: '150601',
        title: 'Genetic engineering（基因工程）',
        summary: '转入的是遗传信息，效果还取决于它能否被合适的细胞正常使用。',
        paragraphs: [
          '想让细菌制造一种人类蛋白质，不需要把整个人类细胞交给细菌，而是给它一份适合表达的 DNA 指令。基因工程可以把一个生物的基因拷贝加入另一个生物的 DNA 中，形成新的 DNA 组合；供体与受体不一定属于同一物种。',
          '这里要分清两层：**“得到重组 DNA”是构建成功，“得到需要的蛋白质”是表达成功**。插入的位置、调控序列、宿主能否处理该基因产物，都会影响后者。',
        ],
        rules: [
          {
            title: '限制性内切酶：在识别位点切开 DNA',
            text: 'restriction enzyme 识别特定 DNA 序列并切割。不同酶可产生黏性末端或平末端；黏性末端露出的短单链可与互补末端配对。不要把“所有限制酶都会留下黏性末端”当作定义。',
          },
          {
            title: '连接酶：把骨架接牢',
            text: 'DNA ligase 连接相邻 DNA 片段的糖—磷酸骨架。互补碱基先配对，连接酶再完成骨架的连接；**它不负责剪出目标基因，也不负责制造蛋白质**。',
          },
          {
            title: '载体：把目的 DNA 带入受体',
            text: '质粒是常用的细菌载体。将目的片段与适当的质粒连接，导入细胞后，还需要筛选真正得到所需构建的细胞。**导入质粒不等于改写了细菌的主染色体**，质粒可以作为独立 DNA 存在。',
          },
          {
            title: '表达：宿主必须读得懂这份指令',
            text: '宿主需要合适的表达调控序列。若借助细菌表达人类蛋白质，通常使用不含内含子的编码序列，例如从成熟 mRNA 制成的 cDNA，而不能默认把任意一段人类基因组 DNA 直接放进去就能正确表达；某些蛋白质还需要真核细胞的加工。',
          },
          {
            title: '不同细胞，可以承担不同任务',
            text: '细菌可用来生产某些人类蛋白质；植物细胞可引入与抗虫等性状有关的基因；动物细胞可被用于生产复杂蛋白质，或作为基因治疗的靶细胞。共同点是改变 DNA，具体的载体、表达和安全问题则不同。',
          },
          {
            title: '医疗收益：补充产物，或帮助细胞恢复功能',
            text: '工程细胞可生产纯化后的药用蛋白质，例如重组人胰岛素；基因治疗则可能让患者的目标细胞获得功能基因。==注射纯化蛋白质，不等于把患者的基因改掉==。体细胞治疗也不意味着改动会遗传给子女。',
          },
          {
            title: '医疗风险：成功表达也不等于完全安全',
            text: '需要考虑递送到哪些细胞、表达量是否合适、免疫反应，以及某些整合方式是否破坏其他基因。若用微生物生产药物，还要控制污染并纯化产物。风险与具体方法有关，不能一律说“必然致癌”或“绝无副作用”。',
          },
        ],
        pitfalls: [
          '把限制酶与连接酶的作用写反，或者把末端配对当成 DNA 骨架已经封闭。',
          '认为“检测到目的 DNA”就已经证明细胞能制造足量、功能正常的蛋白质。',
          '把工程细菌生产药物、患者体细胞基因治疗和可遗传的生殖细胞改变混为一谈。',
        ],
        check: {
          question: '在某细菌中检测到了新导入的目的 DNA。仅凭这一结果，哪一项仍不能确定？',
          options: [
            '该样本含有目的 DNA 序列',
            '目的 DNA 曾被引入该细菌',
            '目的蛋白质已经以足够数量、正确形式产生',
            '该细菌的 DNA 组成受到此次导入影响',
          ],
          answerIndex: 2,
          explanation:
            'DNA 存在与有效表达是不同证据。还需要检测转录、翻译或最终蛋白质的数量与功能，不能凭 DNA 检测结果直接宣布药物生产成功。',
        },
        examFocus: {
          goal: '理解切割、连接、递送和表达各自做什么，并区分生产药物与改变患者细胞。',
          comparison: {
            title: '同一项技术里的不同角色',
            columns: ['对象', '主要作用', '不能据此推断'],
            rows: [
              ['限制性内切酶', '识别并切割特定 DNA 序列', '它会把片段重新连接'],
              ['DNA 连接酶', '连接 DNA 的糖—磷酸骨架', '它能修正所有不匹配末端'],
              ['载体（如质粒）', '携带目的 DNA', '进入细胞就一定高效表达'],
              ['宿主细胞', '在合适条件下表达基因产物', '任何宿主都能完成所有蛋白质加工'],
            ],
          },
          examples: engineeringExamples,
          checklist: [
            '能区分剪开、配对与连接骨架。',
            '能说出基因进入细胞与基因有效表达之间的差别。',
            '能按实际处理对象解释医疗收益和风险，不把体细胞改变当作必然可遗传。',
          ],
        },
      },
      ['esat-b6', 'openstax-biotechnology'],
    ),
    technologySection(
      {
        code: '150602',
        title: 'Stem cells（干细胞）',
        summary: '干细胞既能保留自身，又能产生特化细胞；不同干细胞的分化范围并不相同。',
        paragraphs: [
          '身体需要补充血细胞或修复组织时，仅有已经高度特化的细胞往往不够。干细胞能通过分裂补充细胞，并在合适信号下形成特定细胞类型。这里的两个核心能力是**自我更新与分化**：前者保留干细胞群体，后者产生承担具体工作的细胞。',
          '“潜能”说的是它能形成哪些类型，不是它现在已经同时变成了所有类型。分化通常伴随基因表达方式变化，而不是简单地删去其他细胞所需的全部基因。',
        ],
        rules: [
          {
            title: '全能 totipotent：范围包括完整个体所需的组织',
            text: '某些早期胚胎细胞具有全能性，在合适条件下有潜力形成完整多细胞生物。对哺乳动物而言，这包括身体细胞及支持发育所需的胚外组织，不能把“所有胚胎时期细胞”都判为全能。',
          },
          {
            title: '多能 pluripotent：可形成身体各类细胞',
            text: '多数胚胎干细胞属于多能细胞，能形成身体的各种细胞类型，例如神经、肌肉和血细胞。**多能不等于单个细胞本身能形成完整个体**；它不具有全能细胞同样完整的胚外发育能力。',
          },
          {
            title: '多潜能 multipotent：范围限制在相关细胞类型',
            text: '成体干细胞在考纲中按多潜能理解，能产生有限范围的细胞。例如造血干细胞可产生多类血细胞，但不能因此宣称它能形成身体所有细胞。成体干细胞负责的组织不同，分化范围也不同。',
          },
          {
            title: '分化与自我更新，承担不同任务',
            text: '干细胞群体需要保留能继续分裂的细胞，同时产生适当数量的特化细胞。==分裂增加细胞数量，分化改变细胞承担的功能==；两者不能互相代替，也不要求每次分裂都以完全相同的方式发生。',
          },
          {
            title: '潜在收益：替代受损细胞并恢复功能',
            text: '例如造血干细胞移植可以补充形成血细胞的能力；其他研究希望获得能替代受损组织的细胞。真正有用的替代细胞还必须存活、与原有组织配合并发挥目标功能，不能只凭“培养出了很多细胞”判断治疗有效。',
          },
          {
            title: '生物学风险：排斥、异常增殖和分化不当',
            text: '异体细胞可能引发免疫排斥；残留未分化细胞、异常遗传改变或培养污染也可能带来风险。使用患者自身细胞可降低某些相容性问题，**但不能保证无突变、无污染、无异常增殖**。',
          },
          {
            title: '胚胎来源还有伦理与获取问题',
            text: '获取某些胚胎干细胞涉及胚胎的使用与破坏，因此存在伦理争议。成体来源在这方面通常争议较少，但分化范围与获得足够细胞的难度可能受限。评估时应同时说清来源、能力和代价。',
          },
        ],
        pitfalls: [
          '把“胚胎细胞”全部当成全能细胞。',
          '把一次观察到的分化结果，等同于该细胞全部的分化潜能。',
          '认为自体来源就必然安全，或认为产生目标细胞就已证明能治愈疾病。',
        ],
        check: {
          question: '某成体干细胞能形成多种血细胞，但不能形成神经细胞。最合理的判断是什么？',
          options: [
            '它是全能细胞',
            '它属于多潜能，分化范围受限',
            '它必定不能自我更新',
            '它已失去所有与其他组织有关的基因',
          ],
          answerIndex: 1,
          explanation:
            '能形成有限范围的相关细胞类型，符合多潜能。分化范围受限不等于不能自我更新，更不能据此推断其他组织相关基因全部被删除。',
        },
        examFocus: {
          goal: '用完整的能力范围区分三类潜能，并解释细胞治疗为什么还需要控制分化和增殖。',
          comparison: {
            title: '三个词，比较的是分化范围',
            columns: ['潜能', '可以形成什么', '要守住的边界'],
            rows: [
              ['Totipotent 全能', '完整个体所需的全部类型', '只适用于某些很早期细胞'],
              ['Pluripotent 多能', '身体各类细胞', '不等于能独立形成完整个体'],
              ['Multipotent 多潜能', '有限范围的相关细胞类型', '“不止一种”不等于“所有种类”'],
            ],
          },
          examples: stemExamples,
          checklist: [
            '能解释全能与多能为何不是同一回事。',
            '能分别说明自我更新、分裂与分化。',
            '能提出与细胞来源、增殖和功能相关的具体风险。',
          ],
        },
      },
      ['esat-b6', 'nih-stem-cells'],
    ),
    technologySection(
      {
        code: '150603',
        title: 'Selective breeding（选择育种）',
        summary: '人选择亲本，让已有的可遗传差异在后代中更常出现。',
        paragraphs: [
          '选择育种不是在实验台上逐个改写基因，而是在群体中挑选具有所需性状的亲本，让它们繁殖，再从后代中继续选择。例如选产量高的作物或产奶多的家畜。若差异能够遗传，反复选择就可能使后代群体的平均性状发生改变。',
          '它与自然选择都依赖遗传差异和繁殖贡献不同。区别在于：人工选择由人决定哪些个体更值得留下后代，自然选择则来自特定环境中存活与繁殖成功的差异。**人想要的性状，不一定最适合野外生存**。',
        ],
        rules: [
          {
            title: '前提：可遗传变异',
            text: '只有相关差异能传给后代，才可能获得稳定的遗传响应。营养充足造成的大体型、训练形成的肌肉等环境影响，不能直接当作某个有利等位基因的证据。比较亲本时，尽量控制饲养或种植条件。',
          },
          {
            title: '过程：选亲本、繁殖、再选择',
            text: '从有差异的群体中选取目标性状合适的亲本，使其繁殖，再从后代中继续选择，多代重复。后代仍可能有差异，尤其多基因性状不能简单套用单基因的固定比例。',
          },
          {
            title: '与自然选择的共同点',
            text: '两者都可以使不同遗传变异对下一代的贡献不同，从而改变群体的遗传组成。**选择本身不按需求创造新等位基因**；突变产生新的遗传变异，性生殖重新组合已有变异。',
          },
          {
            title: '与自然选择的不同点',
            text: '人工选择的繁殖机会由人的目标影响，例如更大果实；自然选择由环境中的生存与繁殖条件影响，例如疾病和食物竞争。环境没有预先设定的育种目标，也不保证生物最终变得“完美”。',
          },
          {
            title: '目标性状改善，不代表全部性状都改善',
            text: '高产、外形或生长速度可能按人的需求改变，但也可能伴随生育能力、抗病能力或动物福利方面的代价。要看题目给出的证据，不能把“人工选中”直接理解成“各方面更强”。',
          },
          {
            title: '少数亲本与近交会带来不同层面的风险',
            text: '反复使用少数亲本可能减少遗传多样性；近亲交配还会增加纯合程度，使某些有害隐性等位基因更容易表现。==近交不是凭空制造所有有害基因，而是可能让原本隐藏的隐性影响显现==。',
          },
          {
            title: '保留多样性，给未来的变化留下余地',
            text: '遗传背景过于相似的群体可能对某些疾病或环境变化具有共同弱点。引入无亲缘亲本、保留多个品系可以帮助保存可用变异，但不能保证抵抗任何疾病，也不能自动清除所有有害等位基因。',
          },
        ],
        pitfalls: [
          '把当代个体长得更大与群体经过多代遗传改变混在一起。',
          '认为人工选择就是基因工程，或者选择过的后代都是克隆。',
          '把高产等同于全面适应、把近交等同于一定产生新突变。',
        ],
        check: {
          question: '关于自然选择和选择育种，哪一句正确？',
          options: [
            '两者都由人确定亲本',
            '两者都会按需要产生指定突变',
            '两者都可以通过繁殖贡献不同改变群体的遗传组成',
            '两者都保证遗传多样性持续增加',
          ],
          answerIndex: 2,
          explanation:
            '共同机制是可遗传差异导致对后代的贡献不同。选择的条件不同，但都不能被描述为按需要制造突变，也都不保证多样性持续增加。',
        },
        examFocus: {
          goal: '解释遗传变化为什么需要跨代传递，并能同时评价育种收益与群体风险。',
          comparison: {
            title: '先区分操作对象与选择条件',
            columns: ['方式', '主要过程', '是否保证个体完全相同'],
            rows: [
              ['选择育种', '人选择亲本，经过繁殖和多代选择', '不保证；有性后代仍可有差异'],
              ['自然选择', '环境下的存活与繁殖成功不同', '不保证；种群仍可保留变异'],
              ['基因工程', '直接操作 DNA，例如加入目的基因', '不保证；取决于具体技术与对象'],
            ],
          },
          examples: breedingExamples,
          checklist: [
            '能把可遗传变异与环境造成的差异分开。',
            '能说明人工与自然选择的相同机制和不同条件。',
            '能解释多样性降低、近交与隐性有害性状的关系。',
          ],
        },
      },
      ['esat-b6', 'openstax-evolution'],
    ),
  ],
  sources: [
    {
      id: 'esat-b6',
      title: 'UAT-UK · ESAT Content Specification (2026/27)',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '内部核对 B6.1–B6.3 的范围；讲解、例题、变式及图解为原创。',
    },
    {
      id: 'openstax-biotechnology',
      title: 'OpenStax Biology 2e · Biotechnology',
      url: 'https://openstax.org/books/biology-2e/pages/17-1-biotechnology',
      note: '核对重组 DNA、载体、跨细胞表达及医疗应用边界；未转载教材文字与图片。',
    },
    {
      id: 'nih-stem-cells',
      title: 'NIH · Stem Cell Basics',
      url: 'https://stemcells.nih.gov/info/basics/stc-basics',
      note: '核对自我更新、分化范围、移植相容性及细胞功能要求；不提供个人医疗建议。',
    },
    {
      id: 'openstax-evolution',
      title: 'OpenStax Biology 2e · Understanding Evolution',
      url: 'https://openstax.org/books/biology-2e/pages/18-1-understanding-evolution',
      note: '核对人工选择与自然选择的共同机制及遗传变异的作用。',
    },
  ],
}
