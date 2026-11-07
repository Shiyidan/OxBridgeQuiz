// 首页知识图的概念体验题：用于即时反馈，不作为真题、正式题库或个人作答记录。
export type HomeKnowledgeTopic =
  | 'functions'
  | 'domain'
  | 'graph'
  | 'equations'
  | 'composite'
  | 'inequalities'
export type HomePracticeDifficulty = 'easy' | 'medium' | 'hard'

export interface KnowledgePracticeExample {
  title: string
  focus: string
  question: string
  options: [string, string, string, string]
  answerIndex: number
  hint: string
  explanation: string
}

export const practiceDifficultyLabels: Record<HomePracticeDifficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export const knowledgePracticeExamples: Record<
  HomeKnowledgeTopic,
  Record<HomePracticeDifficulty, KnowledgePracticeExample>
> = {
  functions: {
    easy: {
      title: '从输入，找到输出',
      focus: '把函数记号转成一次代入，分清输入与函数值。',
      question: '已知 $f(x)=2x+1$，则 $f(3)$ 等于多少？',
      options: ['$5$', '$6$', '$7$', '$8$'],
      answerIndex: 2,
      hint: '把式子中的每一个 $x$ 换成 $3$。',
      explanation: '$f(3)=2\\times3+1=7$。括号里的数是输入，代入后得到的数才是函数值。',
    },
    medium: {
      title: '定义域改变，值域也改变',
      focus: '检查区间内部的极值，避免只代入两个端点。',
      question: '函数 $f(x)=x^2$ 的定义域为 $[-1,2]$，值域是什么？',
      options: ['$[1,4]$', '$[0,4]$', '$[-1,4]$', '$[0,2]$'],
      answerIndex: 1,
      hint: '区间里包含 $0$。比较 $x=-1,0,2$ 时的函数值。',
      explanation:
        '在 $x=0$ 处取最小值 $0$，在 $x=2$ 处取最大值 $4$，值域为 $[0,4]$。只看端点会漏掉最小值。',
    },
    hard: {
      title: '带着范围，判断最值',
      focus: '先配方，再确认含参数的顶点是否落在指定区间。',
      question: '设 $0<a<2$。当 $x\\in[0,2]$ 时，$f(x)=x^2-2ax$ 的最小值是？',
      options: ['$0$', '$4-4a$', '$a^2$', '$-a^2$'],
      answerIndex: 3,
      hint: '配方得到 $f(x)=(x-a)^2-a^2$。顶点横坐标 $a$ 在区间内吗？',
      explanation: '由于 $0<a<2$，顶点 $x=a$ 在定义域内，平方项可以取到 $0$。所以最小值为 $-a^2$。',
    },
  },
  domain: {
    easy: {
      title: '先排除不能输入的数',
      focus: '从分母不为零出发，找到函数的基本限制。',
      question: '函数 $f(x)=\\frac{1}{x-2}$ 的定义域是什么？',
      options: ['$x\\ne2$', '$x>2$', '$x\\ge2$', '$x\\in\\mathbb{R}$'],
      answerIndex: 0,
      hint: '分式的分母不能等于 $0$。',
      explanation: '$x-2\\ne0$，所以只需排除 $x=2$。小于 $2$ 的数同样可以作为输入。',
    },
    medium: {
      title: '多个条件，取交集',
      focus: '同时检查根号与分母，让每一步运算都有意义。',
      question: '函数 $f(x)=\\frac{\\sqrt{x+1}}{x-2}$ 的定义域是什么？',
      options: ['$x\\ge-1$', '$x>2$', '$x\\ge-1\\text{ 且 }x\\ne2$', '$x\\ne2$'],
      answerIndex: 2,
      hint: '根号内要非负，分母又不能为零；两个条件都要满足。',
      explanation:
        '由 $x+1\\ge0$ 得 $x\\ge-1$，再排除使分母为零的 $x=2$。定义域为 $[-1,2)\\cup(2,+\\infty)$。',
    },
    hard: {
      title: '用符号区间，检查根式',
      focus: '将定义域问题转为分式不等式，并区分零点和无定义点。',
      question: '函数 $f(x)=\\sqrt{\\frac{x-1}{x+2}}$ 的定义域是什么？',
      options: [
        '$[-2,1]$',
        '$(-\\infty,-2)\\cup[1,+\\infty)$',
        '$(-\\infty,-2]\\cup[1,+\\infty)$',
        '$(-2,1]$',
      ],
      answerIndex: 1,
      hint: '在 $-2$ 和 $1$ 两侧检查分式的符号；分母的零点永远不能取。',
      explanation:
        '分式在 $x<-2$ 或 $x\\ge1$ 时非负。$x=1$ 使根号内为零，可以取；$x=-2$ 使分母为零，必须排除。',
    },
  },
  graph: {
    easy: {
      title: '从式子，读出顶点',
      focus: '识别顶点式的平移方向，特别注意括号中的符号。',
      question: '抛物线 $y=(x-1)^2-2$ 的顶点是？',
      options: ['$(-1,-2)$', '$(1,2)$', '$(-1,2)$', '$(1,-2)$'],
      answerIndex: 3,
      hint: '顶点式 $y=a(x-h)^2+k$ 的顶点是 $(h,k)$。',
      explanation: '这里 $h=1$、$k=-2$，所以顶点是 $(1,-2)$。括号中的 $x-1$ 表示向右平移。',
    },
    medium: {
      title: '开口与顶点，一起看',
      focus: '先辨认开口方向，再判断顶点给出最大值还是最小值。',
      question: '对于 $y=-(x+1)^2+4$，下面哪个结论正确？',
      options: [
        '最大值为 $4$，在 $x=-1$ 处取得',
        '最小值为 $4$，在 $x=-1$ 处取得',
        '最大值为 $-4$，在 $x=1$ 处取得',
        '没有最大值',
      ],
      answerIndex: 0,
      hint: '平方项前面的系数为负，抛物线开口向下。',
      explanation:
        '因为 $-(x+1)^2\\le0$，函数值不超过 $4$；当 $x=-1$ 时等号成立。因此顶点给出最大值。',
    },
    hard: {
      title: '把图像位置，转成参数条件',
      focus: '区分“始终在横轴上方”和“与横轴相切”的边界。',
      question: '抛物线 $y=(x-a)^2+a$ 对所有实数 $x$ 都位于横轴上方，$a$ 应满足？',
      options: ['$a\\ge0$', '$a<0$', '$a>0$', '$a\\ne0$'],
      answerIndex: 2,
      hint: '“上方”要求函数的最小值严格大于 $0$。',
      explanation:
        '平方项最小为 $0$，函数最小值是 $a$，所以必须 $a>0$。$a=0$ 时图像与横轴相切，不满足要求。',
    },
  },
  equations: {
    easy: {
      title: '找到图像与横轴的交点',
      focus: '解二次方程时同时保留正、负两个可能的根。',
      question: '方程 $x^2-4=0$ 的实数解是？',
      options: ['仅 $x=2$', '$x=-2\\text{ 或 }x=2$', '$x=-4\\text{ 或 }x=4$', '没有实数解'],
      answerIndex: 1,
      hint: '可分解成 $(x-2)(x+2)=0$。',
      explanation: '两个因式分别为零，得到 $x=2$ 或 $x=-2$。这对应图像与横轴的两个交点。',
    },
    medium: {
      title: '重根，不是两个不同的根',
      focus: '将完全平方与图像相切联系起来，数清不同实根。',
      question: '方程 $x^2-4x+4=0$ 有几个不同的实根？',
      options: ['$0$ 个', '$2$ 个', '无数个', '$1$ 个'],
      answerIndex: 3,
      hint: '把左侧写成完全平方，观察两根是否重合。',
      explanation:
        '原方程等价于 $(x-2)^2=0$，唯一的实根是 $x=2$。这是一个重根，图像与横轴只有一个接触点。',
    },
    hard: {
      title: '换元之后，还要回到原变量',
      focus: '保留新变量范围，并检查每个新根对应几个原方程的根。',
      question: '方程 $x^4-5x^2+4=0$ 有几个不同的实根？',
      options: ['$4$ 个', '$2$ 个', '$3$ 个', '$0$ 个'],
      answerIndex: 0,
      hint: '令 $t=x^2$，先解 $t^2-5t+4=0$，再返回 $x$。',
      explanation:
        '由 $(t-1)(t-4)=0$ 得 $t=1$ 或 $4$，两者都为正。分别得到 $x=\\pm1$、$x=\\pm2$，共四个不同实根。',
    },
  },
  composite: {
    easy: {
      title: '由内向外，走完两步',
      focus: '先算内层函数，再把结果送进外层函数。',
      question: '设 $f(x)=2x$、$g(x)=x+1$，则 $f(g(2))$ 等于多少？',
      options: ['$5$', '$8$', '$6$', '$4$'],
      answerIndex: 2,
      hint: '先求 $g(2)$，再求这个结果的 $f$ 值。',
      explanation: '$g(2)=3$，再计算 $f(3)=6$。复合函数按括号从内到外执行。',
    },
    medium: {
      title: '交换顺序，结果会变',
      focus: '区分先平方再加一，与先加一再平方。',
      question: '设 $f(x)=x^2$、$g(x)=x+1$，则 $g(f(2))$ 等于多少？',
      options: ['$9$', '$5$', '$6$', '$4$'],
      answerIndex: 1,
      hint: '这里先执行的是 $f$，并不是 $g$。',
      explanation: '$f(2)=4$，然后 $g(4)=5$。若反过来算 $f(g(2))$ 才会得到 $9$，两种顺序不能混淆。',
    },
    hard: {
      title: '内层输出，要被外层接受',
      focus: '把外层函数的输入限制，反推到原变量的取值范围。',
      question: '设 $f(x)=\\sqrt{x}$、$g(x)=x^2-4$，则 $f(g(x))$ 的定义域是？',
      options: ['$[-2,2]$', '$[0,+\\infty)$', '$\\mathbb{R}$', '$(-\\infty,-2]\\cup[2,+\\infty)$'],
      answerIndex: 3,
      hint: '外层的平方根要求内层输出 $g(x)\\ge0$。',
      explanation: '需要 $x^2-4\\ge0$，即 $x\\le-2$ 或 $x\\ge2$。端点让根号内等于零，也应包含。',
    },
  },
  inequalities: {
    easy: {
      title: '看清横轴下方的区间',
      focus: '利用两个零点分区，判断二次函数的正负。',
      question: '不等式 $x^2<4$ 的解集是？',
      options: ['$(-2,2)$', '$[-2,2]$', '$(-\\infty,-2)\\cup(2,+\\infty)$', '$(0,2)$'],
      answerIndex: 0,
      hint: '求 $x^2-4$ 的两个零点，再看抛物线在哪一段位于横轴下方。',
      explanation: '在 $-2<x<2$ 时，$x^2-4<0$。原式是严格小于，不能包含两个端点。',
    },
    medium: {
      title: '区间判断，也要保留边界',
      focus: '把因式分解、符号区间与非严格不等号连起来。',
      question: '不等式 $x^2-3x+2\\le0$ 的解集是？',
      options: ['$(1,2)$', '$(-\\infty,1]\\cup[2,+\\infty)$', '$[1,2]$', '$[0,2]$'],
      answerIndex: 2,
      hint: '先分解为 $(x-1)(x-2)$，注意题目允许等于零。',
      explanation:
        '抛物线开口向上，两根之间函数值为负；在 $1$ 和 $2$ 处等于零。因此解集为 $[1,2]$。',
    },
    hard: {
      title: '分母有符号，不能直接乘过去',
      focus: '按零点和无定义点划分区间，分别检查符号。',
      question: '不等式 $\\frac{x-1}{x+2}>0$ 的解集是？',
      options: [
        '$(-2,1)$',
        '$(-\\infty,-2]\\cup[1,+\\infty)$',
        '$(1,+\\infty)$',
        '$(-\\infty,-2)\\cup(1,+\\infty)$',
      ],
      answerIndex: 3,
      hint: '分子与分母同号时分式为正。先按 $-2$ 与 $1$ 分区。',
      explanation:
        '$x<-2$ 时分子分母同为负，$x>1$ 时同为正。$x=-2$ 无定义，$x=1$ 使分式为零，两个端点都不能取。',
    },
  },
}
