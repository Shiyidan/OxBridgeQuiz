// ESAT物理放射性讲义：以核素双账本、辐射性质和本底校正贯通已导入年度真题证据。
import type { KnowledgeLesson } from './types'
import { radioactivityMethods } from './radioactivityMethods'

export const esatRadioactivity: KnowledgeLesson = {
  code: '130700',
  title: 'Radioactivity · 放射性',
  subtitle: '分清核内计数、辐射性质与随时间变化的数量',
  intro:
    '核素符号负责“是什么”，衰变方程负责“怎样变”，辐射性质决定“如何探测与防护”，半衰期描述“还剩多少”。用双账本和净计数把四部分连起来。',
  memory: [
    '同位素同Z不同A；电离只改电子。',
    'α：A−4、Z−2；β−：A不变、Z+1；γ：A和Z都不变。',
    '半衰期先扣本底；母核减少量加到相应子核原有量。',
  ],
  sections: [
    {
      code: '130701',
      title: '原子结构',
      summary: radioactivityMethods['130701'].summary,
      paragraphs: [radioactivityMethods['130701'].intro],
      rules: radioactivityMethods['130701'].blocks.flatMap((block) => [
        {
          title: block.title,
          text: [block.formula, ...(block.paragraphs ?? []), block.note].filter(Boolean).join(' '),
        },
        ...(block.points ?? []),
        ...(block.table?.rows.map((row) => ({
          title: row[0] ?? '',
          text: row.slice(1).join('；'),
        })) ?? []),
      ]),
      memory: radioactivityMethods['130701'].memory,
      pitfalls: [
        '质量数是整数核子计数，不等于以kg为单位的实际质量。',
        '同位素不是“质子不同”的同一种元素。',
        '失电子使电荷更正，不会让原子序数增加。',
      ],
      visual: 'physics-radioactivity',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '从核素符号、总粒子数或电荷反推p、n、电子数，并逐条检验身份。',
        pastPaperSummary:
          '年度相关题包括同位素与离子图、总粒子数限制、核尺度密度以及核素符号倍数条件；它们都要求把核内计数和核外电荷分开。',
        pastPaperPatterns: [
          {
            form: '同位素与离子信息交叉筛选',
            description: '从结构图或总粒子数、净电荷表筛出同元素但不同同位素；离子改变的是电子数。',
            reference: '2020、2022 NSAA',
            sourceCodes: ['ESAT-2020-PHYSICS-002', 'ESAT_LEGACY_2022_NSAA_Q033'],
          },
          {
            form: '核模型结合半径比求密度比',
            description: '原子与核质量近似相同，体积必须按半径比的三次方换算。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q016'],
          },
          {
            form: '核素符号结合倍数与一次衰变',
            description: '把核电荷倍数用于Z、质量倍数用于A，再按β−规则更新Z。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q027'],
          },
        ],
        examples: [
          {
            title: '核电荷翻倍、质量四倍：哪一个写上标？',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'NSAA_2023_S1-Q027',
              why: '训练分开读核电荷与质量条件，并在核素符号中更新一次β−衰变。',
            },
            question: '',
            answer: 'E · $^{12}_{5}\\mathrm Z$',
            steps: [
              '氦-3的Z为2、A为3。X核电荷为两倍，故 $Z_X=2\\times2=4$。',
              'X质量为四倍，按题目核子质量近似得 $A_X=4\\times3=12$，中间核素为 $^{12}_{4}\\mathrm X$。',
              '一次β−衰变是中子变质子，A不变、Z增加1，所以产物为 $^{12}_{5}\\mathrm Z$，选E。',
              '四倍乘的是3，不是2或已经翻倍的4；也不能在找到X后漏掉衰变一步。',
            ],
            takeaway: '==先分开算A和Z，再沿题目过程更新一次。==',
          },
        ],
        checklist: [
          '能读核素符号并数p、n、电子。',
          '能分清同位素、电离与核衰变。',
          '能用核模型解释α散射与密度差。',
        ],
      },
    },
    {
      code: '130702',
      title: '放射性衰变',
      summary: radioactivityMethods['130702'].summary,
      paragraphs: [radioactivityMethods['130702'].intro],
      rules: radioactivityMethods['130702'].blocks.flatMap((block) => [
        {
          title: block.title,
          text: [block.formula, ...(block.paragraphs ?? []), block.note].filter(Boolean).join(' '),
        },
        ...(block.points ?? []),
        ...(block.table?.rows.map((row) => ({
          title: row[0] ?? '',
          text: row.slice(1).join('；'),
        })) ?? []),
      ]),
      memory: radioactivityMethods['130702'].memory,
      pitfalls: [
        'β−发出负电粒子，但核本身Z增加1。',
        'γ不是“失去一个中子”；激发态的能量变小而A、Z不变。',
        '核素衰变次序题须允许所有符合题意的顺序。',
      ],
      visual: 'physics-radioactivity',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '用A和Z双账本审查衰变链、裂变与可能的中间核素。',
        pastPaperSummary:
          '全量年度题显示三种常见组织方式：终点反推粒子数、给粒子总数或次序判断中间核素、裂变和反冲结合守恒。下面选端点题建立基本路线。',
        pastPaperPatterns: [
          {
            form: '端点差与粒子总数',
            description:
              '先用质量数差确定α数，再用原子序数补β−数；也会只问减少几个质子或限定总粒子数。',
            reference: '2016、2018 ENGAA；2019、2020、2023 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q002',
              'ESAT_LEGACY_2018_ENGAA_Q02',
              'NSAA_2019_S1-Q030',
              'ESAT-2020-PHYSICS-005',
              'NSAA_2023_S1-Q027',
            ],
          },
          {
            form: '所有可能的中间核素',
            description: '给定总共发出的α、β−，要求找任何顺序都不可能出现的核素。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q014'],
          },
          {
            form: '裂变核子/电荷记账，随后接β−',
            description: '把入射中子加入初态，求自由中子数或未知下标；产物还可接一次β−。',
            reference: '2016、2017、2018 ENGAA',
            sourceCodes: ['ENGAA_2016_S1-Q006', 'ENGAA_2017_S1-Q010', 'ESAT_LEGACY_2018_ENGAA_Q24'],
          },
          {
            form: 'α衰变结合反冲动量与能量分配',
            description: '母核静止使两个产物动量大小相同，动能比由质量反比决定。',
            reference: '2016 ENGAA',
            sourceCodes: ['ENGAA_2016_S1-Q026'],
          },
        ],
        examples: [
          {
            title: '铀到铅：为什么先算α，再算β−？',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT-2020-PHYSICS-005',
              why: '训练先用质量数差求α次数，再用电荷数差求β−次数。',
            },
            question: '',
            answer: 'A · 6',
            steps: [
              '质量数从238到206，减少32；只有α改变A，因此 $a=32/4=8$。',
              '8次α令Z从92减到 $92-2\\times8=76$。',
              '最终Z为82，每次β−增加1，需要 $b=82-76=6$，选A。',
              '反查：A为 $238-8\\times4=206$，Z为 $92-8\\times2+6=82$。只看初末Z差10会漏掉α的贡献。',
            ],
            takeaway: '==A确定α，Z确定β−，两个终点都核对。==',
          },
        ],
        checklist: [
          '能从三种辐射识别A、Z变化。',
          '能解终点次数并检查非负整数。',
          '能判断中间核素和带入射中子的裂变方程。',
        ],
      },
    },
    {
      code: '130703',
      title: '电离辐射',
      summary: radioactivityMethods['130703'].summary,
      paragraphs: [radioactivityMethods['130703'].intro],
      rules: radioactivityMethods['130703'].blocks.flatMap((block) => [
        {
          title: block.title,
          text: [block.formula, ...(block.paragraphs ?? []), block.note].filter(Boolean).join(' '),
        },
        ...(block.points ?? []),
        ...(block.table?.rows.map((row) => ({
          title: row[0] ?? '',
          text: row.slice(1).join('；'),
        })) ?? []),
      ]),
      memory: radioactivityMethods['130703'].memory,
      pitfalls: [
        '最穿透不等于沿同一短路径电离最强。',
        '未被电场偏转只说明电中性，仍要结合其他条件识别γ。',
        '普通γ照射和放射性物质污染不是同一个概念。',
      ],
      visual: 'physics-radioactivity',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '先判带电与穿透，再结合用途、污染途径和本底作判断。',
        pastPaperSummary:
          '当前年度题直接覆盖γ医学探测和本底计数扣除；未找到单独系统比较α、β、γ屏蔽或污染定义的年度题。性质识别与污染自测使用已收录题库题，不能据此声称这些是年度出现频次。',
        pastPaperPatterns: [
          {
            form: 'γ医学扫描的探测位置',
            description:
              '体内源向相反方向发γ，由两侧探测时间差确定位置；练的是应用场景中的传播关系。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q008'],
          },
          {
            form: '本底与源计数叠加',
            description: '长期读数趋近本底，或通过相隔整数半衰期的两次总读数联立反求本底。',
            reference: '2018 ENGAA；2020 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q14', 'ESAT-2020-PHYSICS-016'],
          },
        ],
        examples: [
          {
            title: '题库题：穿透与偏转两条线索一起用',
            source: {
              kind: 'bank',
              subject: 'physics',
              questionCode: 'ESAT-PHY-MOCK-ADAPT-E14-006',
              why: '题库性质识别题，训练交叉使用电荷、穿透能力及屏蔽材料。',
            },
            question: '',
            answer: 'C · γ辐射',
            steps: [
              '能穿过纸及薄铝，先排除课程模型下容易被这两种材料挡住的α和普通β。',
              '不受电场或磁场偏转说明电中性，排除带电的α、β和质子。',
              '厚铅显著衰减且前述特征都符合γ，选C。中子也不带电，但常用富氢材料慢化与屏蔽，不能只凭“不偏转”认γ。',
              '本题采用常见屏蔽定性模型，具体穿透程度仍取决于能量与厚度。',
            ],
            takeaway: '==性质题交叉使用电荷、穿透与屏蔽材料。==',
          },
          {
            title: '真题应用：γ探测的时间差对应多大偏移？',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ENGAA_2017_S1-Q008',
              why: '训练把γ医学探测的到时差换成路径差，再求源位置偏移。',
            },
            question: '',
            answer: 'D · 6.0 cm',
            steps: [
              '两光子的路程差为 $c\\Delta t=3.0\\times10^8\\times4.0\\times10^{-10}=0.12\\,\\mathrm m$。',
              '源离中点d后，一边路程少d，另一边多d，所以差是2d，不是d。',
              '得 $d=0.12/2=0.06\\,\\mathrm m=6.0\\,\\mathrm{cm}$，选D。',
              '这道年度题展示γ应用，并不直接考三种辐射屏蔽排序；两类考法应分清。',
            ],
            takeaway: '==源偏离中点d，双向路程差为2d。==',
          },
        ],
        checklist: [
          '能用穿透、电离和偏转三维比较α、β、γ。',
          '能区分污染与照射、外部与内部暴露。',
          '能说明为什么计数要扣本底。',
        ],
      },
    },
    {
      code: '130704',
      title: '半衰期',
      summary: radioactivityMethods['130704'].summary,
      paragraphs: [radioactivityMethods['130704'].intro],
      rules: radioactivityMethods['130704'].blocks.flatMap((block) => [
        {
          title: block.title,
          text: [block.formula, ...(block.paragraphs ?? []), block.note].filter(Boolean).join(' '),
        },
        ...(block.points ?? []),
        ...(block.table?.rows.map((row) => ({
          title: row[0] ?? '',
          text: row.slice(1).join('；'),
        })) ?? []),
      ]),
      memory: radioactivityMethods['130704'].memory,
      pitfalls: [
        '题目说“又过360分钟”，总经过时间要加上之前240分钟。',
        '有初始稳定子核时，分母不能只用新生成的子核。',
        '大量母核指数减少不意味着有限个半衰期后必定一个不剩。',
      ],
      visual: 'physics-radioactivity',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '从读数与曲线找到真正应当减半的量，再用守恒追踪子体。',
        pastPaperSummary:
          '相关年度题完整覆盖本底、混合核素、初始子核、子体增长曲线和放射性子体。归纳不以一个“剩一半”数值题代替所有形式。',
        pastPaperPatterns: [
          {
            form: '本底曲线与多次计数',
            description:
              '从长期水平读本底后找净计数减半；或联立两次总读数反求本底，再计算更晚的读数。',
            reference: '2018 ENGAA；2020 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q14', 'ESAT-2020-PHYSICS-016'],
          },
          {
            form: '不同半衰期的混合物',
            description:
              '分别计算两母核的剩余比例，再求共同稳定子体占比、两种稳定子体之比或母核数量相等时刻。',
            reference: '2017 ENGAA；2021、2023 NSAA',
            sourceCodes: ['ENGAA_2017_S1-Q026', 'ESAT_LEGACY_2021_NSAA_Q037', 'NSAA_2023_S1-Q030'],
          },
          {
            form: '初始已有子核或从子体图反推',
            description: '母核减少量加进已有子核；稳定子体图要看离最终平台还差多少。',
            reference: '2019、2022 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q036', 'ESAT_LEGACY_2022_NSAA_Q034'],
          },
          {
            form: '子体自己也会衰变',
            description: '根据母体递减、子体从零先升后降及较长半衰期判断可能图形。',
            reference: '2016 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q033'],
          },
        ],
        examples: [
          {
            title: '两个半衰期，不能混成一个平均值',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ENGAA_2017_S1-Q026',
              why: '训练分别计算两种母体剩余数，再用守恒求稳定子体占比。',
            },
            question: '',
            answer: 'D · $13/16$',
            steps: [
              '初始X、Y各设N，6小时后X经过2个半衰期，剩N/4；Y经过3个，剩N/8。',
              '生成稳定Z共 $2N-N/4-N/8=13N/8$。',
              '题目求Z占混合物的比例，分母仍为总原子数2N，故 $(13N/8)/(2N)=13/16$，选D。',
              '先给X、Y分别计时，再做守恒；平均半衰期没有本题所需的物理意义。',
            ],
            takeaway: '==各算各的剩余量，最后汇总子核。==',
          },
          {
            title: '总计数不是净计数：先解本底',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT-2020-PHYSICS-016',
              why: '训练由两次读数联立反求本底，再按累计时间推算总计数。',
            },
            question: '',
            answer: 'H · 本底14 cpm，第三次42 cpm',
            steps: [
              '设初始源净计数S、本底B。第一次 $S+B=910$。240分钟是两个半衰期，第二次 $S/4+B=238$。',
              '两式相减得 $3S/4=672$，所以S=896、B=14 cpm。',
              '又过360分钟后，累计时间600分钟，即5个半衰期。源净计数为 $896/32=28$ cpm。',
              '探测器读总计数 $28+14=42$ cpm，故选H；若只答28，忘了把本底加回。',
            ],
            takeaway: '==先扣本底处理衰变，最后恢复仪器读数。==',
          },
        ],
        checklist: [
          '能区分随机单核与统计半衰期。',
          '能对净计数减半，并处理累计时间。',
          '能追踪稳定及放射性子体，避免把子体图直接减半。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-spec',
      title: 'UAT-UK ESAT Content Specification · P7',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按P7.1–P7.4安排知识范围；题干来自既有正式题源，讲解和计算步骤独立核验。',
    },
  ],
}
