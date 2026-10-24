// ESAT 第十三章有机化学讲义：把结构识别、官能团反应和原子守恒连接成可迁移的解题路径。
import type { KnowledgeLesson } from './types'

export const esatOrganicChemistry: KnowledgeLesson = {
  code: '141300',
  title: 'Carbon / Organic chemistry · 碳与有机化学',
  subtitle: '先找官能团，再看条件；用碳骨架追踪反应前后发生的变化',
  intro:
    '有机题看似结构多，主线只有三条：碳的四价决定结构，官能团决定主要反应，原子守恒连接数量。练习时不要只记产物名，圈出变化位置，再保留未变化的碳骨架。',
  memory: [
    '**碳四键、氢一键、氧通常两键。**骨架式的端点和转角代表碳，补氢到四价。',
    '**烷烃饱和、烯烃有 C=C。**非环单烯烃 CₙH₂ₙ；相同分子式也可能是环烷烃。',
    '**加成打开双键；取代替换原子；加聚连接双键碳。**不要把三种变化混为一谈。',
    '**醇的 –OH 不是 OH⁻。**伯醇可氧化为醛再到酸，仲醇到酮，条件决定产物。',
    '**酸 + 醇 ⇌ 酯 + 水。**酯的相对分子质量为酸与醇之和减 18。',
  ],
  sections: [
    {
      code: '141301',
      title: '有机化学通用概念',
      summary: '区分分子式、结构式与通式，用官能团和碳骨架辨认同分异构。',
      paragraphs: [
        '烃只含碳和氢；含氧的醇、羧酸属于有机物，但不是烃。碳通常形成四个共价键，可构成直链、支链和环；双键按两键计，三键按三键计，补氢时必须一起计算。',
        '分子式 molecular formula 说明各元素原子总数；结构式 structural formula 说明连接关系；显示式 displayed formula 显示各键；骨架式 skeletal formula 省略碳符号及连在碳上的氢。每个未标元素的转角、端点是碳；O、Cl 等显式标出的原子不是隐藏的碳。',
        '同系物 homologous series 具有相同官能团和相似化学性质，相邻成员常相差 CH₂。官能团是主要反应位置，例如 C=C、–OH、–COOH。结构异构体具有相同分子式，但原子连接方式不同，不能把旋转同一个结构得到的图重复计数。',
        '经验式只是最简原子比，通式只是某一类化合物的数量关系。非环、只有一个双键的烯烃均为 CₙH₂ₙ，碳氢质量百分比相同；要确定 n，通常还需相对分子质量或等效信息。',
        '原油是烃的重要来源，分馏按沸点范围把混合物分成不同馏分，是物理分离。对于相近结构的烃，碳链增长通常使沸点和黏度升高、挥发性降低、点燃更不容易；“更长”不等于“更容易燃烧”。裂解则是化学反应，例如 C₁₀H₂₂ → C₈H₁₈ + C₂H₄，短烷烃和烯烃的碳、氢总数都必须守恒。',
        '系统命名先找含目标官能团的主链，再从使双键或主官能团位次较小的一端编号。C1—C6 的词根依次是 meth-、eth-、prop-、but-、pent-、hex-；常用后缀分别为 -ane、-ene、-ol、-oic acid。读 but-2-ene 时，2 表示双键从第 2 个碳开始，而不是共有两个双键；支链名称与位次也要与结构对应。',
      ],
      rules: [
        {
          title: '读骨架式的顺序',
          text: '数端点与转角 → 标出多重键与杂原子 → 每个碳补足四价 → 合计分子式。',
        },
        {
          title: '通式要带适用条件',
          text: '非环饱和烷烃 CₙH₂ₙ₊₂；非环单烯烃 CₙH₂ₙ。环或额外双键都会改变氢数。',
        },
        {
          title: '同分异构不靠摆放方向区分',
          text: '正丁烷与 2-甲基丙烷同为 C₄H₁₀；把正丁烷左右翻转仍是同一个结构。',
        },
      ],
      pitfalls: [
        '见 CₙH₂ₙ就断定必为烯烃，忽略环。',
        '把骨架式的 O 当作另一个碳。',
        '把经验式当作唯一分子式。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-hydrocarbons'],
      examFocus: {
        goal: '先判断题目给的是哪种结构信息，再确认它能否唯一决定分子式。',
        pastPaperSummary:
          '真题将通式与质量分数、燃烧产物和加成信息结合，常要求判断“信息够不够”，而不只是认名称。',
        pastPaperPatterns: [
          {
            form: '最少信息确定分子式',
            description: '同一通式中质量分数可恒定，要额外用相对分子质量确定分子大小。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-003'],
          },
          {
            form: '多条结构证据交叉筛选',
            description: '燃烧确定碳数，加氢确定双键数，聚合物片段质量与支链信息进一步筛选结构。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q054'],
          },
          {
            form: '燃烧与加成反推原子组成',
            description: '依据氧耗量差、卤素质量分数或双键数建立守恒关系，而不是只套分子名称。',
            reference: '2020、2022、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-016',
              'ESAT_LEGACY_2022_NSAA_Q059',
              'NSAA_2023_S1-Q057',
            ],
          },
        ],
        examples: [
          {
            title: '为什么知道碳、氢百分比还不够',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'ESAT-2020-CHEMISTRY-003',
              why: '训练区分通式比例与实际分子大小。',
            },
            question: '',
            answer: 'B · 只需信息 3。',
            steps: [
              '直链且只有一个 C=C，通式为 CₙH₂ₙ。',
              '碳质量分数为 12n/(14n) = 6/7，氢为 1/7，均与 n 无关。',
              '所以碳、氢百分比只确认比例，不能区分乙烯、丙烯等不同大小分子。',
              '相对分子质量 Mᵣ = 14n，给出 Mᵣ即可确定 n，因此只需信息 3。',
            ],
            takeaway: '==比例信息不能自动变成大小信息==。',
          },
        ],
        checklist: ['能读分子式和骨架式。', '能识别官能团与同分异构。', '能说明通式的适用范围。'],
      },
    },
    {
      code: '141302',
      title: '烷烃',
      summary: '把饱和结构、燃烧配平与燃料应用串起来，留意水的物态。',
      paragraphs: [
        '烷烃是只有 C–C 单键的饱和烃。非环烷烃通式 CₙH₂ₙ₊₂：甲烷 methane CH₄、乙烷 ethane C₂H₆、丙烷 propane C₃H₈、丁烷 butane C₄H₁₀、戊烷 pentane C₅H₁₂、己烷 hexane C₆H₁₄。相邻成员相差 CH₂；直链结构可以写成 CH₃–(CH₂)ₙ₋₂–CH₃（n≥2）。',
        '随着链长增加，分子间作用通常增强，沸点和黏度总体升高、挥发性降低。分馏利用不同沸点范围分离原油馏分，不能把分馏说成裂解，也不能认为链长越长越容易点燃。',
        '完全燃烧生成 CO₂和 H₂O；先配碳、再配氢、最后配氧最稳妥。供氧不足可能生成 CO 或碳烟，CO 有毒；题目指定产物时必须按给定产物守恒，不能总写完全燃烧式。',
        '烷烃与卤素可在紫外光条件下发生取代：如 CH₄ + Cl₂ → CH₃Cl + HCl。碳骨架不需要先有双键；这与烯烃常温对溴的加成不同。实际取代可继续发生，不能把单一产物视作所有条件下的唯一结果。',
        '长链烃裂解可产生较短烷烃和烯烃，是化学变化；加热及催化条件与简单蒸馏不同。做计量题时先核对产物碳氢总数，再判断其中哪一种能够加成。',
      ],
      rules: [
        {
          title: '完全燃烧通式',
          text: 'CₙH₂ₙ₊₂ + (3n+1)/2 O₂ → nCO₂ + (n+1)H₂O。允许先用分数系数，再整体倍乘。',
        },
        {
          title: '气体总量分三份',
          text: '未反应的过量气体 + CO₂ + 仍为气态的水。高于沸点且题目说明为蒸气时不能漏水；冷却后按条件处理。',
        },
        {
          title: '反应条件区分类别',
          text: '紫外光卤化：取代；裂解：断成长短链组合；完全燃烧：与足量氧气生成 CO₂和 H₂O。',
        },
      ],
      pitfalls: [
        '把燃烧方程的氧原子数当成 O₂系数。',
        '求最终气体体积时漏剩余氧气或水蒸气。',
        '把裂解和分馏都解释为按沸点分离。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-hydrocarbons'],
      examFocus: {
        goal: '从烷烃结构出发配平燃烧，并正确处理气体物态与过量反应物。',
        pastPaperSummary:
          '已收录真题对烷烃主要采用燃烧计量：由耗氧量反推碳链，或计算高温下全部剩余气体。',
        pastPaperPatterns: [
          {
            form: '耗氧量反推烷烃',
            description: '同温同压体积比等于摩尔比，将耗氧系数与 (3n+1)/2 对应。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q055'],
          },
          {
            form: '燃烧后总气体体积',
            description: '先配平乙烷燃烧，扣掉耗氧，再加二氧化碳与仍为气态的水。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-012'],
          },
        ],
        pastPaperNote: '取代、分馏和裂解属于本节基础复习；当前收录年度题中未据此虚构独立考法频次。',
        examples: [
          {
            title: '650 : 100 的耗氧比对应哪种烷烃',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q055',
              why: '从气体比反推通式并回答题目真正要求的系数和。',
            },
            question: '',
            answer: 'D · 15.5。',
            steps: [
              '气体同温同压，1 体积烷烃消耗 6.5 体积 O₂，所以 a = 6.5。',
              '设烷烃 CₙH₂ₙ₊₂，耗氧系数 (3n+1)/2 = 6.5，解得 n = 4。',
              '方程为 C₄H₁₀ + 6.5O₂ → 4CO₂ + 5H₂O。',
              '题目问 a+b+c，不是碳数或氧系数：6.5+4+5=15.5。',
            ],
            takeaway: '==先反推结构，最后回到问题要求的量==。',
          },
        ],
        checklist: ['能写烷烃通式。', '能配平完全与指定不完全燃烧。', '能处理气态水与剩余氧气。'],
      },
    },
    {
      code: '141303',
      title: '烯烃',
      summary: '圈出每一个 C=C；加成多少试剂由双键数量决定。',
      paragraphs: [
        '烯烃含碳碳双键，属于不饱和烃。单个非环烯烃可用 CₙH₂ₙ，但环和多个双键要求重新数氢。双键中的一部分键可参与加成，两端碳各连接新增原子或基团。',
        '与氢加成形成更饱和的产物，通常使用镍等催化剂；与溴加成使溴的颜色消退；与蒸气在酸催化条件下加成可制醇。对每一个 C=C，完全加成通常分别消耗 1 mol H₂或 1 mol Br₂。',
        '烯烃还可与氢卤酸 HX 加成，例如 CH₂=CH₂ + HBr → CH₃CH₂Br：一端加 H，另一端加 Br，不能误画成加 Br₂得到的二溴产物。非对称烯烃可能涉及不同连接位置，按题目限定判断，不需要用反应机理猜未经说明的唯一产物。',
        'C2—C6 直链烯烃名称包括 ethene、propene、but-1-ene/but-2-ene、pent-1-ene/pent-2-ene、hex-1-ene/hex-2-ene/hex-3-ene。编号从靠近双键的一端开始，所以把同一结构反过来写不会创造“另一种”异构体。',
        '常温、无紫外光条件下，烯烃可使溴水褪色；饱和烷烃通常不发生同样快速的加成。检测结论要有条件，且不能把所有能使溴水褪色的物质都不加限制地判为烯烃。',
        '环上有两个双键的分子，每摩尔完全加成需 2 mol Br₂。若题目给液体体积和密度，要先 m = ρV，再 n = m/M，最后由溶液浓度求试剂体积。',
      ],
      rules: [
        {
          title: '画加成产物',
          text: '保持原碳骨架，把 C=C 改为 C–C，再把试剂的两部分分别接到两个原双键碳，最后检查碳四价。',
        },
        {
          title: '消耗量按双键数',
          text: '完全加成所需 n(Br₂) = 双键数 × n(有机分子)；若题目另给转化率，再乘转化比例。',
        },
        {
          title: '烯烃与烷烃的试剂条件',
          text: '烯烃溴加成通常不需紫外光；烷烃卤化取代通常需要光照条件，且会生成卤化氢。',
        },
      ],
      pitfalls: [
        '看到一个分子就只乘 1 mol Br₂。',
        '把 Br₂中的两个 Br 当成两份反应试剂。',
        '由 cm³算得试剂体积后忘记浓度使用 dm³。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-hydrocarbons'],
      examFocus: {
        goal: '用双键结构预测加成产物，并完成密度、摩尔数与溶液体积的换算。',
        pastPaperSummary:
          '真题既用结构和加成次数筛选分子，也将加成接到质量分数、键能和试剂用量。结构识别是计算的第一步。',
        pastPaperPatterns: [
          {
            form: '氢卤酸与卤素的加成产物辨析',
            description: 'HBr 只提供一个 Br，不能把丙烯与 HBr 的产物写成加 Br₂形成的二溴化合物。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q049'],
          },
          {
            form: '双键数量决定试剂量',
            description: '识别环上两个双键，按密度把样品体积转成摩尔数，再求溴溶液体积。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q057'],
          },
          {
            form: '加成后质量与结构限制',
            description: '结合溴的质量分数求产物质量，或结合加氢、燃烧、聚合线索选择结构。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q059', 'ESAT_LEGACY_2022_NSAA_Q054'],
          },
          {
            form: '加成反应接键能计算',
            description: '识别双键改为单键和新形成的键，计算氢化或水合过程的键能差。',
            reference: '2016、2023 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q054', 'NSAA_2023_S1-Q050'],
          },
        ],
        examples: [
          {
            title: '两个双键，溴溶液要用多少',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2023_S1-Q057',
              why: '从真实结构图读双键数，避免只做数值换算。',
            },
            question: '',
            answer: 'H · 0.0084 dm³。',
            steps: [
              '样品质量为 0.10 cm³ × 0.84 g cm⁻³ = 0.084 g。',
              '有机物物质的量为 0.084/80 = 0.00105 mol。',
              '结构有两个 C=C，所需 Br₂为 0.00210 mol；Br₂本身的下标 2 不再额外乘。',
              'V = n/c = 0.00210/0.250 = 0.00840 dm³，即 8.40 cm³，选 H。',
            ],
            takeaway: '==先数反应位置，再换算用量==。',
          },
        ],
        checklist: ['能画加成前后结构。', '能按双键数求试剂消耗。', '能解释溴水检验的条件。'],
      },
    },
    {
      code: '141304',
      title: '聚合物',
      summary: '加聚保留所有原子；缩聚连接官能团并释放小分子。',
      paragraphs: [
        '聚合物 polymer 由大量单体 monomer 连接而成。重复单元 repeating unit 是链中重复的最小结构片段，不一定等于图上任意截取的一整段。写括号时要有穿出两边的主链延伸键，并在括号外标 n。',
        '加成聚合中，烯烃的两个双键碳成为主链相邻碳；原来接在它们上的取代基保留。聚丁-1-烯重复单元为 –CH₂–CH(CH₂CH₃)–；不是把四个碳都强行排进主链，也不能保留原来的 C=C。',
        '缩合聚合需要每个单体有能继续连接的两个或更多官能团。例如二醇和二羧酸形成聚酯，连接处含 –COO–，并脱去水。加聚不损失小分子，缩聚要在重复单元和端基计数中考虑损失。',
        '二胺与二羧酸可缩合形成聚酰胺，连接处是 –C(=O)–NH–，不能把它画成聚酯的 –C(=O)–O–。一般结构可写成 [–NH–R–NH–CO–R′–CO–]ₙ。反推单体时沿酰胺键断开，含氮一端补回 –NH₂，含羰基一端补回 –COOH。',
        '氨基酸同时带有氨基和羧基，能通过肽键（酰胺键）形成多肽及蛋白质；肽链片段为 –NH–CH(R)–CO–，R 侧链保留。两个氨基酸形成一个肽键释放一分子水；由 N 个氨基酸形成一条无环线性链时形成 N−1 个肽键，不能漏掉端基。',
        '由聚合物反推单体：先定位主链及重复边界；对常见加聚物，将相邻两个主链碳恢复双键并保留侧链。聚酯则沿酯键断开，分别补回醇的 –OH 和羧酸的 –COOH。',
        '可生物降解 biodegradable 指可被微生物及其酶等生物作用分解；非生物降解材料在通常环境中不易被这些过程分解。能水解的酯键、酰胺键提供潜在断裂位置，但不代表每一种聚酯或聚酰胺在所有环境中都快速降解；也不能把光照碎裂或简单焚烧等同于生物降解。',
      ],
      rules: [
        {
          title: '加聚三步',
          text: '圈两个双键碳 → 双键变单键并接出两条延伸键 → 原取代基原位保留。',
        },
        {
          title: '质量是否改变取决于聚合类型',
          text: '加聚的重复单元原子组成等于单体；缩聚需扣除形成连接时离去的小分子，有限链还需考虑端基。',
        },
        {
          title: '环境影响看材料性质',
          text: '许多加聚塑料稳定且不易生物降解；回收要分离材料并考虑能耗，不能把“可燃烧”直接等同于无污染处理。',
        },
      ],
      pitfalls: [
        '把所有单体碳都放进聚合物主链。',
        '重复单元里仍保留被用于加聚的 C=C。',
        '对缩聚直接使用“单体质量×n”而不扣小分子。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-hydrocarbons', 'openstax-carbonyl'],
      examFocus: {
        goal: '准确画出和反推加聚重复单元，并区分加聚与缩聚的原子守恒。',
        pastPaperSummary:
          '直接考法集中在加聚重复单元的主链和侧链位置，也有把聚合物片段质量作为筛选单体的一条证据。',
        pastPaperPatterns: [
          {
            form: '由单体选择重复单元',
            description: '对末端或内部烯烃，保留双键碳各自的侧链，检查括号、延伸键和是否仍有双键。',
            reference: '2021、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q046', 'NSAA_2023_S1-Q042'],
          },
          {
            form: '重复单元质量与结构交叉判断',
            description: '给定三个重复单元的质量范围，同时满足燃烧碳数、加氢次数与支链信息。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q054'],
          },
        ],
        pastPaperNote:
          '现有题库另有聚酯重复单元和有限链脱水题；它们用于补足缩聚训练，不作为历年真题证据。',
        examples: [
          {
            title: '丁-1-烯的乙基侧链必须留下',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2023_S1-Q042',
              why: '直接考主链与侧链，是聚合结构最典型的失分点。',
            },
            question: '',
            answer: 'E',
            steps: [
              '先写丁-1-烯：CH₂=CH–CH₂–CH₃。前两个碳才是双键碳。',
              '加聚将前两个碳连接成主链；第一个带两个 H，第二个带 H 和乙基 –CH₂CH₃。',
              '得到重复单元 –CH₂–CH(CH₂CH₃)–，外加括号、两侧延伸键和 n。',
              '检查总碳数仍为 4、总氢数仍为 8，并排除保留双键或把侧链丢失的结构，选 E。',
            ],
            takeaway: '==加聚改变连接，不丢失侧链==。',
          },
        ],
        checklist: ['能画丁-1-烯重复单元。', '能由重复单元恢复单体。', '能区分加聚与缩聚。'],
      },
    },
    {
      code: '141305',
      title: '醇',
      summary: '把 –OH 的位置与反应条件一起读，区分氧化、燃烧和酯化。',
      paragraphs: [
        '醇含连在饱和碳上的羟基 –OH，常见例子为甲醇、乙醇、丙-1-醇、丙-2-醇。–OH 是共价基团，不等于溶液中游离的 OH⁻，所以“含 OH”不能推出“像 NaOH 一样呈强碱性”。',
        '非环饱和一元醇通式为 CₙH₂ₙ₊₁OH。C1—C6 直链醇的命名使用 methanol、ethanol、propan-、butan-、pentan-、hexan-；三碳及以上还要结合 -ol 前的位次读结构，例如 butan-2-ol 是 CH₃CH(OH)CH₂CH₃；hexan-1-ol 是 CH₃(CH₂)₅OH。优先给 –OH 较小位次，不把碳链反向重复计数。',
        '乙醇可由糖发酵，也可由乙烯与蒸气水合制得。发酵需要适合酶作用的温度和缺氧条件，产物较稀；工业水合是催化反应，不能混用两种制法的条件。',
        '伯醇可氧化为醛，再继续氧化为羧酸；及时蒸馏移走醛可限制进一步氧化，过量氧化剂并回流通常利于得到酸。仲醇可氧化为酮；常见温和氧化条件下叔醇不按同样方式氧化。酸化重铬酸盐由橙色变绿色是常见观察。',
        '醇与钠反应生成醇盐和 H₂；与羧酸在酸催化下形成酯和水。燃烧时还要计入醇本身已有的氧；如果题目指定 CO、CO₂共同生成，不得直接套完全燃烧。',
      ],
      rules: [
        {
          title: '氧化路线靠位置判断',
          text: '伯醇 → 醛 → 羧酸；仲醇 → 酮。先看连接 –OH 的那个碳，而不是整个分子总碳数。',
        },
        { title: '钠与醇的比例', text: '2ROH + 2Na → 2RONa + H₂；2 mol 单羟基醇对应 1 mol H₂。' },
        {
          title: '醇燃烧的氧来自两边',
          text: '先把 C、H 分配到指定产物，再从产物总氧数扣除醇自带的氧，剩余才由 O₂提供。',
        },
      ],
      pitfalls: [
        '把乙醇与钠的产物写成乙酸钠。',
        '忽略蒸馏与回流对进一步氧化的影响。',
        '计燃烧耗氧时忘记醇自带的氧原子。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-alcohols', 'openstax-carbonyl'],
      examFocus: {
        goal: '由醇结构和条件预测反应，并用原子守恒处理产物与耗氧量。',
        pastPaperSummary:
          '历年题把醇放进产物判断、钠反应质量变化、水合键能、燃烧热和不完全燃烧计量等不同情境，不能只记“醇会燃烧”。',
        pastPaperPatterns: [
          {
            form: '反应物与产物配对',
            description: '区分醇与金属、羧酸的反应及加成产物，逐行检查官能团改变。',
            reference: '2021、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q049', 'ESAT_LEGACY_2022_NSAA_Q049'],
          },
          {
            form: '与碱金属反应后的质量变化',
            description: '等质量金属产生不同摩尔数 H₂，敞口容器变化还要计入加入的金属质量。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-018'],
          },
          {
            form: '燃烧与能量或氧气用量',
            description: '热量题先处理能量传递效率；不完全燃烧题按指定 CO、CO₂比例及醇内氧守恒。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q055', 'NSAA_2023_S1-Q060'],
          },
          {
            form: '乙烯水合生成乙醇的键能',
            description: '比较反应前后真正改变的键，不重复计入两侧相同的键。',
            reference: '2016 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q054'],
          },
        ],
        examples: [
          {
            title: '丙醇自身的氧，也要计入燃烧守恒',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'NSAA_2023_S1-Q060',
              why: '把醇的结构与不完全燃烧连接，训练不会被熟悉方程误导。',
            },
            question: '',
            answer: 'C · 7.5 mol O₂。',
            steps: [
              '2 mol C₃H₇OH 含 6 mol C 原子、16 mol H 原子、2 mol O 原子。',
              'CO₂和 CO 等物质的量，共分配 6 mol C，因此各为 3 mol；氢生成 8 mol H₂O。',
              '产物共需氧原子 3×2 + 3×1 + 8×1 = 17 mol。',
              '醇已经提供 2 mol O，氧气需提供 15 mol O 原子，所以 n(O₂)=7.5 mol。',
            ],
            takeaway: '==有机物里的氧不能漏扣，氧原子数还要除以 2 才是 O₂==。',
          },
        ],
        checklist: [
          '能区分伯醇与仲醇氧化产物。',
          '能解释回流和蒸馏条件。',
          '能处理含氧有机物燃烧。',
        ],
      },
    },
    {
      code: '141306',
      title: '羧酸',
      summary: '–COOH 决定酸性；酯化要保留碳骨架，并扣除一分子水。',
      paragraphs: [
        '羧酸含 –COOH，既有 C=O 又有 O–H，但整个羧基必须作为一个官能团识别。甲酸、乙酸是常见例子；命名和计碳时，羧基中的碳也属于总碳数。',
        '饱和单羧酸可写成 CₙH₂ₙ₊₁COOH，注意总碳数是 n+1。C1—C6 直链羧酸依次为 methanoic acid HCOOH、ethanoic acid CH₃COOH、propanoic acid C₂H₅COOH、butanoic acid C₃H₇COOH、pentanoic acid C₄H₉COOH、hexanoic acid C₅H₁₁COOH；羧基碳从第 1 位计。',
        '羧酸成盐时失去羧基的酸性 H，形成 RCOO⁻，再按金属离子电荷配比。例如乙酸钠为 CH₃COONa，乙酸镁为 Mg(CH₃COO)₂；不能把醇与钠生成的 RO⁻盐写成羧酸盐。',
        '羧酸通常是弱酸，在水中部分电离；“弱”描述电离程度，不是浓度低，也不是无法完全中和碱。乙酸可使蓝色石蕊变红、与活泼金属生成 H₂、与碳酸盐生成 CO₂。',
        '羧酸与醇在酸催化下发生可逆酯化，生成酯和水。酸提供的含 C=O 片段与醇提供的烃基通过 –COO–连接；命名时要分清哪部分来自酸，哪部分来自醇。',
        '每形成一个酯键，普通酸醇酯化相对于反应物总组成失去一分子水。二羧酸有两个可中和的酸性氢，不能按所有羧酸都是一元酸处理；多官能团也为缩聚提供连续连接点。',
      ],
      rules: [
        {
          title: '酯化质量关系',
          text: '普通单羧酸与一元醇：Mᵣ(酯) = Mᵣ(酸) + Mᵣ(醇) − 18。反求酸时要把 18 加回。',
        },
        {
          title: '弱酸与中和总量',
          text: 'CH₃COOH + NaOH → CH₃COONa + H₂O；同摩尔一元酸完全中和需同摩尔 OH⁻，不因弱酸就自动少耗碱。',
        },
        {
          title: '平衡与催化剂',
          text: '增加反应物可改变平衡组成；催化剂加快达到平衡，不改变同温度下的平衡位置。',
        },
      ],
      pitfalls: [
        '计算羧酸碳数时漏掉 –COOH 的碳。',
        '把弱酸理解为同浓度时需要更少碱才能完全中和。',
        '由酯质量反求酸时再次减 18。',
      ],
      visual: 'organic-chemistry',
      sourceIds: ['uat-organic', 'openstax-carbonyl'],
      examFocus: {
        goal: '同时掌握羧酸的酸性反应和酯化组成，区分电离程度、反应总量与平衡。',
        pastPaperSummary:
          '真题围绕弱酸性质、二元羧酸滴定、酯化质量关系和平衡变化出题。同一个 –COOH 会进入不同计算链。',
        pastPaperPatterns: [
          {
            form: '弱酸性质与完全中和',
            description:
              '比较乙酸与盐酸的指示剂、碳酸盐反应和等浓度完全中和量，不能把弱酸当作无反应。',
            reference: '2017 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q039'],
          },
          {
            form: '羧基个数决定滴定比例',
            description: '乙二酸有两个酸性氢，按酸与 OH⁻的 1 : 2 比例求体积。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q053'],
          },
          {
            form: '酯化产物与相对分子质量',
            description: '读出酸醇组成及失去的水，反推未知酸的相对分子质量。',
            reference: '2021、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q049', 'ESAT_LEGACY_2022_NSAA_Q049'],
          },
          {
            form: '酯化平衡改变',
            description: '区分温度、加水、加醇与催化剂对平衡位置的作用。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q38'],
          },
        ],
        examples: [
          {
            title: '酯的质量不是酸与醇简单相加',
            source: {
              subject: 'chemistry',
              kind: 'annual',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q049',
              why: '用真实酯化情境突出失水和反求方向。',
            },
            question: '',
            answer: 'H · 74。',
            steps: [
              '丙醇 C₃H₈O 的 Mᵣ为 3×12+8+16=60。',
              '酯化由羧酸和醇生成酯及水，因此 116 = Mᵣ(酸)+60−18。',
              '反求 Mᵣ(酸)=116−60+18=74。',
              '把得到的 74 加回 60 并减 18，确实得到 116；反查可排除把水再次扣掉的错误。',
            ],
            takeaway: '==生成物少了水，反求反应物要把水加回==。',
          },
        ],
        checklist: [
          '能识别羧基及羧基中的碳。',
          '能区分弱酸与稀酸。',
          '能完成酯化质量和多元酸计量。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-organic',
      title: 'UAT-UK · ESAT Content Specification · C13',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/16150826/ESAT_Content_Specification_May2024.pdf',
      note: '与当前启用考纲的 C13 子要求对照：命名、烃性质、四类加成、聚酯与聚酰胺、醇及羧酸。',
    },
    {
      id: 'openstax-hydrocarbons',
      title: 'OpenStax Chemistry 2e · Hydrocarbons',
      url: 'https://openstax.org/books/chemistry-2e/pages/20-1-hydrocarbons',
      note: '核对碳骨架、烃的通式、异构和加成反应。',
    },
    {
      id: 'openstax-alcohols',
      title: 'OpenStax Chemistry 2e · Alcohols and Ethers',
      url: 'https://openstax.org/books/chemistry-2e/pages/20-2-alcohols-and-ethers',
      note: '核对醇官能团、发酵与乙烯水合。',
    },
    {
      id: 'openstax-carbonyl',
      title: 'OpenStax Chemistry 2e · Carboxylic Acids and Esters',
      url: 'https://openstax.org/books/chemistry-2e/pages/20-3-aldehydes-ketones-carboxylic-acids-and-esters',
      note: '核对羧酸、酯结构及官能团反应。',
    },
  ],
}
