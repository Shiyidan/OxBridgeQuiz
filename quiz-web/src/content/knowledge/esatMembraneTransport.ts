// 试题库 ESAT 生物「跨膜运输」知识总结：按概念梳理条件与变化，在例题中讲解判断与计算。
import type { KnowledgeLesson } from './types'

export const esatMembraneTransport: KnowledgeLesson = {
  code: '150200',
  title: 'Movement across membranes · 跨膜运输',
  subtitle: '梳理物质跨膜的条件、运输方式与细胞水分变化',
  intro:
    '物质跨膜时，能否通过膜、两侧条件和能量供应共同决定运输过程。本节先梳理扩散、渗透与主动运输的知识，再联系细胞吸失水、交换速率和组织实验。图解帮助你看清移动方向，后面的原有例题则把这些知识用到具体判断与计算中。',
  memory: [
    '细胞膜有选择透过性。**有浓度差，不等于一定能过膜**；水和不同溶质是否能通过，要分别考虑。',
    '扩散描述的是净移动。两个方向都可能有粒子通过，==净移动是两边通过量的差额==；动态平衡时平均差额为零，分子仍在运动。',
    '渗透是水通过部分透膜，从较高水势向较低水势净移动。**水势不是水量**；只有同温同压、主要溶质不能自由过膜等条件适用时，才可用“稀侧向浓侧”的简化说法。',
    '易化扩散和主动运输都可依赖运输蛋白，但**主动运输需要代谢供能**，ATP 可直接或间接参与；蛋白参与本身不能说明属于哪一种。',
    '净失水时，动物细胞可皱缩，植物细胞膨压下降、内容物收缩；净吸水时，动物可能胀破，植物通常因壁的支撑而坚挺。==松弛不一定已经发生质壁分离==。',
    '质量百分比变化表示相对于初始质量的增减。在适用的渗透实验条件下，零变化可用于估计与组织水势相近的外液条件，**不是细胞内某一种糖的精确浓度**。',
    '立方体边长翻倍，面积变为 4 倍、体积变为 8 倍，面积体积比减半。==总交换速率与每单位体积的交换速率不是同一个量==。',
  ],
  sections: [
    {
      code: '150201',
      title: '扩散、渗透与主动运输',
      summary: '理解扩散、渗透和主动运输的条件与区别，并联系细胞变化、扩散速率和组织实验结果。',
      paragraphs: [
        '水、气体和溶质不断在细胞与环境之间交换，但它们不一定采用同一种方式。细胞膜允许某种物质通过，并不代表所有物质都能通过。**通透性决定有没有可用的通路**，两侧条件与供能方式则影响净移动的方向和速度。',
        '扩散与渗透是被动过程，主动运输依赖代谢供能。理解它们时，需要同时联系微观运动和可观察结果：分子仍能双向运动，而细胞或组织却可能表现为净吸水、净失水或无净变化。下面先把概念与条件梳理清楚，再通过例题解释质量、浓度和实验数据怎样变化。',
      ],
      rules: [
        {
          title: '膜的选择透过性',
          text: '选择透过性表示不同物质通过膜的方式与难易程度不同。某些物质可直接通过膜，另一些需要运输蛋白；也有物质在给定条件下不能通过。**浓度差不能替代可用的通路**。人工膜的通透性可以与细胞膜不同，“水可透、蔗糖不可透”就表示两者的跨膜条件不同。',
        },
        {
          title: '扩散与动态平衡',
          text: '扩散 diffusion 来自粒子的随机运动。在简单浓度条件下，同一种物质从较高浓度向较低浓度发生净移动；隔着膜时还需要允许通过。其中，**跨膜的简单扩散直接通过膜，不依赖运输蛋白**。扩散也可不涉及膜，例如色素在静水中分散。\n\n同一时段向右通过 80 个、向左通过 50 个，净结果是向右 30 个。==动态平衡时分子仍在运动，只是两个方向的平均通过量相等==。',
        },
        {
          title: '水势与渗透',
          text: '水势 water potential 是用于比较水净移动趋势的物理量，受溶质和压力等因素影响，不是水量。渗透 osmosis 是水通过部分透膜，由较高水势向较低水势的净移动。**同温同压时，增加溶质通常降低水势**；压力不同，便不能仅凭溶质浓度决定方向。人工膜也可发生渗透，不需要活细胞供能。',
        },
        {
          title: '渗透平衡与浓度变化',
          text: '当水可通过而溶质不能通过时，水进入一侧可增加该侧质量和体积；原有溶质总量不变，但被稀释。水的移动又会改变浓度和可能的压力差，因此净流速不一定保持不变。==渗透平衡是水势平衡，不一定是溶质浓度相等==；平衡时仍有双向水分子运动。',
        },
        {
          title: '易化扩散',
          text: '易化扩散 facilitated diffusion 沿物质的相应梯度进行，需要膜上的特定运输蛋白帮助，但不依赖代谢供能来推动这次被动移动。在本节不带电溶质的简单浓度情境中，它表现为顺浓度梯度运输。**使用运输蛋白，不是主动运输独有的特点**。',
        },
        {
          title: '主动运输与 ATP',
          text: '主动运输 active transport 依靠运输蛋白和代谢供能，可将物质逆其梯度运输。ATP 可以直接或间接提供能量，例如根毛主动吸收某些矿物离子。**根毛吸水则按水势判断，不能与矿物离子吸收混为一谈**。若离子情境另有电势条件，也需考虑；缺氧不意味着所有 ATP 来源与所有运输立刻停止。',
        },
        {
          title: '动物与植物细胞的水分变化',
          text: '在主要溶质不能自由过膜的常见情境中，较高水势外液使细胞净吸水：动物细胞膨胀，过度时可胀破；植物通常因细胞壁抵抗而变得坚挺。较低水势外液使动物细胞皱缩，植物液泡和内容物收缩、膨压下降。**植物细胞壁不会随内容物同幅缩小**；水势平衡或等渗条件也不意味着水分子停止运动。',
        },
        {
          title: '植物细胞失水与质壁分离',
          text: '液泡中的水进入外液时，依次经过液泡膜、细胞质、细胞膜，再通过细胞壁。液泡膜与细胞膜是选择透过的膜边界，细胞壁主要支撑。净失水使膨压下降，细胞可变松弛；失水足够多，内容物收缩并离开细胞壁，才出现质壁分离。==松弛与质壁分离不是完全相同的状态==。',
        },
        {
          title: '扩散速率的影响因素',
          text: '其他条件相同，交换面积更大、浓度差更大、扩散距离更短，通常使扩散速率更大；温度适度升高通常加快粒子的随机运动，但活组织过热可能受损。**速率是单位时间内变化多少**。“质量—时间”图的斜率可以表示质量变化速率，最后的质量读数本身不能说明开始时有多快。',
        },
        {
          title: '表面积与体积比',
          text: '边长为 $a$ 的立方体，面积 $A=6a^2$、体积 $V=a^3$，所以 $A/V=6/a$。大小增加时，总面积可以变大，面积体积比却变小。若起初每单位面积交换同样快，边长翻倍使总交换速率成为 4 倍，每单位体积速率则成为 $4/8=1/2$。**这些比值依赖给定的初始交换条件**，不能自动用于整个后续过程。',
        },
        {
          title: '质量百分比变化',
          text: String.raw`质量百分比变化为 $\dfrac{m_{\mathrm{final}}-m_{\mathrm{initial}}}{m_{\mathrm{initial}}}\times100\%$，表示相对于初始质量的增减，正值为增重，负值为减重。**分母是初始质量**。百分比便于比较相对变化，但不同厚度仍会改变扩散距离，因此不能代替对样本尺寸的控制。`,
        },
        {
          title: '渗透实验的零点与适用条件',
          text: '在膜完整、溶质跨膜及其他质量变化可忽略、外界稳定且净水流未反向的简化模型下，“浓度—质量百分比变化”图的零点可估计与组织初始水势相近的外液条件。==它不是细胞内某一种糖的精确浓度==。“后来质量稳定”也不等于“最终质量与初始相同”，只有后者才是这张图上的零变化。',
        },
        {
          title: '实验控制与测量误差',
          text: '组织来源、尺寸、浸泡时长、温度和外液体积等应尽量一致，称量前应按相同方式轻轻吸去表面液体，并设置重复。这样才能较可靠地比较浓度造成的差异。**接近零的微小变化可能落在误差范围内**；增加附近浓度与重复测量，可以改善估计，但不能让结果变成绝对精确。',
        },
      ],
      visual: 'membrane-transport',
      example: {
        question: String.raw`原创热身：土豆条初始 $3.20\,\mathrm{g}$，统一时长浸泡并吸去表面液体后为 $2.96\,\mathrm{g}$。膜完好，可忽略溶质交换和其他质量变化。计算百分比，并给出最直接的水分变化判断。`,
        steps: [
          String.raw`先算少了多少：$2.96-3.20=-0.24\,\mathrm{g}$。负号保留下来，它表示最终比初始轻。`,
          String.raw`再除以原来的质量，而不是后来的质量：$-0.24/3.20\times100\%=-7.5\%$。`,
          '题目允许忽略其他质量变化，所以可以把变轻解释为该时段水净离开组织；不能据此说细胞在主动泵水，或细胞壁跟着缩小。',
        ],
        answer: String.raw`质量变化 $-7.5\%$；该时段组织净失水。`,
      },
      pitfalls: [
        '扩散和渗透说的是净移动，不是所有分子只朝同一方向走；平衡时仍有随机运动。',
        '水势不是水量；同温同压时才可把适用的溶质浓度比较用于水的方向，不能忽略压力影响。',
        '运输蛋白可参与易化扩散或主动运输，蛋白参与本身不能区分两者。',
        '植物细胞松弛不一定已质壁分离，细胞壁主要支撑而非选择性阻止水进入。',
        '质量最后稳定，不等于相对初始没有增减；百分比分母始终是初始质量。',
        '总表面积变大与面积体积比变大不是同一回事，总速率与单位体积速率也要区分。',
      ],
      check: {
        question: String.raw`两个立方体交换模型的边长分别为 $1\,\mathrm{mm}$ 和 $2\,\mathrm{mm}$，六个面均参与交换。起初每单位面积的净扩散速率相同，其他条件一致。大立方体相对于小立方体的“初始总扩散速率”和“初始每单位体积扩散速率”分别是多少？`,
        options: [
          '都是 4 倍，因为总表面积增大到 4 倍。',
          '总速率为 4 倍；每单位体积速率为 1/2。',
          '总速率为 8 倍；每单位体积速率为 1。',
          '总速率为 1/2；每单位体积速率为 4 倍。',
        ],
        answerIndex: 1,
        explanation:
          '选 B。先只看表面：边长翻倍，面积变成 $2^2=4$ 倍。题目已说起初每单位面积交换一样快，所以**整个大方块的初始总速率是 4 倍**。\n\n再看内部体积：体积变成 $2^3=8$ 倍。因此每单位体积获得的速率是 $4/8=1/2$，即小方块的一半。A 忘了除以体积；C 把体积增加当成交换面积增加；D 则把两个答案写反了。\n\n这道题比较的是==给定条件下的初始速率==。后来两边条件若改变，不能保证比值仍然一样。',
      },
      examFocus: {
        goal: '扩散、渗透和主动运输的区别，在于**移动的物质、膜的通路、相应梯度与供能条件**；这些过程进一步决定细胞吸失水以及实验中的质量和体积变化。',
        comparison: {
          title: '跨膜运输的知识对照',
          columns: ['过程', '移动条件与方向', '膜与运输蛋白', '代谢供能'],
          rows: [
            [
              '简单扩散 diffusion',
              '在简单浓度条件下，同种物质由较浓处向较稀处净移动',
              '跨膜时直接通过膜，不依赖运输蛋白；扩散也可不涉及膜',
              '不需要代谢供能推动该被动过程',
            ],
            [
              '易化扩散 facilitated diffusion',
              '沿物质的相应梯度移动',
              '需要特定膜蛋白帮助',
              '不需要代谢供能推动该被动过程',
            ],
            [
              '渗透 osmosis',
              '水由较高水势向较低水势净移动',
              '需要允许水通过的部分透膜；人工膜也可发生',
              '不需要代谢供能',
            ],
            [
              '主动运输 active transport',
              '可将物质逆其梯度运输',
              '需要运输蛋白',
              '需要代谢供能，ATP 可直接或间接参与',
            ],
          ],
        },
        examples: [
          {
            title: '两侧隔着膜，水和溶质分别怎样变化？',
            question: String.raw`Compartments X and Y initially contain $0.45\,\mathrm{mol/L}$ and $0.15\,\mathrm{mol/L}$ sucrose, respectively, at the same temperature and pressure. Their separating membrane allows water but not sucrose to pass, and their volumes can change. No substances are added or lost from the combined system. Which initial change is expected?`,
            options: [
              'Water moves net from X to Y; the mass in X decreases.',
              'Sucrose diffuses from X to Y; the amount of sucrose in X decreases.',
              'Water moves net from Y to X; the sucrose concentration in X increases.',
              'Water moves net from Y to X; the mass in X increases while its amount of sucrose stays constant.',
            ],
            answer: 'D：水由 Y 向 X 净移动；X 内质量增加，但蔗糖物质量不变。',
            steps: [
              '先把“谁能过膜”与“浓度是多少”分开读。题干说 water but not sucrose，即水能过、蔗糖不能，所以先把蔗糖留在原侧，再单独判断水；B 的蔗糖箭头**在这层膜上无法发生**。不能因为两侧浓度不同，就自动让所有物质一起移动。',
              '现在比较水的方向。起初两侧温度、压力相同，X 的蔗糖浓度较高，因此水势较低；水开始时由 Y 向 X 净移动。注意这说的是两个方向相比，Y 到 X 的量更多，不是每个水分子都只往 X 走。',
              'X 多了水，质量和允许变化的体积会增加。但蔗糖既不能穿膜，也没有其他来源，所以**X 内蔗糖的总量没有增加**。',
              '最后再看浓度：同样多的蔗糖分散到更大的体积里，被稀释了，所以浓度下降。这样排除 C，保留 D。题目问的是开始时的变化，不能再凭这些信息算出最终体积或最终浓度。',
              '最后回到 initially（起初）这个词。我们只确定开始时的净方向，不能把它画成永远等速流动：随着浓度差减小，或反向压力增加，净流速通常会减小。若同类装置接有毛细管，体积增加可表现为液面上升，但也不能直接画成无限直线上升；水势平衡后仍有双向运动。',
            ],
            optionNotes: [
              'A：把初始方向画反了。起初同温同压时，X 较浓、水势较低，水应由 Y 向 X 净移动。',
              'B：浓度差不能让蔗糖穿过一层明确不允许它通过的膜。',
              'C：前半句方向正确，后半句却写反。X 吸水以后蔗糖总量不变、体积增大，所以是稀释，不是变浓。',
              'D：三件事都能解释：水净进入 X，X 因而增重；蔗糖过不了膜，总量仍不变。当两侧达到水势平衡、没有净水流时，水分子仍会双向穿膜。',
            ],
            takeaway:
              '画完水的箭头，再分别问“总质量变了吗”“溶质总量变了吗”“浓度变了吗”。==溶质总量不变，浓度仍然可以改变==，因为水改变了体积。\n\n把这个思路用于植物细胞图时，要从液泡中的水开始逐段追踪：液泡 → 液泡膜 → 细胞质 → 细胞膜 → 细胞壁 → 外液。**每一段都要接得上**，不能只选最外侧的箭头。随后看外壁是否相对保留、内容物是否已离开它；只有松弛还不能直接判为质壁分离。',
            variant: {
              question: String.raw`Replace the equal-pressure assumption: initial total water potentials are now $-0.20\,\mathrm{MPa}$ in X and $-0.65\,\mathrm{MPa}$ in Y. The membrane properties are unchanged. What is the initial net direction of water?`,
              answer: 'X → Y。',
              explanation:
                '这次不再保证两侧压力相同，而且已经直接给出总水势。按数值比较：$-0.20>-0.65$，所以水由 X 向 Y 净移动。\n\n**原来“同压”的条件已经换掉了**，不能只看之前的蔗糖浓度，沿用上一题的方向。遇到这种变式，先找究竟改了哪句话。\n\n比较负水势时，照普通负数比较大小，不按负号后的绝对值排序。这个变式也说明，较浓的一侧不一定在所有压力条件下都吸水，必须使用题目实际给出的总水势。',
            },
          },
          {
            title: '这组实验能判断是哪一种运输吗？',
            question: String.raw`An uncharged solute S is not metabolised. Its concentration is maintained at $1\,\mathrm{mmol/L}$ outside cells and $4\,\mathrm{mmol/L}$ inside during a short test. Net uptake requires a membrane transport protein. A treatment that selectively lowers the ATP supply strongly reduces uptake, while membrane integrity and these concentrations remain unchanged. Which conclusion is best supported?`,
            options: [
              'Uptake is facilitated diffusion because a transport protein is required.',
              'Uptake is active transport; ATP supplies energy directly or indirectly.',
              'Uptake is active transport, so this protein must be shown by these results to hydrolyse ATP directly.',
              'Uptake is passive diffusion; the ATP result proves that S can no longer cross an intact membrane by any route.',
            ],
            answer: 'B：支持主动运输；这些证据未区分 ATP 是直接还是间接供能。',
            steps: [
              String.raw`先把摄取方向写清楚：外侧 $1$ → 内侧 $4\,\mathrm{mmol/L}$，是由低浓度进入高浓度。**它不是顺浓度差进入的**。S 不带电、不被代谢，而且题干说浓度一直维持着，因此不能另猜“细胞把 S 用掉了，内部其实更稀”。 本题特意用不带电的 S，使这里可以集中比较浓度；如果另一题改为离子且另外给出了电势条件，就要把那些条件也纳入，不能机械照搬。`,
              '再看后两条信息：摄取需要膜上的运输蛋白；ATP 供应减少以后，摄取也明显减少。把它们和刚才的逆浓度方向放在一起，就能解释为什么选择主动运输。',
              '题目还特地说膜保持完整、两侧浓度不变。这很关键：**不能把摄取变慢解释为膜坏了或浓度差变了**，因为这些可能原因已经被题干排除。',
              '最后比较 B、C。两项都提到主动运输，但 C 还要求我们断定“这个蛋白自己直接水解 ATP”。实验只说明摄取需要代谢供能，没有测出直接水解的步骤，所以选说明直接或间接供能都可能的 B。',
            ],
            optionNotes: [
              'A：易化扩散确实也用蛋白，但它不能独自解释本题不带电 S 从低浓度向高浓度的持续净摄取。',
              'B：既解释了逆浓度方向，也解释了蛋白与 ATP 的作用；同时保留了直接、间接供能两种可能。',
              'C：错在 must hydrolyse ATP directly，也就是“一定由这个蛋白直接水解 ATP”。实验还没有证明到这一步，代谢能量也可能间接支持运输。',
              'D：被动扩散解释不了本题的逆浓度净摄取。摄取减少，也不表示 S 的所有可能通路已经全部消失。',
            ],
            takeaway:
              '先解释**它为什么能逆着浓度差进入**，再看减少 ATP 后为什么变慢。两件事都说得通，才能选运输方式；不要把实验没测的分子步骤也说成已经证明。\n\n实际比较时，可把“运输方向”“蛋白是否参与”“供能改变后怎样”“膜与浓度有没有同时改变”分别列出。只看进入细胞、蛋白参与或速率出现平台，都不够单独证明主动运输；若把 ATP 干预换成缺氧，还要注意缺氧不保证所有 ATP 来源与被动运输立即停止。',
            variant: {
              question: String.raw`S is now maintained at $8\,\mathrm{mmol/L}$ outside and $4\,\mathrm{mmol/L}$ inside. Uptake still needs the membrane protein, but further tests establish that uptake does not require metabolic energy. Which mechanism fits these new conditions?`,
              answer: '易化扩散 facilitated diffusion。',
              explanation: String.raw`先重写方向：现在外侧是 $8$，内侧是 $4\,\mathrm{mmol/L}$，进入细胞变成顺浓度梯度。再看题目明确说仍需膜蛋白、却不需代谢供能，因此符合易化扩散。

==同一种溶质，不同条件下要重新判断==。不要因为上一题选了主动运输，这一题就继续沿用。

也可把同一细胞中不同物质分开判断：根毛的某些矿物离子吸收可以用主动运输解释，水进入根毛则要另比较水势，不能因为都在“吸收”就给它们同一个名称。`,
            },
          },
          {
            title: '一组增重、一组减重，不变重的浓度在哪里？',
            question: String.raw`Matched potato cylinders each start at $5.00\,\mathrm{g}$. After the same time, mean final masses are $5.20\,\mathrm{g}$ in $0.20\,\mathrm{mol/L}$ sucrose and $4.70\,\mathrm{g}$ in $0.40\,\mathrm{mol/L}$ sucrose. Assume intact membranes, negligible sucrose passage and other mass changes, stable external conditions and no reversal of net water flow. The mean percentage-change response is approximately linear between these concentrations. Which estimate and interpretation are justified?`,
            options: [
              String.raw`About $0.28\,\mathrm{mol/L}$; it estimates the external concentration giving no net mass change under these conditions.`,
              String.raw`About $0.30\,\mathrm{mol/L}$; the zero point must be the average of the two concentrations.`,
              String.raw`About $0.32\,\mathrm{mol/L}$; the interval should be weighted by the larger mass loss from the low-concentration end.`,
              String.raw`Exactly $0.28\,\mathrm{mol/L}$; every cell contains this concentration of sucrose and water molecules stop crossing.`,
            ],
            answer: String.raw`A：约 $0.28\,\mathrm{mol/L}$，是该实验条件下零净质量变化外液浓度的估计。`,
            steps: [
              String.raw`先算两组相对最初变了多少：低浓度组 $(5.20-5.00)/5.00\times100\%=+4\%$；高浓度组 $(4.70-5.00)/5.00\times100\%=-6\%$。**正号是增重，负号是减重**。`,
              '先辨清坐标含义：横轴是外液浓度，纵轴是相对初始质量的百分比变化。画出的一个点在零线上方 +4%，另一个在下方 −6%。零点在两者之间，且从 +4% 走到零的距离较短，所以更靠近低浓度端；**不能不看增减幅度，就直接平均两个浓度**。',
              String.raw`题目允许把这段看成直线。从 $+4\%$ 下降到 0，要走 4 个百分点；从 $+4\%$ 到 $-6\%$ 总共是 10 个百分点。所以浓度也从低端走全程的 $4/10$：$0.20+\dfrac{4}{10}(0.40-0.20)=0.28\,\mathrm{mol/L}$。==比例要从你出发的那一端算==。`,
              '再读答案的解释。题目已排除膜破坏、明显溶质交换和其他质量变化，外界稳定且净水流没有反向，所以这个零点可估计与组织初始水势相近的外液条件。但它不是细胞内某一种糖的精确浓度，水分子也没有停止双向通过。 还要区分“后来质量不再变化”与“相对初始质量没有变化”：某一组可能先减重再稳定，它的纵坐标仍是负值，不是零点。',
              '真实实验中，要统一来源、尺寸、时长、温度、外液体积及吸干方法，并重复测量；不吸干会把附着的外液也称进去。若零点附近的小差异可能只是误差，就在 0.28 附近加测几个浓度并比较重复结果，而不是只报更多小数。**这是估计值，不是绝对精确值**；只有本题允许局部近似直线，才使用刚才的比例计算。',
            ],
            optionNotes: [
              'A：数值按 +4% 到零所占的比例求出，并说“约”“估计”，与题目允许的近似相符。',
              'B：只有两端一增一减且幅度相同，零点才在正中间。这里是 +4% 与 −6%，不能直接平均两个浓度。',
              'C：从低浓度端出发，应先走掉那一端的 +4%，所以用 4/10；用另一端的 6/10，就把零点放偏了。',
              'D：0.28 这个数看着相近，但“完全精确”“每个细胞的蔗糖浓度就是它”“水分子停止”都不成立。细胞还有其他溶质和压力影响，平衡时水也仍在双向移动。',
            ],
            takeaway:
              '先算增减百分比，再按比例找浓度；最后多问一句：**这个数是在估计什么？** 算对数字，却把意义解释错，仍然不能选。\n\n若比较的样本尺寸不同，还要先读清 total rate（总速率）还是 per unit volume（每单位体积速率）。先按表面积比较整个样本的初始交换，再除以体积；在每单位面积交换同样快的条件下，边长翻倍对应面积 4 倍、体积 8 倍，每单位体积却只有原来的 1/2。不能只凭“大”或“小”判断快慢。\n\n若改变的是面积、浓度差、距离或温度，就先检查其他条件是否相同：较大面积与浓度差、较短距离通常加快速率，适度升温通常也加快运动，但活组织过热会受损。百分比计算不能替代这些条件的控制。',
            variant: {
              question: String.raw`A new cylinder starts at $3.20\,\mathrm{g}$ and finishes at $2.96\,\mathrm{g}$ after the same interval and handling. What is its percentage mass change, and does that alone locate the zero point?`,
              answer: String.raw`$-7.5\%$；一个负值数据点不能独立确定零点浓度。`,
              explanation: String.raw`仍用初始质量作分母：$(2.96-3.20)/3.20\times100\%=-7.5\%$，说明它在这段时间变轻了；在题目的假定下，可以解释为净失水。

但我们只有一个负值点，还不知道附近哪种浓度会增重、变化曲线怎样走。**一个点还不够找到零点**，需要其他浓度的数据和适用的估计方法。

如果题目给的是连续的“质量—时间”曲线，则看相应时间处的斜率判断快慢；一个最终质量读数不能代替初始斜率。这与本题用“浓度—百分比变化”寻找零点，是两种不同的读图任务。`,
            },
          },
        ],
        checklist: [
          '扩散、渗透与主动运输各在什么条件下发生？易化扩散与主动运输为什么都可能用到膜蛋白？',
          '净移动与双向分子运动怎样同时发生？水势相等为什么不一定要求两侧溶质浓度相等？',
          '植物和动物净吸水、净失水后的外观为什么不同？松弛与质壁分离有什么区别？',
          '面积、浓度差、距离和温度分别怎样影响扩散？表面积体积比又描述什么？',
          '质量百分比、浓度图零点与质量时间图斜率，各自表示什么？',
          '利用组织实验估计水势条件时，为什么要控制尺寸、时间、外液、吸干处理并重复测量？',
        ],
      },
      sourceIds: [
        'uat-spec-biology',
        'uat-biology-guide',
        'uat-nsaa-2016',
        'openstax-passive',
        'openstax-active',
        'openstax-water-potential',
        'openstax-cell-size',
      ],
    },
  ],
  sources: [
    {
      id: 'uat-spec-biology',
      title: 'UAT-UK · ESAT Content Specification（2026/27）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '内部范围核对：B2.1 的扩散、以水势描述的渗透、主动运输及活体/非活体情境；不推断题目出现频率。',
    },
    {
      id: 'uat-biology-guide',
      title: 'UAT-UK · ESAT Guide: Biology（June 2025）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2025/07/06120052/ESAT_Guide_Biology_June_2025.pdf',
      note: '内部核查 B2 的运输条件、细胞变化与植物组织实验；题干、数据、选项与变式均独立原创。',
    },
    {
      id: 'uat-nsaa-2016',
      title: 'UAT-UK Archive · NSAA 2016 Section 1',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/07120539/NSAA_2016_S1_QuestionPaper.pdf',
      note: '内部参考 Q56 对植物细胞失水方向的连续路径设问；使用原创情境讲解，不复制原图、题干或答案，亦不称为 ESAT 真题。',
    },
    {
      id: 'openstax-passive',
      title: 'OpenStax · Biology 2e: Passive Transport',
      url: 'https://openstax.org/books/biology-2e/pages/5-2-passive-transport',
      note: '内部核对通透性、动态平衡、易化扩散以及动植物在不同外液中的变化；未转载原文与插图。',
    },
    {
      id: 'openstax-active',
      title: 'OpenStax · Biology 2e: Active Transport',
      url: 'https://openstax.org/books/biology-2e/pages/5-3-active-transport',
      note: '内部核对主动运输的供能与运输蛋白条件；原创证据题使用不带电溶质，避免未说明的电势因素干扰。',
    },
    {
      id: 'openstax-water-potential',
      title: 'OpenStax · Biology 2e: Transport of Water and Solutes in Plants',
      url: 'https://openstax.org/books/biology-2e/pages/30-5-transport-of-water-and-solutes-in-plants',
      note: '内部核对总水势、溶质与压力影响；仅讲解判断方向所需条件，不展开完整水势方程。',
    },
    {
      id: 'openstax-cell-size',
      title: 'OpenStax · Biology 2e: Prokaryotic Cells — Cell Size',
      url: 'https://openstax.org/books/biology-2e/pages/4-2-prokaryotic-cells',
      note: '内部核查面积体积比与交换条件；立方体计算、实验数据和插值例题由基础关系原创设计。',
    },
  ],
}
