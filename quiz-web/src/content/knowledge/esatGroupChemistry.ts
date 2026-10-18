// ESAT 第七章族化学讲义：以典型反应、可观察性质和有边界的趋势连接复习与真实题目。
import type { KnowledgeLesson } from './types'

export const esatGroupChemistry: KnowledgeLesson = {
  code: '140700',
  title: 'Group chemistry · 族化学',
  subtitle: '同族先找共同反应，再把反应性、物态和计量分开判断',
  intro:
    '第 1 族习惯失去电子，第 17 族常通过得到电子形成卤离子，第 18 族在常见条件下很不活泼。但“越往下越怎样”必须带着性质名称：碱金属反应性增强，卤素反应性减弱，卤素熔沸点却升高。把这些变化放进实际反应与观察中，比背一串箭头更容易记住。',
  memory: [
    '**三族分开：碱金属是金属，卤素常见单质为 X₂，稀有气体为单原子。**氢不是碱金属。',
    '**Li → Na → K：与水反应更剧烈，熔沸点总体降低。**密度不能机械套成逐个增加，K 比 Na 密度小。',
    '**F₂ → Cl₂ → Br₂ → I₂：氧化能力减弱，熔沸点升高。**常温物态从气体到液体、固体。',
    '**强卤素置换弱卤素的卤离子。**先分清 X₂ 与 X⁻，再写电子得失和现象。',
    '**反应快慢不等于最终产量。**等质量不是等摩尔，金属的活性趋势也不能直接套到它的盐溶液。',
  ],
  sections: [
    {
      code: '140701',
      title: '碱金属、卤素与稀有气体',
      summary: '用粒子形式、典型反应和实际物态，建立三族各自的性质画像。',
      paragraphs: [
        '**碱金属 alkali metals** 是第 1 族的金属，常见例子为 Li、Na、K。它们是较软、密度较低的银白色金属，新鲜表面会很快失去光泽；最外层的一个电子容易失去，形成 M⁺。与水反应生成金属氢氧化物和氢气，溶液呈碱性，不是直接生成氧化物。',
        '**卤素 halogens** 位于第 17 族。F₂、Cl₂、Br₂、I₂ 是双原子单质，颜色与物态不同；卤离子 F⁻、Cl⁻、Br⁻、I⁻ 则是得到电子后的粒子。氯气有颜色，不代表氯化钠溶液也有氯气的颜色；金属与卤素形成卤化物时，要按离子电荷配比，而不是照抄单质 X₂ 的下标。',
        '卤素与氢可形成氢卤化物 HX，例如氢气与氯气在光照下可快速反应生成 HCl，HCl 溶于水形成酸性溶液。氯气与水还会部分反应形成 HCl 和 HClO：氯水具有酸性和漂白作用，漂白依赖湿润条件。**Cl₂、HCl 和 Cl⁻ 是三个不同的观察对象**，不能因为都含氯就赋予相同的颜色与作用。',
        '**稀有气体 noble gases** 位于第 18 族，He、Ne、Ar 在常温下是无色、单原子气体，熔沸点很低。稳定的外层排布使它们通常很不活泼：He 外层为 2 个电子，Ne、Ar 为 8 个。氩气可提供保护气氛，减少热金属与空气反应；它不是因为作了催化剂才保护金属。',
        '同族性质用于提出预测，具体粒子和条件用于检查预测。LiCl、NaCl、KCl 中的金属已经是阳离子，不会像相应金属单质一样与水剧烈反应。稀有气体“很不活泼”也不等于任何条件下绝不成键；较重的稀有气体可以形成一些化合物。',
      ],
      rules: [
        {
          title: '碱金属与水的共同反应',
          text: '对 Li、Na、K，可写 $2\\mathrm{M}+2\\mathrm{H_2O}\\rightarrow2\\mathrm{MOH}+\\mathrm{H_2}$。2 mol 金属对应 1 mol H₂；碱性来自水中的 OH⁻。',
        },
        {
          title: '卤化物从电荷写起',
          text: 'M⁺ 与 X⁻ 组成 MX；Ca²⁺ 与 Br⁻ 组成 CaBr₂。Br₂ 是溴单质的分子式，不能据此写出 KBr₂。',
        },
        {
          title: '碱性与溶解性分别判断',
          text: 'NaOH、KOH 易溶于水，形成含 OH⁻ 的碱性溶液；Mg(OH)₂ 等许多金属氢氧化物溶解度很小。过滤能除去不溶颗粒，但不能除去已经溶解的 NaOH。',
        },
        {
          title: '焰色用于鉴别，不用于排活性',
          text: '含锂、钠、钾的盐分别可呈深红色、黄色、淡紫色焰色，可用于区分相应金属离子。盐的焰色不是金属与水反应的剧烈程度，不能据此给金属活性排序。',
        },
        {
          title: '氧气与水不能混作一种反应',
          text: '锂与氧气可生成 Li₂O，锂与水生成 LiOH 和 H₂。其他碱金属与氧气还可能形成过氧化物或超氧化物，不能把所有燃烧产物一律写成 M₂O；依题目条件判断。',
        },
        {
          title: '物态和粒子形式要一起读',
          text: '常温常压下，F₂ 为淡黄色气体、Cl₂ 为黄绿色气体、Br₂ 为红棕色液体、I₂ 为灰黑色固体；碘蒸气为紫色。He、Ne、Ar 为单原子气体。',
        },
        {
          title: '把共同反应迁移到新情境',
          text: '碱金属也能与醇的 O—H 部分反应，形成醇盐并放出 H₂，例如乙醇与钠生成乙醇钠，不是乙酸钠。相同质量金属生成气体多少，要再换算摩尔数。',
        },
      ],
      pitfalls: [
        '把“第 1 族”与“碱金属”完全画等号，将非金属氢也算进去。',
        '把 Ar 写成 Ar₂，或把卤素单质 X₂ 与无色卤离子 X⁻ 混淆。',
        '把“碱金属氧化物呈碱性”误读成碱金属与水只生成氧化物。',
        '用金属单质的反应性，直接预测其盐溶液的沉淀速率。',
      ],
      sourceIds: ['uat-c7', 'openstax-groups', 'openstax-halogens', 'openstax-noble', 'rsc-flame'],
      visual: 'group-chemistry',
      examFocus: {
        goal: '先确定是哪一族、哪一种粒子，再调用性质，避免不同族与不同状态相互串用。',
        pastPaperSummary:
          '真题常把两种族的趋势或单质、离子的性质放进同一道判断题，也把典型反应接到气体、质量和物质鉴别上。先分清对象，再处理数据。',
        pastPaperPatterns: [
          {
            form: '三族性质与跨族趋势比较',
            description:
              '在同一组选项中比较不同族的反应性、熔沸点和稳定性；每项都要重新确认对应族与性质，不能共用一支趋势箭头。',
            reference: '2020、2021、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-001',
              'ESAT-2020-CHEMISTRY-008',
              'ESAT_LEGACY_2021_NSAA_Q044',
              'NSAA_2023_S1-Q047',
            ],
          },
          {
            form: '碱金属典型反应接定量或产物判断',
            description:
              '从与水、氧气或醇反应写出真实产物和比例，再求气体体积、限量产物或敞口容器质量变化；完成快慢不能代替最终反应量。',
            reference: '2016—2018、2020、2021 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q051',
              'NSAA_2017_S1-Q044',
              'ESAT_LEGACY_2018_NSAA_Q53',
              'ESAT-2020-CHEMISTRY-018',
              'ESAT_LEGACY_2021_NSAA_Q049',
            ],
          },
          {
            form: '单质与化合物的性质分开使用',
            description:
              '用常见离子电荷、焰色或氢氧化物溶解性判断化合物，并识别盐溶液中真正参与反应的离子；盐的鉴别性质不能替代金属活性。',
            reference: '2020、2022、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-004',
              'ESAT-2020-CHEMISTRY-005',
              'ESAT-2020-CHEMISTRY-011',
              'ESAT_LEGACY_2022_NSAA_Q050',
              'NSAA_2023_S1-Q044',
            ],
          },
          {
            form: '卤素性质与反应观察联用',
            description:
              '从卤素与氢、金属或卤离子的反应判断物质与现象；根据反应对象区分生成氢卤酸、形成卤化物或置换另一种卤素。',
            reference: '2018、2021、2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q42',
              'ESAT_LEGACY_2018_NSAA_Q48',
              'ESAT_LEGACY_2021_NSAA_Q047',
              'ESAT_LEGACY_2022_NSAA_Q041',
            ],
          },
          {
            form: '由低反应性解释保护气氛',
            description:
              '在热金属提取中判断氩气的作用，区分减少副反应的环境与改变反应速率的催化作用。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q049'],
          },
        ],
        pastPaperNote:
          '与醇反应、物质鉴别和气体计量属于综合应用；只出现含钠或含氯物质、且题目已给全反应式的普通计算，不据此列为族性质考法。',
        examples: [
          {
            title: '水反应、沸点与粒子形式，三句话分别判断',
            source: {
              kind: 'bank',
              subject: 'chemistry',
              questionCode: 'CHEM-MOCK-ADAPT-E01-010-R8-FINAL-20260818',
              why: '同一题把三族的不同性质并列，训练逐条确认对象与趋势。',
            },
            question: '',
            answer: 'B · 只有 I 正确。',
            steps: [
              '先给三条陈述各贴一个标签：I 是碱金属与水的反应性，II 是卤素沸点，III 是稀有气体粒子形式。它们不是同一种比较。',
              'K 在 Na 下方，外层电子更远、屏蔽更多，失去该电子更容易。在可比条件下，K 与水反应比 Na 更剧烈，所以 I 正确。',
              'Br₂ 比 Cl₂ 的电子云更大，同类分子间的色散作用更强，沸点较高；“bromine has a lower boiling point”方向相反，II 错误。',
              '氩气在通常条件下由独立 Ar 原子组成，不以 Ar₂ 分子作为常见粒子形式。III 错误，因此真值组合为“只有 I”，选 B。',
            ],
            optionNotes: [
              'A：漏掉正确的 I。',
              'B：保留 I，排除 II、III，组合完整。',
              'C：错选沸点方向相反的 II，并漏掉 I。',
              'D：错把氩气当成 Ar₂ 分子，并漏掉 I。',
              'E：I 正确，但多选 II。',
              'F：I 正确，但多选 III。',
              'G：两项错误陈述都纳入，反而漏掉 I。',
              'H：没有排除 II 与 III。',
            ],
            takeaway:
              '==先写性质名称，再画趋势方向==。反应性、分子间作用与常见粒子形式，要用各自的理由。',
          },
        ],
        checklist: [
          '能分别说出三族的粒子形式与典型物态。',
          '能写碱金属与水反应及常见卤化物化学式。',
          '能解释氩气保护作用，并区分单质与盐的性质。',
        ],
      },
    },
    {
      code: '140702',
      title: '碱金属的性质趋势',
      summary: '向下更易失电子，但反应速度、熔沸点与最终产量是三件事。',
      paragraphs: [
        '沿第 1 族从上到下，先记住 **Li → Na → K**。电子层增多，外层电子离核更远，内层电子的屏蔽也更多；虽然质子数增加，外层电子受到的有效束缚总体减弱，更容易失去。因此与水的反应性一般向下增强。',
        '在可比的少量金属与水的演示中，锂浮在水上并放出气泡；钠常因反应放热熔成小球，在水面移动；钾反应更剧烈，并可能出现淡紫色火焰。共同产物都是相应氢氧化物和 H₂。**浮起、熔成球与起火的原因不同**：分别涉及密度、熔点与放热，不应全都解释成“更活泼”。',
        'Li、Na、K 的熔点和沸点向下总体降低，金属也通常更软。密度不能照着原子序数机械排序：按 RSC 数据取近似值，Li 0.53、Na 0.97、K 0.89 g/cm³，三者都小于水，但 K 的密度低于 Na。具体数据优先于一条没有例外的口诀。',
        '同样质量的 Li、Na、K 不代表同样多的原子。若都完全反应，1 mol 金属对应 0.5 mol H₂，因此较小摩尔质量的金属在相同质量下可放出更多氢气。这不与“钾反应更快”矛盾：一个是最终量，一个是完成过程的快慢。',
      ],
      rules: [
        {
          title: '用外层电子解释反应性',
          text: '沿 Li → Na → K，失电子更容易，形成 M⁺ 的倾向增强。不能只数质子增加，就说最外层电子一定被吸得更紧。',
        },
        {
          title: '两个相反方向分开记',
          text: '向下：与水反应性增加，熔沸点总体降低。低熔点不代表化学反应不活泼，反应剧烈也不代表金属熔点高。',
        },
        {
          title: '预测先限定条件',
          text: '比较相同温度、可比用量与表面状态下的反应表现。图像若同时改变质量或表面积，不能把全部差异归因于元素本身。',
        },
        {
          title: '等量要问清是哪一种量',
          text: '不同碱金属各取等摩尔、完全反应时生成相同量 H₂，每 1 mol 金属对应 0.5 mol H₂；等质量金属则先用 n = m/M。最终量由比例和限量条件决定，不能用剧烈程度替代。',
        },
        {
          title: '金属趋势不能直接套给盐',
          text: 'Li⁺、Na⁺、K⁺ 已失去外层电子。它们的氯化物与 AgNO₃ 混合时，主要反应是 Ag⁺ + Cl⁻ → AgCl；金属钾更活泼并不使 KCl 必然生成更多沉淀。',
        },
      ],
      pitfalls: [
        '记成“第 1 族向下所有性质都增加”。',
        '认为 K 的密度一定大于 Na，或把浮在水上解释成反应快。',
        '把等质量与等摩尔混用，以为反应最剧烈就产气最多。',
        '把碱金属盐中的阳离子当成金属单质，误套反应性顺序。',
      ],
      sourceIds: ['uat-c7', 'openstax-groups', 'rsc-lithium', 'rsc-sodium', 'rsc-potassium'],
      visual: 'group-chemistry',
      examFocus: {
        goal: '分别判断反应性和物理性质，并在等质量、盐溶液等条件下识别趋势的适用边界。',
        pastPaperSummary:
          '已收录题把碱金属反应性与熔沸点穿插在多陈述题中；另一类用盐溶液现象，检查你会不会过度使用“向下更活泼”。',
        pastPaperPatterns: [
          {
            form: '把反应性与熔沸点分开排序',
            description:
              '限定 Li、Na、K 后比较反应性、熔点或沸点，或排除“所有族都向同一方向变化”的概括；需要同时保留族别与性质名。',
            reference: '2020、2021 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-001',
              'ESAT-2020-CHEMISTRY-008',
              'ESAT_LEGACY_2021_NSAA_Q044',
            ],
          },
          {
            form: '从失电子难易判断反应性方向',
            description:
              '把第 1 族向下的失电子趋势与电极、还原剂等说法并列；先判断原子失电子的倾向，再核对电子过程的术语。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q044'],
          },
          {
            form: '识别趋势在盐溶液中的失效边界',
            description:
              '比较相同浓度和体积的 LiCl、NaCl、KCl 发生沉淀的量、速率与反应类型，必须先找真正反应的离子，而非套金属单质的活性。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q044'],
          },
        ],
        pastPaperNote:
          '正文的等质量产气比较用于区分快慢与最终量，不作为本点趋势真题的独立类型。密度的 Na/K 例外按官方物性范围学习，不虚构本批真题曾直接考过。',
        examples: [
          {
            title: 'LiBr 的三句话，需要三条不同的趋势',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'ESAT-2020-CHEMISTRY-001',
              why: '将 Li 的反应性与熔点和卤素的反应性、沸点交叉，训练带着比较范围作判断。',
            },
            question: '',
            answer: 'F · 1 和 3 正确。',
            steps: [
              '先锁定题目范围：碱金属只有 Li、Na、K，卤素只有 F、Cl、Br。不能因为还知道 I，就把“这三种中最不活泼”改成“全族最不活泼”。',
              '陈述 1 看溴：在 F、Cl、Br 中，反应性沿族向下减弱，所以 Br 是三者中最不活泼的卤素，1 正确。',
              '陈述 2 是两条件同时成立。Li 确实是三种碱金属中最不活泼的，但 Br 不是三种卤素中沸点最低的；最低的是 F₂。因此整条陈述 2 错误。',
              '陈述 3 只看碱金属熔点。Li → Na → K 熔点总体降低，Li 在三者中最高，所以 3 正确。真假顺序为真、假、真，选 F。',
            ],
            optionNotes: [
              'A：漏掉 1 和 3。',
              'B：1 正确，但遗漏 3。',
              'C：只选了错误的 2。',
              'D：3 正确，但遗漏 1。',
              'E：多选 2，并漏掉 3。',
              'F：恰好包含 1、3。',
              'G：多选 2，并漏掉 1。',
              'H：把陈述 2 中前半句正确误当成整句正确。',
            ],
            takeaway:
              '==“最……”先限定范围；“并且”两边都要成立。== 同一题中的熔点和反应性，不一定沿同方向变化。',
          },
        ],
        checklist: [
          '能写出 Li、Na、K 的相对位置及反应性、熔沸点方向。',
          '能说明密度例外和反应观察背后的不同原因。',
          '能区分速度、最终量和盐溶液中的离子反应。',
        ],
      },
    },
    {
      code: '140703',
      title: '卤素的趋势与置换',
      summary: '向下更难获得电子，却更难沸腾；置换要比较单质与另一种卤离子。',
      paragraphs: [
        '先把位置按 **F → Cl → Br → I** 排好。作为氧化剂的反应性总体向下减弱；在常见卤素置换中，Cl₂ 能从溴化物或碘化物溶液中置换出 Br₂、I₂，Br₂ 能置换 I₂，I₂ 则不能置换出 Cl₂ 或 Br₂。这里比较的是卤素单质得到电子的能力，不是比较它们的卤离子谁“更活泼”。',
        '解释时看外层：向下原子更大、内层电子屏蔽更多，外来电子受到的有效吸引减弱，因此卤素氧化能力总体降低。但孤立气态原子的电子亲和能有 F/Cl 等细节例外，不能把“卤素总体反应性顺序”说成每一种相关能量都严格单调。',
        '物理性质走另一条线：向下分子电子云增大，同类分子的色散作用总体增强，熔沸点升高，颜色也通常加深。常温下 F₂、Cl₂ 是气体，Br₂ 是液体，I₂ 是固体；碘在水中通常呈棕色体系，在适当有机溶剂中常呈紫色，不能只记一个“碘是紫色”而不问物态与溶剂。',
        '置换 displacement 是反应性竞争：较强的卤素单质从较弱卤素的卤离子夺取电子，自己成为卤离子，另一种卤素成为单质。Na⁺ 或 K⁺ 常是旁观离子，删掉后更容易看清主线。只有两种卤化物盐溶液混合，没有加入卤素单质，不会自动发生这种置换。',
      ],
      rules: [
        {
          title: '先标 X₂，再标 X⁻',
          text: '例如 $\\mathrm{Cl_2}+2\\mathrm{Br^-}\\rightarrow2\\mathrm{Cl^-}+\\mathrm{Br_2}$。Cl₂ 得到 2e⁻ 被还原；两个 Br⁻ 各失去 1e⁻ 被氧化，原子与电荷同时守恒。',
        },
        {
          title: '向下置换，不能反过来',
          text: '在常见 Cl₂/Br₂/I₂ 水溶液比较中，上方的卤素能置换下方的卤离子；同一种卤素与自己的卤离子无净置换。F₂ 与水本身反应很强，不把它当作普通氟水参与这套演示。',
        },
        {
          title: '颜色判断写出条件',
          text: '氯水通常淡黄绿色、溴水橙色、碘的水溶液棕色；具体深浅随浓度变化。无置换时也可能因稀释变浅，因此不能把任何褪色都当成化学反应。',
        },
        {
          title: '反应性和沸点方向相反',
          text: 'F₂ → Cl₂ → Br₂ → I₂：氧化能力减弱，熔沸点升高。前者讨论电子转移，后者讨论分子间作用，不是卤素内部共价键越来越多。',
        },
        {
          title: '看见变化不一定是置换',
          text: 'Ag⁺ 与 I⁻ 生成黄色 AgI 沉淀，是沉淀反应；Cl₂ 与 I⁻ 生成碘，是氧化还原置换。中和也可以发生化学反应而没有明显颜色或沉淀变化。',
        },
      ],
      pitfalls: [
        '把“卤素单质氧化性向下减弱”误写为“卤离子得电子能力向下减弱”。',
        '认为 Br₂ 能置换 Cl⁻，或认为两种无色卤化物盐混合就会出卤素。',
        '把碘水、碘蒸气和碘在有机溶剂中的颜色混为一谈。',
        '只看颜色变浅而不排除稀释，或把无可见现象等同于无反应。',
      ],
      sourceIds: ['uat-c7', 'openstax-halogens', 'rsc-displacement'],
      visual: 'group-chemistry',
      examFocus: {
        goal: '把卤素位置转为反应方向、净离子方程和可观察结果，并与物理性质趋势分开。',
        pastPaperSummary:
          '真题既直接比较卤素反应性与沸点，也先用电解产生卤素再检验置换；现象题还会混入沉淀、中和或不反应，不能只看试剂中有没有卤素。',
        pastPaperPatterns: [
          {
            form: '反应性与物理性质方向交叉判断',
            description:
              '比较 F、Cl、Br 或其相邻元素的反应性、得电子倾向和熔沸点；同一道多陈述题中，化学与物理趋势可能方向相反。',
            reference: '2018、2020、2021、2023 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q48',
              'ESAT-2020-CHEMISTRY-001',
              'ESAT-2020-CHEMISTRY-008',
              'ESAT_LEGACY_2021_NSAA_Q044',
              'NSAA_2023_S1-Q047',
            ],
          },
          {
            form: '先确定卤素，再预测置换与颜色',
            description:
              '先识别试剂或电极产物，再判断它能否氧化溶液中的卤离子；从净反应推新生成的单质，而不是只比较原试剂的颜色。',
            reference: '2018、2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q42',
              'ESAT_LEGACY_2018_NSAA_Q48',
              'ESAT_LEGACY_2022_NSAA_Q041',
            ],
          },
          {
            form: '卤素趋势与化合物组成联考',
            description:
              '同一道题先核对置换与沸点，再根据金属电荷与卤离子 −1 写出卤化物并计算质量分数；三条陈述分别验证。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q48'],
          },
        ],
        pastPaperNote:
          '电解产物和沉淀现象是综合题的跨章前提，讲解会明确它们与卤素置换的分工；普通已给方程的配平题不作为需要判断置换方向的证据。',
        examples: [
          {
            title: '反应性、沸点、质量分数各走一步',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'ESAT_LEGACY_2018_NSAA_Q48',
              why: '同一卤素的三个陈述分别调用电子转移、分子间力和离子配比，避免只背一条趋势。',
            },
            question: '',
            answer: 'D · 只有 3 正确。',
            steps: [
              '陈述 1 要求 Br₂ 把 Cl⁻ 氧化为 Cl₂。氯在溴上方，Cl₂ 的氧化能力更强；Br₂ 不能从 Cl⁻ 中置换出 Cl₂，所以 1 错误。',
              '陈述 2 比较沸点，不比较反应性。Br₂ 分子的电子云更大、分子间作用更强，沸点高于 Cl₂；题目说“lower”，所以 2 错误。',
              '陈述 3 先写盐：Ca 是第 2 族，通常形成 Ca²⁺；Br⁻ 为 −1，所以化学式为 CaBr₂，而不是 CaBr。',
              '计算溴的质量分数：$\\dfrac{2\\times80}{40+2\\times80}\\times100\\%=80\\%$。3 正确，只有 3 对应 D。',
            ],
            optionNotes: [
              'A：漏掉正确的质量分数判断 3。',
              'B：1 的置换方向错误，并漏掉 3。',
              'C：2 的沸点方向错误，并漏掉 3。',
              'D：只选 3，符合逐条核对。',
              'E：两项错误陈述都选了，还漏掉 3。',
              'F：3 正确，但多选 1。',
              'G：3 正确，但多选 2。',
              'H：没有排除 1 和 2。',
            ],
            takeaway:
              '==反应性看电子，沸点看分子间力，质量分数先写化学式。== 不要让同一元素名掩盖三个不同任务。',
          },
        ],
        checklist: [
          '能排列 F、Cl、Br、I 并区分两类趋势。',
          '能判断 Cl₂/Br₂/I₂ 与卤离子的置换方向。',
          '能写净离子方程，并用有物态、浓度或溶剂条件的现象验证。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-c7',
      title: 'UAT-UK · ESAT Content Specification — C7',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '核对三族物理化学性质、碱金属与卤素趋势及置换的完整范围。',
    },
    {
      id: 'openstax-groups',
      title: 'OpenStax Chemistry 2e · Periodicity',
      url: 'https://openstax.org/books/chemistry-2e/pages/18-1-periodicity',
      note: '核对碱金属的电子变化、典型反应和族性质。',
    },
    {
      id: 'openstax-halogens',
      title: 'OpenStax Chemistry 2e · Properties of Halogens',
      url: 'https://openstax.org/books/chemistry-2e/pages/18-11-occurrence-preparation-and-properties-of-halogens',
      note: '核对卤素的物态、单质形式、反应与趋势边界。',
    },
    {
      id: 'openstax-noble',
      title: 'OpenStax Chemistry 2e · Properties of Noble Gases',
      url: 'https://openstax.org/books/chemistry-2e/pages/18-12-occurrence-preparation-and-properties-of-the-noble-gases',
      note: '核对单原子气体、低反应性与非绝对惰性。',
    },
    {
      id: 'rsc-flame',
      title: 'Royal Society of Chemistry · Flame Tests Using Metal Salts',
      url: 'https://edu.rsc.org/resources/flame-tests-using-metal-salts/1875.article',
      note: '核对锂、钠、钾盐的焰色及其鉴别用途。',
    },
    {
      id: 'rsc-lithium',
      title: 'Royal Society of Chemistry · Lithium',
      url: 'https://periodic-table.rsc.org/element/3/lithium',
      note: '核对锂的熔沸点、密度及物态。',
    },
    {
      id: 'rsc-sodium',
      title: 'Royal Society of Chemistry · Sodium',
      url: 'https://periodic-table.rsc.org/element/11/sodium',
      note: '核对钠的熔沸点、密度及物态。',
    },
    {
      id: 'rsc-potassium',
      title: 'Royal Society of Chemistry · Potassium',
      url: 'https://periodic-table.rsc.org/element/19/potassium',
      note: '核对钾与钠的密度例外及物性趋势。',
    },
    {
      id: 'rsc-displacement',
      title: 'Royal Society of Chemistry · Halogen Displacement Reactions',
      url: 'https://edu.rsc.org/experiments/halogens-in-aqueous-solution-and-their-displacement-reactions/733.article',
      note: '核对水溶液置换、颜色条件及稀释对观察的影响。',
    },
  ],
}
