// 数学 1 比与比例讲义：以基准、份额与倍率串联11个考纲节点，例题与自测均使用真实题源。
import type { KnowledgeLesson } from './types'
import { scaleFactorsMethods } from './scaleFactorsMethods'
import { ratioFoundationsMethods } from './ratioFoundationsMethods'
import { ratioApplicationsMethods } from './ratioApplicationsMethods'

export const esatRatioProportion: KnowledgeLesson = {
  code: '110300',
  title: 'Ratio and proportion · 比与比例',
  subtitle: '先定基准，再看份数、倍率与不变量',
  intro:
    '把比例关系画出来：哪些量保持不变，哪些量按同一倍率变化。用同一条思路连接地图、混合、百分比与相似。',
  memory: [
    '**比看顺序，分数看分母。**部分对部分与部分对整体不能混用。',
    '**先对齐公共量，再求总份数。**总量、差值各有对应的份数。',
    '**百分比写倍率，连续变化连乘。**反求原值沿乘数链倒着除。',
    '**相似先找长度倍率k，再用k²或k³。**',
    '**正比固定商，反比固定积。**更高次幂按文字完整建模。',
    '**迭代每一步都从上一步出发。**区分损失和保留，核对严格不等号。',
  ],
  sections: [
    {
      code: '110301',
      title: '比例因子、比例图与地图',
      summary: scaleFactorsMethods.summary,
      paragraphs: [scaleFactorsMethods.intro],
      memory: scaleFactorsMethods.memory,
      rules: scaleFactorsMethods.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '将 120% 误写为增加 120%。',
        '复印缩小后仍把比例尺分母乘缩小倍率。',
        '不统一 cm 与 km 就直接求比。',
      ],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '沿着“对应长度 → 线性倍率 → 同单位比例尺”三步走，最后才处理面积或体积。',
        pastPaperSummary:
          '已入库真题把尺度放进菱形、长方体和密度模型中；未见直接考查复印地图的年度题，地图部分用题库题训练同一比例尺关系。',
        pastPaperPatterns: [
          {
            form: '由对应长度确定放缩倍率',
            description: '先求原图中的实际长度或对角线，再比较新旧的对应量。',
            reference: '2016、2021 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q017', 'ESAT_LEGACY_2021_NSAA_Q017'],
          },
          {
            form: '比例尺与体积、密度结合',
            description: '长度缩小40倍，体积缩小40³倍，之后再统一体积单位求质量。',
            reference: '2018 ENGAA',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q13'],
          },
        ],
        examples: [
          {
            title: '复印两次，地图的比例尺怎样变？',
            source: {
              questionCode: 'ESAT-M1-AI-20260809-5428590C118C-R3',
              why: '检验连续线性倍率与比例尺分母的反向变化。',
              subject: 'mathematics1',
              kind: 'bank',
            },
            question: '',
            answer: 'D · 约为 1:27778。',
            steps: [
              '原地图任意一段长1 cm，对应实地25000 cm。',
              '两次复印后，同一段在图上变为1.2×0.75=0.9 cm，地面距离仍是25000 cm。',
              '新比例尺 $0.9:25000=1:(25000/0.9)$，分母约为27778。',
              '地图整体缩小，1 cm代表的实地距离应比原来更远，这与分母变大一致。',
            ],
            takeaway: '保持真实距离不变，用“图上长度 : 实际长度”重新化为 1:N。',
          },
        ],
        checklist: ['比较的是同一条对应长度吗？', '单位是否统一？', '复印的是长度还是面积？'],
      },
    },
    {
      code: '110302',
      title: '一个量占另一个量的分数',
      summary: ratioFoundationsMethods['110302'].summary,
      paragraphs: [ratioFoundationsMethods['110302'].intro],
      memory: ratioFoundationsMethods['110302'].memory,
      rules: ratioFoundationsMethods['110302'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '把 A 占 B 的比例写成 A/(A+B)。',
        '见到假分数就取倒数。',
        '系数乘积相等时仍沿用同方向比。',
      ],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '在分数线下先写出参照量，再把文字关系变为等式。',
        pastPaperSummary:
          '年度题常把比例隐藏在百分数与分数等量条件里，或在各自增长后要求重新比较；关键是每一步都明确分母。',
        pastPaperPatterns: [
          {
            form: '不同写法的倍数相等',
            description: '百分数与分数先统一为乘数，解出数量比，再按要求求差。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q12'],
          },
          {
            form: '变化后重新选择参照量',
            description: '两人的增长率或速度不同，先分别求新量，再以题目指定的一方为基准。',
            reference: '2021、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q018', 'NSAA_2023_S1-Q009'],
          },
        ],
        examples: [
          {
            title: '80% 与三分之二相等，两个数怎样比？',
            source: {
              questionCode: 'ESAT_LEGACY_2018_NSAA_Q12',
              why: '用等量关系区分系数比与数量比。',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'F · x−y=−1。',
            steps: [
              '设两数为 $A,B$，由题意得 $\\frac45A=\\frac23B$。',
              '所以 $\\frac AB=\\frac{2/3}{4/5}=\\frac56$，不是 $\\frac65$。',
              '最简整数比为5:6，故x=5，y=6，x−y=−1。',
              '第一数被乘的系数较大，要得到相同结果，第一数应较小，方向正确。',
            ],
            takeaway: '读“谁是谁的几分之几”时，先固定分母，再判断比值方向。',
          },
        ],
        checklist: ['分母代表谁？', '比值大于1是否符合题意？', '化简后是否仍保持原顺序？'],
      },
    },
    {
      code: '110303',
      title: '比的记号',
      summary: ratioFoundationsMethods['110303'].summary,
      paragraphs: [ratioFoundationsMethods['110303'].intro],
      memory: ratioFoundationsMethods['110303'].memory,
      rules: ratioFoundationsMethods['110303'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '忽略同一量在两个比中的份数不同。',
        '只放大比中的一项。',
        '将3:2误解为两个数相差1。',
      ],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '把公共量的份数调到相同，再读出题目要求的比。',
        pastPaperSummary:
          '当前真题包括两组比合并、三种涂料的比值闭合，以及分数或百分数条件转比；公共量始终是连接关系的桥梁。',
        pastPaperPatterns: [
          {
            form: '两组比连接',
            description: '统一中间数量的份数，之后求端点之比或进一步按总量分配。',
            reference: '2016 ENGAA、2019 NSAA',
            sourceCodes: ['ENGAA_2016_S1-Q005', 'NSAA_2019_S1-Q012'],
          },
          {
            form: '比例条件互相核对',
            description: '三组两两比必须来自同一套数量；也会把一组关系写成百分数与分数相等。',
            reference: '2018、2020 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q12', 'ESAT-2020-MATHS1-013'],
          },
        ],
        examples: [
          {
            title: '两个比里的 R，真的是同一份数吗？',
            source: {
              questionCode: 'ENGAA_2016_S1-Q005',
              why: '对齐公共量后消去R，避免直接拼接端点。',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'C · Q:S=3:4。',
            steps: [
              'Q:R=5:2乘3，得到15:6。',
              'R:S=3:10乘2，得到6:20。',
              '因此Q:R:S=15:6:20，Q:S=15:20=3:4。',
              '直接写5:10=1:2会把两组不同尺度的份数混为一谈。',
            ],
            takeaway: '公共量相同，两个比才能接起来。',
          },
        ],
        checklist: ['公共项是哪一个量？', '每一组是否整体放大？', '最后是否化为最简整数比？'],
      },
    },
    {
      code: '110304',
      title: '按比例分配',
      summary: ratioFoundationsMethods['110304'].summary,
      paragraphs: [ratioFoundationsMethods['110304'].intro],
      memory: ratioFoundationsMethods['110304'].memory,
      rules: ratioFoundationsMethods['110304'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: ['总份数漏掉一项。', '把差值按总份数分配。', '第二次分配误用全体总量。'],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '让题目给出的总量或差值，与图中的对应份数一一匹配。',
        pastPaperSummary:
          '年度题主要把两组比与总量连接，或在等额支出后给出新比，检验份额计算及不变量。',
        pastPaperPatterns: [
          {
            form: '合并三项比再分配',
            description: '对齐共同项，得到完整三项比后用总量确定一份。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q012'],
          },
          {
            form: '支出后比改变',
            description: '原总量先给两人金额，再用两人减少相同金额建立新比。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q010'],
          },
        ],
        examples: [
          {
            title: '三个人的总量给了，为什么还不能直接分？',
            source: {
              questionCode: 'NSAA_2019_S1-Q012',
              why: '两组比必须对齐q，才能把375分成总份数。',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'G · p+r=291。',
            steps: [
              'p:q=5:7乘4，q:r=4:11乘7，得到p:q:r=20:28:77。',
              '总份数为20+28+77=125，一份为375÷125=3。',
              'p+r共有97份，所以p+r=97×3=291。',
              '也可先算q=84，再用总量375减84检查。',
            ],
            takeaway: '合比 → 总份数 → 一份 → 指定量。',
          },
        ],
        checklist: ['题目给的是总量还是差？', '多项比是否统一尺度？', '分配所得之和是否回到总量？'],
      },
    },
    {
      code: '110305',
      title: '实际情境中的比',
      summary: ratioFoundationsMethods['110305'].summary,
      paragraphs: [ratioFoundationsMethods['110305'].intro],
      memory: ratioFoundationsMethods['110305'].memory,
      rules: ratioFoundationsMethods['110305'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '不同容量的混合物直接平均浓度。',
        '只加入某一种成分，却把两种成分都按同倍数增加。',
        '平均速度只取两个速度的平均。',
      ],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '用组成量守恒或相同时间、相同路程，把复杂情境缩成一个比例关系。',
        pastPaperSummary:
          '当前年度题涵盖涂料比、同场赛跑、往返平均速度及油费换算。浓度加权在本地题库有直接训练题，不能把这些题库题当作年度考法证据。',
        pastPaperPatterns: [
          {
            form: '配方的比例闭合',
            description: '由任意两种成分的比连接第三种成分，求出未知份数。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-MATHS1-013'],
          },
          {
            form: '运动中找相同条件',
            description: '赛跑用同一时刻的路程比；上下坡或重复训练先分别累计时间。',
            reference: '2021–2023 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2021_NSAA_Q018',
              'ESAT_LEGACY_2022_NSAA_Q012',
              'NSAA_2023_S1-Q011',
            ],
          },
          {
            form: '单位费用连乘连除',
            description: '里程换为正确单位，再由耗油率求升数，最后换成金额。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q019'],
          },
        ],
        examples: [
          {
            title: '三桶涂料混合，哪一个百分数不能直接平均？',
            source: {
              questionCode: 'ESAT-M1-REM14-DIRECT-006',
              why: '用各桶体积份数加权红色涂料的量。',
              subject: 'mathematics1',
              kind: 'bank',
            },
            question: '',
            answer: 'D · R中红色涂料占26%。',
            steps: [
              '把P、Q、R的体积取为6、4、5份，总体积15份。',
              '最终红色涂料为15×30%=4.5份；P、Q分别贡献2.4、0.8份。',
              'R贡献4.5−2.4−0.8=1.3份，所以R的红色占比为1.3÷5=26%。',
              '用(40%+20%+26%)÷3会忽略三桶的不同体积。',
            ],
            takeaway: '先累计组成量，再除以总量；权重来自各桶的真实大小。',
          },
          {
            title: '有人先冲线，另一人还差多少米？',
            source: {
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q018',
              why: '在同一时刻用速度比换成路程比。',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'F · Sam还差50 m。',
            steps: [
              '把Cameron速度记为v，Alex与Sam分别是1.12v和0.98v。',
              'Alex跑完400 m时，Sam路程为 $400\\times\\frac{0.98}{1.12}=400\\times\\frac78=350$ m。',
              '距离终点还差400−350=50 m。',
              '直接用400×(12%+2%)会把Cameron的基准错当成Alex的速度。',
            ],
            takeaway: '先找共同时间，再以冲线者为基准求另一个人的路程。',
          },
        ],
        checklist: [
          '混合时用的权重是什么？',
          '什么量不变？',
          '运动比较是否发生在同一时刻或同一路程？',
        ],
      },
    },
    {
      code: '110306',
      title: '比例与分数/函数',
      summary: ratioApplicationsMethods['110306'].summary,
      paragraphs: [ratioApplicationsMethods['110306'].intro],
      memory: ratioApplicationsMethods['110306'].memory,
      rules: ratioApplicationsMethods['110306'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '把所有直线都说成正比例。',
        '与平方成正比时仍使用y/x。',
        '不同关系的比例常数混用。',
      ],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '在文字、比值、式子和图像之间来回转换，认出真正保持不变的量。',
        pastPaperSummary:
          '年度题经常把比例写成平方、倒数等函数关系，并让两个关系通过中间变量连接；需要先建模，再代入，而不是凭增减趋势选答案。',
        pastPaperPatterns: [
          {
            form: '两个比例模型串联',
            description: '分别求常数，再消去共同变量；常数也要参加平方或乘法。',
            reference: '2017 ENGAA、2023 NSAA',
            sourceCodes: ['ENGAA_2017_S1-Q009', 'NSAA_2023_S1-Q014'],
          },
          {
            form: '根据基准数据确定模型',
            description: '已知一组对应量先求比例常数；额外销量或单位变化要先还原成模型中的量。',
            reference: '2016 ENGAA、2018–2022 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q013',
              'ESAT_LEGACY_2018_NSAA_Q05',
              'NSAA_2019_S1-Q004',
              'ESAT-2020-MATHS1-011',
              'ESAT_LEGACY_2021_NSAA_Q019',
              'ESAT_LEGACY_2022_NSAA_Q010',
            ],
          },
        ],
        examples: [
          {
            title: '两条比例关系，怎样消去中间的 Q？',
            source: {
              questionCode: 'ENGAA_2017_S1-Q009',
              why: '区分每条关系的常数，代入时整体平方。',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'E · $P=25/(2R^2)$。',
            steps: [
              '由 $P=aQ^2$ 及 $P=2,Q=4$，得 $a=1/8$。',
              '由 $Q=b/R$ 及 $Q=2,R=5$，得 $b=10$。',
              '代入 $P=\\frac18(10/R)^2=\\frac{25}{2R^2}$。',
              'R增大时Q减小，P也减小，结果应含R²的倒数。',
            ],
            takeaway: '先分别定常数，再整体代入；用增减趋势做最后检查。',
          },
        ],
        checklist: ['固定的是y/x还是别的比值？', '直线是否经过原点？', '每条关系是否各有常数？'],
      },
    },
    {
      code: '110307',
      title: '比例题中的分数',
      summary: ratioApplicationsMethods['110307'].summary,
      paragraphs: [ratioApplicationsMethods['110307'].intro],
      memory: ratioApplicationsMethods['110307'].memory,
      rules: ratioApplicationsMethods['110307'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '把1:3写为短段占全长1/3。',
        '每次百分数都乘最初的总量。',
        '将人数的比直接用作不同票价的票款比。',
      ],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '先标出这一刻的整体，把“部分 : 部分”转成“部分 ÷ 整体”。',
        pastPaperSummary:
          '年度题常把分数份额嵌入线段、相似三角形或单位正方形面积中；先解比例关系，才有正确的长度进入几何计算。',
        pastPaperPatterns: [
          {
            form: '线段分段后用勾股',
            description: '区分部分与全长，用1:3得到3/4，或直接用题给全长的1/4。',
            reference: '2021、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q009', 'ESAT_LEGACY_2022_NSAA_Q002'],
          },
          {
            form: '相似和面积里的份额',
            description: '总边长可能由两段相加；单位正方形边上的多个比分别转成分数后，再算面积。',
            reference: '2022、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q016', 'NSAA_2023_S1-Q005'],
          },
          {
            form: '总量分配与新比例',
            description: '把份数分配落到实际金额，再处理等量变化。',
            reference: '2019、2021 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q012', 'ESAT_LEGACY_2021_NSAA_Q010'],
          },
        ],
        examples: [
          {
            title: '1:3 分段，哪一段应该取全长的四分之三？',
            source: {
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q009',
              why: '比例只是第一步，正确份额才能进入两次勾股。',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'D · $PQ=\\sqrt{37}$ cm。',
            steps: [
              '由大直角三角形得 $SQ=\\sqrt{8^2-4^2}=4\\sqrt3$。',
              '$SR:RQ=1:3$，所以 $RQ=\\frac34SQ=3\\sqrt3$，不是 $SQ/3$。',
              '小直角三角形中，$PQ^2=PR^2-RQ^2=64-27=37$。',
              '两条斜边都长8，但两个三角形的另一条直角边不同，不能直接认作全等。',
            ],
            takeaway: '先把比转成占全长的分数，再代入几何关系。',
          },
        ],
        checklist: [
          '整体是全长、原量还是剩余量？',
          '份数是否加总？',
          '后续计算是否又改变了比较基准？',
        ],
      },
    },
    {
      code: '110308',
      title: '百分比与百分比变化',
      summary: ratioApplicationsMethods['110308'].summary,
      paragraphs: [ratioApplicationsMethods['110308'].intro],
      memory: ratioApplicationsMethods['110308'].memory,
      rules: ratioApplicationsMethods['110308'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '“增加125%”只乘1.25。',
        '打折后加回同百分比当原价。',
        '最终剩余百分比当成下降百分比。',
      ],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '圈出每个百分数的基准，写成乘数链；反求原值就沿乘数链倒着除。',
        pastPaperSummary:
          '入库真题既考连续涨跌与逆百分比，也考两人分别涨薪后的新比值；几何和正比例情境还会把百分比变化接到平方、立方。',
        pastPaperPatterns: [
          {
            form: '连续变化与反求原值',
            description: '逐步相乘，反求起点要除以乘积；减去相同百分数不是逆操作。',
            reference: '2018 ENGAA、2020–2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_ENGAA_Q17',
              'ESAT-2020-MATHS1-014',
              'ESAT_LEGACY_2021_NSAA_Q007',
              'ESAT_LEGACY_2022_NSAA_Q005',
            ],
          },
          {
            form: '两份量采用不同基数',
            description: '利润基于成本、工资和跑速各自变化后重新作比。',
            reference: '2017、2021、2023 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q014', 'ESAT_LEGACY_2021_NSAA_Q018', 'NSAA_2023_S1-Q009'],
          },
          {
            form: '变化率进入平方、立方模型',
            description: '速度增20%时阻力乘1.2²，半径降25%时球体积乘0.75³。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q004', 'NSAA_2019_S1-Q007'],
          },
        ],
        examples: [
          {
            title: '把打折价加回25%，为什么还差15英镑？',
            source: {
              questionCode: 'ESAT-2020-MATHS1-014',
              why: '把错误操作也写成倍率，利用差额反推原价。',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'E · 原价为240英镑。',
            steps: [
              '设原价P，打折后的价格为0.75P。',
              '顾客错误地加25%，算得1.25×0.75P=0.9375P。',
              '差额 $P-0.9375P=0.0625P=P/16=15$，因此 $P=240$。',
              '核对：现价180，错误反推225，比正确原价少15。',
            ],
            takeaway: '把正确值、错误值和两者差额放到同一个原价基准上。',
          },
        ],
        checklist: ['是“增加”还是“变为”？', '分母是哪一次的原值？', '问剩余值还是变化量？'],
      },
    },
    {
      code: '110309',
      title: '正比例与反比例',
      summary: ratioApplicationsMethods['110309'].summary,
      paragraphs: [ratioApplicationsMethods['110309'].intro],
      memory: ratioApplicationsMethods['110309'].memory,
      rules: ratioApplicationsMethods['110309'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '“增加700%”误当7倍。',
        '与平方根成反比时写成平方的反比。',
        '比例常数没有用给定点核对。',
      ],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '把比例关系译成等式，用常数法求值或用倍率法判断变化。',
        pastPaperSummary:
          '年度题覆盖反平方根、反立方、平方正比、两种比例串联以及科学计数法；不只考最简单的y=kx。',
        pastPaperPatterns: [
          {
            form: '比例对象包含幂或根',
            description: '按文字选择指数；变量变化时，先算倍率的幂，再考虑是否取倒数。',
            reference: '2016 ENGAA、2018–2020、2022 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q013',
              'ESAT_LEGACY_2018_NSAA_Q05',
              'NSAA_2019_S1-Q004',
              'ESAT-2020-MATHS1-011',
              'ESAT_LEGACY_2022_NSAA_Q010',
            ],
          },
          {
            form: '多个关系经中间量连接',
            description: '先求中间变量或代入消去它，分别处理每条比例关系的常数。',
            reference: '2017 ENGAA、2023 NSAA',
            sourceCodes: ['ENGAA_2017_S1-Q009', 'NSAA_2023_S1-Q014'],
          },
          {
            form: '单位费用形成乘除关系',
            description: '不同变量处于分子还是分母，可由距离、耗油率与单价的含义判断。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q019'],
          },
        ],
        examples: [
          {
            title: 'y 变为四倍，x 和 z 各怎样变化？',
            source: {
              questionCode: 'NSAA_2023_S1-Q014',
              why: '将反平方比例和正比例串联，避免对两个变量都乘4。',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'D · z=0.3。',
            steps: [
              '$y=k/x^2$，由 $y=20,x=3$ 得 $k=180$。',
              '当 $y=80$，$x^2=180/80=9/4$；x为正，故 $x=3/2$。',
              '$z=cx$，由 $z=1.2,x=6$ 得 $c=0.2$；因此 $z=0.2\\times1.5=0.3$。',
              '倍率复核：y从20变80是4倍，x从3减半，z也随x减半。',
            ],
            takeaway: '先明确哪个量的什么幂与目标量成比例，再沿关系传递倍率。',
          },
        ],
        checklist: ['比例对象是否包含平方或根？', '变量是否限定为正？', '结果方向与图像是否一致？'],
      },
    },
    {
      code: '110310',
      title: '长度、面积、体积比',
      summary: ratioApplicationsMethods['110310'].summary,
      paragraphs: [ratioApplicationsMethods['110310'].intro],
      memory: ratioApplicationsMethods['110310'].memory,
      rules: ratioApplicationsMethods['110310'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '把面积比直接当体积比。',
        '球的半径变化率与体积变化率混淆。',
        '没有相似条件也使用k³。',
      ],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '先找到长度倍率k，再把题目所求的量归入一维、二维或三维。',
        pastPaperSummary:
          '年度题把相似与杯子、球、模型和成本结合，还会给表面积比和体积差反求原体积；选择正确指数是共同核心。',
        pastPaperPatterns: [
          {
            form: '长度比换体积比',
            description: '同形蛋糕、饮料杯、球和比例模型的体积需要立方倍率，模型题还接单位与密度。',
            reference: '2017、2019 NSAA；2018 ENGAA',
            sourceCodes: [
              'NSAA_2017_S1-Q014',
              'ESAT_LEGACY_2018_ENGAA_Q09',
              'ESAT_LEGACY_2018_ENGAA_Q13',
              'NSAA_2019_S1-Q007',
            ],
          },
          {
            form: '面积比与体积差连接',
            description: '先由面积比开平方，再立方得到体积倍率，用差量建方程。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q013'],
          },
          {
            form: '对应长度与对角线',
            description: '相似对象的斜边、对角线同样按线性倍率变化，可结合勾股反推未知量。',
            reference: '2016、2021 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q017', 'ESAT_LEGACY_2021_NSAA_Q017'],
          },
        ],
        examples: [
          {
            title: '杯子高了四分之一，饮料只多四分之一吗？',
            source: {
              questionCode: 'ESAT_LEGACY_2018_ENGAA_Q09',
              why: '杯与液面深度按同一比例变化，饮料的形状也相似。',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'E · 625 cm³。',
            steps: [
              '小杯与大杯的高度比为4:5，因此从小到大线性倍率为5/4。',
              '饮料深度也按4:5变化，体积倍率为 $(5/4)^3=125/64$。',
              '大杯饮料体积 $=320\\times125/64=625$ cm³。',
              '只乘5/4得400，只平方得500，都少考虑了空间方向。',
            ],
            takeaway: '相似与对应液面都确认后，三维量使用立方倍率。',
          },
        ],
        checklist: [
          '题目是否明确相似？',
          '已知的是长度、面积还是体积比？',
          '比例方向有没有保持一致？',
        ],
      },
    },
    {
      code: '110311',
      title: '增长、衰减与迭代',
      summary: ratioApplicationsMethods['110311'].summary,
      paragraphs: [ratioApplicationsMethods['110311'].intro],
      memory: ratioApplicationsMethods['110311'].memory,
      rules: ratioApplicationsMethods['110311'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
      ]),
      pitfalls: [
        '把减少60%写成保留60%。',
        '求价值下降多少时只报剩余价值。',
        '迭代编号从0开始，却漏算一次更新。',
      ],
      sourceIds: ['uat-spec', 'uat-preparation'],
      visual: 'maths-ratio',
      examFocus: {
        goal: '确定每一期保留或增长的倍率；递推题把“下一步”写成当前量的函数。',
        pastPaperSummary:
          '年度题出现设备折旧、气球泄漏及连续不同百分比变化。一般带固定增量的迭代在当前年度数学1题中未见直接题，本节另用已发布题库题训练。',
        pastPaperPatterns: [
          {
            form: '固定倍率反复作用',
            description: '折旧与泄漏都用保留倍率的幂；核对所求是余量还是总损失。',
            reference: '2016 ENGAA、2020 NSAA',
            sourceCodes: ['ENGAA_2016_S1-Q009', 'ESAT-2020-MATHS1-006'],
          },
          {
            form: '各阶段倍率不同',
            description: '连续涨跌可以连乘，若给末值则反向除；相同涨跌百分数不会抵消。',
            reference: '2018 ENGAA、2021、2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_ENGAA_Q17',
              'ESAT_LEGACY_2021_NSAA_Q007',
              'ESAT_LEGACY_2022_NSAA_Q005',
            ],
          },
        ],
        examples: [
          {
            title: '每周漏掉60%，三周后剩多少？',
            source: {
              questionCode: 'ESAT-2020-MATHS1-006',
              why: '检查损失倍率与保留倍率，以及连续变化的基数。',
              subject: 'mathematics1',
              kind: 'annual',
            },
            question: '',
            answer: 'C · 320 cm³。',
            steps: [
              '每周损失60%，因此每周保留40%=0.4。',
              '三周依次为5000→2000→800→320。',
              '也可直接计算 $5000(0.4)^3=320$ cm³。',
              '0.6³计算的是错误的保留比例；3×60%不是三周总损失率。',
            ],
            takeaway: '每期只对当前数量作用，求余量乘保留倍率。',
          },
          {
            title: '递推趋近一个数，怎样判断还差几步？',
            source: {
              questionCode: 'ESAT-TMUA-N40R3-M1-20260913-006',
              why: '从平衡点改写误差递推，并正确处理严格小于。',
              subject: 'mathematics1',
              kind: 'bank',
            },
            question: '',
            answer: 'A · 最少7次。',
            steps: [
              '平衡点满足 $L=54+L/4$，所以 $L=72$。',
              '与平衡点的差满足 $x_{n+1}-72=(x_n-72)/4$；初始差为 $8-72=-64$。',
              '故 $|x_n-L|=64/4^n$。要求 $64/4^n<1/64$，即 $4^n>4096=4^6$。',
              'n=6只是等于阈值，最小合适整数是7。',
            ],
            takeaway: '先看与稳定值的距离如何缩小，再核对边界是否允许相等。',
          },
        ],
        checklist: ['每期保留倍率是多少？', '期数与起始编号一致吗？', '问剩余、损失还是最小次数？'],
      },
    },
  ],
  sources: [
    {
      id: 'uat-spec',
      title: 'UAT-UK ESAT Content Specification（2026/2027）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '对应 Mathematics 1 M3.1–M3.11，覆盖比例尺、百分比、函数关系、相似与迭代。',
    },
    {
      id: 'uat-preparation',
      title: 'UAT-UK 官方备考资料与历年试卷目录',
      url: 'https://esat-tmua.ac.uk/esat-preparation-materials/',
      note: '考法归纳以项目当前入库的2016–2023年度数学1真题为证据；题库训练题单独标识。',
    },
  ],
}
