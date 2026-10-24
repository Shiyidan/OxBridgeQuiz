// 生物学习自测固定选题：只保存题库编号和入选理由；数学与化学由各科独立映射维护。
export interface LearningSelfCheckSelection {
  title: string;
  questionCode: string | null;
  reason: string;
}

// 每个已有讲义的最小知识点一项；缺题显式留空，不随机抽题或回退到原创占位题。
export const learningSelfCheckSelections: Record<
  string,
  LearningSelfCheckSelection
> = {
  "150101": {
    title: "真核细胞结构与功能",
    questionCode: "BIO-MOCK-ADAPT-E04-007-R7-FINAL-20260818",
    reason:
      "依据膜结构与功能辨认细胞核、线粒体和粗面内质网，突出结构与功能的联系。",
  },
  "150102": {
    title: "原核细胞结构与功能",
    questionCode: "BIO-MOCK-ADAPT-E02-008-R7-FINAL-20260818",
    reason: "比较细菌和动物细胞共有的膜、核糖体与不同的细胞核结构。",
  },
  "150103": {
    title: "生物体的结构层级",
    questionCode: null,
    reason: "现有已发布题库未找到直接考查细胞—组织—器官—系统层级的合适题目。",
  },
  "150201": {
    title: "扩散、渗透与主动运输",
    questionCode: "BIO-MOCK-ADAPT-E01-002-R7-FINAL-20260818",
    reason: "区分扩散的净移动和分子的持续双向运动，检验动态平衡的常见误解。",
  },
  "150301": {
    title: "有丝分裂与细胞周期",
    questionCode: "ESAT-BIO-DIRECT-007",
    reason:
      "把间期 DNA 复制与分裂结果放在一起判断，避免混淆有丝分裂和减数分裂。",
  },
  "150302": {
    title: "减数分裂与细胞周期",
    questionCode: "ESAT-BIO-DIRECT-024",
    reason: "辨别减数第一次分裂特有的同源染色体配对，而非两种分裂共有的事件。",
  },
  "150303": {
    title: "无性繁殖与有性繁殖",
    questionCode: "BIO-MOCK-ADAPT-E01-009-R7-FINAL-20260818",
    reason:
      "用匍匐茎与种子繁殖对照，检验配子融合、遗传一致性与变异之间的联系。",
  },
  "150304": {
    title: "性别决定与后代比例",
    questionCode: "ESAT-BIO-AI-ESAT-BIOLOGY-BF2B3AAC7D95",
    reason: "把生男孩的概率与传递 X 连锁等位基因的概率分开，避免漏乘性别概率。",
  },
  "150401": {
    title: "细胞核与遗传物质",
    questionCode: "BIO-MOCK-ADAPT-E01-014-R7-FINAL-20260818",
    reason:
      "区分不同细胞保留的遗传信息与实际表达的基因，避免认为特化细胞丢失其他基因。",
  },
  "150402": {
    title: "遗传术语",
    questionCode: "BIO-MOCK-ADAPT-E01-025-R7-FINAL-20260818",
    reason: "同时核对等位基因、杂合子与显性概念，针对显性等于常见的误解。",
  },
  "150403": {
    title: "单基因杂交与家系图",
    questionCode: "BIO-MOCK-ADAPT-E01-015-R7-FINAL-20260818",
    reason: "在已知个体未患病的条件下重新确定样本空间，检验携带者条件概率。",
  },
  "150501": {
    title: "基因组与染色体",
    questionCode: "ESAT-BIO-MOCK-ADAPT-E03-026-R7-FINAL-20260818",
    reason: "对照有核体细胞与成熟红细胞，检验共享基因组、差异表达和无核例外。",
  },
  "150502": {
    title: "DNA 结构与碱基配对",
    questionCode: "BIO-MOCK-ADAPT-E01-003-R7-FINAL-20260818",
    reason: "利用双链 DNA 碱基互补与总百分比推算单个碱基比例。",
  },
  "150503": {
    title: "蛋白质合成与三联体信息",
    questionCode: "BIO-MOCK-ADAPT-E02-003-R7-FINAL-20260818",
    reason: "同时检查模板链互补配对、RNA 使用 U 和转录方向。",
  },
  "150504": {
    title: "基因突变及其后果",
    questionCode: "BIO-MOCK-ADAPT-E04-006-R7-FINAL-20260818",
    reason: "区分体细胞突变的无明显影响、癌变风险和传给后代的条件。",
  },
  "150601": {
    title: "Genetic engineering（基因工程）",
    questionCode: "BIO-MOCK-ADAPT-E01-005-R7-FINAL-20260818",
    reason: "核对限制酶、互补末端、连接酶与转化的先后顺序和不同职责。",
  },
  "150602": {
    title: "Stem cells（干细胞）",
    questionCode: "ESAT-BIO-DIRECT-025",
    reason: "检验成人干细胞的染色体数、分化潜能与分裂方式，避免混同减数分裂。",
  },
  "150603": {
    title: "Selective breeding（选择育种）",
    questionCode: null,
    reason: "现有已发布题库未找到直接考查人为选择亲本及连续育种的合适题目。",
  },
  "150701": {
    title: "自然选择与进化",
    questionCode: "BIO-MOCK-ADAPT-E02-018-R7-FINAL-20260818",
    reason: "将环境变化与已有可遗传变异联系，排除用进废退和定向突变解释。",
  },
  "150702": {
    title: "变异的来源",
    questionCode: "BIO-MOCK-ADAPT-E01-006-R7-FINAL-20260818",
    reason: "通过同源插条控制遗传背景，区分环境造成的表型差异与遗传变异。",
  },
  "150801": {
    title: "酶作为生物催化剂",
    questionCode: "ESAT-BIO-AI-ESAT-BIOLOGY-580F1FF03BC5",
    reason:
      "根据底物积累和产物减少判断被抑制的催化步骤，检验酶与反应的对应关系。",
  },
  "150802": {
    title: "酶的作用机制与专一性",
    questionCode: "BIO-MOCK-ADAPT-E04-024-R7-FINAL-20260818",
    reason: "通过可逆竞争性抑制检验活性位点、底物竞争和不可逆变性的区别。",
  },
  "150803": {
    title: "温度、pH 与酶促反应速率",
    questionCode: "ESAT-BIO-AI-ESAT-BIOLOGY-0F8C25B6069F",
    reason: "比较同一温度下加热与冷却后的活性，检验高温变性是否可逆。",
  },
  "150804": {
    title: "消化酶：底物、产物与作用部位",
    questionCode: "BIO-MOCK-ADAPT-E02-009-R7-FINAL-20260818",
    reason: "同时核对消化酶、底物与产物，避免只对上一列就选择。",
  },
  "150901": {
    title: "呼吸作用",
    questionCode: "BIO-MOCK-ADAPT-E04-004-R7-FINAL-20260818",
    reason:
      "对照人体肌肉有氧和无氧呼吸的场所、能量与产物，避免套用酵母发酵产物。",
  },
  "150902": {
    title: "器官系统",
    questionCode: "BIO-MOCK-ADAPT-E02-024-R7-FINAL-20260818",
    reason: "追踪下腔静脉到肾动脉的完整血流路线，区分肺循环和体循环。",
  },
  "150903": {
    title: "稳态",
    questionCode: "BIO-MOCK-ADAPT-E04-022-R7-FINAL-20260818",
    reason: "按响应抑制或放大原有变化区分负反馈和正反馈。",
  },
  "150904": {
    title: "激素",
    questionCode: "BIO-MOCK-ADAPT-E04-013-R7-FINAL-20260818",
    reason: "区分血液运输、靶细胞受体识别与神经电信号传递。",
  },
  "150905": {
    title: "疾病与身体防御",
    questionCode: "BIO-MOCK-ADAPT-E04-014-R7-FINAL-20260818",
    reason: "区分先天防御的快速反应与特异性免疫记忆，避免把两者混为一谈。",
  },
  "151001": {
    title: "生态层级与种群变化",
    questionCode: "ESAT-BIO-DIRECT-019",
    reason: "根据长期食物资源变化判断承载力，而非把承载力视为固定常数。",
  },
  "151002": {
    title: "碳循环与水循环",
    questionCode: "ESAT-BIO-AI-ESAT-BIOLOGY-D015E8EA146F",
    reason:
      "用无光时氧下降、二氧化碳上升判断碳释放过程，避免认为植物只进行光合作用。",
  },
  "151003": {
    title: "取样调查与生物多样性",
    questionCode: "ESAT-BIO-DIRECT-023",
    reason: "先求随机样方面积和平均密度，再外推总体，避免直接乘样本总数。",
  },
  "151101": {
    title: "光合作用",
    questionCode: "ESAT-BIO-AI-ESAT-BIOLOGY-B6D8A5854E37",
    reason: "区分净氧变化和总光合作用产氧，检验是否计入同时发生的呼吸作用。",
  },
  "151102": {
    title: "植物运输系统",
    questionCode: "ESAT-BIO-DIRECT-016",
    reason: "沿源与库的水分变化推导压力差，避免把木质部蒸腾拉力套用于韧皮部。",
  },
};
