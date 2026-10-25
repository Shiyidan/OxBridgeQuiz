// ESAT 数学2代数与函数讲义：覆盖7个考纲叶节点，真实题源由学习接口读取，考法保留全量相关年度证据。
import type { KnowledgeLesson } from './types'

export const esatMath2Algebra: KnowledgeLesson = {
  code: '120100',
  title: 'Algebra and functions · 代数与函数',
  subtitle: '从指数、根式到多项式与函数性质，把每一步化简都变成可回查的结构',
  intro:
    '本章工具互为表里：指数律与根式是同一种记账方式，判别式与配方回答同一个二次问题，因式定理把“整除”翻译成代入求值，复合函数把多层结构拆回单层。每节配真实题源练习，先识别结构，再动笔计算。',
  memory: [
    '**指数律先定底数再算幂。**负指数是倒数，分数幂的分母是根次；外层幂同时作用于系数和每个字母。',
    '**根式先化最简，分母有根式就乘共轭。**高次幂先找分子分母共享的整体，约掉再展开。',
    '**二次式三件事各归各位。**判别式管根的个数，配方管最值与顶点，因式管零点；distinct 对应严格不等号。',
    '**不等式先找临界值再定符号。**偶重根两侧不变号但要排除零点；换元 $u=x^2$ 自带 $u\\ge0$。',
  ],
  sections: [
    {
      code: '120101',
      title: '有理指数指数律',
      summary: '先定底数、再算指数；负指数取倒数，分数幂的分母是根次。',
      paragraphs: [
        '正数底数下，分数幂有唯一定义：$x^{m/n}=\\sqrt[n]{x^m}$（$x>0$），分母$n$是根次，分子$m$是幂次。负指数表示倒数：$x^{-3/4}=1/x^{3/4}$。同底数运算照常：$x^a x^b=x^{a+b}$，$(x^a)^b=x^{ab}$，对任意有理数指数都成立。',
        '外层幂作用于括号里的每一个因子，包括数值系数：$(2x^{3/4})^4=2^4\\cdot x^3=16x^3$，不是$2x^3$。多字母式分栏记账：系数一栏、每个字母的指数各一栏，最后合并。',
        '解含分数幂的方程时，先把含未知数的幂隔离在一边，再两边同时取能消去该幂的乘方。定义域$x>0$不只是排除负根：它保证$x^{1/2}$这类因式为正，可以直接约去而不丢解。',
      ],
      rules: [
        {
          title: '逐底数记账',
          text: '$(2x^{3/4})^4=16x^3$；外幂4同时乘到系数2和指数$3/4$上。',
        },
        {
          title: '负分数幂先拆结构',
          text: '$x^{-m/n}=1/\\sqrt[n]{x^m}$（$x>0$）：负号取倒数，分母$n$开根，分子$m$取幂，三条信息都不能丢。',
        },
        {
          title: '幂方程先隔离再还原',
          text: '由$16x^{-3/4}=2$先得$x^{-3/4}=1/8=2^{-3}$，再比较$x^{1/4}=2$，最后$x=2^4=16$。',
        },
      ],
      pitfalls: [
        '外层幂只乘到字母指数，漏掉系数也要乘方。',
        '把负指数读成负值，或把分母根次读成幂次。',
        '约去$x^{1/2}$这类因式时不先确认它在定义域内为正。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-algebra'],
      visual: 'maths2-algebra',
      examFocus: {
        goal: '先定底数、再算指数；负指数取倒数，分数幂的分母是根次。',
        pastPaperSummary:
          '当前已导入的2016—2023年度数学2真题中，未找到以本点为主要考点的年度题。这里用已发布题库题练习，不据此推断往年频率。',
        pastPaperPatterns: [],
        pastPaperNote: '本节例题与自测来自已发布独立试题库，属于题库练习，不标作历年真题。',
        examples: [
          {
            title: '指数律化简后约去正因式再解三次方程',
            source: {
              questionCode: 'ESAT-M2-DIRECT-006-LR3',
              why: '指数律化简后约去正因式再解三次方程',
              subject: 'mathematics2',
              kind: 'bank',
            },
            question: '',
            answer: 'D',
            steps: [
              '左边分子$(2x^{3/4})^4=2^4x^3=16x^3$；再除以$16x^{-1/2}$，指数加$1/2$，左边化简为$x^{7/2}$。',
              '右边提取公因式：$7x^{3/2}-6x^{1/2}=x^{1/2}(7x-6)$。',
              '因为$x>0$，$x^{1/2}$为正可直接约去，得到$x^3=7x-6$。',
              '分解$x^3-7x+6=(x-1)(x-2)(x+3)$，代数根为1、2、−3。',
              '条件$x>0$排除−3，留下x=1或x=2，选D。',
            ],
            takeaway: '负指数取倒数、分母是根次；约去含x的幂之前，先用定义域确认它为正。',
          },
        ],
        checklist: [
          '能解释并正确使用：逐底数记账。',
          '能解释并正确使用：负分数幂先拆结构。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120102',
      title: '根式',
      summary: '先化最简根式，分母有根式乘共轭；高次幂先约共享整体。',
      paragraphs: [
        '最简根式把被开方数里的平方因子提出：$\\sqrt{20}=2\\sqrt5$，$\\sqrt{12}=2\\sqrt3$。只有同类根式能合并：$\\sqrt2+2\\sqrt2=3\\sqrt2$，而$\\sqrt2+\\sqrt3$不能合并。',
        '分母含$a+\\sqrt b$时乘共轭$a-\\sqrt b$，分母变为$a^2-b$。注意分母可能是负数：$(\\sqrt3-2)(\\sqrt3+2)=3-4=-1$，最后整体要变号。有理化不改变原式的值，只是换写法。',
        '遇到$(1+\\sqrt5)^3$这类高次幂，先看分子分母是否共享同一整体：能约分就先约，剩下的低次分式再有理化，通常比直接展开立方更短、更不易错。',
      ],
      rules: [
        {
          title: '分母有理化乘共轭',
          text: '$\\frac{1}{a+\\sqrt b}=\\frac{a-\\sqrt b}{a^2-b}$；分母为负时结果整体变号。',
        },
        {
          title: '高次幂先约共享整体',
          text: '$\\frac{(2+\\sqrt{20})^2}{(1+\\sqrt5)^3}=\\frac{4(1+\\sqrt5)^2}{(1+\\sqrt5)^3}=\\frac{4}{1+\\sqrt5}$，再乘共轭即得$\\sqrt5-1$。',
        },
      ],
      pitfalls: [
        '展开$(a+b)^3$时漏掉中间项$3a^2b$与$3ab^2$。',
        '共轭乘错对象，如分母是$\\sqrt3-2$却仍乘$\\sqrt3-2$。',
        '有理化后分母为$-1$时忘记整体变号。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-algebra'],
      visual: 'maths2-algebra',
      examFocus: {
        goal: '先化最简根式，分母有根式乘共轭；高次幂先约共享整体。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '分式中根式高次幂的化简',
            description:
              '先乘共轭把单层分母有理化再取幂，或先认出分子分母共享的根式整体幂约分，最后展开剩余低次部分。',
            reference: '2019、2022 年度真题',
            sourceCodes: ['ENGAA_2019_S1-Q025', 'ESAT_LEGACY_2022_ENGAA_Q027'],
          },
          {
            form: '逐项有理化后错位相消',
            description:
              '每项分母的两个根式被开方数相差固定，乘共轭后化为相邻根式之差，求和时中间项成对消去，只剩端点。',
            reference: '2021 年度真题',
            sourceCodes: ['ESAT_LEGACY_2021_ENGAA_Q037'],
          },
        ],
        examples: [
          {
            title: '先有理化单层分母再取三次幂',
            source: {
              questionCode: 'ENGAA_2019_S1-Q025',
              why: '先有理化单层分母再取三次幂',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'B',
            steps: [
              '先处理$\\frac{1}{1-\\sqrt2}$：乘共轭得$\\frac{1+\\sqrt2}{(1-\\sqrt2)(1+\\sqrt2)}=\\frac{1+\\sqrt2}{-1}=-(1+\\sqrt2)$。',
              '取三次幂：$\\frac{1}{(1-\\sqrt2)^3}=-(1+\\sqrt2)^3$。',
              '展开$(1+\\sqrt2)^3=1+3\\sqrt2+3\\times2+2\\sqrt2=7+5\\sqrt2$。',
              '原式为$-7-5\\sqrt2$，即b=−5，选B。',
            ],
            takeaway: '先把分母变成有理数，再取幂；顺序反过来要展开的括号更复杂。',
          },
          {
            title: '先约共享根式幂再有理化',
            source: {
              questionCode: 'ESAT_LEGACY_2022_ENGAA_Q027',
              why: '先约共享根式幂再有理化',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'A',
            steps: [
              '化简$\\sqrt{20}=2\\sqrt5$，分子$(2+\\sqrt{20})^2=(2+2\\sqrt5)^2=4(1+\\sqrt5)^2$。',
              '与分母约去$(1+\\sqrt5)^2$，原式化为$\\frac{4}{1+\\sqrt5}$。',
              '乘共轭$\\sqrt5-1$：分母$(1+\\sqrt5)(\\sqrt5-1)=5-1=4$。',
              '得到$\\frac{4(\\sqrt5-1)}{4}=\\sqrt5-1$，选A。',
            ],
            takeaway: '认出分子分母共享的整体幂，约分后再有理化，避免展开三次式。',
          },
        ],
        checklist: [
          '能解释并正确使用：分母有理化乘共轭。',
          '能解释并正确使用：高次幂先约共享整体。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120103',
      title: '二次函数与方程',
      summary: '判别式管根的个数，配方管最值与顶点，因式管零点。',
      paragraphs: [
        '标准式$ax^2+bx+c=0$（$a\\ne0$）的判别式$\\Delta=b^2-4ac$：$\\Delta>0$两个不同实根，$\\Delta=0$重根，$\\Delta<0$无实根。“two distinct real roots”对应严格大于零；直线与抛物线相切对应$\\Delta=0$。先把方程移项整理成标准式，再算判别式。',
        '配方$ax^2+bx+c=a\\left(x+\\frac{b}{2a}\\right)^2+\\left(c-\\frac{b^2}{4a}\\right)$直接给出顶点与最值。首项系数不是1时先提$a$，补偿常数要乘回$a$；指数函数$10^{\\text{二次式}}$的最小值就是底数的最小指数次幂。',
        '根与系数的关系$\\alpha+\\beta=-b/a$、$\\alpha\\beta=c/a$可以不求根就算组合；函数值条件$f(x_0)=v$代入后就是系数的方程。问根的个数时，注意复合结构（如某二次式的平方等于1）要分成两支分别求解并去重。',
      ],
      rules: [
        {
          title: 'distinct 对应严格判别式',
          text: '两个不同实根要求$\\Delta>0$；相切、重根要求$\\Delta=0$，等号不能混用。',
        },
        {
          title: '配方保留首项系数',
          text: '$\\sqrt2x^2-6x+4=\\sqrt2\\left(x-\\frac{3}{\\sqrt2}\\right)^2+4-\\frac{9\\sqrt2}{2}$，先提$\\sqrt2$再补平方。',
        },
        {
          title: '平方等于常数分两支',
          text: '$(x^2+4x+3)^2=1$拆成内层等于$1$与$-1$两个方程，分别求根后去重计数。',
        },
      ],
      pitfalls: [
        '把“两个不同实根”写成判别式大于等于零，多收进重根端点。',
        '配方时漏提首项系数，或补偿常数忘记乘回去。',
        '统计实根个数时把重根重复计入。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-algebra'],
      visual: 'maths2-algebra',
      examFocus: {
        goal: '判别式管根的个数，配方管最值与顶点，因式管零点。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '判别式建立参数条件',
            description:
              '两个不同实根、相切或无交点分别对应判别式严格为正、为零、为负，由此建立参数不等式或等式。',
            reference: '2016、2021 年度真题',
            sourceCodes: ['ENGAA_2016_S1-Q039', 'ESAT_LEGACY_2021_ENGAA_Q025'],
          },
          {
            form: '配方读最值或比较系数',
            description:
              '把一般式配成顶点式读最值（含指数函数的最小指数），或展开顶点式与一般式比较系数；首项系数非1时先提出。',
            reference: '2023 年度真题',
            sourceCodes: ['ENGAA_2023_S1-Q029', 'NSAA_2023_S1-Q016'],
          },
        ],
        examples: [
          {
            title: '两个不同实根用严格判别式',
            source: {
              questionCode: 'ENGAA_2016_S1-Q039',
              why: '两个不同实根用严格判别式',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'G',
            steps: [
              '移项成标准式：$3x^2-(a+2)x+3=0$。',
              '判别式$\\Delta=(a+2)^2-4\\times3\\times3=(a+2)^2-36$。',
              '两个不同实根要求$(a+2)^2>36$。',
              '平方大于36等价于$a+2>6$或$a+2<-6$，即$a>4$或$a<-8$，选G。',
            ],
            takeaway: '严格大于对应两个不同根；平方不等式拆成左右两个分支，不能只留正号一侧。',
          },
          {
            title: '非首一配方比较系数后计算参数组合',
            source: {
              questionCode: 'ENGAA_2023_S1-Q029',
              why: '非首一配方比较系数后计算参数组合',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'F',
            steps: [
              '展开$p(x+q)^2+r=px^2+2pqx+pq^2+r$，与$\\sqrt2x^2-6x+4$比较，得$p=\\sqrt2$。',
              '由$2pq=-6$得$q=-\\frac{3}{\\sqrt2}=-\\frac{3\\sqrt2}{2}$。',
              '常数项$pq^2+r=4$给出$r=4-\\sqrt2\\times\\frac92=4-\\frac{9\\sqrt2}{2}$。',
              '于是$r-q=4-\\frac{9\\sqrt2}{2}+\\frac{3\\sqrt2}{2}=4-3\\sqrt2$。',
              '所求$p(r-q)=\\sqrt2(4-3\\sqrt2)=4\\sqrt2-6$，选F。',
            ],
            takeaway: '首项系数是$\\sqrt2$也要先提出来；最后问的是$p(r-q)$，不能停在$r-q$。',
          },
        ],
        checklist: [
          '能解释并正确使用：distinct 对应严格判别式。',
          '能解释并正确使用：配方保留首项系数。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120104',
      title: '代入法解联立方程',
      summary: '由一式解出一个字母或整体，代入另一式，只剩一个未知数。',
      paragraphs: [
        '代入法的核心：从较简单的方程解出$y$（用$x$表示），代入另一方程，得到只含$x$的方程。直线与抛物线联立时，令两式的$y$相等就是代入的一种；解出$x$后必须代回求配套的$y$，每个$x$对应自己的$y$，不能交叉配对。',
        '代入的对象不必是单个字母。已知$x^2+y^2=12-2xy$时，可以把$x^2+y^2$整个代入另一方程，直接得到关于$xy$的方程，比先解出$x$、$y$短得多。对称方程组常用$x+y$、$xy$作为整体。',
        '消元后得到高次方程时，先分解或判别，再检查候选解是否满足全部原方程；平方、去分母等步骤可能引入增根，回代是不可省的收尾。',
      ],
      rules: [
        {
          title: '代入后只剩一个未知数',
          text: '由$x+y=\\beta$得$y=\\beta-x$，代入另一式后方程只含$x$与参数。',
        },
        {
          title: '整体关系可直接代入',
          text: '$x^2+y^2=12-2xy$整体代入$x^2+4xy+y^2=18$，立即得$12+2xy=18$。',
        },
        {
          title: '解要成对回代',
          text: '直线与抛物线有两个交点时，每个x代回直线求自己的y，不能随意配对。',
        },
      ],
      pitfalls: [
        '只替换未知数的一部分出现位置，漏掉另一处。',
        '联立后漏掉第二个交点或第二个分支。',
        '求出$xy$就停笔，题目实际要的是$x+y$等别的组合。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-algebra'],
      visual: 'maths2-algebra',
      examFocus: {
        goal: '由一式解出一个字母或整体，代入另一式，只剩一个未知数。',
        pastPaperSummary:
          '当前已导入的2016—2023年度数学2真题中，未找到以本点为主要考点的年度题。这里用已发布题库题练习，不据此推断往年频率。',
        pastPaperPatterns: [],
        pastPaperNote: '本节例题与自测来自已发布独立试题库，属于题库练习，不标作历年真题。',
        examples: [
          {
            title: '把平方和整体代入消元',
            source: {
              questionCode: 'ESAT-M2-MOCK-ADAPT-E02-014',
              why: '把平方和整体代入消元',
              subject: 'mathematics2',
              kind: 'bank',
            },
            question: '',
            answer: 'D',
            steps: [
              '第二式给出整体关系$x^2+y^2=12-2xy$。',
              '代入第一式：$(12-2xy)+4xy=18$。',
              '合并得$2xy=6$，所以$xy=3$，选D。',
              '可行性检查：$x=y=\\sqrt3$时两式都成立，条件没有隐藏矛盾。',
            ],
            takeaway: '代入的对象可以是$x^2+y^2$这样的整体组合，不必先单独解出x和y。',
          },
        ],
        checklist: [
          '能解释并正确使用：代入后只剩一个未知数。',
          '能解释并正确使用：整体关系可直接代入。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120105',
      title: '一次与二次不等式',
      summary: '先找临界值，再按开口与符号定区间；重根不变号，换元带限制。',
      paragraphs: [
        '二次不等式先整理成一边为0并分解。开口向上时，大于零取两根之外，小于零取两根之间；严格不等号不含根本身。与另一个条件（如$x\\le4$）同时成立时取交集，每个分支单独截断。',
        '高次不等式分解后按各因式零点分段看符号。偶重根（如$(x-1)^2$）两侧不变号，但该点使表达式为0，严格不等式里仍要排除；分式不等式的分母零点永不取到。不能直接两边乘含$x$的分母，符号未知会翻错方向。',
        '换元降次要带着限制走：$u=x^2$自带$u\\ge0$，解出$-7<u<3$后要先与$u\\ge0$取交，再还原成$-\\sqrt3<x<\\sqrt3$。跳过这一步会把$u$的负区间误当成$x$的有效区间。',
      ],
      rules: [
        {
          title: '开口向上，大于零取两根外',
          text: '$a(x-r)(x-s)>0$（$a>0$，$r<s$）的解是$x<r$或$x>s$；小于零取中间。',
        },
        {
          title: '偶重根不变号但要排除零点',
          text: '$(x-1)^2(x-4)/x>0$的符号由$(x-4)/x$决定，而$x=1$使分子为0，必须排除。',
        },
        {
          title: '换元带限制',
          text: '令$u=x^2$后解集要与$u\\ge0$取交；令$u=1/x$则$u\\ne0$，还原前不能丢。',
        },
      ],
      pitfalls: [
        '两边直接乘含$x$的分母而不分情况讨论。',
        '四次不等式直接对$x$开方，漏掉负半支区间。',
        '边界该开该闭分不清，把严格不等式的端点收进解集。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-algebra'],
      visual: 'maths2-algebra',
      examFocus: {
        goal: '先找临界值，再按开口与符号定区间；重根不变号，换元带限制。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '换元降次的高次不等式',
            description:
              '令$u=x^2$把四次不等式降为二次，解出$u$的范围后与$u\\ge0$取交，再还原成$x$的区间。',
            reference: '2016、2022 年度真题',
            sourceCodes: ['ENGAA_2016_S1-Q047', 'ESAT_LEGACY_2022_ENGAA_Q031'],
          },
          {
            form: '含重根的高次或分式不等式',
            description:
              '分解后出现偶重根时该点两侧不变号但要按严格性排除；分式中分母零点永不取到，符号表按所有临界点分段。',
            reference: '2017、2019 年度真题',
            sourceCodes: ['ENGAA_2017_S1-Q049', 'NSAA_2019_S1-Q089'],
          },
        ],
        examples: [
          {
            title: '偶重根不变号但要排除零点',
            source: {
              questionCode: 'ENGAA_2017_S1-Q049',
              why: '偶重根不变号但要排除零点',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'A',
            steps: [
              '分子试根$x=1$：$1-6+9-4=0$，分解为$x^3-6x^2+9x-4=(x-1)^2(x-4)$。',
              '分式化为$\\frac{(x-1)^2(x-4)}{x}$；平方因子非负，只在$x=1$处为0。',
              '去掉$x=1$后，符号由$\\frac{x-4}{x}$决定：$x$与$x-4$同号时为正。',
              '得到$x<0$或$x>4$；严格大于0排除0、1、4三个点，选A。',
            ],
            takeaway: '偶重根两侧不变号，但该点本身使分子为0，仍要排除。',
          },
          {
            title: '四次不等式换元后与非负条件取交',
            source: {
              questionCode: 'ESAT_LEGACY_2022_ENGAA_Q031',
              why: '四次不等式换元后与非负条件取交',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'A',
            steps: [
              '令$u=x^2\\ge0$，不等式$x^2(x^2+4)<21$化为$u^2+4u<21$。',
              '因式分解$(u-3)(u+7)<0$，开口向上，小于零取两根之间：$-7<u<3$。',
              '与$u\\ge0$取交集：$0\\le u<3$。',
              '还原成$x$：$x^2<3$即$-\\sqrt3<x<\\sqrt3$，选A。',
            ],
            takeaway: '换元后要带着$u\\ge0$一起走，最后再还原成x的区间。',
          },
        ],
        checklist: [
          '能解释并正确使用：开口向上，大于零取两根外。',
          '能解释并正确使用：偶重根不变号但要排除零点。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120106',
      title: '多项式操作与定理',
      summary: '因式定理把整除翻译成代入求值；余数定理免去长除法。',
      paragraphs: [
        '因式定理：$x-c$是$f(x)$的因式当且仅当$f(c)=0$。二次因式先拆成一次因式：$x^2-x-6=(x-3)(x+2)$是$f$的因式，等价于$f(3)=0$与$f(-2)=0$两条独立方程，正好定两个未知系数。',
        '余数定理：$f(x)$除以$x-c$的余数是$f(c)$，不需要做长除法。除以二次式时余式是一次式$px+q$，可用两根处的函数值列方程；恒等式两边比较同次幂系数也能得到同等数量的条件。',
        '展开、提公因式与多项式除法互为检查：分解完成后重新乘开，核对首项、末项与中间项系数。含参数的多项式求出系数后，先回代验证全部给定条件，再计算题目真正要求的组合。',
      ],
      rules: [
        {
          title: '每个根给一条系数方程',
          text: '$f(3)=0$与$f(-2)=0$是两条独立条件；未知系数有几个，就需要几条。',
        },
        {
          title: '余数定理直接代入',
          text: '$f(x)$除以$x-2$的余数是$f(2)$；余数为0即整除。',
        },
        {
          title: '二次因式先拆根',
          text: '$x^2-x-6$是因素当且仅当$x=3$与$x=-2$都是根，不必做多项式长除。',
        },
      ],
      pitfalls: [
        '代入$x=-2$这类负根时，奇次幂的符号算错。',
        '只用一个根求两个未知系数，条件不足。',
        '求出a、b后忘记题目要的是$a+b$等组合。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-algebra'],
      visual: 'maths2-algebra',
      examFocus: {
        goal: '因式定理把整除翻译成代入求值；余数定理免去长除法。',
        pastPaperSummary:
          '依据当前已导入的2016—2023年度数学2真题，相关考法归纳如下；不以单道例题代表全部考法。',
        pastPaperPatterns: [
          {
            form: '因式定理反求系数',
            description:
              '已知一次或二次因式，把根代入多项式等于零，得到参数的方程组；二次因式先拆成两个一次因式。',
            reference: '2020、2023 年度真题',
            sourceCodes: ['ESAT-2020-MATHS2-001', 'ENGAA_2023_S1-Q021'],
          },
        ],
        examples: [
          {
            title: '二次因式拆成两个根各给一条方程',
            source: {
              questionCode: 'ENGAA_2023_S1-Q021',
              why: '二次因式拆成两个根各给一条方程',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'H',
            steps: [
              '$x^2-x-6=(x-3)(x+2)$，所以3和−2都是三次式$x^3+ax^2+2x+b$的根。',
              '代入$x=3$：$27+9a+6+b=0$，即$9a+b=-33$。',
              '代入$x=-2$：$-8+4a-4+b=0$，即$4a+b=12$。',
              '两式相减得$5a=-45$，$a=-9$；回代得$b=12-4\\times(-9)=48$。',
              '所求$a+b=39$，选H。',
            ],
            takeaway: '二次因式先拆成两个一次因式，每个根提供一条独立的系数方程。',
          },
          {
            title: '两个根代入得参数方程组',
            source: {
              questionCode: 'ESAT-2020-MATHS2-001',
              why: '两个根代入得参数方程组',
              subject: 'mathematics2',
              kind: 'annual',
            },
            question: '',
            answer: 'B',
            steps: [
              '因式定理：$f(1)=1+a+b-12+4=0$，即$a+b=7$。',
              '$f(2)=16+8a+4b-24+4=0$，化简为$2a+b=1$。',
              '两式相减得$a=-6$，回代得$b=13$，选B。',
            ],
            takeaway: '每个已知根就是一条代入方程；常数项与各项符号要逐个带进去。',
          },
        ],
        checklist: [
          '能解释并正确使用：每个根给一条系数方程。',
          '能解释并正确使用：余数定理直接代入。',
          '做题后能指出本节最容易漏掉的条件或符号。',
        ],
      },
    },
    {
      code: '120107',
      title: '函数与常见函数性质',
      summary: '复合由内到外，定义域每层都要查；性质用定义逐条验证。',
      paragraphs: [
        '函数是每个输入对应唯一输出的规则。$f(g(x))$先算内层$g(x)$的值，再作为外层的输入；$f(2x-1)$的输入是$2x-1$整体，不是$x$。分段或分式定义的函数，每一层的定义域限制都要保留：$f(f(x))$中内层$f(x)$本身不能取到使外层分母为零的值。',
        '常见性质用定义验证：奇函数$f(-x)=-f(x)$，偶函数$f(-x)=f(x)$；满足$f(\\alpha x+\\beta y)=\\alpha f(x)+\\beta f(y)$的线性映射必有$f(0)=0$，所以$-5x$线性而$-5x+2$不线性。递增函数保持不等号方向，递减函数反转。',
        '方程$f(f(x))=x$先把复合化简成一个普通方程再求解；用韦达定理统计根的和或积之前，必须确认每个根都落在复合函数各层的定义域内，否则统计会多收。',
      ],
      rules: [
        {
          title: '复合由内到外',
          text: '$f(g(x))$先算内层值再代入外层；两层的定义域限制都要满足。',
        },
        {
          title: '线性映射无截距',
          text: '满足加性与齐性的函数必有$f(0)=0$；常数项会破坏线性。',
        },
        {
          title: '不动点方程照常解',
          text: '$f(f(x))=x$先化成一个方程，用根积关系统计前先查每个根的定义域。',
        },
      ],
      pitfalls: [
        '把$f(g(x))$写成$f(x)\\cdot g(x)$。',
        '只看最外层分母，忽略内层$f(x)$本身的定义域限制。',
        '用韦达定理前没确认方程的根都在定义域内。',
      ],
      sourceIds: ['esat-maths2-spec', 'openstax-algebra', 'openstax-functions'],
      visual: 'maths2-algebra',
      examFocus: {
        goal: '复合由内到外，定义域每层都要查；性质用定义逐条验证。',
        pastPaperSummary:
          '当前已导入的2016—2023年度数学2真题中，未找到以本点为主要考点的年度题。这里用已发布题库题练习，不据此推断往年频率。',
        pastPaperPatterns: [],
        pastPaperNote: '本节例题与自测来自已发布独立试题库，属于题库练习，不标作历年真题。',
        examples: [
          {
            title: '复合分式化简后用根积并查定义域',
            source: {
              questionCode: 'ESAT-M2-AI-V3-8E33FB5BD33D',
              why: '复合分式化简后用根积并查定义域',
              subject: 'mathematics2',
              kind: 'bank',
            },
            question: '',
            answer: 'B',
            steps: [
              '先算复合：$f(f(x))=\\frac{2f(x)+1}{f(x)-1}$，代入$f(x)=\\frac{2x+1}{x-1}$。',
              '分子$2f(x)+1=\\frac{5x+1}{x-1}$，分母$f(x)-1=\\frac{x+2}{x-1}$，所以$f(f(x))=\\frac{5x+1}{x+2}$。',
              '方程$\\frac{5x+1}{x+2}=x$化为$x^2-3x-1=0$。',
              '两根之积由韦达定理为$-1$；两根都不是1或−2，不违反任何一层分母的限制，选B。',
            ],
            takeaway: '复合函数方程先化成一个分式方程；用根积关系前，先确认两根都在定义域内。',
          },
        ],
        checklist: [
          '能解释并正确使用：复合由内到外。',
          '能解释并正确使用：线性映射无截距。',
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
      note: '按数学2代数与函数部分组织：有理指数、根式、二次函数与方程、代入法联立、不等式、多项式定理、函数性质。',
    },
    {
      id: 'openstax-algebra',
      title: 'OpenStax · Elementary Algebra 2e',
      url: 'https://openstax.org/books/elementary-algebra-2e/pages/1-2-use-the-language-of-algebra',
      note: '核对指数律、根式化简与多项式运算；讲解、图解和选题围绕本项目考纲重新组织。',
    },
    {
      id: 'openstax-functions',
      title: 'OpenStax · College Algebra 2e · Functions',
      url: 'https://openstax.org/books/college-algebra-2e/pages/3-1-functions-and-function-notation',
      note: '对照函数记号、复合与定义域的标准处理，本章只按数学2要求选取性质与复合内容。',
    },
    {
      id: 'uat-annual-archive',
      title: 'UAT-UK · ENGAA / NSAA 真题档案',
      url: 'https://esat-tmua.ac.uk/esat-preparation-materials/',
      note: '考法证据来自当前库内2016—2023年度数学2题，不声称覆盖未导入的全部官方档案。',
    },
  ],
}
