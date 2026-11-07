// 数学1统计讲义：覆盖官方M6全部细项，按全量年度题归纳考法并公开直方图、散点图题源边界。
import type { KnowledgeLesson } from './types'
import { statisticsMethods } from './statisticsMethods'

export const esatStatistics: KnowledgeLesson = {
  code: '110600',
  title: 'Statistics · 统计',
  subtitle: '先看数据怎样记录，再决定结论能走多远',
  intro:
    '用表格理清分类，用面积读懂直方图，用中心和分散程度比较数据，最后分清相关与因果。讲解中的图形是可切换的概念示意；例题和自测读取现有题源，不另编试题。',
  memory: [
    '表格看行列合计；条形图看柱高；不等组距直方图看面积。',
    '平均数先还原总量，中位数先排序，比较两组同时看中心与分散。',
    '累计频率的“差”是该组人数；散点图的趋势不等于因果。',
  ],
  sections: [
    {
      code: '110601',
      title: '表格、图表与图示',
      summary: statisticsMethods['110601'].summary,
      paragraphs: [statisticsMethods['110601'].intro],
      memory: statisticsMethods['110601'].memory,
      rules: statisticsMethods['110601'].blocks.flatMap(block =>
        block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text }))),
      pitfalls: [
        '“在男生中选”把总数改为男生人数；不是始终除以全班人数。',
        '图形长得高不等于数量必然大：先看坐标起点、刻度、单位以及各图的样本量。',
        '类别柱状图不随意连线；散点图也不按数据列出的顺序逐点连接。',
      ],
      visual: 'maths-statistics',
      sourceIds: ['uat-spec', 'openstax-graphs'],
      examFocus: {
        goal: '把文字条件转成可以核对行列合计的表，再选择正确的读取方式。',
        pastPaperSummary:
          '全量审阅本地151道数学1年度题后，本点的直接证据集中在分类人数与双向表：有的题面不画表，需要自己组织条件。尚未找到直接考统计扇形图、象形图或时间序列图的年度题，不能据此断言这些形式不会考。',
        pastPaperPatterns: [
          {
            form: '先补双向表，再确定条件分母',
            description: '活动总人数、性别总人数与某类比例互相补齐；最后按被限定的人群取分母。',
            reference: '2016 ENGAA',
            sourceCodes: ['ENGAA_2016_S1-Q023'],
          },
          {
            form: '分类总数中恢复未知一格',
            description:
              '驾考通过/未通过结合男女总数做补数；外语学习人数则把相同的行列关系改写为代数表达式。',
            reference: '2017 ENGAA、2018 ENGAA',
            sourceCodes: ['ENGAA_2017_S1-Q015', 'ESAT_LEGACY_2018_ENGAA_Q01'],
          },
        ],
        examples: [
          {
            title: '活动与性别：把零散条件补成一张表',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ENGAA_2016_S1-Q023',
              why: '文字中的人数、比例和合计分别放入双向表；最后才处理条件概率。',
            },
            question: '',
            answer: 'D · $16/37$',
            steps: [
              '总人数120，女生46，所以男生 $120-46=74$。网球共36人，其中 $2/3$ 为男生，得男生24、女生12。',
              '女生游泳25，因此女生射箭 $46-25-12=9$。射箭共27人，男生射箭 $27-9=18$。',
              '男生游泳 $74-24-18=32$。游泳总人数57；三种活动合计 $57+27+36=120$，行列核对一致。',
              '已知选到男生，分母是74。因此所求概率为 $32/74=16/37$，选D；$32/120$ 是“随机选全体学生，恰好男生且游泳”的另一件事。',
            ],
            takeaway: '==先补表，再看“在谁之中”；条件改变，分母就可能改变。==',
          },
        ],
        checklist: [
          '能按数据类型选择条形图、扇形图、象形图、竖线图或时间序列图。',
          '能从图例、角度与合计恢复人数。',
          '能解释双向表的一格、行合计和列合计各表示什么。',
        ],
      },
    },
    {
      code: '110602',
      title: '分组数据图与直方图',
      summary: statisticsMethods['110602'].summary,
      paragraphs: [statisticsMethods['110602'].intro],
      memory: statisticsMethods['110602'].memory,
      rules: statisticsMethods['110602'].blocks.flatMap(block =>
        block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text }))),
      pitfalls: [
        '连续组界不能重复计算端点；分组整数的组距需要结合记录精度与组界。',
        '纵轴标“密度”就不能直接把高度当人数，必须乘组距。',
        '累计曲线的斜率越大表示该区间更密集；曲线最高的位置不是频数最大的组。',
        '分组图无法恢复每个原始观察值，插值所得中位数与四分位数只能估计。',
      ],
      visual: 'maths-statistics',
      sourceIds: ['uat-spec', 'openstax-graphs', 'openstax-location'],
      examFocus: {
        goal: '在频数、密度与累计数之间转换，分清图形的高度、面积和增量。',
        pastPaperSummary:
          '已审阅的151道数学1年度题中，未发现直接考分组直方图或累计频率图的题。以下例题来自独立题库收录的2026回忆题，只作为练习，不作为年度真题考法证据。',
        pastPaperPatterns: [],
        pastPaperNote:
          '这一部分仍按官方M6.2完整学习等组距、不等组距直方图与累计频率图。当前题源不足以归纳该点历年出现的题型分布。',
        selfCheckNote:
          '关联练习：下面是离散频数表题，训练累计位置与四分位数，不直接考连续分组直方图。本题按上下半组各自的中位数求四分位数；其他题目若指定不同约定，应以题意为准。',
        examples: [
          {
            title: '题库回忆题：累计曲线为何对应递减的柱高？',
            source: {
              kind: 'bank',
              subject: 'mathematics1',
              questionCode: 'ESAT-2026-CN-RECALL-M1-Q27',
              why: '独立题库的回忆题，非年度真题。对等宽区间比较累计增量，再对应直方图。',
            },
            question: '',
            answer: 'A',
            steps: [
              '先辨认图形：纵轴给的是累计频率，曲线从陡到缓；题目给出的候选直方图各组等宽。',
              '在横轴取等宽相邻区间，逐段看曲线上升的高度。开始一段增加最多，后面的增加量依次减小；这才是各组的频数。',
              '因为组距相同，频数密度与频数同比例减小，所以柱高应从左向右递减。逐项核对：A递减，B先降后升，C递增，D中间最高，只有A符合。',
              '曲线没有给出可读的数值刻度，不能声称每组的具体人数；本题判断的是分布形状。',
            ],
            takeaway: '==累计高度是“到这里共有多少”；相邻高度差才是“这一组有多少”。==',
          },
        ],
        checklist: [
          '能由柱宽与密度算频数，也能从频数反求柱高。',
          '能由累计数作差求每组人数。',
          '能读出近似中位数、四分位数，并解释组内插值的假设。',
        ],
      },
    },
    {
      code: '110603',
      title: '统计量与比较',
      summary: statisticsMethods['110603'].summary,
      paragraphs: [statisticsMethods['110603'].intro],
      memory: statisticsMethods['110603'].memory,
      rules: statisticsMethods['110603'].blocks.flatMap(block =>
        block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text }))),
      pitfalls: [
        '先排序再找中位数；均值、中位数和众数可能相同，也可能不同。',
        '平均数的平均通常不是总体均值；加权所用的是各组人数。',
        '两组均值和极差不能唯一还原两组端点，所以合并极差常只能确定界限。',
        '原始数据与分组数据采用的四分位位置或插值约定可能不同，不能在同一道题中切换。',
      ],
      visual: 'maths-statistics',
      sourceIds: ['uat-spec', 'openstax-location', 'openstax-centre', 'openstax-box'],
      examFocus: {
        goal: '由总量与排序建立关系，并用中心和分散程度支持比较结论。',
        pastPaperSummary:
          '相关年度题覆盖2016、2018、2019、2020、2022与2023：合并/拆分均值、排序数据的均值与中位数联立，以及“新增数据后什么一定成立”。它们共同强调统计定义，而不是只认公式名称。',
        pastPaperPatterns: [
          {
            form: '人数与平均值还原总量',
            description:
              '新增成员或拆分两部分时写总量守恒；未知人数可用均值建立代数方程。2018题整理出的分式要求分母不为零，若两个给定均值均为10则不能唯一确定人数。',
            reference: '2016 ENGAA、2018 NSAA、2020 NSAA',
            sourceCodes: [
              'ENGAA_2016_S1-Q007',
              'ESAT_LEGACY_2018_NSAA_Q07',
              'ESAT-2020-MATHS1-012',
            ],
          },
          {
            form: '均值、中位数、众数与有序位置联动',
            description:
              '先用总和写均值方程，再取中间两数写中位数方程；求出未知数后检查排序，并辨认重复最多的值。',
            reference: '2022 NSAA、2023 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q008', 'NSAA_2023_S1-Q004'],
          },
          {
            form: '变化的必然结论与可知边界',
            description:
              '加入超过旧均值的数保证均值上升，但不保证中位数或极差按同一方式变化；合并两组后极差至少覆盖任一原组，但不一定能求精确值。',
            reference: '2019 NSAA、2020 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q017', 'ESAT-2020-MATHS1-012'],
          },
        ],
        pastPaperNote:
          '当前相关年度题主要考原始数据统计；分组估计、箱线图和四分位距仍按官方M6.3讲解，不能把它们描述成这批年度题已经出现的直接形式。',
        examples: [
          {
            title: '新增两个人：平均数变化先换成总年龄',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ENGAA_2016_S1-Q007',
              why: '平均值只有乘回人数，才能把新增部分从总量中分离。',
            },
            question: '',
            answer: 'E · 50 years',
            steps: [
              '原20人的总年龄为 $20\\times28=560$。',
              '新增后22人的总年龄为 $22\\times30=660$。',
              '新增两人的总年龄为 $660-560=100$，所以他们的平均年龄是 $100/2=50$，选E。',
              '变化的2岁是22人与原20人平均值之差，并不是新增者的平均年龄。',
            ],
            takeaway: '==先乘人数得到总量，做完加减后再除相应人数。==',
          },
          {
            title: '均值比中位数大1：先找中间两项',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q008',
              why: '均值由全部数据求和，中位数由有序的中间两项确定；两者关系再转成方程。',
            },
            question: '',
            answer: 'B · $11/3$',
            steps: [
              '六个数按序为 $1,2,x,x+1,x+1,15$，总和为 $3x+20$，所以均值为 $(3x+20)/6$。',
              '中间是第3项x与第4项x+1，中位数为 $[x+(x+1)]/2=x+1/2$。',
              '均值比中位数大1，因此 $(3x+20)/6=x+3/2$，整理得 $3x+20=6x+9$，所以 $x=11/3$，选B。',
              '检查排序：$2\\le11/3$，且 $11/3+1=14/3\\le15$。中位数为25/6、均值为31/6，确实相差1。',
            ],
            takeaway: '==均值看总和，中位数看排序位置；解完未知数还要检查顺序。==',
          },
        ],
        checklist: [
          '能选择合适的中心与分散统计量并解释理由。',
          '能求加权均值、原始中位数与IQR，并声明四分位约定。',
          '能从频数图、累计图、箱线图获取统计量，区分精确值与分组估计。',
        ],
      },
    },
    {
      code: '110604',
      title: '散点图与相关性',
      summary: statisticsMethods['110604'].summary,
      paragraphs: [statisticsMethods['110604'].intro],
      memory: statisticsMethods['110604'].memory,
      rules: statisticsMethods['110604'].blocks.flatMap(block =>
        block.points ?? (block.paragraphs ?? []).map(text => ({ title: block.title, text }))),
      pitfalls: [
        '不要把正相关等同于强相关；方向和强弱是两个维度。',
        '没有线性相关不代表没有非线性关系；曲线数据不应强行套直线。',
        '拟合线是整体估计，不是逐点折线，也不要求经过原点。',
        '外推结果可能超出现实取值范围，例如百分比大于100%；这是模型适用范围的警报。',
      ],
      visual: 'maths-statistics',
      sourceIds: ['uat-spec', 'openstax-scatter', 'openstax-prediction'],
      examFocus: {
        goal: '正确描述成对数据的趋势，并给预测和因果判断划定证据边界。',
        pastPaperSummary:
          '完整审阅151道数学1年度题，并检查现有已发布独立题库后，当前没有找到直接考散点图、相关性、拟合线或内外插的合适题源。因此不虚构“历年怎么考”的题目分布；概念图解覆盖官方要求。',
        pastPaperPatterns: [],
        pastPaperNote:
          '下列例题不直接考散点图或相关性，用于练习证据与推断边界：只有“被条件保证”的结论才能选为必然。它不能替代散点图专项训练，当前这一直接题源缺口仍保留。',
        selfCheckNote:
          '关联练习：下面的合并统计量题不直接考散点图或相关性，用于练习证据与推断边界。请区分数据足以确定的数值与只能确定的范围；散点图、拟合线和内外插请结合上方图解复习。',
        examples: [
          {
            title: '关联迁移：什么一定能推出？（非散点图题）',
            source: {
              kind: 'annual',
              subject: 'mathematics1',
              questionCode: 'NSAA_2019_S1-Q017',
              why: '不直接考散点图或相关性，用于练习证据与推断边界：用证明支持必然，用反例排除过强断言。',
            },
            question: '',
            answer: 'C · only statement 2',
            steps: [
              '原五个数均值为x，总和为5x；新加入a且 $a>x$。新均值为 $(5x+a)/6$，比x大 $(a-x)/6>0$，所以第2条一定成立。',
              '第1条说新的中位数不可能等于原来任一数，这过强。作为反例，原数据取 $1,2,3,3,5$，均值2.8；加入3满足条件，新的中位数仍是原数据中的3。',
              '同一反例中，加入3没有改变最小值1与最大值5，极差仍为4。因此“极差一定增加”的第3条也不成立。',
              '只有第2条被所有满足条件的数据保证，选C。这里没有散点图，也没有检验因果关系；迁移的是“不把可能说成必然”的推理方式。',
            ],
            takeaway: '==条件保证的才是必然；一个合法反例就能推翻“总是如此”。==',
          },
        ],
        checklist: [
          '能描述正负相关与强弱，并识别非线性关系。',
          '能估计拟合线，区分内插和外推，解释预测不确定性。',
          '能说明相关不等于因果，也知道当前关联题不是散点图专项题。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-spec',
      title: 'UAT-UK · ESAT Content Specification（2026/27）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对M6.1—M6.4的表图、分组统计、比较与散点图范围；中文讲解与交互示意为教学整理。',
    },
    {
      id: 'openstax-graphs',
      title: 'OpenStax · Histograms, Frequency Polygons, and Time Series Graphs',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/2-2-histograms-frequency-polygons-and-time-series-graphs',
      note: '参考图形类型与累计频率含义；图解使用本章自定的概念示意数据。',
    },
    {
      id: 'openstax-location',
      title: 'OpenStax · Measures of the Location of the Data',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/2-3-measures-of-the-location-of-the-data',
      note: '核对四分位数与百分位的解释；具体计算明确声明采用的约定。',
    },
    {
      id: 'openstax-centre',
      title: 'OpenStax · Measures of the Center of the Data',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/2-5-measures-of-the-center-of-the-data',
      note: '参考均值、中位数与众数的适用区别。',
    },
    {
      id: 'openstax-box',
      title: 'OpenStax · Box Plots',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/2-4-box-plots',
      note: '核对箱体、中位数和须线的图例；本章图解明确使用最小值至最大值的须线。',
    },
    {
      id: 'openstax-scatter',
      title: 'OpenStax · Scatter Plots',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/12-2-scatter-plots',
      note: '参考相关的方向、强弱与曲线关系；不将图中关联作为因果证明。',
    },
    {
      id: 'openstax-prediction',
      title: 'OpenStax · Prediction',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/12-5-prediction',
      note: '核对拟合预测、内插与超出观测范围的外推限制。',
    },
  ],
}
