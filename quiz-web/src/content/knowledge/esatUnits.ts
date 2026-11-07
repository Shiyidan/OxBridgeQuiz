// ESAT数学1单位学习讲义：概念图解、年度考法归纳与真实题源练习对齐现行考纲。
import type { KnowledgeLesson } from './types'
import { unitsMethods } from './unitsMethods'

export const esatUnits: KnowledgeLesson = {
  code: '110100',
  title: 'Units · 单位',
  subtitle: '先读懂“每”，再让单位带着你计算',
  intro:
    '单位不是算完再补的标签，而是解题路线。先用总量与单位量连起速度、密度、压强和费用，再处理分子、分母与平方立方换算；例题和自测均读取真实题源。',
  memory: [
    '读到 per（每），就把“每”后面的量放到分母；乘回分母对应的量，可以找回总量。',
    '同一个量换成更小的单位，数值变大；面积换算看平方，体积换算看立方。',
    '分子、分母分别换；把单位写在每一步，比只背“乘还是除”更可靠。',
  ],
  sections: [
    {
      code: '110101',
      title: '标准单位与复合单位',
      summary: unitsMethods['110101'].summary,
      paragraphs: [unitsMethods['110101'].intro],
      memory: unitsMethods['110101'].memory,
      rules: unitsMethods['110101'].blocks.flatMap(block =>
        block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text }))),
      pitfalls: [
        '2 小时 15 分钟不是 2.15 小时：分钟是六十进制，小数小时是十进制。',
        '比较工资率或商品单价时，先统一分母单位；每分钟、每小时，以及每 100 g、每 kg，不能直接比较数值。',
        '密度的分母是体积，压强的分母是面积；$\\mathrm{g/cm^3}$、$\\mathrm{N/cm^2}$ 和 Pa 是不同的单位写法，不能只删改单位标签。',
        '不要默认把各段速度直接取算术平均；各段用时相等时可以这样算，其余情况应回到总路程与总时间。',
      ],
      sourceIds: ['uat-spec', 'uat-maths1-guide', 'openstax-units'],
      visual: 'maths-units',
      examFocus: {
        goal: '把“每单位多少”翻成除法；平均速度始终从总路程和总时间出发。',
        pastPaperSummary:
          '本地2016—2023年度题把复合单位放进材料质量、分段路程、比赛速度与燃料费用中，关键是确定分母对应哪个总量。',
        pastPaperPatterns: [
          {
            form: '速度不同，用时权重也不同',
            description: '给定上、下坡平均速度或多阶段训练，先求每段用时；等距离不能直接平均速度。',
            reference: '2022 NSAA、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q012', 'NSAA_2023_S1-Q011'],
          },
          {
            form: '单位连接几何与材料',
            description: '先求空心管或比例模型的实际体积，再乘密度得到质量；空腔不计材料质量。',
            reference: '2017 ENGAA、2018 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q027', 'ESAT_LEGACY_2018_ENGAA_Q13'],
          },
          {
            form: '不同单位的费用与运动',
            description: '燃料题用距离÷每升行驶距离；同一时刻的赛跑用路程比对应速度比。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q019', 'ESAT_LEGACY_2021_NSAA_Q018'],
          },
        ],
        examples: [
          {
            title: '上、下坡的平均速度为什么不能直接平均？',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q012',
              why: '==先加总路程与时间，再求平均；单位一致以后才能相除。==',
            },
            question: '',
            answer: 'C',
            steps: [
              '上坡40分钟是 $2/3$ 小时，所以单程距离为 $12\\times2/3=8$ km。',
              '往返总路程16 km，全程平均15 km/h，总时间为 $16/15$ 小时，即64分钟。',
              '下坡用时 $64-40=24$ 分钟，即 $2/5$ 小时；速度为 $8\\div(2/5)=20$ km/h。',
              '检验：较慢的上坡占更多时间，所以全程15 km/h低于两段速度的算术平均16 km/h。',
            ],
            takeaway: '==先加总路程与时间，再求平均；单位一致以后才能相除。==',
          },
        ],
        checklist: [
          '能由单位写出速度、密度、压强和单价关系。',
          '能解释为何等距离的两段速度不能直接平均。',
          '结果既有数值也有与题目一致的单位。',
        ],
      },
    },
    {
      code: '110102',
      title: '单位换算',
      summary: unitsMethods['110102'].summary,
      paragraphs: [unitsMethods['110102'].intro],
      memory: unitsMethods['110102'].memory,
      rules: unitsMethods['110102'].blocks.flatMap(block =>
        block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text }))),
      visual: 'maths-units',
      pitfalls: [
        '从 $\\mathrm{m^2}$ 到 $\\mathrm{cm^2}$ 要乘 $100^2$，从 $\\mathrm{m^3}$ 到 $\\mathrm{cm^3}$ 要乘 $100^3$；只乘 100 会漏掉维度。',
        '“大单位换小单位，数值变大”可直接用于单个量；复合单位要拆开分子、分母判断，不能套在整串单位上。',
        '$1\\,\\mathrm{L}=1000\\,\\mathrm{mL}$ 是容量换算；$1\\,\\mathrm{kg}$ 液体不一定是 $1\\,\\mathrm{L}$，质量与体积之间还需要密度。',
        '不要按英里、英尺、英寸的名字猜换算因子；遇到非公制单位，要使用题目给出的对应关系，并保留题目要求的精度。',
      ],
      sourceIds: ['uat-spec', 'uat-maths1-guide', 'bipm-prefixes', 'openstax-units'],
      examFocus: {
        goal: '把换算写成能约去单位的乘法；面积平方、体积立方，复合单位逐项换。',
        pastPaperSummary:
          '相关题既有纯数值的米/千米、分钟/小时，也有代数形式的英里/千米和便士/英镑；体积换算常与相似比及密度一起出现。',
        pastPaperPatterns: [
          {
            form: '距离、时间逐项统一',
            description: '每一阶段距离与速度用同一单位；分段求时间后累加，别把米直接除以km/h。',
            reference: '2022 NSAA、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q012', 'NSAA_2023_S1-Q011'],
          },
          {
            form: '代数换算保持单位链',
            description:
              '用题给的“1千米等于x英里”反推总千米数，再按每升公里数和每升便士数逐步转换。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q019'],
          },
          {
            form: '体积单位与长度比例同时变化',
            description: '模型体积先除以长度比例的立方，再把m³化为cm³，使体积与密度分母匹配。',
            reference: '2018 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q13'],
          },
        ],
        examples: [
          {
            title: '英里、公里、升、便士：让单位沿途消掉',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q019',
              why: '==先写换算等式，再沿单位链约去；不凭“换大换小”的口令猜方向。==',
            },
            question: '',
            answer: 'H',
            steps: [
              '题目给的是 $1\\,\\mathrm{km}=x\\,\\mathrm{miles}$，所以m英里的路程为 $m/x$ km，而不是mx。',
              '每升行驶f km，所需燃料为 $(m/x)/f=m/(xf)$ L。',
              '乘每升p便士，得到 $mp/(xf)$ 便士；再除100，得到 $mp/(100xf)$ 英镑。',
              '检查分母：每升能走更远或每公里折合的英里更多，总费用应降低；f、x都应在分母。',
            ],
            takeaway: '==先写换算等式，再沿单位链约去；不凭“换大换小”的口令猜方向。==',
          },
        ],
        checklist: [
          '能正确换算平方与立方单位。',
          '知道分钟换小时要除60。',
          '能将代数换算因子放到正确的分子或分母。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-spec',
      title: 'UAT-UK · ESAT Content Specification（2026/27）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对 M1.1、M1.2 的覆盖范围及 Scientific Quantities and Units 中的 SI 前缀要求；官网当前版本适用于 2026 年 10 月和 2027 年 1 月。',
    },
    {
      id: 'uat-maths1-guide',
      title: 'UAT-UK · ESAT Guide: Mathematics 1',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/06/30103534/ESAT_Guide_Mathematics_1.pdf',
      note: '官方知识范围与术语参考；中文讲解为教学整理，例题和自测来自现有年度诊断题或独立试题库。',
    },
    {
      id: 'bipm-prefixes',
      title: 'BIPM · SI prefixes',
      url: 'https://www.bipm.org/en/measurement-units/si-prefixes',
      note: '核对 SI 前缀的符号、大小写与十进制倍数。',
    },
    {
      id: 'openstax-units',
      title: 'OpenStax · Physical Quantities and Units',
      url: 'https://openstax.org/books/college-physics-2e/pages/1-2-physical-quantities-and-units',
      note: '参考标准量、复合单位和利用单位约去进行换算的方法；未转载教材例题。',
    },
  ],
}
