// ESAT 分离技术讲义：用物质身份、物性与目标产物串联装置选择和真实题目。
import type { KnowledgeLesson } from './types'
import { separationMethods } from './separationMethods'

export const esatSeparationTechniques: KnowledgeLesson = {
  code: '140800',
  title: 'Separation techniques · 分离技术',
  subtitle: '先看分开什么，再找物性差异，最后检查收集到的是什么',
  intro:
    '分离题不只是记装置名称。先分清目标是从混合物中取回原来的物质，还是从化合物中得到组成元素；再用溶解性、互溶性、挥发性或色谱迁移差异设计路线。每一步都追踪目标去了哪里，滤液、滤渣和馏出液就不会认错。',
  memory: [
    '**混合物取回成分，用物理方法；化合物变成组成单质，需要化学过程。**蒸干盐水得到盐，不会得到钠。',
    '**过滤看是否溶解，分液看是否分层。**普通滤纸留不住溶解的盐，分液漏斗分不开互溶的乙醇与水。',
    '**要溶剂，蒸馏并冷凝收集；要晶体，浓缩、冷却、过滤和干燥。**别只看操作，还要看目标产物。',
    '**沸点较低的成分通常先富集在蒸气中。**分馏通过反复汽化与冷凝改善分离，并非让混合物在各纯物质沸点突然完全切换。',
    '**Rf = 斑点中心路程 ÷ 溶剂前沿路程。**同一起跑线、同一展开方向、同一单位；比较身份还要保持实验条件一致。',
    '**多斑点支持有多种成分；单斑点只是在本条件下看起来纯。**重叠或未显色的成分可能被漏掉。',
  ],
  sections: [
    {
      code: '140801',
      title: '从化合物中取得元素',
      summary: separationMethods['140801']!.summary,
      paragraphs: [separationMethods['140801']!.intro],
      rules: separationMethods['140801']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: separationMethods['140801']!.memory,
      visual: 'separation-techniques',
      pitfalls: [
        '认为盐水蒸发能得到钠与氯。',
        '把“需要化学过程”误缩成“只能用金属置换”。',
        '反写活泼性竞争方向，或认为同种金属也能置换自身。',
        '把熔融盐与盐的水溶液当成相同的电解情境。',
      ],
      sourceIds: ['uat-c8', 'openstax-change'],
      examFocus: {
        goal: '用物质身份判断物理分离与化学提取，再根据反应证据识别可行方向。',
        pastPaperSummary:
          '相关真题把“从化合物中取得元素”放进活泼性竞争、提取路线和电解产物判断中。先分清金属与其离子，再看题给条件是否允许生成该单质。',
        pastPaperPatterns: [
          {
            form: '由置换与提取方法连接活泼性顺序',
            description:
              '结合碳能否还原金属氧化物、金属能否置换盐中金属，以及与稀酸的反应，拼出相对活泼性链。不同实验给的是顺序约束，不是把所有盐直接过滤成金属。',
            reference: '2019、2021 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q041', 'ESAT_LEGACY_2021_NSAA_Q041'],
          },
          {
            form: '比较熔融与水溶液中能得到哪些元素',
            description:
              '判断电解时在何极生成金属或非金属，并比较盐的熔体与水溶液；水参与时，不一定同时得到盐的两种组成元素。部分题把产物判断与电子量或反应路线合考。',
            reference: '2016—2020、2022 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q047',
              'NSAA_2017_S1-Q045',
              'NSAA_2017_S1-Q050',
              'ESAT_LEGACY_2018_NSAA_Q39',
              'ESAT_LEGACY_2018_NSAA_Q42',
              'NSAA_2019_S1-Q054',
              'ESAT-2020-CHEMISTRY-007',
              'ESAT_LEGACY_2022_NSAA_Q042',
              'ESAT_LEGACY_2022_NSAA_Q047',
            ],
          },
          {
            form: '卤素从卤化物中释放单质（综合）',
            description:
              '把卤素与卤化物溶液混合，判断是否发生置换或出现颜色变化；需要比较单质的反应性，并区别置换所得单质与沉淀反应所得化合物。',
            reference: '2018、2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q48', 'ESAT_LEGACY_2022_NSAA_Q041'],
          },
          {
            form: '工业提取中的还原剂、保护气氛与用量',
            description:
              '由金属卤化物和不同还原剂写出制取金属的反应，辨认惰性气氛的用途，并比较反应比例或用料质量；这是化学提取与前面计量、氧化还原的综合运用。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q049'],
          },
        ],
        pastPaperNote:
          '未把仅给定产物后计算质量的题、只有氧化还原分类的题都计入本点。电解细节属于跨章应用，不能由“需要化学过程”推断所有盐的水溶液都能析出其金属。',
        comparison: {
          title: '目标不同，过程不同',
          columns: ['起始物', '目标', '必要过程'],
          rows: [
            ['盐水', '氯化钠晶体', '蒸发或结晶：保留化合物身份'],
            ['氧化铜', '铜单质', '还原反应：Cu²⁺ 得电子'],
            ['熔融氯化钠', '钠和氯气', '电解：发生电子转移'],
          ],
        },
        examples: [
          {
            title: '同一片铁，为什么只在一杯盐溶液中置换金属？',
            source: {
              questionCode: 'CHEM-MOCK-ADAPT-E02-009-R8-FINAL-20260818',
              subject: 'chemistry',
              kind: 'bank',
              why: '同一金属面对较不活泼、同种和较活泼金属离子，三种对照能检查置换方向。',
            },
            question: '',
            answer: 'E · P yes，Q no，R no。',
            steps: [
              '先读判定标准：本题只有“金属从其离子中被置换”才计为发生反应；不是只要浸入液体或颜色变化就写 yes。',
              '写相对活泼性 Zn > Fe > Cu。P 为 CuSO₄，Fe 比 Cu 活泼，可将 Cu²⁺ 还原为 Cu，因此 P 为 yes。离子式为 Fe + Cu²⁺ → Fe²⁺ + Cu。',
              'Q 为 FeSO₄，铁面对自己的 Fe²⁺，没有这种净置换，因此 Q 为 no。R 为 ZnSO₄，Fe 不如 Zn 活泼，不能按本题条件将 Zn²⁺ 置换成 Zn，因此 R 为 no。',
              '按原表 P、Q、R 顺序得到 yes / no / no。生成 Cu 是化学变化，之后若要收集铜才考虑物理分离。',
            ],
            optionNotes: [
              'A：漏掉 Fe 能置换 Cu 的 P。',
              'B：同时反转 P 和 R 的活泼性比较。',
              'C：把与自身盐接触误判为能置换，还漏掉 P。',
              'D：错把 Q、R 判 yes，并漏掉真正的 P。',
              'E：P yes、Q no、R no，与三次比较一致。',
              'F：P、Q 正确，但误认为铁能置换更活泼的锌。',
              'G：P、R 正确，但误判铁能从自身盐中产生净置换。',
              'H：把所有金属盐都视为可被铁置换，没有逐一比较。',
            ],
            takeaway:
              '**一行活泼性，逐格作比较。**能否置换取决于加入的金属与盐中金属，不取决于三杯溶液都叫“硫酸盐”。',
          },
        ],
        checklist: [
          '能说明为什么蒸发不能把盐拆成元素。',
          '能由“谁置换谁”写出活泼性关系。',
          '能区分制得新物质与收集该物质的两个步骤。',
        ],
      },
    },
    {
      code: '140802',
      title: '混合物的物理分离',
      summary: separationMethods['140802']!.summary,
      paragraphs: [separationMethods['140802']!.intro],
      rules: separationMethods['140802']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: separationMethods['140802']!.memory,
      visual: 'separation-techniques',
      pitfalls: [
        '用过滤去除盐水中已经溶解的盐。',
        '把互溶液体放入分液漏斗，期待静置后自动分层。',
        '按颜色或“有机”名称猜上、下层。',
        '取错滤液或滤渣，后续计算再正确也对应错物质。',
      ],
      sourceIds: ['uat-c8', 'purdue-separation', 'columbia-crystals'],
      examFocus: {
        goal: '把混合物分类、物性证据与每一步的目标组分对应起来。',
        pastPaperSummary:
          '真题先让你判断混合物成分如何分布，再用物性完成分离或后续计算。重点是确认哪一层、哪一份滤液仍含目标。',
        pastPaperPatterns: [
          {
            form: '把液态空气视为可按挥发性分开的混合物',
            description:
              '给主要空气成分的熔沸点，判断液化后逐步分离的收集次序；有时还需先筛出空气中最丰富的三种成分，不能只取全表最低沸点。',
            reference: '2018、2020 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q41', 'ESAT-2020-CHEMISTRY-002'],
          },
          {
            form: '互溶性定组成，密度定液层',
            description:
              '三种液体形成两层后，识别独立的一种与仍互溶的两种；再选需要继续处理的液层，把分液和蒸馏顺序连接起来。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q050'],
          },
          {
            form: '判断滤液中的组分，再接定量分析',
            description:
              '混合固体中一份溶解、另一份不溶；先确定过滤后谁留在溶液中，再利用中和量反推原混合物组成。不能把酸消耗量直接算到滤渣上。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-011'],
          },
        ],
        comparison: {
          title: '先分类，再选用的差异',
          columns: ['混合物', '可用差异', '先考虑'],
          rows: [
            ['沙 + 盐水', '固体不溶', '过滤，盐仍在滤液'],
            ['油 + 水', '不互溶、密度不同', '静置分层后分液'],
            ['乙醇 + 水', '互溶、挥发性不同', '蒸馏或分馏'],
            ['盐 + 沙', '在水中溶解性不同', '溶解 → 过滤 → 回收盐'],
          ],
        },
        examples: [
          {
            title: '三种液体分成两层，下一步处理哪一层？',
            source: {
              questionCode: 'NSAA_2019_S1-Q050',
              subject: 'chemistry',
              kind: 'annual',
              why: '把互溶性、密度和沸点三类数据按用途串联，避免先看到最低沸点就选操作。',
            },
            question: '',
            answer: 'B · 对下层进行蒸馏，选择对应 X 的 65°C。',
            steps: [
              '先用互溶性，不急着读沸点：X 与 Z 互溶，二者在同一层；Y 与它们都不互溶，单独形成另一层。',
              '再看密度：Y 为 0.68 g cm⁻³，低于 X 的 0.79 和 Z 的 1.00。按本题条件，上层为 Y，下层为 X 与 Z 的混合物。',
              '分液已经取出了单独的 Y；还需要处理的是下层 X/Z。二者沸点分别为 65°C 与 100°C，先收集较易挥发的 X，对应题给 B。',
              '51°C 属于 Y，不是下层两个成分的沸点；只因为它是全表最低值就选它，会忽略分液已完成的工作。真实蒸馏中组成会逐步变化，本题按给定纯物质沸点选择目标馏分。',
            ],
            optionNotes: [
              'A：下层选对，但 51°C 对应已经单独分出的 Y。',
              'B：选择仍含 X/Z 的下层，并先处理较低沸点的 X，符合题意。',
              'C：下层选对，但直接选 100°C 没有先利用 X 的较低沸点完成进一步分离。',
              'D：51°C 是 Y 的沸点，但上层已经只有 Y，继续蒸馏它不解决下层 X/Z 的混合。',
              'E：上层不是含 X 的那一层；65°C 的数据与上层对象错配。',
              'F：上层不是含 Z 的那一层；100°C 同样未处理仍混合的 X/Z。',
            ],
            takeaway: '**互溶性找同伴，密度找上下，沸点选后续。**三类数据各回答一个问题。',
          },
        ],
        checklist: [
          '能区分溶解与悬浮。',
          '能说明一层液体为何仍可能是混合物。',
          '能标出多步路线中应保留的每一份产物。',
        ],
      },
    },
    {
      code: '140803',
      title: '选择分离方法',
      summary: separationMethods['140803']!.summary,
      paragraphs: [separationMethods['140803']!.intro],
      rules: separationMethods['140803']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: separationMethods['140803']!.memory,
      visual: 'separation-techniques',
      pitfalls: [
        '只蒸发不冷凝，却声称收到了溶剂。',
        '把所有互溶液体都当成能一次蒸馏成绝对纯品。',
        '离心之后宣称盐水已脱盐。',
        'Rf 量到斑点边缘或从纸底量起；二维展开混用前沿。',
        '因为展开时间更长就改变同条件下的 Rf。',
      ],
      sourceIds: [
        'uat-c8',
        'purdue-separation',
        'columbia-crystals',
        'mcmaster-distillation',
        'wisconsin-chromatography',
      ],
      examFocus: {
        goal: '能按目标选择方法、组合步骤，并用同条件下的 Rf 处理读图与比例。',
        pastPaperSummary:
          '已收录题集中在分馏顺序、组合分离路线和色谱读图。色谱常把识别组分、迁移比例与实验条件放在一起，需要统一基线和前沿。',
        pastPaperPatterns: [
          {
            form: '从物性表选择分馏的收集顺序',
            description:
              '先确定要分离的物质，再按同压下沸点比较挥发性。熔点列、负温度的大小，以及表中并非主要空气组分的气体都可能成为干扰。',
            reference: '2018、2020 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q41', 'ESAT-2020-CHEMISTRY-002'],
          },
          {
            form: '把分液、溶解或过滤接成路线',
            description:
              '依次确定每步剩余组分：不互溶液体先按层分开，互溶部分再蒸馏；可溶与不溶固体则先溶解、过滤，再分析滤液。综合题真正要求的是方法适用对象和产物走向。',
            reference: '2019、2020 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q050', 'ESAT-2020-CHEMISTRY-011'],
          },
          {
            form: '用标准斑点和 Rf 判断组分及迁移性',
            description:
              '把未知样品与标准物或 Rf 表比较，判断共同成分、最易移动的组分及流动相身份；可能额外限定只考虑纯样品。斑点路程不能用来直接推浓度。',
            reference: '2016—2019 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q043',
              'NSAA_2017_S1-Q041',
              'ESAT_LEGACY_2018_NSAA_Q49',
              'NSAA_2019_S1-Q039',
            ],
          },
          {
            form: '前沿或参照斑点改变，按比例预测新路程',
            description:
              '延长展开或在同纸同溶剂下重做，用 Rf 保持不变建立比例；若给共同组分的新距离，可先找这个参照点，再换算另一斑点，而不是按时间线性外推。',
            reference: '2020、2022 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-010', 'ESAT_LEGACY_2022_NSAA_Q051'],
          },
          {
            form: '二维色谱分别读坐标与前沿',
            description:
              '两种溶剂沿不同方向展开，比较同一组分在两种体系的 Rf，并判断单独一种溶剂能否分开全部成分。需看各方向是否出现同位置重叠，不能只数最后四个斑点。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q051'],
          },
        ],
        pastPaperNote:
          '本次全量年度样本中未找到直接考离心或结晶装置选择的题；它们仍是官方 C8.3 必需内容，已在总结与图解完整覆盖，不以题库题冒充历年证据。',
        comparison: {
          title: '方法、差异、产物',
          columns: ['方法', '利用什么', '收集什么'],
          rows: [
            ['简单蒸馏', '挥发性，常用于溶剂与不挥发溶质', '冷凝后的馏出液'],
            ['分馏', '互溶成分的挥发性差异', '不同组成的馏分'],
            ['分液', '不互溶形成液层', '指定液层'],
            ['过滤 / 离心', '不溶悬浮固体与液体', '滤渣 / 滤液或沉淀 / 上清液'],
            ['溶解 → 结晶', '选择性溶解及溶解度变化', '回收的晶体'],
            ['纸色谱', '对两相的相对作用不同', '分开的斑点，用于分析'],
          ],
        },
        examples: [
          {
            title: '液态空气分馏：负数沸点怎样排？',
            source: {
              questionCode: 'ESAT_LEGACY_2018_NSAA_Q41',
              subject: 'chemistry',
              kind: 'annual',
              why: '在同时含熔点和沸点的表中选择真正决定收集顺序的数据。',
            },
            question: '',
            answer: 'B · nitrogen → argon → oxygen。',
            steps: [
              '题干已经明确 fractional distillation。要比较液体汽化时的挥发性，读 boiling point 一列，不按 melting point 排。',
              '提取三项沸点：N₂ 为 −196°C，Ar 为 −186°C，O₂ 为 −183°C。负数中 −196 比 −186 更低，不能按绝对值大小反排。',
              '按本题分馏模型，沸点较低的成分先被收集：N₂ → Ar → O₂。分离过程中这些成分的化学身份保持不变，空气不是一个待分解的化合物。',
              '最后按原选项的英文名称核对，得到 nitrogen、argon、oxygen，即 B。',
            ],
            optionNotes: [
              'A：氮气先收集正确，但将氧气排在沸点更低的氩气之前。',
              'B：−196 < −186 < −183，与收集顺序一致。',
              'C：把三者中沸点最高的氧气排在首位。',
              'D：整体把沸点由高到低排列，方向相反。',
              'E：误把氩气放在沸点更低的氮气之前。',
              'F：氩气放在首位且氮气最后，忽略氮气沸点最低。',
            ],
            takeaway: '**先选沸点列，再按真实数值由低到高排。**负温度、熔点列和英文名称分别核对。',
          },
        ],
        checklist: [
          '能从混合物和目标选方法，而不只背名称。',
          '能说明分馏、离心、结晶的适用条件。',
          '能用 Rf 处理重复展开和二维色谱。',
        ],
      },
    },
    {
      code: '140804',
      title: '用色谱判断纯度',
      summary: separationMethods['140804']!.summary,
      paragraphs: [separationMethods['140804']!.intro],
      rules: separationMethods['140804']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: separationMethods['140804']!.memory,
      visual: 'separation-techniques',
      pitfalls: [
        '看到一斑点就无条件宣称绝对纯。',
        '把多斑点的最高位置当成纯样品的最大 Rf。',
        '将相同 Rf 当成唯一确定的化学身份。',
        '用斑点迁移距离直接比较样品浓度。',
      ],
      sourceIds: ['uat-c8', 'wisconsin-chromatography'],
      examFocus: {
        goal: '在题设条件下建立“斑点 → 组分 → 纯度”的证据链，并知道结论的边界。',
        pastPaperSummary:
          '直接纯度题先筛单一成分的样品，再比较迁移；二维展开题进一步考察“一个位置可能隐藏多个成分”的分离边界。两类都不能把一个斑点无条件等同于纯物质。',
        pastPaperPatterns: [
          {
            form: '在完全分离前提下，先判纯度再比 Rf',
            description:
              '题目明确所有混合物都已完全分离，要求从只含一种物质的样品中选择相对流动相吸引较强者；先用斑点数筛选，之后再算距离比。',
            reference: '2019 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q039'],
          },
          {
            form: '用二维结果判断单次展开能否分全（综合）',
            description:
              '最终多个斑点在某一展开方向可能具有相同坐标；据此判断单独一种溶剂会不会留下重叠。题目主要考分离能力和两方向 Rf，为单点判断纯度提供实验边界。',
            reference: '2021 NSAA',
            sourceCodes: ['ESAT_LEGACY_2021_NSAA_Q051'],
          },
        ],
        pastPaperNote:
          '只问 Rf 缩放或在已知混合物中识别成分的题归入方法选择，不扩大为纯度考法；二维题也不被表述成直接询问纯度。',
        comparison: {
          title: '证据能说到哪一步',
          columns: ['观察', '可以支持', '不能直接推出'],
          rows: [
            ['多个清晰斑点', '检测到多个组分', '每个组分的完整结构与含量'],
            ['一个斑点', '本条件下未分出多个组分', '任何条件下都绝对纯'],
            ['同条件 Rf 相同', '可能含相同成分', '一定是同一物质'],
            ['更换溶剂后分成两点', '之前存在重叠成分', '原先的单点就是纯物质'],
          ],
        },
        examples: [
          {
            title: '最高的斑点，为什么不一定是答案？',
            source: {
              questionCode: 'NSAA_2019_S1-Q039',
              subject: 'chemistry',
              kind: 'annual',
              why: '同时保留“只含一种物质”与“相对流动相吸引最强”两个条件，再计算 Rf。',
            },
            question: '',
            answer: 'E · 0.80。',
            steps: [
              '先圈题设 fully separated：所有混合物都会被完全分离。按这个明确前提，单斑点的 W 与 Z 是候选；X、Y 有多个斑点，应先排除。',
              '在候选中比较迁移：W 的斑点距基线 6 cm，Z 为 8 cm。相同展开条件下，Z 相对更容易随流动相移动，因此选 Z。',
              '溶剂前沿距基线 10 cm，所以 Rf = 8 ÷ 10 = 0.80。分母不是斑点到前沿剩下的 2 cm，也不是另一个斑点的距离。',
              '这道题的单点判纯结论依赖“完全分离”的题设；一般实验的一次单点结果仍可能藏有重叠或未检出的成分。',
            ],
            optionNotes: [
              'A：0.50 不是符合全部条件的 Z 的距离比；应先筛候选，而非任意取图上比例。',
              'B：0.60 对应 W 的 Rf，但 W 比 Z 移动得少，不满足最强相对吸引的要求。',
              'C：0.67 与目标的 8/10 不符；不能用两个样品的斑点距离互相作分母。',
              'D：0.75 也不是从共同基线量得的 Z / 溶剂前沿比值。',
              'E：先选出 Z，再求 8/10，满足两个筛选条件。',
              'F：0.90 会被较高斑点吸引，但忽略其来自多组分样品，违反“只含一种物质”。',
            ],
            takeaway:
              '**先筛样品，再选斑点，最后求 Rf。**题干限制的顺序，比看到哪个斑点最高更重要。',
          },
        ],
        checklist: [
          '能区分一般实验与题设完全分离的前提。',
          '能先筛纯样品，再计算其 Rf。',
          '能解释二维展开为何能补充一次展开的证据。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-c8',
      title: 'UAT-UK · ESAT Chemistry C8',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: 'C8.1—C8.4：化合物中元素的化学提取、混合物物理分离、方法选择与色谱纯度。',
    },
    {
      id: 'openstax-change',
      title: 'OpenStax Chemistry 2e · Physical and Chemical Properties',
      url: 'https://openstax.org/books/chemistry-2e/pages/1-3-physical-and-chemical-properties',
      note: '区分物态等物理变化与产生不同物质的化学变化。',
    },
    {
      id: 'purdue-separation',
      title: 'Purdue University · Chemical Separations',
      url: 'https://chemed.chem.purdue.edu/genchem/topicreview/bp/ch15/separate.php',
      note: '以挥发性、溶解性与相对相亲和力理解蒸馏、结晶和色谱。',
    },
    {
      id: 'columbia-crystals',
      title: 'Columbia University · Recrystallization and Extraction',
      url: 'https://columbia.edu/cu/chemistry/ugrad/hssp/EXP_3.html',
      note: '核对不互溶液层、结晶后的分离、冷溶剂洗涤与干燥流程。',
    },
    {
      id: 'mcmaster-distillation',
      title: 'McMaster University · Distillation',
      url: 'https://chemistry.mcmaster.ca/~chem2o6/labmanual/expt3/exp3-int.html',
      note: '分馏提高分离程度；乙醇与水的恒沸限制意味着不能保证无水纯乙醇。',
    },
    {
      id: 'wisconsin-chromatography',
      title: 'University of Wisconsin–Madison · Interpreting the Chromatogram',
      url: 'https://www2.chem.wisc.edu/deptfiles/genchem/lab/labdocs/modules/paprchrom/paprchrominterp.htm',
      note: '同条件 Rf、斑点与纯度的证据边界，单点可能仍包含未分开的成分。',
    },
  ],
}
