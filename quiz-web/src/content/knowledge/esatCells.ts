// 试题库 ESAT 生物「细胞」知识总结：按结构功能与组成层级梳理知识，在例题中讲解应用方法。
import type { KnowledgeLesson } from './types'

export const esatCells: KnowledgeLesson = {
  code: '150100',
  title: 'Cells · 细胞',
  subtitle: '梳理细胞结构、功能与生物体的组成层级',
  intro:
    '细胞里的不同结构各有分工，动植物与细菌也有共同点和差别。本节先把这些知识放在一起讲清楚，再用原有例题练习如何应用：认识细胞类型，解释结构与功能，以及区分组织、器官和系统。图解可以随时对照查看，例题中的条件变化会帮助你理解知识适用的范围。',
  memory: [
    '**细胞膜控制物质进出，细胞壁主要提供支撑**。植物细胞壁位于膜外，不能替代细胞膜。',
    '细胞核保存大部分遗传信息，核糖体合成蛋白质，线粒体参与有氧 ATP 供应。==储存信息、制造蛋白质和供能是不同的工作==。',
    '绿色叶肉细胞可以同时有叶绿体和线粒体；普通地下根毛通常没有叶绿体，但仍需要呼吸供能。**不是所有植物细胞都进行光合作用**。',
    '==结构存在，不等于这张图能把它显示清楚==。普通光学显微镜不能分辨单独核糖体；放大原有照片不会自动增加细节。',
    '细菌没有核膜包围的细胞核，仍有染色体 DNA。质粒和鞭毛都不是每个细菌必有；**有质粒也不一定具有某种抗性**。',
    '相关细胞共同工作形成组织，多种组织构成器官，多个器官共同工作组成系统。==单细胞生物也可以是完整的生物体==，不必具有组织和器官。',
  ],
  sections: [
    {
      code: '150101',
      title: '真核细胞结构与功能',
      summary: '理解主要细胞结构各自的作用，以及典型动植物细胞、特化细胞和显微图像之间的区别。',
      paragraphs: [
        '真核细胞的典型特点，是主要遗传物质位于核膜包围的细胞核内。动物和植物都属于真核生物；它们的细胞有许多相同结构，也因功能不同而有差别。**结构与功能相联系**：细胞需要控制物质进出、合成蛋白质和获得可用能量，不同结构共同完成这些活动。',
        '下面先梳理结构各自的作用，再比较典型动物细胞、地下根毛和绿色叶肉细胞。这里的“典型”描述常见情况，**不代表每一种特化细胞都保留全部结构**。显微图像还会受到仪器和制片条件的限制，因此真实存在与图中可见也要分开理解。',
      ],
      rules: [
        {
          title: '细胞膜与细胞壁',
          text: '细胞膜 cell membrane 具有选择透过性，控制不同物质怎样进出；植物细胞壁 cell wall 位于膜外，主要由纤维素组成，维持形状并抵抗吸水膨胀。**细胞壁提供支撑，细胞膜控制进出**。动物细胞没有细胞壁，但有细胞膜；细胞壁也不是膜包围的细胞器。',
        },
        {
          title: '细胞质与细胞核',
          text: '细胞质 cytoplasm 位于细胞膜以内、细胞核以外，许多由酶控制的代谢反应在这里进行。细胞核 nucleus 保存大部分遗传信息，并通过基因影响蛋白质合成和细胞活动。**控制蛋白质的合成，不等于蛋白质全在核内制造**；也不能把所有细胞反应都限定在细胞质的液体部分。',
        },
        {
          title: '核糖体与蛋白质合成',
          text: '核糖体 ribosome 由 RNA 和蛋白质构成，负责把氨基酸组装成蛋白质。它本身没有包围膜，典型原核和真核细胞都具有。需要制造较多蛋白质的细胞往往有较多核糖体；==没有核膜包围的细胞核，仍然可以有核糖体并合成蛋白质==。',
        },
        {
          title: '线粒体与有氧呼吸',
          text: '线粒体 mitochondrion 参与有氧呼吸和 ATP 供应，内膜的褶皱增加相关反应可利用的面积。ATP 是细胞活动可直接利用的重要能量载体。持续消耗较多 ATP 的细胞往往具有较多线粒体，但供能快慢还取决于氧气、原料等条件。**植物细胞也需要呼吸供能**，线粒体不是动物专有结构。',
        },
        {
          title: '叶绿体与光合作用',
          text: '叶绿体 chloroplast 含叶绿素，吸收光能并进行光合作用，使光能转为有机物中的化学能。绿色栅栏叶肉细胞通常含许多叶绿体，普通地下根毛通常没有。==叶绿体与线粒体可以同时存在==：一个细胞能光合作用，并不意味着它不再需要呼吸供能。',
        },
        {
          title: '中央液泡与膨压',
          text: '成熟植物细胞通常有大型中央液泡 vacuole，液泡膜内的细胞液含水、糖和离子等。吸水使液泡扩大，有助于形成膨压，使细胞保持坚挺；失水会使膨压降低。失水足够多时，细胞内容物可离开细胞壁，发生质壁分离。**坚固的细胞壁不会随液泡同幅缩小**，松弛也不一定已经发生质壁分离。',
        },
        {
          title: '细胞特化与结构差异',
          text: '细胞承担的任务不同，保留或发达的结构也可能不同。普通地下根毛通常无叶绿体，却有线粒体；成熟哺乳动物红细胞没有细胞核和线粒体，但仍来自真核生物。**单独一个结构的有无，不能替代细胞的完整特点**。例如有细胞壁并不只见于植物，无细胞核也不只见于原核细胞。',
        },
        {
          title: '显微图像的放大与分辨',
          text: '放大倍数描述图像比实物大多少；分辨能力描述能否把相邻细节区分开。普通光学显微镜不能分辨单独核糖体，非分裂细胞的核内也不一定显示一条条凝缩染色体。染色、切片位置和示意图省略同样影响显示。==没有显示，不等于已经证明不存在==；数字放大原图不能补出未记录的细节。',
        },
      ],
      visual: 'eukaryotic-cell',
      example: {
        question:
          '原创热身：细胞 X 有核膜、纤维素细胞壁与大液泡，已证实没有叶绿体。在普通肌肉细胞、地下根毛细胞、绿色栅栏叶肉细胞和细菌中，哪一类能同时满足条件？',
        steps: [
          '先看核膜：典型细菌没有核膜包围的细胞核，可以排除。再看纤维素细胞壁：普通肌肉细胞没有，也可以排除。',
          '剩下两种植物细胞。绿色栅栏叶肉细胞通常有叶绿体，而题干明确说没有；地下根毛细胞则符合这个条件。',
          '所以在这四个候选中选根毛细胞。不过，其他非光合植物细胞也可能没有叶绿体，不能把这题的答案变成适用于所有细胞的口诀。',
        ],
        answer: '地下根毛细胞。它仍需要线粒体参与有氧呼吸，为代谢和主动运输提供可用能量。',
      },
      pitfalls: [
        '细胞壁主要支撑，不是选择透过膜；有壁的细胞也仍需要细胞膜。',
        '细胞核保存主要遗传信息，核糖体合成蛋白质，线粒体参与有氧供能；三者的作用不能互换。',
        '普通地下根毛无叶绿体仍可呼吸；绿色叶肉能光合作用，也仍需要线粒体。',
        '图中未显示的结构可能真实存在；放大图像也不一定提高分辨能力。',
      ],
      check: {
        question:
          '两组同类型肌肉细胞均完整。处理仅抑制线粒体有氧 ATP 生成，短时间内细胞核、核糖体及膜保持正常。下列哪项最有依据？',
        options: [
          '细胞立即失去全部 DNA，因此不能再归为真核细胞。',
          '所有 ATP 来源都必然立即归零，所有物质运输同时停止。',
          '有氧 ATP 供应下降，可影响需要较多 ATP 的活动，但不能据此判定核糖体已消失。',
          '线粒体受抑制意味着细胞必须转而用叶绿体供能。',
        ],
        answerIndex: 2,
        explanation:
          '选 C。题目只让线粒体的有氧 ATP 生成受到抑制，因此最直接的影响是**这部分 ATP 供应减少**；需要较多 ATP 的活动可能受到影响。\n\nA 所说的 DNA 消失、D 所说的改用叶绿体，都不是题目给出的变化。B 又说得过满：细胞可能还有其他 ATP 来源，被动运输也不需要这样供能。题目还明确说核糖体保持正常，不能另行断定它已经消失。',
      },
      examFocus: {
        goal: '真核细胞的主要结构相互配合，完成物质交换、遗传信息保存、蛋白质合成与能量转化；**动植物的差异和特化细胞的例外**，都与它们的功能有关。',
        comparison: {
          title: '典型动物细胞与两类植物细胞',
          columns: ['结构', '典型动物细胞', '普通地下根毛细胞', '绿色栅栏叶肉细胞'],
          rows: [
            ['细胞膜、细胞质', '有', '有', '有'],
            ['细胞核', '通常有；成熟哺乳动物红细胞等有例外', '有', '有'],
            ['核糖体', '通常有；特化细胞有例外', '有', '有'],
            ['线粒体', '通常有；成熟哺乳动物红细胞等有例外', '有', '有'],
            ['纤维素细胞壁', '无', '有', '有'],
            ['叶绿体', '无', '通常无', '通常有许多'],
            ['植物式大型中央液泡', '无这种大型中央液泡', '通常有', '通常有'],
          ],
        },
        examples: [
          {
            title: '细胞选对了，后面的功能解释也对吗？',
            question:
              'Cell X has a cellulose wall, a membrane-bound nucleus and a large vacuole. Chloroplasts are confirmed absent. It takes up mineral ions against a concentration gradient. Which identification and explanation best fit X?',
            options: [
              'An underground root hair cell; its cellulose wall uses ATP to pump ions in.',
              'An intestinal epithelial cell; mitochondria support the ATP supply for uptake.',
              'An underground root hair cell; mitochondria support the ATP supply for uptake.',
              'A green palisade cell; mitochondria support the ATP supply for uptake.',
            ],
            answer: 'C：普通地下根毛细胞；线粒体参与供应主动吸收所需的 ATP。',
            steps: [
              '先把所有特点放在一起，而不是读到“有细胞壁”就选植物。核膜包围的细胞核与典型细菌不同；接着用壁的材料、叶绿体和吸收活动，逐项检查给出的候选。could be（可能是）或 most likely（最可能是）都要求候选**与题干全部条件相容**。',
              '先看纤维素细胞壁。B 的肠上皮细胞虽然也有细胞核、也需要 ATP，却是动物细胞；**动物细胞没有纤维素细胞壁**，所以 B 不能选。',
              '再看“已证实没有叶绿体”。绿色栅栏叶肉细胞通常有叶绿体，与这一条件冲突，因此排除 D。这里用的是题干明确说明的“没有”，不是从照片里猜的。',
              '剩下 A、C，都说是根毛细胞。这时不能停：A 让细胞壁用 ATP 泵入离子，但==运输发生在细胞膜上，细胞壁不能泵入离子==；C 说线粒体参与 ATP 供应，才说得通，所以选 C。',
              '把 C 的功能再解释完整：矿物离子的主动吸收需要代谢供能，线粒体参与有氧 ATP 供应，因此能支持这种活动。回答“为什么某结构较多”也沿这条思路：**结构做什么 → 这项工作怎样帮助细胞**。但本题没有比较线粒体数量，不能额外断定它的供能速率一定最高。',
            ],
            optionNotes: [
              'A：根毛细胞判断对了，但细胞壁不会用 ATP 泵入离子。**前半句对，不能让后半句也变对**。',
              'B：线粒体供能的解释没有问题，问题在于肠上皮细胞没有题干要求的纤维素细胞壁。',
              'C：既符合根毛细胞的结构，也正确说明了线粒体的作用。没有叶绿体，并不妨碍细胞呼吸供能。',
              'D：叶肉细胞也需要线粒体供能，但绿色栅栏叶肉细胞通常有叶绿体，与题干明确给出的条件不符。',
            ],
            takeaway:
              '一项里如果同时回答了“是什么细胞”和“这个结构做什么”，就**把两句话分别检查一遍**。只要一句不对，整项就不能选。',
            variant: {
              question:
                'X is now confirmed to contain many chloroplasts and is taken from the green interior of a leaf. Which identification becomes suitable?',
              answer: 'D：绿色栅栏叶肉细胞成为合适候选，其线粒体供能解释仍成立。',
              explanation:
                '现在关键条件变成“有很多叶绿体，而且来自绿色叶片内部”，因此绿色栅栏叶肉细胞变得合适。**重新读改变的条件**，不要沿用上一题的字母；它有叶绿体进行光合作用，也仍有线粒体参与呼吸供能。\n\n再把“典型”和“所有”分开：地下根毛这一例子已说明，并非所有植物细胞都有叶绿体。若一句话声称“所有植物细胞都光合”，一个根毛细胞这样的反例就足以否定它，不能把绿色叶肉的特点套给全部植物细胞。',
            },
          },
          {
            title: '照片中没看见的结构，是否就不存在？',
            question:
              'A low-magnification light micrograph of non-dividing plant cells shows cell outlines and stained nuclei. Individual ribosomes are not resolved. Consider: 1 ribosomes are absent; 2 nuclear DNA may be present although separate chromosomes are not resolved; 3 mitochondria must be absent because they are not identified. Which statement is justified?',
            options: ['1 only', '2 only', '1 and 2 only', '2 and 3 only'],
            answer: 'B：只有陈述 2 有依据。',
            steps: [
              '题目问 justified，也就是“哪句话能根据已知情况成立”。先圈出 low-magnification（低倍率）、light micrograph（光学显微照片）和 non-dividing（非分裂状态），明确它问的是**这张图允许我们说什么**，再逐句判断，不先猜组合选项。',
              '陈述 1 把“未分辨出核糖体”改成“没有核糖体”，因此错误。普通光学显微镜本来就不能分辨单独核糖体，染色、切片位置或图像省略也会影响结构显示。陈述 2 则正确：非分裂细胞核内可以有 DNA，即使不能看清一条条凝缩染色体。**存在与这张图能看清，是两个问题**。',
              '陈述 3 也犯了同样的错误：没有识别出线粒体，不等于它一定不存在。所以三句话依次是“错、对、错”，只有 2 正确，选 B。',
            ],
            optionNotes: [
              'A：把“图像分辨不出来”说成“细胞里没有”，陈述 1 不成立。',
              'B：只选陈述 2。核中有遗传物质，与这张图看不清独立染色体，可以同时成立。',
              'C：陈述 2 虽然正确，但这项还包含错误的陈述 1，因此不能选。',
              'D：这项多选了陈述 3。题干没有证明线粒体缺失，不能自行补上“必定没有”。',
            ],
            takeaway:
              '遇到“1 和 2”“2 和 3”这种选项，先在每句话旁边判断对错，再找匹配的一项。==不要因为其中一句正确，就顺手把另一句也选进去==。\n\n如果另一题只说“没看到细胞核”，还不能直接判成细菌：先分清图像未显示与已经证实缺失，再考虑题干是否点名了特殊细胞。例如成熟哺乳动物红细胞虽无核，却不能归为原核细胞。',
            variant: {
              question:
                'The same image is digitally enlarged four times, with no new image data. Does this alone make individual ribosomes resolvable?',
              answer: '不能。',
              explanation:
                '数字放大只是把已有像素显示得更大，没有获得新的图像信息。就像把模糊照片放大，模糊的部分仍然模糊。**放大倍数增加，不等于分辨细节的能力提高**。',
            },
          },
        ],
        checklist: [
          '细胞膜与细胞壁的作用有什么不同？植物为什么两者都需要？',
          '细胞核、核糖体、线粒体分别负责什么，怎样共同支持细胞活动？',
          '为什么普通地下根毛通常没有叶绿体，却仍有线粒体？',
          '真实存在、图中显示与能够分辨有什么不同？成熟哺乳动物红细胞又说明了什么例外？',
        ],
      },
      sourceIds: ['uat-spec-biology', 'uat-biology-guide', 'openstax-eukaryotic', 'uat-nsaa-2016'],
    },
    {
      code: '150102',
      title: '原核细胞结构与功能',
      summary: '认识细菌的基本结构，分清主要染色体、质粒和核糖体，并理解它与真核细胞的异同。',
      paragraphs: [
        '原核细胞没有核膜包围的细胞核，本节以细菌为代表。它的主要 DNA 位于细胞质中，也没有线粒体、叶绿体等膜包围的细胞器。但**结构较简单不等于缺少基本生命活动**：细菌仍能进行代谢、获得 ATP，并用核糖体合成蛋白质。',
        '细菌与典型动植物细胞都具有细胞膜、细胞质和核糖体，差别主要在内部结构怎样组织。质粒、鞭毛和荚膜则只存在于部分细菌中。下面把共同结构、细菌的主要 DNA 以及这些并非必有的结构分别说明。',
      ],
      rules: [
        {
          title: '原核细胞与真核细胞',
          text: '典型真核细胞的主要 DNA 位于有核膜的细胞核内；典型细菌没有这样的细胞核，其主要 DNA 位于细胞质中。==原核的“无真正细胞核”，不是没有 DNA==。细菌也没有线粒体和叶绿体等膜包围细胞器，但仍有细胞膜和无膜的核糖体。',
        },
        {
          title: '细胞膜、细胞质与代谢',
          text: '细菌的细胞膜控制物质交换，细胞质中进行许多由酶控制的代谢反应。细菌可以通过细胞质及细胞膜相关过程获得 ATP。**没有线粒体，不等于不能呼吸或供能**；原核与真核细胞都要完成这些基本活动，只是相关结构的安排不同。',
        },
        {
          title: '细菌细胞壁',
          text: '多数细菌在细胞膜外有细胞壁，提供支撑并帮助维持形状；典型细菌壁含肽聚糖 peptidoglycan，植物壁主要含纤维素 cellulose。**有细胞壁并不是植物或细菌某一方独有的特点**。细胞壁不是包围细胞器的膜，也不能代替细胞膜的选择透过作用。',
        },
        {
          title: '染色体 DNA 与拟核',
          text: '典型细菌的主要染色体通常是一条较大的环状 DNA，携带主要遗传信息。它所在的区域称为拟核 nucleoid，**没有核膜包围，因此不是真正的细胞核**。环状描述 DNA 分子的形式，不表示它在显微图上一定呈现一个规则圆圈。',
        },
        {
          title: '质粒 DNA',
          text: '质粒 plasmid 通常是主要染色体以外较小的环状 DNA，能够独立复制，并可携带额外基因，例如某些抗性基因。==不是每个细菌都有质粒，也不是每个质粒都带同一种抗性基因==。没有质粒的细菌仍可能通过染色体上的相关基因等其他途径获得抗性。',
        },
        {
          title: '核糖体',
          text: '细菌的核糖体由 RNA 和蛋白质组成，没有包围自身的膜，负责把氨基酸组装成蛋白质。典型动植物细胞也有核糖体。**核糖体是两类细胞都具有的蛋白质合成结构**，不是只在有细胞核的细胞中才出现。',
        },
        {
          title: '鞭毛与荚膜',
          text: '部分细菌有鞭毛 flagellum，可帮助运动；部分细菌有位于细胞壁外的荚膜 capsule，可提供保护。它们都不是每个细菌必有的结构。**缺少鞭毛、荚膜或质粒，不会单独改变细菌的原核身份**。',
        },
        {
          title: '病毒与细胞',
          text: '病毒不具有完整的细胞结构，需要利用宿主细胞的机制增殖，因此不属于原核或真核细胞。成熟哺乳动物红细胞则来自真核生物，虽然成熟后没有细胞核，也不能归为细菌。==“没有细胞核”本身不足以定义原核细胞==。',
        },
      ],
      visual: 'prokaryotic-cell',
      example: {
        question:
          '原创热身：典型细菌 P 和动物细胞 Q 都有细胞膜与核糖体；P 的主要 DNA 没有核膜包围，Q 的主要 DNA 位于有核膜的细胞核内。哪些是共有证据，哪条才能区分二者？',
        steps: [
          '先看相同之处：两者都有细胞膜和核糖体，所以用这两项还分不出谁是原核、谁是真核。',
          '再看主要 DNA 周围有没有核膜。P 没有核膜包围的细胞核，符合原核；Q 的主要 DNA 在有核膜的核内，符合真核。',
          '题目没有提到 P 的质粒或抗生素抗性，这一步就先不作判断，不能顺手把这些特点也加上。',
        ],
        answer: '膜与核糖体是共有项；主要 DNA 的核膜包围情况提供区分证据。',
      },
      pitfalls: [
        '原核没有核膜包围的细胞核，却仍有 DNA、细胞膜和核糖体。',
        '主要染色体和质粒都可能是环状 DNA；质粒的特点还包括位于主要染色体之外、通常较小且可独立复制。',
        '细菌细胞壁与植物细胞壁的主要材料不同；有壁不能单独说明是哪一种细胞。',
        '质粒、鞭毛和荚膜并非所有细菌必有；有质粒也不能直接等同于某种抗性。',
      ],
      check: {
        question:
          '一个已确认是典型细菌的完整细胞有核糖体和染色体 DNA，但未检出质粒。哪项结论成立？',
        options: [
          '没有质粒，说明该细胞没有任何 DNA。',
          '有核糖体，说明它必须具有核膜包围的细胞核。',
          '没有质粒，说明它一定不能产生抗生素抗性。',
          '它仍能合成蛋白质；未检出质粒不否定细菌身份。',
        ],
        answerIndex: 3,
        explanation:
          '选 D。题干已经说它有核糖体，所以仍能合成蛋白质；质粒又不是每个细菌必有，因此未检出质粒不能否定它是细菌。\n\nA 忘记了题干明确存在的染色体 DNA。B 把核糖体误当成只有真核细胞才有的结构。C 则把抗性来源说得太窄：==没有质粒，不等于没有其他途径获得抗性==。',
      },
      examFocus: {
        goal: '细菌与动植物细胞有共同的基本结构，但**主要 DNA 没有核膜包围**；质粒是部分细菌才有的额外 DNA，不能与主要染色体或核糖体混为一谈。',
        comparison: {
          title: '典型细菌与动植物细胞的结构对照',
          columns: ['结构', '典型动物细胞', '典型植物细胞', '典型细菌'],
          rows: [
            ['细胞膜、细胞质', '有', '有', '有'],
            ['核糖体', '通常有，负责合成蛋白质', '有，负责合成蛋白质', '有，负责合成蛋白质'],
            [
              '主要 DNA 所在位置',
              '通常在核膜包围的细胞核内',
              '在核膜包围的细胞核内',
              '在细胞质中，没有核膜包围',
            ],
            [
              '主要染色体的一般形式',
              '核内染色体 DNA 为线状',
              '核内染色体 DNA 为线状',
              '通常为较大的环状 DNA',
            ],
            ['细胞壁', '无', '主要由纤维素构成', '多数有，典型壁含肽聚糖'],
            ['线粒体', '通常有，特化细胞有例外', '通常有', '无'],
            ['叶绿体', '无', '光合细胞有，普通地下根毛通常无', '无'],
            ['质粒', '不是典型共有结构', '不是典型共有结构', '部分细菌有，可独立复制'],
            [
              '鞭毛、荚膜',
              '不作为典型动物细胞必有结构',
              '不作为典型植物细胞必有结构',
              '部分细菌有，并非必备',
            ],
          ],
        },
        examples: [
          {
            title: '三个特点放在一起，应该选哪个结构？',
            question:
              'Structure P occurs in a typical bacterium and in the cytoplasm of a plant cell. P has no surrounding membrane, contains RNA and protein, and assembles amino acids into proteins. What is P?',
            options: ['A plasmid', 'A ribosome', 'A nucleus', 'A mitochondrion'],
            answer: 'B：核糖体 ribosome。',
            steps: [
              '先把“典型细菌中有”和“植物细胞中有”分别检查。核糖体两边都有；细胞核和线粒体虽能在典型植物细胞中出现，却不在典型细菌中，所以 C、D 可以排除。**不能只满足其中一类细胞的条件**。它们有包围膜，也与后面的“无膜”条件不符。',
              '剩下 A 质粒和 B 核糖体。现在用上组成这一条：质粒是 DNA，而**核糖体由 RNA 和蛋白质组成**，因此保留 B。',
              '最后再检查作用。题干说把氨基酸组装成蛋白质，这正是核糖体的工作。这样，位置、组成和作用都检查过了。',
            ],
            optionNotes: [
              'A：质粒的确没有包围膜，但它是 DNA。只符合“无膜”还不够，它不符合 RNA 与蛋白质组成，也不是合成蛋白质的结构。',
              'B：典型细菌和植物细胞都有核糖体；它没有包围膜，组成和作用也都符合题干。',
              'C：细胞核有核膜，而且典型细菌没有真正的细胞核。',
              'D：线粒体有膜，主要参与有氧呼吸供能；典型细菌也没有这种结构。',
            ],
            takeaway:
              '排除一部分选项后，**把还没用过的条件接着用完**。这题只看“无膜”不够，还要看它由什么组成、做什么。\n\n比较两个结构是否在两类细胞中都存在时，也要拆开检查。例如“细胞膜和线粒体”不能因为细胞膜两边都有就整项通过，细菌没有线粒体。只有“两个结构、两类细胞”都符合，整项才成立。',
            variant: {
              question:
                'P is instead a small circular DNA molecule outside the main bacterial chromosome and can replicate independently. What is P now?',
              answer: '质粒 plasmid。',
              explanation:
                '这次题干不再说 RNA 与蛋白质，而是明确说“主要染色体外的小环状 DNA，可以独立复制”，因此应改选质粒。**条件变了，答案也要重新判断**。题目仍没说这个质粒带什么基因，不能再猜它一定使细菌耐药。',
            },
          },
          {
            title: '三句话分别判断，再找正确组合',
            question:
              'Bacterial isolates X and Y each have a large circular chromosome not enclosed by a nuclear membrane. X has a plasmid; Y is confirmed to have no plasmids. Consider: 1 both are prokaryotic; 2 every bacterium must have a plasmid; 3 these observations alone do not establish resistance to antibiotic Z. Which statements are correct?',
            options: ['1 only', '1 and 2 only', '1 and 3 only', '2 and 3 only'],
            answer: 'C：陈述 1 和 3 正确。',
            steps: [
              '先看陈述 1。X、Y 都是细菌，主要 DNA 也都没有核膜包围，所以“两者都是原核”正确。',
              '陈述 2 中 every 表示“每一个”，must 表示“一定”。它声称每个细菌都必须有质粒，可是 Y 已被确认没有质粒，仍是细菌；**只用 Y 这个反例，就能否定“所有”**。不必去证明所有其他细菌是否有质粒。',
              '陈述 3 说这些观察还不能确定它们对 Z 的抗性。题目没说质粒带什么基因，也没做 Z 的抗性实验，因此 3 正确。X 有质粒不能证明耐 Z，Y 无质粒也不能证明一定怕 Z。',
              '现在把结果放回选项：1 对、2 错、3 对，要选“1 和 3”，也就是 C。',
            ],
            optionNotes: [
              'A：1 的确正确，但 3 也正确；“1 only”表示“只有 1”，因此少选了 3。',
              'B：把错误的 2 放了进来。Y 没有质粒，已经推翻了“每个细菌都必须有质粒”。',
              'C：保留了正确的 1、3，也排除了错误的 2。',
              'D：既包含错误的 2，又漏掉正确的 1，不能选。',
            ],
            takeaway:
              '**“看见了什么结构”和“这个结构使它具有什么能力”要分开回答**。判断抗性时，需要相应基因或功能实验的信息。\n\n处理一组陈述时，先分别写出对错，再找组合；只研究了一个菌株，也不能直接把它的特点推广给所有细菌。尤其要分清 some（有些）与 all/every（所有、每一个）。',
            variant: {
              question:
                'The plasmid in X is now shown to carry an expressed gene that gives resistance to Z. Nothing further is known about Y. What additional conclusion is supported?',
              answer: '支持 X 对 Z 有抗性；仍不能据此判断 Y 必定敏感。',
              explanation:
                '现在题目补充说，X 的质粒携带并表达了使它耐受 Z 的基因，所以可以判断 X 对 Z 有抗性。但 Y 的情况没有新增信息，==不能顺带判定 Y 必定敏感==；它还可能通过染色体上的相关基因等其他途径获得抗性。',
            },
          },
        ],
        checklist: [
          '原核与真核细胞在主要 DNA 的位置和核膜方面有什么不同？',
          '为什么细菌没有线粒体，却仍能获得 ATP；没有细胞核，却仍能合成蛋白质？',
          '染色体 DNA、质粒和核糖体在组成及作用上各有什么特点？',
          '哪些细菌结构不是每个细菌必有？为什么有质粒不能直接证明耐受某种抗生素？',
        ],
      },
      sourceIds: [
        'uat-spec-biology',
        'uat-biology-guide',
        'openstax-prokaryotic',
        'openstax-eukaryotic',
        'openstax-viruses',
      ],
    },
    {
      code: '150103',
      title: '生物体的结构层级',
      summary: '理解细胞怎样组成组织、器官和系统，以及各层级的组成关系和功能分工。',
      paragraphs: [
        '多细胞生物的不同部分不是简单堆在一起，而是分工合作：相关细胞形成组织，多种组织构成器官，多个器官共同完成较大的功能。**层级讲的是组成与协作，不是简单比较大小**。',
        '这些层级描述的是组成关系，不是图片大小，也不要求每个结构只有一种功能。单细胞生物是重要的另一种情况：它没有组织和器官，一个细胞本身就可以是完整生物体。下面把定义与动植物实例放在一起梳理。',
      ],
      rules: [
        {
          title: '细胞 cell 与细胞特化',
          text: '细胞是生物体结构和功能的基本单位。多细胞生物中的细胞可具有与任务相适应的特点：根毛细胞的突起增大吸收表面积，栅栏叶肉细胞中的许多叶绿体支持光合作用。**细胞器是细胞内部的结构，不是器官**；例如一个线粒体不能与一片叶处在同一层级。',
        },
        {
          title: '组织 tissue',
          text: '组织由一类或几类相关细胞及其周围物质组成，共同完成相应功能。例如肌肉组织中的细胞协调收缩，根表皮组织覆盖表面并参与吸收。==组织中的细胞不必完全相同==；“由许多细胞组成”也不足以把一个结构都归成组织，因为器官和系统同样由细胞构成。',
        },
        {
          title: '器官 organ',
          text: '器官由多种组织共同构成，完成一项或多项功能。胃含上皮、肌肉等组织，叶含表皮、叶肉和输导组织，根也含多种组织。**不同组织可以各有分工**：一片叶能光合作用，不代表叶内每种组织都负责光合作用。',
        },
        {
          title: '器官系统 organ system',
          text: '器官系统由协同工作的多个器官组成。例如胃、小肠等器官共同参与消化和吸收；植物的多条根组成根系，共同承担吸收与固着等任务。**多个组织构成器官，多个器官协作才构成系统**；许多结构随意放在一起，并不自动形成一个系统。',
        },
        {
          title: '生物体 organism',
          text: '生物体是完整的生命个体，如一个人或一整株植物。多细胞生物中，不同器官系统相互依赖，共同维持生命活动。==单细胞生物也可以是完整个体==，并不需要先形成组织和器官。人体中的一个肌肉细胞虽然活着，却不等于一个完整的人。',
        },
        {
          title: '层级与样本大小',
          text: '结构层级取决于组成与协作关系。把组织切成小块，若每块仍由相关细胞构成同一种组织，它仍是组织的一部分；完整器官被取出，也不会仅因离体就变成组织。**图片放大、样本变小或位置改变，本身不决定层级**。',
        },
      ],
      visual: 'organisation',
      example: {
        question:
          '原创热身：某植物结构含保护表面的组织、进行光合作用的组织以及输导组织。它是组织、器官还是器官系统？',
        steps: [
          '先找题目给的组成：保护、光合、输导是不同组织，不是只给了几个细胞。',
          '这些组织在同一个结构里共同完成任务，所以这个结构属于器官。',
          '器官系统要由多个器官共同工作。题干只说多种组织，还没有达到这一层。',
        ],
        answer: '器官；判据是多种组织的协作，而不是样本大小或“能光合作用”。',
      },
      pitfalls: [
        '组织不一定只含完全相同的细胞；器官也不一定只完成一种功能。',
        '叶、根和胃都由多种组织组成，属于器官；有多种组织并不直接等于器官系统。',
        '细胞器位于细胞内部，与由多种组织构成的器官不同。',
        '单细胞生物不必有组织和器官；样本大小与是否离体也不直接决定层级。',
      ],
      check: {
        question:
          '结构 P 含表皮、叶肉和输导组织；结构 Q 由胃、小肠等器官协同组成。哪一行同时正确？',
        options: [
          'P 是器官；Q 是器官系统。',
          'P 是组织；Q 是器官系统。',
          'P 是器官系统；Q 是器官。',
          'P 与 Q 都是组织，因为都由多个细胞组成。',
        ],
        answerIndex: 0,
        explanation:
          '选 A。P 已经包含表皮、叶肉、输导等**不同组织**，所以是器官；Q 是胃、小肠等多个器官共同工作，所以是器官系统。\n\nB 把 P 看低了一层，C 把两种层级换反了。D 说它们“都有多个细胞”，这句话本身没错，但不足以说明它们都是组织：器官、系统也同样由很多细胞构成，还要继续看这些细胞怎样组成不同结构。',
      },
      examFocus: {
        goal: '生物体的层级反映组成与分工：**细胞 → 组织 → 器官 → 器官系统 → 生物体**。这条关系适用于多细胞生物的组织结构，单细胞生物不必具有其中每一层。',
        comparison: {
          title: '生物体的结构层级与动植物实例',
          columns: ['层级', '组成特点', '动物实例', '植物实例'],
          rows: [
            ['细胞 cell', '单个具有生命活动的细胞', '肌肉细胞', '根毛细胞'],
            ['组织 tissue', '相关细胞及周围物质共同执行功能', '肌肉组织', '根表皮组织'],
            ['器官 organ', '多种组织共同工作', '胃', '根、叶'],
            ['器官系统 organ system', '多个器官协调完成相关功能', '消化系统', '根系'],
            ['生物体 organism', '完整的生命个体', '一个人', '一整株番茄'],
          ],
        },
        examples: [
          {
            title: '不认识 P、Q、R 的名称，也能判断它们的层级',
            question:
              'P is a sheet of related cells forming a protective lining. Q contains this lining plus muscle and nervous tissues working together. R contains Q and several other organs coordinating digestion. What are P, Q and R, respectively?',
            options: [
              'Cell, tissue, organ',
              'Tissue, organ, organ system',
              'Organ, tissue, organism',
              'Tissue, organ system, organ',
            ],
            answer: 'B：组织、器官、器官系统。',
            steps: [
              '先不管 P 叫什么，把题干中“由什么组成”圈出来：P 是一层相关细胞形成的保护层，因此是**组织**。一个完整外观或一张较大的图片，都不能把这群细胞变成单个细胞，也不能直接让它成为器官。',
              '再读 Q：它含有这层组织，还包括肌肉和神经组织。多种组织共同工作，因此 Q 是器官。',
              '最后读 R：它含 Q 和其他多个器官，一起参与消化。因此 R 是器官系统，还不是整个生物体。依次得到“组织、器官、器官系统”，选 B。',
            ],
            optionNotes: [
              'A：P 已是许多细胞形成的组织，不能写成 cell（单个细胞）；后面的 Q、R 也相应被判断低了一层。',
              'B：三个位置都和题干的组成对应：相关细胞形成组织，多种组织形成器官，多个器官形成系统。',
              'C：P 还没有题干所说的多种组织，不能叫器官；Q 却已经有多种组织，不能只叫组织。R 也只是系统，不是完整个体。',
              'D：第一项 P 正确，但 Q 由多种组织组成，应是器官；R 由多个器官组成，应是系统，后两项写反了。',
            ],
            takeaway:
              '三个位置要**一个接一个检查**。先判断对 P，不代表同一选项中的 Q、R 也一定正确。\n\n遇到没有熟悉名称的样本，先找组成单位：相关细胞、多种组织、多个器官，然后看它们是否共同完成相关任务。不能只用“数量很多”或“外观完整”来决定层级。',
            variant: {
              question:
                'A smaller piece is cut from P and still contains many cells forming the same lining. Does it become an organ simply because it is now a separate sample?',
              answer: '不会，仍是该组织的一部分。',
              explanation:
                '切下的小块仍然是许多相关细胞形成的同一种保护层，并没有变成多种组织共同工作的器官。**单独拿出来，不等于成为器官**；决定层级的仍是它怎样组成。\n\n同理，放大样本照片不改变组成，把完整器官取出也不会仅因离体就变成组织。只有组成关系真的改变，才需要重新判断层级。',
            },
          },
          {
            title: '叶的层级和组织功能，两部分都判断对了吗？',
            question:
              'A leaf contains epidermal, photosynthetic and transport tissues. Which row correctly gives its level of organisation and explains a function of one of its tissues?',
            options: [
              'Tissue; its photosynthetic cells absorb light using chloroplasts.',
              'Organ; all its tissues carry out photosynthesis because the leaf is green.',
              'Organ system; its tissues cooperate in protection, photosynthesis and transport.',
              'Organ; photosynthetic tissue uses chloroplasts to capture light energy.',
            ],
            answer: 'D：叶是器官，其中光合组织中的叶绿体捕获光能。',
            steps: [
              '先读组成：题干给出了表皮、光合和输导三类组织。多种组织组成一片叶，所以叶是器官。A 写成组织、C 写成器官系统，都可以先排除。',
              '再看 B、D 的后半句。B 中 all 是“所有”的意思，但一片叶能光合作用，**不代表里面每一种组织都负责光合作用**；保护和运输也各有分工，所以 B 不成立。',
              'D 既正确地把叶称为器官，也正确说明光合组织中的叶绿体捕获光能。两部分都对，因此选 D。',
            ],
            optionNotes: [
              'A：叶绿体吸收光能这部分可以成立，但整片叶含多种组织，不能只叫一种组织。',
              'B：器官这一判断正确，错在“所有组织都光合作用”。它把整片叶能够完成的活动，误当成每一种组织都要完成的活动。',
              'C：保护、光合与运输的分工说得对，但多种组织先构成器官；有多种功能并不让它自动变成器官系统。',
              'D：叶的层级判断正确，光合组织与叶绿体的作用也解释正确。',
            ],
            takeaway:
              '遇到一整行的选择，先问“**分类对吗？**”，再问“作用也对吗？”。两次都通过，才能保留。\n\n按层级排序时，再检查每个箭头是不是组成关系。叶绿体是叶肉细胞内部的细胞器，不能插到“组织与器官”之间；一项突出功能，也不能代替这些组成关系。',
            variant: {
              question:
                'The sample is changed to one independently living unicellular alga. Must it have tissues and organs to count as an organism?',
              answer: '不需要；该单细胞本身可以是完整生物体。',
              explanation:
                '题干这次明确说是独立生活的单细胞藻类。它只有一个细胞，但这个细胞就能作为完整个体生活，所以也叫生物体。==不是每个生物都必须有组织和器官==，多细胞生物的层级顺序不能硬套到这里。',
            },
          },
        ],
        checklist: [
          '细胞、组织、器官与系统各自怎样组成？每层可以举出什么例子？',
          '为什么叶与根都是器官，而不是各自一种组织？',
          '一个器官中的不同组织可以怎样分工？为什么整片叶能光合不代表每种组织都光合？',
          '为什么单细胞生物可以是完整个体，组织切小或器官离体却不自动改变层级？',
        ],
      },
      sourceIds: ['uat-spec-biology', 'uat-biology-guide', 'openstax-organisation'],
    },
  ],
  sources: [
    {
      id: 'uat-spec-biology',
      title: 'UAT-UK · ESAT Content Specification（2026/27）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '内部范围核查：B1.1、B1.2、B1.3 的结构功能与组织层级；不据考纲文字推断题目占比。',
    },
    {
      id: 'uat-biology-guide',
      title: 'UAT-UK · ESAT Guide: Biology（June 2025）',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2025/07/06120052/ESAT_Guide_Biology_June_2025.pdf',
      note: '内部核对 B1 基础定义及植物/动物/细菌比较；讲义按证据推理重新组织，专项题与变式均为原创。',
    },
    {
      id: 'uat-nsaa-2016',
      title: 'UAT-UK Archive · NSAA 2016 Section 1',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/07120539/NSAA_2016_S1_QuestionPaper.pdf',
      note: '内部参考 Q57 的特征交集和 Q62 的显微可见性设问方式；NSAA 为历史准备材料，不标为 ESAT 真题，也不复制题干、图或答案。',
    },
    {
      id: 'openstax-eukaryotic',
      title: 'OpenStax · Biology 2e: Eukaryotic Cells',
      url: 'https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells',
      note: '内部核查细胞器的结构功能、核糖体组成及染色体状态；不转载原文、插图或教材练习。',
    },
    {
      id: 'openstax-prokaryotic',
      title: 'OpenStax · Biology 2e: Prokaryotic Cells',
      url: 'https://openstax.org/books/biology-2e/pages/4-2-prokaryotic-cells',
      note: '内部核查原核共享结构、主要 DNA 的组织方式及可选附加结构。',
    },
    {
      id: 'openstax-viruses',
      title: 'OpenStax · Biology 2e: Viral Evolution, Morphology, and Classification',
      url: 'https://openstax.org/books/biology-2e/pages/21-1-viral-evolution-morphology-and-classification',
      note: '仅核查病毒不属于细胞这一分类边界，不扩展病毒学内容。',
    },
    {
      id: 'openstax-organisation',
      title: 'OpenStax · Anatomy and Physiology 2e: Structural Organization of the Human Body',
      url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/1-2-structural-organization-of-the-human-body',
      note: '内部核查层级定义，使用原创植物/动物情境训练按组成与功能判定。',
    },
  ],
}
