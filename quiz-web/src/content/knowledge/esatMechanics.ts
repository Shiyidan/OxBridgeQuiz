// 物理力学复习讲义：覆盖P3全部细项，按149道年度物理题正文归纳相关考法。
import type { KnowledgeLesson } from './types'
import { mechanicsMethods } from './mechanicsMethods'

export const esatMechanics: KnowledgeLesson = {
  code: '130300',
  title: 'Mechanics · 力学',
  subtitle: '从运动图像走向受力、动量和能量',
  intro:
    '先确定对象、方向和过程，再选择运动学、受力、动量或能量关系。基础定义简记，重点辨清图像含义、公式条件和守恒的适用范围。',
  memory: [
    '运动图读斜率和面积；受力图只画所选对象受到的力。',
    '合力决定加速度；守恒先问系统是否满足条件。',
    '伸长看差、动能看平方；功率看快慢、效率看占比。',
  ],
  sections: [
    {
      code: '130301',
      title: '运动学',
      summary: mechanicsMethods['130301'].summary,
      paragraphs: [mechanicsMethods['130301'].intro],
      rules: mechanicsMethods['130301'].blocks.flatMap((block) => [
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
      memory: mechanicsMethods['130301'].memory,
      pitfalls: [
        '把两段不同时间的速度直接算术平均。',
        '负速度段的面积直接抵消后，当作总路程。',
        '把距离—时间图的高度当作速度，或把加速度为零误认为静止。',
      ],
      visual: 'physics-mechanics',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '先选正方向，再把图像的斜率、面积与运动过程对应起来。',
        pastPaperSummary:
          '运动题常把图像斜率、分段面积与平均速率结合，再连接合力或能量；先分清路程、位移以及所问的阶段。',
        pastPaperPatterns: [
          {
            form: '图像中的斜率、面积与正负',
            description:
              '识别线性关系、只取减速区间面积、区分总路程与位移，或先求恒速段再占总路程的比例。',
            reference: '2016 ENGAA、2017 ENGAA、2018 NSAA、2019 NSAA、2020 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q004',
              'ENGAA_2016_S1-Q022',
              'ENGAA_2017_S1-Q002',
              'ESAT_LEGACY_2018_NSAA_Q22',
              'NSAA_2019_S1-Q034',
              'ESAT-2020-PHYSICS-013',
            ],
          },
          {
            form: '分段运动与相对运动',
            description:
              '按加速、匀速、制动划分过程；已知平均速率反求时间，或比较延迟释放物体之间的距离。',
            reference: '2021 NSAA、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q034', 'NSAA_2023_S1-Q025', 'NSAA_2023_S1-Q031'],
          },
          {
            form: '把速度关系接到力与能量',
            description:
              '由末初速度、位移或时间建立运动关系，再连接制动功、合力或落体能量。传播时间差题也使用相同的路程—时间模型。',
            reference: '2017 ENGAA、2019 NSAA、2022 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2017_S1-Q008',
              'NSAA_2019_S1-Q031',
              'ESAT_LEGACY_2022_NSAA_Q026',
              'ESAT_LEGACY_2022_NSAA_Q039',
              'NSAA_2023_S1-Q021',
              'NSAA_2023_S1-Q022',
            ],
          },
        ],
        examples: [
          {
            title: '平均速率：先还原总路程',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'NSAA_2023_S1-Q025',
              why: '用全程平均速率还原总路程，再反求两个不同速率阶段的时间。',
            },
            question: '',
            answer: 'B · $6.0\\,\\mathrm s$',
            steps: [
              '全程路程由平均速率确定：$8.5\\times20=170\\,\\mathrm m$。',
              '低速段用时 $t$，高速段用时 $20-t$，因此 $5t+10(20-t)=170$。',
              '整理得 $200-5t=170$，所以 $t=6.0\\,\\mathrm s$，选B。',
              '代回：$5\\times6+10\\times14=170$。高速段时间较长，平均速率8.5更接近10，趋势也合理。',
            ],
            takeaway: '==先算总路程，不把两个速率直接平均。==',
          },
        ],
        checklist: [
          '能从四种运动图判断斜率或面积的意义。',
          '能区分负速度与减速，区分路程与位移。',
          '能说明匀加速公式的适用条件并完成分段计算。',
        ],
      },
    },
    {
      code: '130302',
      title: '力与受力分析',
      summary: mechanicsMethods['130302'].summary,
      paragraphs: [mechanicsMethods['130302'].intro],
      rules: mechanicsMethods['130302'].blocks.flatMap((block) => [
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
      memory: mechanicsMethods['130302'].memory,
      pitfalls: [
        '把向下运动误判为合力一定向下。',
        '在同一受力图中同时画物体所受的力与它施给外界的反作用力。',
        '忽略浮力，或把浮力写成物体自身密度乘体积乘g。',
      ],
      visual: 'physics-mechanics',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '先确定研究对象，把真正作用在它上面的力画全，再求合力。',
        pastPaperSummary:
          '受力题常在下落、滑轮、牵引或浮体情境中隐藏一股力；先确定研究对象，再判断是平衡还是加速。',
        pastPaperPatterns: [
          {
            form: '阻力、重量与终端运动',
            description: '下落物体要在同一个方向方程中处理重力、阻力及浮力；终端速度对应合力为零。',
            reference: '2018 ENGAA、2020 NSAA、2017 ENGAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_ENGAA_Q16',
              'ESAT_LEGACY_2018_ENGAA_Q22',
              'ESAT-2020-PHYSICS-017',
              'ENGAA_2017_S1-Q024',
            ],
          },
          {
            form: '选择对象与内外力',
            description: '滑轮支架承受两段绳力；牵引整体先消去内部张力，碰撞接触力还要计入重力。',
            reference: '2016 ENGAA、2021 NSAA、2022 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q014',
              'ESAT_LEGACY_2021_NSAA_Q024',
              'ESAT_LEGACY_2022_NSAA_Q031',
            ],
          },
          {
            form: '与浮力、弹力和磁力联立',
            description: '将力的来源公式放入受力平衡或第二定律，而不是只代某一个力的公式。',
            reference: '2019 NSAA、2020 NSAA、2021 NSAA、2023 NSAA',
            sourceCodes: [
              'NSAA_2019_S1-Q024',
              'NSAA_2019_S1-Q029',
              'ESAT-2020-PHYSICS-010',
              'ESAT_LEGACY_2021_NSAA_Q032',
              'NSAA_2023_S1-Q039',
            ],
          },
        ],
        examples: [
          {
            title: '液体中下落：终端速度并不意味着没有力',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT-2020-PHYSICS-017',
              why: '液体中下落同时受到重力、浮力和阻力，用终端平衡求速度。',
            },
            question: '',
            answer: 'G · $\\dfrac{Vg(\\rho_{\\rm S}-\\rho_{\\rm L})}{rk}$',
            steps: [
              '研究金属球，重力 $\\rho_{\\rm S}Vg$ 向下，浮力 $\\rho_{\\rm L}Vg$ 和阻力 $krv$ 向上。',
              '终端速度保持不变，因此 $\\rho_{\\rm S}Vg-\\rho_{\\rm L}Vg-krv=0$。',
              '移项得 $v=Vg(\\rho_{\\rm S}-\\rho_{\\rm L})/(rk)$，选G。',
              '密度差而非密度和控制下落驱动力。若两密度趋于相同，所需终端下落速度趋于零，符合物理图景。',
            ],
            takeaway: '==先列完整受力方程，再代入各力的表达式。==',
          },
        ],
        checklist: [
          '能画出重量、支持力、张力、摩擦和阻力的正确方向。',
          '能选择整体或单体，不重复计内力。',
          '能在终端运动中写出含浮力的完整平衡关系。',
        ],
      },
    },
    {
      code: '130303',
      title: '力与伸长',
      summary: mechanicsMethods['130303'].summary,
      paragraphs: [mechanicsMethods['130303'].intro],
      rules: mechanicsMethods['130303'].blocks.flatMap((block) => [
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
      memory: mechanicsMethods['130303'].memory,
      pitfalls: [
        '使用弹簧总长代替伸长。',
        '力—伸长图与能量—伸长平方图混淆：后者斜率是k/2。',
        '忽略厘米平方到米平方的换算，或漏掉储能公式中的1/2。',
      ],
      visual: 'physics-mechanics',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '伸长不是总长；图下的面积给能量，卸载后能否恢复才判断弹性。',
        pastPaperSummary:
          '弹簧题围绕伸长与总长、图像斜率和面积展开，也常把弹性储能接到上升高度、动能与重力势能。',
        pastPaperPatterns: [
          {
            form: '区分长度、伸长与恢复性',
            description:
              '判断胡克定律的对象是伸长，并比较线性储能的平方比例；也结合第三定律判断张力与重量。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q024'],
          },
          {
            form: '由平衡求弹簧参数再算能量',
            description: '自然长度与受压后长度给形变量，平衡重量给弹力，最终由三角形面积求储能。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q027'],
          },
          {
            form: '弹簧与机械能、图像结合',
            description:
              '比较不同压缩量和质量的上升高度；竖直回缩扣除重力势能；能量—伸长平方图反推出力。',
            reference: '2020 NSAA、2022 NSAA、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-PHYSICS-019',
              'ESAT_LEGACY_2022_NSAA_Q037',
              'NSAA_2023_S1-Q026',
            ],
          },
        ],
        examples: [
          {
            title: '三个判断：为什么只有储能变四倍正确',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'NSAA_2019_S1-Q024',
              why: '一题同时辨析伸长与总长、平衡力与第三定律、弹性储能的平方比例。',
            },
            question: '',
            answer: 'D · 只有陈述3正确',
            steps: [
              '胡克定律是 $F=k(l-l_0)$，力与伸长成正比，不与总长成正比，陈述1错误。',
              '张力和重力都作用在同一个负载上，是平衡力；第三定律力对必须作用在不同物体上，陈述2错误。',
              "同一弹簧 $E=\\frac12kx^2$；伸长加倍后 $E'=4E$，陈述3正确。",
              '三个判断分别检查变量定义、受力对象、平方比例，只有陈述3符合，选D。',
            ],
            takeaway: '==先说清伸长和作用对象，再谈比例。==',
          },
        ],
        checklist: [
          '能区分比例限度和弹性限度。',
          '能从图下面积求弹性储能。',
          '能处理竖直弹簧过程中的重力势能变化。',
        ],
      },
    },
    {
      code: '130304',
      title: '牛顿运动定律',
      summary: mechanicsMethods['130304'].summary,
      paragraphs: [mechanicsMethods['130304'].intro],
      rules: mechanicsMethods['130304'].blocks.flatMap((block) => [
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
      memory: mechanicsMethods['130304'].memory,
      pitfalls: [
        '把驱动力直接代入ma，忘记阻力。',
        '认为物体还在向前走，所以合力不可能向后。',
        '把重力与支持力叫作第三定律力对，或误认为质量大的物体对小物体施力更大。',
      ],
      visual: 'physics-mechanics',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '合力改变运动状态；质量反映惯性，第三定律的两股力作用在不同物体。',
        pastPaperSummary:
          '牛顿定律常考整体与单体的选择、初始匀速后的力增量，以及平衡力和第三定律力对的区别。',
        pastPaperPatterns: [
          {
            form: '由合力变化求加速度',
            description:
              '初始匀速的牵引系统、恒推力燃料消耗、已知动能变化的直线运动，分别考整体质量、变质量和速度还原。',
            reference: '2021 NSAA、2020 NSAA、2019 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2021_NSAA_Q024',
              'ESAT-2020-PHYSICS-020',
              'NSAA_2019_S1-Q031',
              'ESAT-2020-PHYSICS-013',
            ],
          },
          {
            form: '第三定律与平衡力辨析',
            description: '降落伞、悬挂弹簧及磁场中的导线，都要求找准两股力分别作用于谁。',
            reference: '2017 ENGAA、2019 NSAA、2022 NSAA',
            sourceCodes: [
              'ENGAA_2017_S1-Q024',
              'NSAA_2019_S1-Q024',
              'NSAA_2019_S1-Q029',
              'ESAT_LEGACY_2022_NSAA_Q025',
            ],
          },
          {
            form: '把受力与速度变化联立',
            description:
              '滑轮支架、摩擦面、反弹接触和浮体回弹，先画图再求合力，不能漏掉重力或浮力。',
            reference: '2016 ENGAA、2018 ENGAA、2020 NSAA、2022 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q014',
              'ESAT_LEGACY_2018_ENGAA_Q16',
              'ESAT-2020-PHYSICS-010',
              'ESAT_LEGACY_2022_NSAA_Q026',
              'ESAT_LEGACY_2022_NSAA_Q031',
              'NSAA_2023_S1-Q022',
              'NSAA_2023_S1-Q039',
            ],
          },
        ],
        examples: [
          {
            title: '汽车牵引拖车：先用原来的匀速条件',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q024',
              why: '利用原来匀速抵消未知驱动力和阻力，再对汽车拖车整体应用第二定律。',
            },
            question: '',
            answer: 'A · $1.00\\,\\mathrm{m\\,s^{-2}}$',
            steps: [
              '把汽车和拖车作为整体，原来匀速，说明原驱动力与原总阻力抵消。',
              '新合力只需计算变化：$3000-200-400=2400\\,\\mathrm N$。',
              '整体质量 $1400+1000=2400\\,\\mathrm{kg}$，所以 $a=2400/2400=1.00\\,\\mathrm{m\\,s^{-2}}$，选A。',
              '牵引连接力属于整体内力，无需额外加入；若求汽车或拖车单独受力才重新考虑它。',
            ],
            takeaway: '==先利用初始平衡，再用净变化量求合力。==',
          },
        ],
        checklist: [
          '能用第一定律判断零合力而非零速度。',
          '能按研究对象选质量和外力。',
          '能找出真正的第三定律力对。',
        ],
      },
    },
    {
      code: '130305',
      title: '质量与重量',
      summary: mechanicsMethods['130305'].summary,
      paragraphs: [mechanicsMethods['130305'].intro],
      rules: mechanicsMethods['130305'].blocks.flatMap((block) => [
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
      memory: mechanicsMethods['130305'].memory,
      pitfalls: [
        '把质量的kg和重量的N混写。',
        '把终端速度理解成落地停止。',
        '物体向下运动时仍把a固定为g，忽略阻力。',
      ],
      visual: 'physics-mechanics',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '质量不随地点改变，重量取决于g；终端速度来自力平衡。',
        pastPaperSummary:
          '质量与重量常嵌入落体、阻力和密度题：先由当地重量确定g，再判断实际加速度与终端状态。',
        pastPaperPatterns: [
          {
            form: '由重量反求质量或当地g',
            description:
              '月面自由落体把W/m代入运动式；磁场驱动金属杆、密度或压强题也要求先将重量转换为质量。',
            reference: '2023 NSAA、2016 ENGAA、2020 NSAA',
            sourceCodes: [
              'NSAA_2023_S1-Q021',
              'ENGAA_2016_S1-Q018',
              'ESAT-2020-PHYSICS-010',
              'NSAA_2023_S1-Q028',
            ],
          },
          {
            form: '阻力改变实际加速度',
            description:
              '下落岩石由mg减阻力求质量；降落伞图像求终端速度后再求阻力系数；液体终端下落还包含浮力。',
            reference: '2018 ENGAA、2020 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_ENGAA_Q16',
              'ESAT_LEGACY_2018_ENGAA_Q22',
              'ESAT-2020-PHYSICS-017',
            ],
          },
          {
            form: '匀速下落的能量账本',
            description:
              '终端速度时动能不变但势能持续减少；完整下降过程还可能带初动能与剩余末动能。',
            reference: '2017 ENGAA、2020 NSAA',
            sourceCodes: ['ENGAA_2017_S1-Q024', 'ESAT-2020-PHYSICS-018'],
          },
        ],
        examples: [
          {
            title: '月球自由落体：当地g藏在W与m中',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'NSAA_2023_S1-Q021',
              why: '从月球当地的重量和质量恢复重力场强度，避免误代地球g。',
            },
            question: '',
            answer: 'G · $\\sqrt{\\dfrac{2Wh}{m}}$',
            steps: [
              '月球上的重量满足 $W=mg_{\\rm Moon}$，所以 $g_{\\rm Moon}=W/m$。',
              '没有大气，忽略阻力；物体由静止开始，重力势能减少量全部转为动能。',
              '$Wh=\\frac12mv^2$，整理并取速率的正根：$v=\\sqrt{2Wh/m}$，选G。',
              '$Wh/m$ 单位是 $\\mathrm{m^2\\,s^{-2}}$，最后必须开平方；无需代入地球的g。',
            ],
            takeaway: '==换了地点，先确定当地g；不要把重量当质量。==',
          },
        ],
        checklist: [
          '能解释同一物体质量不变但重量会变。',
          '能描述开伞前后合力与加速度的方向。',
          '能用势能下降率解释终端下落中的能量转移。',
        ],
      },
    },
    {
      code: '130306',
      title: '动量',
      summary: mechanicsMethods['130306'].summary,
      paragraphs: [mechanicsMethods['130306'].intro],
      rules: mechanicsMethods['130306'].blocks.flatMap((block) => [
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
      memory: mechanicsMethods['130306'].memory,
      pitfalls: [
        '相向速度都写正数，导致总动量被高估。',
        '碰撞黏合题误套动能守恒。',
        '把动量变化数值直接当力，忘记除以碰撞时间。',
      ],
      visual: 'physics-mechanics',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '选定正方向，在系统边界内守恒；反弹时速度的符号不能丢。',
        pastPaperSummary:
          '动量题常以对撞、黏合、反冲或短时撞击呈现，关键是速度符号、系统边界与是否还要计算动能损失。',
        pastPaperPatterns: [
          {
            form: '相向碰撞与黏合',
            description:
              '停止的列车求未知质量；悬浮船和小车黏合后求速度、能量损失或平均相互作用力。',
            reference: '2017 ENGAA、2019 NSAA、2020 NSAA',
            sourceCodes: ['ENGAA_2017_S1-Q022', 'NSAA_2019_S1-Q033', 'ESAT-2020-PHYSICS-012'],
          },
          {
            form: '冲量、反弹与研究对象',
            description: '高速微小碎片产生较大平均力；反弹速度换号后还需从合力恢复接触力。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q025', 'ESAT_LEGACY_2022_NSAA_Q031'],
          },
          {
            form: '反冲与动量—动能换元',
            description:
              '静止原子核仅分成两个产物且外力冲量可忽略时，两产物动量反向等大，动能分配与质量反比；已知p和动能可消去速度求质量。',
            reference: '2016 ENGAA、2018 ENGAA、2017 NSAA',
            sourceCodes: ['ENGAA_2016_S1-Q026', 'ESAT_LEGACY_2018_ENGAA_Q12', 'NSAA_2017_S1-Q032'],
          },
        ],
        examples: [
          {
            title: '对撞后都停下：从动量求车厢数',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ENGAA_2017_S1-Q022',
              why: '两列车相向运动并最终停止，由有符号动量守恒反求未知车厢数。',
            },
            question: '',
            answer: 'C · 10节',
            steps: [
              '货车总质量 $3\\times130+7\\times30=600$ 吨。取货车方向为正，客车速度为 $-5.0\\,\\mathrm{m\\,s^{-1}}$。',
              '最终总动量为零，故 $600\\times2.0-M\\times5.0=0$，得到客车质量 $M=240$ 吨。',
              '客车两辆机车质量 $2\\times70=140$ 吨，车厢总质量 $240-140=100$ 吨。',
              '每节10吨，车厢数 $100/10=10$，选C。此处质量只作同单位比例，吨可统一保留；若求N则需换kg。',
            ],
            takeaway: '==停车意味着总动量抵消，而不是两车质量相等。==',
          },
        ],
        checklist: [
          '能带方向写出碰撞前后总动量。',
          '能区分动量守恒与动能守恒。',
          '能从动量变化率求合力，再按需恢复接触力。',
        ],
      },
    },
    {
      code: '130307',
      title: '功、能量与效率',
      summary: mechanicsMethods['130307'].summary,
      paragraphs: [mechanicsMethods['130307'].intro],
      rules: mechanicsMethods['130307'].blocks.flatMap((block) => [
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
      memory: mechanicsMethods['130307'].memory,
      pitfalls: [
        '用末速度乘时间作为匀加速路程。',
        '将推力做功等同于合力做功，漏掉阻力耗散。',
        '把kW、分钟直接代入J制公式，或把动能按速度的一次方缩放。',
      ],
      visual: 'physics-mechanics',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '画出能量从哪里来、到哪里去；输入功不一定全部变成动能。',
        pastPaperSummary:
          '能量题常把效率、功率、机械能转换和阻力损耗串在一起；先明确系统边界，再核对输入、储能与输出。',
        pastPaperPatterns: [
          {
            form: '效率与完整系统边界',
            description:
              '电机、灯泡、输电等题要求区分输入、有用输出和损失，并按实际持续时间换算能量。',
            reference: '2017 ENGAA、2018 ENGAA、2020 NSAA、2022 NSAA',
            sourceCodes: [
              'ENGAA_2017_S1-Q006',
              'ENGAA_2017_S1-Q012',
              'ESAT_LEGACY_2018_ENGAA_Q08',
              'ESAT_LEGACY_2018_ENGAA_Q10',
              'ESAT-2020-PHYSICS-008',
              'ESAT_LEGACY_2022_NSAA_Q028',
            ],
          },
          {
            form: '运动与能量互相求解',
            description: '速度平方比例、恒力制动、阻力功、举升功率与下落损耗，均需先统一过程边界。',
            reference: '2016 ENGAA、2017 ENGAA、2019 NSAA、2020 NSAA、2022 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q004',
              'ENGAA_2017_S1-Q024',
              'ENGAA_2017_S1-Q028',
              'NSAA_2019_S1-Q020',
              'NSAA_2019_S1-Q031',
              'ESAT-2020-PHYSICS-018',
              'ESAT_LEGACY_2022_NSAA_Q026',
              'NSAA_2023_S1-Q021',
              'NSAA_2023_S1-Q022',
            ],
          },
          {
            form: '碰撞、反冲与弹性储能',
            description: '由动量约束速度再比较动能，或由弹簧储能换成重力势能与动能。',
            reference:
              '2016 ENGAA、2018 ENGAA、2019 NSAA、2020 NSAA、2021 NSAA、2022 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q026',
              'ESAT_LEGACY_2018_ENGAA_Q12',
              'NSAA_2019_S1-Q024',
              'NSAA_2019_S1-Q033',
              'ESAT-2020-PHYSICS-012',
              'ESAT-2020-PHYSICS-019',
              'ESAT_LEGACY_2021_NSAA_Q027',
              'ESAT_LEGACY_2022_NSAA_Q037',
              'NSAA_2023_S1-Q026',
            ],
          },
        ],
        examples: [
          {
            title: '推力做的功，有多少消耗在阻力上',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q026',
              why: '把推力输入功分成动能增加和克服阻力的功，并用受力法交叉验证。',
            },
            question: '',
            answer: 'B · $20\\,\\mathrm J$',
            steps: [
              '匀加速由静止到 $2.0\\,\\mathrm{m\\,s^{-1}}$，用时4.0 s，所以位移 $s=(0+2.0)\\times4.0/2=4.0\\,\\mathrm m$。',
              '推力输入功 $8.0\\times4.0=32\\,\\mathrm J$，增加的动能 $\\frac12\\times6.0\\times2.0^2=12\\,\\mathrm J$。',
              '克服阻力的功 $32-12=20\\,\\mathrm J$，选B。',
              '另核：$a=0.50\\,\\mathrm{m\\,s^{-2}}$，合力3 N，阻力 $8-3=5$ N，$5\\times4=20$ J。',
            ],
            takeaway: '==输入功分给动能增加与阻力耗散，不能二者混算。==',
          },
        ],
        checklist: [
          '能给能量转移画出完整账本。',
          '能区分推力功、合力功和阻力功。',
          '能正确处理功率、效率、时间与单位。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-physics',
      title: 'UAT-UK · ESAT 物理考纲 P3',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按P3.1–P3.7核对知识范围；讲解独立编写，年度题考法按当前题库正文归纳。',
    },
  ],
}
