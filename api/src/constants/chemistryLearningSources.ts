// ESAT 化学前八章的精选题来源；只保存稳定编号与教学用途，正文和答案始终读取 Question。
export interface ChemistryLearningSelection {
  kind: 'annual' | 'bank'
  questionCode: string
  year?: number
  exam?: string
  paper?: string
  questionNumber?: number
  reason: string
}

// 2026-10-18 按题干、选项、答案和图表逐题审阅；年度来源同时限定年份，避免旧组合卷重名。
export const chemistryLearningSources: Record<string, ChemistryLearningSelection> = {
  'NSAA_2017_S1-Q054': {
    kind: 'annual',
    questionCode: 'NSAA_2017_S1-Q054',
    year: 2017,
    exam: 'NSAA',
    paper: 'Section 1 · Part C Chemistry',
    questionNumber: 54,
    reason: '用原子与原子核半径的比例理解核的尺度，同时检查纳米、米与飞米的换算。',
  },
  'NSAA_2016_S1-Q037': {
    kind: 'annual',
    questionCode: 'NSAA_2016_S1-Q037',
    year: 2016,
    exam: 'NSAA',
    paper: 'Section 1 · Part C Chemistry',
    questionNumber: 37,
    reason: '分别检查中子数与电子数，区分核内粒子和离子电荷，避免只满足其中一个条件。',
  },
  ESAT_LEGACY_2018_NSAA_Q37: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2018_NSAA_Q37',
    year: 2018,
    exam: 'NSAA',
    paper: 'Section 1 · Part C Chemistry',
    questionNumber: 37,
    reason: '从铜离子的核素符号读取质量数、原子序数和电荷，再逐列核对三种粒子。',
  },
  'NSAA_2017_S1-Q037': {
    kind: 'annual',
    questionCode: 'NSAA_2017_S1-Q037',
    year: 2017,
    exam: 'NSAA',
    paper: 'Section 1 · Part C Chemistry',
    questionNumber: 37,
    reason: '先按电荷计算电子数，再判断等电子排布，避免把同位素的质量数带入电子计数。',
  },
  'NSAA_2017_S1-Q052': {
    kind: 'annual',
    questionCode: 'NSAA_2017_S1-Q052',
    year: 2017,
    exam: 'NSAA',
    paper: 'Section 1 · Part C Chemistry',
    questionNumber: 52,
    reason: '由铜的相对原子质量反推同位素丰度，使用题目给出的实际同位素质量而非整数质量数。',
  },
  ESAT_LEGACY_2021_NSAA_Q043: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2021_NSAA_Q043',
    year: 2021,
    exam: 'NSAA',
    paper: 'Section 1 · Part C Chemistry',
    questionNumber: 43,
    reason: '把镁同位素表中的百分丰度作为权重，用主同位素位置检查加权平均结果。',
  },
  'NSAA_2023_S1-Q047': {
    kind: 'annual',
    questionCode: 'NSAA_2023_S1-Q047',
    year: 2023,
    exam: 'NSAA',
    paper: 'Section 1 · Part C Chemistry',
    questionNumber: 47,
    reason: '由电子排布定位周期与族，再核对上下左右的元素；同周期相邻位置的质子数相差一。',
  },
  ESAT_LEGACY_2018_NSAA_Q44: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2018_NSAA_Q44',
    year: 2018,
    exam: 'NSAA',
    paper: 'Section 1 · Part C Chemistry',
    questionNumber: 44,
    reason: '从等电子粒子的电荷推出质子数关系，说明元素由原子序数识别，不能按离子电子数排列。',
  },
  'CHEM-MOCK-ADAPT-E04-020-R8-FINAL-20260818': {
    kind: 'bank',
    questionCode: 'CHEM-MOCK-ADAPT-E04-020-R8-FINAL-20260818',
    reason: '结合周期表中央金属区域与题目给出的催化、可变价线索定位过渡金属；原图完整保留。',
  },
  'CHEM-MOCK-ADAPT-E01-003-R8-FINAL-20260818': {
    kind: 'bank',
    questionCode: 'CHEM-MOCK-ADAPT-E01-003-R8-FINAL-20260818',
    reason: '先把阳离子还原为中性原子的电子数，再确定排布与周期表位置，并核对化合物电荷守恒。',
  },
  'ESAT-2020-CHEMISTRY-001': {
    kind: 'annual',
    questionCode: 'ESAT-2020-CHEMISTRY-001',
    year: 2020,
    exam: 'NSAA',
    paper: 'Section 1 · Part C Chemistry',
    // 原卷题号按 UCLES November 2020 试卷核对；导入代码 001 并不对应原卷第 41 题。
    questionNumber: 42,
    reason: '分别比较碱金属和卤素的反应性及熔沸点，避免将不同性质、不同族的趋势混为一谈。',
  },
  // 新增题的年度来源只确认到 meta.source 的年份与考试；未核准原卷题号时不由导入编号推测。
  'ESAT-DIR-0824-CHEM-Q007-20260824-V11': {
    kind: 'bank',
    questionCode: 'ESAT-DIR-0824-CHEM-Q007-20260824-V11',
    reason: '从无副产物的重排反应核对原子组成与总电荷，区分原子重新连接和元素种类改变。',
  },
  'ESAT-2020-CHEMISTRY-005': {
    kind: 'annual',
    questionCode: 'ESAT-2020-CHEMISTRY-005',
    year: 2020,
    exam: 'NSAA',
    reason: '逐项核对常见离子电荷、括号和下标，用电中性检验化合物化学式。',
  },
  'ESAT-DIR-0824-CHEM-Q001-20260824-V11': {
    kind: 'bank',
    questionCode: 'ESAT-DIR-0824-CHEM-Q001-20260824-V11',
    reason: '物态与燃烧计量联用：冷却后将液态水排除在气体清单之外，同时保留剩余氧气。',
  },
  ESAT_LEGACY_2021_NSAA_Q050: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2021_NSAA_Q050',
    year: 2021,
    exam: 'NSAA',
    reason: '用原子数与总电荷守恒构造离子方程，核对最简系数比及比例方向。',
  },
  'NSAA_2017_S1-Q040': {
    kind: 'annual',
    questionCode: 'NSAA_2017_S1-Q040',
    year: 2017,
    exam: 'NSAA',
    reason: '分别判断两种可逆反应的初始速率和平衡产物量，避免把催化、升温和增压混为一谈。',
  },
  'ESAT-DIR-0824-CHEM-Q017-20260824-V10': {
    kind: 'bank',
    questionCode: 'ESAT-DIR-0824-CHEM-Q017-20260824-V10',
    reason: '同时检查相对质量数值与术语，区分同位素质量、相对原子质量、分子量和离子化合物式量。',
  },
  ESAT_LEGACY_2022_NSAA_Q052: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2022_NSAA_Q052',
    year: 2022,
    exam: 'NSAA',
    reason: '把粒子数和气体体积分别换算为物质的量，用空气组成与总量守恒核验结果。',
  },
  'NSAA_2023_S1-Q051': {
    kind: 'annual',
    questionCode: 'NSAA_2023_S1-Q051',
    year: 2023,
    exam: 'NSAA',
    reason: '按投药量将毫克换为克，再用双原子氯气的摩尔质量与题给摩尔体积连续换算。',
  },
  ESAT_LEGACY_2022_NSAA_Q059: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2022_NSAA_Q059',
    year: 2022,
    exam: 'NSAA',
    reason: '把已知溴质量视作产物质量的一部分，由质量分数反推相对分子质量。',
  },
  'NSAA_2017_S1-Q046': {
    kind: 'annual',
    questionCode: 'NSAA_2017_S1-Q046',
    year: 2017,
    exam: 'NSAA',
    reason: '从元素质量转为最简原子个数比，再按分子量倍数整体放大经验式下标。',
  },
  ESAT_LEGACY_2018_NSAA_Q53: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2018_NSAA_Q53',
    year: 2018,
    exam: 'NSAA',
    reason: '将两种反应物统一为摩尔数后按系数判断限量试剂，再求氧化锂的最大质量。',
  },
  ESAT_LEGACY_2022_NSAA_Q055: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2022_NSAA_Q055',
    year: 2022,
    exam: 'NSAA',
    reason: '由同温同压的耗氧体积比恢复烷烃及燃烧方程，保留题目指定的系数尺度。',
  },
  ESAT_LEGACY_2021_NSAA_Q056: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2021_NSAA_Q056',
    year: 2021,
    exam: 'NSAA',
    reason: '以气体体积比判断限量反应物，统计高温水蒸气、其他产物及过量反应物的总体积。',
  },
  'NSAA_2023_S1-Q056': {
    kind: 'annual',
    questionCode: 'NSAA_2023_S1-Q056',
    year: 2023,
    exam: 'NSAA',
    reason: '先将硫酸铜和镀出铜分别换算成摩尔数，再求剩余铜离子在最终体积中的浓度。',
  },
  ESAT_LEGACY_2021_NSAA_Q053: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2021_NSAA_Q053',
    year: 2021,
    exam: 'NSAA',
    reason: '按二元酸完全中和的比例换算物质的量，区分酸的强弱与中和计量。',
  },
  ESAT_LEGACY_2022_NSAA_Q056: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2022_NSAA_Q056',
    year: 2022,
    exam: 'NSAA',
    reason: '通过反滴定依次算剩余酸、已反应酸和原样品质量，防止把剩余量当消耗量。',
  },
  'CHEM-MOCK-ADAPT-E02-005-R8-FINAL-20260818': {
    kind: 'bank',
    questionCode: 'CHEM-MOCK-ADAPT-E02-005-R8-FINAL-20260818',
    reason: '先按样品纯度确定有效反应物，再比较实际收集量与理论产物量，分清纯度和产率。',
  },
  ESAT_LEGACY_2018_NSAA_Q43: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2018_NSAA_Q43',
    year: 2018,
    exam: 'NSAA',
    reason: '追踪高炉反应中指定物质的氧转移，区别还原、热分解和非氧化还原的成渣反应。',
  },
  'NSAA_2017_S1-Q038': {
    kind: 'annual',
    questionCode: 'NSAA_2017_S1-Q038',
    year: 2017,
    exam: 'NSAA',
    reason: '先看电子位于半反应哪一侧，再在完整反应中识别被氧化的物质，连接电子与氧的两种定义。',
  },
  ESAT_LEGACY_2021_NSAA_Q048: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2021_NSAA_Q048',
    year: 2021,
    exam: 'NSAA',
    reason:
      '用总电荷约束四个硫的氧化态之和，再排除超过硫常见最高氧化态的组合，区分平均值与单个原子的价态。',
  },
  ESAT_LEGACY_2022_NSAA_Q045: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2022_NSAA_Q045',
    year: 2022,
    exam: 'NSAA',
    reason: '逐一对照沉淀、水解与分解反应的元素氧化态，避免仅凭生成新物质或出现单质判断。',
  },
  'CHEM-MOCK-ADAPT-E02-012-R8-FINAL-20260818': {
    kind: 'bank',
    questionCode: 'CHEM-MOCK-ADAPT-E02-012-R8-FINAL-20260818',
    reason: '沿同一种起始氮的氧化态追踪两条产物分支，识别同时升价与降价的歧化反应。',
  },
  ESAT_LEGACY_2022_NSAA_Q044: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2022_NSAA_Q044',
    year: 2022,
    exam: 'NSAA',
    reason: '统一阴极、碱金属与还原剂的电子得失方向，辨明还原剂使别人还原而自身失去电子。',
  },
  'ESAT-CHEM-AI-20260809-0DC21D59CD31-R4': {
    kind: 'bank',
    questionCode: 'ESAT-CHEM-AI-20260809-0DC21D59CD31-R4',
    reason:
      '只用分离斑点判断样品含多种组分，区分至少检出四种与恰好四种，不要求先掌握完整色谱计算。',
  },
  'NSAA_2017_S1-Q042': {
    kind: 'annual',
    questionCode: 'NSAA_2017_S1-Q042',
    year: 2017,
    exam: 'NSAA',
    reason: '从钙的电子排布推导稳定离子及离子成键，并与题目联考的氧化物化学式和碱性结合。',
  },
  'CHEM-MOCK-ADAPT-E04-025-R8-FINAL-20260818': {
    kind: 'bank',
    questionCode: 'CHEM-MOCK-ADAPT-E04-025-R8-FINAL-20260818',
    reason: '读镁向两个氯原子转移电子的原图，分别判断离子电荷与固态晶格中载流子能否移动。',
  },
  'NSAA_2019_S1-Q038': {
    kind: 'annual',
    questionCode: 'NSAA_2019_S1-Q038',
    year: 2019,
    exam: 'NSAA',
    reason: '比较二氧化硅、石墨与氧化铝，核对仅有共价单键的限定，避免把所有巨型结构视作相同。',
  },
  'CHEM-MOCK-ADAPT-E03-013-R8-FINAL-20260818': {
    kind: 'bank',
    questionCode: 'CHEM-MOCK-ADAPT-E03-013-R8-FINAL-20260818',
    reason: '在金属晶格图中区分正离子和离域电子，用实际可移动的电子解释固态金属导电。',
  },
  ESAT_LEGACY_2018_NSAA_Q46: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2018_NSAA_Q46',
    year: 2018,
    exam: 'NSAA',
    reason:
      '依据题设液体分子模型解释沸点差，分清分子间作用力与分子内共价键，不外推固态五氯化磷结构。',
  },
  ESAT_LEGACY_2022_NSAA_Q043: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2022_NSAA_Q043',
    year: 2022,
    exam: 'NSAA',
    reason:
      '联合熔沸点、纯态和水溶液导电三组证据识别物质，防止把水中产生离子误当成原物质是离子晶体。',
  },
  'CHEM-MOCK-ADAPT-E01-010-R8-FINAL-20260818': {
    kind: 'bank',
    questionCode: 'CHEM-MOCK-ADAPT-E01-010-R8-FINAL-20260818',
    reason: '分别核对碱金属与水反应、卤素沸点和氩的单原子形式，避免把三个族的性质混用。',
  },
  ESAT_LEGACY_2018_NSAA_Q48: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2018_NSAA_Q48',
    year: 2018,
    exam: 'NSAA',
    reason:
      '围绕溴独立检查卤素置换方向、沸点趋势和溴化钙组成，辨别化学反应性与物理性质的不同趋势。',
  },
  'CHEM-MOCK-ADAPT-E02-009-R8-FINAL-20260818': {
    kind: 'bank',
    questionCode: 'CHEM-MOCK-ADAPT-E02-009-R8-FINAL-20260818',
    reason:
      '比较铁在三种金属盐溶液中的置换，说明从化合物得到金属单质需要化学变化，并识别自身盐不发生净置换。',
  },
  'NSAA_2019_S1-Q050': {
    kind: 'annual',
    questionCode: 'NSAA_2019_S1-Q050',
    year: 2019,
    exam: 'NSAA',
    reason:
      '先按互溶性与密度分层，再根据互溶液体的沸点选择下一步蒸馏，理解物理分离中保留哪一部分。',
  },
  ESAT_LEGACY_2018_NSAA_Q41: {
    kind: 'annual',
    questionCode: 'ESAT_LEGACY_2018_NSAA_Q41',
    year: 2018,
    exam: 'NSAA',
    reason: '用原表的真实沸点排列液态空气分馏的收集顺序，避免把熔点、密度或负数大小当成沸点顺序。',
  },
  'NSAA_2019_S1-Q039': {
    kind: 'annual',
    questionCode: 'NSAA_2019_S1-Q039',
    year: 2019,
    exam: 'NSAA',
    reason:
      '在题设充分分离的条件下先筛出只含一种物质的样品，再比较迁移距离并计算 Rf，保留纯度证据的适用条件。',
  },
}
