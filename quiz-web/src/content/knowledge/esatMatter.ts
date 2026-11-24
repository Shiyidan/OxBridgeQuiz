// 物理物质复习讲义：以粒子模型贯通气体、相变、密度和压强，保留完整年度题考法证据。
import type { KnowledgeLesson } from './types'
import { matterMethods } from './matterMethods'

export const esatMatter: KnowledgeLesson = {
  code: '130500',
  title: 'Matter · 物质',
  subtitle: '把粒子图景接到可以计算的物理量',
  intro:
    '从三种物态的微观模型出发，掌握恒温气体、相变、密度和压强。每一步都先检查条件，再决定该用哪种量、哪一段过程和哪个单位。',
  memory: [
    '压缩气体减小粒子间距，不把粒子压小。',
    '恒温气体用绝对压强；相变先算潜热够不够。',
    '密度用净质量与材料体积；液体压强看上方液柱。',
  ],
  sections: [
    {
      code: '130501',
      title: '物态与粒子模型',
      summary: matterMethods['130501'].summary,
      paragraphs: [matterMethods['130501'].intro],
      rules: matterMethods['130501'].blocks.flatMap((block) => [
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
      memory: matterMethods['130501'].memory,
      pitfalls: [
        '把液体描述成粒子相距很远，或认为液体粒子固定不动。',
        '把压缩气体解释成分子尺寸变小。',
        '认为所有粒子都以相同速率运动。',
      ],
      visual: 'physics-matter',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '用粒子间距、相互作用和运动方式，解释形状、体积与压缩性。',
        pastPaperSummary:
          '年度题以恒温压缩考气体粒子速率与碰壁频率，并用流体密度变化连接宏观现象；固液气基本性质由题库题补充练习。',
        pastPaperPatterns: [
          {
            form: '等温压缩的微观解释',
            description:
              '已收录年度题直接通过活塞压缩考平均速率与碰撞频率，要求同时抓住温度不变与数密度增加。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-PHYSICS-003'],
          },
          {
            form: '物态模型的关联应用',
            description:
              '流体升温后的密度变化和密闭气体压强变化使用相同粒子间距思路；这些题不是三态性质的完整辨析，不能据此代替基本模型学习。',
            reference: '2017 ENGAA、2021 NSAA、2022 NSAA',
            sourceCodes: [
              'ENGAA_2017_S1-Q004',
              'ESAT_LEGACY_2021_NSAA_Q022',
              'ESAT_LEGACY_2022_NSAA_Q038',
            ],
          },
        ],
        pastPaperNote:
          '当前年度题未见直接逐项比较固、液、气全部性质的题；例题聚焦气体粒子，自测使用独立题库中的液体模型题。两者共同练习本点不同侧面。',
        examples: [
          {
            title: '同温压缩：分子变快了吗',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT-2020-PHYSICS-003',
              why: '活塞恒温压缩时，区分由温度决定的平均速率和由数密度改变的碰撞频率。',
            },
            question: '',
            answer: 'F · 平均速率v，碰撞频率2f',
            steps: [
              '题目强调气体温度始终不变，因此同种理想气体的平均动能和平均速率v不变。',
              '密闭气体的粒子数不变，体积减半使单位体积的粒子数加倍。活塞面积不变，同样速率下单位时间撞到活塞的粒子更多。',
              '碰撞频率由 $f$ 变为 $2f$，所以组合为 $v,\\;2f$，选F。',
              '压强升高来自碰壁更频繁，而不是分子被压小、温度升高或平均速率增加。',
            ],
            takeaway: '==把温度与数密度分别考虑，才能解释宏观压强。==',
          },
        ],
        checklist: [
          '能用排列和运动同时描述三种物态。',
          '能解释气体易压缩、液体能流动而难压缩。',
          '能区分粒子大小、平均间距与平均速率。',
        ],
      },
    },
    {
      code: '130502',
      title: '理想气体',
      summary: matterMethods['130502'].summary,
      paragraphs: [matterMethods['130502'].intro],
      rules: matterMethods['130502'].blocks.flatMap((block) => [
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
      memory: matterMethods['130502'].memory,
      pitfalls: [
        '把水下表压直接代入pV守恒。',
        '把压强加倍误作体积加倍。',
        '温度或气体总量改变后仍不加判断地使用同一pV常量。',
      ],
      visual: 'physics-matter',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '先检查定量、恒温，再用绝对压强乘体积保持不变。',
        pastPaperSummary:
          '气体题常把恒温体积比与水深、活塞负载或密度结合，最易错的是把表压代替绝对压强。',
        pastPaperPatterns: [
          {
            form: '微观变化与宏观比例',
            description: '等温压缩时速率不变、碰撞频率增加；压强百分比变化可转成密度比。',
            reference: '2020 NSAA、2021 NSAA',
            sourceCodes: ['ESAT-2020-PHYSICS-003', 'ESAT_LEGACY_2021_NSAA_Q022'],
          },
          {
            form: '水下活塞、注射器和深度',
            description: '用体积比先求绝对压强，再减大气压求深度；深度减半并不意味着绝对压强减半。',
            reference: '2019 NSAA、2023 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q025', 'NSAA_2023_S1-Q040'],
          },
          {
            form: '活塞重量与密度结合',
            description: '受力平衡给附加压强，气体定量恒温将最终压强比转为密度比。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q038'],
          },
        ],
        examples: [
          {
            title: '水下活塞：40m还是50m',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'NSAA_2019_S1-Q025',
              why: '水下气体体积比给绝对压强，减去大气压后才得到水柱深度。',
            },
            question: '',
            answer: 'A · $40\\,\\mathrm m$',
            steps: [
              '初态 $p_1=10^5$ Pa，体积从 $2.0\\times10^{-3}$ 变为 $4.0\\times10^{-4}$ m³，即原来的1/5。',
              '等温定量气体满足 $p_2=5p_1=5.0\\times10^5$ Pa，这是绝对压强。',
              '水造成的额外压强为 $p_2-p_{\\rm atm}=4.0\\times10^5$ Pa。',
              '$h=(4.0\\times10^5)/(1000\\times10)=40$ m，选A。50m会把大气压也当作水柱贡献。',
            ],
            takeaway: '==气体公式用绝对压强；求水深先减大气压。==',
          },
        ],
        checklist: [
          '能说明玻意耳定律的气体总量与温度条件。',
          '能区分表压和绝对压强。',
          '能联立活塞受力、pV关系与密度定义。',
        ],
      },
    },
    {
      code: '130503',
      title: '物态变化与潜热',
      summary: matterMethods['130503'].summary,
      paragraphs: [matterMethods['130503'].intro],
      rules: matterMethods['130503'].blocks.flatMap((block) => [
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
      memory: matterMethods['130503'].memory,
      pitfalls: [
        '看到吸热就认为温度一定上升。',
        '忽略熔化需要的能量，直接将冰和水做温度加权平均。',
        '冰未全熔还求出负的液态水终温，忽略0°C冰水共存条件。',
      ],
      visual: 'physics-matter',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '先判断是否已经完成相变，再决定用潜热还是升温公式。',
        pastPaperSummary:
          '相变题既从恒功率加热平台反推质量，也比较冰水混合后的两种结局：全部熔化后升温，或剩冰并停在0°C。',
        pastPaperPatterns: [
          {
            form: '平台持续时间反推质量',
            description: '从恒功率温度—时间图读取熔化平台长度，用输入能量等于mL求质量。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q027'],
          },
          {
            form: '混合后全部熔化',
            description: '热水降温同时支付熔冰能量和熔水升温能量，最终质量必须包括熔化后的水。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q038'],
          },
          {
            form: '混合后仍有冰',
            description:
              '先比较最大可放热与完全熔冰所需热量，判定0°C共存末态，而非强行列全熔方程。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q033'],
          },
        ],
        examples: [
          {
            title: '冰水混合：先检查冰能不能全部熔化',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'NSAA_2023_S1-Q033',
              why: '先比较热水最大可放热量与熔冰需要，判断剩冰和0°C共存末态。',
            },
            question: '',
            answer: 'B · $T=0^\\circ\\mathrm C$',
            steps: [
              '20g热水冷到0°C最多放出 $20\\times4.2\\times30=2520$ J。',
              '10g冰完全熔化需要 $10\\times330=3300$ J。',
              '2520J小于3300J，因此冰只会部分熔化；有冰和水共存，平衡温度是0°C，选B。',
              '实际熔冰质量为 $2520/330\\approx7.64$ g，仍余约2.36g冰，验证“未全熔”的分支成立。',
            ],
            takeaway: '==先支付相变能量，余额才有资格用来升温。==',
          },
        ],
        checklist: [
          '能用微观模型解释相变平台。',
          '能区分比热容和比潜热的单位与适用阶段。',
          '能根据能量是否足够判断冰水混合末态。',
        ],
      },
    },
    {
      code: '130504',
      title: '密度',
      summary: matterMethods['130504'].summary,
      paragraphs: [matterMethods['130504'].intro],
      rules: matterMethods['130504'].blocks.flatMap((block) => [
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
      memory: matterMethods['130504'].memory,
      pitfalls: [
        '用重量N直接除体积，得到的不是质量密度。',
        '忘记扣掉空容器或孔洞。',
        '把体积比直接当质量比，或将不同单位的密度直接比较。',
      ],
      visual: 'physics-matter',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '先取真正的材料体积和净质量，再用质量除体积。',
        pastPaperSummary:
          '密度题常通过空洞、混合材料、两次称量和单位换算增加步骤，也会与压强、浮力、气体压缩交叉。',
        pastPaperPatterns: [
          {
            form: '空洞、组合材料和比例',
            description:
              '从带孔几何体中扣掉空体积；混合材料按各自密度换算质量；原子与原子核问题把长度比立方后比较密度。',
            reference: '2016 ENGAA、2017 ENGAA、2019 NSAA、2020 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q018',
              'ENGAA_2016_S1-Q024',
              'ENGAA_2017_S1-Q016',
              'NSAA_2019_S1-Q035',
              'ESAT-2020-PHYSICS-014',
            ],
          },
          {
            form: '测量中的容器与单位',
            description:
              '两种同体积液体的称量差可消去空容器；单位关系题检验密度、体积和质量之间的乘除。',
            reference: '2018 ENGAA、2017 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q20', 'NSAA_2017_S1-Q032'],
          },
          {
            form: '与压强、浮力、气体联立',
            description: '由压强求重量再求密度，或以密度确定液层排序、浮力以及等温压缩比。',
            reference: '2017 ENGAA、2020 NSAA、2021 NSAA、2022 NSAA、2023 NSAA',
            sourceCodes: [
              'ENGAA_2017_S1-Q004',
              'ESAT-2020-PHYSICS-017',
              'ESAT_LEGACY_2021_NSAA_Q022',
              'ESAT_LEGACY_2021_NSAA_Q039',
              'ESAT_LEGACY_2022_NSAA_Q038',
              'ESAT_LEGACY_2022_NSAA_Q040',
              'NSAA_2023_S1-Q028',
              'NSAA_2023_S1-Q039',
            ],
          },
        ],
        examples: [
          {
            title: '两次称量：先把量筒本身消掉',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT_LEGACY_2018_ENGAA_Q20',
              why: '同量筒装同体积水和油，用两次质量差消去容器再反求空筒质量。',
            },
            question: '',
            answer: 'C · $90\\,\\mathrm g$',
            steps: [
              '水和油体积相同，容器相同，两次总质量差 $290-270=20$ g完全来自液体质量差。',
              '密度差 $1.0-0.90=0.10\\,\\mathrm{g\\,cm^{-3}}$，所以 $V=20/0.10=200\\,\\mathrm{cm^3}$。',
              '水的净质量 $1.0\\times200=200$ g，容器质量 $290-200=90$ g，选C。',
              '油的净质量 $0.90\\times200=180$ g，$90+180=270$ g，与第二次称量吻合。',
            ],
            takeaway: '==相同容器、相同体积，先做差最省步骤。==',
          },
        ],
        checklist: [
          '能正确换算g/cm³与kg/m³。',
          '能为规则固体、不规则固体、液体设计密度测量。',
          '能区分材料密度、平均密度、质量分数与体积分数。',
        ],
      },
    },
    {
      code: '130505',
      title: '压强',
      summary: matterMethods['130505'].summary,
      paragraphs: [matterMethods['130505'].intro],
      rules: matterMethods['130505'].blocks.flatMap((block) => [
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
      memory: matterMethods['130505'].memory,
      pitfalls: [
        '用距容器底部的高度直接当水深。',
        '将cm²换m²只除100。',
        '把大气压重复加入压强差，或求绝对压强时漏掉大气压。',
      ],
      visual: 'physics-matter',
      sourceIds: ['uat-physics'],
      examFocus: {
        goal: '固体看实际受力面积，液体看测点上方的竖直液柱。',
        pastPaperSummary:
          '压强题一类从接触面和重量联立几何量，另一类按液层、深度或活塞负载叠加压强，再连接气体体积或浮力。',
        pastPaperPatterns: [
          {
            form: '接触压强与几何量换算',
            description:
              '长方体换不同面放置时由密度恢复体积，再联立各面面积；圆柱题由压强和底面积反求质量密度。',
            reference: '2022 NSAA、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q040', 'NSAA_2023_S1-Q028'],
          },
          {
            form: '液柱分层与水下气体',
            description: '按上方各层厚度累加静压，或将深度对应的绝对压强与气体pV关系联立。',
            reference: '2019 NSAA、2021 NSAA、2023 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q025', 'ESAT_LEGACY_2021_NSAA_Q039', 'NSAA_2023_S1-Q040'],
          },
          {
            form: '压力差产生浮力或支撑活塞',
            description: '活塞重量产生额外压强，漂浮木块位移后上下压力差改变，得到恢复加速度。',
            reference: '2022 NSAA、2023 NSAA、2020 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2022_NSAA_Q038',
              'NSAA_2023_S1-Q039',
              'ESAT-2020-PHYSICS-017',
            ],
          },
        ],
        examples: [
          {
            title: '分层液体：测点以上到底还有多少液柱',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q039',
              why: '按密度确定液层顺序，再只累计测点上方各液柱的静压。',
            },
            question: '',
            answer: 'G · $420\\,\\mathrm{Pa}$',
            steps: [
              'X密度0.80g/cm³，小于Y的1.0g/cm³，因此X在上、Y在下。层高 $h_X=80/20=4$ cm，$h_Y=100/20=5$ cm。',
              '测点在底上4cm，位于Y层内部；测点上方是1cm的Y以及全部4cm的X。',
              '液柱压强 $p=1000\\times10\\times0.01+800\\times10\\times0.04=100+320=420$ Pa，选G。',
              '题目问液体造成的压强，故此处不加大气压；测点下方的4cm液体也不计入上方液柱。',
            ],
            takeaway: '==先画层高，再累计测点上方；不要只看距底高度。==',
          },
        ],
        checklist: [
          '能区分压力、压强、受力面积。',
          '能处理液体深度、分层与绝对压强。',
          '能正确连接压强、重量、质量和密度。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-physics',
      title: 'UAT-UK · ESAT 物理考纲 P5',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按P5.1–P5.5核对范围；讲解独立编写，真实题源保持原题正文。',
    },
  ],
}
