// ESAT 酶章节：串联催化、专一性、实验条件与消化，配套原创例题、变式和分主题图解。
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'

const catalystExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '能量图中，酶究竟改变了哪一段？',
    question:
      'In an energy profile, the reactants are at 30 kJ mol⁻¹ and the products at 10 kJ mol⁻¹. The peak is at 100 kJ mol⁻¹ without an enzyme and at 60 kJ mol⁻¹ with an enzyme. What are the activation energy with the enzyme and the overall energy change?',
    options: [
      '60 and −20 kJ mol⁻¹',
      '30 and +20 kJ mol⁻¹',
      '30 and −20 kJ mol⁻¹',
      '70 and −40 kJ mol⁻¹',
    ],
    answer: 'C：催化后的活化能为 30 kJ mol⁻¹，反应总能量变化为 −20 kJ mol⁻¹。',
    steps: [
      '活化能是从反应物所在位置到峰顶的高度差。加入酶后，峰顶是 60，反应物是 30，因此活化能为 60 − 30 = 30 kJ mol⁻¹。**峰顶的纵坐标本身不等于活化能**。',
      '总能量变化看终点与起点：10 − 30 = −20 kJ mol⁻¹。负号表示产物能量低于反应物，而不是反应不能发生。',
      '酶把峰降低，但起点和终点都没变。因此它能加快速率，却不改变这次反应的总能量变化，选 C。',
    ],
    optionNotes: [
      'A：把峰顶 60 直接当成活化能，漏减了反应物的 30。',
      'B：活化能算对，但把“产物减反应物”的顺序颠倒了。',
      'C：分别计算“峰顶减起点”和“终点减起点”，两项都正确。',
      'D：70 是未加酶时的活化能；−40 则把两条路径的峰高变化当成总能量变化。',
    ],
    takeaway:
      '先认清图里的**起点、终点和峰顶**。催化作用改变跨过反应障碍的难易，不把反应物或产物换成另一种能量状态。',
    variant: {
      question:
        'A different enzyme gives an alternative pathway with a peak at 50 kJ mol⁻¹, while the same reactants and products remain at 30 and 10. What changes in your answer?',
      answer: '活化能改为 20 kJ mol⁻¹；总能量变化仍为 −20 kJ mol⁻¹。',
      explanation:
        '新的峰顶更低，所以 50 − 30 = 20。起点、终点没有改变，10 − 30 仍为 −20。**酶不是通过改变反应总能量来加速反应的**。',
    },
  },
  {
    title: '反应停下来，是不是酶已经用完了？',
    question:
      'An enzyme converts all of a limited supply of substrate into product. The temperature and pH remain suitable. The products do not inhibit the enzyme. More of the same substrate is then added and product formation resumes without adding more enzyme. Which statement best explains this?',
    options: [
      'The enzyme can be reused after releasing its products.',
      'The original substrate molecules have turned into new enzyme molecules.',
      'The enzyme was consumed and then recreated from the products.',
      'The enzyme permanently increases the total amount of energy released per substrate molecule.',
    ],
    answer: 'A：酶释放产物后可以继续催化下一批底物。',
    steps: [
      '先看停止前最明确的条件：底物已经全部转成产物。没有底物可作用，即使酶仍正常，产物也不会继续增加。',
      '加回底物后，不补充酶也能重新反应，说明原来的酶还能使用。它在一个完整催化循环结束后被再生，**不是按“每消耗一份底物就消耗一份酶”工作**。',
      '题干没有发生蛋白质合成，也没有提供酶改变反应总能量的证据，因此 B、C、D 都不能解释现象。',
    ],
    optionNotes: [
      'A：符合“加底物即可恢复”的观察。',
      'B：底物转成反应产物，不会自动变成负责催化的酶。',
      'C：酶没有在这个反应中被净消耗，不需要由产物重新制造。',
      'D：催化作用改变反应速率，不改变每份底物的总能量变化。',
    ],
    takeaway:
      '看到产物曲线变平，先问**底物是否耗尽、条件是否变化**。曲线变平本身不能证明酶被用完或变性。',
    variant: {
      question:
        'The enzyme is now strongly heated before fresh substrate is added, and no further product forms at the original temperature. Is substrate shortage still a sufficient explanation?',
      answer: '不是；已经补足底物，需要考虑酶受到高温损伤。',
      explanation:
        '条件改变后，原来“缺底物”的解释不再够用。高温可能使酶变性，活性位点不再正常工作；但判断原因仍应有未加热对照，不能只凭一次反应失败断言全部酶都已变性。',
    },
  },
]

const specificityExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '从底物对照中能得出多大范围的结论？',
    question:
      'Purified enzyme E is tested separately with substrates X and Y. The assays detect products from either reaction, and all other conditions are suitable and controlled. With E, X produces product at 12 units per minute and Y at 0. Without E, both rates are 0. Which conclusion is supported?',
    options: [
      'E is consumed whenever X is converted into product.',
      'E catalyses the conversion of X but shows no detectable activity on Y under these conditions.',
      'E must catalyse every reaction involving a molecule the same size as X.',
      'Y must be an enzyme because it does not form product.',
    ],
    answer: 'B：E 在这些条件下催化 X 的反应，但对 Y 没有检测到活性。',
    steps: [
      '先用无酶对照判断是否与 E 有关：X 在没有 E 时为 0，加入 E 后为 12，说明 E 加快了这里测量的反应。',
      'Y 在加酶后仍是 0，表示在本次条件和检测范围内，没有检测到 E 对 Y 的催化作用。这个结果符合**酶有专一性**。',
      '大小相同不代表形状和化学性质都适合活性位点；也不能因为 Y 没反应，就把它改判成酶。因此能得到的结论是 B。',
    ],
    optionNotes: [
      'A：速率数据没有测量酶的消耗，酶也不因完成催化而被净消耗。',
      'B：同时说明 X 的结果和 Y 的结果，并保留了实验条件的限制。',
      'C：只比较分子大小不足以判断是否能结合和被催化。',
      'D：不能反应的底物候选并不会因此成为酶。',
    ],
    takeaway:
      '实验支持多大的结论，就说到多大范围。**没有检测到某次反应，不等于已经证明它在所有条件下都不可能发生**。',
    variant: {
      question:
        'A second enzyme F converts Y to product in a separate controlled assay. Does this contradict the result for enzyme E?',
      answer: '不矛盾。',
      explanation:
        '不同酶具有不同的活性位点和催化作用。Y 不适合 E，并不妨碍它适合 F。专一性说的是**某种酶与它能作用的底物、反应之间的关系**，不是说一种分子永远不能被任何酶转化。',
    },
  },
  {
    title: '改变活性位点后，为什么反应可能变慢？',
    question:
      'A mutation changes one amino acid in a protein enzyme. Equal amounts of the original and altered enzyme are compared at the same temperature, pH and substrate concentration. The altered enzyme binds the substrate less effectively. Which explanation is most consistent with a lower reaction rate?',
    options: [
      'Every mutation changes the enzyme into a carbohydrate.',
      'The substrate must now be consumed without forming products.',
      'The enzyme must now supply more energy to the reaction.',
      'The altered active site forms fewer productive enzyme–substrate complexes per unit time.',
    ],
    answer: 'D：改变后的活性位点更难与底物形成能完成催化的复合物。',
    steps: [
      '先把 DNA、蛋白质和功能连起来：突变改变氨基酸，可能改变酶的折叠或活性位点附近的化学性质。题干已经给出本题的具体后果——底物结合变差。',
      '酶需要先与合适底物结合，才更容易完成催化。结合变差时，单位时间内有效的酶—底物复合物可能减少，因而产物形成更慢。',
      '用量和外部条件都相同，所以不能把差别推给“酶加少了”或温度不同。D 直接连接了已知变化与速率结果。',
    ],
    optionNotes: [
      'A：氨基酸改变不会把蛋白质直接变成糖类；并非每次突变都会改变功能。',
      'B：底物不能有效结合，不等于它会无缘无故消失。',
      'C：酶通过降低活化能催化，不是给每份底物提供反应能量。',
      'D：把活性位点、结合和产物形成串起来，符合题干。',
    ],
    takeaway:
      '解释“结构改变影响功能”时，把中间一步说出来：**活性位点改变 → 与底物结合或催化变差 → 速率降低**。不要只重复“酶变了，所以慢了”。',
    variant: {
      question:
        'A different mutation leaves substrate binding and all measured catalytic properties unchanged. Must the reaction rate fall?',
      answer: '不必。',
      explanation:
        '这里没有证据表明活性位点或催化过程受到影响。**基因发生变化不等于酶功能必然下降**；要看变化发生在哪里、是否改变实际功能。',
    },
  },
]

const conditionsExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '回到同一温度，才能看清低温和高温的区别',
    question:
      'Equal samples of an enzyme are kept for 10 minutes at 5°C, 35°C or 85°C. All samples are then tested at 35°C with fresh substrate at the same pH. Their initial rates are 18, 18 and 1 units per minute, respectively. Which explanation best fits the results?',
    options: [
      'Both 5°C and 85°C must permanently denature all enzyme molecules.',
      'The 5°C sample contains more substrate because cold creates substrate molecules.',
      'The effect of cooling is reversible here, whereas heating to 85°C causes a persistent loss of activity.',
      'The 85°C sample must work fastest because higher temperature always gives a higher rate.',
    ],
    answer: 'C：本实验中低温造成的影响可恢复，高温处理后仍有明显活性损失。',
    steps: [
      '最关键的是测量时都在 35°C。现在比较的是**先前处理留下的影响**，不能再用“测量时分子运动快慢不同”解释三组差异。',
      '5°C 处理组恢复到 18，与未受高温影响的 35°C 组相同，说明低温处理没有造成这里能检测到的持久损伤。',
      '85°C 处理组回到 35°C 仍只有 1，符合高温使大量酶失去正常结构、活性位点受损。速率不是 0，也不能说每一个酶分子都已完全失活。',
      '因此选 C。高温下碰撞增多与高温造成变性是两种影响，不能只记前一条。',
    ],
    optionNotes: [
      'A：低温组已恢复，且高温组仍有少量活性，“全部永久变性”超出数据。',
      'B：各组使用新鲜底物且条件相同，冷却不会制造底物。',
      'C：准确概括回温后的差异，也没有把现象说成绝对规律。',
      'D：忽略变性，而且三组真正测量速率时的温度相同。',
    ],
    takeaway:
      '想区分“暂时变慢”和“持续失活”，就看**恢复适宜条件后能否恢复活性**，并用同一温度、pH 和底物条件作比较。',
    variant: {
      question:
        'The three rates had instead been measured directly at 5°C, 35°C and 85°C. Would the low rate at 5°C alone prove irreversible damage?',
      answer: '不能。',
      explanation:
        '直接在低温测得慢速，可能只是分子运动和有效碰撞减少。还没有做回温实验，就不能断定结构已被永久破坏。',
    },
  },
  {
    title: '同一终点的反应，时间怎样换成相对速率？',
    question:
      'Two starch–amylase mixtures contain equal amounts of starch and enzyme at the same temperature. Only pH differs. At pH 6, the iodine test first shows no detectable starch after 40 s; at pH 4, this takes 100 s. Assuming the same reaction endpoint, what is the ratio of average starch breakdown rates at pH 6 to pH 4?',
    options: ['2 : 5', '5 : 2', '3 : 2', '1 : 1'],
    answer: 'B：pH 6 与 pH 4 的平均速率之比为 5∶2。',
    steps: [
      '两组从相同淀粉量到相同检测终点，比较的反应量相同。平均速率等于反应量除以时间，因此用时越少，平均速率越大。',
      '速率比为 (1/40)∶(1/100) = 100∶40 = 5∶2。**时间比要取倒数，不能把 40∶100 直接当成速率比**。',
      '这说明本实验中 pH 6 的平均速率更高；只测两个 pH，还不能确定最适 pH 恰好等于 6。检测间隔也会影响终点时间的精确程度。',
    ],
    optionNotes: [
      'A：这是时间之比，方向与速率相反。',
      'B：在反应量相同的前提下正确使用时间的倒数。',
      'C：把两组时间的差与某个时间相比，不能得到所求速率比。',
      'D：起始底物相同只保证比较公平，并不表示速率相同。',
    ],
    takeaway:
      '使用 **速率与 1/时间成正比** 前，先确认两组达到的是同一终点。若反应量不同，就必须分别计算“反应量 ÷ 时间”。',
    variant: {
      question:
        'A third mixture at pH 7 reaches the same endpoint in 25 s. What is its average rate relative to the pH 6 mixture, and is pH 7 now proven to be the exact optimum?',
      answer: '平均速率为 pH 6 组的 1.6 倍；仍不能证明最适 pH 恰好是 7。',
      explanation:
        '40/25 = 1.6。pH 7 只是目前测试条件中最快；峰值也可能位于 6 与 7 之间、7 与其他未测值之间，需更密集的取点确认。',
    },
  },
]

const digestionExamples: KnowledgeExamFocus['examples'] = [
  {
    title: '淀粉变成葡萄糖，中间还需要哪一步？',
    question:
      'A starch solution is treated with purified amylase, producing maltose and shorter carbohydrate chains. A sample containing maltose is then treated with maltase, producing glucose. Which statement is correct?',
    options: [
      'Amylase must be a substrate for maltase.',
      'The two enzymes catalyse different steps in carbohydrate digestion.',
      'Amylase alone directly converts all starch into amino acids.',
      'Maltase absorbs glucose across the intestinal wall.',
    ],
    answer: 'B：两种酶分别催化糖类消化中的不同步骤。',
    steps: [
      '把顺序读清楚：淀粉先被淀粉酶分解成麦芽糖和较短糖链；其中的麦芽糖再被麦芽糖酶分解为葡萄糖。两种酶各有自己的底物和作用。',
      '不能因为糖类消化最终得到葡萄糖，就把每一步都写成“淀粉酶直接制造葡萄糖”。题干已经明确给出了中间产物。',
      '葡萄糖形成属于消化；葡萄糖随后跨过肠壁进入体内属于吸收。**酶催化分解，不替代肠上皮的运输过程**，所以选 B。',
    ],
    optionNotes: [
      'A：麦芽糖是这里麦芽糖酶的底物，不是淀粉酶。',
      'B：把两个不同底物、不同反应步骤正确连接起来。',
      'C：氨基酸来自蛋白质消化；这里也不是“一步完成全部过程”。',
      'D：把消化和吸收混为一谈，跨膜运输不由麦芽糖酶代办。',
    ],
    takeaway:
      '问“某一种酶的作用”时，明确写出**这一步的底物和产物**；问“某类食物消化的最终产物”时，才把整个过程合起来。',
    variant: {
      question:
        'Protein is first broken into shorter peptides in the stomach and later digested further in the small intestine. What are the main final products absorbed from complete protein digestion?',
      answer: '氨基酸。',
      explanation:
        '胃蛋白酶先把蛋白质切成较短肽链，后续蛋白酶和肽酶继续分解，最终主要以氨基酸形式吸收。不能因此说“胃蛋白酶单独一步就把所有蛋白质完全变成氨基酸”。',
    },
  },
  {
    title: '胆汁怎样帮助脂肪酶，却不充当脂肪酶？',
    question:
      'Two mixtures contain equal masses of fat and equal amounts of lipase at the same buffered pH and temperature. Bile salts are added only to mixture X and divide the fat into smaller droplets. Fat digestion is faster in X. Which explanation best accounts for the difference?',
    options: [
      'Bile salts are enzymes that replace lipase.',
      'Bile salts increase the total mass of fat available.',
      'Smaller droplets provide a larger total surface area for lipase to act on.',
      'The smaller droplets must already be fatty acid molecules.',
    ],
    answer: 'C：小脂肪滴提供更大的总接触面积，使脂肪酶更容易作用。',
    steps: [
      '先找题干真正改变了什么：脂肪总质量、脂肪酶量、温度与 pH 都相同，改变的是脂肪滴的大小。',
      '同样一份脂肪分散成许多小滴，总表面积增大，脂肪酶可接触的脂肪—水界面增多，因此水解可加快。',
      '胆盐使脂肪分散叫乳化，这一步没有把脂肪分子本身变成脂肪酸。**乳化提供接触条件，脂肪酶催化化学分解**，选 C。',
      '胆汁还参与提供适宜的肠道环境，但本题已用缓冲液保持两组 pH 相同，不能拿 pH 改变解释本次差异。',
    ],
    optionNotes: [
      'A：胆盐不是消化酶，也不会替代脂肪酶的催化作用。',
      'B：总质量相同，只是分散程度改变。',
      'C：抓住控制 pH 后仍不同的变量——接触面积。',
      'D：脂肪滴是许多脂肪分子的集合，变小不等于分子已水解。',
    ],
    takeaway:
      '先区分**物理分散与化学水解**，再看实验控制了哪些因素。原理虽然都知道，也只能用未被控制掉的变化解释差异。',
    variant: {
      question:
        'In an unbuffered lipase assay, fatty acids accumulate and pH falls. Why might the rate later decrease even while some fat remains?',
      answer: 'pH 改变可能使脂肪酶偏离适宜条件，活性下降。',
      explanation:
        '底物尚有剩余，不保证速率恒定。脂肪酸使环境酸化，可能影响活性位点的化学性质与结构，因此使反应变慢。需要结合 pH 数据或缓冲对照判断，不能只凭后期变慢就断言酶被消耗了。',
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
    '酶这一章最容易出现“名词都记得，条件一换就选错”的情况。我们先弄清楚三件事：酶怎样让反应变快，为什么它只适合某些底物，以及温度和 pH 怎样影响它。再把这些知识放进消化和实验数据里，你就能说明速率为什么变化，而不只是背一句“酶有专一性”。',
  memory: [
    '==酶降低活化能，加快反应；不改变同一反应的总能量变化或平衡位置==。',
    '**酶主要是蛋白质**，完成一次催化后可以再用；“没有被反应消耗”不等于永远不会损伤或降解。',
    '专一性来自活性位点与底物的形状、化学性质相适合；**结合、转化、释放产物**是连续过程。',
    '**低温通常让反应暂时变慢；过高温度可能使酶变性**。回到适温能否恢复，是区分两者的重要证据。',
    '比较同一反应量所需时间时，**时间越短，平均速率越大**；仅测到最快的一点，还不一定找到了精确最适条件。',
    '淀粉酶作用于淀粉，蛋白酶作用于蛋白质，脂肪酶作用于脂肪。==胆汁乳化脂肪，但不是酶；消化与吸收也不是同一步==。',
  ],
  sections: [
    enzymeSection({
      code: '150801',
      title: '酶作为生物催化剂',
      summary: '酶帮助反应更快发生，但不代替反应原料，也不改变反应本身的能量收支。',
      paragraphs: [
        '许多生命活动中的反应，在体内温和的条件下自行进行得很慢。酶 enzyme 提供更容易完成的反应途径，使这些反应足够快地发生。你可以把活化能理解为反应开始转化时需要跨过的能量障碍；**酶降低这个障碍，而不是给反应物不断注入能量**。',
        '酶的作用体现在速率上。因此，同样的反应在有酶时可能很快达到终点，无酶时需要更久；如果其他条件相同且都充分达到同一终点，不能因为前者更快，就断定它最终必定得到更多产物。',
      ],
      rules: [
        {
          title: '生物催化剂与主要成分',
          text: '酶是由生物产生的催化剂，**主要是蛋白质**；少数 RNA 也具有催化作用。因此记“主要是蛋白质”，不要改成“所有酶一定是蛋白质”。多数蛋白质酶的功能依赖正常的三维结构。',
        },
        {
          title: '活化能与反应速率',
          text: '活化能 activation energy 是从反应物状态到反应过渡状态需要克服的能量障碍。酶提供活化能较低的途径，使同一温度下更多反应能成功发生。**催化剂不是作为燃料被烧掉来供能**。',
        },
        {
          title: '不变的是反应的起点与终点',
          text: '同一反应的反应物和产物不因加入酶而改变，所以总能量变化也不变。在可逆反应中，酶能加快达到平衡，**不改变平衡位置**；这里不要求额外记忆热力学公式，只需读懂能量图的起点、终点与峰高。',
        },
        {
          title: '酶可以反复使用',
          text: '酶可能在反应过程中与底物暂时结合，完成一个催化循环后会被再生，可继续作用于其他底物。==酶不会按催化次数被等量消耗==，但它仍可能被高温损伤或被细胞降解。',
        },
        {
          title: '速率与最终产量',
          text: '速率是单位时间内底物减少或产物增加的量。若底物有限，后期曲线变平可能是底物耗尽或达到平衡，不能仅凭曲线变平认定酶已失活。**同一时间产物较多，与最终产量更大，是不同的说法**。',
        },
        {
          title: '酶不必只在完整细胞内工作',
          text: '酶由细胞制造，但提取出来后，在合适条件下也能催化；消化道里的消化酶就是在细胞外工作的例子。只要底物和条件合适，不能因试管里没有完整细胞就断言不可能发生酶促反应。',
        },
      ],
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
      summary: '活性位点既要让合适底物结合，也要帮助转化；专一性不是只看分子大小。',
      paragraphs: [
        '底物 substrate 是酶在这次反应中作用的反应物。酶表面有特定的活性位点 active site，底物在这里暂时结合，形成酶—底物复合物；反应完成后产物离开，酶又能接待下一份底物。图解中的凹槽用来帮助识别位置，真实酶是有复杂空间形状的分子。',
        '“锁和钥匙”能帮助理解选择性，但酶并不是一把完全僵硬的锁。结合时，蛋白质可以发生适当的形状调整，使催化更容易完成。**适合不只取决于外形，还取决于活性位点的化学性质**。所以同样大小的分子也未必都能被同一种酶催化。',
      ],
      rules: [
        {
          title: '活性位点的作用',
          text: '活性位点是底物结合并发生催化的特定区域。它的空间形状和化学环境，使某些底物能以合适方式结合并转化。不要把整颗酶的所有表面都当作相同的活性位点。',
        },
        {
          title: '催化的三个连续步骤',
          text: '**结合底物 → 催化转化 → 释放产物**。酶—底物复合物只是暂时状态；产物释放后酶可再用。图中把一种底物拆成两个产物只是分解反应的例子，酶也能催化合成等其他反应。',
        },
        {
          title: '专一性与适合程度',
          text: '酶通常只催化特定底物或特定类型的反应，称为专一性 specificity。底物的形状和化学性质需要与活性位点相容。**形状看上去能放进去，不足以单独证明一定能被催化**。',
        },
        {
          title: '锁钥模型与诱导契合',
          text: '锁钥模型强调形状互补；诱导契合 induced fit 进一步说明结合时酶可稍作调整，形成更适合催化的结构。这里的正常调整是功能的一部分，**不等同于高温造成的变性**。',
        },
        {
          title: '蛋白质结构与功能',
          text: '氨基酸序列影响蛋白质的三维结构。若变化影响活性位点的形状、化学性质或催化步骤，活性可能下降；若变化不影响这些性质，酶也可能仍正常工作。不能把所有突变一概判为使酶失活。',
        },
        {
          title: '可用位点与反应速率',
          text: '在其他条件适宜且底物充足时，更多有活性的酶意味着更多可同时工作的活性位点，初始速率通常更高。若酶量固定，底物增加到大部分位点已被占用后，速率可趋于上限；**速率平台不必表示酶变性**。',
        },
      ],
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
      summary: '先分清反应变慢的原因，再读曲线与实验数据；不同酶没有统一的最适条件。',
      paragraphs: [
        '温度对酶有两方面影响。在尚未明显变性的范围内，温度升高通常使分子运动更快，有效碰撞增加；但温度过高又可能破坏蛋白质的正常结构。于是常见温度曲线先升后降。**曲线下降不是因为分子突然不动了，而是有活性的酶减少了**。',
        'pH 也会影响活性位点的电荷、结合和催化，极端 pH 还可能破坏蛋白质结构。不同酶适应不同环境，例如胃蛋白酶适合酸性环境，不能把所有酶的最适 pH 都记成 7。读图时，要把这张图的实验条件与适用对象一起记住。',
      ],
      rules: [
        {
          title: '低温造成的变慢',
          text: '低温通常使分子运动和有效碰撞减少，反应变慢；回到适宜温度后常可恢复。**低温下慢，不等于活性位点已经变性**；冰冻等极端处理是否损伤，需要看具体条件。',
        },
        {
          title: '过高温度与变性',
          text: '过高温度可改变蛋白质酶的三维结构，使活性位点难以正常结合或催化。持续高温造成的失活通常不能仅靠降温恢复；但温度、处理时间和酶种类都会影响结果，不能断言所有酶都在同一温度变性。',
        },
        {
          title: '最适温度的含义',
          text: '最适温度是规定实验条件下测得速率最高的温度。它不是“开始变性的温度”，也不是所有人体酶都固定等于 37°C。处理时间和测量方式不同，测得的峰值也可能不同。',
        },
        {
          title: 'pH 对活性位点的影响',
          text: 'pH 改变可影响活性位点的电荷和形状，从而影响底物结合与催化；极端 pH 还可能导致变性。**活性下降不一定代表已经永久变性**，应结合恢复条件后的实验判断。',
        },
        {
          title: '速率的测量',
          text: '可以测单位时间内产生的产物，或消耗的底物。产物—时间曲线的斜率表示速率；起始段斜率通常用来比较初始速率。==达到相同反应终点时，平均速率与所用时间的倒数成正比==，终点不同则不能直接这样比。',
        },
        {
          title: '公平比较的条件',
          text: '研究温度时，应控制 pH、酶量、底物量与浓度、总体积、测量时间和方法；研究 pH 时相应控制温度。缓冲液用于尽量保持 pH，重复实验帮助判断结果是否稳定。**只改变准备研究的变量，才能合理解释差异**。',
        },
        {
          title: '数据能支持的范围',
          text: '已测点中最高的点只是“这些测试条件中最快”。精确峰值可能在取点之间；曲线形状和数值也不能直接套用给另一种酶。没有恢复实验或结构证据时，低速本身不足以证明发生了永久变性。',
        },
      ],
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
      summary: '把食物的化学分解与吸收分开，并区分酶在哪里制造、在哪里发挥作用。',
      paragraphs: [
        '食物中的大分子需要逐步分解为适于吸收的小分子。消化酶负责其中的化学反应；咀嚼、搅拌和胆汁乳化则帮助形成更好的接触条件。记忆时可以沿着“吃进来什么 → 哪种酶作用 → 得到什么”走一遍，而不是把酶名和器官名分成两张互不联系的清单。',
        '还要分清“制造地点”和“作用地点”。例如胰腺制造的多种消化酶，经导管进入小肠，在肠腔中接触食物；**食物不需要进入胰腺，胰酶也不是在胰腺内消化这一餐食物**。小分子形成后，还需经过肠上皮运输才算被吸收。',
      ],
      rules: [
        {
          title: '淀粉酶与糖类消化',
          text: '淀粉酶 amylase 将淀粉分解为麦芽糖及较短糖链等；后续酶如麦芽糖酶再生成葡萄糖。唾液腺和胰腺能制造淀粉酶，主要分别在口腔和小肠发挥作用。**不要把“糖类最终形成葡萄糖”简化成“淀粉酶单独完成全部步骤”**。',
        },
        {
          title: '蛋白酶与氨基酸',
          text: '蛋白酶 protease 水解蛋白质中的肽键。胃中的胃蛋白酶先产生较短肽链，胰腺和小肠相关酶继续消化，最终主要得到可吸收的氨基酸。**蛋白酶是一类酶，不是只有一种、只在胃里工作的酶**。',
        },
        {
          title: '脂肪酶与脂肪水解',
          text: '脂肪酶 lipase 催化脂肪水解。考纲常将最终分解概括为脂肪酸和甘油；人体小肠中胰脂肪酶的主要直接产物包括脂肪酸和单甘油酯。理解这个层次差别，就不会把概括式误当作每一步的唯一产物。脂肪消化主要在小肠进行。',
        },
        {
          title: '胆汁与乳化',
          text: '胆汁由肝脏产生、胆囊储存和浓缩，释放到小肠；胆盐使大脂肪滴分散为小滴，增加脂肪酶可接触的总面积。==胆汁不是酶，乳化不等于把脂肪分子水解==。胆汁与胰液等也共同帮助形成适宜的小肠环境，其中胰液中的碳酸氢盐是中和胃酸的重要成分。',
        },
        {
          title: '不同部位与不同条件',
          text: '胃内酸性环境适于胃蛋白酶；小肠偏中性至弱碱性的环境适于多种胰酶。胃酸能帮助提供条件，却不是蛋白酶。不同酶对 pH 的适应不同，所以不能把胃和小肠的条件互换。',
        },
        {
          title: '消化与吸收',
          text: '消化 digestion 使大分子逐步变小；吸收 absorption 是这些物质跨过肠上皮进入血液或淋巴等体内运输系统。葡萄糖和氨基酸主要进入血液；许多脂质经肠细胞重新加工后先进入淋巴。**消化酶不等于吸收运输蛋白**。',
        },
        {
          title: '消化酶的实验观察',
          text: '碘液可用来检测淀粉是否仍可检出，但“不再变蓝黑”并不单独证明产物一定是葡萄糖。脂肪酸生成可使未缓冲体系的 pH 下降，常用于观察脂肪酶作用；解释结果时仍要排除起始 pH、温度和酶量的差异。',
        },
      ],
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
      note: '内部核查 B8.1–B8.4 的酶成分、作用机制、温度与 pH 和消化酶范围；例题为原创。',
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
