// ESAT 化学全部89个知识点自测映射；精选真实题源，不生成题目或复制原解析。
import type { ChemistryLearningSelection } from './chemistryLearningSources.js'
import { chemistryChapters9To11SelfChecks } from './chemistryChapters9To11.js'
import { chemistryChapters12To14SelfChecks } from './chemistryChapters12To14.js'
import { chemistryChapters15To17SelfChecks } from './chemistryChapters15To17.js'

export interface ChemistryLearningSelfCheck {
  title: string
  selection: ChemistryLearningSelection | null
}

// 2026-10-23补齐全考纲；跨章节复用保留具体考查角度，缺题不随机回退。
export const chemistryLearningSelfChecks: Record<string, ChemistryLearningSelfCheck> = {
  ...chemistryChapters9To11SelfChecks,
  ...chemistryChapters12To14SelfChecks,
  ...chemistryChapters15To17SelfChecks,
  '140101': {
    title: '原子模型',
    selection: {
      kind: 'annual',
      questionCode: 'NSAA_2017_S1-Q054',
      year: 2017,
      exam: 'NSAA',
      paper: 'Section 1 · Part C Chemistry',
      questionNumber: 54,
      reason:
        '复盘本节例题：现有题源中直接考查原子核尺度的匹配题只有这一道，收起步骤后独立完成单位与比例换算。',
    },
  },
  '140102': {
    title: '相对质量与电荷',
    selection: {
      kind: 'annual',
      questionCode: 'NSAA_2019_S1-Q042',
      year: 2019,
      exam: 'NSAA',
      paper: 'Section 1 · Part C Chemistry',
      questionNumber: 42,
      reason: '将负二价离子的电荷转为多两个电子，检查离子化不改变核内质子、中子的认识。',
    },
  },
  '140103': {
    title: '原子序数、质量数与记号',
    selection: {
      kind: 'annual',
      questionCode: 'NSAA_2023_S1-Q048',
      year: 2023,
      exam: 'NSAA',
      paper: 'Section 1 · Part C Chemistry',
      questionNumber: 48,
      reason: '把核素记号中的数量关系推广到含分式的表达式，区分中子数相减与负离子电子数相加。',
    },
  },
  '140104': {
    title: '电子排布',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2021_NSAA_Q042',
      year: 2021,
      exam: 'NSAA',
      paper: 'Section 1 · Part C Chemistry',
      questionNumber: 42,
      reason:
        '比较钙的不同同位素与不同电荷，识别决定电子排布的是电子数，不能默认所有钙离子都是二价。',
    },
  },
  '140105': {
    title: '同位素与丰度数据',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E01-007-R8-FINAL-20260818',
      reason: '从粒子表同时检查同位素和电中性两个条件，排除只有中子相同或只有电子相同的干扰项。',
    },
  },
  '140106': {
    title: '相对原子质量',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E03-020-R8-FINAL-20260818',
      reason:
        '用镁的三种同位素及不同于例题的丰度独立计算，检查是否漏掉较重同位素或错误取算术平均。',
    },
  },
  '140201': {
    title: '周期与族',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2018_NSAA_Q44',
      year: 2018,
      exam: 'NSAA',
      paper: 'Section 1 · Part C Chemistry',
      questionNumber: 44,
      reason:
        '用上一章已学的电荷与电子数判断质子数关系，排除等电子粒子必在同一族的误解，不需要提前使用族反应性趋势。',
    },
  },
  '140202': {
    title: '按原子序数排列',
    selection: {
      kind: 'annual',
      questionCode: 'NSAA_2023_S1-Q047',
      year: 2023,
      exam: 'NSAA',
      paper: 'Section 1 · Part C Chemistry',
      questionNumber: 47,
      reason:
        '迁移练习：用同周期左邻少一个质子的规则判断表格，再结合本章周期、族知识核对其余条件。',
    },
  },
  '140203': {
    title: '金属与非金属位置',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E04-020-R8-FINAL-20260818',
      reason:
        '复盘本节例题：利用讲解提供的可变价与催化线索，在原图中重新定位中央金属区，避免借用需要后续成键知识的题目。',
    },
  },
  '140204': {
    title: '位置与电子排布',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2018_NSAA_Q44',
      year: 2018,
      exam: 'NSAA',
      paper: 'Section 1 · Part C Chemistry',
      questionNumber: 44,
      reason:
        '用等电子的原子、阴离子和阳离子反查质子数，避免把离子的满壳层错误当成元素属于同族的依据。',
    },
  },
  '140205': {
    title: '族性质与反应性趋势',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E01-010-R8-FINAL-20260818',
      reason: '分别核对钾与钠的反应性、溴与氯的沸点及氩的单原子形式，避免只记一条向下递增规律。',
    },
  },
  '140301': {
    title: '原子与电子重排',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2021_NSAA_Q052',
      year: 2021,
      exam: 'NSAA',
      reason: '从已知生成物与水的数量核对氢、氮、氧守恒，用原子重排推断未知产物。',
    },
  },
  '140302': {
    title: '常见化合物化学式',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E04-021-R8-FINAL-20260818',
      reason: '把电子得失转成离子电荷，再以最小整数比构造电中性的化学式，检查下标是否写反。',
    },
  },
  '140303': {
    title: '状态符号',
    selection: {
      kind: 'bank',
      questionCode: 'ESAT-DIR-0824-CHEM-Q010-20260824-V10',
      reason: '物态与气体计量联用：与冷凝例题对照，180℃下水保留为蒸汽，统计产物和剩余氧气。',
    },
  },
  '140304': {
    title: '构造与配平方程',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E03-005-R8-FINAL-20260818',
      reason: '逐元素核对氨氧化方程，并区分仅配平与已约成最简整数系数的选项。',
    },
  },
  '140305': {
    title: '可逆反应与平衡',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E02-015-R8-FINAL-20260818',
      reason: '分别检查温度、压强和催化剂对平衡的影响，避免把反应加快误当成平衡组成改变。',
    },
  },
  '140401': {
    title: '相对分子质量与相对式量',
    selection: {
      kind: 'bank',
      questionCode: 'ESAT-DIR-0824-CHEM-Q017-20260824-V10',
      reason:
        '复盘本节例题：现有匹配基础题中该题同时检验数值和术语，独立核对四项而不借用后章反应知识。',
    },
  },
  '140402': {
    title: '阿伏伽德罗常数与摩尔',
    selection: {
      kind: 'annual',
      questionCode: 'NSAA_2023_S1-Q045',
      year: 2023,
      exam: 'NSAA',
      reason: '迁移到离子计数：用题给浓度和体积求盐的物质的量，再区分一个化学式单位与三个离子。',
    },
  },
  '140403': {
    title: '摩尔与质量换算',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E04-003-R8-FINAL-20260818',
      reason: '将起始质量换成摩尔数，沿题给的一比一反应链传递，最后换成另一种物质的质量。',
    },
  },
  '140404': {
    title: '质量百分组成',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E04-001-R8-FINAL-20260818',
      reason: '把每百万份的质量比例换成百分数，检查质量分数与百分数之间的百倍关系。',
    },
  },
  '140405': {
    title: '经验式与分子式',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E01-025-R8-FINAL-20260818',
      reason: '先由质量百分比求经验式，再用给定相对分子质量决定整数倍数，避免停在最简式。',
    },
  },
  '140406': {
    title: '方程质量计算',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E01-024-R8-FINAL-20260818',
      reason: '两种反应物的摩尔数相同却不按一比一反应，用系数判定限量试剂后计算产物质量。',
    },
  },
  '140407': {
    title: '由质量或气体体积构造方程',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2022_NSAA_Q058',
      year: 2022,
      exam: 'NSAA',
      reason: '由铜与硝酸的定量关系扣除已知产物中的元素，再用剩余氮氧比例恢复未知产物。',
    },
  },
  '140408': {
    title: '气体体积与摩尔数',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2022_NSAA_Q060',
      year: 2022,
      exam: 'NSAA',
      reason: '按两步已给反应分别计算氮气物质的量，合并后使用题给摩尔气体体积，避免漏算第二步。',
    },
  },
  '140409': {
    title: '溶液与浓度',
    selection: {
      kind: 'bank',
      questionCode: 'ESAT-DIR-0824-CHEM-Q002-20260824-V11',
      reason: '从定容后的总物质的量扣除第一份贡献，再用第二份原体积反求浓度，区分混合与稀释。',
    },
  },
  '140410': {
    title: '滴定计算',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E03-021-R8-FINAL-20260818',
      reason: '按碳酸钠与盐酸的一比二中和关系求未知酸浓度，核对系数与各溶液体积的对应。',
    },
  },
  '140411': {
    title: '百分产率',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E02-005-R8-FINAL-20260818',
      reason:
        '复盘本节例题：收起讲解，重新完成纯度、理论量和实际产率三步，独立辨别样品纯度与反应产率。',
    },
  },
  '140501': {
    title: '基于氧的氧化与还原',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2018_NSAA_Q43',
      year: 2018,
      exam: 'NSAA',
      reason:
        '复盘本节例题：直接匹配氧转移定义且无需后续电子知识的题源有限，收起步骤后独立判断三种指定物质。',
    },
  },
  '140502': {
    title: '电子转移与氧化还原',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E04-002-R8-FINAL-20260818',
      reason:
        '从亚铁与氯的电子转移判断氧化还原，并与中和、沉淀反应对照，避免把所有离子反应视为电子转移。',
    },
  },
  '140503': {
    title: '氧化态',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT-2020-CHEMISTRY-009',
      year: 2020,
      exam: 'NSAA',
      reason: '用化合物电中性逐项计算铬、硫等元素反应前后的氧化态，区分价态变化与仅改变化学式。',
    },
  },
  '140504': {
    title: '识别氧化还原反应',
    selection: {
      kind: 'annual',
      questionCode: 'NSAA_2019_S1-Q044',
      year: 2019,
      exam: 'NSAA',
      reason:
        '区分完整氧化还原反应、单独还原半反应与无价态变化的反应，检查氧化与还原是否同时发生。',
    },
  },
  '140505': {
    title: '歧化反应',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E03-015-R8-FINAL-20260818',
      reason:
        '比较一价铜、过氧化氢与铁的反应，区分同一起始氧化态分成两支和不同氧化态归于一种的反应。',
    },
  },
  '140506': {
    title: '氧化剂与还原剂',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2018_NSAA_Q48',
      year: 2018,
      exam: 'NSAA',
      reason:
        '把氧化剂强弱用于判断溴能否氧化氯离子，再联用已学的族沸点趋势和化合物质量分数核对其他陈述。',
    },
  },
  '140601': {
    title: '元素、化合物与混合物',
    selection: {
      kind: 'annual',
      questionCode: 'NSAA_2019_S1-Q039',
      year: 2019,
      exam: 'NSAA',
      reason:
        '先利用题目保证混合物充分分离的条件识别单一物质样品，再按斑点与溶剂前沿的距离比完成联考计算。',
    },
  },
  '140602': {
    title: '稀有气体结构与成键类型',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E02-020-R8-FINAL-20260818',
      reason: '由外层八电子识别稳定的单原子稀有气体，并核对其反应性与惰性保护用途。',
    },
  },
  '140603': {
    title: '离子键',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E04-019-R8-FINAL-20260818',
      reason: '从正三价与负二价离子构造电中性化学式，再用固态、熔融态的离子移动解释导电差别。',
    },
  },
  '140604': {
    title: '共价键',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E02-025-R8-FINAL-20260818',
      reason:
        '按图中已标明的连接对象识别硫硫共价键，排除带电基团间静电吸引与氢键，不要求额外蛋白质知识。',
    },
  },
  '140605': {
    title: '金属键',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E03-013-R8-FINAL-20260818',
      reason:
        '复盘本节例题：现有直接金属晶格载流子题只有这一道，重新读图同时核对粒子身份和实际移动者。',
    },
  },
  '140606': {
    title: '分子间作用力',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E01-013-R8-FINAL-20260818',
      reason:
        '用低沸点解释分子间作用力较弱，并与离子导电和连续共价网络作对照，避免把巨型结构写成小分子。',
    },
  },
  '140607': {
    title: '结构、成键与物理性质',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E03-019-R8-FINAL-20260818',
      reason:
        '从氧化钾离子晶格与二氧化碳独立分子的原图推导导电和熔点差异，检查结构、粒子与性质的完整对应。',
    },
  },
  '140701': {
    title: '碱金属、卤素与稀有气体',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2022_NSAA_Q050',
      year: 2022,
      exam: 'NSAA',
      reason:
        '将第一族的常见离子电荷与碱性氧化物性质用于陌生元素，再联用已学同位素平均质量核对组合陈述。',
    },
  },
  '140702': {
    title: '碱金属趋势',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E04-006-R8-FINAL-20260818',
      reason:
        '依据冷水中冒泡、熔成球、点燃和更剧烈反应的观察，建立第一族金属反应性顺序，而不拿产气总量比较快慢。',
    },
  },
  '140703': {
    title: '卤素趋势与置换',
    selection: {
      kind: 'bank',
      questionCode: 'CHEM-MOCK-ADAPT-E04-007-R8-FINAL-20260818',
      reason:
        '由给定电子排布识别氯与溴的相对位置，再判断氯单质能否将溴离子氧化成单质，核对同族与反应性方向。',
    },
  },
  '140801': {
    title: '化合物中置换元素',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT_LEGACY_2021_NSAA_Q041',
      year: 2021,
      exam: 'NSAA',
      reason:
        '从金属置换和与酸反应的结果建立活动性关系，以氢为桥梁联通两组信息，验证从化合物取得单质的条件。',
    },
  },
  '140802': {
    title: '混合物的物理分离',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT-2020-CHEMISTRY-011',
      year: 2020,
      exam: 'NSAA',
      reason:
        '按题设区分可溶 NaOH 的滤液与不溶 Mg(OH)₂ 的滤渣，再承接第四章中和计算确定组分质量，不能直接把原混合物全部用于滴定。',
    },
  },
  '140803': {
    title: '选择分离方法',
    selection: {
      kind: 'annual',
      questionCode: 'ESAT-2020-CHEMISTRY-010',
      year: 2020,
      exam: 'NSAA',
      reason:
        '应用同一纸张与溶剂条件下的 Rf 比值，先合计溶剂前沿总路程，再预测斑点位置，检查色谱方法的正确读数。',
    },
  },
  '140804': {
    title: '色谱判断纯度',
    selection: {
      kind: 'bank',
      questionCode: 'ESAT-CHEM-AI-20260809-0DC21D59CD31-R4',
      reason:
        '用已分开的四个斑点判断至少检出了四种组分，保留共迁移可能掩盖其他组分的限制，不把一次图谱当成完整组成证明。',
    },
  },
}
