// ESAT 酶章节：串联催化、专一性、实验条件与消化，配套诊断真题讲解、原创变式和分主题图解。
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'
import { enzymeMethods } from './enzymeMethods'

const catalystExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '曲线变平，能不能说酶已经用完？',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2021_NSAA_Q067',
      why: '把产物—时间曲线、初始速率单位换算和催化剂的特点放在同一道题中，适合检查你是否真正会解释平台。',
    },
    answer: 'D：只有陈述 3 正确。',
    steps: [
      '先看纵轴：它表示**累计产物质量**，所以反应速率要看曲线斜率。曲线后段接近水平，只说明产物几乎不再增加，不能直接说明酶发生了什么。',
      '陈述 1 把酶当成了会被反应消耗的原料。酶完成催化后可以继续使用，因此不能用“酶在反应中用完了”解释平台。酶可能失活，与酶被反应净消耗是两回事。',
      '陈述 2 要用起始直线段计算：前 10 s 约生成 5 g，初始速率约为 5 ÷ 10 = 0.5 g/s；换成每分钟是 0.5 × 60 = **30 g/min**，并非 120 g/min。',
      '陈述 3 用的是 may：产物在高浓度下抑制酶，确实是反应变慢的一种可能原因。图不能证明一定发生了产物抑制，但本题只要求判断是否可能，因此 3 正确。',
    ],
    optionNotes: [
      'A：漏掉了陈述 3；产物抑制可以使反应减慢。',
      'B：陈述 1 错，酶不是按反应次数被净消耗的原料。',
      'C：陈述 2 错，初始速率约为 30 g/min。',
      'D：只保留陈述 3，与逐条判断一致。',
      'E：选入的 1、2 都错误，而且漏掉 3。',
      'F：3 可以成立，但 1 把酶的失活与酶被消耗混淆。',
      'G：3 可以成立，但 2 的速率数值不对。',
      'H：把三条都接受，漏查了酶的作用特点和时间单位。',
    ],
    takeaway:
      '**曲线平台告诉你反应慢下来了，不会自动告诉你原因。**先算斜率，再用酶的性质排除不成立的解释，最后区分“可能”与“已经证明”。',
    variant: {
      question:
        'In a separate experiment, the initial straight section rises from 0 g at 0 s to 9 g at 15 s. What is the initial rate in g min⁻¹? Would a later plateau by itself prove that the enzyme had denatured?',
      answer: '初始速率为 36 g/min；后来的平台不能单独证明酶已变性。',
      explanation:
        '先算 9 ÷ 15 = 0.6 g/s，再乘 60 得 36 g/min。平台还可能由底物不足、产物抑制等原因造成；要判断变性，需要恢复适宜条件或补加底物等进一步对照。',
    },
  },
  {
    title: '两条曲线到达同一终点，能推断什么？',
    question: '',
    source: {
      questionCode: 'ESAT-2020-BIOLOGY-011',
      why: '用同一张图同时比较反应快慢和最终产物量，并要求判断不同 pH 条件是否可能产生该结果。',
    },
    answer: 'C：陈述 1 和 3 都可能正确。',
    steps: [
      '先读出两个独立的信息：X 的初始斜率较大，说明早期反应较快；X、Y 最后到达相同高度，说明**最终产物质量相同**。不要只看到 X 先到终点，就说 X 产物更多。',
      '陈述 1 和 3 是分别提出的可能解释，不是说 X 的 pH 同时更高又更低。若两组都在最适 pH 以下，提高 pH 可能让 X 更接近最适值；若都在最适值以上，降低 pH 也可能让 X 更接近最适值。因此 1、3 都可能。',
      '陈述 2、4 只改变底物供应量。按本题通常采用的**底物最终反应完毕**模型，在其余条件相同的比较中，底物总量改变会使最终产物量不同，不能解释这里相同的平台，因此不选 2、4。这一步依赖这个模型：如果还有产物抑制或酶失活等终止原因，就不能仅凭相同平台断定初始底物量相同。',
      '关键不是背“pH 越高反应越快”，而是看它离该酶的适宜范围有多远。图中没有给出 pH 数值，不能仅凭斜率确定谁的 pH 更高。',
    ],
    optionNotes: [
      'A：1、3 都是可能的 pH 解释，不能全部排除。',
      'B：1 可能，但 2 与相同的终点产物量不符。',
      'C：1、3 是两个分别成立的可能情形，符合题目 could 的问法。',
      'D：1 可能，但 4 不能解释相同的平台。',
      'E：3 可能，但 2 把较快或较慢混同为底物总量不同。',
      'F：2、4 都是改变底物供应量，不符合本题同终点的比较。',
      'G：3 可能，但 4 与相同终点不符。',
      'H：1、3 可以解释速率差异；2、4 不能一并接受。',
    ],
    takeaway:
      '**斜率看快慢，平台高度看最终量。**只有在底物最终反应完毕的模型下，才能用最终产物量比较起始底物量；平台本身不能排除其他终止原因。比较 pH 时要问“谁更接近最适条件”，不能只按数值高低判断。',
    variant: {
      question:
        'For the same enzyme, the optimum pH is 7. Both experiments start with equal amounts of substrate. X is at pH 6 and Y at pH 4, and both reactions eventually convert all the substrate into the same product. Which curve is expected to have the greater initial slope, and should their final product masses differ?',
      answer: '通常 X 的初始斜率较大；两组最终产物质量相同。',
      explanation:
        '在题设两点都低于最适 pH、且 X 更接近适宜条件的比较中，X 通常更快。题目已明确两组相同底物最终都完全转化，所以速度差异不改变最终产物量。',
    },
  },
]

const specificityExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '透明圈能告诉我们是哪一种酶在起作用吗？',
    question: '',
    source: {
      questionCode: 'NSAA_2023_S1-Q064',
      why: '把酶的底物专一性放进淀粉琼脂实验，同时考查面积读图和煮沸对酶活性的影响。',
    },
    answer: 'F：陈述 1 和 3 正确。',
    steps: [
      '先弄清楚“透明”代表什么：碘遇到淀粉呈蓝黑色，所以透明区域表示那里的淀粉已被消化。题目特意说琼脂不会被这些酶消化，不能把透明圈解释为琼脂本身被吃掉。',
      '陈述 1 要比较面积，不是只比较直径。图中 W 的透明圈直径约为 X 的 2 倍，孔的面积可忽略，所以面积比约为 2² = **4 倍**，陈述 1 正确。',
      '陈述 2 的前半句可以成立：淀粉酶能消化淀粉。但蛋白酶作用于蛋白质，不能解释 X 周围的淀粉消失。**一条陈述有两部分，必须两部分都成立**，所以 2 错。',
      'Z 没有明显透明圈，与煮沸使酶变性、无法有效消化淀粉相容。因此“可能含有煮沸的酶”成立。但不能反过来断言 Z 一定放了煮沸的酶，因为水等其他处理也可能不产生透明圈。',
    ],
    optionNotes: [
      'A：漏掉正确的面积比较和煮沸解释。',
      'B：1 正确，但漏掉了 3 的可能性。',
      'C：2 错，蛋白酶不能消化淀粉。',
      'D：3 正确，但漏掉了 1 的面积关系。',
      'E：1 正确，2 错；同时漏掉 3。',
      'F：保留 1、3，排除 2，判断完整。',
      'G：错误接受 2，并漏掉 1。',
      'H：多选了 2，没有检查蛋白酶的底物。',
    ],
    takeaway:
      '先把实验现象翻译成**哪一种底物减少了**，再判断酶是否能作用于它。图形上的直径比、面积比也要分清。',
    variant: {
      question:
        'In a new starch-agar experiment, the clear-circle radii around W and X are 3.0 mm and 2.0 mm. The well areas are negligible. What is the ratio of the digested areas? Could purified protease alone explain the clear circle around X?',
      answer: '面积比为 9∶4；单独使用纯蛋白酶不能解释 X 的透明圈。',
      explanation:
        '圆面积与半径平方成正比，因此 3²∶2² = 9∶4。透明圈反映淀粉被消化，而蛋白酶的底物是蛋白质；换了半径数据，并没有改变酶的专一性。',
    },
  },
]

const conditionsExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '气泡少了多少？高温又改变了什么？',
    question: '',
    source: {
      questionCode: 'NSAA_2016_S1-Q058',
      why: '把温度实验的百分比计算与酶变性的解释放在同一组选项里，要求数值和生物学原因都正确。',
    },
    answer: 'C：气泡数下降 75%，高温破坏维持酶结构的作用力。',
    steps: [
      '装置测的是土豆中的酶分解过氧化氢时产生的氧气气泡。看表中题目指定的两行：30°C 时每分钟 32 个气泡，60°C 时为 8 个。',
      '减少量是 32 − 8 = 24。百分比下降必须以**原来的 32**为分母：(32 − 8) ÷ 32 × 100% = 75%。8 ÷ 32 = 25% 是剩余比例，不是下降比例。',
      '高温可能破坏维持蛋白质酶三维结构的作用力，使活性位点不能正常工作，反应速率下降。这里说的是**酶变性或失活**，不是“酶死了”；酶本身不是活细胞。',
      '把两列一起核对：只有 C 同时给出 75% 和正确的结构解释。',
    ],
    optionNotes: [
      'A：结构解释合理，但 20% 与 32 降到 8 的计算不符。',
      'B：20% 算错，而且“酶死了”也不准确。',
      'C：75% 的计算和高温改变酶结构的解释都正确。',
      'D：75% 正确，但酶不是活生物，不能说它死亡。',
      'E：300% 是把减少量 24 除以最终值 8，分母用错。',
      'F：既把最终值当分母算出 300%，又把酶失活写成死亡。',
    ],
    takeaway:
      '多列选项必须**每一列都对**。百分比变化先圈出原值；解释高温效应时，说清楚结构和活性位点怎样受到影响。',
    variant: {
      question:
        'Equal samples of an enzyme are prepared. One sample is strongly heated and then cooled back to the initial temperature; the other is kept unheated as a control. Both are tested at the initial temperature with equal amounts of fresh substrate and the same pH. The unheated control produces 40 oxygen bubbles per minute and the heated sample produces 10. Calculate the percentage decrease relative to the control. Do these results support a persistent loss of enzyme activity after heating?',
      answer: '下降 75%；回温并补加新底物后仍低活性，支持发生了持续的活性损失。',
      explanation:
        '(40 − 10) ÷ 40 × 100% = 75%。两组酶的起始用量相同，测量时温度、pH 和新鲜底物条件也相同。加热组回到原温度后仍明显低于未加热对照，支持高温留下了持续的活性损失，与变性相符；这不是只在高温下测到暂时的速率差异。',
    },
  },
  {
    title: '剩下的淀粉越少，酶的作用是越强还是越弱？',
    question: '',
    source: {
      questionCode: 'ESAT_LEGACY_2022_NSAA_Q071',
      why: '纵轴改成反应后的底物剩余量，需要把读图结果转换为酶的作用强弱，再判断 pH 对结构和活性的影响。',
    },
    answer: 'G：陈述 2 和 3 可以正确。',
    steps: [
      '这张图的纵轴是**5 分钟后剩余的淀粉百分比**，不是反应速率。各组起始条件相同，所以留下的淀粉越少，说明这 5 分钟内分解得越多。曲线最低处约在 pH 7。',
      '陈述 1 比较 pH 4.5 和 pH 6。前者留下的淀粉更多，表示分解量更小；不能说前者形成了更多酶—产物复合物，因此 1 错。',
      '陈述 2 问结构“可能”不同。pH 会影响蛋白质中的相互作用和活性位点，在 pH 5 与 pH 7 下酶的形状可能不同。这与活性差异相容，所以 2 可以正确；不是说仅靠这条曲线就已经直接看到了结构。',
      '陈述 3 保留了 approximately 和 under the conditions：本实验中 pH 7 左右的残留淀粉最少，支持最适 pH 约为 7。因此 3 可以正确。',
    ],
    optionNotes: [
      'A：2、3 都有合理依据，不能全部否定。',
      'B：1 把较多底物剩余误解成较强反应。',
      'C：2 可能，但漏掉了最低点对 3 的支持。',
      'D：3 可能，但漏掉了 pH 改变结构的可能性。',
      'E：2 可以成立，1 的比较方向相反。',
      'F：3 可以成立，1 的比较方向相反。',
      'G：选 2、3，符合纵轴含义和题目的“可能”措辞。',
      'H：错误地把 1 也接受了。',
    ],
    takeaway:
      '看酶图时先读纵轴：**产物增加通常表示作用更强，底物剩余更多却通常表示作用更弱**。不要把所有曲线的最高点都当成最适条件。',
    variant: {
      question:
        'With equal starting amounts of starch, 40% remains at pH 5 and 10% remains at pH 7 after 5 minutes. What is the ratio of the average amounts of starch broken down per minute at pH 7 to pH 5?',
      answer: '3∶2。',
      explanation:
        '先从剩余量换成已分解量：pH 7 分解 90%，pH 5 分解 60%。时间相同，平均分解速率比就是 90∶60 = 3∶2；不能直接用 10∶40 比较反应速率。',
    },
  },
]

const digestionExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '同是蛋白酶，为什么适合消化道的不同位置？',
    question: '',
    source: {
      questionCode: 'ESAT-2020-BIOLOGY-005',
      why: '同时考查消化道环境、酶活性曲线以及酶本身的化学成分，避免只背“某种酶在哪个器官工作”。',
    },
    answer: 'G：陈述 1、2、3 正确。',
    steps: [
      '按图例辨认曲线：胃蛋白酶 pepsin 是实线，约在 pH 2 最活跃；胰蛋白酶 trypsin 是虚线，约在 pH 8 最活跃。**低 pH 对应强酸性**，不是低酸性。',
      '胃内是酸性环境，符合胃蛋白酶的适宜条件，所以 1 正确。图中胰蛋白酶在胃内典型的低 pH 下没有活性，因此 2 正确。',
      '陈述 3 容易被“酶”这个名称干扰：胃蛋白酶本身也是蛋白质。在适合胰蛋白酶作用的条件下，它可能成为胰蛋白酶的底物，因此 3 的 could 可以成立。不能把这句话理解成胰蛋白酶一定在胃内把它消化。',
      '陈述 4 把酸性方向说反了：胃蛋白酶适合高酸性、低 pH；胰蛋白酶适合较碱性的环境。因此 4 错，选择 G。',
    ],
    optionNotes: [
      'A：1、2 正确，但漏掉 3；酶本身也可能成为另一种酶的底物。',
      'B：1、3 正确，但漏掉 2 对胃内酸性环境的判断。',
      'C：1 正确，4 把低 pH 与低酸性混淆。',
      'D：2、3 正确，但漏掉胃蛋白酶适于胃内环境的 1。',
      'E：2 正确，4 的酸性方向错误。',
      'F：3 正确，4 错误。',
      'G：保留 1、2、3，排除 4，判断完整。',
      'H：多选了 4，同时漏掉正确的 1。',
    ],
    takeaway:
      '把三件事连起来：**器官里的环境、酶的最适条件、酶本身也是蛋白质**。“催化者”和“底物”是具体反应中的角色，不是永远不能互换的身份。',
    variant: {
      question:
        'A purified sample of pepsin is transferred to pH 8 and mixed with active trypsin. Could pepsin be digested even though it was originally used as an enzyme? Explain why this does not require trypsin to be active in the stomach.',
      answer: '可能。胃蛋白酶本身是蛋白质；此实验在 pH 8 进行，并不是在胃内。',
      explanation:
        '酶的名称不改变它作为蛋白质的化学本质。胰蛋白酶在适宜条件下可能水解其可作用的肽键。题目已把环境改成 pH 8，因此不需要假设胰蛋白酶在强酸性的胃内也有活性。',
    },
  },
  {
    title: '脂肪酶实验中，为什么要读“变色所需时间”？',
    question: '',
    source: {
      questionCode: 'NSAA_2023_S1-Q071',
      why: '把脂肪消化产物、指示剂变化和实验曲线合在一起，要求从测量量出发判断曲线，而不是套用熟悉的速率图。',
    },
    answer: 'F：时间随底物浓度增大而下降；本实验比较底物浓度的影响；pH 下降。',
    steps: [
      '先问颜色为什么变：脂肪酶分解乳脂产生脂肪酸，使原来呈碱性的混合液 pH 下降，指示剂从粉红色变为无色。**不是脂肪减少直接让指示剂褪色，而是产物改变了 pH**。',
      '再看纵轴写的是什么：这里是达到同一颜色终点所需的时间。题设各组碱液和指示剂用量相同，在本次有响应的浓度范围内，底物浓度较高，达到变色所需的酸量更快，时间就更短，应该沿右侧的下降曲线选择。',
      '温度已保持在脂肪酶最适温度，各组其他变量也保持相同。造成这些组之间时间差异的是底物浓度，而不是温度变化，所以沿“substrate concentration”分支。',
      '最后选择“decrease in pH”，得到 F。这里的判断限于题给实验范围；不能推广成“底物浓度无论多高，继续增加都一定继续提速”。',
    ],
    optionNotes: [
      'A：把时间当成速率，且把脂肪酸导致的 pH 变化方向判反。',
      'B：pH 方向正确，但更快达到终点应表现为时间下降。',
      'C：曲线、限制因素和 pH 方向三项都不符合本题条件。',
      'D：pH 下降正确，但时间曲线和温度分支都错。',
      'E：曲线和底物浓度分支正确，但脂肪酸应使 pH 下降。',
      'F：下降的时间曲线、底物浓度分支、pH 下降三项均正确。',
      'G：时间曲线正确，但温度固定在最适条件，pH 也应下降。',
      'H：曲线与 pH 判断正确，但温度不能解释本题各组差异。',
    ],
    takeaway:
      '先把**底物 → 产物 → 检测信号**说清楚，再看纵轴是速率还是达到终点的时间。相同终点下，反应更快通常表现为用时更短。',
    variant: {
      question:
        'With the same amount of alkali and the same colour endpoint, milk samples A and B become colourless after 30 s and 75 s. Assume the colour endpoint requires the same amount of fatty acid in each sample. What is the ratio of their average fatty-acid production rates, A : B?',
      answer: '5∶2。',
      explanation:
        '产生相同量脂肪酸，平均速率与时间成反比。因此 A∶B = (1/30)∶(1/75) = 75∶30 = 5∶2。不能把时间比 30∶75 直接写成速率比。',
    },
  },
]
// 同一章共享图解与内部核查来源，保留旧版示例字段以兼容讲义数据结构。
function enzymeSection(
  section: Omit<KnowledgeSection, 'example' | 'visual' | 'sourceIds'> & {
    examFocus: KnowledgeExamFocus
  },
): KnowledgeSection {
  const first = section.examFocus.examples[0]!
  return {
    ...section,
    visual: 'enzymes',
    sourceIds: [
      'uat-spec-b8',
      'openstax-enzyme',
      'openstax-digestion',
      'openstax-digestive-products',
    ],
    example: { question: first.question, answer: first.answer, steps: first.steps },
  }
}

export const esatEnzymes: KnowledgeLesson = {
  code: '150800',
  title: 'Enzymes · 酶',
  subtitle: '把酶的作用、实验曲线和消化过程联系起来',
  intro:
    '从催化机制理解反应快慢，再用实验条件、曲线和检测信号判断结论；把消化酶的底物、产物与作用部位联系起来。',
  memory: [
    ...enzymeMethods['150801'].memory,
    ...enzymeMethods['150802'].memory,
    ...enzymeMethods['150803'].memory,
    ...enzymeMethods['150804'].memory,
  ],
  sections: [
    enzymeSection({
      code: '150801',
      title: '酶作为生物催化剂',
      summary: enzymeMethods['150801'].summary,
      paragraphs: [enzymeMethods['150801'].intro],
      memory: enzymeMethods['150801'].memory,
      rules: enzymeMethods['150801'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把能量图峰顶的数值直接当成活化能，忘记减去反应物能量。',
        '把“更快达到终点”写成“必然改变终点产量”。',
        '把“可以反复催化”误写成“酶永远不会变性或降解”。',
      ],
      check: {
        question:
          '一个可逆反应在相同温度下已经达到平衡。此时加入能催化该反应的酶，不改变其他条件。最合理的判断是什么？',
        options: [
          '平衡一定向产物侧移动。',
          '酶使正逆反应都更快，但不改变平衡时的组成。',
          '酶把产物的能量降到更低，因此终点改变。',
          '所有反应立即停止，因为酶没有底物。',
        ],
        answerIndex: 1,
        explanation:
          '选 B。平衡是正逆反应速率相等，并非分子停止反应。酶降低相应的反应障碍，使两方向都加快，但**不改变同一温度下的平衡位置**。',
      },
      examFocus: {
        goal: '酶改变的是**反应进行得有多快**；把这个作用与原料、能量收支和最终平衡区分开。',
        comparison: {
          title: '加入酶后，哪些会变，哪些不因此改变？',
          columns: ['比较项目', '酶的影响'],
          rows: [
            ['活化能', '降低'],
            ['相同条件下的反应速率', '提高'],
            ['同一反应的总能量变化', '不改变'],
            ['可逆反应的平衡位置', '不改变'],
            ['完成催化后的酶', '再生，可继续催化'],
          ],
        },
        examples: catalystExamples,
        checklist: [
          '能从图中区分活化能与总能量变化吗？',
          '能解释为什么反应停止不一定是酶被消耗吗？',
          '能区分短时间内产物较多与最终产量较多吗？',
        ],
      },
    }),
    enzymeSection({
      code: '150802',
      title: '酶的作用机制与专一性',
      summary: enzymeMethods['150802'].summary,
      paragraphs: [enzymeMethods['150802'].intro],
      memory: enzymeMethods['150802'].memory,
      rules: enzymeMethods['150802'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把专一性简化成“大小相同就能反应”。',
        '把酶与底物的暂时结合误认为酶被底物永久消耗。',
        '看到蛋白质结构有变化就说一定变性，忽略正常的诱导契合。',
      ],
      check: {
        question:
          '一种酶与底物结合时活性位点稍作调整，反应后释放产物，随后继续催化。哪句话最恰当？',
        options: [
          '酶只要调整形状，就已经永久变性。',
          '产物释放说明酶已被分解。',
          '这是正常催化过程，调整可帮助底物结合与转化。',
          '底物与酶的分子大小一定完全相同。',
        ],
        answerIndex: 2,
        explanation:
          '选 C。这种正常的结构调整可用诱导契合解释。**暂时调整、催化、产物释放与重复使用**可以属于同一个正常循环，不代表酶已损坏。',
      },
      examFocus: {
        goal: '专一性来自结构与化学性质的适合；用**结合—转化—释放**理解酶怎样反复工作。',
        comparison: {
          title: '反应过程中各角色的区别',
          columns: ['名称', '在本次反应中的角色', '反应结束后'],
          rows: [
            ['酶 enzyme', '催化底物转化', '再生，可继续使用'],
            ['底物 substrate', '进入催化反应的反应物', '被转化为产物'],
            ['活性位点 active site', '酶上的结合和催化区域', '可供后续底物使用'],
            ['产物 product', '本次反应形成的物质', '离开活性位点；可进入后续反应'],
          ],
        },
        examples: specificityExamples,
        checklist: [
          '能解释活性位点为什么不仅与形状有关吗？',
          '正常的诱导契合与变性有什么不同？',
          '为什么改变氨基酸不一定使酶失活？',
        ],
      },
    }),
    enzymeSection({
      code: '150803',
      title: '温度、pH 与酶促反应速率',
      summary: enzymeMethods['150803'].summary,
      paragraphs: [enzymeMethods['150803'].intro],
      memory: enzymeMethods['150803'].memory,
      rules: enzymeMethods['150803'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把最适温度直接等同于开始变性的温度。',
        '用“高温碰撞更多”解释整条曲线，忽略酶结构受损。',
        '把时间比直接当作同终点的速率比，或把测试中最快的 pH 当成精确最适 pH。',
      ],
      check: {
        question:
          '研究一种酶的最适 pH，在 pH 3、5、7 三组分别测得初始速率 2、12、8。能直接支持哪项结论？',
        options: [
          '这三组中 pH 5 的速率最高，但精确峰值还需加密取点。',
          '所有酶的最适 pH 都是 5。',
          'pH 3 的酶一定全部永久变性。',
          '该酶在 pH 6 的速率一定等于 10。',
        ],
        answerIndex: 0,
        explanation:
          '选 A。已有数据只证明 pH 5 是这三个测点里最快的。**未测点不能按直线随意补出精确数值**，也不能从低速直接判定永久变性，更不能推广到所有酶。',
      },
      examFocus: {
        goal: '温度与 pH 既影响分子相遇，也可能影响酶的结构和化学性质；**结合实验条件解释速率**。',
        comparison: {
          title: '相似的“变慢”，可能有不同原因',
          columns: ['情况', '可能的原因', '需要记住的区别'],
          rows: [
            ['低温', '有效碰撞减少', '回温后常可恢复'],
            ['过高温度', '正常结构受损、变性', '降温后不一定恢复'],
            ['偏离适宜 pH', '电荷、结合或结构改变', '不自动等于永久变性'],
            ['反应后期', '底物减少或条件改变等', '不是酶一定已被用完'],
          ],
        },
        examples: conditionsExamples,
        checklist: [
          '能区分处理温度和测量温度吗？',
          '怎样用同一终点的时间比较平均速率？',
          '测最适 pH 时需要控制什么，为什么需要更密集取点？',
        ],
      },
    }),
    enzymeSection({
      code: '150804',
      title: '消化酶：底物、产物与作用部位',
      summary: enzymeMethods['150804'].summary,
      paragraphs: [enzymeMethods['150804'].intro],
      memory: enzymeMethods['150804'].memory,
      rules: enzymeMethods['150804'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '把胰腺制造的酶写成只在胰腺作用。',
        '把胆汁当作脂肪酶，把乳化当作脂肪分子的化学水解。',
        '仅凭淀粉消失就认定葡萄糖是唯一产物，或把胃蛋白酶直接写成完成全部蛋白质消化。',
      ],
      check: {
        question: '哪一组“物质—直接作用”的对应正确？',
        options: [
          '胆盐—把脂肪滴乳化，使脂肪酶有更大的接触面积。',
          '淀粉酶—把蛋白质直接变成氨基酸。',
          '胃酸—作为蛋白酶逐个切断肽键。',
          '麦芽糖酶—把葡萄糖从肠腔主动运输进血液。',
        ],
        answerIndex: 0,
        explanation:
          '选 A。胆盐通过乳化帮助接触，真正的脂肪水解由脂肪酶催化。B 底物错误；C 把酸性条件与酶混淆；D 把麦芽糖消化与葡萄糖吸收混淆。',
      },
      examFocus: {
        goal: '用**底物—酶—产物—作用部位**把消化知识连成完整过程，再分清它与吸收的衔接。',
        comparison: {
          title: '主要消化酶的作用',
          columns: ['酶或辅助物质', '作用对象', '主要结果', '主要作用位置'],
          rows: [
            ['淀粉酶', '淀粉', '麦芽糖及较短糖链；需后续酶形成葡萄糖', '口腔、小肠'],
            ['蛋白酶／肽酶', '蛋白质／肽', '逐步形成较短肽，最终主要为氨基酸', '胃、小肠'],
            ['脂肪酶', '脂肪', '脂肪酸等；胰脂肪酶主要同时产生单甘油酯', '主要在小肠'],
            ['胆盐（非酶）', '脂肪滴', '乳化，增大接触面积；不水解分子', '小肠'],
          ],
        },
        examples: digestionExamples,
        checklist: [
          '能区分淀粉酶的直接产物与糖类消化的最终产物吗？',
          '为什么食物不必进入胰腺，也能被胰酶消化？',
          '胆汁、脂肪酶和肠上皮分别承担什么工作？',
        ],
      },
    }),
  ],
  sources: [
    {
      id: 'uat-spec-b8',
      title: 'UAT-UK ESAT Content Specification 2026/27 · B8',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '内部核查 B8.1–B8.4 的酶成分、作用机制、温度与 pH 和消化酶范围；例题选自诊断测试中的历年真题，变式为原创。',
    },
    {
      id: 'openstax-enzyme',
      title: 'OpenStax Biology 2e · 6.5 Enzymes',
      url: 'https://openstax.org/books/biology-2e/pages/6-5-enzymes',
      note: '内部核对活化能、活性位点、诱导契合与环境条件；图解为原创矢量绘制。',
    },
    {
      id: 'openstax-digestion',
      title: 'OpenStax Biology 2e · 34.3 Digestive System Processes',
      url: 'https://openstax.org/books/biology-2e/pages/34-3-digestive-system-processes',
      note: '内部核对消化酶、乳化与吸收，区分阶段产物及完整消化的概括。',
    },
    {
      id: 'openstax-digestive-products',
      title: 'OpenStax Anatomy and Physiology 2e · 23.7 Chemical Digestion and Absorption',
      url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-7-chemical-digestion-and-absorption-a-closer-look',
      note: '内部核对淀粉酶和胰脂肪酶的直接产物，以及小肠吸收的具体层次；不展示来源区域。',
    },
  ],
}
