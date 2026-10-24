// ESAT 化学第十二至十四章固定题源：正文、图片、答案与原解析只读取已发布 Question。
import type { ChemistryLearningSelection } from "./chemistryLearningSources.js";
import type { ChemistryLearningSelfCheck } from "./chemistryLearningSelfChecks.js";

// 年度题按年份及稳定来源编号限定，避免旧组合卷的同名题成为随机回退。
const annual = (
  questionCode: string,
  year: number,
  reason: string,
): ChemistryLearningSelection => ({
  kind: "annual",
  questionCode,
  year,
  exam: "NSAA",
  reason,
});

// 题库题不声称来自历年考试，保留独立编号以使用统一正文和判分链路。
const bank = (
  questionCode: string,
  reason: string,
): ChemistryLearningSelection => ({
  kind: "bank",
  questionCode,
  reason,
});

export const chemistryChapters12To14Sources: Record<
  string,
  ChemistryLearningSelection
> = {
  "NSAA_2016_S1-Q038": annual(
    "NSAA_2016_S1-Q038",
    2016,
    "由熔融氧化物的载流子与电解产物核对概念及经验式。",
  ),
  "NSAA_2019_S1-Q054": annual(
    "NSAA_2019_S1-Q054",
    2019,
    "核对熔融溴化铅的电极产物、外电路电子方向和摩尔比。",
  ),
  "NSAA_2017_S1-Q045": annual(
    "NSAA_2017_S1-Q045",
    2017,
    "依据真实装置条件选择两极对应的半方程。",
  ),
  ESAT_LEGACY_2022_NSAA_Q047: annual(
    "ESAT_LEGACY_2022_NSAA_Q047",
    2022,
    "判断浓水溶液是否能电解得到溶质的组成元素。",
  ),
  "NSAA_2016_S1-Q053": annual(
    "NSAA_2016_S1-Q053",
    2016,
    "从水的半方程归纳气体比例、电解质浓度与整体酸碱变化。",
  ),
  "NSAA_2023_S1-Q056": annual(
    "NSAA_2023_S1-Q056",
    2023,
    "在惰性阳极条件下计算镀铜后的剩余铜离子浓度。",
  ),
  "ESAT-2020-CHEMISTRY-003": annual(
    "ESAT-2020-CHEMISTRY-003",
    2020,
    "区分烯烃通式比例与实际分子大小所需的信息。",
  ),
  ESAT_LEGACY_2022_NSAA_Q055: annual(
    "ESAT_LEGACY_2022_NSAA_Q055",
    2022,
    "从完全燃烧耗氧体积反推烷烃及反应系数。",
  ),
  "NSAA_2023_S1-Q057": annual(
    "NSAA_2023_S1-Q057",
    2023,
    "从双键数、密度和溶液浓度计算溴的完全加成用量。",
  ),
  "NSAA_2023_S1-Q042": annual(
    "NSAA_2023_S1-Q042",
    2023,
    "识别聚丁-1-烯的主链、侧链与重复边界。",
  ),
  "NSAA_2023_S1-Q060": annual(
    "NSAA_2023_S1-Q060",
    2023,
    "按指定不完全燃烧产物并计入醇内氧计算耗氧量。",
  ),
  ESAT_LEGACY_2022_NSAA_Q049: annual(
    "ESAT_LEGACY_2022_NSAA_Q049",
    2022,
    "由酯的相对分子质量反推羧酸并补回失去的水。",
  ),
  "NSAA_2019_S1-Q041": annual(
    "NSAA_2019_S1-Q041",
    2019,
    "合并提取方式、失电子倾向和氧化物置换推活性顺序。",
  ),
  "NSAA_2023_S1-Q058": annual(
    "NSAA_2023_S1-Q058",
    2023,
    "将电化学读数放在共同参照上比较金属活性。",
  ),
  "ESAT-CHEM-AI-20260809-00F53B407A16-R4": bank(
    "ESAT-CHEM-AI-20260809-00F53B407A16-R4",
    "利用镁铜合金的组分反应差异，由氢气量求镁含量。",
  ),
  "NSAA_2023_S1-Q059": annual(
    "NSAA_2023_S1-Q059",
    2023,
    "分层处理含水氧化物中的铝比例和矿石纯度。",
  ),
  "CHEM-MOCK-ADAPT-E04-023-R8-FINAL-20260818": bank(
    "CHEM-MOCK-ADAPT-E04-023-R8-FINAL-20260818",
    "直接核对过渡金属的有色化合物、可变价态和相对反应性。",
  ),
};

export const chemistryChapters12To14SelfChecks: Record<
  string,
  ChemistryLearningSelfCheck
> = {
  "141201": {
    title: "电解术语",
    selection: annual(
      "NSAA_2016_S1-Q038",
      2016,
      "现有最直接的载流子辨析题复盘；收起例题步骤后独立区分熔融离子导电和中性原子排布。",
    ),
  },
  "141202": {
    title: "电解中的直流",
    selection: annual(
      "ESAT-2020-CHEMISTRY-020",
      2020,
      "由每秒通过电子量和时间求铝质量，检验直流电子流与产量连接。",
    ),
  },
  "141203": {
    title: "电极过程",
    selection: annual(
      "ESAT_LEGACY_2022_NSAA_Q044",
      2022,
      "将阴极还原与金属失电子、还原剂定义分开判断。",
    ),
  },
  "141204": {
    title: "预测电解产物",
    selection: bank(
      "CHEM-MOCK-ADAPT-E02-017-R8-FINAL-20260818",
      "按浓盐水及惰性电极条件判断两极产物，避免错用熔融盐规则。",
    ),
  },
  "141205": {
    title: "半方程",
    selection: annual(
      "ESAT_LEGACY_2021_NSAA_Q057",
      2021,
      "统一到每摩尔电子对应的质量，比较钾、氯和铜。",
    ),
  },
  "141206": {
    title: "电镀",
    selection: bank(
      "ESAT-CHEM-AI-20260809-99F786E8ADC8-R4-V2",
      "从例题的惰性阳极迁移到银阳极，判断阴极增重和阳极溶解。",
    ),
  },
  "141301": {
    title: "有机化学通用概念",
    selection: bank(
      "CHEM-MOCK-ADAPT-E01-023-R8-FINAL-20260818",
      "同时检查分子式与双键，排除同分子式环烷烃。",
    ),
  },
  "141302": {
    title: "烷烃",
    selection: annual(
      "ESAT-2020-CHEMISTRY-012",
      2020,
      "在高温燃烧中同时计入剩余氧气、二氧化碳和水蒸气。",
    ),
  },
  "141303": {
    title: "烯烃",
    selection: bank(
      "CHEM-MOCK-ADAPT-E04-005-R8-FINAL-20260818",
      "从真实结构辨认能在无紫外光条件下使溴水褪色的双键。",
    ),
  },
  "141304": {
    title: "聚合物",
    selection: bank(
      "CHEM-MOCK-ADAPT-E01-020-R8-FINAL-20260818",
      "以聚酯重复单元补足加聚例题，检查酯键与两单体碳数。",
    ),
  },
  "141305": {
    title: "醇",
    selection: annual(
      "ESAT_LEGACY_2021_NSAA_Q049",
      2021,
      "区分醇与钠的醇盐、羧酸酯化和烯烃加成的真实产物。",
    ),
  },
  "141306": {
    title: "羧酸",
    selection: annual(
      "NSAA_2017_S1-Q039",
      2017,
      "检验弱羧酸仍有酸性且完全中和量取决于物质的量。",
    ),
  },
  "141401": {
    title: "反应性与提取",
    selection: bank(
      "CHEM-MOCK-ADAPT-E03-009-R8-FINAL-20260818",
      "比较铝、锌和金的主要提取路线及碳分界。",
    ),
  },
  "141402": {
    title: "置换与反应性顺序",
    selection: bank(
      "CHEM-MOCK-ADAPT-E02-027-R8-FINAL-20260818",
      "将三条置换证据合并为排序，再预测新的反应方向。",
    ),
  },
  "141403": {
    title: "金属与合金用途和性质",
    selection: bank(
      "ESAT-CHEM-AI-20260809-00F53B407A16-R4",
      "当前唯一直接以合金为对象的匹配题复盘；训练组分反应差异，不冒充合金晶格性质题。",
    ),
  },
  "141404": {
    title: "金属矿石与还原",
    selection: annual(
      "ESAT_LEGACY_2018_NSAA_Q43",
      2018,
      "逐步判断高炉中的氧化还原、热分解与成渣，区分提取和除杂。",
    ),
  },
  "141405": {
    title: "过渡金属性质",
    selection: bank(
      "CHEM-MOCK-ADAPT-E04-020-R8-FINAL-20260818",
      "从可变价态与催化性质定位周期表中的过渡区域。",
    ),
  },
};
