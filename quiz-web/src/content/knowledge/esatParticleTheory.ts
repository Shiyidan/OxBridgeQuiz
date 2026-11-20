// ESAT 第十五章粒子理论讲义：把可见物态、粒子运动与能量曲线连接到真实题目。
import type { KnowledgeLesson } from './types'
import { particleMethods } from './particleMethods'

export const esatParticleTheory: KnowledgeLesson = {
  code: '141500',
  title: 'Kinetic/Particle theory · 动力学与粒子理论',
  subtitle: '用间距解释体积，用运动解释流动，用能量解释物态变化',
  intro:
    '看到固体、液体、气体，不只背三个名称：先问粒子怎样排列，再问粒子如何运动，最后判断能量改变了什么。固体里的粒子并不静止；水沸腾也不是把水分子拆成氢和氧。这两条边界能排除大量看似合理的干扰项。',
  memory: [
    '**固体振动，液体滑动，气体自由移动。**“固定位置”不等于“完全不动”。',
    '**气体容易压缩，因为粒子间空隙大。**压缩主要减小间距，不是把粒子压小。',
    '**同一物态升温，平均动能增大；纯物质定压相变，温度可保持不变。**',
    '**熔化、汽化、升华吸热；凝固、液化、凝华放热。**箭头反向，能量方向也反向。',
    '**纯液体不等于水溶液。**物态、粒子种类、可移动电荷要分别检查。',
  ],
  sections: [
    {
      code: '141501',
      title: '物态中的粒子',
      summary: particleMethods['141501']!.summary,
      paragraphs: [particleMethods['141501']!.intro],
      rules: particleMethods['141501']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: particleMethods['141501']!.memory,
      pitfalls: [
        '认为固体粒子完全静止。',
        '把气体受压解释为每个分子变小。',
        '认为所有液体都因粒子能流动而导电。',
        '把熔融与溶解当成同一过程，把中性分子自动画成离子。',
      ],
      sourceIds: ['uat-c15', 'purdue-states', 'openstax-phases'],
      visual: 'particle-theory',
      examFocus: {
        goal: '从物态证据回到粒子模型，再检查是否存在可移动电荷。',
        pastPaperSummary:
          '当前收录的相关年度题把物态与结构、导电性或高温气体计量结合；没有找到单独要求选择三态运动图或扩散快慢的化学真题。',
        pastPaperPatterns: [
          {
            form: '熔沸点与不同状态导电性联合判断',
            description:
              '读取低熔沸点，区分纯物质与水溶液；不能凭“溶液导电”反推纯物质一定是离子晶体。',
            reference: '2022 NSAA',
            sourceCodes: ['ESAT_LEGACY_2022_NSAA_Q043'],
          },
          {
            form: '按测量条件决定哪些产物仍是气体',
            description:
              '高温下生成的水以蒸气计入体积；先判物态，再处理气体比例与剩余反应物。这是物态判断的综合应用。',
            reference: '2020、2021 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-012', 'ESAT_LEGACY_2021_NSAA_Q056'],
          },
        ],
        examples: [
          {
            title: '液体不导电，水溶液却导电，矛盾吗？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q043',
              why: '原表同时提供固、液及水溶液信息，适合检查物态与粒子种类是否混用。',
            },
            question: '',
            answer: 'C · hydrogen chloride，HCl。',
            steps: [
              '先读熔点 −114 °C、沸点 −85 °C：两者都很低，提示小分子物质；常温高于沸点，因此其纯物质在常温是气体。',
              '纯固体和纯液体都不良导电，说明没有可自由迁移的电荷载体。排除 NH₄Cl、BaCl₂、KCl 等离子晶体。',
              'HCl 溶于水形成 H₃O⁺（常简写 H⁺）与 Cl⁻，离子可移动，所以水溶液导电；CCl₄ 不会这样形成导电的水溶液。',
              '三组观察同时支持 HCl，选 C。不是“液体一律导电”，而是入水后粒子种类改变。',
            ],
            optionNotes: [
              'A、B、D：离子晶体不符合题给的低熔沸点与纯液态不良导电信息。',
              'C：纯态分子与水溶液中离子两种模型分别吻合。',
              'E：不能满足水溶液良好导电这一必要条件。',
            ],
            takeaway: '==先读状态，再认粒子，最后查可移动电荷==。',
          },
        ],
        checklist: [
          '能用排列、间距和运动解释形状与可压缩性。',
          '能区分熔融、溶解和电离。',
          '能解释纯液体不导电而水溶液导电为何不矛盾。',
        ],
      },
    },
    {
      code: '141502',
      title: '状态变化与能量',
      summary: particleMethods['141502']!.summary,
      paragraphs: [particleMethods['141502']!.intro],
      rules: particleMethods['141502']!.blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      memory: particleMethods['141502']!.memory,
      pitfalls: [
        '把平台解释成没有吸热。',
        '把沸腾的气泡看成氢气与氧气。',
        '把蒸发限定在沸点。',
        '冷却后仍把凝结水按气体计入体积。',
      ],
      sourceIds: ['uat-c15', 'openstax-transitions', 'openstax-phases'],
      visual: 'particle-theory',
      examFocus: {
        goal: '在每个过程写清楚“什么变了、什么没变、能量去哪里”。',
        pastPaperSummary:
          '相关年度题主要用沸点解释、液化空气分馏与高温产物物态考查相变；当前题源没有直接考加热曲线平台的化学题。',
        pastPaperPatterns: [
          {
            form: '解释沸点而不拆开分子',
            description:
              '比较氯化物或卤素沸点，把分子间作用与分子内共价键分开。物态变化没有自动改变分子身份。',
            reference: '2018 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q46', 'ESAT_LEGACY_2018_NSAA_Q48'],
          },
          {
            form: '液化后按沸点分离',
            description: '按升温时各成分汽化的先后排序；负数越小沸点越低，不按含量或熔点替代沸点。',
            reference: '2018、2020 NSAA',
            sourceCodes: ['ESAT_LEGACY_2018_NSAA_Q41', 'ESAT-2020-CHEMISTRY-002'],
          },
          {
            form: '高温水蒸气必须进入气体总量',
            description:
              '燃烧或氨氧化后的气体计量中，先依温度判断水是否为气体，再加上剩余的反应物。',
            reference: '2020、2021 NSAA',
            sourceCodes: ['ESAT-2020-CHEMISTRY-012', 'ESAT_LEGACY_2021_NSAA_Q056'],
          },
        ],
        examples: [
          {
            title: '沸点更高，是因为要断更多共价键吗？',
            source: {
              kind: 'annual',
              subject: 'chemistry',
              questionCode: 'ESAT_LEGACY_2018_NSAA_Q46',
              why: '三个陈述专门区分分子内键与分子间作用，直接检验相变能量去向。',
            },
            question: '',
            answer: 'C · 只有陈述 2 正确。',
            steps: [
              '题目比较液态 PCl₃ 与 PCl₅ 的沸点，过程是液体变气体，不是分解反应。',
              '沸腾时分子彼此分离，通常保留各自内部的 P—Cl 共价键。因此“PCl₅ 共价键更多，所以要断更多键”不是正确解释，陈述 1 错。',
              '更高沸点意味着需更多能量克服分子间作用；题给 PCl₅ 的分子间作用更强这一解释成立，陈述 2 对。',
              '陈述 3 仍用分子内键强弱解释沸腾，混淆层次，也错。只有 2 正确，选 C。',
            ],
            optionNotes: [
              'A：漏掉正确的分子间作用解释。',
              'B、D、F：只保留分子内键的错误理由。',
              'E、G、H：虽含陈述 2，但混入了陈述 1 或 3。',
            ],
            takeaway: '==先辨相变还是化学反应，再决定讨论哪一层作用力==。',
          },
        ],
        checklist: [
          '能从加热曲线区分升温与相变。',
          '能给六种物态变化标出吸热或放热。',
          '能解释冷却后气体体积减少，但原子总数不变。',
        ],
      },
    },
  ],
  sources: [
    {
      id: 'uat-c15',
      title: 'UAT-UK · ESAT Content Specification C15',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '逐项核对三态排列、运动与物态变化时的能量、结构和相互作用。',
    },
    {
      id: 'purdue-states',
      title: 'Purdue University · States of Matter',
      url: 'https://www.chem.purdue.edu/gchelp/atoms/states.html',
      note: '核对三态粒子排列、运动和宏观性质。',
    },
    {
      id: 'openstax-phases',
      title: 'OpenStax Chemistry 2e · Phases and Classification of Matter',
      url: 'https://openstax.org/books/chemistry-2e/pages/1-2-phases-and-classification-of-matter',
      note: '核对三态、物质分类与物理变化边界。',
    },
    {
      id: 'openstax-transitions',
      title: 'OpenStax Chemistry 2e · Phase Transitions',
      url: 'https://openstax.org/books/chemistry-2e/pages/10-3-phase-transitions',
      note: '核对相变能量、蒸发、沸腾与加热曲线平台。',
    },
  ],
}
