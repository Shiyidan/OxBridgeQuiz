// 数学1代数前四节：记号与术语简写，重点解释指数条件、代入符号和分配律的使用。
import type { KnowledgeMethodArticle } from './types'

export type AlgebraFoundationCode = '110401' | '110402' | '110403' | '110404'
interface AlgebraFoundationLesson extends KnowledgeMethodArticle {
  summary: string
  memory: string[]
}

export const algebraFoundationsMethods: Record<AlgebraFoundationCode, AlgebraFoundationLesson> = {
  '110401': {
    summary: '认清乘法、乘方和分组；写式子时保留原来的运算顺序。',
    intro: '字母表示数或数量。代数记号只是把运算写得更简洁，先读清每个符号作用于哪一部分。',
    blocks: [
      {
        title: '常用记号，一眼读懂',
        table: {
          caption: '数字系数通常写在字母前；分母不能为 0。',
          columns: ['记号', '含义', '容易混淆的写法'],
          rows: [
            [
              String.raw`$3x$`,
              String.raw`$3\times x=x+x+x$`,
              String.raw`不是 $x^3$，也不是 $3+x$。`,
            ],
            [String.raw`$ab$`, String.raw`$a\times b$`, '通常表示乘积，不是把两个数字拼成两位数。'],
            [
              String.raw`$a^2b$`,
              String.raw`$a\times a\times b$`,
              String.raw`只有 $a$ 平方；$(ab)^2$ 中两个因子都平方。`,
            ],
            [
              String.raw`$\dfrac ab$`,
              String.raw`$a\div b$`,
              String.raw`分子是被除数；一般不能换成 $b/a$。`,
            ],
            [String.raw`$2(a+b)$`, '先求和，再把整个和乘 2', String.raw`与 $2a+b$ 不同。`],
          ],
        },
      },
      {
        title: '整体用括号，除法看分数线',
        paragraphs: [
          String.raw`$\dfrac{a+b}{c}$ 表示整个 $a+b$ 除以 $c$；$a+\dfrac bc$ 只把 $b$ 除以 $c$。括号和分数线都决定了运算范围。`,
          String.raw`把文字写成式子时，**先确定谁比谁多、谁除以谁**。“5 less than $x$”写成 $x-5$；“$x$ 与 $y$ 的和的一半”写成 $(x+y)/2$。`,
        ],
      },
    ],
    memory: [
      String.raw`$3x$ 是乘积，$x^3$ 是乘方；$a^2b$ 只平方 $a$。`,
      '**括号与分数线保留整体**；减法、除法不能随意调换对象。',
    ],
  },
  '110402': {
    summary: '先识别底数和运算，再处理指数；负幂取倒数，分数幂联系根式。',
    intro:
      '**相乘加指数，相除减指数，幂的幂乘指数。**这些规则各有前提，不能用于加法，也不能漏掉括号中的系数。',
    blocks: [
      {
        title: '先看运算，再选指数律',
        table: {
          caption: '下表先按整数指数理解；出现分母、零次幂或负幂时，相应底数须非零。',
          columns: ['运算', '关系', '使用条件或区别'],
          rows: [
            ['同底数相乘', String.raw`$a^m a^n=a^{m+n}$`, '底数相同，合并指数；不是把底数相加。'],
            ['同底数相除', String.raw`$a^m/a^n=a^{m-n}$`, String.raw`$a\ne0$；指数按分子减分母。`],
            ['幂的幂', String.raw`$(a^m)^n=a^{mn}$`, '外层指数乘到内层指数，不是相加。'],
            ['乘积的幂', String.raw`$(ab)^n=a^n b^n$`, '每个因子都乘方，包括数字系数。'],
            ['商的幂', String.raw`$(a/b)^n=a^n/b^n$`, String.raw`$b\ne0$；负幂时还要求 $a\ne0$。`],
          ],
        },
        note: String.raw`==指数律处理乘积，不处理和。==例如 $a^2+a^3$ 不能写成 $a^5$；$(a+b)^2$ 也不是 $a^2+b^2$。`,
      },
      {
        title: '零次幂、负幂、分数幂分别表示什么',
        table: {
          caption: '分数幂关系先在正底数 a > 0 下使用，n 为正整数；负底数须另查实数根的条件。',
          columns: ['形式', '含义', '直接应用'],
          rows: [
            [
              '零次幂',
              String.raw`$a^0=1\quad(a\ne0)$`,
              String.raw`同一个非零量相除为 1，不是 0。不能据此给 $0^0$ 赋值。`,
            ],
            [
              '负整数幂',
              String.raw`$a^{-k}=1/a^k$`,
              String.raw`$2^{-3}=1/8$；负指数不代表结果为负数。`,
            ],
            [
              '单位分数幂',
              String.raw`$a^{1/n}=\sqrt[n]{a}$`,
              String.raw`$16^{1/4}=2$；根号的次数来自指数分母。`,
            ],
            [
              '一般分数幂',
              String.raw`$a^{m/n}=(\sqrt[n]{a})^m$`,
              String.raw`$27^{-2/3}=(\sqrt[3]{27})^{-2}=1/9$。`,
            ],
          ],
        },
        paragraphs: [
          String.raw`分数幂常可**先开根，再乘方**，避免计算大数。指数为负时再取倒数；偶次根在实数范围要求被开方数非负，分母或负幂不能取 0。`,
          String.raw`平方根表示非负主值，因此 $\sqrt{x^2}=|x|$。只有知道 $x\ge0$，才可直接写成 $x$；例如 $x=-3$ 时结果是 3。`,
        ],
      },
      {
        title: '混合字母式：系数与各底数分开处理',
        formula: String.raw`$\dfrac{(2x^{-1}y^2)^3}{4x^2y}=2x^{-5}y^5=\dfrac{2y^5}{x^5}\qquad(x,y\ne0)$`,
        table: {
          caption: '先处理括号外的三次方，再按各底数合并；始终保留原式的非零条件。',
          columns: ['部分', '计算', '结果'],
          rows: [
            ['数字系数', String.raw`$2^3/4$`, '2'],
            [String.raw`$x$ 的指数`, String.raw`$(-1)\times3-2$`, '−5'],
            [String.raw`$y$ 的指数`, String.raw`$2\times3-1$`, '5'],
          ],
        },
        paragraphs: [
          String.raw`遇到 $8^u\times4^v$，先统一为 $2^{3u}\times2^{2v}=2^{3u+2v}$。底数尚不相同时，不能直接把原来的两个指数相加。`,
        ],
      },
    ],
    memory: [
      '**同底相乘加指数、相除减指数；幂的幂乘指数。**',
      '**负幂取倒数，分数幂看根式**；零次幂等于 1 要求底数非零。',
      String.raw`**外幂作用于每个因子，包括系数。**一般有 $\sqrt{x^2}=|x|$。`,
    ],
  },
  '110403': {
    summary: '术语认清对象；代入负数加括号，公式先统一单位并检查分母。',
    intro:
      '这一节主要是读懂题目的用词，并把给定数值准确放进表达式。术语不需要长篇记忆，能区分下列对象即可。',
    blocks: [
      {
        title: '术语速查',
        table: {
          caption: '项按最外层加减划分；因式看乘法结构。',
          columns: ['术语', '含义', '例子'],
          rows: [
            ['表达式 · expression', '由数、字母和运算组成的式子', String.raw`$3x+2$`],
            ['方程 · equation', '要求未知量满足的等式', String.raw`$3x+2=11$`],
            ['公式 · formula', '表示量之间关系的式子', String.raw`$s=vt$`],
            ['恒等式 · identity', '在允许取值内始终成立的等式', String.raw`$2(x+1)\equiv2x+2$`],
            ['不等式 · inequality', '用大小关系连接两边', String.raw`$2x+1<7$`],
            [
              '项 · term',
              '加减运算中的各部分，连同符号识别',
              String.raw`$3x^2-2x+5$ 的三项是 $3x^2$、$-2x$、$5$。`,
            ],
            [
              '因式 · factor',
              '乘积中的各部分',
              String.raw`$3x(x+2)$ 可看作 $3$、$x$、$(x+2)$ 的乘积。`,
            ],
          ],
        },
      },
      {
        title: '把数值整体代入，负数先加括号',
        formula: String.raw`$x=-3,\ y=2:\qquad -x^2+2xy=-(-3)^2+2(-3)(2)=-21$`,
        paragraphs: [
          String.raw`**乘方先于括号外的负号。**此时 $x^2=9$、$-x^2=-9$，而 $(-x)^2=9$。分数代入幂中也要保留括号，不能只把分子乘方。`,
          String.raw`代入前先看原式是否有意义：例如 $x=2$ 不能代入 $1/(x-2)$ 得到数值。若含平方根，也要检查被开方数；不要在无定义处继续计算。`,
        ],
      },
      {
        title: '公式代入：单位、位置和任务要对应',
        paragraphs: [
          String.raw`科学公式先统一单位。用 $s=vt$，若时间为秒、距离要米，就把 $72\,\mathrm{km/h}$ 换成 $20\,\mathrm{m/s}$，再乘时间；不能直接拿 72 与秒数相乘。`,
          String.raw`“求表达式的值”是替换后计算；“求未知量”则要解条件。点 $(3,7)$ 在直线 $y=ax+b$ 上，表示 $x=3,y=7$，因此得到 $3a+b=7$，而不是把两个坐标都代给 $x$。`,
        ],
        note: String.raw`函数记号 $f(2)$ 表示把输入 2 代入 $f$ 的规则，**不是 $f\times2$**；题目另定义运算符时，按给定规则代入。`,
      },
    ],
    memory: [
      '**项看加减，因式看乘积**；表达式求值与方程求解不同。',
      '**负数、分数整体代入再乘方**；括号外的负号最后处理。',
      '**先统一单位，先查分母和根式条件**；坐标按 x、y 对应代入。',
    ],
  },
  '110404': {
    summary: '同类项合系数；展开保证每项相乘，提公因式保留共同结构。',
    intro:
      '化简不等于一律展开。需要按幂次比较时展开合并；出现共同乘法部分时，先提出来通常更省运算。',
    blocks: [
      {
        title: '同类项只合系数，不改变字母部分',
        formula: String.raw`$4xy-3x+2yx+x=6xy-2x$`,
        paragraphs: [
          String.raw`$xy$ 与 $yx$ 是同一个字母部分，可以合并；$x$ 与 $x^2$、$xy$ 与 $xy^2$ 则不是同类项。整理时把每一项连同前面的正负号一起移动。`,
        ],
      },
      {
        title: '展开：每项都乘到，减号作用于整个括号',
        formula: String.raw`$k(a+b)=ka+kb,\qquad(a+b)(c+d)=ac+ad+bc+bd$`,
        paragraphs: [
          String.raw`括号前为负数时，每一项都要乘这个负数。例如 $5x-(2x-3)=5x-2x+3=3x+3$；不能只把第一项改号。`,
          String.raw`两个括号各取一项配对相乘，再合并同类项。特别是平方：$(a+b)^2=a^2+2ab+b^2$，$(a-b)^2=a^2-2ab+b^2$，**交叉项不能省略**。`,
        ],
        diagram: true,
      },
      {
        title: '多个括号逐次处理，共同因式先保留',
        paragraphs: [
          String.raw`三个或更多括号，先乘两个并合并，再把结果的每一项乘进下一个括号。例如 $(x+1)(x+2)(x+3)=(x^2+3x+2)(x+3)=x^3+6x^2+11x+6$。`,
          String.raw`若同一个括号反复出现，可以先把它当作整体：$7x(x+2)-3(x+2)=(x+2)(7x-3)$。此时先提共同括号，通常比全部展开后再分解更短。`,
        ],
      },
      {
        title: '提公因式：每项都有，括号内要除干净',
        formula: String.raw`$12x^3y-18x^2y^2=6x^2y(2x-3y)$`,
        paragraphs: [
          '数字取最大公因数；字母只取每一项都有的部分，指数取这些项中的最小值。上式取出 6、两个 x 和一个 y，括号内分别留下 2x 与 −3y。',
          String.raw`**某一项被完整提出后，括号内留下 1，不是 0。**例如 $6x^2+6x=6x(x+1)$。最后乘回去检查每一项的系数、指数和符号。`,
        ],
        note: '展开是把积写成和，提公因式是把和写成积；根据下一步需要选择方向，不必为了“化简”反复来回改写。',
      },
    ],
    memory: [
      '**同类项的字母及指数相同**，只合并系数。',
      '**括号前的负号作用于每一项；平方保留交叉项。**',
      '**公因式每项都有，完整提出后留下 1**；乘回去核对。',
    ],
  },
}
