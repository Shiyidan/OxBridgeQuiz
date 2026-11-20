// ESAT 第十七章空气与水：组成、环境作用与处理目的分别讲清，真题考法保留可核对来源。
import type { KnowledgeLesson } from './types'
import { airWaterMethods } from './airWaterMethods'

export const esatAirWater: KnowledgeLesson = {
  code: '141700',
  title: 'Air and water · 空气与水',
  subtitle: '空气先分清成分与作用，净水先分清去杂质与消毒',
  intro:
    '这一章常把日常情境接到化学计算：空气比例变成摩尔分数，分馏顺序取决于沸点，饮水消毒剂的投加量转成气体体积。把“有哪些物质”“它们做了什么”“实验要去除什么”分开，才能避免用一个环保名词解释所有现象。',
  memory: [
    '**干空气约78% N₂、21% O₂，Ar约0.9%，CO₂为微量。**水蒸气含量随条件变化。',
    '**分馏升温先收低沸点：N₂ → Ar → O₂。**先选目标成分，再比较沸点。',
    '**温室气体吸收地表发出的红外辐射。**CO₂、CH₄、H₂O是常见例子，N₂、O₂不是主要温室气体。',
    '**CO来自不完全燃烧；SO₂来自含硫燃料；NOₓ可来自高温下空气反应。**来源不同，处理也不同。',
    '**过滤主要去悬浮物，消毒控制微生物。**清澈、纯净、可饮用是三个不同判断。',
    '**氯用于消毒，适量氟离子用于帮助预防龋齿。**F⁻不是氟气F₂，也不是用来代替氯杀菌。',
  ],
  sections: [
    {
      code: '141701',
      title: '空气组成与分离',
      summary: airWaterMethods['141701']!.summary,
      paragraphs: [airWaterMethods['141701']!.intro],
      rules: airWaterMethods['141701']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: airWaterMethods['141701']!.memory,
      pitfalls: [
        '把摩尔比当质量比。',
        '把N₂的分子数再乘二后与Ar粒子数直接比较。',
        '负数沸点排序反向。',
        '忽略“最丰富”限定，把氢、氖也列进三个目标成分。',
      ],
      sourceIds: ['cambridge-environment'],
      visual: 'air-water',
      examFocus: {
        goal: '先筛出正确成分，再选择合适的比例或沸点处理。',
        pastPaperSummary:
          '当前相关年度题有两类：给沸点数据排液化空气分馏顺序，以及把粒子数、体积换成摩尔分数反推空气成分。',
        pastPaperPatterns: [
          {
            form: '给沸点表判断收集顺序',
            description:
              '先确认题目指定的氮、氧、氩，再按负数沸点排序；扩展表会加入氢和氖，必须结合含量筛选。',
            reference: '2018、2020 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q41', 'ESAT-2020-CHEMISTRY-002'],
          },
          {
            form: '粒子数和体积反推干空气组分',
            description:
              '分别求某气体占总物质的量的百分比，与约1%、78%、21%对应，并核对剩余气体摩尔数。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q052'],
          },
        ],
        examples: [
          {
            title: '同一份空气，为什么有的用粒子数、有的用体积？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q052',
              why: '题给两种不同数据单位，迫使先统一摩尔数，再认组成。',
            },
            question: '',
            answer: 'A · X为Ar，Y为N₂，其余5.250 mol。',
            steps: [
              'X含1.50×10²³个粒子，除以6.00×10²³得0.250 mol；占25.0 mol空气的1.00%，对应题目近似下的Ar。',
              'Y占468 dm³，除以24.0 dm³ mol⁻¹得19.5 mol；19.5÷25.0=78.0%，对应N₂。',
              '其余气体为25.0−0.250−19.5=5.250 mol，主要为O₂及其他微量气体。',
              '把三项同时对入选项A；0.250+19.5+5.250=25.0，闭合总量。',
            ],
            optionNotes: [
              'B、C、F：把约1%的X误认成约21%的氧。',
              'D：Y占78%，不是氧；剩余数值也错误。',
              'E：气体身份正确，但剩余摩尔数未按已算两项扣除。',
            ],
            takeaway: '==单位先统一，再与熟悉的空气比例对应==。',
          },
        ],
        checklist: [
          '能区分干空气与含水蒸气的空气。',
          '能用同温同压体积比识别主要组分。',
          '能解释分馏顺序而不是只背N₂、Ar、O₂。',
        ],
      },
    },
    {
      code: '141702',
      title: '温室气体',
      summary: airWaterMethods['141702']!.summary,
      paragraphs: [airWaterMethods['141702']!.intro],
      rules: airWaterMethods['141702']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: airWaterMethods['141702']!.memory,
      pitfalls: [
        '把温室效应解释为臭氧层破坏。',
        '因为N₂最多就把它当最主要温室气体。',
        '把CO与CO₂的主要危害混用。',
        '用两种气体的质量比直接充当温室效应比。',
      ],
      sourceIds: ['epa-greenhouse', 'aqa-atmosphere'],
      visual: 'air-water',
      examFocus: {
        goal: '能用红外辐射解释温室效应，并清楚区分现有题目只覆盖的计量部分。',
        pastPaperSummary:
          '在当前已收录年度化学题与独立题库中，未找到直接判断温室机制或不同温室气体效应强弱的题。相关年度题只涉及燃烧生成CO₂和水蒸气，下面归纳为关联迁移，不作为温室机制曾被直接考查的证据。',
        pastPaperPatterns: [
          {
            form: '关联迁移：燃烧后CO₂和水蒸气的量',
            description:
              '由烃燃烧方程求CO₂与H₂O，并按温度决定水是否计入气相。原题目标是总气体体积，而非解释温室效应。',
            reference: '2020 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-012'],
          },
        ],
        pastPaperNote:
          '本节例题与自测仅训练生成物及CO₂/CH₄的用量计算，不覆盖红外吸收或温室强度判断；机制与易错比较在概念讲解和图解中完成。',
        examples: [
          {
            title: '关联迁移：燃烧后产生多少CO₂与水蒸气？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'ESAT-2020-CHEMISTRY-012',
              why: '用真实燃烧计量巩固CO₂、H₂O来源；该题不直接检验温室效应机制。',
            },
            question: '',
            answer: 'D · 总气体体积1550 cm³。',
            steps: [
              '按完全燃烧写C₂H₆ + 3.5O₂ → 2CO₂ + 3H₂O；同温同压下体积比等于系数比。',
              '100 cm³乙烷消耗350 cm³氧气，生成200 cm³CO₂与300 cm³水蒸气。',
              '题目温度150 °C，水需计入气体；原有1400 cm³氧气还剩1050 cm³。',
              '总量=1050+200+300=1550 cm³。这里算的是气体体积，不能把这一数值解释为温室效应强度。',
            ],
            optionNotes: [
              'A（500）：只加生成物，遗漏过量氧气。',
              'B（1250）：错误地把150 °C下的水当成液体扣除。',
              'C、E、F：不满足配平方程与剩余氧气的气体体积账。',
            ],
            takeaway: '==先把生成量算对，再明确“气体量”并不是“气候效应”==。',
          },
        ],
        checklist: [
          '能用红外吸收和再发射描述机制。',
          '能分别说出CO₂、CH₄的主要来源。',
          '能解释为什么现有计量题不足以比较温室效应强弱。',
        ],
      },
    },
    {
      code: '141703',
      title: '气态污染物',
      summary: airWaterMethods['141703']!.summary,
      paragraphs: [airWaterMethods['141703']!.intro],
      rules: airWaterMethods['141703']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: airWaterMethods['141703']!.memory,
      pitfalls: [
        '把CO的毒性当成CO₂的主要气候作用。',
        '认为所有污染物都来自燃料中同名元素。',
        '认为增加氧气就能同时消除高温形成的所有NOₓ。',
        '把催化转化器当筛网，或把所有被约掉的物种都称为催化剂。',
      ],
      sourceIds: ['uat-c17', 'aqa-atmosphere', 'cambridge-environment'],
      visual: 'air-water',
      examFocus: {
        goal: '由反应和条件判断污染物如何产生、转化，避免只记环保标签。',
        pastPaperSummary:
          '相关年度题集中在NO/NO₂、SO₂/SO₃、CO/CO₂的反应计量、氧化态与能量；未找到直接比较污染物健康危害的年度题，不能把化学转化题算成危害知识直考。',
        pastPaperPatterns: [
          {
            form: '气态氧化物反应中的体积变化',
            description:
              '由CO氧化、NO氧化等反应的气体系数比较反应前后体积；SO₂/SO₃题还需扣除未反应组分。',
            reference: '2017、2018 NSAA',
            sourceCodes: ['NSAA_2017_S1-Q047', 'ESAT_LEGACY_2018_NSAA_Q45'],
          },
          {
            form: '含氮氧化物的配平与身份推断',
            description:
              '从氧化数、硝酸用量或气体体积反推NO/NO₂，不因出现硝酸就默认生成同一种气体。',
            reference: '2019、2022、2023 NSAA',
            sourceCodes: ['NSAA_2019_S1-Q048', 'ESAT_LEGACY_2022_NSAA_Q058', 'NSAA_2023_S1-Q053'],
          },
          {
            form: '反应进度与放热量相连',
            description: 'NO氧化为NO₂的放热题应按实际转化量计算，不能把起始氧气量全部视为已消耗。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q54'],
          },
        ],
        pastPaperNote:
          '上述是污染气体化学反应的综合应用。来源、毒性、酸雨与控制方法仍需掌握，但不据这些题宣称其已被直接考查。',
        examples: [
          {
            title: 'NO₂既是氧化剂，又能是催化剂吗？',
            source: {
              kind: 'bank',
              subject: 'chemistry',
              questionCode: 'CHEM-MOCK-ADAPT-E01-026-R8-FINAL-20260818',
              why: '原题给污染空气中的循环，适合把单步电子变化与整体去留分开。',
            },
            question: '',
            answer: 'A · 第一步是氧化剂，整体是催化剂。',
            steps: [
              '第一步NO₂ + CO → NO + CO₂中，N从+4降到+2，NO₂自身被还原，故为氧化剂。',
              '第二步2NO + O₂ → 2NO₂把NO₂再生。为了相加，把第一步乘2。',
              '两式相加后，NO₂与NO抵消，得到2CO + O₂ → 2CO₂；NO₂先被消耗后再生，是本循环的催化剂。',
              'NO先生成后消耗，是中间体。单步氧化剂与总体催化剂并不矛盾，选A。',
            ],
            optionNotes: [
              'B、E：把自身被还原的NO₂误叫还原剂。',
              'C：把先投入后再生的NO₂误认成先生成的中间体。',
              'D：忽略氮从+4变+2的电子变化。',
            ],
            takeaway: '==单步看电子，整条循环看去留==。',
          },
        ],
        checklist: [
          '能把CO、SO₂、NOₓ分别对应到来源与影响。',
          '能说明催化转化器的化学作用。',
          '能从给定循环区分催化剂、氧化剂与中间体。',
        ],
      },
    },
    {
      code: '141704',
      title: '饮用水处理',
      summary: airWaterMethods['141704']!.summary,
      paragraphs: [airWaterMethods['141704']!.intro],
      rules: airWaterMethods['141704']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: airWaterMethods['141704']!.memory,
      pitfalls: [
        '把清澈水当纯水或安全饮用水。',
        '把氟离子用于护齿的作用误写成杀菌，或把F⁻写成F₂。',
        '以为普通过滤能除去NaCl等全部溶解物。',
        '忘记mg到g需除1000。',
        '把Cl₂按Cl计算，得到两倍气体体积。',
      ],
      sourceIds: ['uat-c17', 'cdc-water', 'cambridge-environment'],
      visual: 'air-water',
      examFocus: {
        goal: '先理解工序的目的，再把真实投药条件转成单位清晰的计算。',
        pastPaperSummary:
          '当前收录的直接年度题以饮水氯化消毒为情境，计算每天所需氯气体积；没有找到直接比较整套净水流程的其他年度题。',
        pastPaperPatterns: [
          {
            form: '投药率接气体摩尔体积',
            description:
              '水量乘mg dm⁻³投药率后换算g，再按Cl₂求摩尔数与气体体积；主要陷阱是毫克单位和双原子分子。',
            reference: '2023 NSAA',
            sourceCodes: ['NSAA_2023_S1-Q051'],
          },
        ],
        pastPaperNote:
          '自测复盘同一道直接匹配真题，保留真实来源；不以普通浓度题替代饮用水工序考查。',
        examples: [
          {
            title: '每天处理的水很多，所需氯气体积怎么算？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'NSAA_2023_S1-Q051',
              why: '真实饮用水消毒情境，检验水量、药剂质量、气体体积三者能否分清。',
            },
            question: '',
            answer: 'C · 48 dm³。',
            steps: [
              '每天355000 dm³水，每dm³需0.4 mg氯气，总质量为142000 mg。',
              '142000 mg=142 g。氯气是Cl₂，摩尔质量=2×35.5=71 g mol⁻¹。',
              '氯气物质的量为142÷71=2.00 mol；按题给室温压强下24 dm³ mol⁻¹，体积为48 dm³。',
              '检查单位：水体积用于算药剂总质量，最终48 dm³才是氯气体积。',
            ],
            optionNotes: [
              'D（96）：用Cl的35.5替代Cl₂的71，导致体积加倍。',
              'A、B：把质量除摩尔质量关系颠倒。',
              'E、F：不能由给定投药率和单位转换得到，需重新检查质量账。',
            ],
            takeaway: '==水量 → 药剂质量 → 药剂摩尔数 → 气体体积==。',
          },
        ],
        checklist: [
          '能区分氯消毒与适量氟离子护齿的用途。',
          '能说明过滤、消毒、脱盐各自处理什么。',
          '能解释饮用水不等于纯水。',
          '能不漏单位地完成含氯消毒剂用量计算。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-c17',
      title: 'UAT-UK · ESAT Content Specification — C17',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '逐项核对空气组成、CO₂/CH₄、CO/CO₂/SO₂/NOₓ，以及氯和氟离子在饮用水中的不同用途。',
    },
    {
      id: 'cambridge-environment',
      title: 'Cambridge IGCSE Chemistry 0620 · Chemistry of the environment',
      url: 'https://www.cambridgeinternational.org/Images/697205-2026-2028-syllabus.pdf',
      note: '核对空气组成、分离、环境气体与水处理的基础边界。',
    },
    {
      id: 'epa-greenhouse',
      title: 'US EPA · Overview of Greenhouse Gases',
      url: 'https://www.epa.gov/ghgemissions/overview-greenhouse-gases',
      note: '核对温室气体来源，以及浓度、寿命、吸收能力与时间尺度。',
    },
    {
      id: 'aqa-atmosphere',
      title: 'AQA GCSE Chemistry · Chemistry of the atmosphere',
      url: 'https://www.aqa.org.uk/subjects/chemistry/gcse/chemistry-8462/specification/subject-content/chemistry-of-the-atmosphere',
      note: '核对温室效应、燃烧污染物来源与主要环境影响。',
    },
    {
      id: 'cdc-water',
      title: 'CDC · How Water Treatment Works',
      url: 'https://www.cdc.gov/drinking-water/about/how-water-treatment-works.html',
      note: '核对混凝、絮凝、沉降、过滤、消毒及不同水源处理差异。',
    },
  ],
}
