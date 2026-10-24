// 数学 1 比与比例讲义：以基准、份额与倍率串联11个考纲节点，例题与自测均使用真实题源。
import type { KnowledgeLesson } from './types'

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
      summary: '先对齐新旧对象，再对齐单位；比例尺的分母不是放缩倍率。',
      paragraphs: [
        '比例因子把同一类长度联系起来。由原图到新图的倍率是“新长度 ÷ 原长度”；图放大后，所有对应长度一起变化，角度保持不变。比较对应长度前要统一单位。',
        '比例尺 1:N 表示图上 1 个长度单位对应实际 N 个相同单位。地图上 4 cm、比例尺 1:25000，对应实地 100000 cm，也就是 1 km。地图复印放大时，地面的真实距离没有变化，因此比例尺分母反而变小。',
        '遇到连续放大和缩小，先把各次变化写成乘数相乘。面积与体积还要另外平方或立方，不能把线性倍率直接用到所有量。',
      ],
      rules: [
        {
          title: '从新到旧要取倒数',
          text: '$k=L_{\\rm new}/L_{\\rm old}$，反向倍率为 $1/k$。缩小到原来的 $3/4$ 与缩小了 $3/4$ 含义不同。',
        },
        {
          title: '地图复印后的比例尺',
          text: '原比例尺为 $1:N$，图上长度变为 $k$ 倍后，新比例尺为 $1:(N/k)$；实际距离保持不变。',
        },
        {
          title: '识别尺度层级',
          text: '相似图形的长度、面积、体积倍率分别为 $k,k^2,k^3$。已知面积倍率时，先开平方才得到长度倍率。',
        },
      ],
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
      summary: '“占谁的”决定分母；分数大于 1 并不代表错误。',
      paragraphs: [
        '把 A 表示为 B 的几分之几，就是 A÷B。B 是参照量而不是自动取总量。若 A 比 B 大，得到假分数完全合理；例如 A:B=5:3，则 A 是 B 的5/3，而 A 占两者总量的5/8。',
        '比较有单位的量先统一单位。若题目写“第一数的80%等于第二数的三分之二”，先给两个未知量不同字母，写等式后再求第一数除以第二数，不直接拿80与2/3作比。',
        '参照量随情境变化。两人薪资分别上涨后，应比较两份新薪资；用旧工资作为分母，会把“变化率”和“新占比”混在一起。',
      ],
      rules: [
        {
          title: '部分对部分与部分对整体',
          text: '$A:B=a:b$ 时，$A/B=a/b$；$A/(A+B)=a/(a+b)$。反过来，若 $A/T=f$，则 $A:(T-A)=f:(1-f)$。',
        },
        {
          title: '从等量条件倒推比',
          text: '若 $uA=vB$ 且参照量非零，则 $A/B=v/u$，系数与对应数量的比要反向。',
        },
        {
          title: '检查分数大小',
          text: '被比较量小于、等于、大于参照量时，所得分数应分别小于、等于、大于1。',
        },
      ],
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
      summary: '比中的每一项代表份数；连接两个比，先统一公共量。',
      paragraphs: [
        'A:B=3:2 表示可以把 A、B 写成3t、2t。同一个比的各项必须同时乘除相同非零数；交换顺序就要把两项一起交换。比不自带实际总量，要等题目给总量、差值或某一项才可确定t。',
        '有分数或小数的比，先乘以公分母或适当的10的幂，再约去公因数。例如1/2:3/4可以化为2:3；不能分别把两项化成“1”。',
        '连接 Q:R 与 R:S 时，R 在两条关系中必须代表同一个数量。先把R的份数调成相同，再读取三项比。不要把Q:R的第一个数直接和R:S的最后一个数拼起来。',
      ],
      rules: [
        {
          title: '把比写成代数模型',
          text: '$A:B:C=a:b:c$ 可写为 $A=at,B=bt,C=ct$。同一组数量只用同一个 $t$。',
        },
        {
          title: '公共量对齐',
          text: '$A:B=a:b,\\ B:C=c:d$，可得到 $A:B:C=ac:bc:bd$，然后统一约分。',
        },
        {
          title: '化简保留顺序',
          text: '先标清各项名称，再去掉共同因子；数量差与比值不能互相替换。',
        },
      ],
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
      summary: '先认总份数、差份数，或已知某项对应的份数。',
      paragraphs: [
        '把总量按3:5分配时，总量对应8份；先用总量除以8求一份，再乘3或5。若已知的是两者相差20，则20对应2份，不能仍然除以8。',
        '多组比要先合并为共同尺度的三项比，再计算总份数。嵌套分配则相反：先求第一层份额，第二层只对这份额分配，不能两次都用原总量。',
        '如果分配后每人花掉同样金额，原来的比通常会变化；但两人的金额差保持不变。用原金额减同一个未知数，再根据新比列方程。',
      ],
      rules: [
        {
          title: '总量分配',
          text: '总量 $T$ 按 $a:b:c$ 分配，三份分别为 $\\frac{aT}{a+b+c},\\frac{bT}{a+b+c},\\frac{cT}{a+b+c}$。',
        },
        {
          title: '差值分配',
          text: '若 $A:B=a:b$，$a>b$，且 $A-B=D$，则一份为 $D/(a-b)$。',
        },
        {
          title: '分配后反求比',
          text: '先把各自实际数量写出，再同时约分。比的份数不一定等于最终分配金额。',
        },
      ],
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
      summary: '先把情境还原为总量、组成量、时间或速率，再决定比谁。',
      paragraphs: [
        '配方、涂料、合金与溶液都可以用“组成量 = 总量 × 占比”计算。混合时把真正的组成量相加，最后除以新的总量；不同大小的两桶不能直接平均百分浓度。',
        '若从充分混合的溶液取走一部分，各成分按当前比例一起减少；只加入纯水时，溶质的量保持不变。写明哪个量没变，比死记混合公式更稳。',
        '运动中“同一时间”意味着路程比等于速度比；“同一路程”意味着用时与速度成反比。全程平均速度必须用总路程除以总用时，不是各段速度随意平均。',
        '单位换算与商品比较也用同样逻辑：统一单位后才比较单价、用量、浓度或效率。题目若含起步费、分段价格等固定项，不能将总价直接当作与数量正比。',
      ],
      rules: [
        {
          title: '混合先守恒',
          text: '若组成量可加，混合占比 $c=\\frac{m_1c_1+m_2c_2}{m_1+m_2}$。质量分数用质量作权重，体积分数用题目允许相加的体积作权重，二者不能混用。',
        },
        {
          title: '路程和时间分别加总',
          text: '$v_{\\rm avg}=(d_1+d_2)/(t_1+t_2)$；等路程两段的平均速度为 $2v_1v_2/(v_1+v_2)$。',
        },
        {
          title: '同一时刻比较距离',
          text: '若用时相同，则 $d_A/d_B=v_A/v_B$；先确定某人到终点的时刻，再求另一人的路程。',
        },
      ],
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
      summary: '从固定的比值认出正比例；直线不一定经过原点。',
      paragraphs: [
        '当y与x的比值始终是同一个常数k，就有y=kx。表格中每行y/x相等、图像是一条经过原点的直线、文字说“每单位固定多少”，是同一关系的不同表达。',
        '关系y=kx+c若c不为零，仍是线性函数，却不是y与x成正比例。例如出租车有起步费，里程翻倍时总价并不翻倍。看到“直线”还要检查截距。',
        '如果文字说与x²成正比，则保持固定的是y/x²，而不是y/x。多个比例关系连接时，要分别求常数，再将中间量代入；不同关系不能默认使用同一个常数。',
      ],
      rules: [
        {
          title: '比与函数互译',
          text: '$y:x=k:1 \\Longleftrightarrow y/x=k \\Longleftrightarrow y=kx$（$x\\ne0$）。在模型允许时延伸到原点。',
        },
        {
          title: '用两个数据点检查',
          text: '计算每行对应的比值；只看两个量一起增加，无法确认正比例。',
        },
        {
          title: '连接不同的比例关系',
          text: '若 $P=aQ^2$ 且 $Q=b/R$，则 $P=ab^2/R^2$。代入时连同常数一起平方。',
        },
      ],
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
      summary: '部分比、整体分数、剩余份额，要在同一张图中认清。',
      paragraphs: [
        '若一条线段被分成1:3，短段占全长的1/4，长段占3/4；这里的3不是全长份数。先把所有部分的份数加起来，再把指定部分写成整体分数。',
        '连续取一部分时，后一步通常以“剩余量”为整体。例如先花35%，再花剩下的1/3，最后留下原量的65%×2/3，而不是直接用1−35%−1/3。',
        '人数比例与收入比例也不相同。不同票价时，应先用各自人数乘各自票价，再用指定收入除以总收入；分母必须回到题目真正要比较的整体。',
      ],
      rules: [
        {
          title: '部分比转整体分数',
          text: '$A:B=a:b$ 则 $A/(A+B)=a/(a+b)$；已知 $A/T=f$ 时，另一部分是 $1-f$。',
        },
        {
          title: '多阶段剩余量',
          text: '先去掉比例 $p$，再去掉余量的比例 $q$，剩余量为原量的 $(1-p)(1-q)$。',
        },
        {
          title: '几何中的长度份额',
          text: '线段按比划分后，先求每段长度；这些长度进入勾股或面积公式时，仍要按公式平方或相乘。',
        },
      ],
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
      summary: '百分比先写成倍率；比较与变化都要先确定基准。',
      paragraphs: [
        '百分数表示每100份中的份数。150%等于1.5倍，而增加150%意味着变成2.5倍。“是原来的百分之几”与“增加百分之几”相差整整一个原量。',
        '百分比变化是变化量除以原量。原价降25%后剩75%，要找回原价应除以0.75；乘1.25只能把现价增加25%，不会自动回到原价。',
        '连续变化时，各次倍率相乘。下降10%再上升10%得到0.9×1.1=0.99，整体下降1%。同两个倍率顺序交换不改变最终乘积，但不能将增长率直接相加。',
        '单利每期按最初本金计息，利息是本金×利率×期数。复利则每期以当期余额为基准，在增长衰减一节继续处理。比较两个人或两个商品时，也要说清变化率以哪一个原值作分母。',
      ],
      rules: [
        {
          title: '变化率与倍率',
          text: '变化率 $r=(\\text{新值}-\\text{原值})/\\text{原值}$；新值 $=\\text{原值}(1+r)$。百分数显示时再乘100%。',
        },
        {
          title: '逆百分比',
          text: '原值 = 结果 ÷ 连续倍率的乘积。上涨与下降同一百分数通常不能互相抵消。',
        },
        {
          title: '单利与百分比比较',
          text: '单利总额 $A=P(1+nr)$，$r$ 为每期小数利率。A比B大多少百分比，应算 $(A-B)/B$。',
        },
      ],
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
      summary: '先写带常数的式子，再代数据；倍率法能减少计算。',
      paragraphs: [
        'y与x成正比例意味着y=kx；y与x成反比例意味着y=k/x，等价于xy=k。不是任何一起增长都叫正比例，也不是任何一个增长另一个下降都叫反比例。',
        '平方、立方、平方根也可以是比例关系中的整体。与x²成反比写成y=k/x²；x翻倍则y变为1/4。把语言中“与谁成比例”的对象完整圈出来。',
        '通常先代一组已知值求k，再求未知量；若只问倍数变化，可以让常数直接约去。开平方反推正变量时只保留正根，不能忘记题目限定。',
        '图像也可验证模型：y=kx过原点；在正量且k>0时，y=k/x在第一象限下降并逐渐贴近坐标轴，但不会到达轴。反比例图不是直线。',
      ],
      rules: [
        {
          title: '统一为幂模型',
          text: '$y=kx^a$，$a=1,-1,2,-2,\\frac12,-\\frac12$ 分别对应不同直接或倒数关系。应遵守变量的定义域。',
        },
        {
          title: '用倍率省去常数',
          text: '$\\frac{y_2}{y_1}=(x_2/x_1)^a$。若 $y=kx^2/z$，则x乘2、z乘3，y乘 $4/3$。',
        },
        {
          title: '反求变量先处理指数',
          text: '$y=k/x^2$ 且 $x>0$ 时，$x=\\sqrt{k/y}$；不能只取 $k/y$。',
        },
      ],
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
      summary: '相似才有统一的 k、k²、k³；不同形状不能直接套用。',
      paragraphs: [
        '相似图形的所有对应长度有相同倍率k。面积由两个方向的长度相乘，所以面积倍率为k²；体积由三个方向相乘，所以体积倍率为k³。',
        '如果只告诉两个图形面积之比，却没有相似条件，不能推出边长比。圆、球等同类形状天然相似，长方体则需要各对应边同倍放缩。',
        '已知面积比先开平方，已知体积比先开立方，再转成另一种比。比例也保持对应顺序，例如小:大与大:小不能中途颠倒。',
        '相似还解释三角比为什么只由角度决定：相似直角三角形的对边、邻边、斜边都乘k，任何两边的比值中k约掉。周长和对角线同属长度，也只乘k。',
      ],
      rules: [
        {
          title: '三种倍率的转换',
          text: '$L_2/L_1=k,\\ A_2/A_1=k^2,\\ V_2/V_1=k^3$；由面积到体积用 $(A_2/A_1)^{3/2}$。',
        },
        {
          title: '增减的是线性尺寸',
          text: '半径减25%意味着k=0.75；体积剩0.75³，不是体积减25%。',
        },
        {
          title: '给差值时引入原量',
          text: '若 $V_2=k^3V_1$ 且体积差为D，则 $(k^3-1)V_1=D$。',
        },
      ],
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
      summary: '固定比例重复乘，固定金额重复加；每一步都从上一步出发。',
      paragraphs: [
        '固定百分比增长或衰减时，每一期都对当期数量作用。每周减少60%，下一周剩40%，连续三周就是乘0.4三次。百分数的“损失”与“保留”必须分清。',
        '复利把上一期利息也作为下一期本金，所以余额按固定倍率增长；单利的每期利息按原本金固定计算。面对真实情境还要核对计息期、利率周期与期数一致。',
        '一般迭代未必只有乘法。例如每期先保留一部分再加固定金额，可写成下一项等于当前项的某个倍数再加常数。按指定顺序更新，不要把每一步都作用于最初值。',
        '有的迭代会靠近一个稳定值L。先解L=aL+b找到可能的平衡点，再看与L的误差是否每次缩小。仅有平衡方程不能保证收敛；例如倍率绝对值大于1时误差可能越变越大。',
      ],
      rules: [
        {
          title: '增长、折旧与复利',
          text: '$A_n=A_0(1+r)^n$；固定衰减率d使用 $(1-d)^n$。总减少量为 $A_0-A_n$。',
        },
        {
          title: '一般迭代',
          text: '$x_{n+1}=ax_n+b$，起点为 $x_0$ 时，算到 $x_n$ 恰好进行了n次更新。先乘后加与先加后乘不同。',
        },
        {
          title: '稳定值与误差',
          text: '当 $a\\ne1$，平衡点为 $L=b/(1-a)$；$x_n-L=a^n(x_0-L)$。若 $|a|<1$，误差趋近0。',
        },
        {
          title: '最小次数',
          text: '“小于”不能在边界相等时停下。用连续倍率比较临界两期，可避免把次数少算1。',
        },
      ],
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
