// ESAT 化学第六章讲义：用粒子、成键和载流方式解释性质，并保存全量年度真题考法的来源映射。
import type { KnowledgeExamFocus, KnowledgeLesson } from './types'
import { chemicalBondingMethods } from './chemicalBondingMethods'

const examples = {
  '140601': [
    {
      title: '四个斑点，能断言恰好四种纯物质吗？',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'bank',
        questionCode: 'ESAT-CHEM-AI-20260809-0DC21D59CD31-R4',
        why: '用真实色谱图检验“检出多个组分”和“已经知道全部组成”的区别。',
      },
      answer: 'D：在这组色谱条件下，至少检出了四种组分。',
      steps: [
        '先读原图：样品经二维色谱展开后出现 **4 个分开的斑点**。在本题的分离模型中，不同位置的斑点提供不同组分的证据，因此样品不是只有一种物质。',
        '一个斑点不一定只含一种物质：若两种组分在这套条件下共同迁移，它们可能重叠。因而“4 个斑点”给出的是**至少 4 种被检出的组分**，不是完整组分数。',
        '色谱位置本身也不告诉我们所有组分的化学式，更不能证明每种组分都是化合物。判断时保留题干的条件词 **under these chromatographic conditions**。',
      ],
      optionNotes: [
        'A：把“至少四种被检出组分”升级为“恰好四种纯化合物”，证据不足。',
        'B：本图中已分开的斑点不能一概说成同一种化合物。',
        'C：一次分离并不等于完整组成已全部确定，还可能有重叠或未检出组分。',
        'D：保留“至少”和“本次条件”的边界，与观察相符。',
        'E：换溶剂会改变分离情况，不能保证在每种体系中都出现四个斑点。',
      ],
      takeaway:
        '==观察证明到哪一步，结论就停在哪一步==。多个已分开组分可证明混合物；斑点个数不自动给出每个组分的身份。',
    },
  ],
  '140602': [
    {
      title: '从原子序数到离子、键型和氧化物',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'NSAA_2017_S1-Q042',
        why: '同一行同时检查化学式、成键类型和性质，训练先由电子排布判断常见离子。',
      },
      answer: 'C：XO；ionic；basic。',
      steps: [
        '原子序数 20 对应钙。中性钙的电子排布为 **2,8,8,2**，常见成离子过程是失去 2 个外层电子，形成 Ca²⁺；氧通常得到 2 个电子形成 O²⁻。',
        '失去与得到电子后，两种离子都具有相应稀有气体的电子排布，但原子核没有变；它们仍是钙离子与氧离子，并没有变成稀有气体元素。',
        '把电荷配平：一个 X²⁺ 与一个 O²⁻ 的总电荷为零，因此最简式为 **XO**。相反电荷离子之间的静电吸引形成离子键，不能因最终排布稳定就称为共价分子。',
        '本题还联考氧化物酸碱性：CaO 可与酸反应生成盐和水，是碱性氧化物。把三列合起来核验，只有 C 全部符合；这里不把“所有金属氧化物都呈碱性”当通则。',
      ],
      optionNotes: [
        'A：键型和碱性符合，但 X₂O 不能使 X²⁺ 与 O²⁻ 的总电荷为零。',
        'B：X₂O 的配比不对，且把钙的简单氧化物判成共价物质。',
        'C：XO 的电荷抵消、离子键及碱性三项均符合。',
        'D：虽然 XO 正确，但共价和酸性两列不符。',
        'E：XO₂ 的配比不对，酸性也不符。',
        'F：XO₂、共价和酸性均不符合钙的简单氧化物。',
        'G：X₂O₃ 对应另一种电荷配比，不是本题 X²⁺ 的氧化物。',
        'H：X₂O₃、共价和酸性均不能通过本题核验。',
      ],
      takeaway:
        '==中性排布 → 常见离子 → 电荷配比 → 结构与性质==。得到稳定排布只是成键的线索，不能跳过具体元素和电荷。',
    },
  ],
  '140603': [
    {
      title: '形成了离子，固体就能导电吗？',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'bank',
        questionCode: 'CHEM-MOCK-ADAPT-E04-025-R8-FINAL-20260818',
        why: '原图把电子转移与物态导电放在一起，检查“有电荷”与“电荷能移动”两个条件。',
      },
      answer: 'E：只有 I 和 II 正确。',
      steps: [
        '按原图追踪两支电子转移箭头：一个 Mg 原子失去 2 个电子，两个 Cl 原子各得到 1 个电子。因此得到 **Mg²⁺ + 2Cl⁻**，I、II 都正确。',
        '三个离子的总电荷为 +2 − 1 − 1 = 0，对应化学式 MgCl₂。电子转移说明离子怎样形成；真正维持晶体的是相反电荷间的静电吸引。',
        '再读状态限定词 **solid**。固体晶格中的离子只能在各自位置附近振动，不能穿过样品定向迁移，因此 III 所说的固体导电原因不成立。',
        '只有熔融或溶于水并形成可移动离子时，离子才可传递电荷。把 I、II 真、III 假与选项组合对应，选 E。',
      ],
      optionNotes: [
        'A：漏掉正确的两项离子电荷判断。',
        'B：I 正确，但两个氯原子各得一个电子，II 也正确。',
        'C：II 正确，但镁失去两个电子，I 也正确。',
        'D：只保留错误的固态导电判断。',
        'E：保留 I、II，排除 III，组合正确。',
        'F：误选 III，并遗漏 II。',
        'G：误选 III，并遗漏 I。',
        'H：把“存在离子”当成“离子可以穿过固体移动”，多选 III。',
      ],
      takeaway:
        '导电题连续问两句：==谁带电？在这个状态下能否移动？== 不要只看到正负号就判定能导电。',
    },
  ],
  '140604': [
    {
      title: '“只有单共价键”比“有共价键”更严格',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'NSAA_2019_S1-Q038',
        why: '比较三种固体，练习区分巨型网络、离域电子与离子结构，并注意 only。',
      },
      answer: 'C：只有 2，SiO₂。',
      steps: [
        '题干不是问“哪些物质有共价键”，而是问 **single covalent bonds only**。必须检查整个固体的成键，而不能只找到局部的一条共价键。',
        'SiO₂ 中，每个 Si 与 4 个 O 形成单共价键，每个 O 桥联 2 个 Si，连接成连续的巨型网络；本题的基础结构模型满足陈述 2。',
        '石墨的每个 C 与 3 个相邻 C 相连，同时有离域电子参与片层内成键，层间还有较弱作用。不能把整个石墨固体描述为“只有局域单共价键”，所以 1 不符合。',
        'Al₂O₃ 在本题的结构分类中主要是离子晶体，不能因为化学式写得像一个整体就把它看成只有单共价键的分子。3 不符合，因此只选 2。',
      ],
      optionNotes: [
        'A：漏掉满足条件的 SiO₂。',
        'B：把石墨简化成只有局域单共价键的结构。',
        'C：只保留 SiO₂，符合 only 的完整限制。',
        'D：把 Al₂O₃ 的主要离子结构误判为单共价键网络。',
        'E：SiO₂ 符合，但额外纳入了不符合 only 的石墨。',
        'F：同时纳入两项不符合条件的固体。',
        'G：SiO₂ 符合，但多选 Al₂O₃。',
        'H：只检查“固体”或“存在成键”，没有区分具体键型。',
      ],
      takeaway:
        '==化学式不是结构图==。SiO₂ 不是独立的 O—Si—O 小分子；“石墨有共价键”也不等于“石墨只有单共价键”。',
    },
  ],
  '140605': [
    {
      title: '金属图里的大颗粒、小颗粒各是谁？',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'bank',
        questionCode: 'CHEM-MOCK-ADAPT-E03-013-R8-FINAL-20260818',
        why: '直接使用原图 P、Q 标签识别金属正离子和离域电子，说明固态导电的载流者。',
      },
      answer: 'A：P 为正离子，Q 为离域电子，移动载流的是 Q。',
      steps: [
        '先读图的语境 **solid metal**。大颗粒 P 规则排列，是金属键模型中的正离子实；它包括原子核和未离域的内层电子，不是裸露质子。',
        '小颗粒 Q 位于这些位置之间，表示在整个金属中离域的外层电子。它们不局限在两个原子之间，也不是另一套阴离子晶格。',
        '固态金属导电时，离域电子可在电场下产生定向运动；正离子仍主要在晶格位置附近振动。因而移动载流的标签是 Q。',
        '把 P 的电荷、Q 的身份、实际移动的粒子逐列检查，只有 A 同时正确。',
      ],
      optionNotes: [
        'A：正离子晶格、离域电子和电子载流三项都正确。',
        'B：P 不是该模型中的中性原子，Q 不是质子；导电也不是正离子穿过固体。',
        'C：晶格大颗粒不是阴离子，固态导电者也不是 P。',
        'D：P 的身份正确，但电子应离域，载流者是 Q 而非 P。',
        'E：金属不是独立分子排列，Q 也不是正离子。',
      ],
      takeaway: '==金属固体靠电子，离子熔体靠离子==。先辨物质结构与物态，再回答谁在移动。',
    },
  ],
  '140606': [
    {
      title: '沸腾时跨过的是分子之间，还是分子内部？',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'ESAT_LEGACY_2018_NSAA_Q46',
        why: '原题明确比较液态分子之间的作用，借此排除“沸腾断开 P—Cl 共价键”的解释。',
      },
      answer: 'C：只有 2 正确。',
      steps: [
        '先按原题给定的数据和**液态分子比较模型**分析：题目要解释 PCl₃ 与 PCl₅ 的沸点差别，不是在问它们发生分解反应所需的能量。',
        '在该模型中，沸腾使分子彼此分离，主要克服分子间作用力，不能把分子内 P—Cl 共价键的数量或强弱直接当作沸点的解释。因此 1、3 都不成立。',
        '较高的给定沸点对应需要克服更强的分子间作用，陈述 2 正确。不是“每多一条共价键，沸点就一定升高”，而是先确定正在克服哪一种作用。',
        '最后保留范围：PCl₅ 的结构会随物态变化，固态可采用离子结构；本题的液态分子解释不能外推成“PCl₅ 在所有状态都由相同独立分子构成”。',
      ],
      optionNotes: [
        'A：遗漏正确的分子间作用力解释 2。',
        'B：把沸腾解释成断开更多分子内共价键，1 不成立。',
        'C：只选 2，使用了与题目过程相符的作用力。',
        'D：3 仍把分子内键强当作本题沸点差的原因。',
        'E：2 正确，但不应同时纳入 1。',
        'F：1、3 均混淆分子内与分子间作用，并遗漏 2。',
        'G：2 正确，但多选 3。',
        'H：没有排除两项“沸腾断分子内键”的解释。',
      ],
      takeaway:
        '解释熔沸点先补一句：==这一过程要克服什么吸引？== 分子物质、离子晶体和巨型共价网络的答案不同。',
    },
  ],
  '140607': [
    {
      title: '纯物质不导电，为什么溶于水却导电？',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'ESAT_LEGACY_2022_NSAA_Q043',
        why: '联合低熔沸点、纯态导电和水溶液导电三组证据，避免凭一项性质猜结构。',
      },
      answer: 'C：hydrogen chloride，HCl。',
      steps: [
        '先读原表中的低熔点 −114°C、低沸点 −85°C，以及纯物质固态和液态导电差。这组特征支持小分子物质，而不支持常见盐类的强离子晶格。',
        '因此先排除 NH₄Cl、BaCl₂ 和 KCl。NH₄Cl 虽然所有元素都是非金属，整体仍由 NH₄⁺ 与 Cl⁻ 构成离子晶体，不能套“没有金属就一定是分子”的口诀。',
        '再看入水后的变化：HCl 与水形成可移动的 H₃O⁺ 和 Cl⁻（题目常简写为 H⁺ 与 Cl⁻），水溶液可导电。纯 HCl 中的共价键类型，不能由其水溶液导电反推成离子晶体。',
        'CCl₄ 也属于分子物质，但难溶于水且不会像 HCl 那样产生大量离子，不能满足水溶液导电良好的线索。HCl 与全部证据一致。',
      ],
      optionNotes: [
        'A：NH₄Cl 是离子晶体，不符合极低熔沸点与纯液体不导电的整组特征。',
        'B：BaCl₂ 的离子晶格不符合所给低熔点。',
        'C：纯态小分子、入水形成可移动离子，两阶段都符合。',
        'D：KCl 是离子晶体，熔融后可由离子载流，不符合原表。',
        'E：CCl₄ 不能通过在水中形成大量离子来满足良好导电这一条件。',
      ],
      takeaway:
        '把证据按状态分栏：==纯固体 / 纯液体 / 水溶液==。水可以改变粒子的存在形式，不能只用“是否导电”一句话概括所有状态。',
    },
  ],
} satisfies Record<string, KnowledgeExamFocus['examples']>

export const esatChemicalBonding: KnowledgeLesson = {
  code: '140600',
  title: '化学键、结构与性质',
  subtitle: 'Chemical bonding, structure and properties',
  intro:
    '先确定样品中是什么粒子，再看它们怎样连接、哪些电荷可以移动。熔点、硬度与导电不再是零散记忆，而是同一幅微观结构图的不同结果。',
  memory: [
    '分类看组成：同一种元素不一定只有单原子；一种化合物也可能含多种离子。',
    '成键看吸引：异号离子、共享电子对与原子核、正离子与离域电子。',
    '熔沸看要克服哪一种作用；导电看有没有可移动的带电粒子。',
    '小分子与巨型结构分开，固态、熔融态与水溶液分开。',
  ],
  sections: [
    {
      code: '140601',
      title: '元素、化合物与混合物',
      summary: chemicalBondingMethods['140601'].summary,
      paragraphs: [chemicalBondingMethods['140601'].intro],
      memory: chemicalBondingMethods['140601'].memory,
      rules: chemicalBondingMethods['140601'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '看见两个不同颜色的球就判混合物，忽略它们是否已经化学结合。',
        '把任何双原子分子都叫化合物。',
        '把纯离子晶体中的正、负离子误当成两种独立物质混合。',
      ],
      sourceIds: ['uat-c6', 'openstax-classification'],
      visual: 'chemical-bonding',
      examFocus: {
        goal: '用物质组成与实际证据分类，而不是凭粒子个数或图形外观。',
        pastPaperSummary:
          '已收录真题在色谱综合题中要求先找出只含一种物质的样品，再进行后续读图；判纯与计算迁移比例是两个步骤。',
        pastPaperPatterns: [
          {
            form: '先筛纯净样品，再读分离数据（综合）',
            description:
              '从多组色谱中筛选只含一种物质的样品，再比较斑点与流动相的关系或计算 Rf；题干是否保证组分完全分开，会影响纯度结论。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q039'],
          },
        ],
        pastPaperNote:
          '全量 153 道年度化学题中，本点的明确分类考查较少；仅出现“混合物”一词、实际只计算 Rf 或配比的题，未计作本点考法。',
        examples: examples['140601'],
        checklist: [
          '能区分元素、单质分子与化合物。',
          '能解释纯 NaCl 为什么不是混合物。',
          '能说明观察结果支持的结论及其边界。',
        ],
      },
    },
    {
      code: '140602',
      title: '稀有气体结构与成键类型',
      summary: chemicalBondingMethods['140602'].summary,
      paragraphs: [chemicalBondingMethods['140602'].intro],
      memory: chemicalBondingMethods['140602'].memory,
      rules: chemicalBondingMethods['140602'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把离子与等电子稀有气体当成同一元素。',
        '把“常见”稳定排布写成所有成键的绝对条件。',
        '只按金属/非金属口诀分类，不检查复合离子或巨型结构。',
      ],
      sourceIds: ['uat-c6', 'openstax-ionic', 'openstax-covalent'],
      visual: 'chemical-bonding',
      examFocus: {
        goal: '由电子排布预测常见成键行为，并识别规律的适用边界。',
        pastPaperSummary:
          '真题会把原子位置、稳定排布和物质结构串成多陈述判断，也会用“所有产物都具有稀有气体排布”或“惰性气体是催化剂”制造干扰。',
        pastPaperPatterns: [
          {
            form: '原子位置 → 离子或分子结构',
            description:
              '由原子序数、周期族信息识别元素，再推常见氧化物或氯化物的配比与成键类型；同一题可能还联考氧化还原或酸碱性质。',
            reference: '2017、2020 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q042', 'ESAT-2020-CHEMISTRY-008'],
          },
          {
            form: '稳定排布用于定位，但不能无条件外推',
            description:
              '从距稀有气体排布所差的电子数定位元素，或核验不同电荷的离子、电解后生成的金属原子是否真的具有稀有气体排布；需区分原子、离子及具体元素。',
            reference: '2016、2021、2023 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q038', 'ESAT_LEGACY_2021_NSAA_Q042', 'NSAA_2023_S1-Q047'],
          },
          {
            form: '由低反应性解释用途（综合）',
            description: '在金属提取条件中判断氩气气氛的作用，区分避免副反应的保护环境与催化作用。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q049'],
          },
        ],
        examples: examples['140602'],
        checklist: [
          '能说明 He 与 Ne/Ar 的外层规则。',
          '能由常见元素组合提出合理成键模型。',
          '能区分稳定电子排布、元素身份与化学惰性。',
        ],
      },
    },
    {
      code: '140603',
      title: '离子键',
      summary: chemicalBondingMethods['140603'].summary,
      paragraphs: [chemicalBondingMethods['140603'].intro],
      memory: chemicalBondingMethods['140603'].memory,
      rules: chemicalBondingMethods['140603'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '只说“电子转移就是离子键”，漏掉维持结构的静电吸引。',
        '把 SO₄²⁻ 拆成五个离子，或漏掉复合离子外的括号。',
        '把固体中存在离子等同于能导电，或把熔体载流者写成电子。',
      ],
      sourceIds: ['uat-c6', 'openstax-ionic', 'openstax-solids'],
      visual: 'chemical-bonding',
      examFocus: {
        goal: '从电荷写式、从晶格解释物性，并把离子配比用于后续反应计算。',
        pastPaperSummary:
          '常见题路是“电荷或名称 → 化学式 → 后续判断”。另一类直接利用固态、熔融态与溶液的导电差异，检查载流粒子的身份。',
        pastPaperPatterns: [
          {
            form: '常见电荷与复合离子配比辨错',
            description:
              '根据族别、离子名称或已给电荷，构造中性化学式；检查括号、最简下标和罗马数字，不能把分子名称或经验下标当作电荷。',
            reference: '2017、2019、2020、2022、2023 NSAA',
            sourceCodes: [
              'NSAA_2017_S1-Q042',
              'NSAA_2017_S1-Q043',
              'NSAA_2019_S1-Q045',
              'ESAT-2020-CHEMISTRY-005',
              'ESAT-2020-CHEMISTRY-015',
              'ESAT_LEGACY_2022_NSAA_Q042',
              'ESAT_LEGACY_2022_NSAA_Q050',
              'NSAA_2023_S1-Q052',
            ],
          },
          {
            form: '由离子组成补式，再进行定量（综合）',
            description:
              '题目未给出所需化学式时，先由常见离子电荷写出盐、氢氧化物、氧化物或水合物的组成，再确定质量、产气及中和比例。只把已给化学式代入计算的题不归入本类。',
            reference: '2016—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q046',
              'NSAA_2016_S1-Q050',
              'NSAA_2016_S1-Q051',
              'NSAA_2016_S1-Q052',
              'NSAA_2017_S1-Q039',
              'NSAA_2017_S1-Q044',
              'NSAA_2017_S1-Q050',
              'ESAT_LEGACY_2018_NSAA_Q48',
              'ESAT_LEGACY_2018_NSAA_Q50',
              'ESAT_LEGACY_2018_NSAA_Q52',
              'ESAT_LEGACY_2018_NSAA_Q53',
              'NSAA_2019_S1-Q040',
              'NSAA_2019_S1-Q052',
              'ESAT-2020-CHEMISTRY-013',
              'ESAT-2020-CHEMISTRY-017',
              'ESAT-2020-CHEMISTRY-019',
              'ESAT-2020-CHEMISTRY-020',
              'ESAT_LEGACY_2021_NSAA_Q052',
              'ESAT_LEGACY_2021_NSAA_Q053',
              'ESAT_LEGACY_2021_NSAA_Q057',
              'ESAT_LEGACY_2021_NSAA_Q058',
              'ESAT_LEGACY_2022_NSAA_Q046',
              'ESAT_LEGACY_2022_NSAA_Q048',
              'ESAT_LEGACY_2022_NSAA_Q056',
              'ESAT_LEGACY_2022_NSAA_Q058',
              'NSAA_2023_S1-Q049',
              'NSAA_2023_S1-Q054',
              'NSAA_2023_S1-Q056',
              'NSAA_2023_S1-Q059',
            ],
          },
          {
            form: '晶格与溶液中的粒子身份',
            description:
              '识别固体、熔体和水溶液的载流者；或把一份化学式拆成若干完整离子，判断离子总量及沉淀反应，而不把离子内的原子逐个当离子。',
            reference: '2016、2021—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q038',
              'ESAT_LEGACY_2021_NSAA_Q044',
              'ESAT_LEGACY_2022_NSAA_Q043',
              'NSAA_2023_S1-Q044',
              'NSAA_2023_S1-Q045',
            ],
          },
        ],
        examples: examples['140603'],
        checklist: [
          '能按电荷写出简单盐与复合离子盐的最简式。',
          '能说明固体与熔体导电差别。',
          '能区分电子转移、离子形成与离子键。',
        ],
      },
    },
    {
      code: '140604',
      title: '共价键',
      summary: chemicalBondingMethods['140604'].summary,
      paragraphs: [chemicalBondingMethods['140604'].intro],
      memory: chemicalBondingMethods['140604'].memory,
      rules: chemicalBondingMethods['140604'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把共享的一对电子只算给其中一个原子，或把总电子数重复计数。',
        '见到共价物质就断言熔点低、不导电，忽略巨型结构和石墨。',
        '把双键误当一条单键，或把 SiO₂ 画成离散三原子分子。',
      ],
      sourceIds: ['uat-c6', 'openstax-covalent', 'openstax-lewis', 'openstax-solids'],
      visual: 'chemical-bonding',
      examFocus: {
        goal: '读出共享电子、局部键型和整体结构，并在综合题中准确数键。',
        pastPaperSummary:
          '真题既比较分子与巨型结构，也把单、双、三键的识别嵌入能量或有机结构题。先画对连接，再做下一步，不能只按化学式数元素符号。',
        pastPaperPatterns: [
          {
            form: '判断哪些物质或过程涉及共价键',
            description:
              '比较反应前后的成键类型，或在多个固体中筛选满足“仅含某类键”的结构；only 等限定词要求检查整个结构。',
            reference: '2016、2019、2020 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q039', 'NSAA_2019_S1-Q038', 'ESAT-2020-CHEMISTRY-008'],
          },
          {
            form: '小分子与巨型网络的性质分辨',
            description:
              '从熔沸点、纯态和溶液导电，或熔化时需要克服的作用识别结构；不能把分子间力套到连续的共价网络上。',
            reference: '2018、2021—2023 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q46',
              'ESAT_LEGACY_2021_NSAA_Q044',
              'ESAT_LEGACY_2022_NSAA_Q043',
              'NSAA_2023_S1-Q046',
            ],
          },
          {
            form: '按结构数单、双、三键，再进入能量计算（综合）',
            description:
              '先确定每个反应物和产物中的键型与键数，再按方程系数计数；双键、三键与相同元素之间的单键不能互相替代。',
            reference: '2016、2017、2019、2021、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q054',
              'NSAA_2017_S1-Q049',
              'NSAA_2019_S1-Q053',
              'ESAT_LEGACY_2021_NSAA_Q055',
              'NSAA_2023_S1-Q050',
            ],
          },
          {
            form: '结构式连接与双键位置（有机综合）',
            description:
              '读出双键位置、分子中的双键个数及反应后的连接变化，再判加成产物、聚合重复单元或所需试剂量；有机反应规则另在相应章节展开。',
            reference: '2019、2021—2023 NSAA',
            sourceCodes: [
              'NSAA_2019_S1-Q037',
              'ESAT_LEGACY_2021_NSAA_Q046',
              'ESAT_LEGACY_2021_NSAA_Q049',
              'ESAT_LEGACY_2022_NSAA_Q054',
              'NSAA_2023_S1-Q042',
              'NSAA_2023_S1-Q057',
            ],
          },
        ],
        examples: examples['140604'],
        checklist: [
          '能画常见小分子的价电子点叉图。',
          '能区分小分子与巨型共价结构。',
          '能从结构图准确数出单、双、三键及其连接。',
        ],
      },
    },
    {
      code: '140605',
      title: '金属键',
      summary: chemicalBondingMethods['140605'].summary,
      paragraphs: [chemicalBondingMethods['140605'].intro],
      memory: chemicalBondingMethods['140605'].memory,
      rules: chemicalBondingMethods['140605'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把离域电子画成固定在一个原子旁的电子对。',
        '认为固态金属导电是正离子不断越过晶格位置。',
        '把导电或高熔点单独当成金属结构的充分证据。',
      ],
      sourceIds: ['uat-c6', 'openstax-solids'],
      visual: 'chemical-bonding',
      examFocus: {
        goal: '从金属模型解释载流与延展，并区分相似但不同的结构。',
        pastPaperSummary:
          '年度题主要把金属导电和其他结构放在同一组判断中，要求分清可移动电子与可移动离子；精选题库图题用于补足正离子、离域电子的直接识图。',
        pastPaperPatterns: [
          {
            form: '跨结构比较载流方式',
            description:
              '比较金属钠与氯化钠等不同结构的物性，区分可移动电子与可移动离子；必须同时注明物质类型和状态。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q044'],
          },
          {
            form: '排除不适用的金属模型',
            description:
              '在解释高熔点的选项中，判断目标物是否真的由金属正离子与离域电子构成，不能把金属模型套给巨型共价网络。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q046'],
          },
        ],
        pastPaperNote:
          '本批年度题没有直接要求画金属晶格或解释合金滑移；这些仍按官方考纲的结构与物性要求学习，图解练习不冒充历年真题。',
        examples: examples['140605'],
        checklist: [
          '能指出金属图中的正离子实与离域电子。',
          '能解释固态导电与受力延展。',
          '能区分金属、石墨和离子熔体的载流者。',
        ],
      },
    },
    {
      code: '140606',
      title: '分子间作用力',
      summary: chemicalBondingMethods['140606'].summary,
      paragraphs: [chemicalBondingMethods['140606'].intro],
      memory: chemicalBondingMethods['140606'].memory,
      rules: chemicalBondingMethods['140606'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把沸腾解释成断开分子内所有共价键。',
        '用“分子量大”替代对结构、极性和作用力的分析。',
        '把水的 O—H 共价键叫氢键，或把巨型结构称为分子间力很强。',
      ],
      sourceIds: ['uat-c6', 'openstax-forces', 'openstax-solids'],
      visual: 'chemical-bonding',
      examFocus: {
        goal: '用过程与结构锁定作用力，正确解释熔沸点比较。',
        pastPaperSummary:
          '真题会直接让你排除“沸腾断共价键”的说法，也会把卤素沸点趋势或分子物质低熔沸点嵌入综合判断。先判结构，比先背大小顺序更稳。',
        pastPaperPatterns: [
          {
            form: '沸点差：分子内还是分子间',
            description:
              '比较相近分子物质的给定沸点，识别真正需要克服的作用；共价键数量或强弱不能直接替代分子间作用力的解释。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q46'],
          },
          {
            form: '卤素物态与沸点嵌入多陈述题',
            description:
              '在反应性、元素身份和化合物组成的组合判断中单独核对卤素沸点趋势，避免把反应性与物理性质的方向混为一谈。',
            reference: '2018、2020 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q48', 'ESAT-2020-CHEMISTRY-001'],
          },
          {
            form: '由物性反推是否存在独立分子',
            description:
              '利用低熔沸点与导电证据筛小分子物质，或在巨型结构题中排除“分子间力很强”的解释。',
            reference: '2021—2023 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2021_NSAA_Q044',
              'ESAT_LEGACY_2022_NSAA_Q043',
              'NSAA_2023_S1-Q046',
            ],
          },
        ],
        examples: examples['140606'],
        checklist: [
          '能区分分子内键与分子间力。',
          '能按结构解释普通物态变化。',
          '能说明卤素趋势的比较范围，而不泛化到所有物质。',
        ],
      },
    },
    {
      code: '140607',
      title: '结构、成键与物理性质',
      summary: chemicalBondingMethods['140607'].summary,
      paragraphs: [chemicalBondingMethods['140607'].intro],
      memory: chemicalBondingMethods['140607'].memory,
      rules: chemicalBondingMethods['140607'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把石墨导电归因于可移动离子，或把金刚石硬度归因于分子间力。',
        '由水溶液能导电就断言原物质一定是离子晶体。',
        '只看熔点或只看导电一项，就决定全部结构。',
      ],
      sourceIds: ['uat-c6', 'openstax-solids', 'openstax-forces'],
      visual: 'chemical-bonding',
      examFocus: {
        goal: '联合物性数据识别结构，并给出粒子层面的解释。',
        pastPaperSummary:
          '跨年的共通套路是让几种不同结构同时出现：用熔沸点缩小范围，再用固、液、水溶液导电区分。解释高熔点时，作用力名称必须与实际结构一致。',
        pastPaperPatterns: [
          {
            form: '同一物质不同状态的导电反差',
            description:
              '比较固体、熔体和水溶液的导电性，识别载流粒子是否可以移动，以及入水是否产生了新的离子。',
            reference: '2016、2021、2022 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q038',
              'NSAA_2016_S1-Q049',
              'ESAT_LEGACY_2021_NSAA_Q044',
              'ESAT_LEGACY_2022_NSAA_Q043',
            ],
          },
          {
            form: '结构分类与多条物性共同筛选',
            description:
              '把分子、巨型共价、离子和金属结构放在同一组性质或选项中比较，核验每个候选是否同时满足全部条件。',
            reference: '2019、2021、2022 NSAA',
            sourceCodes: [
              'NSAA_2019_S1-Q038',
              'ESAT_LEGACY_2021_NSAA_Q044',
              'ESAT_LEGACY_2022_NSAA_Q043',
            ],
          },
          {
            form: '高熔沸点的微观解释',
            description:
              '判断熔化或沸腾时主要破坏的是分子间作用还是连续网络中的共价连接；不把金属、离子或分子模型混套。',
            reference: '2018、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q46', 'NSAA_2023_S1-Q046'],
          },
        ],
        examples: examples['140607'],
        checklist: [
          '能用完整因果链解释熔沸点和导电。',
          '能对比金刚石、石墨与 SiO₂。',
          '能把纯物质和其水溶液的性质分别判断。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-c6',
      title: 'UAT-UK · ESAT Content Specification — C6',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对第六章成键、复合离子、结构与物性范围。',
    },
    {
      id: 'openstax-classification',
      title: 'OpenStax Chemistry 2e · Phases and Classification of Matter',
      url: 'https://openstax.org/books/chemistry-2e/pages/1-2-phases-and-classification-of-matter',
      note: '核对元素、化合物、纯物质与混合物的区别。',
    },
    {
      id: 'openstax-ionic',
      title: 'OpenStax Chemistry 2e · Ionic Bonding',
      url: 'https://openstax.org/books/chemistry-2e/pages/7-1-ionic-bonding',
      note: '核对离子形成、电荷和稳定排布的适用边界。',
    },
    {
      id: 'openstax-covalent',
      title: 'OpenStax Chemistry 2e · Covalent Bonding',
      url: 'https://openstax.org/books/chemistry-2e/pages/7-2-covalent-bonding',
      note: '核对共享电子与成键吸引，不把常见分类规则绝对化。',
    },
    {
      id: 'openstax-lewis',
      title: 'OpenStax Chemistry 2e · Lewis Symbols and Structures',
      url: 'https://openstax.org/books/chemistry-2e/pages/7-3-lewis-symbols-and-structures',
      note: '核对价电子计数、孤对与多重键。',
    },
    {
      id: 'openstax-solids',
      title: 'OpenStax Chemistry 2e · The Solid State of Matter',
      url: 'https://openstax.org/books/chemistry-2e/pages/10-5-the-solid-state-of-matter',
      note: '核对离子、分子、金属及共价网络的结构差异。',
    },
    {
      id: 'openstax-forces',
      title: 'OpenStax Chemistry 2e · Intermolecular Forces',
      url: 'https://openstax.org/books/chemistry-2e/pages/10-1-intermolecular-forces',
      note: '核对分子间作用、氢键及相似分子的物态趋势。',
    },
  ],
}
