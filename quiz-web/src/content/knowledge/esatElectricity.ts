// 物理电学讲义：以全量年度题归纳考法，覆盖静电与电路的条件、符号和单位。
import type { KnowledgeLesson } from './types'
import { electricityMethods } from './electricityMethods'

export const esatElectricity: KnowledgeLesson = {
  code: '130100',
  title: 'Electricity · 电学',
  subtitle: '先追踪电荷，再沿电路核对电流、电压与能量',
  intro:
    '静电解释电荷如何转移；电路解释电荷如何流动、每库仑转移多少能量。用节点、电表接法和量纲把公式连起来。',
  memory: [
    '正电是缺电子，负电是多电子；摩擦不创造电荷。',
    '串联同电流、并联同电压；先画节点再计算。',
    'I=Q/t，V=E/Q，P=VI；能量还要乘秒数。',
  ],
  sections: [
    {
      code: '130101',
      title: '静电',
      summary: electricityMethods['130101'].summary,
      paragraphs: [electricityMethods['130101'].intro],
      rules: electricityMethods['130101'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: electricityMethods['130101'].memory,
      pitfalls: [
        '摩擦会转移电子，不会把中子变成电子，也不会凭空制造净电荷。',
        '有吸引不等于两物体都带电；观察到静电排斥才可判同号带电。',
        '物体带正电意味着电子相对缺少，不意味着没有电子。',
      ],
      visual: 'physics-electricity',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '根据电子移动判断正负，再用吸引、排斥和接地条件检验结论。',
        pastPaperSummary:
          '审阅全部149道已收录年度物理题后，没有发现直接以摩擦起电、接地或静电排斥为主问的题。年度题中有离子电荷与粒子数量的关联考查，但不能把它们当作摩擦起电的直接考频。例题和自测使用现有试题库中的直接题。',
        pastPaperPatterns: [
          {
            form: '关联考法：从质子、电子数辨认电荷',
            description:
              '离子图与同位素表把电荷正负嵌入粒子计数；这里可迁移“电子得失改变电荷”的判断，但不涉及摩擦或接地。',
            reference: '2020、2022 NSAA · 关联',
            sourceCodes: ['ESAT-2020-PHYSICS-002', 'ESAT_LEGACY_2022_NSAA_Q033'],
          },
        ],
        examples: [
          {
            title: '玻璃棒带正电：谁把电子交给了谁？',
            source: {
              kind: 'bank',
              subject: 'physics',
              questionCode: 'ESAT-PHY-MOCK-ADAPT-E03-008-R44',
              why: '由最终正电荷反推电子转移方向，排除质子或中子移动的解释。',
            },
            question: '',
            answer: 'B · 电子从玻璃棒转移到丝绸',
            steps: [
              '抓住结果：玻璃棒带正电，意味着电子数相对于质子数减少。',
              '普通摩擦只需考虑电子转移，不能用质子或中子跨材料移动解释。',
              '电子由玻璃棒转移到丝绸；两者获得等量异号净电荷，符合电荷守恒，选B。',
            ],
            takeaway: '==先由最终正负判断电子增减，再确定电子移动方向。==',
          },
        ],
        checklist: [
          '能区分电子运动与正电荷符号。',
          '能说明为什么中性导体也能被带电棒吸引。',
          '能用接地解释应用中的静电释放。',
        ],
      },
    },
    {
      code: '130102',
      title: '电路',
      summary: electricityMethods['130102'].summary,
      paragraphs: [electricityMethods['130102'].intro],
      rules: electricityMethods['130102'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: electricityMethods['130102'].memory,
      pitfalls: [
        '开关改变支路后，要重新识别拓扑，不是看到电阻减少就随意减去一个数。',
        'mA先除1000，分钟先乘60；W是每秒能量，不是总能量。',
        '恒压电源增加并联支路，总电流增大，原支路电流未必变化。',
      ],
      visual: 'physics-electricity',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '从连接关系选方程，区分全电路与单个元件，再做单位和极限检查。',
        pastPaperSummary:
          '全量年度题中的电路考法包含基本量串联换算、开关重构、串并联功率分配、非线性灯泡与二极管读图、热敏电阻以及电机/输电效率。不是单独背一条欧姆定律就能覆盖；同一题常把两三条关系串联。',
        pastPaperPatterns: [
          {
            form: '电荷、电压与功率串联换算',
            description:
              '先由电荷/时间求电流，或由功率/电压求电流，再求电阻、能量、局部电压；时间单位与局部量是常见陷阱。',
            reference: '2016—2023 ENGAA、NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q016',
              'ENGAA_2017_S1-Q020',
              'NSAA_2017_S1-Q022',
              'ESAT_LEGACY_2021_NSAA_Q021',
              'ESAT_LEGACY_2022_NSAA_Q024',
              'NSAA_2023_S1-Q023',
              'NSAA_2023_S1-Q038',
            ],
          },
          {
            form: '电阻网络、开关与短路改变',
            description:
              '从串并联节点重新求电流、分压和功率；开关可能只改变总电流，不改变原支路电压。',
            reference: '2016—2023 ENGAA、NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q008',
              'NSAA_2016_S1-Q025',
              'NSAA_2017_S1-Q036',
              'ESAT_LEGACY_2018_ENGAA_Q04',
              'ESAT_LEGACY_2018_ENGAA_Q26',
              'NSAA_2019_S1-Q032',
              'ESAT_LEGACY_2021_NSAA_Q028',
              'ESAT_LEGACY_2022_NSAA_Q029',
              'NSAA_2023_S1-Q024',
            ],
          },
          {
            form: '真实元件图线与环境改变',
            description: '灯泡V–I曲线、二极管压降和热敏电阻R–T曲线与外部定值电阻共同约束工作点。',
            reference: '2018—2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q35',
              'NSAA_2019_S1-Q021',
              'ESAT-2020-PHYSICS-009',
              'ESAT_LEGACY_2021_NSAA_Q031',
              'ESAT_LEGACY_2022_NSAA_Q030',
            ],
          },
          {
            form: '电功率接入机械能、效率与输电',
            description:
              '电机提升/加速把VI和机械输出联系；灯泡、海底电缆与变压器要区别输入、输出和损耗。磁力题还可先由Q/t求电流。',
            reference: '2017—2023 ENGAA、NSAA · 跨知识点',
            sourceCodes: [
              'ENGAA_2017_S1-Q012',
              'ESAT_LEGACY_2018_ENGAA_Q08',
              'ESAT_LEGACY_2018_ENGAA_Q10',
              'NSAA_2019_S1-Q026',
              'ESAT-2020-PHYSICS-007',
              'ESAT-2020-PHYSICS-008',
              'ESAT_LEGACY_2021_NSAA_Q023',
              'ESAT_LEGACY_2022_NSAA_Q021',
              'ESAT_LEGACY_2022_NSAA_Q028',
              'NSAA_2023_S1-Q034',
            ],
          },
        ],
        examples: [
          {
            title: '最大功率：先让串联电流最大',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ENGAA_2016_S1-Q008',
              why: '在串联电路中把固定电阻最大功率转为最大电流，区分电源与局部电压。',
            },
            question: '',
            answer: 'D · 45 W',
            steps: [
              '5 Ω是固定待求元件，因此其功率 $P=I^2\\times5$；要最大功率，先让I最大。',
              '电源24 V不变，滑动电阻取最小3 Ω时总电阻为8 Ω，$I=24/8=3\\,\\mathrm A$。',
              '固定电阻功率 $P=3^2\\times5=45\\,\\mathrm W$，选D。它两端只有15 V；不能把24 V全部分给它。',
            ],
            takeaway: '==先确定“谁的功率”，再决定哪一个变量要最大。==',
          },
          {
            title: '电热水壶：从功率走到电荷',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ENGAA_2017_S1-Q020',
              why: '连接P=VI和Q=It，突出分钟换秒以及功率与电荷的区别。',
            },
            question: '',
            answer: 'C · 15000 C',
            steps: [
              '电压12.0 V、功率150 W，故 $I=P/V=12.5\\,\\mathrm A$。',
              '20分钟为1200秒，$Q=It=12.5\\times1200=15000\\,\\mathrm C$。',
              '也可先得能量180000 J，再除以12 V，得到相同电荷；选对应15000 C的选项。',
            ],
            takeaway: '==功率不是电荷；连接它们的是电压和时间。==',
          },
        ],
        checklist: [
          '能标出每条支路中相同的I或V。',
          '能根据坐标辨认灯丝的非线性图像。',
          '能沿Q、I、V、P、E关系链完成两步以上计算。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-spec',
      title: 'UAT-UK · ESAT Content Specification（2026/27）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按 P1、P2、P4 官方范围核对知识覆盖；中文讲解和互动图为教学整理。',
    },
  ],
}
