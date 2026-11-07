// 数学1相似、三角比与向量讲义：把判定条件、推理步骤及适用边界连接起来。
import type { GeometryMethodLesson } from './coordinateTransformMethods'

export const similarityMethods: GeometryMethodLesson = {
  title: '先证明对应关系，再决定比例用几次方',
  introduction: '相似不是“看起来同形”。先建立足够的判定条件，固定对应顶点，再让长度、面积和体积各自使用正确的倍率。',
  route: ['判定关系', '固定对应', '转换比例'],
  sections: [
    {
      title: '全等与相似：结论需要哪些条件',
      items: [
        { title: '全等', text: '全等指形状、大小相同。三角形可用 SSS、SAS、ASA、AAS 或 RHS 判定；SAS 要夹角，RHS 要直角、斜边和一条对应直角边。' },
        { title: '相似', text: '相似允许整体缩放。三角形用 AA、三边对应成比例，或两边成比例且夹角相等判定；只有两边比例不够。全等的相似比为 1。' },
        { title: '先识别“不够用”的信息', text: 'AAA 只能判三角形相似，不能判全等；一般的 SSA 可能产生两个三角形。多边形不能照搬三角形 AA：两个矩形的角都相等，长宽比仍可能不同。' },
      ],
      note: '==判据先于比例式==。不能先假设相似，算出边长后再用结果证明原来的假设。',
    },
    {
      title: '对应边不是按左右或长短随意配对',
      reasoningDiagram: 'similarity',
      items: [
        { title: '由等角决定顶点顺序', formula: '$\\triangle ABC\\sim\\triangle DEF\\Rightarrow\\dfrac{DE}{AB}=\\dfrac{EF}{BC}=\\dfrac{DF}{AC}=k$', text: '先标 A 对 D、B 对 E、C 对 F，再按两个端点确定对应边。图形旋转、翻转或互相重叠时，画面上的上边未必对应上边。' },
        { title: '嵌套图形先找共有角和平行线', text: '三角形内部有一条平行于底边的截线时，共有顶角加对应角相等提供 AA。交叉图形可以利用对顶角，但还要找到第二对等角；只有一个对顶角不够。' },
        { title: '所有比例式保持同一个方向', text: '若第一项写“像 / 原”，后面的边、高和周长都按这个方向写。已知整边和部分长度时先统一范围，例如小边与整边的比不能直接当成上段与下段的比。' },
      ],
      note: '==先写顶点对应，再写边的比例==；一旦倒置比例，后续平方、立方都会跟着出错。',
    },
    {
      title: '面积与体积：先还原到长度层',
      items: [
        { title: '为何面积平方、体积立方', formula: '$L_2/L_1=k,\\quad S_2/S_1=k^2,\\quad V_2/V_1=k^3$', text: '相似时，每个线性方向都乘 k。底和高各乘一次，面积便乘两次；立体的三个方向各乘一次，体积便乘三次。若只改变一个尺寸，不能直接使用平方或立方规律。' },
        { title: '反推时先开方，再进入目标层', formula: '$S_2/S_1=q\\Rightarrow k=\\sqrt q\\Rightarrow V_2/V_1=q^{3/2}$', text: '面积比为 9:4，长度比为 3:2；若比较的是相似立体，其体积比为 27:8。表面积与体积之间的转换同样要求立体相似，不能只根据表面积大小推体积。' },
        { title: '百分比、质量和成本还要加上条件', text: '长度增加 20%，面积变成 $1.2^2=1.44$ 倍，即增加 44%。同密度时质量随体积变化；固定单位面积的涂料成本随面积变化。单价或密度不同，就要另外乘对应比值。' },
      ],
      note: '==先问“这是什么量”，再决定倍率==。相同面积不保证相似，相同体积也不保证形状相同。',
    },
    {
      title: '截去一部分：先算整体中的占比',
      reasoningDiagram: 'area-cut',
      items: [
        { title: '平行截线：小三角形与整体相似', formula: '$AD/AB=t\\Rightarrow S_{ADE}/S_{ABC}=t^2$', text: 'D、E 分别在 AB、AC 上且 DE 平行 BC。线性比 t 是从共同顶点量到截线的长度占整边的比例；若给 $AD:DB=m:n$，应先换成 $t=m/(m+n)$。' },
        { title: '剩余区域用相减，不用差的平方', formula: '$S_{DBCE}/S_{ABC}=1-t^2$', text: '剩余梯形不是原三角形按 $1-t$ 缩放得到的相似图形，所以面积比不是 $(1-t)^2$。小三角形与梯形的面积比应写为 $t^2:(1-t^2)$。' },
        { title: '同高面积比与相似面积比要区分', text: '两个三角形若具有相同的垂直高度，面积比等于底边比，不需要平方。只有两图形相似、底和高同时按同一比例变化时，面积比才是长度比的平方。' },
      ],
      note: '==同高看底比，相似看平方；剩余部分先相减==。比例的分母究竟是整体还是剩余部分，必须写清。',
    },
  ],
  checks: ['判据是否足够？夹角、直角及对应边是否核对？', '分子分母是否始终沿同一对应方向？部分与整体有没有混用？', '题目给的是长度、面积还是体积比？相似前提是否成立？', '同高区域、剩余区域及价格质量条件是否分别处理？'],
  memory: ['判定后再对应：三角形 AA 判相似，AAA 不能判全等。', '长度比 k，面积比 k²，体积比 k³；反推先回到长度层。', '平行截线剩余面积占比为 1−t²，不是 (1−t)²。', '同高三角形面积比等于底比；质量和成本还要核对密度与单价。'],
}

export const trigonometryMethods: GeometryMethodLesson = {
  title: '选一个只连接已知量与目标量的三角比',
  introduction: '三角比的用途是把角度转成边的比例。先找直角、指定参考角，再决定是否需要求角；很多题只需比例和勾股关系。',
  route: ['认准参考角', '连接两条边', '保留精确关系'],
  sections: [
    {
      title: '认边与选择三角比',
      reasoningDiagram: 'trig-sides',
      items: [
        { title: '对边、邻边、斜边', text: '斜边对着直角；对边正对参考角，邻边是紧靠参考角的直角边。换另一个锐角时，对、邻互换，斜边不变。' },
        { title: '只含所需两条边的比，通常最直接', formula: '$\\sin\\theta=\\dfrac{\\text{对}}{\\text{斜}},\\quad\\cos\\theta=\\dfrac{\\text{邻}}{\\text{斜}},\\quad\\tan\\theta=\\dfrac{\\text{对}}{\\text{邻}}$', text: '已知斜边求邻边用 cos，已知邻边求对边用 tan。优先选直接包含已知边和目标边的比，避免多算第三边。' },
        { title: '未知量在分母，变形时尤其要检查', formula: '$\\sin\\theta=a/c\\Rightarrow c=a/\\sin\\theta$', text: '对锐角，sin 和 cos 都在 0 与 1 之间。由直角边反求斜边应得到更长的边；若算得斜边更短，可立刻发现把除法写成乘法的错误。' },
      ],
      note: '==参考角改变，对边和邻边交换==。使用三角比前必须已有直角三角形。',
    },
    {
      title: '给出一个三角比，先恢复边的比例',
      items: [
        { title: '给正切：设两直角边，不急着求角', formula: '$\\tan\\theta=p/q\\Rightarrow (\\text{对},\\text{邻},\\text{斜})=\\lambda(p,q,\\sqrt{p^2+q^2})$', text: '对锐角可取 $p,q,\\lambda>0$。比例只决定形状，实际边长还需要一个长度条件确定尺度 λ；给斜边时，直接用它除以 $\\sqrt{p^2+q^2}$。' },
        { title: '给正弦：斜边与对边确定第三边', formula: '$\\sin\\theta=p/q\\Rightarrow \\cos\\theta=\\dfrac{\\sqrt{q^2-p^2}}{q}$', text: '这里要求 $0<p<q$ 且 θ 为锐角。把对边和斜边设为 p、q 的同倍数，用勾股作减法求邻边；取正根是因为讨论的是边长。' },
        { title: '只问面积，可以直接停在尺度的平方', formula: '$S=\\tfrac12pq\\lambda^2$', text: '若前一步已求出 $\\lambda^2$，面积直接代入即可，不必先开方得到 λ 再相乘。先看目标需要长度还是长度平方，能省去一轮根式运算。' },
      ],
      note: '==三角比确定形状，已知长度确定尺度==。无需角度数值时，不要为了求角增加步骤。',
    },
    {
      title: '精确值与互余关系：用结构减轻记忆',
      items: [
        { title: '用两种特殊三角形恢复精确值', text: '$30^\\circ,60^\\circ,90^\\circ$ 的边比为 $1:\\sqrt3:2$，最短边对 $30^\\circ$；$45^\\circ,45^\\circ,90^\\circ$ 的边比为 $1:1:\\sqrt2$。因此 $\\sin30^\\circ=1/2$、$\\cos30^\\circ=\\sqrt3/2$、$\\tan30^\\circ=1/\\sqrt3$；$\\sin45^\\circ=\\cos45^\\circ=\\sqrt2/2$、$\\tan45^\\circ=1$。' },
        { title: '互余角交换对边与邻边', formula: '$\\sin\\theta=\\cos(90^\\circ-\\theta)$', text: '于是 $\\sin60^\\circ=\\sqrt3/2$、$\\cos60^\\circ=1/2$、$\\tan60^\\circ=\\sqrt3$。对两个互余锐角，正切互为倒数；这一关系来自同一个直角三角形的边角色互换。' },
        { title: '边界值要记住，但不能画成普通三角形', text: '$\\sin0^\\circ=0$、$\\cos0^\\circ=1$、$\\tan0^\\circ=0$；$\\sin90^\\circ=1$、$\\cos90^\\circ=0$，$\\tan90^\\circ$ 无定义。0° 和 90° 是边界值，不是非退化直角三角形中的锐角。' },
      ],
      note: '==根式保留到最后==；不要把 $1/\\sqrt3$ 近似成小数再参与精确值运算。',
    },
    {
      title: '图里没有现成直角，先构造共享量',
      reasoningDiagram: 'shared-height',
      items: [
        { title: '一般三角形：作高拆开条件', text: '从顶点作垂线，原来的斜边可能成为某个小直角三角形的斜边。注意垂足可能在底边延长线上，此时底边关系可能是两段之差，不能一律相加。' },
        { title: '两个观测点：用共同高度连接', formula: '$h=d\\tan\\alpha=(d+s)\\tan\\beta$', text: '两个观测点在目标同一侧、处于同一水平面且相距 s，近点到垂足距离为 d。把共同高度写两遍便能消去 h；若观测点分居两侧，应按实际位置重新列水平距离关系。' },
        { title: '空间图只负责找到正确的直角截面', text: '线与水平面的夹角，要用斜线与其在平面内的投影构成的角。先求投影长度，再在斜线、投影与垂直高度组成的直角三角形中使用三角比，不直接把任意底边当邻边。' },
      ],
      note: '==先找共享高度、共享边或投影，再列比==。仰角与俯角以水平线为基准，视线长度不是水平距离。',
    },
  ],
  checks: ['直角在哪里？对边和邻边是否相对当前参考角？', '选用的三角比是否直接包含已知量和目标量？', '所需的是角度、长度还是面积？是否能避免多余开方？', '水平距离、视线、投影和测量高度是否区分？结果大小是否合理？'],
  memory: ['先认直角和参考角，再认对、邻、斜；换参考角时对邻交换。', '给三角比先恢复边比；给一条长度再确定整体尺度。', '互余角 sin 与 cos 互换；tan90° 无定义，根式尽量保留。', '共高问题把同一高度写两遍，空间问题先找正确投影。'],
}

export const vectorReasoningMethods: GeometryMethodLesson = {
  title: '用有方向的路径，把图形关系写成可验证的等式',
  introduction: '向量计算的终点是几何结论。先统一起点与方向，用分点或两条路径建立关系，最后说明它如何证明平行、共线或交于某点。',
  route: ['统一方向', '建立等式', '说明几何结论'],
  sections: [
    {
      title: '向量的基本关系',
      reasoningDiagram: 'vector-path',
      items: [
        { title: '终点减起点', formula: '$\\overrightarrow{OA}=\\mathbf a,\\quad\\overrightarrow{OB}=\\mathbf b\\Rightarrow\\overrightarrow{AB}=\\mathbf b-\\mathbf a$', text: '位移等于终点的位置向量减起点的位置向量；两者必须以同一个原点为基准。' },
        { title: '加法要求首尾衔接，减法保留方向', formula: '$\\overrightarrow{AB}+\\overrightarrow{BC}=\\overrightarrow{AC}$', text: '沿路径首尾相接作加法，反向经过一段则变号：$\\overrightarrow{CB}=-\\overrightarrow{BC}$。闭合一圈的向量和为零。' },
        { title: '数乘缩放大小，也可能反转方向', formula: '$|k\\mathbf v|=|k|\\,|\\mathbf v|$', text: '$k<0$ 表示反向，$k=0$ 得到零向量。向量和的长度通常不等于各向量长度之和；只有同向时，沿同一直线前进的路程才等于位移大小。' },
      ],
      note: '==沿箭头加，逆箭头减==。求位移要保留方向，求距离最后才取长度。',
    },
    {
      title: '分点先化成整段的份额，再写位置',
      reasoningDiagram: 'vector-section',
      items: [
        { title: '内分比例的分母是总份数', formula: '$AP:PB=m:n\\Rightarrow\\overrightarrow{AP}=\\dfrac{m}{m+n}\\overrightarrow{AB}$', text: '这里 P 在线段 AB 内，且 $m,n>0$。$m/n$ 比较的是两段，不是 AP 与整段 AB；先求份额可以防止把局部比直接用在整段上。' },
        { title: '分点位置由起点加位移得到', formula: '$\\mathbf p=\\mathbf a+\\dfrac{m}{m+n}(\\mathbf b-\\mathbf a)=\\dfrac{n\\mathbf a+m\\mathbf b}{m+n}$', text: '不要死记权重方向：从 A 出发走整段的 $m/(m+n)$。当 m 很小时，P 应靠近 A，因此 A 的权重较大；这可以快速验算系数有没有放反。' },
        { title: '延长线上的点要用有符号参数', formula: '$\\mathbf p=\\mathbf a+t(\\mathbf b-\\mathbf a)$', text: '$0<t<1$ 在 A、B 之间，$t>1$ 越过 B，$t<0$ 在 A 外侧。P 在延长线上时，不能直接套用内分公式；先根据方向写 t，再结合长度比求它。' },
      ],
      note: '==先定位点在线段内还是延长线上==；比例的正数不代表每条向量都同向。',
    },
    {
      title: '平行不等于共线：证明要补足起点关系',
      items: [
        { title: '向量互为倍数先给出平行', formula: '$\\mathbf u=k\\mathbf v\\quad(k\\ne0)$', text: '当两向量都非零时，互为倍数说明方向平行。若它们分别位于两条不同直线上，尚不能说明四个端点共线。' },
        { title: '同一起点的倍数关系才能直接推出三点共线', formula: '$\\overrightarrow{AP}=t\\overrightarrow{AB}$', text: '在 $A\\ne B$ 的前提下，P 落在直线 AB 上；若还要求 P 在线段内部，必须进一步得到 $0<t<1$。证明不能停在“存在 t”，还应说明它对应的点的位置。' },
        { title: '等向量可以直接证明平行四边形', formula: '$\\overrightarrow{AB}=\\overrightarrow{DC}$', text: '若 A、B、C、D 是依次排列的非退化四边形顶点，一组对边同向等长可判平行四边形。右边应是 DC 而不是 CD，写错方向会把几何关系翻转。' },
      ],
      note: '==倍数说明平行，共起点再说明共线==；零向量没有可用于比较的方向，退化情况须单独检查。',
    },
    {
      title: '交点与未知比例：同一个点写两条路径',
      items: [
        { title: '沿两条直线分别表示交点', formula: '$\\mathbf p=\\mathbf a+t(\\mathbf b-\\mathbf a)=\\mathbf c+s(\\mathbf d-\\mathbf c)$', text: 't、s 分别表示 P 在 AB、CD 方向上的位置，不应未经证明就设为同一个参数。两条表达式相等，再按坐标或基础向量整理。' },
        { title: '比较系数必须先有不平行的基础向量', formula: '$a\\mathbf u+b\\mathbf v=c\\mathbf u+d\\mathbf v\\Rightarrow a=c,\\;b=d$', text: '只有 $\\mathbf u,\\mathbf v$ 不平行时，表示才唯一。如果 $\\mathbf v=2\\mathbf u$，不同的两组系数也能给出同一个向量，不能逐项比较。' },
        { title: '求出参数后，检查交点是否落在所需线段上', text: '若要求线段相交，需要 $0\\le t\\le1$、$0\\le s\\le1$；超出范围时可能只是延长线相交。若方程矛盾则无交点，若关系不独立可能有无穷多交点，不能强行当作唯一解。' },
      ],
      note: '==两条路径、两个参数、同一个终点==。最后把代数结果翻译回题目要求的几何位置。',
    },
  ],
  checks: ['每个向量的起点和终点是否写清？反向是否变号？', '分点的比例是局部比还是整段份额？点是否在延长线上？', '共线结论是否建立在同一起点上？有没有排除退化？', '比较系数的基础向量是否不平行？参数是否满足线段范围？'],
  memory: ['位置向量相减得到位移：AB=b−a；闭合路径向量和为零。', '内分 AP:PB=m:n，AP 占整段 m/(m+n)。', '非零向量成倍数可判平行；共起点的倍数关系可判共线。', '交点用两条路径表示；比较系数要有不平行基础向量，再检查参数范围。'],
}
