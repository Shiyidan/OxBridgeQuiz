// 数学2函数图像讲义：把图形特征、代数方程与导数联系起来，题目正文由统一题源组件读取。
import type { KnowledgeLesson } from './types'
import { math2GraphMethods } from './math2GraphMethods'

export const esatMath2Graphs: KnowledgeLesson = {
  code: '120800',
  title: 'Graphs of functions · 函数图像',
  subtitle: '先看形状，再找关键点，用图像检查代数答案',
  intro:
    '把前面学过的函数、方程和导数放到同一张图上：定义域决定能画哪里，变换决定关键点怎样移动，导数决定曲线如何升降，交点把图像与方程的解连起来。草图服务于判断，不要求精密作图。',
  memory: [
    '**先范围，后形状。**根式、对数、分式各有定义域；渐近线不能当作图像的一部分。',
    '**外改输出，内改输入。**水平伸缩看倒数，连续变换按顺序，复合函数从内向外算。',
    '**截距、顶点、驻点各有用途。**它们的纵坐标不一定相同，也不能用一个代替另一个。',
    '**不同交点只数一次。**重根可能对应相切；约去公共因子前先保留它等于0的情况。',
  ],
  sections: [
    {
      code: '120801',
      title: '常见函数图像',
      summary: math2GraphMethods['120801'].summary,
      paragraphs: [math2GraphMethods['120801'].intro],
      rules: math2GraphMethods['120801'].blocks.flatMap((block) => [
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
      memory: math2GraphMethods['120801'].memory,
      pitfalls: [
        '根式、对数忘记定义域。',
        '将正切的相邻分支连接，或让曲线碰到本不相交的渐近线。',
        '只比较角的大小，忽略函数和单调区间。',
      ],
      examFocus: {
        goal: '用图像特征代替不必要的数值计算，知道输入和输出的范围。',
        pastPaperSummary:
          '年度题常把基本图像性质用于比较大小、最值或几何高度，先定位单调区间再处理条件。',
        pastPaperPatterns: [
          {
            form: '三角图像比较大小',
            description: '分别比较正弦组和余弦组，再用余角关系比较两个候选最大值。',
            reference: '2021 年已收录年度题',
            sourceCodes: ['ESAT_LEGACY_2021_ENGAA_Q031'],
          },
          {
            form: '指数与有界内层函数',
            description: '平方配方或正弦范围决定指数的范围，底数决定大小方向。',
            reference: '2023 年已收录年度题',
            sourceCodes: ['NSAA_2023_S1-Q016', 'NSAA_2023_S1-Q019'],
          },
          {
            form: '根式图像形成几何高度',
            description: '用非负高度建立面积；这里是图像关联应用，最优化另属微分。',
            reference: '2021、2022 年已收录年度题',
            sourceCodes: ['ESAT_LEGACY_2021_ENGAA_Q039', 'ESAT_LEGACY_2022_ENGAA_Q023'],
          },
          {
            form: '周期图像辅助数解',
            description: '三角方程化简后，在指定区间找对应高度，处理周期、端点及公共解。',
            reference: '2017、2018、2020 年已收录年度题',
            sourceCodes: [
              'ESAT_LEGACY_2018_ENGAA_Q31',
              'ENGAA_2017_S1-Q031',
              'ENGAA_2017_S1-Q045',
              'ESAT-2020-MATHS2-008',
            ],
          },
        ],
        pastPaperNote:
          '三角方程与几何题属于关联应用。年度题未直接覆盖全部基本草图辨认，绝对值、对数等基础形状仍须掌握。',
        selfCheckNote: '独立题库自测用指数曲线与水平线的交点，检查单调图像与准确计算的联系。',
        examples: [
          {
            title: '不用计算器比较六个三角函数值',
            source: {
              questionCode: 'ESAT_LEGACY_2021_ENGAA_Q031',
              why: '不用计算器比较六个三角函数值',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'A · $\\cos0.5$',
            steps: [
              '三个角都在第一象限。余弦递减，故余弦组最大为 $\\cos0.5$；正弦递增，故正弦组最大为 $\\sin1$。',
              '$\\cos0.5=\\sin(\\pi/2-0.5)$，由 $\\pi>3$ 得 $\\pi/2-0.5>1$。',
              '这两个正弦的角仍在第一象限，所以 $\\cos0.5>\\sin1$，选A。',
              '比较时先统一函数，再使用单调方向，不能只说0.5比1小。',
            ],
            takeaway: '==先各组选最大，再比较两组候选。==',
          },
        ],
        checklist: ['能识别基本图像及其定义域。', '能用单调区间与值域比较大小。'],
      },
      visual: 'maths2-graphs',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120802',
      title: '图像变换与复合函数',
      summary: math2GraphMethods['120802'].summary,
      paragraphs: [math2GraphMethods['120802'].intro],
      rules: math2GraphMethods['120802'].blocks.flatMap((block) => [
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
      memory: math2GraphMethods['120802'].memory,
      pitfalls: [
        '把内部系数当成水平倍率。',
        '反射只变平方项而漏变常数。',
        '交换复合顺序或遗漏内层定义域。',
      ],
      examFocus: {
        goal: '用坐标映射核对变换，用内外顺序处理复合。',
        pastPaperSummary:
          '直接年度题考过平移后绕非零水平线反射、三角图像压缩后平移；还有坐标交换后的直线斜率。',
        pastPaperPatterns: [
          {
            form: '平移后绕指定水平线反射',
            description: '先改变顶点，再将所有高度替换为2c−y。',
            reference: '2016 年已收录年度题',
            sourceCodes: ['ENGAA_2016_S1-Q045'],
          },
          {
            form: '水平伸缩后平移三角图像',
            description: '内部系数与水平倍率互为倒数，第二步平移作用于整个x。',
            reference: '2017 年已收录年度题',
            sourceCodes: ['ENGAA_2017_S1-Q051'],
          },
          {
            form: '交换横纵坐标',
            description: '关于y=x反射使斜率变为倒数，是坐标反射的关联应用，不能使用垂线负倒数。',
            reference: '2020 年已收录年度题',
            sourceCodes: ['ESAT-2020-MATHS2-003'],
          },
        ],
        pastPaperNote:
          '年度题未直接用f(g(x))记号设问；本点复合计算例题来自独立题库，不作为年度考法证据。',
        examples: [
          {
            title: '先平移，再关于y = −1反射',
            source: {
              questionCode: 'ENGAA_2016_S1-Q045',
              why: '先平移，再关于y = −1反射',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'E · $y=-5-(x-4)^2$',
            steps: [
              '向右4、向上3后，$y=x^2$ 变成 $y=(x-4)^2+3$，顶点为 $(4,3)$。',
              '关于 $y=-1$ 反射时，高度变为 $-2-y$，新式为 $-2-[(x-4)^2+3]$。',
              '整理得 $y=-5-(x-4)^2$，选E。新顶点 $(4,-5)$ 与原顶点 $(4,3)$ 到反射轴距离都为4。',
              '开口向下、顶点横坐标仍为4，两个特征同时复核。',
            ],
            takeaway: '==每一步处理完整表达式，最后用顶点检查。==',
          },
          {
            title: '复合函数先算哪一个？',
            source: {
              questionCode: 'ESAT-M2-MOCK-ADAPT-R2-E02-016',
              why: '复合函数先算哪一个？',
              subject: 'mathematics2',
              kind: 'bank',
            },
            question: '',
            answer: 'B · 两根乘积 $-8$',
            steps: [
              '$f(g(x))=2(x^2+1)-3=2x^2-1$。先把内层整体放入外层。',
              '$2x^2-1=15$ 给出 $x^2=8$，根为 $\\pm2\\sqrt2$。',
              '两根乘积为 $-(2\\sqrt2)^2=-8$，选B；对称根的和才是0。',
              '复核应把两个根分别代回原方程，不能把乘积−8当成一个根代入。',
            ],
            takeaway: '==先内后外，最后读清所求是根的和还是积。==',
          },
        ],
        checklist: ['能用一点的映射检查正负参数与变换顺序。', '能正确计算复合函数并保留定义域。'],
      },
      visual: 'maths2-graphs',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120803',
      title: '一次函数参数影响',
      summary: math2GraphMethods['120803'].summary,
      paragraphs: [math2GraphMethods['120803'].intro],
      rules: math2GraphMethods['120803'].blocks.flatMap((block) => [
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
      memory: math2GraphMethods['120803'].memory,
      pitfalls: [
        '把纵截距当成横截距。',
        'm改变时仍把c当独立常量，违反固定过点条件。',
        '混淆反射倒数斜率与垂直负倒数斜率。',
      ],
      examFocus: {
        goal: '把参数、截距和几何约束转成同一条直线的方程。',
        pastPaperSummary:
          '年度题把斜率、截距与垂直、反射、轴上距离及面积连在一起；重点不是记住字母名称，而是看懂参数改变后图形中的量。',
        pastPaperPatterns: [
          {
            form: '斜率和轴截距共同决定长度或面积',
            description: '使用过点条件和垂线斜率求截距，轴上长度是坐标差，再套几何面积。',
            reference: '2016、2019、2020 年已收录年度题',
            sourceCodes: ['ENGAA_2016_S1-Q041', 'ESAT-2020-MATHS2-005', 'NSAA_2019_S1-Q073'],
          },
          {
            form: '参数藏在斜率里',
            description: '从x的系数读出斜率，再用垂直条件建立参数方程；常数项不会改变倾斜方向。',
            reference: '2017 年已收录年度题',
            sourceCodes: ['ENGAA_2017_S1-Q053'],
          },
          {
            form: '坐标反射改变斜率',
            description: '交换横纵坐标后，非零斜率m变为1/m；不是−1/m。',
            reference: '2020 年已收录年度题',
            sourceCodes: ['ESAT-2020-MATHS2-003'],
          },
          {
            form: '直线与圆、垂距相结合',
            description: '半径斜率给切线方向，或由两截距得到直线与垂距；属于坐标几何的关联使用。',
            reference: '2021、2022 年已收录年度题',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q004', 'ESAT_LEGACY_2022_ENGAA_Q037'],
          },
        ],
        selfCheckNote: '自测为直线关于y=x反射的关联题，检查能否区分斜率的“倒数”与“负倒数”。',
        examples: [
          {
            title: '两条垂线与y轴围成三角形',
            source: {
              questionCode: 'ESAT-2020-MATHS2-005',
              why: '两条垂线与y轴围成三角形',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'D · $m=2$',
            steps: [
              'L经过 $(2,4)$，因此纵截距为 $c=4-2m$。过同一点的垂线斜率是 $-1/m$，其纵截距为 $4+2/m$。',
              '因 $m>0$，两纵截距的距离为 $2m+2/m$。以y轴上的这一段为底，到 $(2,4)$ 的垂直高是2。',
              '面积为 $\\frac12(2m+2/m)\\times2=2(m+1/m)=5$，所以 $2m^2-5m+2=0$。',
              '$(2m-1)(m-2)=0$，得到 $m=1/2$ 或2。对应 $c=3$ 或0，都满足 $c\\ge0$，较大值为2，选D。',
            ],
            takeaway: '==先将截距写成参数，再把坐标差变成长度。==',
          },
        ],
        checklist: ['能说明固定m或固定c时直线怎样变化。', '能连接过点、垂直、截距和面积条件。'],
      },
      visual: 'maths2-graphs',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120804',
      title: '二次函数参数影响',
      summary: math2GraphMethods['120804'].summary,
      paragraphs: [math2GraphMethods['120804'].intro],
      rules: math2GraphMethods['120804'].blocks.flatMap((block) => [
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
      memory: math2GraphMethods['120804'].memory,
      pitfalls: [
        '把b直接当成顶点横坐标。',
        '把一般式常数项当成顶点高度。',
        '配方时常数修正漏乘前面的系数。',
      ],
      examFocus: {
        goal: '从形式读图、从关键点反推式子，并检查最值与截距。',
        pastPaperSummary:
          '年度题既直接要求识别顶点形式的系数，也把配方所得最值和根用于矩形、三角形、扇形或指数函数。',
        pastPaperPatterns: [
          {
            form: '配方后读取系数组合',
            description: '提取非1的二次系数，再比较一次项和常数项，最后计算题目真正要求的组合。',
            reference: '2023 年已收录年度题',
            sourceCodes: ['ENGAA_2023_S1-Q029'],
          },
          {
            form: '根和顶点共同构造几何量',
            description: '根的间距给宽，顶点到轴的距离给高；不能把y截距误作最低点。',
            reference: '2022 年已收录年度题',
            sourceCodes: ['ESAT_LEGACY_2022_ENGAA_Q035'],
          },
          {
            form: '二次最值进入复合或几何模型',
            description:
              '指数底数大于1时最小指数给最小输出；面积化为开口向下二次式时，顶点只在可行范围内才有效。',
            reference: '2017、2022、2023 年已收录年度题',
            sourceCodes: ['NSAA_2023_S1-Q016', 'ENGAA_2017_S1-Q041', 'ESAT_LEGACY_2022_ENGAA_Q033'],
          },
        ],
        pastPaperNote: '面积与指数题属于顶点最值的关联应用，不是直接改变a、b、c的图像选择题。',
        examples: [
          {
            title: '二次系数是根式，如何读出顶点形式？',
            source: {
              questionCode: 'ENGAA_2023_S1-Q029',
              why: '二次系数是根式，如何读出顶点形式？',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'F · $4\\sqrt2-6$',
            steps: [
              '展开 $p(x+q)^2+r=px^2+2pqx+pq^2+r$，与 $\\sqrt2x^2-6x+4$ 比较，先得 $p=\\sqrt2$。',
              '$2pq=-6$，因此 $q=-3/\\sqrt2$。常数项满足 $pq^2+r=4$，所以 $r=4-9\\sqrt2/2$。',
              '$r-q=4-3\\sqrt2$，最后还要乘 $p=\\sqrt2$，得到 $p(r-q)=4\\sqrt2-6$，选F。',
              '顶点横坐标为 $-q=3/\\sqrt2$，不是q；把顶点代回原函数，能再次验证r。',
            ],
            takeaway: '==先读a，再算水平位置与顶点高度，最后完成所求组合。==',
          },
        ],
        checklist: [
          '能准确读取顶点、对称轴、开口和y截距。',
          '能用配方或关键点得到参数，并连接实际几何量。',
        ],
      },
      visual: 'maths2-graphs',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120805',
      title: '用导数判断图像形状',
      summary: math2GraphMethods['120805'].summary,
      paragraphs: [math2GraphMethods['120805'].intro],
      rules: math2GraphMethods['120805'].blocks.flatMap((block) => [
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
      memory: math2GraphMethods['120805'].memory,
      pitfalls: [
        '把导函数的零点当成原函数零点。',
        '漏掉因式分解中的x因子。',
        '把极值边界也纳入“不同交点”区间。',
      ],
      examFocus: {
        goal: '由升降和驻点画可靠草图，再判断参数或解的数量。',
        pastPaperSummary:
          '相关年度题从给定极值位置反推系数，也从导函数判别式判断是否存在两个转折；更综合的题要求利用驻点高度决定水平线交点数或竖向距离。',
        pastPaperPatterns: [
          {
            form: '从极值位置反推导函数',
            description: '把极值横坐标作为导函数的根，利用最高次系数补全导函数，再比较系数。',
            reference: '2017、2019 年已收录年度题',
            sourceCodes: ['ENGAA_2017_S1-Q039', 'NSAA_2019_S1-Q075'],
          },
          {
            form: '从导数符号确定升降或转折数',
            description:
              '因式分解分段判断；三次曲线有两个不同转折点要求它的一阶导函数（一个二次式）有两个不同实根。',
            reference: '2016、2020 年已收录年度题',
            sourceCodes: ['ENGAA_2016_S1-Q043', 'ESAT-2020-MATHS2-007'],
          },
          {
            form: '驻点高度控制水平线交点与距离',
            description:
              '四次曲线数四个交点要同时跨过两个局部低点且低于中间高点；竖向距离题必须限制横坐标方向，不能改成欧氏最短距离。',
            reference: '2016 年已收录年度题',
            sourceCodes: ['ENGAA_2016_S1-Q049', 'ENGAA_2016_S1-Q053'],
          },
          {
            form: '曲线最低点决定几何高度',
            description:
              '用导数或配方求最低点，连同两根组成矩形；本题是固定矩形面积，不能误说成面积最优化。',
            reference: '2022 年已收录年度题',
            sourceCodes: ['ESAT_LEGACY_2022_ENGAA_Q035'],
          },
        ],
        examples: [
          {
            title: '从两个极值位置还原导函数',
            source: {
              questionCode: 'ENGAA_2017_S1-Q039',
              why: '从两个极值位置还原导函数',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'D · $p=-9,\\ q=24$',
            steps: [
              "$y'=3x^2+2px+q$。原函数在x=2、4处有局部极值，所以导函数的根是2和4。",
              "导函数最高次系数是3，故 $y'=3(x-2)(x-4)=3x^2-18x+24$。",
              '比较系数，$2p=-18,q=24$，所以 $p=-9$，选D。',
              '复核导数符号为正、负、正，因此x=2确为极大、x=4确为极小。',
            ],
            takeaway: '==极值位置是导函数的根，系数与变号共同复核。==',
          },
          {
            title: '水平线在什么高度会有四个不同交点？',
            source: {
              questionCode: 'ENGAA_2016_S1-Q053',
              why: '水平线在什么高度会有四个不同交点？',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C · $15<k<20$',
            steps: [
              "设 $f(x)=3x^4-4x^3-12x^2+20$，求导得 $f'(x)=12x(x+1)(x-2)$。驻点为−1、0、2。",
              '从左到右导数符号为负、正、负、正，因此−1和2是局部低点，0是局部高点。',
              '代回原函数：$f(-1)=15,f(0)=20,f(2)=-12$。两端因正四次项均趋向正无穷。',
              '要让水平线穿过四个单调分支，必须高于两个局部低点中的较高者15，同时低于中间高点20。',
              '因此 $15<k<20$，选C。k等于15或20时有交点合并，不再有四个不同实根。',
            ],
            takeaway: '==先找所有驻点高度，再逐段数水平线交点。==',
          },
        ],
        checklist: [
          '能从导数符号建立升降表并正确分类驻点。',
          '能用极值高度判断水平线交点数，并单独检查边界。',
        ],
      },
      visual: 'maths2-graphs',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120806',
      title: '坐标轴交点与多项式根',
      summary: math2GraphMethods['120806'].summary,
      paragraphs: [math2GraphMethods['120806'].intro],
      rules: math2GraphMethods['120806'].blocks.flatMap((block) => [
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
      memory: math2GraphMethods['120806'].memory,
      pitfalls: [
        '把y截距数值当x坐标。',
        '奇偶重根不分，过每个根都机械换号。',
        '开平方只取正分支，或把重根算成两个不同解。',
      ],
      examFocus: {
        goal: '把代数因式与图像截距、符号和根数对应起来。',
        pastPaperSummary:
          '年度题直接考不同实根数量和参数判别式，也利用重根处理三次、四次及有理式符号。因式反推参数属于根与截距关系的关联应用。',
        pastPaperPatterns: [
          {
            form: '不同实根数量与参数边界',
            description:
              '平方等式分正负两支，二次方程用判别式，高次方程可用水平线交点；重根只计一次。',
            reference: '2016、2021 年已收录年度题',
            sourceCodes: [
              'ENGAA_2016_S1-Q039',
              'ENGAA_2016_S1-Q053',
              'ESAT_LEGACY_2021_ENGAA_Q025',
            ],
          },
          {
            form: '重根和换元决定正负区间',
            description:
              '偶重因子不换号；含x平方的四次式可以先换元，但回到x时必须保留正负分支。分母零点排除。',
            reference: '2016、2017、2019、2022 年已收录年度题',
            sourceCodes: [
              'ENGAA_2016_S1-Q047',
              'ENGAA_2017_S1-Q049',
              'NSAA_2019_S1-Q089',
              'ESAT_LEGACY_2022_ENGAA_Q031',
            ],
          },
          {
            form: '由已知因子反推系数',
            description:
              '将因子的根代入原多项式建立方程；这说明因子与x轴交点的关系，原题主要考代数而非读图。',
            reference: '2020、2023 年已收录年度题',
            sourceCodes: ['ESAT-2020-MATHS2-001', 'ENGAA_2023_S1-Q021'],
          },
        ],
        examples: [
          {
            title: '四次方程为什么只有三个不同实根？',
            source: {
              questionCode: 'ESAT_LEGACY_2021_ENGAA_Q025',
              why: '四次方程为什么只有三个不同实根？',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'D · 3个',
            steps: [
              '令内层 $H(x)=x^2+4x+3=(x+2)^2-1$。由 $H(x)^2=1$，必须分为 $H(x)=1$ 与 $H(x)=-1$。',
              '第一支给 $(x+2)^2=2$，得到 $x=-2\\pm\\sqrt2$；第二支给 $(x+2)^2=0$，得到x=−2。',
              '三个横坐标互不相同，所以答案为3，选D。第二支虽是二重根，也只对应一个不同实数。',
              '图像理解：抛物线 $H(x)$ 与水平线y=1相交两次，与y=−1在顶点接触一次。',
            ],
            takeaway: '==分支完整，重根去重。==',
          },
          {
            title: '双根为什么不会让图像换到另一侧？',
            source: {
              questionCode: 'NSAA_2019_S1-Q089',
              why: '双根为什么不会让图像换到另一侧？',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'F · $x>4$',
            steps: [
              '原式 $x^3-2x^2-7x-4$ 在x=−1为0，分解得到 $(x+1)^2(x-4)$。',
              '除x=−1外，平方因子严格为正，所以乘积符号取决于x−4；在x=−1原式为0。',
              '要严格大于0，只能 $x>4$，选F。−1处是双根，图像接触x轴后仍在负侧；4处是单根，图像穿轴变正。',
              '用测试值检查：x=0时为−4，x=5时为36，符合左右符号。',
            ],
            takeaway: '==先认平方因子，再决定是否变号。==',
          },
        ],
        checklist: ['能分别求x、y截距并检查定义域。', '能区分根重数、不同实根数以及过根后的符号。'],
      },
      visual: 'maths2-graphs',
      sourceIds: ['esat-maths2-spec'],
    },
    {
      code: '120807',
      title: '图像交点与联立方程',
      summary: math2GraphMethods['120807'].summary,
      paragraphs: [math2GraphMethods['120807'].intro],
      rules: math2GraphMethods['120807'].blocks.flatMap((block) => [
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
      memory: math2GraphMethods['120807'].memory,
      pitfalls: [
        '约去公共因子丢掉交点。',
        '把重根算成两个不同点。',
        '忽略分母或根式限制，或用“一个交点”武断推出相切。',
      ],
      examFocus: {
        goal: '在交点、方程的解和参数边界之间准确切换。',
        pastPaperSummary:
          '年度题直接要求两曲线不同交点数、相切直线的截距，以及参数使方程出现指定实根数。图形面积的积分上下限和直线与圆的极限位置也是交点思维的关联应用。',
        pastPaperPatterns: [
          {
            form: '公共因子与不同交点计数',
            description:
              '将两条曲线移到一侧，提取公共因子而不约掉；平方因子提供的交点仍合法但只计一次。',
            reference: '2021 年已收录年度题',
            sourceCodes: ['ESAT_LEGACY_2021_ENGAA_Q035'],
          },
          {
            form: '相切或两个不同交点的参数',
            description: '直线与抛物线联立，用判别式为零或严格大于零区分相切与两个不同点。',
            reference: '2016、2018 年已收录年度题',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q33', 'ENGAA_2016_S1-Q039'],
          },
          {
            form: '水平线的交点数随高度变化',
            description: '原多项式等于k时，把k视为水平线高度，驻点高度决定交点合并的临界值。',
            reference: '2016 年已收录年度题',
            sourceCodes: ['ENGAA_2016_S1-Q053'],
          },
          {
            form: '交点确定区域边界或极限位置',
            description:
              '抛物线与水平线的交点给面积积分边界；直线与圆从相交到相切的临界位置决定线性表达式最大值。',
            reference: '2018、2023 年已收录年度题',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q29', 'ENGAA_2023_S1-Q039'],
          },
        ],
        selfCheckNote: '自测来自独立题库，含分母x；联立后必须保留x不为0并分别验证两个交点。',
        examples: [
          {
            title: '两条曲线有公共平方因子，能约掉吗？',
            source: {
              questionCode: 'ESAT_LEGACY_2021_ENGAA_Q035',
              why: '两条曲线有公共平方因子，能约掉吗？',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C · 2个不同交点',
            steps: [
              '第一条曲线化为 $(x-4)^2(x+2)$，第二条化为 $-(x-4)^2$。',
              '令两式相等后移项，得 $(x-4)^2(x+3)=0$。不要直接约去 $(x-4)^2$。',
              '两个不同横坐标为x=4、−3；代回得到 $(4,0)$ 和 $(-3,-49)$，共两个交点，选C。',
              'x=4是重根，但对应一个点；约掉会漏点，按重数计数会多算点。',
            ],
            takeaway: '==移项后分解，不先约掉可能为零的因子。==',
          },
          {
            title: '相切怎样变成判别式条件？',
            source: {
              questionCode: 'ESAT_LEGACY_2018_ENGAA_Q33',
              why: '相切怎样变成判别式条件？',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C · $k=1/4$',
            steps: [
              '联立 $y=x+k$ 与 $y=3x^2-2x+1$，得到 $3x^2-3x+1-k=0$。',
              '直线与抛物线相切，交点横坐标是二重根，因此 $\\Delta=9-12(1-k)=0$。',
              '解得 $k=1/4$，选C。二重根为 $x=1/2$，代回得到 $y=3/4$。',
              '复核斜率：抛物线导数 $6x-2$ 在x=1/2处等于1，恰好是直线斜率。',
            ],
            takeaway: '==联立得到二次式，再用重根连接相切。==',
          },
        ],
        checklist: [
          '能由联立方程求全部交点，并保留定义域。',
          '能识别重根、相切和交点数变化的边界。',
        ],
      },
      visual: 'maths2-graphs',
      sourceIds: ['esat-maths2-spec'],
    },
  ],
  sources: [
    {
      id: 'esat-maths2-spec',
      title: 'UAT-UK · ESAT 2026/2027 考纲 MM8',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按MM8.1—MM8.7核对标准图像、变换与复合、参数、导数绘图、根和交点。全量审阅88道已收录年度数学2题；考法区分直接考查与关联应用，不以题库仿题充当年度证据。',
    },
  ],
}
