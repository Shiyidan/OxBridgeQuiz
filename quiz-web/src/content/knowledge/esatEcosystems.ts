// ESAT 生态系统讲义：用生态小景、物质循环与取样数据连接知识总结、原创例题和变式。
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'

const organisationExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '先确定范围，再计算种群变化',
    question:
      'At the start of a month, a defined woodland contains 240 rabbits. During the month, 36 rabbits are born, 18 die, 12 enter the woodland and 30 leave it. No other changes occur. Which statement is correct at the end of the month?',
    options: [
      'The rabbit population contains 240 individuals.',
      'The rabbit population contains 258 individuals.',
      'The woodland community contains exactly 240 individuals.',
      'The rabbit population contains 276 individuals.',
    ],
    answer: 'A：兔种群仍有 240 个个体。',
    steps: [
      '先抓住统计边界：同一片林地、同一种兔，属于一个种群 population。群落 community 还包括这里其他物种的所有种群，所以不能把兔的数目当成整个群落的数目。',
      '出生和迁入增加数量，死亡和迁出减少数量。因此期末数量为 240 + 36 + 12 − 18 − 30 = 240。',
      '出生比死亡多 18 个，但迁出又比迁入多 18 个，两部分正好抵消。**种群数目稳定，不代表没有个体出生、死亡或迁移**。',
      'B 只计算了出生与死亡；D 把某些迁移方向算反了。题目给出了四项变化，四项都要计入。',
    ],
    optionNotes: [
      'A：把四项变化按正确方向全部计入。',
      'B：只计算了 240 + 36 − 18，漏掉净迁出。',
      'C：240 是兔的数量，不能代表包含树木、鸟、真菌等的整个群落。',
      'D：将迁出当成增加、迁入当成减少，误算为 240 + 36 − 18 + 30 − 12 = 276。',
    ],
    takeaway:
      '**期末种群数 = 期初数 + 出生 + 迁入 − 死亡 − 迁出**。先规定物种、地点和时间，再代入。',
    variant: {
      question:
        'The same initial population, births, deaths and immigration apply, but no rabbits leave the woodland. What is the final population size, and what is the percentage increase from the initial population?',
      answer: '270 个；比最初增加 12.5%。',
      explanation:
        '没有迁出后，期末为 240 + 36 + 12 − 18 = 270，净增 30 个。百分比增加用原来的 240 作分母：30/240 × 100% = 12.5%。',
    },
  },
  {
    title: '同一个池塘里，谁影响了谁？',
    question:
      'In a pond, an alga provides sugars to a small animal living in association with it. The animal provides a protected location and carbon dioxide that the alga can use. Both organisms have greater reproductive success in this association than alone. A fish eats some of the animals. Which description is correct?',
    options: [
      'The association is parasitism, and the fish is an abiotic factor.',
      'The association is mutualism, and the fish is a biotic factor.',
      'The alga obtains all of its biomass directly from sunlight.',
      'The alga and animal together form one population because they live in the same pond.',
    ],
    answer: 'B：双方受益属于互利共生；捕食者属于生物因素。',
    steps: [
      '分别看两方的结果：藻类得到保护和可利用的二氧化碳，动物得到糖，题目还明确两者的繁殖成功都提高，因此是 mutualism（互利共生）。',
      '鱼是活的捕食者，影响动物的存活，属于 biotic factor（生物因素）。温度、光照和水体 pH 等非生物条件才属于 abiotic factors。',
      '藻类用光能合成有机物，但**光提供能量，二氧化碳和水等提供物质**。生物量不是太阳光直接变成的质量。',
      '同住一个池塘不等于同一物种。藻类与动物属于不同种群，它们都可以是这个池塘群落的一部分。',
    ],
    optionNotes: [
      'A：寄生要求一方获益而宿主受害；鱼也不是非生物因素。',
      'B：同时符合双方受益和捕食者为生物的两条信息。',
      'C：混淆了能量来源与构成有机物的原子来源。',
      'D：种群必须是同一物种在规定区域内的个体，不能只看生活地点。',
    ],
    takeaway:
      '判断种间关系时，**分别说明每一方获益还是受害**；判断生态层级时，始终保留“是否同一物种”这个条件。',
    variant: {
      question:
        "In a different association, an organism takes nutrients from a host and reduces the host's reproductive success. The host is not immediately killed. Which type of interaction does this describe?",
      answer: 'Parasitism（寄生）。',
      explanation:
        '寄生者获益，宿主受害，符合寄生的特点。寄生并不要求宿主立即死亡；是否立即被杀死也不能代替对双方利益的判断。',
    },
  },
]

const cyclingExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '植物白天也会释放二氧化碳吗？',
    question:
      'During one hour in daylight, plants in a closed chamber take up 18 units of carbon dioxide by photosynthesis and release 7 units by respiration. Other organisms in the chamber release 5 units by respiration. There are no other carbon dioxide exchanges. What is the net change in the amount of carbon dioxide in the chamber air?',
    options: [
      'A decrease of 18 units.',
      'An increase of 12 units.',
      'A decrease of 6 units.',
      'A decrease of 11 units.',
    ],
    answer: 'C：空气中的二氧化碳净减少 6 单位。',
    steps: [
      '把观察对象固定为空气中的二氧化碳。光合作用从空气中取走 18 单位，植物和其他生物的呼吸分别往空气中加入 7 与 5 单位。',
      '因此变化量为 −18 + 7 + 5 = −6，即净减少 6 单位。**净吸收量是吸收与释放相抵后的结果，不等于总光合吸收量**。',
      '植物在白天既光合也呼吸，不能因为看到光照就把植物呼吸的 7 单位删掉。其他生物的呼吸也同样进入空气的收支。',
      '题目限定没有其他交换，所以这里不再自行加入通风、燃烧或溶解进水体等过程。',
    ],
    optionNotes: [
      'A：只计算光合作用，漏掉全部呼吸释放。',
      'B：只计算呼吸产生的 12 单位，漏掉光合吸收。',
      'C：把空气作为同一个收支对象，取出与加入全部计入。',
      'D：只考虑植物的 18 − 7，漏掉其他生物。',
    ],
    takeaway:
      '碳循环收支题先说清“哪一处的碳”。**植物白天也呼吸；净变化要把同一范围内的所有输入和输出一起算**。',
    variant: {
      question:
        'The chamber is then kept in darkness for one hour. Photosynthesis stops, while both respiration rates remain as stated. What is the change in carbon dioxide in the chamber air?',
      answer: '增加 12 单位。',
      explanation:
        '无光时光合作用为零，但题目明确两种呼吸速率不变，因此空气中的二氧化碳增加 7 + 5 = 12 单位。不能把“没有光合作用”误读成“没有任何代谢”。',
    },
  },
  {
    title: '分解与水循环，分别转移了什么？',
    question:
      'Fungi grow on fallen leaves in moist, oxygenated soil. Nearby, water leaves plant leaves as vapour and later forms droplets in a cloud. Which statement correctly describes these processes?',
    options: [
      'Fungal respiration can return carbon from leaf material to the atmosphere, while condensation converts water vapour into liquid droplets.',
      'Decomposition destroys the carbon atoms in the fallen leaves.',
      'Water vapour leaving the plant is an example of precipitation.',
      'Energy released as heat by fungi is recycled into sunlight by the water cycle.',
    ],
    answer: 'A：分解者的呼吸可把落叶中的碳送回大气；凝结让水蒸气成为液滴。',
    steps: [
      '真菌分解落叶中的有机物，并利用其中的物质。它们进行有氧呼吸时，会把部分有机物中的碳以二氧化碳形式释放出去；碳原子没有被消灭。',
      '水从植物叶片散失为水蒸气属于 transpiration（蒸腾）。水蒸气冷却形成云中小液滴属于 condensation（凝结），之后雨等落到地面才是 precipitation（降水）。',
      '因此 A 同时正确描述了碳的转移与水的相态变化。虽然都叫循环，但它们不是在把原子或能量凭空制造出来。',
      '**物质能够循环，能量最终以热等形式散失**。水循环由太阳能等驱动，不会把真菌散失的热“循环还原”为太阳光。',
    ],
    optionNotes: [
      'A：区分了分解者呼吸与水蒸气凝结两个过程。',
      'B：分解改变物质的组合与所在位置，不会消灭碳原子。',
      'C：从叶片进入空气是蒸腾；从云落向地面才是降水。',
      'D：能量的传递与散失不能写成物质式循环。',
    ],
    takeaway: '碳循环追踪碳原子，水循环追踪水的移动和相态。**分解者本身也是活生物，也要呼吸**。',
    variant: {
      question:
        'The fallen leaves are burned instead of decomposing. Which carbon transfer can occur during complete combustion, and is living tissue required for that transfer?',
      answer: '有机物中的碳可转为二氧化碳进入空气；燃烧不需要活的组织。',
      explanation:
        '燃烧 combustion 能把燃料中的碳以二氧化碳形式释放。它和呼吸都能把有机碳转回二氧化碳，但燃烧不是活细胞的代谢，也不以活组织存在为前提。',
    },
  },
]

const biodiversityExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '样方里的数字，怎样换算成整块草地？',
    question:
      'Twenty non-overlapping quadrats are placed at randomly selected coordinates across a 600 m² meadow. Each quadrat has an area of 0.25 m². A total of 45 plants of one species is counted. Assume that the sample is representative. What is the estimated number of plants of this species in the meadow?',
    options: ['1350', '5400', '108000', '225'],
    answer: 'B：估计有 5400 株。',
    steps: [
      '20 个样方面积共为 20 × 0.25 = 5 m²，这 5 m² 中数到 45 株。先算平均密度：45/5 = 9 株/m²。',
      '再乘整块草地面积：9 × 600 = 5400 株。**样方的面积必须进入计算**，不能把“每样方平均数”直接当成“每平方米平均数”。',
      '随机坐标能减少人为挑选位置的偏差，足够分散的多个样方比只在一角计数更有代表性。题目允许把样本密度推广到整片草地，所以这里才能进行外推。',
      '得到的是估计值，并不表示确实逐株数到了 5400 株。即使取样规范，不同随机样本也可能给出不同结果。',
    ],
    optionNotes: [
      'A：45/20 × 600，把每个 0.25 m² 样方误当成了 1 m²。',
      'B：先算单位面积的平均密度，再乘目标总面积。',
      'C：45/0.25 × 600，忘了 45 株来自 20 个样方。',
      'D：45 × 5，既未算出密度，也未使用草地总面积。',
    ],
    takeaway:
      '**估计总数 = 样本总个体数 ÷ 样本总面积 × 目标面积**。同样要说明取样是否能代表要估计的整个区域。',
    variant: {
      question:
        'The same quadrat counts are instead obtained only from the wet edge of a meadow, where this species is known to be more abundant than elsewhere. Is 5400 still a reliable estimate for the whole meadow, and in which direction is the estimate likely to be biased?',
      answer: '不可靠；很可能高估整块草地的数量。',
      explanation:
        '计算公式没变，但样本只来自已知密度更高的湿边，不能代表其他区域。把偏高的局部密度乘整块面积通常会高估。**增加同一处的样方数量，不能自动消除选址偏差**。',
    },
  },
  {
    title: '水变绿后，为什么鱼反而缺氧？',
    question:
      'After nutrient-rich runoff enters a lake, algal biomass increases greatly. Later, many algae and submerged plants die. Dissolved oxygen falls sharply and several fish species decline. Which explanation best connects these observations?',
    options: [
      'Nitrate ions directly remove all oxygen molecules from the water.',
      'Photosynthesis by the algae consumes oxygen faster than it releases it.',
      'More algal individuals necessarily mean that the lake now has greater biodiversity.',
      'Aerobic decomposers use oxygen while breaking down the increased amount of dead organic matter.',
    ],
    answer: 'D：大量有机物被分解时，有氧分解者的呼吸消耗溶解氧。',
    steps: [
      '营养盐输入促进藻类大量繁殖。藻层还可能遮挡光线，使水下植物难以光合；藻类和植物死亡后，水中可供分解的有机物增多。',
      '有氧分解者利用这些物质并呼吸，氧需求上升。如果消耗快于补充，溶解氧便下降，鱼类等依赖氧气的生物受到影响。D 连接了“死亡物质增多”与“氧下降”。',
      '植物和藻类的光合作用会释放氧，呼吸才会耗氧。夜间藻类等的呼吸也可能加重缺氧，因此不能只凭白天藻多，就认定全天氧一定充足。',
      '**一个物种大量增加，不等于生物多样性提高**。其他物种消失、少数种占优势，都可能让生态系统的物种多样性下降。',
    ],
    optionNotes: [
      'A：营养盐是富营养化的起点，典型耗氧环节是生物呼吸，不是硝酸盐把所有氧直接清除。',
      'B：把光合作用与呼吸的氧气收支方向弄反。',
      'C：把某一类生物的数量增加等同于物种多样性增加。',
      'D：与题干的死亡有机物增加及随后缺氧直接对应。',
    ],
    takeaway:
      '富营养化要讲完整因果：**营养盐增加 → 藻类增长与遮光 → 死亡有机物增加 → 分解者有氧呼吸耗氧 → 部分物种减少**。',
    variant: {
      question:
        'An equal-area survey finds four species with counts of 25, 25, 25 and 25 in lake X, and four species with counts of 97, 1, 1 and 1 in lake Y. Which lake has greater species richness, and which has more even species abundances?',
      answer: '物种丰富度相同，都是 4 种；X 的个体分配更均匀。',
      explanation:
        '丰富度 richness 只数有多少种，两湖相同；均匀度 evenness 看各物种的相对数量，X 更均匀。总个体数也同为 100，因此单看总数无法区分这两种群落结构。',
    },
  },
]

// 三个考纲叶节点共用图谱入口，并保留兼容旧讲义渲染的数据字段。
function ecosystemSection(
  section: Omit<KnowledgeSection, 'visual' | 'example'> & { examFocus: KnowledgeExamFocus },
): KnowledgeSection {
  const firstExample = section.examFocus.examples[0]!
  return {
    ...section,
    visual: 'ecosystems',
    example: {
      question: firstExample.question,
      steps: firstExample.steps,
      answer: firstExample.answer,
    },
  }
}

export const esatEcosystems: KnowledgeLesson = {
  code: '151000',
  title: 'Ecosystems · 生态系统',
  subtitle: '把生物之间的联系、物质的去向和调查数据串起来',
  intro:
    '生态题往往给你一片草地、一个池塘或一组调查数据，要求你解释其中的变化。这一章先分清个体、种群、群落和生态系统，再追踪碳和水怎样移动，最后把样方统计与人类活动联系起来。理解每个过程改变了什么，你就能说明兔为什么增减、水为什么缺氧，以及一个取样结果能不能代表整片生境。',
  memory: [
    '**种群是同一区域内同一物种的个体；群落包括不同物种；生态系统还包括非生物环境及其相互作用。**',
    '==种群净变化 = 出生 + 迁入 − 死亡 − 迁出==；数量不变也可能存在大量个体更替。',
    '**光提供能量，二氧化碳等提供构成有机物的物质**。消费者不能把吃到的全部生物量都变成自己的生物量。',
    '**光合作用吸收二氧化碳；植物、动物和分解者的呼吸都能释放二氧化碳**。植物白天同样呼吸。',
    '==物质能够循环，能量最终散失，需要持续输入==。水循环也持续依靠太阳能等驱动。',
    '**估计总数先算每平方米的平均密度**；随机取样减少偏差，沿样带取样用来观察环境梯度下的分布。',
    '**个体多不等于物种多**。富营养化时藻类大量增加，其他物种却可能因为缺氧而减少。',
  ],
  sections: [
    ecosystemSection({
      code: '151001',
      title: '生态层级与种群变化',
      summary: '分清研究范围，理解非生物条件、生物关系和生产者怎样影响一个群落。',
      paragraphs: [
        '观察一只兔时，我们谈的是个体 individual；数一片林地里同一种兔有多少只时，谈的是种群 population。把树木、兔、鸟、真菌等不同物种的种群一起考虑，才是群落 community。如果还加入土壤、水、温度和光照，以及它们与生物的联系，就到了生态系统 ecosystem。**层级变大，是研究对象增加了，不是原来的兔“变成”了别的东西**。',
        '生态系统中的生物并不孤立：兔吃草，捕食者吃兔，昆虫可能给开花植物传粉，植物又共同竞争光照和水。环境改变会沿这些联系传递，不过食物网中的生物通常不止一种食物或天敌，因此一次变化的最终结果要结合具体条件判断。',
      ],
      rules: [
        {
          title: '个体、种群、群落、生态系统',
          text: '**种群要同时限定物种、区域和时间**；群落包含该区域内不同物种的种群；生态系统包括群落、非生物环境及相互作用。生境 habitat 是生物生活的场所，与“所有生物组成的群落”含义不同。',
        },
        {
          title: '非生物因素',
          text: '光照、温度、水分、pH、盐度、溶解氧和矿质元素供应等，都会影响生物能否存活和生长。例如阴暗处可能限制植物光合作用，水中缺氧会限制许多鱼类的有氧呼吸。**同一种条件对不同物种的影响可以不同**。',
        },
        {
          title: '生物因素',
          text: '食物供应、捕食者、竞争者、寄生者、病原体和互利伙伴，都能影响种群。病原体造成的感染属于生物因素；水温变化属于非生物因素。两类因素常相互影响，例如温度也可能改变病原体的繁殖速率。',
        },
        {
          title: '种群大小的四项变化',
          text: '出生 birth 和迁入 immigration 增加种群，死亡 death 和迁出 emigration 减少种群。==期末数 = 期初数 + 出生 + 迁入 − 死亡 − 迁出==。封闭种群没有迁入迁出；数量稳定只说明总增加与总减少相抵。',
        },
        {
          title: '捕食与寄生',
          text: '捕食 predation 中，一方捕获并取食另一方；寄生 parasitism 中，寄生者从宿主获得资源，宿主受害，通常不会立即被杀死。两者都有一方获益、另一方受损，但相处方式不同。宿主仍存活不代表它没有受到伤害。',
        },
        {
          title: '互利共生与相互依存',
          text: '互利共生 mutualism 指双方都获益，例如传粉昆虫得到花蜜，植物得到传粉服务。相互依存 interdependence 范围更广，食物、庇护、传粉和物质回收都能形成联系。**互相有联系不等于每一种关系都双方受益**。',
        },
        {
          title: '竞争有限资源',
          text: '当资源有限时，同种或不同种的个体都可能竞争。植物常竞争光、水、矿质离子和生长空间；动物可竞争食物、领地或配偶。竞争不要求直接搏斗，两株植物通过遮光也会彼此影响。',
        },
        {
          title: '生产者与生物量',
          text: '绿色植物和藻类等光合生物用光能把无机原料合成为有机物，是所讨论光合生态系统的初级生产者 primary producers。**生物量 biomass 指生物物质的质量，比较时常用干质量**；光是能量来源，并不是构成有机物的原子来源。',
        },
        {
          title: '食物网中的传递与限制',
          text: '食物链箭头通常从被吃者指向取食者，表示有机物和能量传递的方向。消费者只有一部分摄入物质会成为新生物量，其余可能未被吸收或用于呼吸。捕食者减少可能使猎物增加，但还要考虑食物限制、其他捕食者和疾病，**不能把“可能”写成无条件的必然**。',
        },
      ],
      pitfalls: [
        '把同一区域所有动物叫作一个种群，忽略了物种不同；或把土壤水分算进群落成员。',
        '只计算出生与死亡，遗漏题干给出的迁入和迁出。',
        '把互利共生、相互依存和所有种间关系当成同义词。',
        '把太阳光说成植物干质量的直接物质来源，或把食物链箭头画向被吃者。',
      ],
      check: {
        question:
          '一片池塘中所有同种水蚤属于哪一层级？如果加入藻类、鱼、细菌以及水温和溶解氧，并考虑它们的相互作用，又属于哪一层级？',
        options: ['群落；种群', '种群；生态系统', '个体；群落', '生态系统；群落'],
        answerIndex: 1,
        explanation:
          '同一池塘内同种水蚤构成种群；各种生物连同非生物条件及相互作用构成生态系统。群落只包括生物部分。',
      },
      sourceIds: ['esat-b10', 'openstax-community', 'openstax-population'],
      examFocus: {
        goal: '能用准确的生态层级描述对象，并解释种群数量与生物关系怎样变化。',
        comparison: {
          title: '用同一片林地辨认四个层级',
          columns: ['层级', '包含什么', '林地中的例子'],
          rows: [
            ['个体 individual', '一个生物体', '一只兔'],
            ['种群 population', '同一区域、同一物种的个体', '这片林地中的全部同种兔'],
            ['群落 community', '区域内各物种的种群', '兔、树、草、鸟、真菌等全部生物'],
            ['生态系统 ecosystem', '群落与非生物环境及其联系', '生物与土壤、水、空气、光照等'],
          ],
        },
        examples: organisationExamples,
        checklist: [
          '说明种群时是否限定同一种生物和同一区域？',
          '出生、死亡、迁入、迁出是否全部计入？',
          '种间关系是否分别说明了双方的影响？',
          '是否区分了生产者的物质来源和能量来源？',
        ],
      },
    }),
    ecosystemSection({
      code: '151002',
      title: '碳循环与水循环',
      summary: '追踪碳原子与水的去向，分清光合、呼吸、分解、燃烧和水的各类移动。',
      paragraphs: [
        '一片落叶并不会在腐烂后让其中的碳凭空消失。部分碳进入分解者的身体，部分通过呼吸成为二氧化碳，还有部分留在土壤有机物中。植物又能利用二氧化碳进行光合作用。**碳循环说的是碳在不同物质、不同位置之间转移，碳原子本身没有被生物过程制造或消灭**。',
        '水也在空气、陆地、水体和生物之间不断移动。蒸发、蒸腾、凝结和降水让水重新分配，根吸水又把水带进植物。不要把“循环”理解成每一滴水都走完全相同的路线：水可以进入地下水、储存在湖泊中，也可以短时间停留在生物体内。',
      ],
      rules: [
        {
          title: '光合作用把无机碳变成有机碳',
          text: '植物和藻类吸收二氧化碳，利用光能把其中的碳合成到糖等有机物中，之后还能用于形成脂质、蛋白质等。**碳从二氧化碳进入生物量，不是从阳光中进入植物**。食物关系再把部分有机碳传给消费者。',
        },
        {
          title: '呼吸把有机碳送回环境',
          text: '植物、动物、真菌和许多微生物都进行细胞呼吸。有氧呼吸将有机物分解，释放能量并产生二氧化碳和水。植物白天和夜间都呼吸；看到白天净吸收二氧化碳，只说明光合吸收大于同时发生的释放。',
        },
        {
          title: '分解者的作用',
          text: '细菌和真菌等分解者分解遗体、落叶和排出物，使其中的物质重新进入环境及食物网。它们利用部分有机物形成自己的生物量，并通过呼吸释放二氧化碳。分解并不等于所有碳立刻进入空气；低温、缺水或缺氧等条件可使某些分解过程减慢。',
        },
        {
          title: '燃烧与长期碳储存',
          text: '木材、煤、石油和天然气等含碳燃料燃烧可释放二氧化碳。化石燃料中储存的碳来自很久以前的有机物，燃烧会把长期储存的碳较快送回大气。**燃烧不是呼吸，不需要活细胞参与**。',
        },
        {
          title: '碳储存量与净变化',
          text: '森林、土壤、水体和大气都能储存碳。某处储碳量是否增加，要比较碳的总输入和总输出。砍伐可减少光合吸收，木材燃烧或分解还可释放碳；但木材被长期保存时，碳不一定立即全部进入大气。',
        },
        {
          title: '蒸发、蒸腾、凝结与降水',
          text: '蒸发 evaporation 使水面或土壤表面的液态水进入空气；蒸腾 transpiration 是植物散失水蒸气，主要经叶片气孔。水蒸气凝结 condensation 成小液滴形成云，雨雪等降水 precipitation 把水带回地面。**云中可见的小液滴不是看得见的水蒸气**。',
        },
        {
          title: '地表、地下与生物体内的水',
          text: '降水可形成地表径流，或渗入土壤和地下水，最后又流向河流、湖泊或海洋。植物从土壤吸水，动物从饮水和食物获得水，再经呼吸、排泄、蒸发等失水。这些路径共同连接环境与生物，不要求每份水都先经过动物。',
        },
        {
          title: '水为什么对生物重要',
          text: '水是许多反应发生的介质，也是光合作用的原料；它能溶解并运输物质，维持细胞含水状态和植物膨压，还参与温度调节。水循环持续补给和重新分配可利用的水，干旱或水供应变化因此会影响生物分布。',
        },
        {
          title: '物质循环与能量流动',
          text: '碳、水等物质能够在生态系统中循环利用；能量在传递和代谢中最终以热等形式散失，需要太阳等持续输入。==循环的是物质，不是把散失的热重新变回原来的阳光==。分解者既参与物质回收，也会在呼吸中释放能量。',
        },
      ],
      pitfalls: [
        '把植物写成只吸收二氧化碳、不进行呼吸。',
        '把分解、呼吸和燃烧写成同一个过程，或说分解使碳原子消失。',
        '把蒸腾与降水混淆，或把云中的液滴直接称作气态水。',
        '把物质循环套到能量上，遗漏持续的能量输入与热散失。',
      ],
      check: {
        question: '在有氧且适宜的条件下，哪组过程都能把有机物中的碳以二氧化碳形式送回环境？',
        options: [
          '光合作用与凝结',
          '动物呼吸、分解者呼吸与含碳燃料燃烧',
          '蒸腾与降水',
          '植物光合作用与根吸水',
        ],
        answerIndex: 1,
        explanation:
          '有氧呼吸和燃烧都可以把有机碳转成二氧化碳。光合作用的碳转移方向相反，水循环中的相态变化不等于有机碳变成二氧化碳。',
      },
      sourceIds: ['esat-b10', 'openstax-cycles'],
      examFocus: {
        goal: '能说明每个过程把什么物质从哪里送到哪里，并计算同一范围内的净变化。',
        comparison: {
          title: '给循环中的箭头一个准确名称',
          columns: ['过程', '主要转移', '别混淆'],
          rows: [
            ['光合作用', '二氧化碳中的碳 → 生物有机物', '光提供能量，不提供碳原子'],
            ['有氧呼吸', '有机物中的碳 → 二氧化碳', '植物与分解者也会呼吸'],
            ['分解', '遗体/排出物 → 分解者与环境中的物质', '呼吸是分解者活动的一部分'],
            ['燃烧', '含碳燃料 → 二氧化碳等', '不需要活细胞'],
            ['蒸发、蒸腾', '液态水 → 空气中的水蒸气', '蒸腾来自植物失水'],
            ['凝结、降水', '水蒸气 → 液滴；水由云落回地面', '凝结和降水不是同一步'],
          ],
        },
        examples: cyclingExamples,
        checklist: [
          '是否先确定追踪的是碳、二氧化碳、水还是能量？',
          '植物与分解者的呼吸是否遗漏？',
          '净变化是否把输入与输出都算在同一边界内？',
          '是否把蒸发、蒸腾、凝结和降水区分清楚？',
        ],
      },
    }),
    ecosystemSection({
      code: '151003',
      title: '取样调查与生物多样性',
      summary: '用样方和样带描述分布、估计数量，再解释养鱼、酸雨和富营养化对群落的影响。',
      paragraphs: [
        '想知道一片草地有多少株雏菊，通常不必把每一株都数完。可以先用面积已知的样方 quadrat 调查一部分，再用平均密度估计整片草地。这里最重要的不是算式有多复杂，而是**样本是否代表你想研究的整片区域**。总挑花最多的地方，计算再准确也会高估。',
        '生物多样性 biodiversity 关注生命的多样程度，不只是“有多少个生物”。在群落数据中，既要看有多少物种，也要看个体是否几乎都属于少数几个种。人类活动可能改变这两方面：保护生境能帮助保留物种，而营养盐污染、酸雨或管理不当的养鱼场也可能使一些物种消失。',
      ],
      rules: [
        {
          title: '多样性、丰富度与均匀度',
          text: '生物多样性包括物种、遗传和生态系统等层面的多样性。群落调查中，物种丰富度 richness 是物种数，均匀度 evenness 描述个体在各物种间分配得是否均衡。**1000 个同种个体不一定比 100 个不同种个体更具物种多样性**；比较前也要保证调查面积和方法可比。',
        },
        {
          title: '样方记录什么',
          text: '样方适合植物或移动很慢的生物，可记录株数、出现频率或覆盖度。边界上的个体要采用事先确定且始终一致的计数规则。相互重叠、难以分株的植物可以用覆盖度；**覆盖 30% 不等于恰有 30 株**，三种记录量不能直接互换。',
        },
        {
          title: '随机与代表性',
          text: '先给生境建立坐标，再随机抽取样方位置，可以减少人为挑选偏差；足够多、分布充分的样本能提高估计的可靠性。不同生境差异明显时，可分别随机取样，再按各区面积加权。**重复测量能减少随机波动，但不能自动纠正只选某一角落的偏差**。',
        },
        {
          title: '由样本密度估计总数',
          text: '平均密度 = 样本总个体数 ÷ 样本总面积；估计总数 = 平均密度 × 目标总面积。样方面积不一定是 1 m²，要保持面积单位一致。结果是对该物种的估计，不是逐株清点，也不是把所有物种加在一起的多样性指标。',
        },
        {
          title: '沿环境梯度使用带状样带',
          text: '从水边到干地、从林缘到林内等条件连续变化时，可沿一条线布置连续样方形成带状样带 belt transect，或按固定间距作间断样带。它显示物种分布或丰度怎样随位置改变；**单条样带通常不能自动代表整片生境**，可用多条重复样带提高可靠性。',
        },
        {
          title: '分布相关不等于唯一原因',
          text: '某植物随离水边距离增加而减少，提示其分布与该梯度有关，但光照、土壤、水分和竞争可能同时变化。同步测量相关非生物因素，有助于解释分布；要证明某一个因素造成变化，还需要适当的控制或更多证据。',
        },
        {
          title: '鱼类养殖的收益与代价',
          text: '鱼类养殖 fish farming 可以提供食物和收入；若替代部分野生捕捞，可能减轻对野生鱼类的压力。高密度养殖也可能增加病原体传播、残饵和排泄物污染，逃逸鱼还可能竞争或与野生种群杂交。饲料若依赖野生鱼，部分压力仍存在，**养殖并不自动等于保护生物多样性**。',
        },
        {
          title: '酸雨怎样改变群落',
          text: '燃烧等活动排放的二氧化硫和氮氧化物可在大气中形成酸性物质，使降水酸性增强。酸化会伤害敏感水生生物，促进土壤养分流失及某些有毒金属离子释放，从而影响植物与食物网。减少相关排放有助于防治；不能把所有酸雨简单归因为二氧化碳。',
        },
        {
          title: '富营养化的耗氧链条',
          text: '过多硝酸盐、磷酸盐等进入水体，可促进藻类生长；遮光和后续死亡使有机物增多。有氧分解者的呼吸耗氧，可能造成鱼类等缺氧死亡，夜间其他生物的呼吸还可加重耗氧。==典型问题不是“藻类光合作用消耗氧”，而是总呼吸耗氧超过补充==。',
        },
        {
          title: '保护措施要对应实际原因',
          text: '保护和恢复生境、合理捕捞、减少污染物与营养盐排入、改善养殖密度和废物处理，都可能帮助维持多样性。曝气可缓解局部缺氧，却不能代替控制持续的营养盐来源。评估措施要比较多物种及较长时间的数据，不能只看养殖鱼的产量。',
        },
      ],
      pitfalls: [
        '把一个样方的平均数直接当成每平方米密度，漏掉样方面积。',
        '以为样方数量多就一定代表整个区域，忽略所有样方都来自同一类位置。',
        '把沿样带发现的相关性当成某一个环境因素的唯一因果证据。',
        '只数总个体数或养殖鱼产量，就断言生物多样性一定提高。',
        '把富营养化写成藻类光合作用耗氧，遗漏分解者呼吸。',
      ],
      check: {
        question: '要研究一种草从池塘岸边向干燥高地的分布如何变化，哪一方案最合适？',
        options: [
          '只在草最多的地方放一个样方。',
          '沿水边到高地布置样带，在规定位置取样，并在多条样带重复。',
          '只数整片区域的总株数，不记录位置。',
          '只在道路旁连续放很多样方，并把它们当作整个区域的随机样本。',
        ],
        answerIndex: 1,
        explanation:
          '问题关注沿环境梯度的分布变化，因此样带需要横跨这个梯度并保留位置信息。多条重复样带比单条更可靠，同时还可测量水分、光照等帮助解释变化。',
      },
      sourceIds: ['esat-b10', 'openstax-population', 'openstax-diversity', 'openstax-cycles'],
      examFocus: {
        goal: '能完成面积换算与数量估计，判断取样是否合适，并完整解释人类活动影响群落的过程。',
        comparison: {
          title: '不同调查目标，对应不同记录方式',
          columns: ['想知道什么', '合适做法', '结果的边界'],
          rows: [
            ['整片生境的平均丰度', '代表性随机样方；密度 × 总面积', '给出估计值，需保留面积单位'],
            [
              '沿环境梯度如何分布',
              '带状样带；按距离记录丰度与环境',
              '能看趋势，不能仅凭相关性确定原因',
            ],
            ['物种是否更多', '同等调查强度下记录物种数', '丰富度不等于总个体数'],
            ['是否由少数种占优势', '比较各物种相对丰度', '丰富度相同，均匀度仍可不同'],
            ['污染治理是否有效', '比较处理前后与适当对照区域', '同时看水质、多个物种与时间变化'],
          ],
        },
        examples: biodiversityExamples,
        checklist: [
          '样本面积与目标面积是否用同一单位？',
          '调查位置是否代表估计范围，或是否覆盖所研究的梯度？',
          '是否把物种数、个体数和覆盖度区分开？',
          '富营养化的解释是否写出分解者呼吸与耗氧？',
          '评价人类活动时是否同时考虑收益、风险和管理条件？',
        ],
      },
    }),
  ],
  sources: [
    {
      id: 'esat-b10',
      title: 'UAT-UK ESAT Content Specification — B10 Ecosystems',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按适用于 2026 年 10 月和 2027 年 1 月的 B10.1–B10.3 核对范围；中文讲解、题目和图解为原创。',
    },
    {
      id: 'openstax-community',
      title: 'OpenStax Biology 2e — Community Ecology',
      url: 'https://openstax.org/books/biology-2e/pages/45-6-community-ecology',
      note: '核对种间关系及群落相互作用；未转载教材图文。',
    },
    {
      id: 'openstax-population',
      title: 'OpenStax Biology 2e — Population Demography',
      url: 'https://openstax.org/books/biology-2e/pages/45-1-population-demography',
      note: '核对种群、取样与数量估计；数据和情境为原创。',
    },
    {
      id: 'openstax-cycles',
      title: 'OpenStax Biology 2e — Biogeochemical Cycles',
      url: 'https://openstax.org/books/biology-2e/pages/46-3-biogeochemical-cycles',
      note: '核对碳、水及营养物质循环的过程方向。',
    },
    {
      id: 'openstax-diversity',
      title: 'OpenStax Biology 2e — The Biodiversity Crisis',
      url: 'https://openstax.org/books/biology-2e/pages/47-1-the-biodiversity-crisis',
      note: '核对生物多样性的层次及物种丰富度的含义。',
    },
  ],
}
