// ESAT 动物生理学讲义：把器官功能、调节和防御串起来，并用诊断真题与原创变式练习解释和计算。
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'
import { animalPhysiologyMethods } from './animalPhysiologyMethods'

type PhysiologyDraft = Omit<KnowledgeSection, 'example' | 'sourceIds' | 'visual' | 'examFocus'> & {
  examFocus: KnowledgeExamFocus
}

// 每个知识点共用本章图谱和资料范围，兼容摘要例题与完整备考例题两种展示入口。
function physiologySection(section: PhysiologyDraft): KnowledgeSection {
  const first = section.examFocus.examples[0]!
  return {
    ...section,
    visual: 'animal-physiology',
    sourceIds: ['uat-spec-b9', 'uat-guide-b9', 'openstax-physiology'],
    example: { question: first.question, steps: first.steps, answer: first.answer },
  }
}

export const esatAnimalPhysiology: KnowledgeLesson = {
  code: '150900',
  title: 'Animal physiology · 动物生理学',
  subtitle: '从细胞供能，到器官合作、内环境调节与身体防御',
  intro:
    '沿物质与信号的通路理解细胞供能、器官协作、内环境调节和身体防御；结合结构、方向与受控比较，判断图表和实验能够支持什么结论。',
  memory: [
    '**通气让空气进出肺，气体交换让气体越过交换表面，细胞呼吸在细胞内供能**。三件事相互配合，不能混为一个过程。',
    '动脉从心脏流出，静脉流回心脏；==名称由血流方向决定，不由含氧量决定==。',
    '肾小球滤过产生滤液，肾小管和集合管继续调整其成分；**滤液不是最终尿液**。',
    '负反馈让偏离正常范围的量回到原来的方向。血糖高时胰岛素作用加强，缺水时 ADH 作用通常加强。',
    'FSH 帮助卵泡发育，LH 峰触发排卵，雌激素促进子宫内膜增厚，孕激素帮助维持内膜。',
    '**抗体识别抗原，记忆细胞帮助再次应答**。疫苗、抗生素和直接给予抗体的作用不能互换。',
  ],
  sections: [
    physiologySection({
      code: '150901',
      title: '呼吸作用',
      summary: animalPhysiologyMethods['150901'].summary,
      paragraphs: [animalPhysiologyMethods['150901'].intro],
      memory: animalPhysiologyMethods['150901'].memory,
      rules: animalPhysiologyMethods['150901'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '“不消耗氧”不能推出“不产生 ATP”。',
        '动物无氧呼吸产生乳酸盐，不能套用酵母产生乙醇和二氧化碳的式子。',
        '有氧呼吸通常有较高的每葡萄糖 ATP 产量，但样品总耗氧量还受细胞数量影响。',
      ],
      check: {
        question: '某动物肌肉短时间内氧供应不足，但仍在收缩。下列解释最合理的是哪项？',
        options: [
          '肌肉必须停止所有 ATP 生成。',
          '肌肉可在细胞质中通过无氧过程获得少量 ATP。',
          '肌肉用无氧呼吸把葡萄糖完全分解为二氧化碳和水。',
          '肌肉中的叶绿体开始供能。',
        ],
        answerIndex: 1,
        explanation:
          '选 B。**氧不足时，无氧过程仍能提供少量 ATP**。A 把有氧受限夸大为所有供能停止；C 描述的是有氧呼吸的总体产物；动物肌肉细胞没有 D 所说的叶绿体。仍在收缩也不等于可以一直维持原来的运动强度。',
      },
      examFocus: {
        goal: '先记清两种呼吸的原料、产物和供能差别，再把它们与肌肉收缩、通气和血液运输联系起来。**细胞需要的是持续补充 ATP，肺与心脏帮助供应所需物质**。',
        comparison: {
          title: '有氧与动物无氧呼吸',
          columns: ['比较项目', '有氧呼吸', '动物无氧呼吸'],
          rows: [
            ['氧', '需要', '不需要'],
            ['葡萄糖分解', '较完全，生成二氧化碳和水', '不完全，生成乳酸盐'],
            ['每葡萄糖 ATP 产量', '较高', '较低'],
            ['主要位置', '涉及细胞质和线粒体', '细胞质'],
            ['关系', '氧供应允许时持续参与供能', '氧供应不足时可增加，同时仍可有有氧供能'],
          ],
        },
        examples: [
          {
            title: '运动时，两种呼吸都增强意味着什么？',
            source: {
              questionCode: 'ESAT_LEGACY_2021_NSAA_Q068',
              why: '把跑步前后的呼吸数据与 pH、酶和气体运输放在一起，练习用数据解释身体的变化。',
            },
            question: '',
            answer: 'G：只有陈述 2 和 3 正确。',
            steps: [
              '先读表：有氧呼吸从 1.01 增至 5.77，无氧呼吸从 0.01 增至 3.67。**两者同时增强**，所以不能看见“无氧增加”就以为有氧已经停止。',
              '陈述 1 把方向写反了。剧烈运动时肌肉内酸化的趋势是 pH 降低，不是升高；不能因为“pH 会影响酶活性位点”这半句话熟悉，就接受整个陈述。这里也不需要把所有酸化机制都归结为乳酸这一种物质。',
              '陈述 2 说 may，即“可能有一部分原因”。运动产热使肌肉温度适度升高，在没有使酶变性的范围内，可以加快酶促反应。这是合理的贡献因素，不能夸大成表格已经证明唯一原因就是温度。',
              '陈述 3 正确：有氧呼吸增强，会产生更多二氧化碳，需要运走。动物的无氧过程不产生二氧化碳，但这并不抵消同时增强的有氧过程。因此选 2 和 3，即 G。',
            ],
            optionNotes: [
              'A（全不正确）：漏掉合理的温度影响和二氧化碳清除需求。',
              'B（仅 1）：接受了 pH 上升的错误方向，且漏掉 2、3。',
              'C（仅 2）：温度判断正确，但漏掉有氧呼吸增强所增加的二氧化碳。',
              'D（仅 3）：二氧化碳判断正确，但漏掉陈述 2 中合理的“可能”。',
              'E（1 和 2）：误选 1，也漏掉正确的 3。',
              'F（1 和 3）：误选 1，也漏掉正确的 2。',
              'G（2 和 3）：既考虑了适度升温，也考虑了有氧呼吸的产物。',
              'H（1、2、3）：没有检查陈述 1 中 pH 变化的方向。',
            ],
            takeaway:
              '看生理数据时，先确认**哪些过程同时在发生**，再分别看它们的产物和影响。题目说“可能”，只需判断机制是否合理；不等于已经证明因果。',
            variant: {
              question:
                'During a new exercise period, a muscle has a constant rate of aerobic respiration but an increased rate of anaerobic respiration. Does the increased anaerobic rate alone show that the muscle produces more carbon dioxide?',
              answer: '不能。',
              explanation:
                '动物肌肉的无氧过程产生乳酸盐，不直接产生二氧化碳。现在有氧呼吸速率保持不变，不能沿用原题“有氧增强，所以二氧化碳增加”的推理。**先找出变了哪一种呼吸，再判断其产物**。',
            },
          },
          {
            title: '同一张曲线，既要读代谢也要读单位',
            source: {
              questionCode: 'NSAA_2023_S1-Q072',
              why: '用酵母的特殊情境练习尊重题干条件，同时把曲线上的浓度转换成样品实际消耗的质量。',
            },
            question: '',
            answer: 'A：只有陈述 1、2、3 正确；前 10 小时平均消耗葡萄糖 0.4 g h⁻¹。',
            steps: [
              '先圈出题干特别告诉你的条件：这里的酵母即使有足够氧，也先用葡萄糖进行无氧呼吸；葡萄糖耗尽后，才在有氧条件下使用乙醇。**不能拿“有氧就一定只做有氧呼吸”覆盖题设**。',
              '读图时，葡萄糖和乙醇用左侧的 g dm⁻³，酵母浓度用右侧的任意单位。葡萄糖约在 10 h 耗尽，观察到 32 h，因此只用乙醇的时段为 32 − 10 = 22 h，陈述 2 正确。',
              '酵母把葡萄糖转成乙醇的无氧过程会放出二氧化碳；随后乙醇的有氧氧化也会放出二氧化碳，所以陈述 1 正确。起始已有葡萄糖，按题设从一开始就进行无氧呼吸，陈述 3 也正确。注意这与动物肌肉产生乳酸盐不同。',
              '最后查陈述 4 的单位：初始葡萄糖浓度为 40 g dm⁻³，体积 100 cm³ = 0.100 dm³，因此总共只有 40 × 0.100 = 4 g。用 10 小时消耗完，平均速率为 4 ÷ 10 = 0.4 g h⁻¹，不是 4 g h⁻¹。',
            ],
            optionNotes: [
              'A（1、2、3）：三条都符合题设和图像，排除了计算错误的 4。',
              'B（1、2、4）：漏掉题设明确支持的 3，并接受错误速率 4。',
              'C（1、3、4）：漏算 10–32 h 的 22 小时，并接受错误速率 4。',
              'D（2、3、4）：漏掉两种途径都产生二氧化碳，还把浓度变化当成质量速率。',
              'E（1、2、3、4）：前三条正确，但第 4 条少乘了样品体积 0.100 dm³。',
            ],
            takeaway:
              '==质量消耗速率 = 浓度下降量 × 体积 ÷ 时间==。先确认曲线对应哪一侧坐标，再计算；还要分清酵母和动物的无氧产物。',
            variant: {
              question:
                'In a separate flask of constant volume 250 cm³, glucose concentration falls from 40 g dm⁻³ to 8 g dm⁻³ over 10 hours. What is the average mass of glucose used per hour?',
              answer: '0.8 g h⁻¹。',
              explanation:
                '浓度下降为 40 − 8 = 32 g dm⁻³，体积为 0.250 dm³。总消耗量 32 × 0.250 = 8 g，再除以 10 h，得到 0.8 g h⁻¹。这里葡萄糖没有耗尽，不能直接把初始浓度全部算作消耗。',
            },
          },
        ],
        checklist: [
          '是否把通气、气体交换和细胞呼吸分开了？',
          '产物是否符合动物细胞，而不是酵母？',
          '数据比较时，质量和时间是否都一致或已校正？',
        ],
      },
    }),
    physiologySection({
      code: '150902',
      title: '器官系统',
      summary: animalPhysiologyMethods['150902'].summary,
      paragraphs: [animalPhysiologyMethods['150902'].intro],
      memory: animalPhysiologyMethods['150902'].memory,
      rules: animalPhysiologyMethods['150902'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '静脉不一定缺氧，动脉不一定富氧。',
        '肺泡的气体交换与胸廓的通气不是同一个动作。',
        '小肠吸收与细胞利用葡萄糖不同；胆汁乳化不等于酶促水解。',
        '肾小球滤液含葡萄糖不等于正常最终尿液应含大量葡萄糖。',
      ],
      check: {
        question:
          '正常肾单位中，血浆里的小分子葡萄糖可进入初始滤液，但最终尿液中通常几乎没有。最合理的解释是什么？',
        options: [
          '葡萄糖先被滤过，再主要在近曲小管被重吸收回血液。',
          '肾小球把全部葡萄糖变成尿素。',
          '膀胱把葡萄糖全送回肝脏。',
          '血细胞和葡萄糖都必须完整进入最终尿液。',
        ],
        answerIndex: 0,
        explanation:
          '选 A。把路线分为**先滤过，后重吸收**就能解释这个变化。B 把尿素形成的位置与原料混淆了；C 给膀胱添加了它没有的主要功能；D 忽略了正常滤过屏障对血细胞的保留，以及小管对葡萄糖的回收。',
      },
      examFocus: {
        goal: '每个系统都先弄清“从哪里来、经过哪里、到哪里去”。再看沿途发生了什么交换或变化，**用结构解释功能，而不是只记器官名称**。',
        comparison: {
          title: '五个系统怎样分工',
          columns: ['系统', '主要任务', '常混淆的两件事'],
          rows: [
            ['神经', '检测刺激并快速协调反应', '感觉神经元传入；运动神经元传出'],
            ['呼吸', '通气与肺泡气体交换', '气体进入肺；气体进入血液'],
            ['循环', '在交换面和组织之间运输', '血流方向；血液含氧量'],
            ['消化', '分解食物并吸收小分子', '消化；吸收'],
            ['排泄', '清除代谢废物并调整水盐', '滤过；选择性重吸收'],
          ],
        },
        examples: [
          {
            title: '看血液进出前后的变化，认出器官',
            source: {
              questionCode: 'ESAT-2020-BIOLOGY-008',
              why: '把小肠吸收、肾脏排泄和心腔输送放入同一张数据表，练习从物质变化理解器官分工。',
            },
            question: '',
            answer: 'F：器官 1 是右侧心腔，器官 2 是肾，器官 3 是小肠。',
            steps: [
              '先把题设留在眼前：这是进食富含碳水化合物的食物后 10 分钟。每一行要比较同一种物质“进入”与“离开”的浓度，别横着把不同物质的数值相减。',
              '器官 3 的葡萄糖从 9.0 升到 12.0 mg dm⁻³，正符合餐后小肠吸收葡萄糖进入血液；氧从 85 降到 70，并不矛盾，因为小肠组织本身也在呼吸。',
              '器官 2 的尿素从 3.0 降到 2.4 mg dm⁻³，说明有尿素从血液中被移走，符合肾脏的排泄功能。它的氧也下降，提醒我们**肾脏是活组织，处理滤液同样需要能量**。',
              '器官 1 的三项浓度均不变，符合血液通过右侧心腔被输送出去。这里比较的是心腔内流过的血液，不是供应心肌的冠状动脉与冠状静脉；不能据此说心肌不消耗氧。按 1、2、3 的顺序选 F。',
            ],
            optionNotes: [
              'A（肾、小肠、右心腔）：尿素减少的是 2，葡萄糖升高的是 3，三个位置都不对应。',
              'B（肾、右心腔、小肠）：3 正确，但肾应是尿素下降的 2，而不是 1。',
              'C（小肠、肾、右心腔）：2 正确，但餐后葡萄糖升高的 3 才是小肠。',
              'D（小肠、右心腔、肾）：把葡萄糖升高与尿素下降两条关键线索都配错了。',
              'E（右心腔、小肠、肾）：1 正确，但 2、3 的排泄和吸收作用颠倒。',
              'F（右心腔、肾、小肠）：依次符合成分不变、尿素下降、餐后葡萄糖上升。',
            ],
            takeaway:
              '认器官先找**最能区分功能的那一项变化**：餐后葡萄糖进入血液指向小肠，尿素离开血液指向肾。多个器官都会耗氧，单靠氧下降通常分不清。',
            variant: {
              question:
                'In a separate experiment, blood enters an organ with a urea concentration of 3.0 mg dm⁻³ and leaves at 2.1 mg dm⁻³. If blood volume does not change across the organ, what percentage of the incoming urea is removed?',
              answer: '30%。',
              explanation:
                '减少量为 3.0 − 2.1 = 0.9 mg dm⁻³，用进入时的 3.0 作分母：0.9 ÷ 3.0 × 100% = 30%。题目补充血液体积不变，才可以直接用浓度减少百分比表示尿素量减少百分比。',
            },
          },
          {
            title: '反射弧图中的标签，也可能是错的',
            source: {
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q066',
              why: '题目直接给出学生画的图，适合练习先按信号方向理解突触，再检查标签，而不是照抄图中文字。',
            },
            question: '',
            answer: 'E：突触后膜上有识别神经递质的化学受体。',
            steps: [
              '注意这是 a student’s drawing，图中标签正是要你检查的对象。先沿大箭头走：左边是刺激传来的方向，右边通向肌肉。通向肌肉的这一侧应属于运动传出方向，不能因为旁边写了 sensory neurone 就接受它。',
              '再看放大的连接处：左侧末端有小泡，右侧膜上有对应受体。这是一处化学突触。电信号到达突触前末端后，引起神经递质释放；递质扩散穿过间隙，与突触后膜上的受体结合。',
              '因此 B 的“电冲动跳过间隙”不对，D 所指小泡内的是神经递质，不能在这个位置称作激素。**沿神经元传导与跨化学突触传递，信号形式不一样**。',
              'A 把刺激传入一侧标成 motor neurone，C 把通向肌肉一侧标成 sensory neurone，都与图示方向冲突；E 指出的突触后膜化学受体正确。',
            ],
            optionNotes: [
              'A：把图中刺激传入的一侧错标为运动神经元。',
              'B：化学突触间隙靠神经递质扩散传递信号，不是电冲动直接跳过去。',
              'C：通向肌肉的一侧应属于运动传出方向，不是感觉传入方向。',
              'D：这里释放的是神经递质；不能把局部突触传递与血液运输的激素调节混为一谈。',
              'E：突触后膜上的受体可与相应神经递质结合，是正确标签。',
            ],
            takeaway:
              '先看**信号从哪里来、往哪里去**，再判断标签。化学突触要记住“小泡释放递质 → 跨间隙扩散 → 受体结合”，不要把整条路线都说成电信号。',
            variant: {
              question:
                'A drug blocks the neurotransmitter receptors on the postsynaptic membrane. Electrical impulses still reach the presynaptic terminal and neurotransmitter is still released. Can this chemical synapse transmit the signal normally?',
              answer: '不能正常传递。',
              explanation:
                '递质虽然到达间隙，却无法与被阻断的受体正常结合，不能照常触发突触后反应。**有递质释放，不等于下一细胞一定接收到信号**；这一变式把阻断位置从整条神经缩小到受体。',
            },
          },
        ],
        checklist: [
          '反射弧的感觉、中央连接、运动顺序是否正确？',
          '心脏通路是否符合房在前、室在后与肺/体双循环？',
          '是否分清通气、扩散交换、消化吸收与肾重吸收？',
          'ECG 时间单位和血量单位是否都换算了？',
        ],
      },
    }),
    physiologySection({
      code: '150903',
      title: '稳态',
      summary: animalPhysiologyMethods['150903'].summary,
      paragraphs: [animalPhysiologyMethods['150903'].intro],
      memory: animalPhysiologyMethods['150903'].memory,
      rules: animalPhysiologyMethods['150903'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '胰岛素降低血糖，胰高血糖素提高血糖，名称相近但功能不同。',
        'ADH 增多通常使尿量减少；不要把水回收量与尿量写成同方向。',
        '负反馈能使一个偏低的量升高，“负”不是下降的同义词。',
      ],
      check: {
        question: '血糖低于适宜范围后，肝脏向血液释放葡萄糖增加，血糖随后回升。这属于哪种情况？',
        options: [
          '正反馈，因为血糖上升。',
          '负反馈，因为反应减小了原来的血糖偏低。',
          '没有调节，因为稳态不允许数值变化。',
          '胰岛素直接把糖原分解成葡萄糖。',
        ],
        answerIndex: 1,
        explanation:
          '选 B。原来的问题是“过低”，回升是在纠正这一偏离，所以是负反馈。A 只盯住上升方向；C 把稳定范围误解成完全不变；D 混淆了激素作用，而且激素也不是直接切断糖原的酶。',
      },
      examFocus: {
        goal: '每次先说清“哪个量偏高或偏低”，再看身体的反应是否把它拉回适宜范围。**激素的浓度、器官的动作、最后的效果，要分别说明**。',
        comparison: {
          title: '先看变化，再看纠正动作',
          columns: ['最初变化', '主要反应', '结果方向'],
          rows: [
            ['血糖偏高', '胰岛素作用增强，利用和储存葡萄糖增加', '血糖降低'],
            ['血糖偏低', '胰高血糖素作用增强，肝释放葡萄糖增加', '血糖升高'],
            ['失水、血浆水势降低', 'ADH 增多，肾重吸收水增加', '尿量减少，水得到保留'],
            ['体温偏高', '出汗、皮肤血流增加', '在适当环境中散热增加'],
            ['体温偏低', '皮肤血流减少、颤抖', '散热减少，产热增加'],
          ],
        },
        examples: [
          {
            title: '血糖升高和降低，为什么都属于负反馈？',
            source: {
              questionCode: 'ESAT_LEGACY_2022_NSAA_Q072',
              why: '在同一流程图里检查调节腺体、两种激素及反馈方向，适合把“恢复正常范围”真正用到读图中。',
            },
            question: '',
            answer: 'B：V 是胰腺，W 是胰高血糖素，X 是胰岛素；Y、Z 均为负反馈。',
            steps: [
              '先把左右两支各读成一句话。左支：血糖降低后，某种激素让肝脏释放葡萄糖。右支：血糖升高后，另一种激素让肝脏摄取并储存葡萄糖。**先想需要什么效果，再填激素名称**。',
              '左支需要把血糖往上拉，W 是胰高血糖素 glucagon，可促进肝糖原分解等过程。右支需要把血糖往下拉，X 是胰岛素 insulin，可促进葡萄糖利用和糖原合成等过程。两者都由胰腺的内分泌细胞分泌，所以 V 是胰腺。',
              '两支都把原来的偏差减小：低了就升，高了就降。这就是负反馈。**“负”不是指血糖一定下降，而是调节结果抵消最初的变化**。',
              '回看 Y、Z 的回路：血糖恢复会减弱相应的调节刺激。它们是激素参与的负反馈，不是图中所列的 nervous response，因此整行匹配的是 B。',
            ],
            optionNotes: [
              'A：胰腺和胰岛素位置有部分正确，但胰腺不分泌肾上腺素，这两条也不是神经反应。',
              'B：腺体、低血糖与高血糖激素、两条负反馈全部匹配。',
              'C：胰腺和反馈类型正确，但把胰岛素与胰高血糖素对调。',
              'D：不仅对调两种激素，还把 Y 误写成神经反应。',
              'E：垂体、肾上腺素和 ADH 不符合这张胰腺调节血糖的图；Z 也不是神经反应。',
              'F：V、W、X 均不符合图中的功能，Y 也错写成神经反应。',
              'G：右侧胰岛素对应合理，但垂体、ADH 和两个神经反应均不符合。',
              'H：激素顺序正确，却把分泌腺体写成垂体，并把 Z 写成神经反应。',
            ],
            takeaway:
              '负反馈的判断只问一句：**这个反应有没有把最初的偏差拉回来？** 不要看变量是上升还是下降就给反馈贴标签。',
            variant: {
              question:
                'After a carbohydrate-rich meal, blood glucose rises and insulin secretion increases. As glucose returns towards its normal range, should the original glucose stimulus for insulin secretion become stronger or weaker?',
              answer: '减弱。',
              explanation:
                '血糖偏高是这条回路的刺激；当偏差缩小，刺激随之减弱，胰岛素分泌会相应调整。这不是胰岛素完全消失，而是不应继续把餐后升高时的强刺激无限维持下去。',
            },
          },
        ],
        checklist: [
          '当前被调节的是血糖、水势还是体温？',
          '是否把传出信号和靶器官最终效果分开？',
          '肾脏响应正常这一条件是否仍然成立？',
        ],
      },
    }),
    physiologySection({
      code: '150904',
      title: '激素',
      summary: animalPhysiologyMethods['150904'].summary,
      paragraphs: [animalPhysiologyMethods['150904'].intro],
      memory: animalPhysiologyMethods['150904'].memory,
      rules: animalPhysiologyMethods['150904'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        'FSH 和 LH 来自垂体，雌激素和孕激素主要来自卵巢相关结构。',
        'FSH 促进卵泡发育，LH 峰触发排卵，不能互换。',
        '抑制排卵的效果不意味着一定能阻挡性传播病原体。',
      ],
      check: {
        question: '某激素随血液到达两种组织，只有其中一种有相应受体。最合理的判断是哪项？',
        options: [
          '两种组织一定发生完全相同的反应。',
          '没有受体的组织必须把这种激素变成 ATP。',
          '具有相应受体的靶组织才可能对该信号作出特定反应。',
          '激素只能沿运动神经元进入组织。',
        ],
        answerIndex: 2,
        explanation:
          '选 C。**靶细胞的识别与相应受体有关**，不是只要血流经过就会产生同一效果。A 忽略受体差异，B 把信号误当燃料，D 把内分泌与神经传递混淆。',
      },
      examFocus: {
        goal: '把每种激素放回“哪里分泌、作用在哪里、使什么变化”这三个具体问题中，再理解周期中的先后和反馈。',
        comparison: {
          title: '月经周期四种主要激素',
          columns: ['激素', '主要来源', '主要作用'],
          rows: [
            ['FSH', '垂体前叶', '卵泡发育，促进雌激素分泌'],
            ['LH', '垂体前叶', 'LH 峰触发排卵，支持黄体形成'],
            ['雌激素', '卵巢卵泡等', '促进内膜增厚；反馈随阶段变化'],
            ['孕激素', '排卵后的黄体', '帮助维持内膜，抑制 FSH、LH'],
          ],
        },
        examples: [
          {
            title: '顺着分泌来源认激素，别只背周期曲线',
            source: {
              questionCode: 'NSAA_2023_S1-Q070',
              why: '用垂体、卵泡和黄体之间的关系识别激素，再把它们的作用与月经发生的时间联系起来。',
            },
            question: '',
            answer: 'E：只有陈述 1 和 2 正确。',
            steps: [
              '先沿图找来源和作用对象。垂体前叶分泌的 hormone 1 作用于卵泡，是 FSH；hormone 2 是 LH。卵泡分泌的 hormone 3 是雌激素，黄体分泌的 hormone 4 是孕激素。',
              '陈述 1 正确：FSH 促进卵泡发育，发育中的卵泡分泌雌激素。这里不要把促进卵泡发育的 FSH 与排卵前出现高峰的 LH 对调。',
              '陈述 2 正确：孕激素帮助维持子宫内膜。陈述 3 则把激素和时间都混了：在没有怀孕的正常周期末，黄体退化，孕激素和雌激素下降，内膜失去维持后脱落；不是 FSH 与 LH 都在此时达到最高峰再下降。',
              '所以 1、2 正确，3 错误，选 E。图里的反馈符号可以帮助理解调节关系，但不能取代“哪个腺体分泌哪种激素、作用在哪里”的基本判断。',
            ],
            optionNotes: [
              'A（全不正确）：漏掉 FSH 的卵泡作用和孕激素的内膜作用。',
              'B（仅 1）：正确识别 FSH，但漏掉正确的陈述 2。',
              'C（仅 2）：正确识别孕激素，却漏掉 FSH 促进卵泡发育。',
              'D（仅 3）：把周期末的激素变化认错，也排除了两条正确功能。',
              'E（1 和 2）：两条功能正确，且没有接受周期末的错误高峰说法。',
              'F（1 和 3）：漏掉 2，并误把垂体两种激素的最高峰放在月经前。',
              'G（2 和 3）：漏掉 1，同时接受错误的陈述 3。',
              'H（1、2、3）：前两条虽正确，第三条的激素种类和时点不成立。',
            ],
            takeaway:
              '把月经周期先记成一条有因果的线：**FSH 帮卵泡发育 → LH 峰触发排卵 → 黄体分泌孕激素维持内膜 → 未怀孕时卵巢激素下降，出现月经**。',
            variant: {
              question:
                'In a simplified model after ovulation, progesterone and oestrogen are maintained at levels sufficient to support the uterine lining instead of falling at the end of the cycle. Would the withdrawal of these hormones still trigger menstruation?',
              answer: '不会由这一次“激素撤退”触发月经。',
              explanation:
                '变式明确取消了孕激素和雌激素的下降，因此原题中“激素下降 → 内膜失去维持”的触发链条不再成立。这是在题设模型中判断一个原因，并不等于断言任何情况下都不可能出血。',
            },
          },
          {
            title: '植物向光弯曲，除了激素还需要什么？',
            source: {
              questionCode: 'ESAT_LEGACY_2018_NSAA_Q61',
              why: '把植物激素与生长所需的物质和能量合在一起，练习区分“决定弯向哪里”与“支持细胞生长”。',
            },
            question: '',
            answer: 'H：条件 1、2、3 都需要。',
            steps: [
              '题目问茎尖附近的细胞要怎样支持向光生长。我们把它分成两件事：一是细胞能持续生长，二是两侧生长速度不同，从而弯曲。',
              '单侧光引起生长素分布不均，茎的背光侧通常有较多生长素，促进这一侧细胞伸长，所以茎向光弯曲。**激素分布不均解释的是方向**，条件 2 正确。',
              '但有激素信号，细胞也不能不消耗物质和能量就伸长。按本题正常生长的有氧呼吸模型，葡萄糖提供呼吸底物，氧支持有氧供能，因此条件 1、3 也需要。不要把答案扩大为“所有植物细胞在任何短暂缺氧条件下都完全不能代谢”。',
              '三条分别照顾到生长底物、差异伸长的调节和有氧供能，选 H。只选激素的选项，解释了为什么弯，却遗漏了怎么长。',
            ],
            optionNotes: [
              'A（全不需要）：既否定差异生长的激素条件，也忽略正常生长的供能。',
              'B（仅 1）：只保留葡萄糖，漏掉激素分布和氧。',
              'C（仅 2）：知道向光性的调节，却遗漏生长本身的物质和供能条件。',
              'D（仅 3）：只保留氧，漏掉葡萄糖和激素分布。',
              'E（1 和 2）：漏掉本题正常有氧生长所需的氧。',
              'F（1 和 3）：可支持生长供能，却没有解释两侧为何伸长不同。',
              'G（2 和 3）：漏掉葡萄糖这一呼吸底物。',
              'H（1、2、3）：同时满足正常生长与定向弯曲的条件。',
            ],
            takeaway:
              '激素负责调节，不是凭空提供全部能量。解释生长题时同时想两层：**细胞靠什么长；两侧为什么长得不一样**。',
            variant: {
              question:
                'A shoot has sufficient glucose and oxygen. Under otherwise identical conditions, auxin is maintained at the same growth-promoting concentration on both sides of its tip. Does this auxin distribution by itself provide a reason for the shoot to bend to one side?',
              answer: '不能。',
              explanation:
                '两侧生长素浓度相同，单凭这一条件不能推出一侧伸长更快。细胞可以继续生长，但**能够生长与出现定向弯曲不是同一结论**；还需要造成两侧差异的条件。',
            },
          },
        ],
        checklist: [
          '是否把分泌腺、靶器官和作用写对？',
          '题目所处阶段是在排卵前还是排卵后？',
          '反馈方向是否带上阶段条件？',
          '避孕和感染传播是否分开判断？',
        ],
      },
    }),
    physiologySection({
      code: '150905',
      title: '疾病与身体防御',
      summary: animalPhysiologyMethods['150905'].summary,
      paragraphs: [animalPhysiologyMethods['150905'].intro],
      memory: animalPhysiologyMethods['150905'].memory,
      rules: animalPhysiologyMethods['150905'].blocks.flatMap((block) => [
        ...(block.points ?? []),
        ...(block.paragraphs ?? []).map((text) => ({ title: block.title, text })),
        ...(block.table?.rows ?? []).map((row) => ({
          title: row[0]!,
          text: row.slice(1).join('；'),
        })),
      ]),
      pitfalls: [
        '抗体与抗原不是同一物质，记忆细胞也不是抗体。',
        '疫苗形成的记忆通常针对匹配抗原，不是对任何病原都通用。',
        '疾病风险差异可支持进一步研究，但不能单凭相关性锁定唯一病因。',
        '药物试验要比较比例与条件，不能只看两组患病人数。',
      ],
      check: {
        question:
          '接种针对病原 P 的疫苗后，血液中的相应抗体后来下降。再次遇到 P 时，为什么仍可能更快产生抗体？',
        options: [
          '所有抗体都变成了记忆细胞。',
          'P 已被永久改变，不能再次接触机体。',
          '相应记忆细胞保留下来，再次刺激可更快启动反应。',
          '疫苗使所有细菌和病毒都变得相同。',
        ],
        answerIndex: 2,
        explanation:
          '选 C。**抗体浓度降低，不等于免疫记忆已经完全消失**。再次遇到匹配抗原，记忆细胞有助于更快产生反应。A 混淆分子和细胞，B、D 都不是疫苗对整个外界病原群体的作用。',
      },
      examFocus: {
        goal: '先分清病原、抗原、抗体与记忆细胞，再判断防传播、预防和治疗各在做什么。遇到试验数据时，**用可比较的比例和对照条件评估证据**。',
        comparison: {
          title: '防御或干预各做什么',
          columns: ['方式', '直接作用', '不能混同为'],
          rows: [
            ['物理屏障', '降低病原进入或传播机会', '直接形成全部免疫记忆'],
            ['吞噬', '吞入并分解病原等颗粒', '所有白细胞都分泌抗体'],
            ['疫苗', '以相关抗原建立免疫反应与记忆', '对所有病原通用的治疗药'],
            ['抗生素', '针对敏感细菌的结构或过程', '直接治疗病毒感染的药物'],
            ['随机对照试验', '比较干预与对照的结果', '一次观察就证明绝对安全'],
          ],
        },
        examples: [
          {
            title: '吞噬、抗生素和抗体，怎样从表格中分清？',
            source: {
              questionCode: 'ESAT-2020-BIOLOGY-017',
              why: '用作用对象、是否需要细胞移动、是否使用人体释放的分子这三类信息，比较身体防御与药物的不同方式。',
            },
            question: '',
            answer: 'F：X 是吞噬作用，Y 是服用抗生素，Z 是可由灭活病原体接种激发的抗体反应。',
            steps: [
              '先找最容易认的一列组合。Y 作用于细菌，不作用于病毒，也不依赖人体细胞移动或释放的分子，符合抗生素。**抗生素不能治疗病毒本身**，不要把它当成能消灭一切病原体的药物。',
              'X 对细菌和病毒都可发挥作用，且需要人体细胞移动到病原体所在处，符合吞噬细胞接近并吞入病原体。表格的“没有使用人体细胞释放的分子”，是在区分这里列出的主要防御方式，不是在说吞噬细胞内没有酶。',
              'Z 使用人体细胞释放的分子，不要求吞噬细胞移动后把病原体吞入，符合抗体介导的作用。灭活病原体提供抗原，可以激发相应免疫反应，因此能与“may be stimulated by injections of inactivated pathogen”对应。',
              '按 X、Y、Z 排列为吞噬作用、抗生素、接种可激发的抗体反应，选 F。注意这里说“可影响细菌和病毒”，不是一份抗体能识别所有细菌和病毒；**抗体仍有特异性**。',
            ],
            optionNotes: [
              'A：Y 的抗生素正确，但把 X 的细胞移动和 Z 的释放分子两种特征对调。',
              'B：把 X 认成接种后的分子反应、Y 认成吞噬、Z 认成抗生素，均不符合对应特征。',
              'C：X 同时影响病毒且需要细胞移动，不是抗生素；Y、Z 也与表格不符。',
              'D：Z 对应接种可激发的反应正确，但把 X、Y 的吞噬与抗生素颠倒。',
              'E：X 的吞噬正确，但 Y 不使用人体释放的分子，Z 又能影响病毒，二者不能分别认成抗体反应和抗生素。',
              'F：依次符合细胞移动吞噬、抗生素作用、人体释放抗体的三组特征。',
            ],
            takeaway:
              '比较防御方式时，别只问“能不能杀病原体”。要问**是谁在作用、通过什么方式、针对哪些对象**。接种提供抗原来激发反应，与直接给抗体也不同。',
            variant: {
              question:
                'A person receives purified antibodies against a specific pathogen, with no pathogen antigen in the injection. Do these injected antibodies themselves create memory cells against that pathogen?',
              answer: '不会。直接给予抗体本身不建立针对该病原体的免疫记忆。',
              explanation:
                '抗体可暂时提供相应保护，但不是把抗原交给患者免疫系统来训练其自身的特异性反应。没有因这次单纯注入抗体而形成记忆细胞；这与疫苗激发的主动免疫不同。题目限定未注入病原体抗原，也不能额外假设此时发生了感染。',
            },
          },
        ],
        checklist: [
          '目标是细菌、病毒，还是非传染性疾病？',
          '相关措施是减少传播、建立记忆，还是治疗？',
          '比较的是人数、绝对差，还是相对减少？',
          '试验是否有合适对照，结论是否超出样本与观察时间？',
        ],
      },
    }),
  ],
  sources: [
    {
      id: 'uat-spec-b9',
      title: 'UAT-UK · ESAT Content Specification (2026/27)',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165424/ESAT_Content_Specification.pdf',
      note: '按 B9.1–B9.5 核对本章知识范围；讲解与题目为原创。',
    },
    {
      id: 'uat-guide-b9',
      title: 'UAT-UK · ESAT Guide: Biology (June 2025)',
      url: 'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2025/07/06120052/ESAT_Guide_Biology_June_2025.pdf',
      note: '用于核对系统与机制层次，不转载教材题目或插图。',
    },
    {
      id: 'openstax-physiology',
      title: 'OpenStax · Biology 2e: Animal physiology',
      url: 'https://openstax.org/books/biology-2e/pages/41-2-the-kidneys-and-osmoregulatory-organs',
      note: '交叉核对肾单位结构；同书 42.2、43.4 交叉核对免疫记忆与生殖反馈。',
    },
  ],
}
