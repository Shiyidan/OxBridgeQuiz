// 物理热学讲义：贯通三种传热机制与热量账，保留年度考法和相变边界。
import type { KnowledgeLesson } from './types'
import { thermalMethods } from './thermalMethods'

export const esatThermalPhysics: KnowledgeLesson = {
  code: '130400',
  title: 'Thermal physics · 热学',
  subtitle: '先判断能量怎样传，再计算物体怎样升温',
  intro:
    '传导、对流、辐射解释传热路径；热容解释同样能量为什么产生不同温升。先建立热量账，再选对应关系。',
  memory: [
    '传导靠微观相互作用，对流靠流体整体运动，辐射能穿过真空。',
    '导热看材料、面积、长度和温差；辐射要分发出与净损失。',
    'Q=mcΔT中的ΔT是温差，不是末温；输入能量不一定全用于升温。',
  ],
  sections: [
    {
      sourceIds: ['uat-spec'],
      visual: 'physics-thermal',
      code: '130401',
      title: '传导',
      summary: thermalMethods['130401'].summary,
      paragraphs: [thermalMethods['130401'].intro],
      rules: thermalMethods['130401'].blocks.flatMap((block) => [
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
      memory: thermalMethods['130401'].memory,
      pitfalls: [
        '温差写热端减冷端，不把两端温度相加。',
        '改变直径要平方，改变面积则直接用倍数。',
        '稳态热流率相同不表示各层温差也相同。',
      ],
      examFocus: {
        goal: '把变化条件压缩为面积×温差÷长度，必要时将直径先平方。',
        pastPaperSummary:
          '全量年度题覆盖相同导热率的条件、比例表达式、长度/直径/温差联合比较、独立改变因素以及复合隔热层的温度图。真空保温瓶还把传导与其他传热方式放在同一装置中比较。',
        pastPaperPatterns: [
          {
            form: '由控制变量建立比例',
            description:
              '材料相同时追踪AΔT/L；同时抬高两端温度保持温差，或分别判断四个改变对速率的影响。',
            reference: '2016、2018、2022 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q021',
              'ESAT_LEGACY_2018_NSAA_Q24',
              'ESAT_LEGACY_2022_NSAA_Q023',
            ],
          },
          {
            form: '几何尺寸与温度图的综合判断',
            description:
              '圆棒直径平方决定面积；串联金属与绝热层稳态热流相同，但绝热层温度梯度更大。',
            reference: '2019、2023 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q028', 'NSAA_2023_S1-Q032'],
          },
          {
            form: '关联装置：真空瓶的不同隔热设计',
            description:
              '差导热材料降低壁面传导，真空阻止气体传导与对流，亮面降低辐射吸收。主问为辐射，不能把真空说成阻断一切传热。',
            reference: '2020 NSAA · 跨知识点',
            sourceCodes: ['ESAT-2020-PHYSICS-006'],
          },
        ],
        examples: [
          {
            title: '导热率公式：不记常数也能选出关系',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT_LEGACY_2018_NSAA_Q24',
              why: '分别判断面积、长度与温差的比例作用，用零温差边界排除温度相加。',
            },
            question: '',
            answer: 'C · 与 A(T₁−T₂)/l 成正比',
            steps: [
              '截面积更大，传能的并行路径更多，故P与A成正比。',
              '同长棒两端温差更大，热流更大；温度相等时热流应为零，排除温度之和。',
              '长度更长，同一温差下温度梯度更小，因此P与l成反比。组合为 $P\\propto A(T_1-T_2)/l$，选C。',
            ],
            takeaway: '==用“温差为零则热流为零”快速排除温度之和。==',
          },
        ],
        checklist: [
          '能区分材料本身与几何尺寸的影响。',
          '能把直径倍率转换为面积倍率。',
          '能解释复合材料温度图为什么有不同斜率。',
        ],
      },
    },
    {
      sourceIds: ['uat-spec'],
      visual: 'physics-thermal',
      code: '130402',
      title: '对流',
      summary: thermalMethods['130402'].summary,
      paragraphs: [thermalMethods['130402'].intro],
      rules: thermalMethods['130402'].blocks.flatMap((block) => [
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
      memory: thermalMethods['130402'].memory,
      pitfalls: [
        '固定体积中的质量变化与固定质量的体积变化不是同一句话。',
        '对流输送的是带有内能的流体，不是仅有能量而没有物质移动。',
        '冷物体也会和周围流体对流换热，热流方向由温差决定。',
      ],
      examFocus: {
        goal: '用固定质量、体积和密度的区别解释流体循环，而不只背方向。',
        pastPaperSummary:
          '年度题的直接考法包括加热水时三条质量/体积/密度陈述，以及不同环境温度下金属球是否通过对流失热；还在真空隔热瓶中与其他机制交叉出现。总结覆盖全部这些相关题，不把对流简化为“热就向上”。',
        pastPaperPatterns: [
          {
            form: '逐项判断质量、体积与密度',
            description: '分别固定质量或体积，考热膨胀的因果链；正确密度变化才解释自然对流。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q004'],
          },
          {
            form: '比较物体与环境温度',
            description:
              '表面亮暗主要影响辐射；对流失热取决于球是否比周围流体更热。真空则没有对流介质。',
            reference: '2016 ENGAA、2020 NSAA',
            sourceCodes: ['ENGAA_2016_S1-Q020', 'ESAT-2020-PHYSICS-006'],
          },
        ],
        examples: [
          {
            title: '固定质量与固定体积：三句话不能混着读',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ENGAA_2017_S1-Q004',
              why: '区分固定质量和固定体积的约束，再把热膨胀、密度变化与对流原因连接。',
            },
            question: '',
            answer: 'G · 2和3正确',
            steps: [
              '通常温区的固定质量水受热，体积增加，所以陈述3正确。',
              '同一质量占更大体积，$\\rho=m/V$ 减小，因此陈述2正确。',
              '固定体积中所含质量应下降而不是增加，陈述1错误。较低密度热水上升、冷水补入形成对流，选G。',
            ],
            takeaway: '==先圈出“固定质量”还是“固定体积”，再看分子分母谁变。==',
          },
        ],
        checklist: [
          '能完整解释受热、密度、浮力和循环。',
          '能区分固定质量和固定体积的陈述。',
          '能判断固体、真空和从顶部加热的情形。',
        ],
      },
    },
    {
      sourceIds: ['uat-spec'],
      visual: 'physics-thermal',
      code: '130403',
      title: '热辐射',
      summary: thermalMethods['130403'].summary,
      paragraphs: [thermalMethods['130403'].intro],
      rules: thermalMethods['130403'].blocks.flatMap((block) => [
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
      memory: thermalMethods['130403'].memory,
      pitfalls: [
        '真空只能排除需要介质的传热，不能排除辐射。',
        '亮面不是好发射体；吸收差也不意味着完全不吸收。',
        '净传热为零不等于双方都停止辐射。',
      ],
      examFocus: {
        goal: '根据问法分清发出、吸收与净传热，再比较温度、表面和面积。',
        pastPaperSummary:
          '已收录年度题覆盖星体给定R²T⁴幂律、不同表面与环境的球，以及真空保温瓶陈述；另有热成像波段的跨章节判断。前者需要指数缩放，后两类关键是机制与“发射/净失热”区分。',
        pastPaperPatterns: [
          {
            form: '给定关系做多变量幂律缩放',
            description: '半径按平方、温度按四次方变化，不能直接把倍率一次相乘。',
            reference: '2016 ENGAA',
            sourceCodes: ['ENGAA_2016_S1-Q010'],
          },
          {
            form: '表面、环境和隔热装置',
            description:
              '同大小的球要区分自身发射和对流失热；真空瓶中亮面是差吸收/发射体，辐射可穿过真空。',
            reference: '2016 ENGAA、2020 NSAA',
            sourceCodes: ['ENGAA_2016_S1-Q020', 'ESAT-2020-PHYSICS-006'],
          },
          {
            form: '关联考法：热成像对应波段',
            description:
              '把频率换算到电磁波谱，判断是否属于用于热成像的红外区；不是所有高频电磁波都适合热成像。',
            reference: '2021 NSAA · 跨知识点',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q033'],
          },
        ],
        examples: [
          {
            title: '半径变100倍、温度减半：辐射如何变？',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ENGAA_2016_S1-Q010',
              why: '根据题给辐射公式分别处理半径平方和温度四次方，再合并新旧功率倍率。',
            },
            question: '',
            answer: 'D · 2.5×10²⁹ W',
            steps: [
              '使用题目给定关系，半径倍率贡献 $100^2=10000$。',
              '温度减半贡献 $(1/2)^4=1/16$，不能写成1/2或1/4。',
              '合并倍率 $10000/16=625$，所以新功率 $4.0\\times10^{26}\\times625=2.5\\times10^{29}\\,\\mathrm W$，选D。',
            ],
            takeaway: '==多变量幂律先逐个乘方，再合并倍率。==',
          },
        ],
        checklist: [
          '能说明辐射为什么能穿过真空。',
          '能区分发射速率与净失热速率。',
          '能按给定公式正确处理半径和温度的指数。',
        ],
      },
    },
    {
      sourceIds: ['uat-spec'],
      visual: 'physics-thermal',
      code: '130404',
      title: '热容',
      summary: thermalMethods['130404'].summary,
      paragraphs: [thermalMethods['130404'].intro],
      rules: thermalMethods['130404'].blocks.flatMap((block) => [
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
      memory: thermalMethods['130404'].memory,
      pitfalls: [
        '算出的ΔT还要加初温，才是末温。',
        '加热时间、质量与c的单位必须匹配。',
        '加热曲线平台不是没有吸能，可能在发生相变。',
      ],
      examFocus: {
        goal: '先画输入—储存—损失的能量账，找清温差后再计算。',
        pastPaperSummary:
          '年度相关题覆盖负初温铝块、加热器散热损失、温度—时间图斜率、热金属投入水中的热平衡，以及冰水混合的相变边界。这些形式共同考能量守恒与温差，但有无相变决定必须额外加入哪一项。',
        pastPaperPatterns: [
          {
            form: '由能量求温升，或反求散热',
            description: '先得到ΔT再加初温；有输入功率时从Pt扣除mcΔT才是传给环境的能量。',
            reference: '2019、2020 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q023', 'ESAT-2020-PHYSICS-001'],
          },
          {
            form: '温度图与热平衡',
            description:
              '图线斜率与比热容反比；金属和水在隔热条件下失热等于吸热，不能直接平均温度。',
            reference: '2021、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q035', 'ESAT_LEGACY_2022_NSAA_Q035'],
          },
          {
            form: '与潜热联立判断冰是否完全熔化',
            description:
              '先算冷却到熔点可释放的能量，再判断完全熔化与最终温度，避免默认所有冰都已变成水。',
            reference: '2021、2023 NSAA · 跨知识点',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q038', 'NSAA_2023_S1-Q033'],
          },
        ],
        examples: [
          {
            title: '初温−21°C：75°C是温升还是末温？',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'NSAA_2019_S1-Q023',
              why: '负初温情境直接暴露把温升误当末温的错误，便于用热量公式反查。',
            },
            question: '',
            answer: 'C · 54°C',
            steps: [
              '质量0.80 kg、比热容900 J/(kg·°C)，没有散热或相变，使用 $Q=mc\\Delta T$。',
              '温升 $\\Delta T=54000/(0.80\\times900)=75\\,^{\\circ}\\mathrm C$。',
              '初温为−21°C，因此末温 $T=-21+75=54\\,^{\\circ}\\mathrm C$，选C。',
              '代回温差 $54-(-21)=75$，热量恰为54000 J，完成复核。',
            ],
            takeaway: '==Q/mc给温差，不直接给末温。==',
          },
        ],
        checklist: [
          '能区分热容和比热容。',
          '能从温度图斜率推断c。',
          '能在散热、混合和相变条件下分别列热量账。',
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
