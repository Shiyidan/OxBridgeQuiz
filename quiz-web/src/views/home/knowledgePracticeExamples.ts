// 首页知识图精选题快照：2026-11-08 从已发布 Question 选取，保留原题、全部选项及题库解析；不保存个人作答记录。
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
  sourceQuestionCode: string
  question: string
  // 首页专用紧凑题干；原始题库文本仍保留在 question 中。
  displayQuestion?: string
  options: string[]
  answerLabels: string[]
  answerIndex: number
  explanation: string
}
export const practiceDifficultyLabels: Record<HomePracticeDifficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}
// 每个组合固定对应一条可追溯题源；快照更新时同步核对题干、选项顺序、答案和解析。
export const knowledgePracticeExamples: Record<
  HomeKnowledgeTopic,
  Record<HomePracticeDifficulty, KnowledgePracticeExample>
> = {
  functions: {
    easy: {
      title: '奇偶性质，判断必然结论',
      focus: '从定义出发，区分函数性质与个别函数的特例。',
      sourceQuestionCode: 'TMUA-DIRECT-R12-P1-Q017',
      question:
        'Let \\(p\\) be an odd function and \\(q\\) an even function. Which statement must be true?',
      options: [
        '\\(p(x)+q(x)\\) is even',
        '\\(p(x)q(x)\\) is even',
        '\\(q(p(x))\\) is even',
        '\\(p(q(x))\\) is odd',
      ],
      answerLabels: ['A', 'B', 'C', 'D'],
      answerIndex: 2,
      explanation:
        "已知条件:\n- $p$ is an odd function, so $p(-x)=-p(x)$.\n- $q$ is an even function, so $q(-x)=q(x)$.\n\n解题步骤:\n1. For $p(x)+q(x)$, replacing $x$ by $-x$ gives $-p(x)+q(x)$, so the sum is not forced to be even.\n2. For $p(x)q(x)$, replacing $x$ by $-x$ gives $(-p(x))q(x)=-p(x)q(x)$, so the product is odd, not even.\n3. For $q(p(x))$, replacing $x$ by $-x$ gives $q(p(-x))=q(-p(x))=q(p(x))$, so it is even.\n   ※ 偶函数吃到相反数也给同一个值，这是本题正确项的关键。\n4. For $p(q(x))$, replacing $x$ by $-x$ gives $p(q(-x))=p(q(x))$, so it is even in $x$, not necessarily odd.\n\nVerification:\n- Taking $p(x)=x$ and $q(x)=x^2$ shows the rejected claims are not forced.\n\n选项核对:\n- C: correct — $q(p(x))$ is even.\n- A: selects option A, which assumes odd plus even is even, but $p(-x)+q(-x)=-p(x)+q(x)$ has neither required even symmetry nor required odd symmetry.\n- B: selects option B, which calls the product even, although $p(-x)q(-x)=-p(x)q(x)$ is odd.\n- D: selects option D, which transfers the inner even function's output directly to oddness, but $p(q(-x))=p(q(x))$ is even in $x$.\n\n结论:\n因此答案为 C。",
    },
    medium: {
      title: '限制输出，再比较最值',
      focus: '将已知值域转成新表达式的取值范围。',
      sourceQuestionCode: 'TMUA-REMAINING-R4-DIRECT-018',
      question:
        'The range of a function $f$ is $[-2,3]$. Find the difference between the maximum and minimum possible values of $(f(x))^4-5(f(x))^2$.',
      options: [
        '$\\frac{129}{4}$',
        '$\\frac{145}{4}$',
        '$\\frac{153}{4}$',
        '$\\frac{161}{4}$',
        '$\\frac{169}{4}$',
        '$\\frac{177}{4}$',
      ],
      answerLabels: ['A', 'B', 'C', 'D', 'E', 'F'],
      answerIndex: 4,
      explanation:
        "已知条件:\n- The range of a function $f$ is $[-2,3]$. Find the difference between the maximum and minimum possible values of $(f(x))^4-5(f(x))^2$.\n\n解题步骤:\n1. Let $t=f(x)$, so $-2\\le t\\le3$, and define $q(t)=t^4-5t^2$.\n2. Now $q'(t)=2t(2t^2-5)$, giving interior candidates $t=0$ and $t=\\pm\\sqrt{5/2}$.\n3. The minimum is $q(\\pm\\sqrt{5/2})=-25/4$, while the endpoint $t=3$ gives the maximum $36$.\n4. The required difference is $36-(-25/4)=169/4$.\n\nVerification:\n- The required difference is $36-(-25/4)=169/4$.\n\n选项核对:\n- E: is correct: on $[-2,3]$ the maximum is $36$ and the minimum is $-25/4$, giving range width $169/4$.\n- A: does not equal the difference between any correct maximum/minimum candidate pair.\n- B: is six less than the exact numerator $169$ after expressing the width over 4.\n- C: omits $16/4=4$ from the exact width.\n- D: uses a non-minimising value in place of $-25/4$.\n- F: adds $8/4=2$ to the exact width.\n\n结论:\n因此答案为 E。",
    },
    hard: {
      title: '从定义限制，推到值域',
      focus: '配方并换元，分段检查分式函数的输出范围。',
      sourceQuestionCode: 'QB-TMUA-TMUA-MATHS2-00BDEC584858',
      question: 'Determine the range of $f(x)=\\dfrac{x^2-4x+7}{x^2-4x+3}$.',
      options: [
        '$(-\\infty,-3]\\cup(1,\\infty)$',
        '$(-\\infty,1)\\cup[3,\\infty)$',
        '$(-\\infty,-3)\\cup[1,\\infty)$',
        '$[-3,1)$',
        '$\\mathbb R\\setminus\\{1\\}$',
      ],
      answerLabels: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 0,
      explanation:
        '已知条件:\n- Determine the range of $f(x)=\\dfrac{x^2-4x+7}{x^2-4x+3}$.\n\n解题步骤:\n1. Introduce $t=(x-2)^2$ and rewrite the function as $1+4/(t-1)$. Let $t=(x-2)^2\\ge0$.\n2. Retain both $t\\ge0$ and the excluded value $t=1$. Then $f=(t+3)/(t-1)=1+4/(t-1)$ with $t\\ne 1$.\n3. Map the intervals $[0,1)$ and $(1,\\infty)$ through the rational expression. For $0\\le t<1$, $f\\le-3$; for $t>1$, $f>1$.\n4. Combine the two image intervals with correct endpoint inclusion. Therefore the range is $(-\\infty,-3]\\cup(1,\\infty)$.\n   ※ 令平方项为非负新变量，在分母零点处分段映射，并保留可取端点。\n\n选项核对:\n- A: matches $(-\\infty,-3]\\cup(1,\\infty)$.\n- B: map $t\\ge0$ through the fraction without splitting at $t=1$, which produces $(-\\infty,1)\\cup[3,\\infty)$.\n- C: exclude the attainable endpoint $-3$, which produces $(-\\infty,-3)\\cup[1,\\infty)$.\n- D: mistake the interval in $t$ for the range in $f$, which produces $[-3,1)$.\n- E: exclude only the horizontal asymptote and ignore the square constraint, which produces $\\mathbb R\\setminus\\{1\\}$.\n\n结论:\n因此答案为 A。',
    },
  },
  domain: {
    easy: {
      title: '实数范围，先看能否成立',
      focus: '从平方的非负性判断允许的输入范围。',
      sourceQuestionCode: 'QB-TMUA-TMUA-LOGICPROOF-11EF35785678',
      question:
        "Which option gives the largest domain of $x$ for which the statement '$\\exists y\\in\\mathbb R$ such that $y^2=x$' is true for every permitted $x$?",
      options: ['$x<0$', '$x>0$', '$x\\ge0$', '$x\\le0$', '$x\\in\\mathbb Z$'],
      answerLabels: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 2,
      explanation:
        "已知条件:\n- Which option gives the largest domain of $x$ is the statement '$\\exists y\\in\\mathbb R$ such that $y^2=x$' true for every permitted $x$?\n\n解题步骤:\n1. A real square is non-negative, so negative $x$ cannot have a real witness.\n2. For every $x\\ge0$, choosing $y=\\sqrt{x}$ supplies a real witness, including the boundary $x=0$.\n   ※ 答案必须包含边界点并给出见证，例如在边界处验证 $y=0$。\n\n选项核对:\n- C: matches $x\\ge0$.\n- A: Reverses a one-way implication and obtains $x<0$, although the converse is not stated.\n- B: Treats a necessary condition as sufficient and obtains $x>0$, using the implication in an unsupported direction.\n- D: Drops an answer-critical boundary, sign, or exclusivity case and therefore obtains $x\\le0$.\n- E: Stops before the final constraint is combined and therefore settles on $x\\in\\mathbb Z$.\n\n结论:\n因此答案为 C。",
    },
    medium: {
      title: '合并对数，保留原条件',
      focus: '分别检查每个真数，避免变形后扩大定义域。',
      sourceQuestionCode: 'QB-TMUA-TMUA-LOGICPROOF-8ADD6DA59235',
      question:
        'A student writes $\\log(x-1)+\\log(x+1)=\\log(x^2-1)$ and solves $\\log(x^2-1)=0$.\nWhich domain restriction must be imposed on the original equation?',
      options: ['$x\\ne\\pm1$', '$x>-1$', '$x>1$', '$|x|>1$', '$x^2-1>0$ only'],
      answerLabels: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 2,
      explanation:
        '已知条件:\n- A student writes $\\log(x-1)+\\log(x+1)=\\log(x^2-1)$ and solves $\\log(x^2-1)=0$.\nWhich domain restriction must be imposed on the original equation?\n\n解题步骤:\n1. Both logarithm arguments must be positive: $x-1>0$ and $x+1>0$, whose intersection is $x>1$.\n2. Match the derived result to option C.\n\n选项核对:\n- A: excludes zeros but allow negative arguments, giving $x\\ne\\pm1$.\n- B: checks only $x+1$, giving $x>-1$.\n- C: matches $x>1$.\n- D: uses only positivity of the product, giving $|x|>1$.\n- E: replaces two positive factors by a positive product, giving $x^2-1>0$ only.\n\n结论:\n因此答案为 C。',
    },
    hard: {
      title: '多层对数，逐一检查限制',
      focus: '联立对数关系时，同时保留底数与真数的定义条件。',
      sourceQuestionCode: 'TMUA-DIRECT-R12-P2-Q012',
      question:
        'Positive real numbers \\(x,y,z\\) satisfy \\(9\\log_zx=y\\), \\(\\log_xz=y\\), and \\(x+\\log_yz=0\\). How many solutions are there?',
      options: [
        'No solution',
        'Exactly one solution',
        'Exactly two solutions',
        'Exactly three solutions',
        'Finitely many, but more than three',
        'Infinitely many solutions',
      ],
      answerLabels: ['A', 'B', 'C', 'D', 'E', 'F'],
      answerIndex: 1,
      explanation:
        '已知条件:\n- Positive real numbers $x,y,z$ satisfy $9\\log_zx=y$, $\\log_xz=y$, and $x+\\log_yz=0$.\n\n解题步骤:\n1. Let $A=\\log_zx$. Then $\\log_xz=1/A$.\n2. The first two equations give $9A=1/A=y$.\n3. Because $y>0$, take $A=1/3$; hence $y=3$ and $z=x^3$.\n4. Substitute into the last equation to obtain $x+3\\log_3x=0$ for $x>0$.\n5. The function $x+3\\log_3x$ is strictly increasing on $x>0$, tends to $-\\infty$ as $x\\to0^+$, and is positive at $x=1$. It therefore has exactly one root, which fixes one triple.\n\n选项核对:\n- B: correct — Exactly one solution.\n- A: claims no solution even though the reduced continuous function changes sign and is strictly increasing.\n- C: claims two solutions without producing two crossings of the strictly increasing reduced function.\n- D: claims three solutions by counting equations rather than roots of the linked system.\n- E: stops at finiteness instead of using monotonicity to obtain the exact count of one.\n- F: leaves a dependent variable free although $y=3$, $z=x^3$, and the final equation has one root.\n\n结论:\n因此答案为 B。',
    },
  },
  graph: {
    easy: {
      title: '读懂平移的方向',
      focus: '区分自变量内部的平移与函数值的平移。',
      sourceQuestionCode: 'QB-TMUA-MATHEMATICS2-A9FF5CB2398C',
      question:
        'Which statement is equivalent to saying that the graph of $y=f(x-3)+2$ is obtained from the graph of $y=f(x)$?',
      options: [
        'It is translated $3$ units left and $2$ units up.',
        'It is translated $3$ units right and $2$ units up.',
        'It is translated $3$ units right and $2$ units down.',
        'It is stretched horizontally by factor $3$ and translated up $2$ units.',
        'It is reflected in the $y$-axis and translated up $2$ units.',
      ],
      answerLabels: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 1,
      explanation:
        '已知条件:\n- The stem supplies the complete mathematical conditions and requested task: Which statement is equivalent to saying that the graph of $y=f(x-3)+2$ is obtained from the graph of $y=f(x)$.\n\n解题步骤:\n1. Replacing $x$ by $x-3$ translates a graph $3$ units to the right.\n   ※ 这一步的关键关系是 $3$；后续结论必须同时保留这里的条件。\n2. Adding $2$ translates it $2$ units upward.\n   ※ 这一步的关键关系是 $2$；后续结论必须同时保留这里的条件。\n\n选项核对:\n- B: matches It is translated $3$ units right and $2$ units up..\n- A: Reverses the direction of the horizontal translation.\n- C: Reverses the vertical translation.\n- D: Treats a translation inside the argument as a scale change.\n- E: Confuses $x-3$ with replacing $x$ by $-x$.\n\n结论:\n因此答案为 B。',
    },
    medium: {
      title: '交点数量与位置，一起判断',
      focus: '比较水平线、顶点和纵轴截距，判断两个正交点。',
      sourceQuestionCode: 'QB-TMUA-TMUA-MATHS2-3FACC7A26B35',
      question:
        'For which values of $k$ does the line $y=k$ meet $y=x^2-4x+5$ at two distinct points with positive $x$-coordinates?',
      options: ['$k<5$', '$k\\ge1$', '$k>1$', '$k>5$', '$1<k<5$'],
      answerLabels: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 4,
      explanation:
        '已知条件:\n- For which values of $k$ does the line $y=k$ meet $y=x^2-4x+5$ at two distinct points with positive $x$-coordinates?\n\n解题步骤:\n1. Intersections satisfy $(x-2)^2+1=k$, so $x=2\\pm\\sqrt{k-1}$.\n2. Two distinct intersections require $k>1$.\n3. Both $x$-coordinates are positive exactly when $2-\\sqrt{k-1}>0$, giving $k<5$; hence $1<k<5$.\n\n选项核对:\n- A: checks only the root product, giving $k<5$.\n- B: allows a repeated intersection, giving $k\\ge1$.\n- C: checks only the discriminant, giving $k>1$.\n- D: reverses the product condition, giving $k>5$.\n- E: matches $1<k<5$.\n\n结论:\n因此答案为 E。',
    },
    hard: {
      title: '看交点，也看根的位置',
      focus: '用转折点判断交点数量，再结合纵轴截距判断正根个数。',
      sourceQuestionCode: 'TMUA-REMAINING-R4-DIRECT-013',
      question:
        'For which values of $k$ does the equation $2x^3-9x^2-24x+5=k$ have three distinct real roots, exactly two of which are positive?',
      options: [
        '$-112<k<5$',
        '$-107<k<5$',
        '$-107\\le k<5$',
        '$5<k<18$',
        '$-107<k<18$',
        '$-107<k\\le5$',
      ],
      answerLabels: ['A', 'B', 'C', 'D', 'E', 'F'],
      answerIndex: 1,
      explanation:
        "已知条件:\n- $f(x)=2x^3-9x^2-24x+5$, and $f(x)=k$ must have three distinct roots with exactly two positive.\n\n解题步骤:\n1. $f'(x)=6(x+1)(x-4)$, so the local maximum and minimum occur at $x=-1$ and $x=4$, with values $18$ and $-107$.\n2. Three distinct real roots require the strict range $-107<k<18$.\n3. Within this range, the leftmost root is always negative and the rightmost root is always positive.\n4. The middle root lies to the right of zero exactly when $f(0)=5>k$. Thus exactly two roots are positive when $k<5$.\n5. Combining the conditions gives $-107<k<5$.\n\nVerification:\n- At $k=5$, $x=0$ is a root, so there is only one positive root; this endpoint must be excluded.\n\n选项核对:\n- B: correct — $-107<k<5$.\n- A: uses the wrong lower turning level -112, omitting the constant term 5.\n- C: includes $k=-107$, where a turning-point root is repeated.\n- D: places the horizontal line above $f(0)$, so the middle root is negative rather than positive.\n- E: enforces three real roots but not the requirement that exactly two are positive.\n- F: includes $k=5$, where the middle root is zero, not positive.\n\n结论:\n因此答案为 B。",
    },
  },
  equations: {
    easy: {
      title: '方程变形，要保持等价',
      focus: '检查每一步变形是否改变原方程的实数解集。',
      sourceQuestionCode: 'QB-TMUA-TMUA-MATHS2-0A5F3498827B',
      question: 'Over the real numbers, which equation is not equivalent to $x^2-6x+9=0$?',
      options: ['$x=3$', '$(x-3)^2=0$', '$(x-3)^4=0$', '$|x-3|=0$', '$(x-3)(x+3)=0$'],
      answerLabels: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 4,
      explanation:
        '已知条件:\n- Each option is compared with the real solution set of $x^2-6x+9=0$.\n\n解题步骤:\n1. Factor the quadratic as $x^2-6x+9=(x-3)^2$.\n2. The original equation therefore has the single solution $x=3$.\n3. Options A–D each also have the solution set $\\{3\\}$.\n4. Option E has the solution set $\\{-3,3\\}$, so it is not equivalent.\n\n选项核对:\n- A: The original equation is $(x-3)^2=0$, whose only solution is $x=3$, so this equation is equivalent.\n- B: This is the direct factorisation of the original quadratic and has exactly the same solution set.\n- C: An even power is zero exactly when its base is zero, so the solution set remains $\\{3\\}$.\n- D: An absolute value is zero exactly when its argument is zero, so the solution set remains $\\{3\\}$.\n- E: The equation $(x-3)(x+3)=0$ has the extra solution $x=-3$, so it is not equivalent.\n\n结论:\n因此答案为 E。',
    },
    medium: {
      title: '两个正根，需要哪些条件',
      focus: '把判别式、根的和与积放在一起判断。',
      sourceQuestionCode: 'QB-TMUA-TMUA-MATHS2-D9D7CFD9A5B3',
      question:
        'The quadratic $x^2+px+q=0$ has real coefficients. Which condition is necessary and sufficient for it to have two distinct positive roots?',
      options: [
        '$p>0$, $q>0$ and $p^2>4q$',
        '$p<0$, $q>0$ and $p^2>4q$',
        '$p<0$, $q<0$ and $p^2>4q$',
        '$p<0$ and $q>0$',
        '$q>0$ and $p^2\\ge4q$',
      ],
      answerLabels: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 1,
      explanation:
        "已知条件:\n- The quadratic $x^2+px+q=0$ has real coefficients. Which condition is necessary and sufficient for it to have two distinct positive roots?\n\n解题步骤:\n1. Apply Vieta's relations for sum and product. For roots $r,s$, Vieta gives $r+s=-p$ and $rs=q$.\n2. Add the strict discriminant condition for distinct real roots. Two positive roots require $-p>0$ and $q>0$, while distinct reality requires $p^2-4q>0$.\n3. Show the three inequalities also force both roots to be positive. Conversely these three conditions give real roots with positive sum and positive product, so both are positive.\n   ※ 联合韦达关系与严格判别式，既证明必要性也证明这些条件足够排除负根。\n\n选项核对:\n- B: matches $p<0$, $q>0$ and $p^2>4q$.\n- A: use the wrong sign for the sum of roots, which produces $p>0$, $q>0$ and $p^2>4q$.\n- C: use a negative product, which forces opposite signs, which produces $p<0$, $q<0$ and $p^2>4q$.\n- D: omit the discriminant condition, which produces $p<0$ and $q>0$.\n- E: allow a repeated positive root, which produces $q>0$ and $p^2\\ge4q$.\n\n结论:\n因此答案为 B。",
    },
    hard: {
      title: '参数变化，别漏掉降次',
      focus: '分别检查一次方程与二次方程的单根条件。',
      sourceQuestionCode: 'TMUA-STARLIGHT-R4-DIRECT-021',
      question:
        'For how many real values of $k$ does $4kx^2-2(k-1)x+k=0$ have exactly one real solution?',
      options: ['$0$', '$2$', '$3$', '$1$', '$4$'],
      answerLabels: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 2,
      explanation:
        '已知条件:\n- For real k, determine when $4kx^2-2(k-1)x+k=0$ has exactly one real solution.\n\n解题步骤:\n1. When $k=0$, the equation becomes $2x=0$, which has exactly one real solution.\n   ※ 参数使二次项消失时，必须先按一次方程单独检查，不能直接套判别式。\n2. For $k\\ne0$, the equation is quadratic and has exactly one real solution when its discriminant is zero.\n3. The discriminant is $4(k-1)^2-16k^2=4(1-2k-3k^2)$.\n4. Solving $3k^2+2k-1=0$ gives $k=1/3$ or $k=-1$. Together with $k=0$, there are three values.\n\nVerification:\n- All three parameter values leave a nonzero coefficient of x or a repeated quadratic root, so each gives exactly one solution.\n\n选项核对:\n- C: correct — three values.\n- A: rejects all valid discriminant and degenerate cases.\n- B: counts only the two nonzero quadratic cases and omits $k=0$.\n- D: keeps only the linear degeneration or only one discriminant root.\n- E: adds a parameter for which the quadratic has either zero or two real roots.\n\n结论:\n因此答案为 C。',
    },
  },
  composite: {
    easy: {
      title: '函数复合，先后有别',
      focus: '逐层代入，比较不同运算顺序的结果。',
      sourceQuestionCode: 'QB-TMUA-TMUA-MATHS2-82D7B32FCCD9',
      question: 'Let $f(x)=x+1$ and $g(x)=2x$.\nWhich statement is necessarily true?',
      options: [
        '$f(g(x))=2x+2$ and $g(f(x))=2x+1$',
        '$f(g(x))=g(f(x))$',
        'Neither composition is defined for all real $x$',
        'Both compositions equal $3x$',
        '$f(g(x))=2x+1$ and $g(f(x))=2x+2$',
      ],
      answerLabels: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 4,
      explanation:
        '已知条件:\n- Let $f(x)=x+1$ and $g(x)=2x$.\nWhich statement is necessarily true?\n\n解题步骤:\n1. Substituting g(x)=2x into f gives f(g(x))=f(2x)=2x+1.\n2. Substituting f(x)=x+1 into g gives g(f(x))=g(x+1)=2x+2.\n3. Both functions and both compositions are defined for every real x, so option E is the unique correct statement.\n\n选项核对:\n- A: swaps the orders, giving $f(g(x))=2x+2$ and $g(f(x))=2x+1$.\n- B: assumes composition is commutative, giving $f(g(x))=g(f(x))$.\n- C: invents a domain restriction, giving Neither composition is defined for all real $x$.\n- D: adds function formulas instead of composing, giving Both compositions equal $3x$.\n- E: matches $f(g(x))=2x+1$ and $g(f(x))=2x+2$.\n\n结论:\n因此答案为 E。',
    },
    medium: {
      title: '整体性质，能推出哪一层',
      focus: '分析复合函数的单射、满射与各层函数之间的关系。',
      sourceQuestionCode: 'QB-TMUA-TMUA-MATHS2-64193D4E54DC',
      displayQuestion:
        'Let $f:A\\to B$ and $g:B\\to C$. Consider the following statements.\nI  If $g\\circ f$ is injective, then $f$ is injective.\nII  If $g\\circ f$ is surjective, then $g$ is surjective.\nIII  If $f$ is injective and $g$ is surjective, then $g\\circ f$ is bijective.\nWhich of the statements are true?',
      question:
        'Let $f:A\\to B$ and $g:B\\to C$. Consider the following statements.\n\nI  If $g\\circ f$ is injective, then $f$ is injective.\n\nII  If $g\\circ f$ is surjective, then $g$ is surjective.\n\nIII  If $f$ is injective and $g$ is surjective, then $g\\circ f$ is bijective.\n\nWhich of the statements are true?',
      options: [
        'none of them',
        'I only',
        'II only',
        'III only',
        'I and II only',
        'I and III only',
        'II and III only',
        'I, II and III',
      ],
      answerLabels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      answerIndex: 4,
      explanation:
        '已知条件:\n- Functions $f:A\\to B$ and $g:B\\to C$ are given, and statements I–III concern the composition $g\\circ f$.\n\n解题步骤:\n1. If $f(a_1)=f(a_2)$, then $(g\\circ f)(a_1)=(g\\circ f)(a_2)$; injectivity of the composite therefore forces $a_1=a_2$, so I is true.\n2. If $g\\circ f$ is surjective, every $c\\in C$ is the image under $g$ of some element $f(a)\\in B$, so II is true.\n3. Injectivity of $f$ and surjectivity of $g$ do not control the action of $g$ on $f(A)$ enough to make the composite bijective, so III is false.\n4. The true statements are I and II only.\n\n选项核对:\n- A: This represents none of I, II and III, whereas the statement-by-statement test gives I and II only.\n- B: This represents I only, whereas the statement-by-statement test gives I and II only.\n- C: This represents II only, whereas the statement-by-statement test gives I and II only.\n- D: This represents III only, whereas the statement-by-statement test gives I and II only.\n- E: This retains exactly the true statements: I and II only.\n- F: This represents I and III only, whereas the statement-by-statement test gives I and II only.\n- G: This represents II and III only, whereas the statement-by-statement test gives I and II only.\n- H: This represents I, II and III, whereas the statement-by-statement test gives I and II only.\n\n结论:\n因此答案为 E。',
    },
    hard: {
      title: '由外到内，数清原变量的根',
      focus: '把根式看作内外两层函数，换元后逐层检查取值与原像。',
      sourceQuestionCode: 'TMUA-STARLIGHT-R4-DIRECT-005',
      question:
        'For each integer $k$ with $-5\\le k\\le10$, consider the equation $x^2+8x-(k+1)\\sqrt{x^2+8x}+2k=0$. For how many values of $k$ does the equation have exactly four distinct real solutions?',
      options: ['$5$', '$6$', '$7$', '$4$', '$8$', '$10$'],
      answerLabels: ['A', 'B', 'C', 'D', 'E', 'F'],
      answerIndex: 1,
      explanation:
        '已知条件:\n- $k$ is an integer with $-5\\le k\\le10$.\n- The equation is $x^2+8x-(k+1)\\sqrt{x^2+8x}+2k=0$.\n\n解题步骤:\n1. Set $t=\\sqrt{x^2+8x}\\ge0$. The equation becomes $t^2-(k+1)t+2k=0$.\n2. Every permitted value $t\\ge0$ gives two distinct real $x$-values from $x^2+8x=t^2$, and distinct $t$-values give disjoint pairs. Exactly four $x$-solutions therefore require two distinct non-negative $t$-roots.\n   ※ 必须把“两个代换根”与“每个代换根产生两个原变量根”分开计数，并保留 $t=0$。\n3. If $k<0$, the product $2k<0$, so only one $t$-root is non-negative. If $k=0$, the roots are $0$ and $1$, so this case works.\n4. For $k>0$, positive sum $k+1$ and product $2k$ make both real roots positive. They are distinct when $\\Delta=(k+1)^2-8k=k^2-6k+1>0$.\n5. The zeros of the discriminant expression are $3\\pm2\\sqrt2$, so among integers $1\\le k\\le10$ the inequality holds exactly for $k=6,7,8,9,10$.\n6. Including $k=0$, there are six valid values of $k$.\n\nVerification:\n- For each retained $t$, the discriminant of $x^2+8x-t^2=0$ is $64+4t^2>0$.\n\n选项核对:\n- B: correct — the six integers 0, 6, 7, 8, 9 and 10.\n- A: counts only the five positive parameter values and omits $k=0$.\n- C: adds a value from 1 to 5 where the quadratic in $t$ has no two distinct real roots.\n- D: does not include all five positive values satisfying the discriminant inequality.\n- E: includes two inadmissible positive values from 1 to 5.\n- F: incorrectly accepts every positive integer in the stated interval.\n\n结论:\n因此答案为 B。',
    },
  },
  inequalities: {
    easy: {
      title: '判断分母，再移项',
      focus: '确认分母符号，把分式不等式转化为平方关系。',
      sourceQuestionCode: 'TMUA-STARLIGHT-R4-DIRECT-023',
      question: 'For which real numbers $x$ does $\\frac{2x}{x^2+4}\\le\\frac12$ hold?',
      options: ['all real numbers $x$', '$x\\le2$', '$x\\ge2$', '$-2\\le x\\le2$'],
      answerLabels: ['A', 'B', 'C', 'D'],
      answerIndex: 0,
      explanation:
        '已知条件:\n- For which real numbers $x$ does $\\frac{2x}{x^2+4}\\le\\frac12$ hold.\n\n解题步骤:\n1. The denominator $x^2+4$ is positive for every real $x$, so multiplication preserves the inequality.\n2. The inequality becomes $4x\\le x^2+4$, or $(x-2)^2\\ge0$.\n3. This is true for every real $x$.\n\nVerification:\n- This is true for every real $x$.\n\n选项核对:\n- A: correct — The inequality holds for all real numbers $x$.\n- B: It takes only the left side of the square minimum at $x=2$.\n- C: It takes only the right side of the square minimum.\n- D: It confuses $(x-2)^2\\ge0$ with a bounded absolute-value inequality.\n\n结论:\n因此答案为 A。',
    },
    medium: {
      title: '比较条件，判断蕴含关系',
      focus: '将函数不等式转为指数限制，再比较两个条件的范围。',
      sourceQuestionCode: 'QB-TMUA-MATHEMATICS1-884C55D849A0',
      question:
        'For $x>0$, let $f(x)=kx^n$, where $k>0$ and $n$ is real. Consider the following conditions.\n\n$C$: $f(2x)\\leq\\frac12f(x)$ for every $x>0$.\n\n$P$: $f(4x)\\leq\\frac18f(x)$ for every $x>0$.\n\nWhich statement correctly describes the relationship between $C$ and $P$?',
      options: [
        '$C$ is necessary and sufficient for $P$.',
        '$C$ is sufficient but not necessary for $P$.',
        '$C$ is necessary but not sufficient for $P$.',
        '$C$ is neither necessary nor sufficient for $P$.',
        '$C$ and $P$ both hold for every real value of $n$.',
      ],
      answerLabels: ['A', 'B', 'C', 'D', 'E'],
      answerIndex: 2,
      explanation:
        '已知条件:\n- For $x>0$, let $f(x)=kx^n$, where $k>0$ and $n$ is real. Consider the following conditions.\n\n$C$: $f(2x)\\leq\\frac12f(x)$ for every $x>0$.\n\n$P$: $f(4x)\\leq\\frac18f(x)$ for every $x>0$.\n\nWhich statement correctly describes the relationship between $C$ and $P$? The preceding text is the complete visible condition set and requested conclusion.\n\n解题步骤:\n1. Because $x>0$ and $k>0$, $f(x)>0$. Also $f(2x)/f(x)=2^n$, so $C$ is equivalent to $2^n\\leq2^{-1}$, hence to $n\\leq-1$. Similarly, $f(4x)/f(x)=4^n=2^{2n}$, so $P$ is equivalent to $2^{2n}\\leq2^{-3}$, hence to $n\\leq-\\frac32$. Therefore $P$ implies $C$. The converse fails, for example when $n=-1$: then $C$ holds but $P$ does not. Thus $C$ is necessary but not sufficient for $P$, so C is the unique answer.\n   ※ 判断并计算“正比例模型”中的关键关系，区分每个错误选项的首个具体偏差。\n\n选项核对:\n- C: matches $C$ is necessary but not sufficient for $P$..\n- A: Equates the two exponent thresholds and overlooks that $-3/2<-1$.\n- B: Reverses the implication between the nested parameter ranges.\n- D: Checks only that $C$ does not imply $P$ and fails to test the reverse implication.\n- E: Ignores the restrictions on $n$; for example, $n=0$ satisfies neither inequality.\n\n结论:\n因此答案为 C。',
    },
    hard: {
      title: '比较函数，转成符号区间',
      focus: '识别平移后的幂式，通过因式符号确定解集。',
      sourceQuestionCode: 'TMUA-2025-P1-Q17-LR1',
      displayQuestion:
        'The functions $f$ and $g$ are defined by $f(x)=x^3-3\\sqrt2x^2+6x-2\\sqrt2$ and $g(x)=x^2-2\\sqrt2x+2$. For which values of $x$ is $f(x)\\ge g(x)$?\n（来源：2025年回忆）',
      question:
        'The functions $f$ and $g$ are defined by\n\n$$f(x)=x^3-3\\sqrt2x^2+6x-2\\sqrt2$$\n\nand\n\n$$g(x)=x^2-2\\sqrt2x+2.$$\n\nFor which values of $x$ is $f(x)\\ge g(x)$?\n\n（来源：2025年回忆）',
      options: [
        '$x\\le\\sqrt2$',
        '$x=\\sqrt2$ only',
        '$x\\ge\\sqrt2$',
        '$x=\\sqrt2$ or $x\\ge\\sqrt2+1$',
        '$x\\le\\sqrt2$ or $x\\ge\\sqrt2+1$',
        '$\\sqrt2\\le x\\le\\sqrt2+1$',
      ],
      answerLabels: ['A', 'B', 'C', 'D', 'E', 'F'],
      answerIndex: 3,
      explanation:
        '已知条件:\n- The functions $f$ and $g$ are defined by $$f(x)=x^3-3\\sqrt2x^2+6x-2\\sqrt2$$ and $$g(x)=x^2-2\\sqrt2x+2.$$ For which values of $x$ is $f(x)\\ge g(x)$.\n\n解题步骤:\n1. $f(x)=(x-\\sqrt2)^3$ and $g(x)=(x-\\sqrt2)^2$.\n2. Let $t=x-\\sqrt2$. The inequality is $t^3\\ge t^2$.\n3. Rearranging gives $t^2(t-1)\\ge0$.\n4. Since $t^2\\ge0$, the product is non-negative when $t=0$ or $t\\ge1$.\n5. Thus $x=\\sqrt2$ or $x\\ge\\sqrt2+1$, selecting D.\n\nVerification:\n- At $x=\\sqrt2$, both functions are $0$; at $x=\\sqrt2+1$, both are $1$; a point between them makes $t^2(t-1)<0$.\n\n选项核对:\n- D: correct — $x=\\sqrt2$ or $x\\ge\\sqrt2+1$.\n- A: For $x<\\sqrt2$, $t<0$ and $t^2(t-1)<0$, so this entire left interval fails except the endpoint.\n- B: $x=\\sqrt2$ is valid, but every $x\\ge\\sqrt2+1$ is also valid.\n- C: For $\\sqrt2<x<\\sqrt2+1$, $0<t<1$ gives $t^2(t-1)<0$.\n- E: The branch $x<\\sqrt2$ makes $t-1<0$ while $t^2>0$, so it must be excluded.\n- F: This interval is precisely where the product is negative apart from the two endpoints.\n\n结论:\n因此答案为 D。',
    },
  },
}
