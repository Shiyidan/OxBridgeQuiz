// 物理磁学讲义：区分磁化、场、力和感应，按全部年度题归纳并明示无直接真题的范围。
import type { KnowledgeLesson } from './types'
import { magnetismMethods } from './magnetismMethods'

export const esatMagnetism: KnowledgeLesson = {
  code: '130200',
  title: 'Magnetism · 磁学',
  subtitle: '把磁场、受力和感应分清，再沿方向与比例解题',
  intro:
    '先画出磁场方向，再看题目是电流产生磁场、电流在场中受力，还是变化的磁场产生电压。三种关系各有起点，不能混用。',
  memory: [
    '磁体外磁场从N到S；吸引也可能来自感应磁化。',
    '电流造磁场用右手握拳；电流受力用左手定则。',
    '感应看变化；理想变压器电压比同匝数比、电流比反向。',
  ],
  sections: [
    {
      sourceIds: ['uat-spec'],
      visual: 'physics-magnetism',
      code: '130201',
      title: '磁体的性质',
      summary: magnetismMethods['130201'].summary,
      paragraphs: [magnetismMethods['130201'].intro],
      rules: magnetismMethods['130201'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: magnetismMethods['130201'].memory,
      pitfalls: [
        '铁被吸引不能证明原来已经带有永久磁极。',
        '把磁体切开不会得到孤立N极和S极，每段仍有两极。',
        '软铁断电后不保持强磁场，不应说任何剩磁都绝对为零。',
      ],
      examFocus: {
        goal: '根据磁场方向和撤去外场后的表现辨认磁极与材料用途。',
        pastPaperSummary:
          '已收录149道年度物理题中，未找到以软硬磁材料或条形磁体磁极辨认为主问的直接题；永久磁体作为电动机效应与感应装置条件出现。下面的例题使用题库收录的2025回忆题，不将回忆题冒充年度官方卷证据。',
        pastPaperPatterns: [
          {
            form: '关联场景：永久磁体给定外场',
            description:
              'U形磁体与移动磁体提供外场，后续分别考电流受力和磁场变化；这些题说明材料知识如何进入装置，但并不直接测试钢与软铁比较。',
            reference: '2019、2022 NSAA · 关联',
            sourceCodes: ['NSAA_2019_S1-Q029', 'ESAT_LEGACY_2022_NSAA_Q036'],
          },
        ],
        examples: [
          {
            title: '线圈断电后：软铁会留下强磁性吗？',
            source: {
              kind: 'bank',
              subject: 'physics',
              questionCode: 'ESAT-2025-CN-RECALL-PHY-Q19',
              why: '题库中的2025回忆题，以软铁保持磁性的判断直接训练材料性质。',
            },
            question: '',
            answer: 'D · I和II正确',
            steps: [
              '长螺线管中央的场比外部中央附近更强，软铁还会增强内部磁场，因此I正确。',
              '远离端部，内部磁场方向近似平行、大小近似一致，II正确；“强”与“均匀”分别说明不同性质。',
              '软铁易退磁，断电后大部分磁化消失，不会长期保持强磁场，III错误。选D。',
            ],
            takeaway: '==是否保留强磁性，要看材料，不要把软铁当永久磁体。==',
          },
        ],
        checklist: [
          '能指出条形磁体外场的方向。',
          '能解释磁体吸引未磁化铁的原因。',
          '能根据用途选择软铁或硬磁材料。',
        ],
      },
    },
    {
      sourceIds: ['uat-spec'],
      visual: 'physics-magnetism',
      code: '130202',
      title: '电流产生的磁场',
      summary: magnetismMethods['130202'].summary,
      paragraphs: [magnetismMethods['130202'].intro],
      rules: magnetismMethods['130202'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: magnetismMethods['130202'].memory,
      pitfalls: [
        '方向使用约定电流，不用电子移动方向。',
        '场线密集表示场强，不表示电流在场线上流动。',
        '固定电流时换粗导线不能以“电阻下降”推断电流又增大。',
      ],
      examFocus: {
        goal: '先确定电流方向和大小，再比较直线导线或螺线管的磁场。',
        pastPaperSummary:
          '在全部已收录年度物理题中，未发现直接要求比较螺线管匝密度、画直导线场线的题。年度题常把电流与磁场作为电动机条件，不能据此推断电流磁场这一节不考；本节选用题库直接题补齐训练。',
        pastPaperPatterns: [],
        pastPaperNote: '没有直接年度证据，不列虚构考频；题库题用于训练考纲规定的电流磁场关系。',
        examples: [
          {
            title: '三个线圈：先统一电流，再比较匝密度',
            source: {
              kind: 'bank',
              subject: 'physics',
              questionCode: 'ESAT-PHY-MOCK-ADAPT-E03-003-V2',
              why: '把三种电流信息统一换算，再比较单位长度匝数与电流的乘积。',
            },
            question: '',
            answer: 'A · 600，480，660 A/m',
            steps: [
              'P线圈电流 $I_P=6/15=0.40\\,\\mathrm A$，匝密度 $450/0.30=1500\\,\\mathrm{m^{-1}}$，乘积600。',
              'Q线圈电流 $I_Q=2.7/9=0.30\\,\\mathrm A$，匝密度 $320/0.20=1600\\,\\mathrm{m^{-1}}$，乘积480。',
              'R线圈电流 $I_R=44/80=0.55\\,\\mathrm A$，匝密度 $600/0.50=1200\\,\\mathrm{m^{-1}}$，乘积660。',
              '按P、Q、R原顺序选择A；三个数是比例量IN/L，单位A/m，不是磁感应强度T。',
            ],
            takeaway: '==别直接比较匝数：先求I，再乘每米的匝数。==',
          },
        ],
        checklist: [
          '能用右手确定直导线与线圈场方向。',
          '能区分总匝数与单位长度匝数。',
          '能解释通断、铁芯与电流怎样改变电磁铁。',
        ],
      },
    },
    {
      sourceIds: ['uat-spec'],
      visual: 'physics-magnetism',
      code: '130203',
      title: '电动机效应',
      summary: magnetismMethods['130203'].summary,
      paragraphs: [magnetismMethods['130203'].intro],
      rules: magnetismMethods['130203'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: magnetismMethods['130203'].memory,
      pitfalls: [
        '称重质量要从g换kg，导线长度要从cm换m。',
        '用左手定则时先写约定电流，不能把电子方向当电流。',
        '反向前后差值少除2，会把磁场强度算大一倍。',
      ],
      examFocus: {
        goal: '把方向、有效长度与受力平衡三件事分别核对。',
        pastPaperSummary:
          '年度相关题依次出现秤读数反向、导轨有效长度与加速度、导线悬浮的电流方向、Q/t与磁力联合计算，以及环形线圈转轴判断。全部题型都必须同时看方向或实际受力对象，而不只背F=BIL。',
        pastPaperPatterns: [
          {
            form: '磁力大小接入测量和运动',
            description:
              '秤的前后读数差、导轨间的载流长度、重力平衡与电荷流率都可用来间接给出F、I或L。',
            reference: '2019—2022 NSAA',
            sourceCodes: [
              'NSAA_2019_S1-Q029',
              'ESAT-2020-PHYSICS-010',
              'ESAT_LEGACY_2021_NSAA_Q032',
              'ESAT_LEGACY_2022_NSAA_Q021',
            ],
          },
          {
            form: '从各段受力判断转动轴',
            description:
              '环处在平面内的均匀场中，各段受力可能指向纸内/纸外；须据力矩判断旋转而非把它当作整体平移。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q037'],
          },
        ],
        examples: [
          {
            title: '202 g变198 g：为什么只取一半差值？',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'NSAA_2019_S1-Q029',
              why: '反向电流让秤读数跨过正负磁力，训练读数差对应2F而非F。',
            },
            question: '',
            answer: 'C · 0.20 T',
            steps: [
              '电流反向使磁力反向，202 g与198 g对称于200 g，单向附加读数只有2 g。',
              '故 $F=0.002\\times10=0.020\\,\\mathrm N$；不是用4 g直接求F。',
              '导线长 $5.0\\,\\mathrm{cm}=0.050\\,\\mathrm m$，$B=F/(IL)=0.020/(2.0\\times0.050)=0.20\\,\\mathrm T$，选C。',
            ],
            takeaway: '==前后从+F到−F，差值是2F。==',
          },
        ],
        checklist: [
          '能用左手确定磁力方向。',
          '能找出场内真正载流的有效L。',
          '能把磁力接入重力、合力或力矩分析。',
        ],
      },
    },
    {
      sourceIds: ['uat-spec'],
      visual: 'physics-magnetism',
      code: '130204',
      title: '电磁感应',
      summary: magnetismMethods['130204'].summary,
      paragraphs: [magnetismMethods['130204'].intro],
      rules: magnetismMethods['130204'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: magnetismMethods['130204'].memory,
      pitfalls: [
        '磁体在动但磁场穿过线圈的情况没变，也未必产生电压。',
        '产生感应电压不要求电路闭合；产生持续感应电流需要闭合路径。',
        '增加转速会改变频率，增加匝数主要改变幅值，不会自动改变频率。',
      ],
      examFocus: {
        goal: '先问磁场怎样变化，再判断极性和电压曲线，最后区分电压与电流。',
        pastPaperSummary:
          '已收录年度题的直接证据是2022 NSAA的磁体往返与感应电压图：同时考速度方向、磁体位置以及停止阶段。题库还可训练发电机的峰值影响因素；这些题库形式不冒充已出现的年度考法。',
        pastPaperPatterns: [
          {
            form: '由磁体往返运动选择电压图',
            description:
              '近处和远处的场变化不一样；反向运动让极性翻转，静止时回到零，不能只按速度图的形状判断。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q036'],
          },
        ],
        examples: [
          {
            title: '提高发电机峰值：逐项核对四个改变',
            source: {
              kind: 'bank',
              subject: 'physics',
              questionCode: 'ESAT-PHY-MOCK-ADAPT-E11-016-V2',
              why: '逐项归纳场强、转速、匝数和铁芯对感应电压峰值的作用。',
            },
            question: '',
            answer: 'E · 1、2、3、4全部正确',
            steps: [
              '更强磁体使线圈处变化的磁场更强，能增大峰值。',
              '更快转动使相同变化发生在更短时间，峰值增加，输出频率也增大。',
              '更多线圈匝数让各匝电压叠加；软铁芯增强穿过线圈的磁场，两者也能增加峰值。',
              '四个改变分别成立；选择完整集合E，不能看到前两个正确就停止判断。',
            ],
            takeaway: '==峰值看强度、匝数和变化快慢，频率看转动快慢。==',
          },
        ],
        checklist: [
          '能区分恒定强磁场与变化磁场。',
          '能用相对运动方向判断极性变化。',
          '能解释交流波形零点、峰值及转速变化。',
        ],
      },
    },
    {
      sourceIds: ['uat-spec'],
      visual: 'physics-magnetism',
      code: '130205',
      title: '变压器',
      summary: magnetismMethods['130205'].summary,
      paragraphs: [magnetismMethods['130205'].intro],
      rules: magnetismMethods['130205'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: magnetismMethods['130205'].memory,
      pitfalls: [
        '升压时理想输出电流减小，不是电压电流一起增大。',
        '匝数比不是效率，效率必须比较功率。',
        '不能把原线圈电流直接代入副侧电缆损耗。',
      ],
      examFocus: {
        goal: '画出原侧—副侧—线路，按匝比、电流比和实际功率逐段计算。',
        pastPaperSummary:
          '年度题涵盖升压后线路发热、开关增加副侧负载、非理想输出电流与效率、两级变压器与远距输电。另有直流跨海输电效率题，可训练线路能量账，但不能据它推断普通变压器适用于恒定直流。',
        pastPaperPatterns: [
          {
            form: '副侧电流与线路发热',
            description: '用反向电流比先找线路I，再用I²R；两级升降压题可从用户端功率逆推电站电压。',
            reference: '2019、2023 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q026', 'NSAA_2023_S1-Q034'],
          },
          {
            form: '负载开关与非理想效率',
            description:
              '副侧增加并联负载时输入电流随总输出功率变化；非理想题给实际输出电流，不能误用全功率守恒。',
            reference: '2020、2021 NSAA',
            sourceCodes: ['ESAT-2020-PHYSICS-007', 'ESAT_LEGACY_2021_NSAA_Q023'],
          },
          {
            form: '关联考法：输送功率与每分钟损耗',
            description:
              '比较两端VI得到效率，功率差乘时间才是损失能量。该题用直流系统，不直接考变压器原理。',
            reference: '2020 NSAA · 关联',
            sourceCodes: ['ESAT-2020-PHYSICS-008'],
          },
        ],
        examples: [
          {
            title: '升压20倍后，电缆发热用哪个电流？',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'NSAA_2019_S1-Q026',
              why: '先按反向匝比求副侧电流，再计算副侧线路I²R损耗。',
            },
            question: '',
            answer: 'A · 60 W',
            steps: [
              '匝数比 $N_s/N_p=4800/240=20$，所以副侧电压为原侧20倍。',
              '理想功率守恒给 $I_s=I_p/20=4.0/20=0.20\\,\\mathrm A$；电缆接在副侧。',
              '线路总电阻1500 Ω，发热 $P=(0.20)^2\\times1500=60\\,\\mathrm W$，选A。',
            ],
            takeaway: '==先定位线路在哪一侧，再把该侧电流平方。==',
          },
        ],
        checklist: [
          '能解释变压器为何需要变化电流。',
          '能同时正确写电压比和电流比。',
          '能区分理想线圈、实际效率和线路损耗。',
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
