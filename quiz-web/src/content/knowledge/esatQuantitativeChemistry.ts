// ESAT 化学定量计算讲义：用单位、粒子、摩尔比串联计算路线，并保留全量年度真题考法的来源映射。
import type { KnowledgeExamFocus, KnowledgeLesson } from './types'
import { quantitativeChemistryMethods } from './quantitativeChemistryMethods'

const examples = {
  '140401': [
    {
      title: '数值算对，还要选对质量名称',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'bank',
        questionCode: 'ESAT-DIR-0824-CHEM-Q017-20260824-V10',
        why: '同时检查化学式中的原子个数，以及相对原子、同位素、分子和式量的名称。',
      },
      answer: 'B：CO₂ 的相对分子质量为 44.0。',
      steps: [
        '先辨认对象。单个同位素、天然元素样品、分子与离子晶体不是同一种计数对象，不能只看选项里的数字是否熟悉。',
        'CO₂ 中有 1 个 C 和 2 个 O，按题给数据得到 \\(M_r=12+2\\times16=44\\)。它由分子组成，因此“相对分子质量”这个名称也适用。',
        'O₂ 要把 2 个氧都计入，不能直接拿一个氧原子的相对原子质量。KBr 是离子化合物，应使用相对式量，而不是把它描述成独立的 KBr 分子。',
        '最后分清镁的 24.3：这是天然同位素混合样品的相对原子质量，不能把这一加权结果叫作一个同位素的相对质量。',
      ],
      optionNotes: [
        'A：24.3 对应镁的相对原子质量，不是题述相对同位素质量。',
        'B：CO₂ 的原子计数、数值和名称均相符。',
        'C：漏算了 O₂ 中的第二个氧原子。',
        'D：KBr 的数值可按化学式求和，但离子化合物应称相对式量。',
      ],
      takeaway: '先问“在称哪一种粒子”，再展开下标。数值正确与术语正确必须同时满足。',
    },
  ],
  '140402': [
    {
      title: '把粒子数与气体体积换成同一种单位',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'ESAT_LEGACY_2022_NSAA_Q052',
        why: '把粒子数和体积统一为 mol，再用组成比例识别空气成分。',
      },
      answer: 'A：X 为 Ar，Y 为 N₂，其余气体共 5.250 mol。',
      steps: [
        '本题指定 \\(N_A=6.00\\times10^{23}\\,\\mathrm{mol^{-1}}\\)，应使用题给值。X 的物质的量为 \\(n_X=(1.50\\times10^{23})/(6.00\\times10^{23})=0.250\\,\\mathrm{mol}\\)。',
        'Y 的体积是 468 dm³，题给摩尔体积为 24.0 dm³ mol⁻¹，因此 \\(n_Y=468/24.0=19.5\\,\\mathrm{mol}\\)。两项都转为 mol 后才可与总量相加减。',
        'X 占总量的 \\(0.250/25.0=1.00\\%\\)，Y 占 \\(19.5/25.0=78.0\\%\\)。结合干燥空气的组成，分别对应氩与氮气。这一步需要空气组成知识。',
        '其余气体合计 \\(25.0-0.250-19.5=5.250\\,\\mathrm{mol}\\)。氩的计数对象是原子，氮气的计数对象是 N₂ 分子；不能额外把氮气摩尔数乘 2 后再从气体总量中扣除。',
      ],
      optionNotes: [
        'A：两种气体的身份与剩余物质的量均吻合。',
        'B、C、F：把约 1% 的成分认成氧气，或把约 78% 的成分认成氩气，组成比例不符。',
        'D、E、F：5.375 mol 与按气体粒子计算的剩余量不符；不能把分子与其中的原子数混用。',
      ],
      takeaway: '不同单位的数据先汇入 mol，再做总量与比例比较；全过程保留粒子名称。',
    },
  ],
  '140403': [
    {
      title: '从每天的毫克用量，算到氯气的摩尔数',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'NSAA_2023_S1-Q051',
        why: '练习先合并总质量、换单位，再选择正确的双原子分子摩尔质量。',
      },
      answer: 'C：48 dm³。',
      steps: [
        '每天处理 355000 dm³ 水，每 dm³ 用 0.4 mg 氯气，所以总质量为 \\(355000\\times0.4=142000\\,\\mathrm{mg}=142\\,\\mathrm{g}\\)。这里先求总量，不把 0.4 mg 直接带入后面的气体公式。',
        '氯气是 Cl₂。题给 \\(A_r(Cl)=35.5\\)，故 \\(M(Cl_2)=2\\times35.5=71.0\\,\\mathrm{g\\,mol^{-1}}\\)。',
        '由 \\(n=m/M\\)，得到 \\(n(Cl_2)=142/71=2.00\\,\\mathrm{mol}\\)。这一步将可称量的质量转换成气体粒子的物质的量。',
        '再使用题给的 \\(V_m=24\\,\\mathrm{dm^3\\,mol^{-1}}\\)：\\(V=nV_m=2.00\\times24=48\\,\\mathrm{dm^3}\\)。单位核对为 mol × dm³ mol⁻¹ = dm³。',
      ],
      optionNotes: [
        'C：与 142 g → 2.00 mol → 48 dm³ 的路线相符。',
        'D：96 dm³ 会把一个 Cl 原子的 35.5 当成 Cl₂ 的摩尔质量，导致摩尔数翻倍。',
        'A、B、E、F：均不符合题给总质量、Cl₂ 摩尔质量及摩尔体积同时成立的结果。',
      ],
      takeaway: '质量换算写成带单位的一行；求分子物质的 mol 时，分母必须是整个分子的摩尔质量。',
    },
  ],
  '140404': [
    {
      title: '已知溴的质量占比，倒推整分子的质量',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'ESAT_LEGACY_2022_NSAA_Q059',
        why: '把“一个分子中有多少溴”与“溴占总质量多少”连接起来，避免把质量比例当原子数比。',
      },
      answer: 'E：产物的 Mᵣ 为 300。',
      steps: [
        '1 mol 烃恰好与 1 mol Br₂ 加成，产物每个分子包含 2 个 Br 原子。因此每摩尔产物中溴贡献的质量为 \\(2\\times80=160\\,\\mathrm{g}\\)。',
        '设产物相对分子质量为 \\(M_r\\)。溴的质量分数是 8/15，因此 \\(160/M_r=8/15\\)，得到 \\(M_r=160\\times15/8=300\\)。',
        '可反向复核：碳贡献 \\(300\\times6/15=120\\)，对应 10 个 C；氢贡献 \\(300\\times1/15=20\\)，对应 20 个 H。得到的原子计数与一次 Br₂ 加成相容。',
        '题中的 6∶1∶8 是三种元素的质量比，不是下标比；若要从它求原子比，必须分别除以相应的相对原子质量。',
      ],
      optionNotes: [
        'A：150 对应只计入一个 Br 原子，遗漏了题中加入的是 Br₂。',
        'E：160/300 = 8/15，同时符合每个产物分子有两个 Br 的条件。',
        'B、C、D、F、G、H：将各数代入 160/Mᵣ，均不能得到 8/15。',
      ],
      takeaway: '反求总量时，用“已知部分 ÷ 部分占比”；先从反应条件确认该部分究竟包含几个原子。',
    },
  ],
  '140405': [
    {
      title: '先求最简比，再把所有下标同时放大',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'NSAA_2017_S1-Q046',
        why: '从样品质量求经验式，再利用真实分子质量与经验式量的倍数关系得到分子式。',
      },
      answer: 'E：C₄F₆。',
      steps: [
        '这是只含 C、F 的化合物。81 g 样品含 57 g F，故碳质量为 \\(81-57=24\\,\\mathrm{g}\\)。先补齐质量，不能把 81 g 当碳的质量。',
        '分别换成元素原子的 mol：\\(n(C)=24/12=2\\)，\\(n(F)=57/19=3\\)。所以最简原子数比为 2∶3，经验式为 C₂F₃。',
        '题目明确说真实相对分子质量是经验式量的 2 倍，所以每个下标都乘 2，得到 C₄F₆；不是只把其中一个下标翻倍。',
        '复核：C₂F₃ 的经验式量为 \\(2\\times12+3\\times19=81\\)，C₄F₆ 为 162，确实是 2 倍；氟质量分数也与 57/81 一致。',
      ],
      optionNotes: [
        'A：C₂F₃ 是经验式，未利用分子质量的倍数条件。',
        'E：最简比与两倍经验式量两个条件同时满足。',
        'B、C、D、F：化学式中的 C∶F 原子比与 2∶3 不符。',
      ],
      takeaway:
        '质量 → 各元素 mol → 最简整数比 → 整体倍乘。每一步都有不同的任务，不能跳过中间的 mol。',
    },
  ],
  '140406': [
    {
      title: '两种反应物都给量，先找谁先用完',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'ESAT_LEGACY_2018_NSAA_Q53',
        why: '将质量和气体体积统一为 mol，用系数归一后的量识别限量反应物。',
      },
      answer: 'B：最多生成 3.00 g Li₂O。',
      steps: [
        '先写对反应：\\(4Li+O_2\\rightarrow2Li_2O\\)。这里的 4∶1∶2 是摩尔比，不是质量比。',
        '锂为 \\(2.80/7=0.400\\,\\mathrm{mol}\\)，氧气为 \\(1.20/24.0=0.0500\\,\\mathrm{mol}\\)。将两种反应物都换算，不能只计算较小的质量或体积。',
        '比较 \\(n/\\text{系数}\\)：锂为 0.400/4 = 0.100，氧气为 0.0500/1 = 0.0500。氧气先用完，决定反应最多能进行多少。',
        '由 O₂∶Li₂O = 1∶2，可生成 \\(0.0500\\times2=0.100\\,\\mathrm{mol}\\) Li₂O。\\(M(Li_2O)=2\\times7+16=30\\,\\mathrm{g\\,mol^{-1}}\\)，故产物质量为 3.00 g。',
        '核对剩余锂：消耗 0.200 mol，即 1.40 g；它与参加反应的 1.60 g 氧相加恰为 3.00 g。多余锂不能计入产物质量。',
      ],
      optionNotes: [
        'B：由限量的氧气算得 3.00 g。',
        'A：1.50 g 少了一倍，未正确使用 O₂∶Li₂O 的 1∶2 系数比。',
        'E：6.00 g 相当于把全部 0.400 mol 锂都用于生成氧化物，没有检查氧是否足够。',
        'C、D、F、G：均不符合氧原子供应量和配平后的计量关系。',
      ],
      takeaway: '两份起始量都出现时，先比 n/系数，再由较小者计算产物；过量部分另列。',
    },
  ],
  '140407': [
    {
      title: '把耗氧体积比读成方程系数',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'ESAT_LEGACY_2022_NSAA_Q055',
        why: '从同温同压气体体积比确定耗氧系数，再用原子守恒确定其余系数。',
      },
      answer: 'D：a + b + c = 15.5。',
      steps: [
        '题目给的是同温同压下 100 cm³ 烷烃恰好消耗 650 cm³ O₂，所以烷烃∶O₂ 的摩尔比为 1∶6.5。原式已把烷烃系数固定为 1，因此 a = 6.5。',
        '烷烃通式为 \\(C_nH_{2n+2}\\)。完全燃烧时 C 原子进入 n 个 CO₂，H 原子进入 n + 1 个 H₂O；所需氧原子共 \\(2n+(n+1)=3n+1\\) 个。',
        'O₂ 系数满足 \\((3n+1)/2=6.5\\)，得到 n = 4。于是 b = 4，c = 5，\\(a+b+c=6.5+4+5=15.5\\)。',
        '这道题允许 a 为分数，因为题面固定了烷烃系数为 1。若把整个方程翻倍成整数系数，不能再用翻倍后的 a、b、c 回答原题。',
      ],
      optionNotes: [
        'D：符合 1 mol 烷烃消耗 6.5 mol O₂ 的归一化形式。',
        'A、B、C、E、F：均不能同时满足耗氧比、烷烃通式以及碳氢氧守恒。',
      ],
      takeaway:
        '实验给“恰好消耗”才能直接读反应比；先看题面把哪一项的系数固定，再决定是否整体约成整数。',
    },
  ],
  '140408': [
    {
      title: '总气体体积要加上剩余反应物',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'ESAT_LEGACY_2021_NSAA_Q056',
        why: '无需强套 24 dm³，在相同温度、压力条件下直接按气体体积比处理限量与剩余。',
      },
      answer: 'B：110 dm³。',
      steps: [
        '原式为 \\(4NH_3+5O_2\\rightarrow4NO+6H_2O(g)\\)。所有气体都在 850 °C、同一压力下比较，所以体积比可直接使用系数比；此处不应套室温的 24 dm³ mol⁻¹。',
        '分别以体积除以反应系数：NH₃ 为 50/4 = 12.5，O₂ 为 50/5 = 10。氧气限量，反应使用 40 dm³ NH₃，留下 10 dm³ NH₃。',
        '50 dm³ O₂ 对应生成 \\(50\\times4/5=40\\,\\mathrm{dm^3}\\) NO 与 \\(50\\times6/5=60\\,\\mathrm{dm^3}\\) 水蒸气。',
        '题问反应后所有气体，故总量为 \\(10+40+60=110\\,\\mathrm{dm^3}\\)。水在题设高温下为气体，不能像冷却后液态水一样删去。',
      ],
      optionNotes: [
        'A：100 dm³ 只合计了两种产物，遗漏剩余的 NH₃。',
        'B：包含剩余 NH₃、NO 和水蒸气，符合题设。',
        'D：125 dm³ 会按全部 NH₃ 反应来推产物，但实际氧气不足。',
        'C、E：与限量氧气决定的消耗量及产物量不符。',
      ],
      takeaway: '列“开始—变化—剩余”表；题问总气体时，把气态产物和未反应气体一起相加。',
    },
  ],
  '140409': [
    {
      title: '电镀后的浓度：先记物质的量账本',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'NSAA_2023_S1-Q056',
        why: '从初始溶质质量扣除已转化的铜离子，再除以最终溶液体积。',
      },
      answer: 'E：0.75 mol dm⁻³。',
      steps: [
        '无水 CuSO₄ 的 \\(M_r=64+32+4\\times16=160\\)，80.0 g 对应 \\(80.0/160=0.500\\,\\mathrm{mol}\\)。每个化学式单位贡献 1 个 Cu²⁺，所以初始铜离子为 0.500 mol。',
        '镀层含 8.00 g Cu，即 \\(8.00/64=0.125\\,\\mathrm{mol}\\)。Cu²⁺ 变成 Cu 的粒子数比为 1∶1，因此消耗 0.125 mol Cu²⁺。得 2 个电子不意味着消耗 2 个铜离子。',
        '另一电极是惰性石墨，不会补入铜。剩余铜离子为 \\(0.500-0.125=0.375\\,\\mathrm{mol}\\)。',
        '最后补水至 500 cm³，即 0.500 dm³。浓度为 \\(c=0.375/0.500=0.750\\,\\mathrm{mol\\,dm^{-3}}\\)。补水改变体积，不补回已经镀出的铜。',
      ],
      optionNotes: [
        'E：按剩余 Cu²⁺ 的 mol 除以最终 0.500 dm³，结果为 0.75。',
        'D：0.50 会把每个 Cu²⁺ 得 2 个电子错当成铜离子的消耗倍数。',
        'G：1.0 是初始浓度，忽略了镀出铜造成的离子损失。',
        'A、B、C、F：不符合初始量减去已消耗量再除以最终体积的账目。',
      ],
      takeaway: '先更新 n，再用最终 V 求 c；浓度不能直接用“固体质量减固体质量”来相减。',
    },
  ],
  '140410': [
    {
      title: '二元弱酸也要按两个酸性氢计量',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'ESAT_LEGACY_2021_NSAA_Q053',
        why: '区分酸的强弱与可中和的总量，按化学计量关系求所需体积。',
      },
      answer: 'A：10.0 cm³。',
      steps: [
        'NaOH 的物质的量为 \\(2.00\\times25.0/1000=0.0500\\,\\mathrm{mol}\\)。先统一 cm³ 与 dm³，再代入 n = cV。',
        '乙二酸是二元酸，完全中和时每 1 mol 酸可与 2 mol NaOH 反应。因此所需酸为 \\(0.0500/2=0.0250\\,\\mathrm{mol}\\)。',
        '酸浓度为 2.50 mol dm⁻³，体积 \\(V=n/c=0.0250/2.50=0.0100\\,\\mathrm{dm^3}=10.0\\,\\mathrm{cm^3}\\)。',
        '“弱酸”不表示只有初始已经电离的少量 H⁺ 能参与滴定。持续消耗 H⁺ 会使酸继续电离，完全中和的总量仍按二元酸的化学式计算。',
      ],
      optionNotes: [
        'A：符合酸∶NaOH = 1∶2，并完成体积换算。',
        'C：20.0 cm³ 相当于误用 1∶1，遗漏第二个可中和的酸性氢。',
        'B、D、E：与 0.0250 mol 酸及 2.50 mol dm⁻³ 的条件不符。',
      ],
      takeaway: '先配中和比例，后代 cV；“强弱”和“元数”分别回答不同问题。',
    },
    {
      title: '反滴定：先测剩余，再求原先消耗',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'annual',
        questionCode: 'ESAT_LEGACY_2022_NSAA_Q056',
        why: '从过量酸的初始量减去滴定测得的剩余量，反求碳酸盐质量。',
      },
      answer: 'C：168 mg。',
      steps: [
        '最初加入的 HCl 为 \\(0.10\\times50/1000=0.0050\\,\\mathrm{mol}\\)。这是总加入量，不是碳酸镁实际消耗量。',
        '剩余酸与 NaOH 按 1∶1 中和。NaOH 用量为 \\(0.20\\times5.0/1000=0.0010\\,\\mathrm{mol}\\)，所以剩余 HCl 也是 0.0010 mol。',
        '碳酸镁消耗的 HCl 为 \\(0.0050-0.0010=0.0040\\,\\mathrm{mol}\\)。由 \\(MgCO_3+2HCl\\rightarrow MgCl_2+CO_2+H_2O\\)，得 \\(n(MgCO_3)=0.0040/2=0.0020\\,\\mathrm{mol}\\)。',
        '质量 \\(m=0.0020\\times84=0.168\\,\\mathrm{g}=168\\,\\mathrm{mg}\\)。题问 mg，不能停在 g。',
      ],
      optionNotes: [
        'C：按初始酸减剩余酸，再除以 2 并换算单位，得到 168 mg。',
        'D：210 mg 相当于把初始酸全部当成被碳酸镁消耗。',
        'E：336 mg 漏掉 MgCO₃∶HCl = 1∶2 中的除以 2。',
        'A、B、F：与完整的两次反应及酸量差额不符。',
      ],
      takeaway: '反滴定先写“初始 − 剩余 = 被样品消耗”，再用样品反应的系数比。',
    },
  ],
  '140411': [
    {
      title: '纯度先修正原料，产率再修正产物',
      question: '',
      source: {
        subject: 'chemistry',
        kind: 'bank',
        questionCode: 'CHEM-MOCK-ADAPT-E02-005-R8-FINAL-20260818',
        why: '把原料纯度、理论产量与实际收集量分开，避免百分数连用时选错基数。',
      },
      answer: 'C：75%。',
      steps: [
        '10.0 g 石灰石只有 80% 是 CaCO₃，所以能参与反应的 CaCO₃ 为 \\(10.0\\times0.80=8.00\\,\\mathrm{g}\\)。杂质不能用来计算理论 CaO。',
        '反应 \\(CaCO_3\\rightarrow CaO+CO_2\\) 中 CaCO₃∶CaO = 1∶1。CaCO₃ 为 \\(8.00/100=0.0800\\,\\mathrm{mol}\\)，理论上生成同样物质的量的 CaO。',
        'CaO 的理论质量为 \\(0.0800\\times56=4.48\\,\\mathrm{g}\\)。实际收集 3.36 g，所以 \\(\\text{百分产率}=3.36/4.48\\times100\\%=75\\%\\)。',
        '80% 是原料中有效成分所占的比例，75% 是实际产物相对理论产物的比例。它们的分母不同，不能直接取其中一个当另一个。',
      ],
      optionNotes: [
        'A：42% 使用 3.36/8.00，拿 CaO 质量与 CaCO₃ 质量直接相比，漏掉摩尔质量转换。',
        'B：60% 使用未修正纯度的理论量 5.60 g 作为分母。',
        'C：理论产量基于纯 CaCO₃，结果为 75%。',
        'D：80% 是原料纯度，不是产率。',
        'E：约 133% 把理论量与实际量的比值写反。',
      ],
      takeaway: '先在原料端修正纯度，再按限量和系数算理论量，最后才与实际收集量比较。',
    },
  ],
} satisfies Record<string, KnowledgeExamFocus['examples']>

export const esatQuantitativeChemistry: KnowledgeLesson = {
  code: '140400',
  title: 'Quantitative Chemistry · 定量化学',
  subtitle: '先统一单位，再沿摩尔比完成计算',
  intro:
    '质量、粒子数、气体体积和浓度通过物质的量相连；跨物质计算用方程系数，再按限量、剩余、取样和产率修正。',
  memory: [
    '**同一种物质的单位转换**：\\(n=m/M\\)，\\(N=nN_A\\)，\\(n=V/V_m\\)，\\(n=cV\\)。先写清粒子名称。',
    '**两种物质之间靠方程系数**：\\(n(A)/a=n(B)/b\\)；限量问题先比较各反应物的 \\(n/\\text{系数}\\)。',
    '==质量比不是原子数比，系数比也不是质量比==；质量必须先经过摩尔质量。',
    '使用 g mol⁻¹ 时质量用 g；使用 mol dm⁻³ 时体积用 dm³。**1 kg = 1000 g；1 tonne = 10⁶ g；1 dm³ = 1000 cm³**。',
    '**反应后总气体 = 气态产物 + 未反应气体**；温压与水的状态由题目决定，24 dm³ mol⁻¹ 不是通用常数。',
    '**稀释守恒 n；反滴定用初始减剩余；纯度修正原料，产率比较同一种产物的实际量与理论量**。',
  ],
  sections: [
    {
      code: '140401',
      title: '相对分子质量与相对式量',
      summary: quantitativeChemistryMethods['140401'].summary,
      paragraphs: [quantitativeChemistryMethods['140401'].intro],
      memory: quantitativeChemistryMethods['140401'].memory,
      rules: quantitativeChemistryMethods['140401'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把 Mᵣ 写成 g 或 g mol⁻¹，混淆相对量与摩尔质量。',
        '把 O₂ 的摩尔质量写成 16，或漏掉括号、结晶水。',
        '已知是离子晶体却称为相对分子质量。',
      ],
      sourceIds: ['uat-c4', 'openstax-mass'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '在完整化学式、原子计数、Mᵣ 和摩尔质量之间准确转换。',
        pastPaperSummary:
          '真题常把 Mᵣ 藏在后续计算的起点，也会让你先识别化合物或从已知质量信息反推未知部分。先检查化学式，能避免后面每一步都带着同一个错误。',
        pastPaperPatterns: [
          {
            form: '完整化学式计数后进入计算',
            description:
              '先算双原子分子、含括号的盐、氧化物或水合物的摩尔质量，再进入气量、质量分数、配液与矿石计算；结晶水和下标直接影响后续结果。',
            reference: '2016—2019、2022、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q047',
              'NSAA_2016_S1-Q050',
              'NSAA_2017_S1-Q044',
              'NSAA_2017_S1-Q047',
              'NSAA_2017_S1-Q050',
              'ESAT_LEGACY_2018_NSAA_Q47',
              'ESAT_LEGACY_2018_NSAA_Q48',
              'ESAT_LEGACY_2018_NSAA_Q53',
              'NSAA_2019_S1-Q046',
              'ESAT_LEGACY_2022_NSAA_Q060',
              'NSAA_2023_S1-Q049',
              'NSAA_2023_S1-Q051',
              'NSAA_2023_S1-Q056',
              'NSAA_2023_S1-Q059',
            ],
          },
          {
            form: '先确定组成，再求或比较 Mᵣ（综合）',
            description:
              '由同位素图、离子检验、反应关系或有机结构确定计数对象，再求式量或检验分子质量范围；不能在化学式尚未确定时直接套数。',
            reference: '2019、2022 NSAA',
            sourceCodes: [
              'NSAA_2019_S1-Q040',
              'NSAA_2019_S1-Q045',
              'ESAT_LEGACY_2022_NSAA_Q049',
              'ESAT_LEGACY_2022_NSAA_Q054',
              'ESAT_LEGACY_2022_NSAA_Q059',
            ],
          },
          {
            form: '由整体、浓度或倍数反推',
            description:
              '利用化合物与部分原子的式量差、质量浓度与摩尔浓度之比，或分子式与经验式的倍数关系反求信息；还会询问仅有组成比例是否足够确定分子式。',
            reference: '2017、2020、2023 NSAA',
            sourceCodes: [
              'NSAA_2017_S1-Q046',
              'ESAT-2020-CHEMISTRY-003',
              'ESAT-2020-CHEMISTRY-015',
              'NSAA_2023_S1-Q054',
            ],
          },
        ],
        examples: examples['140401'],
        checklist: [
          '能展开括号和结晶水，不遗漏原子。',
          '能区分 Mᵣ 与 M 的名称和单位。',
          '能分开方程系数与化学式下标。',
        ],
      },
    },
    {
      code: '140402',
      title: '阿伏伽德罗常数',
      summary: quantitativeChemistryMethods['140402'].summary,
      paragraphs: [quantitativeChemistryMethods['140402'].intro],
      memory: quantitativeChemistryMethods['140402'].memory,
      rules: quantitativeChemistryMethods['140402'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把 1 mol O₂ 分子与 1 mol O 原子当成相同量的氧。',
        '把离子电荷数当成每个式量单位中的离子个数。',
        '把指数 10²³ 漏掉，或无视题给的 Nₐ 近似值。',
      ],
      sourceIds: ['uat-c4', 'bipm-mole', 'openstax-mass'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '在明确粒子种类后使用 N = nNₐ，并处理每份物质包含多个粒子的情况。',
        pastPaperSummary:
          '直接代入 Nₐ 的题目数量有限；相关综合题还会考查同一份物质包含多少离子、电子或气体粒子。先统一计数对象，再与总量比较。',
        pastPaperPatterns: [
          {
            form: '粒子数、气量与组成联合判断',
            description:
              '把一种成分的粒子数与另一种成分的气体体积分别换成 mol，再识别混合物组成并求剩余量；计数对象不能在原子与分子间偷偷切换。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q052'],
          },
          {
            form: '指定粒子的倍数关系（综合）',
            description:
              '从溶质 mol 求离子总 mol，或按电极过程把电子的 mol 转成物质的 mol；此类题不一定需要代入 Nₐ 数值，但必须分清正在数什么。',
            reference: '2020、2021、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-020',
              'ESAT_LEGACY_2021_NSAA_Q057',
              'NSAA_2023_S1-Q045',
            ],
          },
        ],
        examples: examples['140402'],
        checklist: [
          '能在每个 n 旁写出粒子名称。',
          '能从化学式确定原子或离子的计数倍数。',
          '能正确处理科学计数法及题给常数。',
        ],
      },
    },
    {
      code: '140403',
      title: '摩尔与质量换算',
      summary: quantitativeChemistryMethods['140403'].summary,
      paragraphs: [quantitativeChemistryMethods['140403'].intro],
      memory: quantitativeChemistryMethods['140403'].memory,
      rules: quantitativeChemistryMethods['140403'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '质量用 mg、M 用 g mol⁻¹，却没有先除以 1000。',
        '给的是总混合物质量，却按其中一种物质的 M 全部换算。',
        '用相同质量推断相同 mol，忽略摩尔质量不同。',
      ],
      sourceIds: ['uat-c4', 'openstax-mass', 'openstax-stoichiometry'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '先识别有效质量与单位，再把它转换为题目真正需要的物质的量。',
        pastPaperSummary:
          'm/M 既是直接换算，也是经验式、气量、滴定和电解题的中间步骤。跨题的共同难点在于先选对质量，再处理粒子与反应比例。',
        pastPaperPatterns: [
          {
            form: '质量与气量、粒子量及浓度互换',
            description:
              '给出金属或化合物质量求气量，或由气体、电极产物反求质量；也会把溶液的 mol 与质量相连，换算或比较两种浓度。需检查计数对象与质量单位。',
            reference: '2016—2019、2020—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q038',
              'NSAA_2016_S1-Q047',
              'NSAA_2016_S1-Q051',
              'NSAA_2016_S1-Q052',
              'NSAA_2017_S1-Q044',
              'NSAA_2017_S1-Q047',
              'NSAA_2017_S1-Q050',
              'ESAT_LEGACY_2018_NSAA_Q50',
              'NSAA_2019_S1-Q046',
              'ESAT-2020-CHEMISTRY-020',
              'ESAT_LEGACY_2021_NSAA_Q057',
              'ESAT_LEGACY_2022_NSAA_Q046',
              'ESAT_LEGACY_2022_NSAA_Q060',
              'NSAA_2023_S1-Q051',
              'NSAA_2023_S1-Q054',
            ],
          },
          {
            form: '组成质量 → 原子比或反应比例',
            description:
              '把元素质量分别除以各自摩尔质量后求化学式，或把沉淀质量换成 mol 反推未知物的组成；质量比本身不能直接成为下标比。',
            reference: '2016、2017、2019 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q041',
              'NSAA_2017_S1-Q046',
              'NSAA_2019_S1-Q043',
              'NSAA_2019_S1-Q047',
            ],
          },
          {
            form: '混合物、剩余量与取样回算',
            description:
              '由气体、沉淀、滴定或镀层测得已反应的量，再反推混合物中的成分或剩余质量；水合物还要求使用实际称取物的摩尔质量。',
            reference: '2016、2018—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q050',
              'ESAT_LEGACY_2018_NSAA_Q47',
              'ESAT_LEGACY_2018_NSAA_Q52',
              'NSAA_2019_S1-Q052',
              'ESAT-2020-CHEMISTRY-011',
              'ESAT_LEGACY_2021_NSAA_Q058',
              'ESAT_LEGACY_2021_NSAA_Q059',
              'ESAT_LEGACY_2022_NSAA_Q056',
              'NSAA_2023_S1-Q056',
              'NSAA_2023_S1-Q059',
            ],
          },
          {
            form: '比较反应量与限量',
            description:
              '将质量和溶液给出的量统一为 mol，比较限量、终点产量或同质量不同物质的效果；还会把这些差异放进速率图像或工艺选项。',
            reference: '2017—2020、2023 NSAA',
            sourceCodes: [
              'NSAA_2017_S1-Q048',
              'NSAA_2017_S1-Q051',
              'NSAA_2017_S1-Q053',
              'ESAT_LEGACY_2018_NSAA_Q53',
              'NSAA_2019_S1-Q049',
              'NSAA_2019_S1-Q051',
              'ESAT-2020-CHEMISTRY-014',
              'ESAT-2020-CHEMISTRY-018',
              'NSAA_2023_S1-Q049',
            ],
          },
          {
            form: '密度或每摩尔能量作为前后一步（综合）',
            description:
              '先用体积与密度取得样品质量，再换 mol；或将质量换 mol 后连接每摩尔放热。计算链中每一段使用的物质和单位都要保持对应。',
            reference: '2021、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q054', 'NSAA_2023_S1-Q055', 'NSAA_2023_S1-Q057'],
          },
        ],
        examples: examples['140403'],
        checklist: [
          '能在使用 g mol⁻¹ 前先统一质量单位。',
          '能区分总样品、有效成分、已反应和剩余质量。',
          '能用单位消去检查乘除方向。',
        ],
      },
    },
    {
      code: '140404',
      title: '质量百分组成',
      summary: quantitativeChemistryMethods['140404'].summary,
      paragraphs: [quantitativeChemistryMethods['140404'].intro],
      memory: quantitativeChemistryMethods['140404'].memory,
      rules: quantitativeChemistryMethods['140404'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '用原子个数占比替代质量占比。',
        '把结晶水或其他元素从分母漏掉。',
        '百分数相加或相乘前没有确认它们的基数。',
      ],
      sourceIds: ['uat-c4', 'openstax-composition'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '分清“部分”和“整体”，在化学式、质量分数与样品总量之间来回转换。',
        pastPaperSummary:
          '真题既正向核对元素的质量占比，也反向利用占比确定分子信息；混合物与矿石题会再叠加纯度，不能把不同基数的百分数混用。',
        pastPaperPatterns: [
          {
            form: '化学式与质量分数相互核验',
            description:
              '先按常见化学式求元素质量贡献，检查给出的百分组成；或由加成反应确定某元素原子数，再用其质量分数反推整个分子质量。',
            reference: '2018、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q48', 'ESAT_LEGACY_2022_NSAA_Q059'],
          },
          {
            form: '组成数据是否足以确定分子',
            description:
              '询问仅有元素百分组成能否确定分子式，识别相同比例可以对应不同分子大小；质量分数给出组成比例，不自动给出整个分子的质量。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-003'],
          },
          {
            form: '纯度与化合物内的元素比例（综合）',
            description:
              '通过反应测定样品中有效成分的质量，或从目标金属量倒推含水矿物与矿石的总量；每一步都要注明占比的分母。',
            reference: '2019、2023 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q052', 'NSAA_2023_S1-Q059'],
          },
        ],
        examples: examples['140404'],
        checklist: [
          '能说明百分数的分母是哪一份物质。',
          '能从化学式计算质量分数并反向检验。',
          '能分开元素组成、样品纯度与产率。',
        ],
      },
    },
    {
      code: '140405',
      title: '经验式与分子式',
      summary: quantitativeChemistryMethods['140405'].summary,
      paragraphs: [quantitativeChemistryMethods['140405'].intro],
      memory: quantitativeChemistryMethods['140405'].memory,
      rules: quantitativeChemistryMethods['140405'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '直接把质量比写成化学式下标。',
        '把分数比四舍五入，而不是同时乘一个数。',
        '已得经验式就停止，遗漏 Mᵣ 给出的分子倍数。',
      ],
      sourceIds: ['uat-c4', 'openstax-composition'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '从质量或反应测量恢复原子比，并说明还需什么才能确定分子式。',
        pastPaperSummary:
          '常见设问把化合物组成藏在总质量、气体或沉淀里；先恢复原子比，再检查分子质量或其他反应条件，避免把最简式直接当分子式。',
        pastPaperPatterns: [
          {
            form: '总质量与一元素质量 → 最简式',
            description:
              '从二元化合物样品的总质量补出另一元素质量，分别换成 mol 后求最简整数比；分数下标需要整体放大。',
            reference: '2016、2017、2019 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q041', 'NSAA_2017_S1-Q046', 'NSAA_2019_S1-Q043'],
          },
          {
            form: '产物测量 → 未知元素比例',
            description:
              '由电解气体、沉淀质量或反应消耗量反求化合物下标；需要分清测得的是双原子气体、离子还是完整化学式单位。',
            reference: '2016、2019、2022、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q038',
              'NSAA_2019_S1-Q047',
              'ESAT_LEGACY_2022_NSAA_Q058',
              'NSAA_2023_S1-Q053',
            ],
          },
          {
            form: '经验式以外还需什么信息',
            description:
              '利用分子质量倍数求分子式，或判断百分组成能否区分同系列分子；明确最简原子比与实际分子大小是两项不同信息。',
            reference: '2017、2020 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q046', 'ESAT-2020-CHEMISTRY-003'],
          },
          {
            form: '燃烧数据与有机结构联合约束',
            description:
              '由耗氧量或 CO₂ 体积判断碳氢数，再与烷烃通式、加成条件或重复单元质量一起核验结构；不能仅凭一种反应现象猜式子。',
            reference: '2020、2022 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-016',
              'ESAT_LEGACY_2022_NSAA_Q054',
              'ESAT_LEGACY_2022_NSAA_Q055',
            ],
          },
        ],
        examples: examples['140405'],
        checklist: [
          '能用元素 mol 比而不是质量比写式子。',
          '能把 1∶1.5 等比值变成最简整数比。',
          '能指出分子式比经验式多需要的一项信息。',
        ],
      },
    },
    {
      code: '140406',
      title: '方程质量计算与限量',
      summary: quantitativeChemistryMethods['140406'].summary,
      paragraphs: [quantitativeChemistryMethods['140406'].intro],
      memory: quantitativeChemistryMethods['140406'].memory,
      rules: quantitativeChemistryMethods['140406'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把系数 2∶1 当成质量 2∶1。',
        '直接用过量反应物全部起始量求产物。',
        '只算主反应，漏掉第二步生成的同一种气体或剩余物。',
      ],
      sourceIds: ['uat-c4', 'openstax-stoichiometry', 'openstax-yields'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '从配平方程选择正确的参与量，求理论产物、剩余量或反推样品组成。',
        pastPaperSummary:
          '真题的难点通常是“哪些量真正参与反应”，而不是最后一次乘法。限量、剩余、双步骤与实验测量会改变应代入方程的那份量。',
        pastPaperPatterns: [
          {
            form: '质量—摩尔比—产物量',
            description:
              '由反应物或电极产物的质量求另一种物质的质量、气量，或比较不同工艺达到同一目标所需的量；先配平，再使用各物质自己的摩尔质量。',
            reference: '2016、2017、2019—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q047',
              'NSAA_2016_S1-Q051',
              'NSAA_2017_S1-Q044',
              'NSAA_2017_S1-Q047',
              'NSAA_2017_S1-Q050',
              'NSAA_2019_S1-Q046',
              'NSAA_2019_S1-Q051',
              'ESAT-2020-CHEMISTRY-020',
              'ESAT_LEGACY_2021_NSAA_Q057',
              'NSAA_2023_S1-Q049',
              'NSAA_2023_S1-Q057',
              'NSAA_2023_S1-Q059',
            ],
          },
          {
            form: '限量决定平台与最大产量',
            description:
              '同时给固体质量和溶液或气体用量，要求比较理论终点；在图像题中要先计算平台能到多高，再另外判断速率。',
            reference: '2017—2020 NSAA',
            sourceCodes: [
              'NSAA_2017_S1-Q048',
              'NSAA_2017_S1-Q051',
              'NSAA_2017_S1-Q053',
              'ESAT_LEGACY_2018_NSAA_Q53',
              'NSAA_2019_S1-Q049',
              'ESAT-2020-CHEMISTRY-014',
            ],
          },
          {
            form: '由气体、沉淀或滴定反推样品',
            description:
              '用被测产物或酸碱用量反推混合物中的有效成分；涉及过量试剂、反滴定或分取样品时，要先扣剩余、再放大或求差。',
            reference: '2016、2018—2022 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q050',
              'ESAT_LEGACY_2018_NSAA_Q52',
              'NSAA_2019_S1-Q052',
              'ESAT-2020-CHEMISTRY-011',
              'ESAT_LEGACY_2021_NSAA_Q059',
              'ESAT_LEGACY_2022_NSAA_Q056',
            ],
          },
          {
            form: '过程读数、剩余量与串联反应',
            description:
              '从某时刻的气量求已反应或剩余质量，或把两步反应生成的同种气体合计；开放烧杯还要区分加入质量、逸出质量与称量差。',
            reference: '2018、2020—2023 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q50',
              'ESAT-2020-CHEMISTRY-018',
              'ESAT_LEGACY_2021_NSAA_Q058',
              'ESAT_LEGACY_2022_NSAA_Q046',
              'ESAT_LEGACY_2022_NSAA_Q060',
              'NSAA_2023_S1-Q056',
            ],
          },
          {
            form: '相同浓度与体积下的产量比较',
            description:
              '并列几种盐溶液反应，让你比较所得沉淀质量；需要看真正提供目标离子的 mol，而不是按原盐的摩尔质量或金属反应性排序。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q044'],
          },
        ],
        examples: examples['140406'],
        checklist: [
          '能写出配平方程并标明所用的系数比。',
          '能用 n/系数确定限量。',
          '能把已反应、未反应和生成量分别列清楚。',
        ],
      },
    },
    {
      code: '140407',
      title: '由实验数量构造方程',
      summary: quantitativeChemistryMethods['140407'].summary,
      paragraphs: [quantitativeChemistryMethods['140407'].intro],
      memory: quantitativeChemistryMethods['140407'].memory,
      rules: quantitativeChemistryMethods['140407'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '拿初始投入的气体体积比直接当反应系数，漏掉过量部分。',
        '将质量比当摩尔比，或改变下标来配平。',
        '题面固定了一个系数，却用整体翻倍后的系数作答。',
      ],
      sourceIds: ['uat-c4', 'openstax-stoichiometry', 'openstax-gases'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '从实验数据恢复真实反应比例，再用守恒筛选完整方程。',
        pastPaperSummary:
          '真题会从燃烧体积比、气体产量或酸的消耗量反向限定方程。已知数量只提供部分关系，剩余系数和未知产物仍要靠守恒确定。',
        pastPaperPatterns: [
          {
            form: '同温同压气量 → 系数或方程',
            description:
              '由恰好耗氧量确定燃烧系数，或用生成气体的体积核对候选方程；气体组成、温压与题面归一化方式都是有效条件。',
            reference: '2022、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q055', 'NSAA_2023_S1-Q053'],
          },
          {
            form: '质量、溶液或沉淀数据 → 未知下标',
            description:
              '先把金属、气体、溶液或沉淀的实验量换成 mol，再由元素去向恢复未知物组成；这是构造方程前确定化学式的一步。',
            reference: '2016、2019、2022 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q038', 'NSAA_2019_S1-Q047', 'ESAT_LEGACY_2022_NSAA_Q058'],
          },
          {
            form: '已给摩尔关系 → 守恒补全',
            description:
              '直接给出某些反应物、产物的 mol 关系，或规定两种含碳产物等量；分配已知原子后，用剩余量确定未知产物或所需氧气。',
            reference: '2016、2020、2021、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q046',
              'ESAT-2020-CHEMISTRY-016',
              'ESAT_LEGACY_2021_NSAA_Q052',
              'NSAA_2023_S1-Q060',
            ],
          },
        ],
        examples: examples['140407'],
        checklist: [
          '能说明数据代表初始量还是实际反应量。',
          '能从同温同压体积比读出摩尔比。',
          '能在求完系数后重新数各元素原子。',
        ],
      },
    },
    {
      code: '140408',
      title: '气体体积与摩尔数',
      summary: quantitativeChemistryMethods['140408'].summary,
      paragraphs: [quantitativeChemistryMethods['140408'].intro],
      memory: quantitativeChemistryMethods['140408'].memory,
      rules: quantitativeChemistryMethods['140408'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '高温题照搬 24 dm³ mol⁻¹。',
        '只合计气态产物，遗漏剩余气体；或把液态水也算成气体。',
        '把体积变化、生成体积与终态总体积混为一谈。',
      ],
      sourceIds: ['uat-c4', 'openstax-gases', 'openstax-stoichiometry'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '按题给温压与状态处理气量，完整追踪消耗、生成和剩余。',
        pastPaperSummary:
          '气体题既有质量与体积互换，也有反应后总量和图像读数。先决定是否可直接用体积比，再列各气体的始末账目。',
        pastPaperPatterns: [
          {
            form: '质量、粒子数与气量互换',
            description:
              '从质量、原子组成或粒子个数求气量，或反向测定物质组成与纯物质量；双原子气体和单位换算是关键中间环节。',
            reference: '2016—2018、2022、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q038',
              'NSAA_2016_S1-Q047',
              'NSAA_2016_S1-Q050',
              'NSAA_2016_S1-Q051',
              'NSAA_2017_S1-Q050',
              'ESAT_LEGACY_2018_NSAA_Q53',
              'ESAT_LEGACY_2022_NSAA_Q052',
              'NSAA_2023_S1-Q051',
            ],
          },
          {
            form: '限量、部分反应与最终总体积',
            description:
              '混合气体反应后求总量，需要同时保留未反应气体与气态产物；部分转化、不同摩尔体积和高温水蒸气会改变计算条件。',
            reference: '2017、2018、2020、2021 NSAA',
            sourceCodes: [
              'NSAA_2017_S1-Q047',
              'ESAT_LEGACY_2018_NSAA_Q45',
              'ESAT-2020-CHEMISTRY-012',
              'ESAT_LEGACY_2021_NSAA_Q056',
            ],
          },
          {
            form: '气量图像 → 终点、反应量或剩余量',
            description:
              '用浓度与限量判断气体曲线的平台，或从指定时刻、最终体积反推金属用量；斜率和平台回答不同问题。',
            reference: '2016—2018、2020—2022 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q044',
              'NSAA_2017_S1-Q048',
              'ESAT_LEGACY_2018_NSAA_Q50',
              'ESAT-2020-CHEMISTRY-014',
              'ESAT_LEGACY_2021_NSAA_Q058',
              'ESAT_LEGACY_2022_NSAA_Q046',
            ],
          },
          {
            form: '燃烧、方程识别与连续产气（综合）',
            description:
              '由耗氧或 CO₂ 体积限制分子结构，利用气量筛选方程，或把两步反应生成的同一种气体相加；不能只看第一步。',
            reference: '2022、2023 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2022_NSAA_Q054',
              'ESAT_LEGACY_2022_NSAA_Q055',
              'ESAT_LEGACY_2022_NSAA_Q060',
              'NSAA_2023_S1-Q053',
            ],
          },
        ],
        examples: examples['140408'],
        checklist: [
          '能说清采用的 Vₘ 对应什么条件。',
          '能区分水蒸气与已凝结的水。',
          '能把反应后每一种气体的剩余量合计。',
        ],
      },
    },
    {
      code: '140409',
      title: '溶液、浓度与溶解度',
      summary: quantitativeChemistryMethods['140409'].summary,
      paragraphs: [quantitativeChemistryMethods['140409'].intro],
      memory: quantitativeChemistryMethods['140409'].memory,
      rules: quantitativeChemistryMethods['140409'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把加入水的体积当成最终溶液体积。',
        '浓度降低就认为溶质的 mol 一定减少。',
        '将 g/100 g 水误读为 g/100 g 溶液；求浓度时又把未溶固体计入。',
      ],
      sourceIds: ['uat-c4', 'openstax-molarity', 'openstax-solubility'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '用溶质账目和正确的分母处理配液、稀释、反应后浓度与溶解度数据。',
        pastPaperSummary:
          '年度题反复把 cV 放在反应、滴定和实验比较中，要求分清浓度与总量。水合物、取样和反应消耗都可能改变应计算的溶质量。',
        pastPaperPatterns: [
          {
            form: '配液、离子总量与反应后浓度',
            description:
              '由称取质量求实际溶质 mol，或由 cV 求离子总量；镀出物质、失去溶剂后则需要先更新溶质或体积，再求浓度。',
            reference: '2016、2018、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q053',
              'ESAT_LEGACY_2018_NSAA_Q47',
              'NSAA_2023_S1-Q045',
              'NSAA_2023_S1-Q056',
            ],
          },
          {
            form: '浓度与体积共同决定反应总量',
            description:
              '改变 c 与 V，比较产物量、限量或气体曲线平台；也会把等 c 等 V 的不同盐并列，检查真正参与反应的离子量。',
            reference: '2016—2020、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q044',
              'NSAA_2017_S1-Q048',
              'NSAA_2017_S1-Q051',
              'NSAA_2017_S1-Q053',
              'NSAA_2019_S1-Q049',
              'NSAA_2019_S1-Q051',
              'ESAT-2020-CHEMISTRY-014',
              'NSAA_2023_S1-Q044',
            ],
          },
          {
            form: '中和、取样与稀释中的 cV',
            description:
              '把浓度与取样体积转为 mol，按中和比求未知量；母液稀释、分取样品、反滴定需要逐层回算，酸强弱不能代替计量关系。',
            reference: '2016—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q049',
              'NSAA_2016_S1-Q052',
              'NSAA_2017_S1-Q039',
              'ESAT_LEGACY_2018_NSAA_Q52',
              'NSAA_2019_S1-Q052',
              'ESAT-2020-CHEMISTRY-011',
              'ESAT-2020-CHEMISTRY-013',
              'ESAT-2020-CHEMISTRY-019',
              'ESAT_LEGACY_2021_NSAA_Q053',
              'ESAT_LEGACY_2022_NSAA_Q048',
              'ESAT_LEGACY_2022_NSAA_Q056',
              'NSAA_2023_S1-Q054',
            ],
          },
          {
            form: '浓度连接热量、反应式或加成（综合）',
            description:
              '用溶液用量确定实际反应的 mol，再求每摩尔能量、反推产物式子或有机加成所需体积；题目的其他章节知识决定中间系数。',
            reference: '2020、2022、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-017',
              'ESAT_LEGACY_2022_NSAA_Q057',
              'ESAT_LEGACY_2022_NSAA_Q058',
              'NSAA_2023_S1-Q057',
            ],
          },
        ],
        pastPaperNote:
          '已收录的 153 道年度题中未见直接读取溶解度曲线或计算降温析晶的题目；这部分仍按考纲讲解，不据此推断其考试频率。',
        examples: examples['140409'],
        checklist: [
          '能在 n = cV 中使用最终溶液体积和正确单位。',
          '能说明稀释、反应或蒸发分别改变什么量。',
          '能按给定温度与溶剂质量读取溶解度并求饱和量。',
        ],
      },
    },
    {
      code: '140410',
      title: '滴定计算',
      summary: quantitativeChemistryMethods['140410'].summary,
      paragraphs: [quantitativeChemistryMethods['140410'].intro],
      memory: quantitativeChemistryMethods['140410'].memory,
      rules: quantitativeChemistryMethods['140410'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '所有酸碱滴定都直接套 c₁V₁ = c₂V₂。',
        '把反滴定测得的剩余酸当成被样品消耗的酸。',
        '忘记定容后的取样比例，或把同一个稀释倍数重复乘两次。',
      ],
      sourceIds: ['uat-c4', 'openstax-analysis', 'openstax-molarity'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '根据实验顺序建立酸碱账目，正确使用反应比例、剩余量与取样倍数。',
        pastPaperSummary:
          '真题从直接中和延伸到稀释、样品纯度和反滴定。强弱、元数、浓度与体积经常同时出现，应分别处理，不能用一个关键词替代整个计量过程。',
        pastPaperPatterns: [
          {
            form: '直接中和与酸的元数',
            description:
              '由已知浓度和体积求另一种试剂用量，或反推酸可中和多少 OH⁻；弱酸、强酸比较时仍要区分电离程度与完全中和总量。',
            reference: '2016、2017、2020、2021、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q049',
              'NSAA_2016_S1-Q052',
              'NSAA_2017_S1-Q039',
              'ESAT-2020-CHEMISTRY-013',
              'ESAT_LEGACY_2021_NSAA_Q053',
              'NSAA_2023_S1-Q054',
            ],
          },
          {
            form: '稀释与分取样品逐层回算',
            description:
              '从小份滴定数据反推整瓶溶液或原液浓度，再求样品纯度；需要明确每次定容与取样对应的倍数。',
            reference: '2019、2020 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q052', 'ESAT-2020-CHEMISTRY-019'],
          },
          {
            form: '剩余试剂与有效成分测定',
            description:
              '过量酸处理样品后再滴定剩余酸，或先分离混合物再中和可溶部分；先确定滴定测到的是哪份物质，再反求质量。',
            reference: '2018、2020、2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q52',
              'ESAT-2020-CHEMISTRY-011',
              'ESAT_LEGACY_2022_NSAA_Q056',
            ],
          },
          {
            form: '恰好中和还是仍有过量',
            description:
              '用温度—加液图理解中和终点，或比较酸碱 mol 判断混合后哪一方剩余；不能看到混合就假定溶液中性。',
            reference: '2021、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q045', 'ESAT_LEGACY_2022_NSAA_Q048'],
          },
        ],
        examples: examples['140410'],
        checklist: [
          '能先写出酸与碱的计量比例。',
          '能区分初始、剩余与被样品消耗的试剂量。',
          '能沿取样和稀释步骤正确回算原样品。',
        ],
      },
    },
    {
      code: '140411',
      title: '百分产率',
      summary: quantitativeChemistryMethods['140411'].summary,
      paragraphs: [quantitativeChemistryMethods['140411'].intro],
      memory: quantitativeChemistryMethods['140411'].memory,
      rules: quantitativeChemistryMethods['140411'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '实际量与理论量的分子分母倒置。',
        '把纯度、回收率或热效率直接叫作化学产率。',
        '漏掉限量或杂质，让理论产量的基数从一开始就不对。',
      ],
      sourceIds: ['uat-c4', 'openstax-yields'],
      visual: 'quantitative-chemistry',
      examFocus: {
        goal: '分别处理纯度、理论产量与实际收集量，写对百分产率的比较基数。',
        pastPaperSummary:
          '在已收录的 2016—2023 年 153 道年度化学题中，未找到直接用“实际获得的目标产物 ÷ 理论目标产物”求百分产率的题目。',
        pastPaperPatterns: [],
        pastPaperNote:
          '年度题中的平衡转化、矿石纯度与热量传递效率并非本公式的直接考查。本节按考纲讲解，例题和自测选用现有试题库，不冒充历年真题。',
        examples: examples['140411'],
        checklist: [
          '能先算由纯原料和限量决定的理论产物量。',
          '能说清产率分子分母中的物质与单位。',
          '能解释为什么原料纯度与产物产率不是一个比例。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-c4',
      title: 'UAT-UK · ESAT Content Specification',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对 C4.1—C4.11，包含 kg、tonnes、限量、饱和与溶解度；本章不将热效率或纯度叫作产率。',
    },
    {
      id: 'bipm-mole',
      title: 'BIPM · SI base unit: mole',
      url: 'https://www.bipm.org/en/si-base-units/mole',
      note: '核对阿伏伽德罗常数的精确定义与指定粒子要求；做题优先使用题给近似值。',
    },
    {
      id: 'openstax-mass',
      title: 'OpenStax · Formula Mass and the Mole Concept',
      url: 'https://openstax.org/books/chemistry-2e/pages/3-1-formula-mass-and-the-mole-concept',
      note: '核对化学式计数、摩尔质量与质量—物质的量关系。',
    },
    {
      id: 'openstax-composition',
      title: 'OpenStax · Determining Empirical and Molecular Formulas',
      url: 'https://openstax.org/books/chemistry-2e/pages/3-2-determining-empirical-and-molecular-formulas',
      note: '核对组成质量分数、最简原子比及分子式倍数关系；讲解数据取自实际题源。',
    },
    {
      id: 'openstax-stoichiometry',
      title: 'OpenStax · Reaction Stoichiometry',
      url: 'https://openstax.org/books/chemistry-2e/pages/4-3-reaction-stoichiometry',
      note: '核对系数对应摩尔比与跨单位计算路径。',
    },
    {
      id: 'openstax-yields',
      title: 'OpenStax · Reaction Yields',
      url: 'https://openstax.org/books/chemistry-2e/pages/4-4-reaction-yields',
      note: '核对限量、理论产量、实际产量及百分产率，区分纯度与转化率。',
    },
    {
      id: 'openstax-gases',
      title: 'OpenStax · Relating Pressure, Volume, Amount, and Temperature',
      url: 'https://openstax.org/books/chemistry-2e/pages/9-2-relating-pressure-volume-amount-and-temperature-the-ideal-gas-law',
      note: '核对同温同压下气体体积与物质的量的比例条件，不把指定摩尔体积扩展到任意温压。',
    },
    {
      id: 'openstax-molarity',
      title: 'OpenStax · Molarity',
      url: 'https://openstax.org/books/chemistry-2e/pages/3-3-molarity',
      note: '核对以最终溶液体积为分母的浓度、稀释时溶质守恒。',
    },
    {
      id: 'openstax-solubility',
      title: 'OpenStax · Solubility',
      url: 'https://openstax.org/books/chemistry-2e/pages/11-3-solubility',
      note: '核对饱和状态依赖温度等条件，区分溶解度中的溶剂基数与浓度中的溶液基数。',
    },
    {
      id: 'openstax-analysis',
      title: 'OpenStax · Quantitative Chemical Analysis',
      url: 'https://openstax.org/books/chemistry-2e/pages/4-5-quantitative-chemical-analysis',
      note: '核对滴定、计量关系与测定对象；反滴定和取样放大按实际题干分别建账。',
    },
  ],
}
