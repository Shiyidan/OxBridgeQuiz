// ESAT 植物生理讲义：联系光合作用、叶片结构与运输，用原创例题练习条件分析和速率计算。
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'

type PlantSection = Omit<KnowledgeSection, 'example' | 'visual' | 'sourceIds' | 'examFocus'> & {
  examFocus: KnowledgeExamFocus
}

// 同一章沿用植物图谱与资料范围，摘要例题取自已经完整讲解的第一题。
function plantSection(section: PlantSection): KnowledgeSection {
  const first = section.examFocus.examples[0]!
  return {
    ...section,
    visual: 'plant-physiology',
    sourceIds: ['uat-spec-b11', 'openstax-photosynthesis', 'openstax-plant-transport'],
    example: { question: first.question, steps: first.steps, answer: first.answer },
  }
}

export const esatPlantPhysiology: KnowledgeLesson = {
  code: '151100',
  title: 'Plant physiology · 植物生理',
  subtitle: '叶片怎样制造有机物，水与糖又怎样到达需要它们的地方',
  intro:
    '一片叶子要制造糖，既需要光和二氧化碳，也离不开根送来的水。气孔让二氧化碳进入，却同时给水蒸气提供了离开的通道。本章把这几件事连起来：先理解光合作用的原料与限制因素，再沿着根、茎和叶认识两套运输组织。例题会练习看实验条件、区分总量与净量，以及把气泡的移动换算成吸水速率。',
  memory: [
    '**光合作用吸收光能，制造有机物；呼吸作用释放有机物中的可用能量**。有光时，绿色植物也仍进行呼吸。',
    '增加某个条件后速率不再上升，说明**这个条件已不再单独限制速率**；不能仅凭平台就指定另一个限制因素。',
    '木质部主要运水和无机盐，韧皮部运蔗糖等有机物。==蒸腾是失去水蒸气，转运是有机物从源运到库==。',
    '**水通过渗透进入根毛；在忽略电势差、只考虑浓度差的模型中，逆浓度梯度吸收矿物离子需要主动运输**。根毛增大吸收面积，但不会把渗透变成主动运输。',
    '风速、湿度、温度和光照通过蒸发、扩散与气孔状态共同影响失水。**缺水导致气孔关闭时，不能沿用“越热越快”的简单推断**。',
    '速率 = 体积 ÷ 时间；毛细管中的体积 = 横截面积 × 距离。==吸水计直接测吸水，稳态下才可近似反映蒸腾==。',
  ],
  sections: [
    plantSection({
      code: '151101',
      title: '光合作用',
      summary: '掌握原料、产物、能量变化与限制因素，并理解光合作用和呼吸共同造成的净气体交换。',
      paragraphs: [
        '光合作用 photosynthesis 把二氧化碳和水转变为有机物，并释放氧。叶绿素吸收的光能为这个过程提供能量，因此它是**需要吸收能量的过程**。植物长出的干物质，并不是单靠从土壤吸收矿物质堆起来的：有机物中的碳主要来自二氧化碳。',
        '“光越强，长得越快”只说对了一部分。当光不足时，加光可能有用；光已经充足后，再加光未必更快，因为二氧化碳供应或温度可能成了限制。理解限制因素，就是理解**一个过程同时需要几个条件，单独改善其中一个不保证整体继续加快**。',
      ],
      rules: [
        {
          title: '原料、产物与能量',
          text: '总体文字式是：**二氧化碳 + 水 → 葡萄糖 + 氧**，条件是光和叶绿素。简化配平式为 $6CO_2+6H_2O\\rightarrow C_6H_{12}O_6+6O_2$。光提供能量，叶绿素吸收光；它们不是按化学计量消耗的原料。吸能不表示植物必须处在很高温度。',
        },
        {
          title: '叶片结构怎样帮助光合作用',
          text: '宽展的叶片有利于受光；叶肉细胞中的叶绿体吸收光能。叶片较薄，内部气腔与气孔让二氧化碳较容易扩散到叶肉细胞。叶脉中的木质部供应水，韧皮部输出可溶性糖。**叶片的受光、气体交换与运输结构一起工作**，不是只有叶绿体重要。',
        },
        {
          title: '葡萄糖的用途',
          text: '光合作用形成的糖可用于呼吸，转成淀粉储存，合成纤维素构建细胞壁，或转成蔗糖运输。植物还需要从土壤获得矿物离子，例如含氮离子可用于制造氨基酸，再合成蛋白质。**矿物离子提供必要元素，但不替代光合作用制造有机物**。',
        },
        {
          title: '光照强度怎样限制速率',
          text: '光较弱、其他条件足够时，增加光照通常提高光合作用速率。进入平台后，继续加光不再带来明显提升，表明光已不再单独限制速率。==平台不等于光合作用停止，也不能仅凭平台确定到底缺二氧化碳还是温度不合适==。',
        },
        {
          title: '二氧化碳浓度怎样限制速率',
          text: '二氧化碳是原料。光和温度适宜、二氧化碳不足时，提高其浓度可使光合作用加快；浓度继续提高也可能进入平台。若提高二氧化碳后同样光照下速率上升，这才是二氧化碳曾限制速率的实验依据。',
        },
        {
          title: '温度的作用有适宜范围',
          text: '光合作用涉及酶控制的反应。温度低时反应较慢；在适宜范围内升温可提高速率，但如果光已经不足，升温效果可能很小。超过适宜范围后，酶活性降低、严重时变性，加上缺水引起的气孔关闭，都可能降低速率。**不是温度越高越好**。',
        },
        {
          title: '总光合作用与净气体交换',
          text: '植物细胞昼夜都可能进行呼吸，光合作用则需要光。在其他条件满足时，**净放氧速率 = 光合作用产氧速率 − 呼吸耗氧速率**。没有净气体交换时，两者可能恰好相等；不能据此说两个过程都停止。用黑暗中的呼吸量校正光照数据时，题目须允许呼吸速率保持相同。',
        },
        {
          title: '测量结果各有适用条件',
          text: '水草放氧体积可用于比较净产氧速率；只数气泡时，还要考虑气泡大小是否一致和部分氧溶于水。淀粉检测反映一段时间内的积累，不能直接给出瞬时速率。改变光源距离时也要控制水温，避免把灯的加热效果混入光照效果。',
        },
      ],
      pitfalls: [
        '光合产氧与叶片净放氧并非同一个量；白天也有呼吸耗氧。',
        '平台只能说明增加横轴因素不再有效，不能自动证明光合作用已经达到所有条件下的最高速率。',
        '光提供能量，二氧化碳提供有机物中的碳；不能把植物增加的干物质都归给土壤。',
      ],
      check: {
        question: '一片健康叶在适当光照下没有净二氧化碳交换。已知它的呼吸没有停止。哪项解释正确？',
        options: [
          '光合作用和呼吸都停止了。',
          '只有呼吸在进行。',
          '光合作用吸收的二氧化碳与呼吸释放的二氧化碳相等。',
          '叶片无法通过气孔交换任何气体。',
        ],
        answerIndex: 2,
        explanation:
          '选 C。**没有净交换，只表示两个方向的量相抵**。呼吸仍释放二氧化碳，因此光合作用也必须吸收等量二氧化碳，才符合题目。这个结论不是说叶片不再制造或消耗有机物。',
      },
      examFocus: {
        goal: '把光合作用记成一套有原料、能量来源和适宜条件的反应，再看数据究竟测的是光合总量，还是扣除呼吸后的净量。',
        comparison: {
          title: '改变条件后，什么结论才有依据？',
          columns: ['观察到的变化', '可以支持的解释', '不能直接推出'],
          rows: [
            ['只提高光照，速率上升', '原光照条件限制了速率', '以后一直加光都会有效'],
            ['只提高二氧化碳，速率上升', '原二氧化碳供应限制了速率', '光与温度完全不重要'],
            ['光照升高，速率平台不变', '光不再单独限制速率', '光合作用停止了'],
            ['没有净放氧，呼吸仍进行', '产氧与耗氧可能相等', '光合作用一定为零'],
          ],
        },
        examples: [
          {
            title: '怎样从实验变化判断限制因素？',
            question:
              'A plant is kept at a constant temperature. Increasing light intensity from 50 to 100 units does not change its photosynthetic rate of 8 units. At 100 light units, doubling the carbon dioxide concentration increases the rate to 12 units. All other conditions are unchanged. Which conclusion is supported?',
            options: [
              'Photosynthesis stops at 100 light units.',
              'Carbon dioxide availability limited the rate before its concentration was doubled.',
              'Temperature is proved to be the only limiting factor.',
              'Further increases in light must always increase the rate.',
            ],
            answer: 'B：提高二氧化碳后速率上升，说明此前二氧化碳供应限制了速率。',
            steps: [
              '先比较只改变光照的那一对结果：50 到 100，速率仍为 8，所以这次加光没有解除真正的限制。',
              '再比较固定在 100 光照单位时的结果：只提高二氧化碳，速率从 8 上升到 12，说明此前二氧化碳确实不足以支持更高速率。',
              '实验没有改变温度，不能证明温度是唯一限制。速率为 8 也不是停止，A 把“平台”误读成了“零”。',
            ],
            optionNotes: [
              'A：平台仍有正的速率，不是停止。',
              'B：有只改变二氧化碳的对照结果支持。',
              'C：没有温度对照，更不能说它是唯一因素。',
              'D：题目已经给出一次加光无效的结果，always 不成立。',
            ],
            takeaway:
              '**判断限制因素，要找“只改变这个条件，速率就上升”的证据**。只看到一段平台，还不能确定由哪一个其他条件限制。',
            variant: {
              question:
                'At the same temperature, increasing light from 50 to 100 units now raises the rate from 8 to 16 units. Doubling carbon dioxide at 100 light units causes no further increase. Which change has demonstrated a limiting factor?',
              answer: '增加光照的实验表明原先较低光照限制了速率。',
              explanation:
                '光照改变带来速率变化，而本次加二氧化碳无效。只能说二氧化碳在这次条件下不是可由该改变解除的限制，不能说植物从不受二氧化碳限制。',
            },
          },
          {
            title: '看到放氧量，先确认是不是净量',
            question:
              'In darkness, a leaf consumes 2 cm³ of oxygen per hour. In light, it releases a net 7 cm³ of oxygen per hour. Assume the rate of respiration is unchanged and all gas exchange is measured. What is the oxygen production rate due to photosynthesis in the light?',
            options: ['5 cm³ per hour', '7 cm³ per hour', '9 cm³ per hour', '14 cm³ per hour'],
            answer: 'C：9 cm³ h⁻¹。',
            steps: [
              '黑暗中没有光合作用，耗氧 2 cm³ h⁻¹ 代表呼吸耗氧；题目明确允许把这一速率用于光照条件。',
              '光照时，仪器看到的是生产后又被呼吸消耗一部分的净剩余：净放氧 = 光合产氧 − 呼吸耗氧。',
              '因此光合产氧 = 7 + 2 = 9 cm³ h⁻¹。别再减一次，否则把呼吸的影响扣了两遍。',
            ],
            optionNotes: [
              'A：7 − 2，把已经扣过的呼吸再次扣除。',
              'B：直接把净放氧当成了总产氧。',
              'C：把被呼吸消耗的 2 加回，正确。',
              'D：没有“乘 2”的依据，呼吸量是 2 而非净量的一半。',
            ],
            takeaway:
              '遇到 net，先写一句关系：**净量 = 产生量 − 消耗量**。如果呼吸会随光照条件改变，就不能无条件照搬黑暗测量值。',
            variant: {
              question:
                'With respiration still consuming 2 cm³ of oxygen per hour, the light is reduced until there is no net oxygen exchange. What is the photosynthetic oxygen production rate?',
              answer: '2 cm³ h⁻¹。',
              explanation:
                '净量为零，说明光合产氧恰好补上呼吸耗氧：0 + 2 = 2。没有净交换不表示两个过程停止。',
            },
          },
        ],
        checklist: [
          '我能说清光合作用的原料、产物和光的作用。',
          '我能用条件改变前后的数据判断限制，而不是仅凭平台猜测。',
          '我会区分总产氧、呼吸耗氧与净放氧，并检查校正时的假设。',
        ],
      },
    }),
    plantSection({
      code: '151102',
      title: '植物运输系统',
      summary:
        '理解根毛、木质部、韧皮部和气孔各自的工作，把蒸腾与有机物转运区分开，并正确计算吸水速率。',
      paragraphs: [
        '根吸收的水要送到叶片，叶片制造的糖也要送到根和生长中的组织。植物因此需要两类主要运输组织：**木质部 xylem 运水和矿物离子，韧皮部 phloem 运蔗糖等有机物**。它们紧挨着出现在叶脉和茎中，却承担不同工作，细胞结构也不同。',
        '水从根到叶的运动，还与叶片不断向空气失去水有关。把整条路连起来看会更容易记住：土壤中的水进入根，沿木质部到达叶肉，在细胞壁湿润表面蒸发，再以水蒸气经气孔扩散出去。根毛、导管和气孔的变化，都会影响这条运输路径。',
      ],
      rules: [
        {
          title: '根毛怎样吸收水和离子',
          text: '根毛是根表皮细胞的延伸，增加与土壤接触的面积；薄的细胞壁缩短物质进入的路径。**当土壤水势高于根毛时，水经选择透过膜渗透进入**。矿物离子可通过膜运输蛋白吸收；在忽略膜两侧电势差、只考虑浓度差的模型中，逆浓度梯度吸收需要主动运输及呼吸提供的能量。真实离子的移动还受电势差影响。渗透专指水，不是矿物离子的运输方式。',
        },
        {
          title: '木质部为何适合运水',
          text: '成熟木质部导管由死细胞连接形成，失去大部分端壁和细胞内容物，构成低阻力的连续管道；**木质化的厚壁支撑管道，帮助防止在拉力下塌陷**。壁上的纹孔允许侧向流动。导管主要把水和溶解的矿物离子从根送往茎、叶，不靠导管细胞自身消耗 ATP 把水逐级泵上去。',
        },
        {
          title: '韧皮部为何需要活细胞',
          text: '韧皮部筛管分子是活细胞，端壁形成有孔的筛板，供汁液通过。成熟筛管分子通常没有细胞核，依靠相邻伴胞支持代谢；伴胞有细胞核和较多线粒体。**“没有细胞核”不等于“已经死亡”**，更不能据此把筛管判为木质部导管。',
        },
        {
          title: '转运从源到库，不固定只向下',
          text: 'translocation 指蔗糖等有机物在韧皮部的运输。制造或释放糖的部位是源 source，使用或储存糖的部位是库 sink，例如成熟叶到根、生长的芽或果实。储藏器官在萌发时也能变成源。不同筛管可向不同方向运输；==方向由当时的源和库决定，不是永远由上往下==。',
        },
        {
          title: '蒸腾怎样带动水柱',
          text: 'transpiration 是植物以水蒸气形式失水，通常主要发生在叶片。水先从叶肉细胞壁表面蒸发到气腔，再经气孔扩散到外界。蒸发形成的拉力与水分子间的内聚作用使木质部水柱被向上拉动，根部再补水。**液态水沿导管流动，与水蒸气穿过气孔，是不同阶段**。',
        },
        {
          title: '保卫细胞调节气孔',
          text: '气孔是两个保卫细胞之间的孔隙。保卫细胞的离子与水分变化改变膨压；典型情况下吸水、膨压增大使孔隙张开，失水、膨压减小使其关闭。气孔开放有利于二氧化碳进入，也增加水蒸气流失。**干旱时关闭气孔可节水，却可能限制光合作用**。',
        },
        {
          title: '风速与湿度影响水蒸气扩散',
          text: '周围湿度较高时，叶内与外界的水蒸气浓度差减小，通常使蒸腾减慢；空气流动带走叶表潮湿空气，通常使蒸腾加快。这些判断需要其他条件相近，且未因严重失水而改变气孔状态。**风带走的是叶表水蒸气，不是直接把根里的水吹上来**。',
        },
        {
          title: '光与温度的影响要看气孔状态',
          text: '对许多常见陆生植物，光照使气孔较开放，蒸腾通常增加；温度适度升高可促进蒸发和扩散。但缺水或极端高温可能使气孔关闭，蒸腾反而受限。比较时要看题目是否说明水分充足、气孔保持开放，不能把正常范围内的趋势无限外推。',
        },
        {
          title: '速率与毛细管换算',
          text: '蒸腾的体积速率 = **失水体积 ÷ 时间**。吸水计中气泡移动可用来推算吸水量：$V=A\\times d$，其中 A 是毛细管内横截面积，d 是气泡移动距离，再算 $V/t$。只有距离却不知道管内面积时，不能算体积速率；单位必须配套，例如 mm² × mm = mm³。',
        },
        {
          title: '吸水计到底测到了什么',
          text: '吸水计 potometer 直接测的是枝条吸水量。**植物含水量基本稳定、其他用水变化很小时，吸水速率可近似反映蒸腾速率**；用于生长、光合作用或补充原有缺水的水会让两者不同。实验需装置气密、避免导管进气、留出适应时间，并控制叶面积等条件。',
        },
      ],
      pitfalls: [
        '木质部导管是死细胞形成的管道；筛管是活细胞，不能用是否有细胞核作为唯一判断。',
        '蒸腾与转运英文相近，但前者是水蒸气流失，后者主要指韧皮部有机物运输。',
        '毛细管气泡移动 10 mm 不等于吸水 10 mm³；还缺横截面积。',
        '风和升温通常促进蒸腾，需要水分与气孔条件支持，不是无条件规律。',
      ],
      check: {
        question:
          '本题忽略膜两侧电势差。土壤中某矿物离子的浓度低于根毛细胞内，而土壤水势高于根毛细胞。植物继续净吸收该离子和水。哪组解释正确？',
        options: [
          '离子通过渗透，水通过主动运输。',
          '离子通过主动运输，水通过渗透。',
          '离子和水都只能通过主动运输。',
          '离子和水都通过渗透。',
        ],
        answerIndex: 1,
        explanation:
          '选 B。本题忽略电势差，离子由较低浓度向较高浓度净移动，需要主动运输；水则由较高水势经选择透过膜向较低水势净移动，是渗透。**不要把矿物离子的浓度差与水的水势差混为一个判断**。',
      },
      examFocus: {
        goal: '先记清“运什么、由什么细胞组成、靠什么条件移动”，再把这些知识应用到截断组织、改变环境和吸水计实验中。',
        comparison: {
          title: '两类运输组织，三件事一起记',
          columns: ['比较项目', '木质部导管', '韧皮部筛管与伴胞'],
          rows: [
            ['主要运输物', '水和溶解的矿物离子', '蔗糖等可溶性有机物'],
            ['运输细胞状态', '导管成熟时已死亡，内腔通畅', '筛管与伴胞存活，伴胞支持代谢'],
            ['结构适应', '木质化管壁支撑，端壁减少阻力', '筛板有孔，伴胞有较多线粒体'],
            ['主要方向', '从根到茎、叶', '从源到库，可向上也可向下'],
            ['相关过程', '蒸腾流', '转运；装载等过程涉及能量供应'],
          ],
        },
        examples: [
          {
            title: '切断韧皮部后，先看哪条运输路受阻',
            question:
              'A narrow ring of bark containing all the phloem is removed from a young tree stem. The xylem remains intact. During the short observation period, mature leaves above the ring are photosynthesising and roots below it depend on sugars from those leaves. Which immediate effect is expected?',
            options: [
              'Water flow to the leaves must stop because the xylem has been removed.',
              'Sugar transport from the leaves to the roots is interrupted at the ring.',
              'The roots begin absorbing glucose from the soil by osmosis.',
              'The remaining xylem takes over phloem transport of sucrose.',
            ],
            answer: 'B：从叶片经韧皮部到根的糖运输在环剥处受阻。',
            steps: [
              '先分清切掉的是什么：题目说所有韧皮部被切断，但木质部完整。不能把两套运输组织一起判为失效。',
              '叶片是糖的源，根在本题中是依赖叶片供糖的库。源到库的韧皮部通路被切断，因此糖不能继续沿原路线穿过环剥处。',
              '短时间内木质部仍能运水，不意味着树长期不受影响；如果根长期缺糖，其呼吸和吸水等活动也可能受损，但那不是题目问的立即效果。',
            ],
            optionNotes: [
              'A：与“木质部完整”矛盾。',
              'B：准确对应受损组织及运输物。',
              'C：渗透是水的运输，不能让葡萄糖按该方式进入。',
              'D：两类组织不能直接互相替代。',
            ],
            takeaway:
              '**先把受损结构与它承担的运输联系起来，再区分直接影响和长期连锁影响**。题目的时间范围也是条件。',
            variant: {
              question:
                'A mature leaf supplies sucrose to a growing shoot above it through living sieve tubes. Which tissue carries this sucrose, and in which direction?',
              answer: '韧皮部，由下方的成熟叶向上方的生长芽运输。',
              explanation:
                '成熟叶制造糖，是源；上方的生长芽使用糖，是库。活的筛管属于韧皮部。方向与“成熟叶给下方根供糖”的例子相反，但从源到库的原则不变。',
            },
          },
          {
            title: '气泡移动怎样变成吸水速率？',
            question:
              'A bubble moves 24 mm along a potometer capillary in 3 minutes. The internal cross-sectional area of the capillary is 0.5 mm². The apparatus is airtight. What is the measured water uptake rate?',
            options: [
              '4 mm³ per minute',
              '8 mm³ per minute',
              '12 mm³ per minute',
              '16 mm³ per minute',
            ],
            answer: 'A：4 mm³ min⁻¹。',
            steps: [
              '气泡走过的距离只给出一段管子的长度。先乘管内横截面积，才能得到被吸走的水体积。',
              '体积 = 0.5 × 24 = 12 mm³；再除以 3 分钟，得到 4 mm³ min⁻¹。',
              '这里直接测的是吸水速率。若要用它估计蒸腾，还要满足植物含水量近似稳定等条件，不能只看到气密就认定二者严格相等。',
            ],
            optionNotes: [
              'A：先算体积再除时间，单位也一致。',
              'B：24 ÷ 3 = 8 是距离速率，单位应是 mm min⁻¹。',
              'C：12 是总吸水体积，遗漏了除以时间。',
              'D：把横截面积当除数，与体积公式不符。',
            ],
            takeaway:
              '**距离 × 面积 = 体积，体积 ÷ 时间 = 速率**。最后再用单位检查：长度速率与体积速率不是同一个量。',
            variant: {
              question:
                'The capillary is replaced with one of internal cross-sectional area 1.0 mm². Water uptake is unchanged. How far will the bubble move in 3 minutes?',
              answer: '12 mm。',
              explanation:
                '3 分钟仍吸收 12 mm³，距离 = 12 ÷ 1.0 = 12 mm。截面积加倍，同样体积只需移动一半距离；不能把移动较慢直接判断为吸水较少。',
            },
          },
        ],
        checklist: [
          '我能分别说出水与矿物离子进入根毛的机制。',
          '我能用结构解释木质部与韧皮部的工作，并判断源到库的方向。',
          '我能说明气孔开放同时影响二氧化碳进入和水蒸气流出。',
          '我会计算体积速率，也知道吸水计测量与蒸腾之间的近似条件。',
        ],
      },
    }),
  ],
  sources: [
    {
      id: 'uat-spec-b11',
      title: 'UAT-UK · ESAT Content Specification (2026/27), B11',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '用于核对 B11.1 与 B11.2 范围；中文知识总结、英文例题与图解均为原创。',
    },
    {
      id: 'openstax-photosynthesis',
      title: 'OpenStax Biology 2e · Overview of Photosynthesis',
      url: 'https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis',
      note: '用于事实核对叶片、叶绿体与能量转换；未复制教材图文。',
    },
    {
      id: 'openstax-plant-transport',
      title: 'OpenStax Biology 2e · Transport of Water and Solutes in Plants',
      url: 'https://openstax.org/books/biology-2e/pages/30-5-transport-of-water-and-solutes-in-plants',
      note: '用于核对水势、蒸腾流和源库运输；采用限定条件明确的原创讲解与图示。',
    },
  ],
}
