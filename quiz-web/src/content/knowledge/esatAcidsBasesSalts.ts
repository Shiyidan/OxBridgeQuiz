// ESAT 第九章酸碱盐讲义：区分酸的强弱、碱的溶解性与中和计量，衔接真实题源练习。
import type { KnowledgeLesson } from './types'

export const esatAcidsBasesSalts: KnowledgeLesson = {
  code: '140900',
  title: 'Acids, bases and salts · 酸、碱和盐',
  subtitle: '强弱看电离，浓稀看用量，中和先数可交换的氢离子',
  intro:
    '把酸碱题拆成三个问题：溶液中现在有什么粒子？每摩尔能中和多少？实验到底测速度、总量还是剩余量？这样可以同时处理性质判断、盐的制备和滴定计算。',
  memory: [
    '**强酸不等于浓酸，弱酸不等于不能反应。**强弱是电离程度，浓度是单位体积所含酸的量。',
    '**碱能接受 H⁺；可溶于水并形成碱性溶液的碱叫 alkali。**不溶性金属氧化物也可以中和酸。',
    '**先配平，再用 n = cV。**H₂SO₄ 完全中和需 2 份 OH⁻，H₃PO₄ 完全中和需 3 份。',
    '**回滴先减后除，取样先算局部再放大。**温度或气体测量不能自动证明酸的强弱。',
  ],
  sections: [
    {
      code: '140901',
      title: '酸',
      summary: '把电离程度、溶液浓度和可中和的总量分开，性质判断就不会互相打架。',
      paragraphs: [
        '酸在水中增加 H⁺（更准确地说是 H₃O⁺）的浓度，也可用**提供质子**理解。盐酸、硫酸和乙酸都能表现酸性；乙酸虽然弱，仍能使蓝色石蕊变红，与碳酸盐放出 CO₂，并被碱完全中和。',
        '**strong / weak 描述电离程度，concentrated / dilute 描述浓度。**相同分析浓度的一元酸中，强酸通常具有更高的 H⁺ 浓度、更低的 pH、更强的导电性，并与相同表面积的活泼金属反应更快。但相同体积、浓度的一元酸完全中和所需的碱相同，因为弱酸会随 H⁺ 被消耗继续电离。',
        '常见反应分三组记：稀酸 + 活泼金属 → 盐 + H₂；酸 + 金属氧化物或氢氧化物 → 盐 + 水；酸 + 碳酸盐 → 盐 + 水 + CO₂。盐的阴离子来自酸：盐酸形成氯化物，硫酸形成硫酸盐，硝酸形成硝酸盐。硝酸与金属常涉及氧化还原，不能机械套“酸加金属必出氢气”。',
        'pH 不是“酸分子个数”的直接读数，而与 H⁺ 活度有关；本阶段按浓度近似理解。室温下 pH 小于 7 为酸性。观察到气泡只能证明发生了放气反应；没有反应速度、浓度与对照条件，不能由“镁会冒泡”判为强酸。多元酸能逐步失去多个质子，也不代表每一步都完全电离。',
        'pH 每降低 1，H⁺ 浓度增为原来的 10 倍；降低 2 则增为 100 倍，而不是 2 倍。mono-/di-/tri-/polyprotic 分别表示一元、二元、三元和多元：HCl 是一元酸，H₂SO₄ 完全中和按二元酸计，H₃PO₄ 按三元酸计。CH₃COOH 只有羧基的一个 H 是本章通常计入的酸性质子。',
        '一些非金属氧化物与水反应形成酸性溶液，例如 CO₂ 与水建立形成碳酸的平衡，SO₃ 与水生成 H₂SO₄。不能把“非金属氧化物”全部当成会与水成酸：CO 不符合这个常用规律。',
      ],
      rules: [
        {
          title: '比较强弱必须控制条件',
          text: '在相同浓度、温度和酸的元数下比较 pH、导电性或相同金属的反应速率。仅比较耗碱总量，通常是在测酸的总量。',
        },
        {
          title: '酸的元数来自中和比例',
          text: '完全中和时，$z n(\\mathrm{acid})=n(\\mathrm{OH^-})$。z 是每个酸分子可提供的酸性质子数，不能把化学式中的所有 H 都算进去。',
        },
        {
          title: '碳酸盐的共同行为',
          text: '$\\mathrm{CO_3^{2-}+2H^+\\rightarrow CO_2+H_2O}$。每摩尔碳酸根消耗 2 mol H⁺，生成 1 mol CO₂。',
        },
        {
          title: '酸性和氧化性分开',
          text: 'Cu 与稀盐酸一般不放氢；Cu 与浓硝酸可反应并生成氮氧化物。先看指定试剂和条件，再使用反应规律。',
        },
      ],
      pitfalls: [
        '用“弱”推断乙酸不能中和或不能与碳酸盐反应。',
        '把相同酸浓度当成相同 H⁺ 浓度。',
        '由完全中和所需体积或单纯冒泡断言酸强弱。',
      ],
      sourceIds: ['openstax-acids', 'openstax-reactions'],
      visual: 'acids-bases-salts',
      examFocus: {
        goal: '看清实验测的是电离程度还是总酸量，并从证据判断能推导到哪一步。',
        pastPaperSummary:
          '相关真题反复把强弱、元数和中和总量放在一起；也将酸的典型反应接到盐质量、纯度与鉴别上。要先分组解释每条实验结果。',
        pastPaperPatterns: [
          {
            form: '强弱与共同酸性分开判断',
            description:
              '对比强、弱一元酸的导电性、与镁反应速度、石蕊和碳酸盐现象；完全中和的耗碱量不能单独区分酸强弱。',
            reference: '2016、2017、2023 NSAA',
            sourceCodes: ['NSAA_2016_S1-Q049', 'NSAA_2017_S1-Q039', 'NSAA_2023_S1-Q054'],
          },
          {
            form: '多元酸、逐步电离与质子转移',
            description:
              '结合磷酸的分步电离、草酸的二元性或实验中和比例，判断供受质子能力与每摩尔耗碱量；弱酸仍按完全中和计量。',
            reference: '2020、2021、2023 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-013',
              'ESAT_LEGACY_2021_NSAA_Q053',
              'NSAA_2023_S1-Q054',
            ],
          },
          {
            form: '典型反应连接气体和盐的计量',
            description:
              '由碳酸盐放气求纯度，或先排除不与稀酸反应的金属，再比较盐量。硝酸与铜的题目需另外结合氧化还原与守恒，不能沿用放氢模板。',
            reference: '2016—2019、2021—2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q050',
              'NSAA_2017_S1-Q053',
              'ESAT_LEGACY_2018_NSAA_Q52',
              'NSAA_2019_S1-Q051',
              'ESAT_LEGACY_2021_NSAA_Q047',
              'ESAT_LEGACY_2022_NSAA_Q056',
              'NSAA_2023_S1-Q053',
            ],
          },
        ],
        examples: [
          {
            title: '哪些实验真正区分强酸与弱酸？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2016_S1-Q049',
              why: '同一道真题将速度、耗碱量和导电性并列，直接拆开三个常见混淆。',
            },
            question: '',
            answer: 'F · 只有 1 和 3。',
            steps: [
              '两酸都是一元酸，浓度同为 1 mol/dm³；比较的是强弱，不是酸的浓稀或元数。',
              '强酸的 H⁺ 浓度更高，相同镁条在相同条件下反应更快，实验 1 可以区分。',
              '20 cm³ 的两种酸均含 0.020 mol 可中和的一元酸，均需 20 cm³ 的 1 mol/dm³ NaOH；实验 2 不能区分。',
              '强酸电离程度更大，可移动离子更多，导电性较强，实验 3 可以区分。因此选 1 和 3。',
            ],
            takeaway: '==速度和导电性看溶液中的离子；完全中和看总量。==',
          },
        ],
        checklist: [
          '能说明强酸与浓酸的区别。',
          '能写出酸与金属、碱及碳酸盐的常见产物。',
          '能指出哪些观察不足以判断酸强弱。',
        ],
      },
    },
    {
      code: '140902',
      title: '碱',
      summary: '先辨能否接受 H⁺，再辨是否溶于水；碱性不要求化学式一定含 OH。',
      paragraphs: [
        '本章的 base 指能与酸反应、接受质子的物质；alkali 是可溶于水并产生碱性溶液的碱。NaOH、KOH 属于 alkalis；CuO 是不溶性碱性氧化物，可以中和酸，但不是可溶性碱。**“不溶”不等于“不能与酸反应”。**',
        '氨的化学式没有 OH，却能与水反应建立 $\\mathrm{NH_3+H_2O\\rightleftharpoons NH_4^++OH^-}$，使溶液呈碱性。氨是弱碱；不能因它不完全电离，就在完全中和时少算一部分氨。',
        '常见金属氧化物可以体现碱性，如 CaO 与酸生成钙盐和水。Al₂O₃、ZnO 是两性氧化物，能与酸或强碱反应；所以“金属氧化物全部只显碱性”不是可靠规则。判定氧化物的酸碱性，要用反应性质，而不是只看元素名称。',
        '做混合物分离题时，先根据溶解性确定滤液里有什么，再决定中和对象。NaOH 溶于水，Mg(OH)₂ 溶解度很小；若题目明确按完全不溶处理，过滤后耗酸量对应 NaOH，不能把两种碱的总质量直接代入同一个摩尔质量。',
        '碱也要分清强弱与浓稀：NaOH 在水中溶解的部分充分解离，氨与水仅部分反应生成 OH⁻；前者为强碱，后者为弱碱。浓度则描述每单位体积含多少溶质，因此可以有稀的强碱和浓的弱碱。CaO 与水生成 Ca(OH)₂，后者溶解的部分使水呈碱性；CuO 则不因为是碱性氧化物，就必然与水反应或形成可溶性碱。',
      ],
      rules: [
        {
          title: '碱性氧化物与酸',
          text: '$\\mathrm{CaO+2HCl\\rightarrow CaCl_2+H_2O}$。氧化物里的 O²⁻ 接受两个 H⁺ 形成水。',
        },
        {
          title: '每个化学式单位的 OH⁻ 数量',
          text: '1 mol NaOH 提供 1 mol OH⁻；1 mol Ca(OH)₂ 完全反应对应 2 mol OH⁻。浓度相同不代表中和能力相同。',
        },
        {
          title: '氨接受质子',
          text: '$\\mathrm{NH_3+H^+\\rightarrow NH_4^+}$，1 mol NH₃ 中和 1 mol H⁺；氨不是靠金属离子与酸反应。',
        },
        {
          title: '碱性溶液的观察',
          text: '室温下通常 pH > 7，使红色石蕊变蓝。指示剂用于判断范围，不能直接给出所有溶液的精确浓度。',
        },
      ],
      pitfalls: [
        '把 base 和 alkali 完全等同。',
        '因为 NH₃ 不含 OH 就否认氨水碱性。',
        '忽略 Ca(OH)₂ 每摩尔含两个 OH⁻，或把不溶物算进滤液。',
      ],
      sourceIds: ['openstax-acids', 'openstax-reactions'],
      visual: 'acids-bases-salts',
      examFocus: {
        goal: '由物质类型确定反应角色，再用溶解性和离子数量解释实验。',
        pastPaperSummary:
          '真题常把碱性氧化物与周期表、成键联考；氢氧化物则与过滤、酸碱余量和量热结合，不能只背碱的名称。',
        pastPaperPatterns: [
          {
            form: '元素位置 → 氧化物 → 酸碱性',
            description:
              '由原子序数或族位置写离子电荷及氧化物式，并判断是否与酸反应；同一选项还可能要求区分离子键与共价键。',
            reference: '2017、2023 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q042', 'NSAA_2023_S1-Q052'],
          },
          {
            form: '溶解性决定中和对象',
            description:
              '过滤混合氢氧化物后仅对滤液滴定，用酸量反推可溶性碱，再由总质量求不溶成分。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-011'],
          },
          {
            form: 'OH⁻ 数量与氨的受质子能力',
            description:
              '多元酸与氢氧化钙按当量配比；混合后先求过量 OH⁻；氨与盐酸量热先判断限制试剂。',
            reference: '2020、2022 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-013',
              'ESAT_LEGACY_2022_NSAA_Q048',
              'ESAT_LEGACY_2022_NSAA_Q057',
            ],
          },
        ],
        examples: [
          {
            title: '从原子序数推到氧化物的碱性',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2017_S1-Q042',
              why: '把元素定位、化学式和酸碱性三个判断串起来。',
            },
            question: '',
            answer: 'C · XO，离子键，碱性。',
            steps: [
              '原子序数 20 对应 Ca，通常形成 Ca²⁺。',
              '氧离子为 O²⁻，正负电荷 1:1 抵消，所以简单氧化物为 CaO，即 XO。',
              'CaO 是离子晶体，不能因为只含两个元素就判作简单分子。',
              'CaO 与酸生成钙盐和水，表现碱性。因此三个条件同时对应 C。',
            ],
            takeaway: '==电荷决定式，结构决定键型，反应决定酸碱性。==',
          },
        ],
        checklist: [
          '能区分碱与可溶性碱。',
          '能解释氨水为什么有碱性。',
          '能根据过滤结果正确确定耗酸的成分。',
        ],
      },
    },
    {
      code: '140903',
      title: '中和',
      summary: '把体积换成摩尔数，按质子与 OH⁻ 配对，再处理剩余、稀释和盐的制备。',
      paragraphs: [
        '强酸与强碱的净离子反应是 $\\mathrm{H^++OH^-\\rightarrow H_2O}$。旁观离子组合形成盐。若是弱酸 HA，则净离子式应保留 HA：$\\mathrm{HA+OH^-\\rightarrow A^-+H_2O}$，不能把未完全电离的弱酸全部拆成自由离子。',
        '中和计算先写完整配平式，再用 n = cV，V 换成 dm³。用酸和碱的分子浓度直接写 c₁V₁ = c₂V₂ 只适用于 1:1 比例；H₂SO₄、H₃PO₄ 和 Ca(OH)₂ 都需要额外考虑系数。反应恰好完全不意味着所有盐溶液的 pH 都为 7，盐的组成也会影响酸碱性。',
        '回滴有三个量：加入的酸、剩下的酸、被原样品消耗的酸。先由滴定碱量求剩余酸，再作差，最后按原反应的系数求样品。若滴定的是稀释液的一小份，先求这一份中的物质的量，再按总体积与取样体积之比放大。',
        '制备可溶性盐时，不溶性碱可加至过量以确保酸用尽，再过滤除去剩余固体、适当蒸发、冷却结晶。酸与可溶性碱则可用滴定确定比例，再按相同体积重做而不加指示剂。不要把制得晶体必须“蒸干”当作通用步骤，也不能靠过滤除去溶解的过量 NaOH。',
      ],
      rules: [
        {
          title: '统一为可中和的量',
          text: '完全反应时，酸可提供的 H⁺ 摩尔数 = 碱可接受的 H⁺ 摩尔数。二元酸与 NaOH 完全中和时的物质的量比为 1:2。',
        },
        {
          title: '回滴顺序',
          text: '酸的已反应量 = 加入量 − 由回滴测得的剩余量，再除以反应方程中的酸系数。',
        },
        {
          title: '混合后的 pH',
          text: '先按化学计量抵消 H⁺ 与 OH⁻，再以混合后的总体积求剩余浓度；不能平均两瓶溶液的 pH。',
        },
        {
          title: '量热与滴定的交点',
          text: '温度最高处通常接近酸碱恰好反应的位置；之后加入过量液体可使温度下降，并不表示逆向中和正在大量发生。',
        },
      ],
      pitfalls: [
        '所有酸碱组合都直接套 c₁V₁ = c₂V₂。',
        '回滴把剩余酸当成样品消耗的酸。',
        '把“中和完全”“pH = 7”和“所有离子消失”视为同一件事。',
      ],
      sourceIds: ['openstax-acids', 'openstax-reactions'],
      visual: 'acids-bases-salts',
      examFocus: {
        goal: '用反应比例搭好计量骨架，再接稀释、取样或回滴。',
        pastPaperSummary:
          '中和的历年题型覆盖直接滴定、多元酸、先稀释后取样、过量酸回滴，以及混合后余量和量热。统一的第一步都是把 cV 转为反应的摩尔数。',
        pastPaperPatterns: [
          {
            form: '直接滴定与多元酸系数',
            description:
              '从体积浓度推另一试剂浓度、质量浓度或酸的元数，重点排除忽略二元、三元酸系数的答案。',
            reference: '2016、2017、2020、2021、2023 NSAA',
            sourceCodes: [
              'NSAA_2016_S1-Q052',
              'NSAA_2017_S1-Q039',
              'ESAT-2020-CHEMISTRY-013',
              'ESAT_LEGACY_2021_NSAA_Q053',
              'NSAA_2023_S1-Q054',
            ],
          },
          {
            form: '稀释取样与回滴',
            description:
              '由小份滴定数据还原整瓶酸量、原液浓度或样品纯度；过量酸法必须先减去回滴测得的剩余量。',
            reference: '2018—2020、2022 NSAA',
            sourceCodes: [
              'ESAT_LEGACY_2018_NSAA_Q52',
              'NSAA_2019_S1-Q052',
              'ESAT-2020-CHEMISTRY-019',
              'ESAT_LEGACY_2022_NSAA_Q056',
            ],
          },
          {
            form: '余量、分离与温度数据',
            description: '混合强酸强碱后求剩余离子，或由温度峰值、限制试剂及过滤结果求反应量。',
            reference: '2020—2022 NSAA',
            sourceCodes: [
              'ESAT-2020-CHEMISTRY-011',
              'ESAT-2020-CHEMISTRY-017',
              'ESAT_LEGACY_2021_NSAA_Q045',
              'ESAT_LEGACY_2022_NSAA_Q048',
              'ESAT_LEGACY_2022_NSAA_Q057',
            ],
          },
        ],
        examples: [
          {
            title: '弱二元酸完全中和，体积怎么算？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q053',
              why: '用草酸练习“弱”不改完全中和比例这一高频陷阱。',
            },
            question: '',
            answer: 'A · 10.0 cm³。',
            steps: [
              'NaOH 的量为 2.00 × 25.0/1000 = 0.0500 mol。',
              '草酸是二元酸，每摩尔完全中和 2 mol NaOH，所以所需酸为 0.0250 mol。',
              '酸浓度为 2.50 mol/dm³，体积为 0.0250/2.50 = 0.0100 dm³。',
              '换算为 10.0 cm³，选 A。弱酸会随 H⁺ 被消耗继续电离，不额外乘“电离百分比”。',
            ],
            takeaway: '==弱看平衡，几元看计量；完全中和先看系数。==',
          },
        ],
        checklist: [
          '能处理中和的非 1:1 比例。',
          '能解释回滴为什么先减后除。',
          '能根据试剂溶解性选择盐的制备方法。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-acids',
      title: 'UAT-UK · ESAT Content Specification — C9',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '逐项核对酸与碱定义、强弱浓稀、氧化物与水、pH 十倍关系、多元酸及中和。',
    },
    {
      id: 'openstax-acids',
      title: 'OpenStax · Brønsted–Lowry acids and bases',
      url: 'https://openstax.org/books/chemistry-2e/pages/14-1-bronsted-lowry-acids-and-bases',
      note: '核对质子供受体定义与氨的碱性；题目归纳来自本地已发布年度 Question。',
    },
    {
      id: 'openstax-reactions',
      title: 'OpenStax · Classifying chemical reactions',
      url: 'https://openstax.org/books/chemistry-2e/pages/4-2-classifying-chemical-reactions',
      note: '核对酸碱反应及净离子式；计算步骤按精选原题独立复核。',
    },
  ],
}
