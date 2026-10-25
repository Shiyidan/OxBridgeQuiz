// ESAT 数学2坐标几何讲义：覆盖3个考纲叶节点，真实题源由学习接口读取，考法保留全量相关年度证据。
import type { KnowledgeLesson } from './types'

export const esatMath2Coordinate: KnowledgeLesson = {
  code: '120300',
  title: 'Coordinate geometry · 坐标几何',
  subtitle: '把直线、距离与圆统一成可代回检查的方程关系',
  intro:
    '坐标几何把图形条件翻译成方程：斜率与截距描述直线，距离公式把“长度”变成平方和，圆的标准式把“到定点等距”固定成唯一形式。解题顺序通常是先定几何对象的位置，再写方程，最后把得到的坐标或参数代回原条件核对。遇到切线与弦，先找半径与垂线，再决定用直角三角形还是扇形。',
  memory: [
    '**直线先定斜率，再定截距。**$y=mx+c$中$m$管倾斜、$c$管与$y$轴的交点；一般式$Ax+By+C=0$的斜率是$-A/B$，垂直条件是$m_1m_2=-1$。',
    '**距离题先选公式再代点。**两点距离用差平方和；点到直线距离先把方程整理成$Ax+By+C=0$，再除以$\\sqrt{A^2+B^2}$。',
    '**圆先配方读圆心半径。**$(x-a)^2+(y-b)^2=r^2$中圆心是$(a,b)$；一般式配方后右侧必须为正，半径不能取负。',
    '**切线看垂直，弓形先拆再减。**切线垂直于半径，外点的切线长与半径构成直角三角形；弓形面积等于扇形减三角形。',
  ],
  sections: [
    {
      code: '120301',
      title: '直线',
      summary: '斜率定方向，截距定位置；垂直看乘积$-1$，距离先化一般式。',
      paragraphs: [
        '直线最常用的写法是斜截式$y=mx+c$与一般式$Ax+By+C=0$。斜截式中$m$是斜率、$c$是纵截距；一般式中斜率是$-A/B$，横截距是$-C/A$，纵截距是$-C/B$。已知两点$(x_1,y_1)$、$(x_2,y_2)$时，斜率$m=\\frac{y_2-y_1}{x_2-x_1}$，再用点斜式$y-y_1=m(x-x_1)$展开。截距式$\\frac xa+\\frac yb=1$适合“直线与两正半轴围成三角形”的题目，三角形的两条直角边就是$a$与$b$，面积是$\\frac{ab}{2}$。',
        '平行与垂直都由斜率编码：平行直线$m_1=m_2$；垂直直线$m_1m_2=-1$。写成一般式时，垂直条件等价于$A_1A_2+B_1B_2=0$，这个形式在含参数时更稳。竖直线的斜率不存在，遇到“垂直于水平线”要单独看，不能机械套$m_1m_2=-1$。',
        '长度与距离有三条常用公式：两点距离$\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2}$，中点$(\\frac{x_1+x_2}{2},\\frac{y_1+y_2}{2})$，点$(x_0,y_0)$到直线$Ax+By+C=0$的垂距$\\frac{|Ax_0+By_0+C|}{\\sqrt{A^2+B^2}}$。坐标几何的收尾是回代：把求出的$m$、交点或截距代回“垂直”“长度为5”“面积为12”等原条件，检查符号、绝对值与范围限制。',
      ],
      rules: [
        {
          title: '斜率与截距直接读',
          text: '$y=mx+c$的斜率是$m$；$Ax+By+C=0$的斜率是$-A/B$，纵截距是$-C/B$。',
        },
        {
          title: '垂直乘积为$-1$',
          text: '$m_1m_2=-1$；一般式用$A_1A_2+B_1B_2=0$，竖直线另作处理。',
        },
        {
          title: '点到直线距离先化一般式',
          text: '$d=\\frac{|Ax_0+By_0+C|}{\\sqrt{A^2+B^2}}$；方程没有整理成一般式时，$A,B,C$会取错。',
        },
        {
          title: '截距式对应三角形面积',
          text: '$\\frac xa+\\frac yb=1$与两轴围成的直角三角形面积为$\\frac{ab}{2}$（$a,b>0$）。',
        },
      ],
      pitfalls: [
        '把垂直斜率写成$1/m$，漏掉负号。',
        '求横截距时把$-C/A$写成$C/A$，计算线段长度时又忘记加绝对值。',
        '套点到直线距离公式前没有把方程整理成$Ax+By+C=0$，或把常数项符号带错。',
        '解出两个$m$后忽略$m>1$、$m>0$等范围条件，保留了不符合题意的根。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-coordinate', 'uat-annual-archive'],
      visual: 'maths2-coordinate',
      examFocus: {
        goal: '斜率定方向，截距定位置；垂直看乘积$-1$，距离先化一般式。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '垂直条件与截距联立',
            description:
              '由垂直关系写出$p=-1/m$，再用两条直线的$x$轴截距或与$y$轴围成的三角形面积列方程，解出斜率后回代求组合量。',
            reference: '2016、2020 年度真题',
            sourceCodes: ['ENGAA_2016_S1-Q041', 'ESAT-2020-MATHS2-005'],
          },
          {
            form: '两点距离关系反求坐标参数',
            description:
              '用距离公式把“一条线段是另一条的若干倍”写成含参数的平方方程，开方时保留正负两支。',
            reference: '2018 年度真题',
            sourceCodes: ['ESAT_LEGACY_2018_ENGAA_Q45'],
          },
          {
            form: '点到直线距离公式直接代入',
            description:
              '先把过两截距点的直线整理成一般式，再用垂距公式；绝对值内的符号决定结果是否化简。',
            reference: '2022 年度真题',
            sourceCodes: ['ESAT_LEGACY_2022_ENGAA_Q037'],
          },
        ],
        examples: [
          {
            title: '垂直直线与截距长度联立解斜率',
            source: {
              questionCode: 'ENGAA_2016_S1-Q041',
              why: '垂直斜率与$x$轴截距长度联立，解出$m+p$',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'D',
            steps: [
              '垂直条件给出$mp=-1$，即$p=-\\frac1m$。',
              '两条直线的$x$轴截距分别为$-\\frac3m$与$-\\frac2p$；因为$p=-\\frac1m$，第二项$-\\frac2p=2m$。',
              '长度$LM=5$，而$m>0$，所以$\\left|2m+\\frac3m\\right|=5$化为$2m+\\frac3m=5$。',
              '两边乘$m$：$2m^2-5m+3=0$，分解得$(2m-3)(m-1)=0$。',
              '条件$m>1$排除$m=1$，取$m=\\frac32$，于是$p=-\\frac23$，$m+p=\\frac56$，选D。',
            ],
            takeaway: '垂直先写$p=-1/m$；截距是带符号的坐标，长度才加绝对值，最后别忘题目给的$m>1$。',
          },
          {
            title: '两点式化一般式后套点到直线距离',
            source: {
              questionCode: 'ESAT_LEGACY_2022_ENGAA_Q037',
              why: '由两截距点写直线一般式，再用垂距公式',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C',
            steps: [
              '直线过$(0,2a)$与$(a,0)$，斜率$\\frac{0-2a}{a-0}=-2$。',
              '用斜截式写为$y=-2x+2a$，整理成一般式$2x+y-2a=0$。',
              '点$P(a,2a)$到该直线的距离$d=\\frac{|2a+2a-2a|}{\\sqrt{2^2+1^2}}=\\frac{2a}{\\sqrt5}$。',
              '因为$a>0$，绝对值直接去掉，$d=\\frac{2\\sqrt5}{5}a$，选C。',
            ],
            takeaway: '点到直线距离的分母是$\\sqrt{A^2+B^2}$，不是$A^2+B^2$；先化成一般式能避免系数抄错。',
          },
        ],
        checklist: [
          '能解释并正确使用：斜率与截距直接读。',
          '能解释并正确使用：垂直乘积为$-1$。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120302',
      title: '圆的坐标几何',
      summary: '先配方读出圆心与半径，再由切线与弦心距建立直角三角形。',
      paragraphs: [
        '圆是到定点距离等于定长的点集。标准式$(x-a)^2+(y-b)^2=r^2$直接给出圆心$(a,b)$与半径$r$；一般式$x^2+y^2+Dx+Ey+F=0$要先配方：$(x+\\frac D2)^2+(y+\\frac E2)^2=\\frac{D^2+E^2}{4}-F$，所以圆心是$(-\\frac D2,-\\frac E2)$，半径平方是右侧常数。右侧为负时不是实圆，半径开方后取正。',
        '由几何条件定圆时，先找圆心再找半径。直径两端点的中点是圆心，半径是直径的一半；圆心在弦的垂直平分线上；圆与两条坐标轴都相切时，圆心坐标的绝对值都等于半径，例如第一象限内圆心可设为$(r,r)$。把“圆经过某点”代入标准式，就得到关于圆心或半径的方程。',
        '直线与圆的位置关系可以用圆心到直线的距离$d$判断：$d<r$相交，$d=r$相切，$d>r$相离。切线垂直于过切点的半径；圆心在原点的圆在点$(x_1,y_1)$处的切线是$x_1x+y_1y=r^2$，一般圆心则用点法式$(x_1-a)(x-a)+(y_1-b)(y-b)=r^2$。相交时，弦心距、半弦长与半径满足$r^2=d^2+l^2$，这是后面弦长与弓形计算的基础。',
      ],
      rules: [
        {
          title: '配方读圆心半径',
          text: '$x^2+y^2+Dx+Ey+F=0$的圆心为$(-\\frac D2,-\\frac E2)$，$r^2=\\frac{D^2+E^2}{4}-F$。',
        },
        {
          title: '位置关系看圆心距',
          text: '圆心到直线的距离$d=r$时相切；$d<r$相交，$d>r$相离。',
        },
        {
          title: '切线与半径垂直',
          text: '圆上点$(x_1,y_1)$的切线以半径向量为法向量；圆心在原点时写成$x_1x+y_1y=r^2$。',
        },
        {
          title: '弦心距与半弦长',
          text: '$r^2=d^2+l^2$，其中$d$是圆心到弦的距离，$l$是半弦长。',
        },
      ],
      pitfalls: [
        '把直径当成半径，或把$(x+2)^2$误读成圆心$+2$，实际圆心是$-2$。',
        '一般式配方时把圆心写成$(\\frac D2,\\frac E2)$，漏掉负号。',
        '写切线方程时没有先确认切点在圆上，或把半径方向当成切线方向。',
        '判断直线与圆的位置关系时用错距离公式，忘记先把直线化成一般式。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-circles', 'openstax-coordinate', 'uat-annual-archive'],
      visual: 'maths2-coordinate',
      examFocus: {
        goal: '先配方读出圆心与半径，再由切线与弦心距建立直角三角形。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '由几何图形定圆心与半径',
            description:
              '先把正方形、半圆等条件翻译成圆心坐标与半径，再写标准式或展开成一般式；直径与半径、边长与直径的换算要多走一步。',
            reference: '2016、2022 年度真题',
            sourceCodes: ['ENGAA_2016_S1-Q031', 'ESAT_LEGACY_2022_ENGAA_Q023'],
          },
          {
            form: '圆上一点的切线方程',
            description:
              '以圆心到切点的半径向量为法向量写点法式，再整理成选项中的形式；圆心在原点时也可直接用$x_1x+y_1y=r^2$。',
            reference: '2021 年度真题',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q004'],
          },
          {
            form: '圆约束下的线性最值',
            description:
              '把$2x+3y$的最大值看成直线$2x+3y=k$与圆相切，令圆心到直线的距离等于半径，解出$k$。',
            reference: '2023 年度真题',
            sourceCodes: ['ENGAA_2023_S1-Q039'],
          },
        ],
        examples: [
          {
            title: '由正方形边长定圆心半径并展开方程',
            source: {
              questionCode: 'ENGAA_2016_S1-Q031',
              why: '由直径定圆心与半径，再展开成一般式',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C',
            steps: [
              '正方形边长$PQ=1-(-5)=6$，所以内切圆的直径是6，半径$r=3$。',
              '$PQ$在$x$轴上且正方形在$x$轴上方，圆心位于$PQ$中点$(\\frac{-5+1}{2},0)=(-2,0)$的正上方3个单位，即$(-2,3)$。',
              '写标准式：$(x+2)^2+(y-3)^2=9$。',
              '展开：$x^2+4x+4+y^2-6y+9=9$，得$x^2+y^2+4x-6y+4=0$，选C。',
            ],
            takeaway: '先算半径和圆心，再展开；圆心横坐标是$-2$，所以展开后$x$的一次项是$+4x$。',
          },
          {
            title: '用半径作法向量写圆上点的切线',
            source: {
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q004',
              why: '半径垂直于切线，用点法式直接写切线',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'A',
            steps: [
              '圆心为$(0,0)$，切点为$(4,3)$，半径向量$(4,3)$就是切线的法向量。',
              '切线过$(4,3)$且法向量为$(4,3)$，写点法式：$4(x-4)+3(y-3)=0$。',
              '展开得$4x-16+3y-9=0$，即$4x+3y=25$。',
              '按选项写成$3y+4x=25$，选A。',
            ],
            takeaway: '切线的法向量是半径方向；法向量确定后，过切点的点法式比先求斜率更直接。',
          },
        ],
        checklist: [
          '能解释并正确使用：配方读圆心半径。',
          '能解释并正确使用：切线与半径垂直。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120303',
      title: '圆性质',
      summary: '切线、弦与圆心角把圆拆成直角三角形和扇形，面积题先分解再相减。',
      paragraphs: [
        '弦与半径的关系是圆性质题的骨架。过圆心作弦的垂线会平分这条弦（垂径定理），于是圆心到弦的距离$d$、半弦长$l$与半径$r$构成直角三角形：$r^2=d^2+l^2$。同一条弧所对的圆心角是圆周角的两倍；同弧或等弧所对的圆周角相等。直径所对的圆周角是$90^\\circ$。',
        '切线有两条常用性质：切线与过切点的半径垂直；从圆外一点引两条切线，两条切线长相等。设外点到圆心距离为$PC$、半径为$r$，则切线长$PT$满足$PT^2=PC^2-r^2$，因为$\\triangle PTC$在$T$处是直角三角形。外点到圆的最短距离是$PC-r$，最长距离是$PC+r$，注意“切线长”和“最短距离”不是同一个量。',
        '与圆有关的面积先分解：扇形面积$\\frac12r^2\\theta$（$\\theta$用弧度），圆心角为$\\theta$的三角形面积$\\frac12r^2\\sin\\theta$，弓形面积等于扇形减三角形。等边三角形内接于半径为$R$的圆时，每条边所对的圆心角是$120^\\circ$，圆面积减三角形面积就是三个弓形面积之和。组合图形先用对称性拆成相同的小块，再统一乘倍数或相减。',
      ],
      rules: [
        {
          title: '垂径定理',
          text: '圆心到弦的垂线平分弦；$r^2=d^2+l^2$，$d$为弦心距，$l$为半弦长。',
        },
        {
          title: '切线长公式',
          text: '$PT^2=PC^2-r^2$；切线垂直于半径，外点到圆的最短距离是$PC-r$。',
        },
        {
          title: '圆心角是圆周角的两倍',
          text: '同弧所对的圆心角等于圆周角的两倍；同弧圆周角相等，直径所对圆周角为$90^\\circ$。',
        },
        {
          title: '弧长与扇形面积用弧度',
          text: '$s=r\\theta$，$A_{\\text{sector}}=\\frac12r^2\\theta$；弓形$=A_{\\text{sector}}-\\frac12r^2\\sin\\theta$。',
        },
      ],
      pitfalls: [
        '把切线长$PT$直接当成外点到圆的最短距离，忘记再减去半径。',
        '扇形面积公式漏掉$\\frac12$，或角度制没有先换弧度就代入。',
        '弓形面积只算扇形或只算三角形，忘记两者相减；也没有检查取的是较小弓形。',
        '圆心角与圆周角的倍数关系用反，把$2\\angle$写成$\\frac12\\angle$。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-circles', 'openstax-angles', 'uat-annual-archive'],
      visual: 'maths2-coordinate',
      examFocus: {
        goal: '切线、弦与圆心角把圆拆成直角三角形和扇形，面积题先分解再相减。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '外点切线与半径构成直角三角形',
            description:
              '由$PT^2=PC^2-r^2$求切线长或$PC$，再按题目要求减去半径得到最短距离；两条切线对称，切线夹角由$\\sin$或$\\cos$读出。',
            reference: '2016、2018 年度真题',
            sourceCodes: ['ENGAA_2016_S1-Q035', 'ESAT_LEGACY_2018_ENGAA_Q43'],
          },
          {
            form: '弦分割圆的弓形面积',
            description:
              '先由弦心距与半径求圆心角，再用扇形面积减三角形面积；注意题目要的是较小还是较大弓形。',
            reference: '2021 年度真题',
            sourceCodes: ['ESAT_LEGACY_2021_ENGAA_Q027'],
          },
          {
            form: '圆内接正三角形与扇形组合',
            description:
              '等边三角形内接于圆时，每条边对应$120^\\circ$圆心角；用圆面积减三角形面积得到三条弓形之和。',
            reference: '2019 年度真题',
            sourceCodes: ['NSAA_2019_S1-Q079'],
          },
        ],
        examples: [
          {
            title: '切线长与半径求外点到圆的最短距离',
            source: {
              questionCode: 'ESAT_LEGACY_2018_ENGAA_Q43',
              why: '切线长、半径与外点圆心距构成直角三角形，再减半径',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'C',
            steps: [
              '圆$(x+3)^2+(y-2)^2=5$的半径$r=\\sqrt5$。',
              '设切点为$T$，则$CT\\perp PT$，$\\triangle PCT$在$T$处是直角三角形。',
              '由勾股定理：$PC^2=PT^2+r^2=(5\\sqrt3)^2+5=75+5=80$，所以$PC=4\\sqrt5$。',
              '最短距离是$PC-r=4\\sqrt5-\\sqrt5=3\\sqrt5$，选C。',
            ],
            takeaway: '切线长公式给的是外点到切点，最短距离还要再减去半径。',
          },
          {
            title: '直线截圆所得较小弓形面积',
            source: {
              questionCode: 'ESAT_LEGACY_2021_ENGAA_Q027',
              why: '由弦心距求圆心角，再用扇形减三角形',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'H',
            steps: [
              '圆$x^2+y^2=4$的半径$r=2$，弦所在直线$x=1$，弦心距$d=1$。',
              '半圆心角$\\alpha$满足$\\cos\\alpha=\\frac dr=\\frac12$，所以$\\alpha=\\frac\\pi3$，整段圆心角$\\theta=\\frac{2\\pi}{3}$。',
              '扇形面积$\\frac12r^2\\theta=\\frac12\\times4\\times\\frac{2\\pi}{3}=\\frac{4\\pi}{3}$。',
              '三角形面积$\\frac12r^2\\sin\\theta=\\frac12\\times4\\times\\frac{\\sqrt3}{2}=\\sqrt3$。',
              '较小弓形面积$=\\frac{4\\pi}{3}-\\sqrt3$，选H。',
            ],
            takeaway: '弦心距与半径的比给出半圆心角；弓形面积必须用扇形减去同圆心角的三角形。',
          },
        ],
        checklist: [
          '能解释并正确使用：垂径定理。',
          '能解释并正确使用：切线长公式。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'esat-maths2-spec',
      title: 'UAT-UK · ESAT 2026/2027 考纲（数学2部分）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按数学2坐标几何部分组织：直线、圆的坐标几何、圆性质。',
    },
    {
      id: 'openstax-coordinate',
      title: 'OpenStax · College Algebra 2e · Linear Functions',
      url: 'https://openstax.org/books/college-algebra-2e/pages/4-1-linear-functions',
      note: '核对斜率、直线方程、平行与垂直条件；讲解与选题按 ESAT 数学2范围重新组织。',
    },
    {
      id: 'openstax-circles',
      title: 'OpenStax · Intermediate Algebra 2e · Distance and Midpoint Formulas; Circles',
      url: 'https://openstax.org/books/intermediate-algebra-2e/pages/11-1-distance-and-midpoint-formulas-circles',
      note: '对照距离公式、中点、圆的标准式与一般式配方；不照搬教材例题。',
    },
    {
      id: 'openstax-angles',
      title: 'OpenStax · Algebra and Trigonometry 2e · Angles',
      url: 'https://openstax.org/books/algebra-and-trigonometry-2e/pages/7-1-angles',
      note: '核对弧长与扇形面积公式，本章只取与圆性质、弓形面积相关的部分。',
    },
    {
      id: 'uat-annual-archive',
      title: 'UAT-UK · ENGAA / NSAA 真题档案',
      url: 'https://esat-tmua.ac.uk/esat-preparation-materials/',
      note: '考法证据来自当前库内2016—2023年度数学2题，不声称覆盖未导入的全部官方档案。',
    },
  ],
}
