// ESAT 化学反应、式与方程讲义：由守恒连接化学式、物态、配平与平衡，例题正文统一取自现有题库。
import type { KnowledgeLesson } from './types'
import { chemicalReactionMethods } from './chemicalReactionMethods'

export const esatChemicalReactions: KnowledgeLesson = {
  code: '140300',
  title: 'Chemical reactions, formulae and equations · 反应、式与方程',
  subtitle: '先认物质，再数原子与电荷；分清反应发生了多少、是否达到平衡',
  intro:
    '用化学式确定组成，用原子与电荷守恒配平方程；可逆反应还要区分实际转化量、反应速率与平衡组成。',
  memory: [
    '**普通化学反应改变原子的连接与电子分布，不创造或消灭原子核。**封闭体系总质量守恒；开放容器的读数可以因气体进出而变。',
    '**先写正确化学式，再配平。**系数乘整个式子，下标决定物质组成；括号外下标乘括号内每一种原子。',
    '**(aq) 是溶于水，不是液态。**沉淀用 (s)，熔融物用 (l)；计算气体总量前，先确认温度与哪些物质仍是 (g)。',
    '**方程两边既要原子守恒，也要电荷守恒。**净离子式删去旁观离子；半方程保留电子，合并时电子必须抵消。',
    '**平衡是正逆反应速率相等，不是浓度相等，也不是反应停止。**浓度、温度和气体压强可改变平衡位置；催化剂只改变达到平衡的快慢。',
  ],
  sections: [
    {
      code: '140301',
      title: '原子与电子重排',
      summary: chemicalReactionMethods['140301'].summary,
      paragraphs: [chemicalReactionMethods['140301'].intro],
      memory: chemicalReactionMethods['140301'].memory,
      rules: chemicalReactionMethods['140301'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      visual: 'chemical-reactions',
      pitfalls: [
        '把反应中的电子得失理解为原子核改变，或把同元素不同离子当成不同元素。',
        '只看总原子数相同，没有逐种核对元素；或漏数缩写结构式中分散书写的 H。',
        '看到气泡、沉淀就一律判为氧化还原；可见现象本身不能证明电子转移。',
        '敞口实验质量变小就否定守恒，漏算已逸出的气体。',
      ],
      sourceIds: ['uat-c3', 'openstax-equations', 'openstax-reactions'],
      examFocus: {
        goal: '先锁定哪些元素必须留下，再用电子或电荷说明物质怎样改变。',
        pastPaperSummary:
          '已收录真题主要把守恒用于恢复未知产物、核对断键成键以及解释质量变化；电子重排还会进入氧化还原综合判断。没有独立背诵“原子核不变”的题，不将所有出现化学反应的题都列为本点考法。',
        pastPaperPatterns: [
          {
            form: '按原子账目恢复未知产物或组成',
            description:
              '给出部分反应物、产物及数量关系，要求找未知产物、分子组成或质量；必须把已进入其他产物的原子先扣除，尤其留意“只生成这些产物”的限制。',
            reference: '2016、2020—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q046',
              'ESAT-2020-CHEMISTRY-016',
              'ESAT_LEGACY_2021_NSAA_Q052',
              'ESAT_LEGACY_2022_NSAA_Q049',
              'ESAT_LEGACY_2022_NSAA_Q058',
              'NSAA_2023_S1-Q060',
            ],
          },
          {
            form: '辨认断开的键与新形成的键（综合）',
            description:
              '判断一个反应是否同时断开并形成共价键，或先数清反应前后的键，再结合键能求能量变化；仅看到产物数量变化，不足以确定键的种类与数量。',
            reference: '2016、2017、2019、2021、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q039',
              'NSAA_2016_S1-Q054',
              'NSAA_2017_S1-Q049',
              'NSAA_2019_S1-Q053',
              'ESAT_LEGACY_2021_NSAA_Q055',
              'NSAA_2023_S1-Q050',
            ],
          },
          {
            form: '电子转移与离子重组的区别（综合）',
            description:
              '比较置换、沉淀、分解或电极过程，判断是否发生氧化还原、谁失去或获得电子，以及电子在外电路的方向；离子重新组合与电子实际转移需要分别检查。',
            reference: '2016—2020、2022、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q045',
              'NSAA_2017_S1-Q038',
              'NSAA_2017_S1-Q044',
              'NSAA_2017_S1-Q050',
              'ESAT_LEGACY_2018_NSAA_Q43',
              'ESAT_LEGACY_2018_NSAA_Q48',
              'NSAA_2019_S1-Q044',
              'NSAA_2019_S1-Q054',
              'ESAT-2020-CHEMISTRY-008',
              'ESAT-2020-CHEMISTRY-009',
              'ESAT_LEGACY_2022_NSAA_Q044',
              'ESAT_LEGACY_2022_NSAA_Q045',
              'NSAA_2023_S1-Q044',
            ],
          },
          {
            form: '开放容器的质量读数与气体逸出',
            description:
              '比较不同金属与酸反应后容器的最终质量；要分别统计加入的金属与逸出的氢气，不能只比较起始金属质量，也不能把天平读数当成整个反应体系的质量。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-018'],
          },
        ],
        pastPaperNote:
          '断键能量、氧化数和电解的完整解法分别在后续章节展开；本节先抓它们共同使用的原子守恒与电子变化。',
        comparison: {
          title: '反应中什么可以变，什么必须保留',
          columns: ['观察对象', '可以改变', '核对依据'],
          rows: [
            ['物质与粒子组合', '物质种类、分子个数、原子连接方式', '每种元素的原子总数仍相同'],
            ['电子', '共享方式或归属；个别粒子的电荷', '完整反应前后总电荷守恒'],
            ['天平读数', '开放容器中有物质进出时改变', '封闭体系总质量不变'],
          ],
        },
        examples: [
          {
            title: '只生成一种产物，缺少的原子从哪里来？',
            source: {
              questionCode: 'ESAT-DIR-0824-CHEM-Q007-20260824-V11',
              subject: 'chemistry',
              kind: 'bank',
              why: '用已发布题库的重排题练原子与电荷双重核对；无需先掌握该有机反应的机理。',
            },
            question: '',
            answer: 'C · OCN⁻。',
            steps: [
              '先抓住题干的两个限制：隔绝空气加热，而且只生成乙基脲，没有其他产物。因此原子不能从空气补进来，也不能凭空送进题目未写出的副产物。',
              '逐段数乙基脲 C₂H₅NHCONH₂：总组成是 C₃H₈N₂O。乙基铵 C₂H₅NH₃⁺ 的组成则是 C₂H₈N⁺；不要只数结构式末尾那一组 H。',
              '先按一份阳离子对应一份产物核对：还需要一个 C、一个 N、一个 O，指向 OCN。再检查电荷：阳离子为 +1，配一个 OCN⁻ 恰好构成中性盐。',
              '如果选 OCN²⁻，中性盐需要两份乙基铵；此时原子比例不能只重排成题给的唯一产物。原子组成与电荷同时匹配，才是完整判断。',
            ],
            optionNotes: [
              'A：CN⁻ 缺少氧，题目没有另外的氧来源。',
              'B：CO₂⁻ 少一个所需的氮，而且多一个氧。',
              'C：原子组成和总电荷都能对应。',
              'D：OCN²⁻ 的元素种类正确，但所需阳离子比例破坏了产物的组成比例。',
            ],
            takeaway:
              '陌生名称不是障碍。**先展开结构式数原子，再用电荷检查配比**，不用猜反应机理。',
          },
        ],
        checklist: [
          '能说明普通化学反应改变电子分布，却不改变原子核身份。',
          '能从结构式逐种数原子，并检查题干是否允许其他产物。',
          '能解释开放容器质量减少与质量守恒并不矛盾。',
        ],
      },
    },
    {
      code: '140302',
      title: '常见化合物的化学式',
      summary: chemicalReactionMethods['140302'].summary,
      paragraphs: [chemicalReactionMethods['140302'].intro],
      memory: chemicalReactionMethods['140302'].memory,
      rules: chemicalReactionMethods['140302'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      visual: 'chemical-reactions',
      pitfalls: [
        '机械交叉电荷后忘记约成最简比，或把离子的正负号也写成下标。',
        '把硫酸根 SO₄²⁻ 与亚硫酸根混用，或把铵根 NH₄⁺ 与氨 NH₃ 混用。',
        '写 MgNO₃、CaOH 等不电中性的式子，或漏掉表示多组复合离子的括号。',
        '将分子式当成可任意约简的比例，或将结晶水漏出质量计算。',
      ],
      sourceIds: ['uat-c3', 'openstax-formulae'],
      examFocus: {
        goal: '看见名称能写出组成，看见化学式能反查电荷与粒子数量。',
        pastPaperSummary:
          '真题既直接让你选正确化学式，也把化学式藏在族位置、离子检验、同位素或溶液计数中。写式子时先检查总电荷，再展开括号；不要等算到最后才发现配比错误。',
        pastPaperPatterns: [
          {
            form: '名称、离子电荷或族位置 → 化学式',
            description:
              '直接核对名称与式子是否对应，或先由名称、元素位置和离子电荷写出盐与氧化物，再求组成或反应数量；复合离子的括号、最简下标和电中性是主要检查点。',
            reference: '2016—2018、2020—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q046',
              'NSAA_2016_S1-Q050',
              'NSAA_2017_S1-Q042',
              'NSAA_2017_S1-Q043',
              'ESAT_LEGACY_2018_NSAA_Q48',
              'ESAT_LEGACY_2018_NSAA_Q53',
              'ESAT-2020-CHEMISTRY-005',
              'ESAT_LEGACY_2021_NSAA_Q052',
              'ESAT_LEGACY_2022_NSAA_Q050',
              'ESAT_LEGACY_2022_NSAA_Q058',
              'NSAA_2023_S1-Q052',
            ],
          },
          {
            form: '反过来由式子读离子电荷与粒子个数',
            description:
              '用化合物整体电中性恢复未知离子电荷，或用下标计算每份物质所含原子、电子或离子数；题目可进一步衔接同位素、谱峰或溶液物质的量。',
            reference: '2019、2020、2022、2023 NSAA',
            sourceCodes: [
              'NSAA_2019_S1-Q040',
              'ESAT-2020-CHEMISTRY-015',
              'ESAT_LEGACY_2022_NSAA_Q053',
              'NSAA_2023_S1-Q045',
              'NSAA_2023_S1-Q051',
            ],
          },
          {
            form: '由检验或反应流程确定盐的组成（综合）',
            description:
              '先从沉淀、反应流程或金属反应确定离子，再写中性化合物并完成后续判断；正确识别离子还不够，阳、阴离子的数量比也必须正确。',
            reference: '2019、2022、2023 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q045', 'ESAT_LEGACY_2022_NSAA_Q042', 'NSAA_2023_S1-Q049'],
          },
          {
            form: '读懂含结晶水的组成（综合）',
            description:
              '比较无水盐与水合盐，或由文字给出的氧化物与水的比例写总组成；随后求浓度或原料质量，结晶水必须计入每份物质的质量。',
            reference: '2018、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q47', 'NSAA_2023_S1-Q059'],
          },
        ],
        pastPaperNote:
          '由元素质量百分比求经验式、再求分子式的计算属于下一章；本点先把常见化学式、离子配比和符号读准确。',
        comparison: {
          title: '先背离子，再成对写盐',
          columns: ['常见粒子', '电荷或组成', '对应化合物'],
          rows: [
            ['Na⁺、K⁺、NH₄⁺', '+1', 'NaCl、KNO₃、(NH₄)₂SO₄'],
            ['Mg²⁺、Ca²⁺、Zn²⁺', '+2', 'MgCl₂、Ca(OH)₂、ZnSO₄'],
            ['Al³⁺', '+3', 'Al₂O₃、Al₂(SO₄)₃'],
            ['OH⁻、NO₃⁻；CO₃²⁻、SO₄²⁻', '保留离子内部下标', 'Ca(NO₃)₂、Na₂CO₃'],
            ['PO₄³⁻', '磷酸根整体为 −3', 'Ca₃(PO₄)₂'],
            ['常见共价分子', '记真实分子组成', 'H₂O、H₂O₂、CO₂、NH₃、CH₄、HCl'],
            ['常见酸的化学式', '水溶液另注明 (aq)', '盐酸 HCl、硝酸 HNO₃、硫酸 H₂SO₄'],
          ],
        },
        examples: [
          {
            title: '五个熟悉的名字，哪一个式子电中性？',
            source: {
              questionCode: 'ESAT-2020-CHEMISTRY-005',
              subject: 'chemistry',
              kind: 'annual',
              why: '这道真题直接比较常见离子化合物，集中检验电荷配比与复合离子括号。',
            },
            question: '',
            answer: 'B · (NH₄)₂CO₃。',
            steps: [
              '先认出这些物质都可按阳、阴离子配比检查，无需计算相对质量。先把常见离子电荷写在心里，再看题目给的下标。',
              '铵根 NH₄⁺ 每组带 +1，碳酸根 CO₃²⁻ 带 −2。因此两个铵根配一个碳酸根，正负电荷相抵，式子为 (NH₄)₂CO₃。',
              '再验证其他选项：硫酸铝需要 Al₂(SO₄)₃；氢氧化钙需要 Ca(OH)₂；硝酸镁需要 Mg(NO₃)₂；溴化钾则是 KBr。',
              '注意括号只扩大复合离子的份数，不改离子内部组成。比如两个硝酸根共有两个 N、六个 O，但仍应写 (NO₃)₂ 来保留其结构单位。',
            ],
            optionNotes: [
              'A：一个 Al³⁺ 不能抵消三个 SO₄²⁻，缺少第二个铝离子。',
              'B：两个 +1 与一个 −2 恰好相抵。',
              'C：Ca²⁺ 需要两个 OH⁻，原式只有一个。',
              'D：Mg²⁺ 需要两个 NO₃⁻，原式只有一个。',
              'E：K⁺ 与 Br⁻ 为 1:1，不需要两个溴离子。',
            ],
            takeaway: '**先验总电荷，再验括号和下标。**熟悉名字不等于式子一定写对。',
          },
        ],
        checklist: [
          '能写常见单原子、复合离子的电荷，并组成电中性的最简化学式。',
          '能展开括号数原子，区分系数、下标与电荷。',
          '能区分 NH₃ 与 NH₄⁺、分子式与离子化合物最简比。',
        ],
      },
    },
    {
      code: '140303',
      title: '状态符号',
      summary: chemicalReactionMethods['140303'].summary,
      paragraphs: [chemicalReactionMethods['140303'].intro],
      memory: chemicalReactionMethods['140303'].memory,
      rules: chemicalReactionMethods['140303'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      visual: 'chemical-reactions',
      pitfalls: [
        '把 (aq) 当成液态，漏掉水参与反应或电解的可能性。',
        '看见“混合两种溶液”就把生成物也全写 (aq)，漏掉沉淀。',
        '高温气体总量漏算水蒸气；冷却后的气体总量又把全部水保留下来。',
        '气体收集只数新产物，漏掉未反应的过量气体。',
      ],
      sourceIds: ['uat-c3', 'openstax-equations'],
      examFocus: {
        goal: '让每个状态符号对应到可观察的物质与分离、收集条件。',
        pastPaperSummary:
          '已收录真题没有单独让学生背四个状态符号的题；实际应用集中在气体是否计入、沉淀留在哪里，以及熔融物和水溶液能否使用同一电解判断。',
        pastPaperPatterns: [
          {
            form: '高温产物中哪些仍是气体（综合）',
            description:
              '燃烧或氧化后求气体总量，测量温度决定生成水是否计入；同时要保留过量的反应物。状态判断先确定计算对象，数量计算再用方程系数。',
            reference: '2020、2021 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-012', 'ESAT_LEGACY_2021_NSAA_Q056'],
          },
          {
            form: '溶液、沉淀与滤液的去向（综合）',
            description:
              '从混合溶液的可见现象、净离子式或过滤流程判断哪些物质形成固体、哪些仍在水中；再用于鉴定或计算。出现 (aq) 本身不是一个独立题型。',
            reference: '2017、2019—2023 NSAA',
            sourceCodes: [
              'NSAA_2017_S1-Q043',
              'NSAA_2019_S1-Q045',
              'NSAA_2019_S1-Q052',
              'ESAT-2020-CHEMISTRY-004',
              'ESAT-2020-CHEMISTRY-011',
              'ESAT_LEGACY_2021_NSAA_Q047',
              'ESAT_LEGACY_2021_NSAA_Q059',
              'ESAT_LEGACY_2022_NSAA_Q041',
              'NSAA_2023_S1-Q044',
            ],
          },
          {
            form: '熔融物与水溶液的电解条件（综合）',
            description:
              '比较熔融盐与水溶液的产物，或根据水溶液条件判断电极反应；水是否存在会改变可参与反应的粒子，不能只凭盐的化学式判断。',
            reference: '2016—2018、2020、2022 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q047',
              'NSAA_2017_S1-Q050',
              'ESAT_LEGACY_2018_NSAA_Q39',
              'ESAT_LEGACY_2018_NSAA_Q42',
              'ESAT-2020-CHEMISTRY-007',
              'ESAT_LEGACY_2022_NSAA_Q042',
              'ESAT_LEGACY_2022_NSAA_Q047',
            ],
          },
          {
            form: '状态改变后粒子能否移动（综合）',
            description:
              '把同种物质的固态、液态或水溶液性质并排比较，或据性质辨认物质；状态符号帮助定位条件，导电性的原因还需结合离子或分子结构。',
            reference: '2016、2021、2022 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q038',
              'ESAT_LEGACY_2021_NSAA_Q044',
              'ESAT_LEGACY_2022_NSAA_Q043',
            ],
          },
        ],
        pastPaperNote:
          '本节例题选自已发布试题库，用冷凝后的气体判断补充教学；它不作为历年真题来源。计量、电解和物质结构的完整知识在相应章节继续学习。',
        comparison: {
          title: '同一个式子后面，状态不能省着读',
          columns: ['符号', '含义', '怎样影响判断'],
          rows: [
            ['(s)', '固体 solid', '沉淀、金属或晶体；不按气体体积统计'],
            ['(l)', '液体 liquid', '纯液体或熔融物；不等于溶于水'],
            ['(g)', '气体 gas', '在给定温度、压力下参与气量统计'],
            ['(aq)', '水溶液 aqueous', '溶质在水中；不必都是离子，也不是纯液体'],
          ],
        },
        examples: [
          {
            title: '冷却以后，水还在气体清单里吗？',
            source: {
              questionCode: 'ESAT-DIR-0824-CHEM-Q001-20260824-V11',
              subject: 'chemistry',
              kind: 'bank',
              why: '这道已发布题库题把物态与气量结合：冷却后移除冷凝水，但保留未反应氧气。',
            },
            question: '',
            answer: 'B · 9.60 dm³。',
            steps: [
              '先读“冷却回室温、回到原压”，确定问的是冷却后的气体。按此类题的计算近似，忽略少量残留水蒸气，生成水冷凝为液体，不再全部计入气体。',
              '配平环己醇完全燃烧：C₆H₁₂O + 8.5O₂ → 6CO₂ + 6H₂O。产物有18个氧原子，其中1个来自醇，另外17个来自8.5个氧分子。',
              '初始氧气为 12.0÷24.0=0.500 mol；0.040 mol 醇消耗 0.340 mol 氧气，剩余 0.160 mol。不要把初始氧气原样加到产物上。',
              '生成 CO₂ 为 0.040×6=0.240 mol。最后气体由剩余 O₂ 与 CO₂ 组成，总计 0.400 mol；用题给气体摩尔体积得到 0.400×24.0=9.60 dm³。',
            ],
            optionNotes: [
              'A：只数了生成的 CO₂，漏掉过量氧气。',
              'B：既排除了冷凝水，又保留了剩余氧气。',
              'C：把全部生成水继续当成室温气体。',
              'D：把初始氧气全部保留下来，没有扣除已经反应的部分。',
            ],
            takeaway: '**先列末态气体名单，再填各自数量。**温度条件决定名单，方程系数决定数量。',
          },
        ],
        checklist: [
          '能解释 (l) 与 (aq) 的区别，并举出同一盐在两种条件下的例子。',
          '能从反应条件判断水是否应作为气体计入。',
          '能区分沉淀与滤液，知道过滤不能除去普通溶解盐。',
        ],
      },
    },
    {
      code: '140304',
      title: '构造与配平方程',
      summary: chemicalReactionMethods['140304'].summary,
      paragraphs: [chemicalReactionMethods['140304'].intro],
      memory: chemicalReactionMethods['140304'].memory,
      rules: chemicalReactionMethods['140304'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      visual: 'chemical-reactions',
      pitfalls: [
        '通过修改下标配平，把原来的物质变成另一种物质。',
        '只查原子、不查电荷，导致离子方程表面配平却不守恒。',
        '净离子式保留全部旁观离子，或把沉淀、水、弱酸也机械拆开。',
        '半方程相加时不先统一电子数，或把电荷正负误作反应系数。',
        '燃烧含氧有机物时，忘记减去燃料本身提供的氧。',
      ],
      sourceIds: ['uat-c3', 'openstax-equations', 'openstax-reactions'],
      examFocus: {
        goal: '从题给物质构造方程，逐种核对原子，最后核对总电荷。',
        pastPaperSummary:
          '真题会直接求系数、系数和或比值，也会由守恒恢复未知产物。离子与半方程必须额外查电荷；燃烧和常见反应则常要求先自己写式子，再进入数量计算。',
        pastPaperPatterns: [
          {
            form: '求系数、系数和或离子产物比例',
            description:
              '给出未配平的反应式，用字母表示未知系数，要求单个值、总和或最简比例；含离子的式子要把电荷守恒也列入条件。',
            reference: '2018—2021 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q51',
              'NSAA_2019_S1-Q048',
              'ESAT-2020-CHEMISTRY-006',
              'ESAT_LEGACY_2021_NSAA_Q050',
            ],
          },
          {
            form: '由部分数量关系恢复未知产物',
            description:
              '反应物或部分产物数量已知，要求识别剩余产物或选出完整方程；既要扣除进入其他产物的原子，也要核对题给气量或氧化数等额外条件。',
            reference: '2016、2021—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q046',
              'ESAT_LEGACY_2021_NSAA_Q052',
              'ESAT_LEGACY_2022_NSAA_Q058',
              'NSAA_2023_S1-Q053',
            ],
          },
          {
            form: '净离子式与半方程的构造、合并',
            description:
              '从沉淀反应中删去旁观离子，选择正确电极半方程，或把电子转移数量与产物数量对应；原子配平、电子方向和两半反应的电子抵消需同时成立。',
            reference: '2016—2021 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q047',
              'NSAA_2016_S1-Q053',
              'NSAA_2017_S1-Q043',
              'NSAA_2017_S1-Q045',
              'NSAA_2017_S1-Q050',
              'ESAT_LEGACY_2018_NSAA_Q39',
              'NSAA_2019_S1-Q054',
              'ESAT-2020-CHEMISTRY-020',
              'ESAT_LEGACY_2021_NSAA_Q057',
            ],
          },
          {
            form: '燃烧中用元素守恒确定耗氧量',
            description:
              '给烃或含氧有机物及完全、不完全燃烧条件，求系数、组成或气量；碳进入 CO₂、CO 的比例和燃料自带氧都可能改变所需氧气。',
            reference: '2020、2022、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-012',
              'ESAT-2020-CHEMISTRY-016',
              'ESAT_LEGACY_2022_NSAA_Q055',
              'NSAA_2023_S1-Q060',
            ],
          },
          {
            form: '先构造常见反应，再做计量（综合）',
            description:
              '没有直接给出完整方程，要先根据金属与水或酸、中和、沉淀、氧化物或加成反应恢复数量比，再计算气量、浓度、过量物、产率或摩尔热效应；系数不是质量比。',
            reference: '2016—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q050',
              'NSAA_2016_S1-Q051',
              'NSAA_2016_S1-Q052',
              'NSAA_2017_S1-Q044',
              'ESAT_LEGACY_2018_NSAA_Q50',
              'ESAT_LEGACY_2018_NSAA_Q53',
              'NSAA_2019_S1-Q046',
              'NSAA_2019_S1-Q047',
              'NSAA_2019_S1-Q051',
              'ESAT-2020-CHEMISTRY-011',
              'ESAT-2020-CHEMISTRY-013',
              'ESAT-2020-CHEMISTRY-017',
              'ESAT-2020-CHEMISTRY-018',
              'ESAT-2020-CHEMISTRY-019',
              'ESAT_LEGACY_2021_NSAA_Q047',
              'ESAT_LEGACY_2021_NSAA_Q053',
              'ESAT_LEGACY_2021_NSAA_Q058',
              'ESAT_LEGACY_2021_NSAA_Q059',
              'ESAT_LEGACY_2022_NSAA_Q046',
              'ESAT_LEGACY_2022_NSAA_Q048',
              'ESAT_LEGACY_2022_NSAA_Q049',
              'ESAT_LEGACY_2022_NSAA_Q056',
              'ESAT_LEGACY_2022_NSAA_Q057',
              'NSAA_2023_S1-Q049',
              'NSAA_2023_S1-Q057',
            ],
          },
        ],
        pastPaperNote:
          '已给完整配平式、只需代入数量的题主要放在定量化学；这里保留需要实际构造方程、恢复系数或核对电荷的应用。',
        comparison: {
          title: '三种写法，共用两条守恒',
          columns: ['写法', '保留什么', '最后检查'],
          rows: [
            ['完整反应式', '题给反应物与产物的正确化学式', '每种元素总数；状态与条件'],
            ['净离子方程', '真正发生变化的粒子', '原子数、电荷；旁观离子已抵消'],
            ['半反应方程', '一个得失电子过程及电子', '原子数、电荷；电子方向与数量'],
          ],
        },
        examples: [
          {
            title: '不先记反应比例，也能配出两个含氯产物',
            source: {
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q050',
              subject: 'chemistry',
              kind: 'annual',
              why: '真题要求离子方程的产物比例，适合直接联立原子与电荷守恒，不依赖背诵歧化反应。',
            },
            question: '',
            answer: 'E · w:x = 5:1。',
            steps: [
              '题干已指定氯气与热浓氢氧化钠的产物。我们只需配平这个指定反应，不把它换成冷稀条件下的另一种产物。',
              '先令 ClO₃⁻ 的系数 x=1。氧守恒给 v=3+y；氢守恒给 v=2y。合起来得到 y=3、v=6。',
              '再看电荷：左边6个 OH⁻ 总电荷为 −6；右边 w 个 Cl⁻ 加1个 ClO₃⁻，总电荷为 −(w+1)。因此 w=5。',
              '最后查氯原子：右边共6个 Cl，左边需3个 Cl₂。完整关系为 3Cl₂+6OH⁻→5Cl⁻+ClO₃⁻+3H₂O，所求 w:x 为5:1。',
            ],
            optionNotes: [
              'A：两个产物都含一个氯，不表示生成数量相同；还要满足 H、O 与净电荷。',
              'D：把正确的5:1颠倒成1:5，必须按题目指定的 w:x 顺序读取。',
              'B、C、F、G：将各比值代入后，都不能与氧、氢和净电荷的守恒关系同时成立。',
              'E：能与最简配平式逐项对应。',
            ],
            takeaway:
              '**复杂离子式仍可从原子数入手，电荷负责最后一道约束。**先设一个方便的系数，不用猜全部数字。',
          },
        ],
        checklist: [
          '能说明配平为什么只能改系数，不能改化学式下标。',
          '能从完整式写净离子式，保留沉淀、水及实际变化粒子。',
          '能配平半方程的电荷，并在相加时使电子抵消。',
          '能在燃烧方程里计入燃料本身的氧。',
        ],
      },
    },
    {
      code: '140305',
      title: '可逆反应与平衡',
      summary: chemicalReactionMethods['140305'].summary,
      paragraphs: [chemicalReactionMethods['140305'].intro],
      memory: chemicalReactionMethods['140305'].memory,
      rules: chemicalReactionMethods['140305'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      visual: 'chemical-reactions',
      pitfalls: [
        '把平衡写成正逆反应停止，或写成反应物与产物浓度相等。',
        '把升温加快速率当作任何反应产率都会增加。',
        '数压强效应时把固体、液体算入，或没比较气体系数总和。',
        '把催化剂当成提高平衡产率的手段。',
        '按反应物全部耗尽来算平衡组成，漏掉剩余的反应物。',
      ],
      sourceIds: ['uat-c3', 'openstax-equilibrium', 'openstax-lechatelier'],
      examFocus: {
        goal: '先说明所求是速率还是平衡组成，再逐个条件判断方向。',
        pastPaperSummary:
          '真题会由实验变化反推反应特征，也会让同一个操作同时作用于两个方向不同的平衡。综合计算则检查是否保留未反应物，不能把“达到平衡”当成“完全反应”。',
        pastPaperPatterns: [
          {
            form: '由速率、产率的变化反推反应特征',
            description:
              '给出升温或升压对速率和最终产率的不同影响，要求选符合的反应式与吸放热方向；需要把气体系数和、热效应和速率变化分别核对。',
            reference: '2016 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q040'],
          },
          {
            form: '一个操作能否同时满足两个平衡',
            description:
              '将吸放热方向、气体数量变化不同的两个反应并列，要求某项操作同时提高初速和产率；温度、压强与催化剂必须对每个条件逐条检验。',
            reference: '2017 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q040'],
          },
          {
            form: '浓度、温度与催化作用逐项辨别',
            description:
              '向已经平衡的混合物添加反应物或产物，改变温度或加入催化剂，判断哪些操作会改变平衡位置；不能把加速到达平衡和改变组成混为一谈。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q38'],
          },
          {
            form: '按实际转化量计算平衡混合物（综合）',
            description:
              '给转化百分比或平衡时产物数量，求混合气体体积或已释放的热量；用真正发生的反应量计算，并保留未转化、过量的反应物。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q45', 'ESAT_LEGACY_2018_NSAA_Q54'],
          },
          {
            form: '区分动态平衡与反应物耗尽',
            description:
              '在滴加酸碱的温度曲线解释中，把“达到平衡”作为干扰说法；曲线转折需要回到试剂是否已经反应完，而不是仅凭读数不再升高判断平衡。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q045'],
          },
        ],
        comparison: {
          title: '以放热合成氨为例，逐个条件判断',
          columns: ['改变条件', '平衡位置', '最容易混淆之处'],
          rows: [
            ['升高温度', '向吸热的分解方向移动', '虽然通常更快，氨的平衡产率反而降低'],
            ['恒温压缩，提高压强', '向气体系数较少的产物侧移动', '只数气体：左4份，右2份'],
            ['加入反应物或移走氨', '向生成氨方向调整', '不能推成一定完全反应'],
            ['加入合适催化剂', '不变', '更快到达同一平衡组成'],
          ],
        },
        examples: [
          {
            title: '一个操作，能同时提高两种反应的速率和产率吗？',
            source: {
              questionCode: 'NSAA_2017_S1-Q040',
              subject: 'chemistry',
              kind: 'annual',
              why: '这道真题将两个不同平衡并列，能直接检验“更快”和“产率更高”是否被混用。',
            },
            question: '',
            answer: 'A · 没有任何一个所列操作同时满足全部要求。',
            steps: [
              '先列两条独立信息：Q 是放热反应，气体从2份变1份；R 是吸热反应，气体从1份变2份。题目要求同一操作对两个反应都同时提高初速与产率。',
              '升压时，Q 的平衡有利于气体较少的产物侧，但 R 有利于反应物侧。即使压缩会提高初始碰撞频率，也不能同时提高两者产率。',
              '升温有利于吸热方向，所以 R 的产率提高，Q 的产率降低。不能把两者初速都加快当成最终产率都增加。',
              '催化剂可提高达到平衡的快慢，但不改变各自的平衡组成。它也无法满足“提高产率”这条要求，因此没有操作符合全部条件。',
            ],
            optionNotes: [
              'A：三个操作分别核对后，都不能同时满足两个反应的全部要求。',
              'B、C、D：包含把升压视为对两者都提高产率的错误判断。',
              'E、F：升温对 Q 与 R 的产率方向不同。',
              'G、H：催化剂不改变平衡产率，不能作为满足全部要求的操作。',
            ],
            takeaway:
              '**把反应排成两行，把速率和产率分成两列。**一个条件不满足，就不能通过题目的“同时”要求。',
          },
        ],
        checklist: [
          '能用正逆速率相等解释动态平衡，而不声称浓度相等。',
          '能分别判断浓度、温度、恒温压缩对平衡位置的影响。',
          '能解释催化剂为什么不改变平衡产率。',
          '能在平衡计算中保留未反应物，并区分平衡与耗尽终点。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-c3',
      title: 'UAT-UK · ESAT Content Specification（2026/27）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对 C3.1—C3.5，包括原子核守恒、常见化学式、状态符号、离子与半方程，以及浓度、温度、压强对平衡的影响。',
    },
    {
      id: 'openstax-equations',
      title: 'OpenStax · Writing and Balancing Chemical Equations',
      url: 'https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations',
      note: '核对系数与下标的区别、状态符号、原子与电荷守恒、净离子方程和旁观离子。',
    },
    {
      id: 'openstax-formulae',
      title: 'OpenStax · Chemical Nomenclature',
      url: 'https://openstax.org/books/chemistry-2e/pages/2-7-chemical-nomenclature',
      note: '核对常见离子电荷、复合离子括号与离子化合物最简电中性配比。',
    },
    {
      id: 'openstax-reactions',
      title: 'OpenStax · Classifying Chemical Reactions',
      url: 'https://openstax.org/books/chemistry-2e/pages/4-2-classifying-chemical-reactions',
      note: '核对沉淀、电子转移和半反应的边界；后续专题只作为本章基础的应用说明。',
    },
    {
      id: 'openstax-equilibrium',
      title: 'OpenStax · Chemical Equilibria',
      url: 'https://openstax.org/books/chemistry-2e/pages/13-1-chemical-equilibria',
      note: '核对动态平衡、正逆速率与宏观组成不变的区别。',
    },
    {
      id: 'openstax-lechatelier',
      title: 'OpenStax · Shifting Equilibria: Le Châtelier’s Principle',
      url: 'https://openstax.org/books/chemistry-2e/pages/13-3-shifting-equilibria-le-chateliers-principle',
      note: '核对浓度、温度、压强与催化剂的不同影响；互动图只作定性比较，不给出虚构实验测量值。',
    },
  ],
}
