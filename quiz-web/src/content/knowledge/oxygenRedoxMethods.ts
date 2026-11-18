// 得失氧视角的氧化还原讲义：简写定义，强调观察对象与适用边界。
import type { KnowledgeMethodArticle } from './types'

interface OxygenRedoxMethodLesson extends KnowledgeMethodArticle {
  summary: string
  memory: string[]
}

export const oxygenRedoxMethods: OxygenRedoxMethodLesson = {
  summary: '简单氧转移中，得氧是氧化、失氧是还原；先指定物质，再判断变化。',
  intro:
    '从氧的得失看，氧化是物质与氧结合，还原是从氧化物中除去氧。这个判法适合简单氧转移，不是所有反应的通用判据。',
  blocks: [
    {
      title: '沿氧的转移，分别判断两种反应物',
      formula: '$\\mathrm{CuO+CO\\xrightarrow{\\text{加热}}Cu+CO_2}$',
      paragraphs: [
        '氧从 CuO 转到 CO：同一次反应里，CuO 失氧，CO 得氧。**先看题目指定的是哪一种物质**，不能把整条方程笼统称为“只有氧化”或“只有还原”。',
      ],
      table: {
        caption: 'CO 本来就含氧，仍可继续得氧；氧也不必由 O₂ 直接提供。',
        columns: ['跟踪的变化', '氧的得失', '判断'],
        rows: [
          ['CuO → Cu', '氧化铜中的氧被除去', 'CuO 被还原'],
          ['CO → CO₂', '一氧化碳取得氧', 'CO 被氧化'],
        ],
      },
      note: '“被氧化”说自身变化，“氧化剂”说对别人的作用：本反应中 CO 自己被氧化，却使 CuO 还原，所以 CO 是还原剂；CuO 则是氧化剂。',
    },
    {
      title: '化学式少了氧，不一定就是还原',
      formula: '$\\mathrm{CuO+2HCl\\rightarrow CuCl_2+H_2O}$',
      paragraphs: [
        '氧化铜与盐酸反应时，CuO 的氧进入水，但铜仍以 +2 价存在于 CuCl₂ 中，**并没有还原成铜单质**。这是酸与金属氧化物的反应，不能因为铜的产物式中不再写 O，就判为还原。',
        '遇到盐、酸或含氧基团之间的转化，不要只比较两个式子里的 O 个数；要进一步检查电子得失或同一元素的氧化态。反过来，没有氧参与，也可能发生氧化还原。',
      ],
    },
  ],
  memory: [
    '**简单氧转移：得氧被氧化，失氧被还原；先指定观察的物质。**',
    'CO 可以从金属氧化物中取氧，不必出现 O₂；仅仅少了氧或换了含氧基团，不能直接判还原。',
  ],
}
