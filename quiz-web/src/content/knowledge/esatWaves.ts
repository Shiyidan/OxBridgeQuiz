// ESAT物理波章节：按全量年度题归纳考法，串联粒子振动、波传播、光路与探测。
import type { KnowledgeLesson } from './types'
import { wavesMethods } from './wavesMethods'

export const esatWaves: KnowledgeLesson = {
  code: '130600',
  title: 'Waves · 波',
  subtitle: '画出传播方向，让频率、波长和时间各就各位',
  intro:
    '从绳上一个标记点开始，连到折射、光路、回声与电磁波。每次计算先认对象与参照，再用一条关系连接图和量。',
  memory: [
    '粒子来回振动，波携能向前；整周期粒子路程4A。',
    '固定边界频率不变，变慢波长变短；多普勒另看相对运动。',
    '光学角从法线量，回声距离用半程；电磁谱高频对应短波。',
  ],
  sections: [
    {
      code: '130601',
      title: '波的性质',
      summary: wavesMethods['130601'].summary,
      paragraphs: [wavesMethods['130601'].intro],
      rules: wavesMethods['130601'].blocks.flatMap((block) => [
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
      memory: wavesMethods['130601'].memory,
      pitfalls: [
        '波速不是介质粒子瞬时速度；波长不能代替振动路程。',
        '厘米、毫米和千米需配合速度单位；峰谷高度差要除2才是振幅。',
        '一个周期结束粒子位移为零，但路程不是零。',
      ],
      visual: 'physics-waves',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '遇到图或文字，先判定测量的是波的传播还是粒子的振动。',
        pastPaperSummary:
          '逐题审阅已收录的149道年度物理题：本点既考4A振动路程，也考两类图、固定点过峰、地震波到时与相位判断，不能只背v=fλ。',
        pastPaperPatterns: [
          {
            form: '振幅、周期与粒子累计路程',
            description: '由一次振动4A求路程、平均速率，或反求振幅；波速和波长可能只是干扰量。',
            reference: '2016 ENGAA；2018 ENGAA；2019、2023 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q012',
              'ESAT_LEGACY_2018_ENGAA_Q18',
              'NSAA_2019_S1-Q019',
              'NSAA_2023_S1-Q036',
            ],
          },
          {
            form: '两类波形图与相位',
            description: '由时间图读周期、位置图读波长；进一步判断若干毫秒后标记粒子的位移。',
            reference: '2017 ENGAA；2022 NSAA',
            sourceCodes: ['ENGAA_2017_S1-Q018', 'ESAT_LEGACY_2022_NSAA_Q032'],
          },
          {
            form: '传播时间、过峰次序与几何限制',
            description:
              '同峰/下一峰到时区别、同源快慢地震波，以及等到时对应的等距离，不能由时间差直接断定站点间距离。',
            reference: '2018 ENGAA；2020、2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_ENGAA_Q28',
              'ESAT-2020-PHYSICS-015',
              'ESAT_LEGACY_2022_NSAA_Q039',
            ],
          },
        ],
        examples: [
          {
            title: '波长给了，却为什么不用？',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ENGAA_2016_S1-Q012',
              why: '训练区分介质粒子路程与波传播距离，使用整周期4A计数。',
            },
            question: '',
            answer: 'E · 3600 cm',
            steps: [
              '一分钟为60 s，振动次数 $n=ft=5.0\\times60=300$。',
              '振幅3.0 cm意味着完整一次振动走 $4A=12.0\\,\\mathrm{cm}$；这是粒子的路程。',
              '总路程 $300\\times12=3600\\,\\mathrm{cm}$，选E。波长4.0 cm只与波传播有关，不能替代12 cm。',
              '核对：粒子整周期末回到原处，所以位移为零；题目问总路程，不能答零。',
            ],
            takeaway: '==先认运动对象，再决定用波长还是振幅。==',
          },
        ],
        checklist: [
          '能从两类横轴读出T或λ。',
          '能说明整周期粒子路程4A和位移零同时成立。',
          '能按波峰次序列传播时间关系。',
        ],
      },
    },
    {
      code: '130602',
      title: '波的行为',
      summary: wavesMethods['130602'].summary,
      paragraphs: [wavesMethods['130602'].intro],
      rules: wavesMethods['130602'].blocks.flatMap((block) => [
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
      memory: wavesMethods['130602'].memory,
      pitfalls: [
        '“靠近听起来更响”不是多普勒效应的定义；多普勒判断音调。',
        '不能将光速写成c加天体速度。',
        '反射波的振幅可能减少；反射定律只直接约束方向。',
      ],
      visual: 'physics-waves',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '把固定边界与相对运动分开，先找不变量再算改变的量。',
        pastPaperSummary:
          '相关年度题覆盖水波速度差、波前几何、玻璃中的时间延迟、迎波船和天体谱移；跨题共同策略是先辨明参照物。',
        pastPaperPatterns: [
          {
            form: '固定频率的速度—波长联动',
            description:
              '由波长差反求频率，或由波前倾角比较速度；玻璃延迟题把额外振动次数换成时间差。',
            reference: '2018、2020、2023 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q32',
              'ESAT-2020-PHYSICS-004',
              'NSAA_2023_S1-Q035',
            ],
          },
          {
            form: '相对遇峰与天体谱移',
            description:
              '船与波相向运动用相对过峰速率；迎向墙壁喊声的回声频率更高，但因传播损失可以更轻。远离天体与宇宙膨胀题考低频长波方向，真空光速不变。',
            reference: '2016、2021、2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2021_NSAA_Q030',
              'ESAT_LEGACY_2021_NSAA_Q025',
              'ESAT_LEGACY_2022_NSAA_Q022',
              'NSAA_2016_S1-Q019',
            ],
          },
        ],
        examples: [
          {
            title: '用波长差读出速度差',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT_LEGACY_2018_NSAA_Q32',
              why: '训练在固定频率条件下把速度差写成频率乘波长差。',
            },
            question: '',
            answer: 'E · $72\\,\\mathrm{cm\\,s^{-1}}$',
            steps: [
              '全程保持厘米制：两区速度分别为 $1.5f$ 和 $1.2f$，单位cm/s。',
              '速度减少18 cm/s，故 $(1.5-1.2)f=18$，得到 $f=60\\,\\mathrm{Hz}$。',
              '浅水中速度 $v=1.2\\times60=72\\,\\mathrm{cm\\,s^{-1}}$，选E。',
              '原速度90 cm/s，减18正好72；若算得90，回答的是进入前的速度。',
            ],
            takeaway: '==频率不变时，速度差等于频率乘波长差。==',
          },
        ],
        checklist: [
          '能列反射、折射前后f、v、λ的变化。',
          '能解释正入射时方向不变而波长改变。',
          '能区分红移、观察者遇峰与固定边界。',
        ],
      },
    },
    {
      code: '130603',
      title: '光学',
      summary: wavesMethods['130603'].summary,
      paragraphs: [wavesMethods['130603'].intro],
      rules: wavesMethods['130603'].blocks.flatMap((block) => [
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
      memory: wavesMethods['130603'].memory,
      pitfalls: [
        '平面镜虚像不是实际光线穿过镜面汇聚。',
        '镜面最终倾角不是镜面转过的角度，需与原位置作差。',
        '转动第二面镜时，入射到它的光线可能已变方向。',
      ],
      visual: 'physics-waves',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '逐段追踪实际光路，用角度参考线避免双倍角与互余角混淆。',
        pastPaperSummary:
          '已收录年度题中的直接光路证据是水波波前的折射角以及双镜旋转。平面镜成像按考纲讲解，当前题源未提供独立成像尺寸题，不能把它伪称已考形式。',
        pastPaperPatterns: [
          {
            form: '波前图转为法线角',
            description: '从波峰与界面的夹角识别入射/折射角，并由间距判断波速。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-PHYSICS-004'],
          },
          {
            form: '双平面镜改变方向后恢复出射线',
            description: '给第一面镜旋转后的倾角，求第二面镜的方向和旋转量；必须区别最终角和转角。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q029'],
          },
          {
            form: '平板中的光程时间差',
            description: '垂直穿入平板方向不变，但传播速度下降，额外周期数可反推厚度。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q035'],
          },
        ],
        examples: [
          {
            title: '两面镜怎样一起恢复水平出射？',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'NSAA_2023_S1-Q029',
              why: '训练逐次反射方向角与镜面最终角、旋转量的区别。',
            },
            question: '',
            answer: 'E · 顺时针 $45^\\circ-\\theta$',
            steps: [
              '以水平向右为0°、逆时针为正。第一面镜方向为 $\\theta$，故第一次反射后的传播方向为 $2\\theta$。',
              '第二面镜新方向设为 $\\alpha$，要使最终方向回到0°，有 $2\\alpha-2\\theta=0$，即 $\\alpha=\\theta$。',
              '第二面镜由45°转到 $\\theta<45^\\circ$，必须顺时针转 $45^\\circ-\\theta$，选E。',
              '两镜保持平行时，两次反射后方向恢复。题目问镜面转角，不是光线变化的双倍角。',
            ],
            takeaway: '==每面镜各算一次反射，最后才比较新旧镜面角。==',
          },
        ],
        checklist: [
          '能从镜面角换算入射角。',
          '能画平面镜虚像并判断物像距离。',
          '能用一套方向角跟踪两次反射。',
        ],
      },
    },
    {
      code: '130604',
      title: '声波',
      summary: wavesMethods['130604'].summary,
      paragraphs: [wavesMethods['130604'].intro],
      rules: wavesMethods['130604'].blocks.flatMap((block) => [
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
      memory: wavesMethods['130604'].memory,
      pitfalls: [
        '回声的远端距离只取总往返路程的一半。',
        '超声能在固体中传播，不要求空气。',
        '音调取决于频率，响度与振幅相关；两者不互相代替。',
      ],
      visual: 'physics-waves',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '画出声波来回路径，把回波时间变成目标距离。',
        pastPaperSummary:
          '相关年度题从听觉频段筛选，逐步延伸到两墙重复回声和杆内裂纹定位。共同难点是正确识别两程以及题目所求的哪段距离。',
        pastPaperPatterns: [
          {
            form: '回声的音调与响度分别判断',
            description:
              '观察者迎向墙壁时，往返过程造成接收回声频率升高；题给回声更轻则振幅更小，不能把音调和响度绑定。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q022'],
          },
          {
            form: '人耳能听到哪些波',
            description:
              '读声波速度、波长并换算频率，再与听觉区间比较；同题还须区分眼睛接收的电磁波。',
            reference: '2017 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q021'],
          },
          {
            form: '超声裂纹的两次回波',
            description:
              '由裂纹和远端的回波时刻或图峰定位裂纹，再求裂纹到背面的间距；可用时间比例消掉未知波速。',
            reference: '2021、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q040', 'ESAT_LEGACY_2022_NSAA_Q027'],
          },
          {
            form: '重复点击同时对应两侧回声',
            description: '两堵墙产生不同往返延迟，需要让二者都是发声周期的整数倍。',
            reference: '2016 ENGAA',
            sourceCodes: ['ENGAA_2016_S1-Q028'],
          },
        ],
        examples: [
          {
            title: '两个回波都往返，为什么最终不用再除2？',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q040',
              why: '训练用两条回波路程相除消去波速，再按所求位置取差。',
            },
            question: '',
            answer: 'E · $L(t_2-t_1)/t_2$',
            steps: [
              '设发射端到裂纹为x，均匀杆内声速为v。远端回波给 $2L=vt_2$，裂纹回波给 $2x=vt_1$。',
              '两式相除，$x/L=t_1/t_2$，所以 $x=Lt_1/t_2$。因两式都是往返，因子2已抵消。',
              '题目要裂纹到远端距离，因此 $d=L-x=L(t_2-t_1)/t_2$，选E。',
              '若裂纹在中点，$t_1=t_2/2$，结果应为L/2；公式满足，额外再除2则不满足。',
            ],
            takeaway: '==先分别写往返路径，再按题目要求取差。==',
          },
        ],
        checklist: [
          '能分清音调、响度与传播速度。',
          '能说明真空不传声而超声能在金属中传播。',
          '能从两个回波求裂纹位置或剩余间距。',
        ],
      },
    },
    {
      code: '130605',
      title: '电磁波谱',
      summary: wavesMethods['130605'].summary,
      paragraphs: [wavesMethods['130605'].intro],
      rules: wavesMethods['130605'].blocks.flatMap((block) => [
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
      memory: wavesMethods['130605'].memory,
      pitfalls: [
        '微波不是声音；超声不是电磁波。',
        '红外位于红光更低频一侧，紫外位于紫光更高频一侧。',
        '高频与高强度不是同一属性，不应混淆电离能力与总能量通量。',
      ],
      visual: 'physics-waves',
      sourceIds: ['uat-spec'],
      examFocus: {
        goal: '把谱序、单位换算和用途组合起来，逐条独立核对。',
        pastPaperSummary:
          '年度题既考波段边界与可见范围，也考真空中速度比、天体谱移和伽马探测到时差。归纳包括全部相关题，而非只看下面的示例。',
        pastPaperPatterns: [
          {
            form: '边界换算、可见范围与应用逐项判断',
            description:
              '由波长/频率判断紫外、可见、红外及微波用途；有的题同时筛选能听与能看的波。',
            reference: '2017 NSAA；2018 ENGAA；2020、2021 NSAA',
            sourceCodes: [
              'NSAA_2017_S1-Q021',
              'ESAT_LEGACY_2018_ENGAA_Q06',
              'ESAT-2020-PHYSICS-011',
              'ESAT_LEGACY_2021_NSAA_Q033',
            ],
          },
          {
            form: '同速反比与谱移',
            description: '真空中各种电磁波速度相同；比较极大波长比或远离/膨胀后的频率与波长方向。',
            reference: '2016、2019、2021 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q019', 'NSAA_2019_S1-Q022', 'ESAT_LEGACY_2021_NSAA_Q025'],
          },
          {
            form: '伽马成像的传播时间',
            description: '两端探测时间差换成路程差，再求放射源离中点的距离。',
            reference: '2017 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q008'],
          },
        ],
        examples: [
          {
            title: '红光、微波、热成像：三句话分别验算',
            source: {
              kind: 'annual',
              subject: 'physics',
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q033',
              why: '训练频率波长换算、可见光方向及电磁波用途的逐项核验。',
            },
            question: '',
            answer: 'C · 仅陈述2',
            steps: [
              '陈述1频率 $7.5\\times10^{14}$ Hz大于绿光频率，波长为400 nm，靠近紫端而非红端，错误。',
              '陈述2先把12 cm换为0.12 m，$f=c/\\lambda=3.0\\times10^8/0.12=2.5\\times10^9$ Hz，正确。',
              '陈述3对应 $\\lambda=3.0\\times10^8/(2.5\\times10^{15})=1.2\\times10^{-7}$ m，即120 nm，是紫外；热成像使用红外，因此错误。',
              '真假顺序为假、真、假，只选2，对应C。',
            ],
            takeaway: '==先算波长确认位置，再查该波段适不适合所述用途。==',
          },
        ],
        checklist: [
          '能按频率和波长两个方向排列波谱。',
          '能转换nm、μm、MHz并处理范围端点。',
          '能用性质解释用途，而不只背名称。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-spec',
      title: 'UAT-UK ESAT Content Specification · P6',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按现行P6.1–P6.5组织覆盖范围；教学解释独立编写，题目及考法证据来自项目已有题库。',
    },
  ],
}
