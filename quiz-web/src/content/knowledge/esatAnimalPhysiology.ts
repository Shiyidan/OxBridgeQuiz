// ESAT 动物生理学讲义：把器官功能、调节和防御串起来，并用原创题练习解释与计算。
import type { KnowledgeExamFocus, KnowledgeLesson, KnowledgeSection } from './types'

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
    '吃进去的食物怎样变成肌肉能用的能量？运动时为什么呼吸和心跳一起加快？这些问题其实连在同一条线上：消化提供小分子，肺提供氧，血液负责运输，细胞完成呼吸。本章先把各部分的工作讲清楚，再看身体怎样调节血糖、水分和温度，以及怎样抵御病原体。例题会带你沿着这个过程找原因，而不是只凭一个熟悉的名词选答案。',
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
      summary: '区分呼吸作用与呼吸动作，理解有氧、动物无氧呼吸以及运动时的能量供应。',
      paragraphs: [
        '这里的 respiration 指细胞里的化学过程，不是吸气和呼气的动作。葡萄糖等有机物中储存的化学能通过呼吸作用转移出来，其中一部分用于形成 ATP，供肌肉收缩、主动运输和合成物质等活动使用，其余以热等形式散失。**能量被转移，不是凭空制造出来**。',
        '有氧和无氧呼吸的关键区别，是是否需要氧以及葡萄糖被分解到什么程度。考试可以把场景换成肌肉、离体组织或小型呼吸装置，但你都先问同样几件事：氧能不能到达细胞？产物是什么？每份葡萄糖能支持多少 ATP 形成？',
      ],
      rules: [
        {
          title: '有氧呼吸的原料与产物',
          text: '文字式是：**葡萄糖 + 氧 → 二氧化碳 + 水**，同时释放可利用的能量。动物细胞的有氧呼吸涉及细胞质和线粒体，主要 ATP 生成与线粒体有关；不能说整个过程只发生在线粒体。',
        },
        {
          title: '动物细胞的无氧呼吸',
          text: '文字式是：**葡萄糖 → 乳酸（乳酸盐）**，同时获得少量 ATP。此过程在细胞质中进行，不需要氧；葡萄糖没有被完全分解，故每份葡萄糖的 ATP 产量远低于有氧呼吸。动物这一过程不产生乙醇，也不释放二氧化碳。',
        },
        {
          title: 'ATP 连接呼吸与细胞活动',
          text: 'ATP 是把能量供应与能量使用连接起来的重要载体。肌肉收缩、主动运输和合成反应需要能量；呼吸释放的能量可用于不断补充 ATP。**呼吸速率增加不代表能量需求增加的唯一原因已经确定**，还应看温度、细胞数量和运动状态等条件。',
        },
        {
          title: '运动时为什么心跳和通气加快',
          text: '肌肉收缩加快，ATP 消耗增加。通气加强有助于保持肺泡气体更新，循环加强有助于运送氧和葡萄糖、带走二氧化碳。若氧供应仍不能满足需要，肌肉可增加无氧供能；**有氧和无氧过程可以同时进行**，不是一定先完全关闭一个再打开另一个。',
        },
        {
          title: '运动结束后为何还呼吸较快',
          text: '运动后身体仍需恢复，包括处理运动中积累的乳酸盐、恢复氧储备和能量储备等。乳酸盐可被氧化，也可经肝脏等途径转为葡萄糖。不能把运动后全部额外耗氧只归为一个反应，也不要把次日肌肉酸痛简单等同于乳酸残留。',
        },
        {
          title: '用数据比较呼吸速率',
          text: '氧消耗量或二氧化碳产生量可作为适当条件下的指标。比较不同质量的材料时，要先算单位质量、单位时间的速率；若二氧化碳被吸收，密闭装置中的气体体积下降可反映耗氧，但需控制温度、气压与装置漏气。==先确认测量代表什么，再代入数字==。',
        },
      ],
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
            title: '单位质量的耗氧量，怎样比较？',
            question:
              'Two living tissue samples are tested at the same temperature. Carbon dioxide is absorbed and the gas-volume decrease is due only to oxygen uptake. Sample P, mass 2 g, uses 8 mL of oxygen in 4 minutes. Sample Q, mass 3 g, uses 18 mL in 6 minutes. What is the ratio of the oxygen uptake rates per gram, P:Q?',
            options: ['2:3', '3:2', '1:1', '4:9'],
            answer: 'C：1:1。两者都是 1 mL g⁻¹ min⁻¹。',
            steps: [
              '问题要比较的是每克、每分钟，不能直接拿 8 和 18 相比。',
              'P 的速率为 8 ÷ 2 ÷ 4 = 1 mL g⁻¹ min⁻¹；Q 为 18 ÷ 3 ÷ 6 = 1 mL g⁻¹ min⁻¹。',
              '两个数相同，所以比例是 1:1。二氧化碳已被吸收、温度相同且体积变化仅来自耗氧，这些条件让测量有明确含义。',
            ],
            optionNotes: [
              'A：只比较每分钟耗氧 2:3，遗漏了质量不同。',
              'B：不是单位质量、单位时间计算得到的比值。',
              'C：质量与时间都已除去，比较成立。',
              'D：8:18 化简为 4:9，只比总体积，混入两个差异。',
            ],
            takeaway:
              '凡题目写 per gram、per minute，就分别除以质量和时间。**较大的总耗氧量不一定意味着每克组织呼吸更快**。',
            variant: {
              question:
                'Q now uses 36 mL in 6 minutes, with all other values unchanged. What is P:Q for the rates per gram?',
              answer: '1:2。',
              explanation:
                'P 仍为 1；Q 变为 36 ÷ 3 ÷ 6 = 2 mL g⁻¹ min⁻¹。注意新耗氧量翻倍，原来的质量和时间没有改变。',
            },
          },
          {
            title: '氧不足时，哪一种产物能帮助判断？',
            question:
              'Animal muscle cells continue producing ATP during a short period with no available oxygen. Which statement about the anaerobic pathway is correct?',
            options: [
              'It produces ethanol and carbon dioxide from glucose.',
              'It produces lactate and a smaller ATP yield per glucose than aerobic respiration.',
              'It produces water and carbon dioxide with the same ATP yield as aerobic respiration.',
              'It stops whenever glucose is available.',
            ],
            answer: 'B：产生乳酸盐，每份葡萄糖提供的 ATP 少于有氧呼吸。',
            steps: [
              '先确认题目说 animal muscle cells，所用的是动物无氧途径。',
              '这个途径在细胞质中进行，可由葡萄糖获得少量 ATP，产物为乳酸盐。',
              '由于葡萄糖未完全分解，每份葡萄糖的 ATP 收益较低，所以 B 同时满足产物与供能两个条件。',
            ],
            optionNotes: [
              'A：把酵母的酒精发酵产物套到了动物肌肉。',
              'B：两部分都正确。',
              'C：二氧化碳和水是有氧呼吸总体产物，ATP 产量也不能等同。',
              'D：葡萄糖是原料，有葡萄糖本身不会让该途径停止。',
            ],
            takeaway: '题目给出不同生物时，先确认是谁在呼吸，再写文字式。**无氧不等于无能量**。',
            variant: {
              question:
                'Oxygen becomes available again. Must all lactate molecules be converted directly into carbon dioxide inside the same muscle cell?',
              answer: '不必。',
              explanation:
                '乳酸盐可以被运走，也可在其他组织被利用或经肝脏等途径转成葡萄糖。恢复氧供应不意味着所有产物只能在原细胞以同一条路线处理；must 和 all 都超出了证据。',
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
      summary: '串联神经、呼吸、循环、消化和排泄系统，理解通路、交换表面及结构与功能。',
      paragraphs: [
        '一个多细胞动物不能只靠体表扩散满足深部细胞的需要：个体变大时，体积相对于表面积增长得更快，内部距离也更长。所以身体既需要肺泡和小肠绒毛这样的交换表面，也需要循环系统把物质送到各处。**交换与运输是两项配合的工作**。',
        '学习器官系统时，可以顺着一种物质走一遍：淀粉先被消化为可吸收的小分子，葡萄糖经小肠吸收进入血液，再被送到细胞；氧由肺进入血液，二氧化碳由细胞返回肺。神经系统负责快速协调，肾脏则不断调整血液的水、盐和代谢废物。下面的图谱可切换不同系统查看。',
      ],
      rules: [
        {
          title: '神经元与反射弧',
          text: '中枢神经系统 CNS 包括**脑和脊髓**，不是脑和整条脊柱。神经元有含细胞核的细胞体、接收信号的树突或其他接受端，以及传导冲动的长突起；轴突把信号传离细胞体，部分轴突有髓鞘绝缘，可加快传导。感觉神经元从感受器传入中枢，中间神经元在中枢内连接，运动神经元再传向肌肉或腺体等效应器。典型撤回反射可在有意识感觉形成前启动；化学突触通过神经递质把信号跨间隙传给下一细胞，具有传递方向并带来短暂延迟。',
        },
        {
          title: '胸廓怎样使空气进入肺',
          text: '气管分为支气管，再分支为细支气管，末端连接肺泡。吸气时膈肌收缩变平，外肋间肌收缩使肋骨向上向外，胸腔容积增大、肺内气压下降，空气流入。安静呼气主要依靠相关肌肉放松和弹性回缩；**空气由压差推动，不是肺主动把氧吸入血液**。',
        },
        {
          title: '肺泡交换依靠什么',
          text: '肺泡数量多，提供大面积；肺泡壁与毛细血管壁薄，扩散距离短；通气和血流帮助维持氧、二氧化碳的分压差。氧通常由肺泡进入血液，二氧化碳反向。面积减少或屏障增厚都可能减慢交换；高表面积体积比有利于交换，但不能代替持续的运输。',
        },
        {
          title: '心脏与双循环',
          text: '身体回来的血依次经腔静脉→右心房→右心室→肺动脉→肺，再经肺静脉→左心房→左心室→主动脉→身体。瓣膜随两侧压差开闭，减少倒流；左心室壁较厚，为体循环产生较高压力。左右侧按身体自身方位命名，正面图常与读图者的左右相反。冠状动脉供应心肌本身。',
        },
        {
          title: '动脉、静脉与毛细血管',
          text: '动脉运血离开心脏，壁较厚且有弹性；静脉运血返回心脏，压力较低，许多静脉有瓣膜；毛细血管壁很薄，适合交换。**肺动脉含氧较低，肺静脉含氧较高**，所以不能凭 artery 或 vein 单独判定含氧量。血管腔的粗细与壁厚也不是同一个测量。',
        },
        {
          title: '血液的分工',
          text: '红细胞用血红蛋白运输氧，双凹形有利于交换，成熟哺乳动物红细胞无核；不同白细胞参与吞噬或特异性免疫，抗体由分化后的 B 淋巴细胞产生。血小板参与凝血；血浆运输细胞、激素、抗体、尿素和二氧化碳等，也分配热量。不是所有白细胞都同时吞噬并制造抗体，血浆也不等于红细胞。',
        },
        {
          title: '心率、搏出量与 ECG',
          text: '心率是每分钟心搏次数，搏出量是每搏泵出的血量，心输出量 = 心率 × 搏出量。心电图 ECG 记录心脏电活动，P 波与心房去极化有关，QRS 波群与心室去极化有关，T 波与心室复极有关；这些电活动与收缩、舒张相联系，**波高不是泵血量**。规则节律中，心率 = 60 ÷ 相邻 R 波间隔（秒）。',
        },
        {
          title: '食物如何通过消化道',
          text: '食物经口、食管、胃、小肠、大肠、直肠和肛门。蠕动是消化道壁肌肉协调收缩，把内容物向前推动，并非靠食物自由下落。机械消化使食物变小，酶促化学消化把大分子分成可吸收的小分子；胃酸提供适当环境并杀灭许多微生物。胰腺向小肠输送多种消化酶。',
        },
        {
          title: '胆汁、绒毛与吸收',
          text: '肝脏制造胆汁，胆囊储存并释放；胆汁帮助中和酸性食糜，并把脂肪分散为小滴，增加脂肪酶可作用的面积，**胆汁不是酶**。小肠的褶皱、绒毛和微绒毛扩大吸收面积，薄上皮缩短距离，毛细血管及乳糜管运走吸收产物。葡萄糖、氨基酸主要进入血液，许多脂类吸收产物经乳糜管进入淋巴；大肠吸收部分水，未消化残余经排遗离体。',
        },
        {
          title: '肾脏与肾单位',
          text: '肾动脉把血送入肾，肾静脉带血离开；尿液经输尿管到膀胱储存，再经尿道排出。肾小球滤过使水和小溶质进入肾小囊，正常情况下血细胞与大蛋白保留在血内；滤液经近曲小管、髓袢、远曲小管及集合管时继续被调整，葡萄糖通常几乎全被重吸收，水和盐按需要调节。尿素主要在肝脏形成，经肾脏排出。==排泄移除代谢废物，排遗移除未消化残余==。',
        },
      ],
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
            title: '从 ECG 算出心脏每分钟泵多少血',
            question:
              'A regular ECG has 0.75 s between consecutive R peaks. The stroke volume is 60 mL. What is the cardiac output?',
            options: ['0.080 L min⁻¹', '0.80 L min⁻¹', '4.8 L min⁻¹', '80 L min⁻¹'],
            answer: 'C：4.8 L min⁻¹。',
            steps: [
              '相邻 R 波间隔表示一个心动周期的时间，不是每分钟的次数。心率 = 60 ÷ 0.75 = 80 min⁻¹。',
              '每搏泵 60 mL，一分钟 80 搏，所以心输出量 = 80 × 60 = 4800 mL min⁻¹。',
              '1000 mL = 1 L，因此为 4.8 L min⁻¹。这里用到的是波的时间间隔，不是 ECG 波峰的高度。',
            ],
            optionNotes: [
              'A：把心率数值换了单位，却没有乘搏出量。',
              'B：数量级不符合 80 次、每次 60 mL 的乘积。',
              'C：心率、搏出量和体积换算都正确。',
              'D：把心率 80 直接当成以升表示的心输出量。',
            ],
            takeaway:
              '把单位写在旁边：次/分钟 × mL/次 = mL/分钟。**ECG 间隔能帮助算心率，波高不能直接当搏出量**。',
            variant: {
              question:
                'The R–R interval falls to 0.50 s while stroke volume remains 60 mL. What is the new cardiac output?',
              answer: '7.2 L min⁻¹。',
              explanation:
                '心率为 60 ÷ 0.50 = 120 min⁻¹，心输出量为 120 × 60 = 7200 mL min⁻¹ = 7.2 L min⁻¹。间隔变短意味着每分钟次数更多。',
            },
          },
          {
            title: '一份氧怎样从肺到达心肌？',
            question:
              'An oxygen molecule diffuses from an alveolus into the blood and is carried to a heart muscle cell through a coronary artery. Which sequence correctly describes the route after leaving the lung capillaries?',
            options: [
              'Pulmonary vein → left atrium → left ventricle → aorta → coronary artery',
              'Pulmonary artery → right atrium → left ventricle → aorta → coronary artery',
              'Pulmonary vein → right atrium → right ventricle → vena cava → coronary artery',
              'Pulmonary artery → left ventricle → left atrium → aorta → coronary artery',
            ],
            answer: 'A：肺静脉→左心房→左心室→主动脉→冠状动脉。',
            steps: [
              '题目从肺毛细血管之后开始，氧已经进入血液，不需要再让血回到肺动脉。',
              '从肺回心脏的血走肺静脉，先进入左心房，再经房室瓣到左心室。',
              '左心室把血泵入主动脉，冠状动脉从主动脉发出，供应心肌。因此 A 的每一段连接都正确。',
            ],
            optionNotes: [
              'A：路线连续，并且冠状动脉确实为心肌供血。',
              'B：肺动脉从右心室到肺，不是从肺流回右心房。',
              'C：肺静脉不进入右心房，腔静脉也不负责从心室向身体泵血。',
              'D：心房在心室之前，且肺动脉不把血带入左心室。',
            ],
            takeaway:
              '先沿血流把路线走通，再看含氧量。**“静脉”只告诉你血回心脏，不代表里面一定缺氧**。',
            variant: {
              question:
                'A red blood cell has just left a skeletal muscle capillary and will next exchange gases in the lungs. Which heart chambers does it pass through first, in order?',
              answer: '右心房，然后右心室。',
              explanation:
                '体循环静脉回流进入腔静脉，再到右心房、右心室，经肺动脉到肺。不要因为问题提到肌肉需要氧，就把当前仍在回流的红细胞直接放到左心。',
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
      summary: '用负反馈解释血糖、水分和体温调节，理解激素变化与最终效果。',
      paragraphs: [
        '稳态 homeostasis 不是身体里的数值一刻也不动，而是让细胞周围的条件维持在适宜范围。吃饭会使血糖变化，运动会使产热增加，饮水和出汗会改变水分；调节系统不断作出反应，避免变化过大而影响细胞功能。',
        '理解负反馈，可以先想一台恒温装置：温度偏高时启动降温，接近合适范围后降温作用减弱。身体也需要检测变化、协调信号和效应器反应。**关键是反应抵消原来的偏离，不是“负反馈中的每个量都下降”**。',
      ],
      rules: [
        {
          title: '负反馈的完整顺序',
          text: '某个量偏离适宜范围→被检测→协调中心发出信号→效应器改变活动→原来的偏离减小。变化恢复后，纠正信号通常减弱。调节存在时间延迟，因此曲线可以在正常范围附近波动；**稳态不等于水平直线**。',
        },
        {
          title: '血糖高时：胰岛素',
          text: '餐后血糖升高，胰腺 β 细胞分泌胰岛素增加。胰岛素促进多种组织对葡萄糖的利用和储存，促进肝脏、肌肉合成糖原，从而有助于降低血糖。胰岛素是信号，**不是把葡萄糖切开的消化酶**。',
        },
        {
          title: '血糖低时：胰高血糖素',
          text: '血糖下降时，胰腺 α 细胞分泌的胰高血糖素作用加强，促进肝糖原分解及肝脏生成葡萄糖，使血糖回升。肝脏可把葡萄糖释放入血，肌肉糖原主要供肌肉本身使用。胰岛素和胰高血糖素的总体作用相反，但二者都参与稳态。',
        },
        {
          title: '1 型与 2 型糖尿病',
          text: '1 型的主要特点是胰腺 β 细胞受损，胰岛素供应严重不足，通常需要外源胰岛素替代；2 型的重要特点是靶组织对胰岛素反应降低，也可能伴随分泌不足。**不能把两型都解释成完全不制造胰岛素**。胰岛素是蛋白质，普通口服后会被消化，这解释了课程中常见的注射给药原理。这里比较机制，不给个人用药方案。',
        },
        {
          title: '缺水时：ADH 保水',
          text: '失水使血浆变浓、水势降低时，下丘脑相关感受器检测变化，经垂体后叶释放的抗利尿激素 ADH 通常增加。ADH 使肾脏集合管等部位对水的通透性提高，更多水经渗透返回血液，最终尿量减少且通常更浓。**水重吸收增加，意味着留在尿中的水减少**。',
        },
        {
          title: '水分多时：少保留一些水',
          text: '在其他条件相近时，摄入较多水使血浆水势上升，ADH 释放减少，集合管水通透性降低，重吸收的水减少，尿量增加且更稀。滤过、重吸收、尿液排出是不同环节，不能把尿量增加直接解释为每个肾单位都停止回收葡萄糖。',
        },
        {
          title: '体温偏高怎样散热',
          text: '下丘脑参与体温调节。温度偏高时，皮肤血管扩张使更多血流经体表，增加适当环境中的热交换；汗液蒸发带走热。**产生汗液不等于汗液已经蒸发**，湿度很高时蒸发散热可能受限；血管扩张也不是血管移动到皮肤表面。',
        },
        {
          title: '体温偏低怎样保温和产热',
          text: '皮肤血管收缩可减少表面散热，骨骼肌颤抖通过反复收缩增加代谢产热。保温是减少散失，产热是增加供应，两者可以同时发生。冷环境中的短期反应不能简单描述为所有代谢都减慢。',
        },
      ],
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
            title: 'ADH 增加后，水去了哪里？',
            question:
              'A healthy person loses water by sweating without drinking. Other factors are unchanged and the kidneys respond normally. Which combination is expected?',
            options: [
              'Less ADH; less water reabsorption; a smaller urine volume',
              'More ADH; less water reabsorption; a larger urine volume',
              'More ADH; more water reabsorption; a smaller urine volume',
              'Less ADH; more water reabsorption; a larger urine volume',
            ],
            answer: 'C：ADH 增加，水重吸收增加，尿量减少。',
            steps: [
              '出汗失水且没有饮水，血浆通常变浓、水势降低，身体需要保留水。',
              '正常调节下 ADH 增加，使集合管等部位对水更通透，更多水返回血液。',
              '已经返回血液的水不会再作为这一部分尿液排出，所以尿量减少。三项依次为“增加、增加、减少”。',
            ],
            optionNotes: [
              'A：尿量方向符合保水，但激素和重吸收方向相反，整项不对。',
              'B：把 ADH 对水重吸收的作用反了。',
              'C：从失水到保水的因果关系一致。',
              'D：激素、重吸收和尿量之间均没有形成正确的关系。',
            ],
            takeaway: '画一条水的去向：**滤液中的水 → 回到血液**。回去越多，剩在尿里的越少。',
            variant: {
              question:
                'ADH rises, but the collecting ducts cannot respond to it. Can increased water reabsorption still be inferred from the hormone concentration alone?',
              answer: '不能。',
              explanation:
                '题目改变的是靶器官的反应能力。激素发出信号，不保证靶细胞一定执行；集合管不能响应时，不能由 ADH 高就断言重吸收增加。',
            },
          },
          {
            title: '判断负反馈，看最初偏离而非箭头方向',
            question:
              'Blood glucose rises after a meal. Insulin secretion increases, glucose uptake and glycogen formation increase, and blood glucose returns towards its usual range. Which statement best explains the feedback?',
            options: [
              'It is positive feedback because insulin increases.',
              'It is negative feedback because the response reduces the original rise in blood glucose.',
              'It is negative feedback because all quantities decrease.',
              'It cannot be feedback because more than one organ is involved.',
            ],
            answer: 'B：反应减小了最初的血糖升高，属于负反馈。',
            steps: [
              '先选定被调节的量：血糖，而不是把胰岛素浓度当成同一个量。',
              '原来的偏离是血糖升高；后来的葡萄糖利用与糖原形成增加，帮助使血糖下降。',
              '后来的作用抵消了最初的变化，因此是负反馈。胰岛素自身增加并不矛盾。',
            ],
            optionNotes: [
              'A：把传递信号的变化方向误当成整个反馈的类型。',
              'B：以受调节的血糖为标准，判断正确。',
              'C：负反馈不要求所有量一起下降，本题胰岛素就增加。',
              'D：反馈经常涉及多个器官，不能据此排除。',
            ],
            takeaway:
              '补全一句话：“原来太……，反应让它……”；**只要在纠正最初偏离，就符合负反馈的基本意思**。',
            variant: {
              question:
                'Blood glucose falls during fasting and glucagon stimulates the liver to release more glucose. Is this also negative feedback?',
              answer: '是。',
              explanation:
                '起初血糖偏低，肝脏释放葡萄糖使其回升，仍在抵消最初偏离。数值向上纠正，也可以是负反馈。',
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
      summary: '理解内分泌信号、肾上腺素和月经周期，比较激素与非激素避孕原理。',
      paragraphs: [
        '内分泌腺把激素释放入血液，血液把信号带到身体各处，但只有具有相应受体的靶细胞能作出特定反应。可以把它理解成广播与接收器：信号到达许多地方，能正确接收的细胞才会响应。**“随血液到达”不等于“使所有细胞做同一件事”**。',
        '学习生殖激素时，不要把四个名字记成一串口号。先分清卵巢在做什么、子宫内膜在做什么，再放入激素：卵泡发育、排卵、黄体形成和内膜维持发生在不同阶段。图中的周期展示事件先后，不代表每个人都严格按 28 天运行。',
      ],
      rules: [
        {
          title: '激素与神经信号',
          text: '激素经血液到达靶结构，作用范围由受体决定；神经冲动沿特定神经元传递，并在突触处传递信息。一般来说神经协调更快、作用较局限，激素作用往往较持久，但这不是毫无例外的规则。**激素是化学信号，不是沿神经纤维流动的电冲动**。',
        },
        {
          title: '肾上腺素为快速行动作准备',
          text: '肾上腺释放肾上腺素 adrenaline，可使心率等活动增加、促进储存能源动员，帮助增加肌肉获得氧和葡萄糖的能力。肾上腺素本身不是燃料，也不直接变成 ATP；它使器官的活动适应紧急行动需要。',
        },
        {
          title: 'FSH：让卵泡开始发育',
          text: '促卵泡激素 FSH 由垂体前叶分泌，促进卵巢中的卵泡发育和雌激素分泌。卵泡中的卵细胞与周围支持细胞一起变化。FSH 不由子宫制造，也不能把卵泡发育直接等同于已经排卵。',
        },
        {
          title: '雌激素：内膜增厚与反馈',
          text: '发育中的卵泡分泌雌激素 oestrogen，促进子宫内膜增厚。在周期许多阶段，它参与抑制 FSH 等反馈；接近排卵时持续的高雌激素可转为促进 LH 峰。==不能把雌激素的反馈写成整个周期始终同一方向==。',
        },
        {
          title: 'LH：排卵与黄体',
          text: '促黄体生成素 LH 由垂体前叶分泌，排卵前的 LH 峰触发成熟卵泡释放卵细胞，并支持排卵后黄体形成。LH 峰通常在排卵前；看到曲线中的峰，要先辨认是哪一种激素，不能把所有峰都叫排卵。',
        },
        {
          title: '孕激素：维持内膜',
          text: '排卵后形成的黄体分泌较多孕激素 progesterone，帮助维持适于胚胎着床的子宫内膜，并对 FSH、LH 产生反馈抑制。若未建立妊娠，黄体退化，孕激素及雌激素下降，内膜脱落形成月经。**月经开始是一个新周期的第 1 天，排卵不是第 1 天**。',
        },
        {
          title: '激素避孕的原理',
          text: '激素避孕可通过改变激素反馈抑制卵泡发育或排卵；孕激素类还可使宫颈黏液更稠、阻碍精子通过。不同制剂机制和组合不同，不能概括为每一种都完全依靠阻止排卵。**激素避孕本身不提供对性传播感染的屏障保护**。',
        },
        {
          title: '非激素方法与感染传播',
          text: '避孕套提供物理屏障，阻碍精子进入，同时可降低多种性传播感染的传播风险；铜宫内装置不靠外源激素，主要影响精子功能等受精环节；绝育通过阻断配子运输。避孕目的与阻断病原传播是两个问题，不能由“可以避孕”推定“都能防感染”。本节比较机制，不推荐个人选择。',
        },
      ],
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
            title: 'LH 峰没有出现，会先影响哪一步？',
            question:
              'A treatment prevents the normal mid-cycle LH surge. Follicle growth and oestrogen secretion before this point are otherwise normal. Which event is most directly affected?',
            options: [
              'Release of the mature egg from the ovary',
              'The movement of every hormone through blood',
              'All thickening of the uterine lining before treatment',
              'Formation of red blood cells in bone marrow',
            ],
            answer: 'A：成熟卵细胞从卵巢释放，也就是排卵。',
            steps: [
              '题目限定改变的是 LH 峰，并且告诉我们此前卵泡发育和雌激素分泌正常。',
              'LH 峰最直接连接的事件是排卵，所以先判断卵细胞释放会受到影响。',
              '不能因为一种激素受到影响，就把所有血液运输或早已发生的内膜增厚也宣布消失。',
            ],
            optionNotes: [
              'A：对应 LH 峰的直接作用。',
              'B：LH 峰变化不会让血液停止运输全部激素。',
              'C：题干说此前雌激素分泌正常，不能倒推此前完全未增厚。',
              'D：不是本题 LH 峰所直接调节的生殖事件。',
            ],
            takeaway:
              '题目问 most directly，优先找**这项激素最直接控制的事件**，不要跳到遥远或无关的后果。',
            variant: {
              question:
                'Ovulation has already occurred, but the corpus luteum later degenerates and progesterone falls without pregnancy. What is expected to happen to the uterine lining?',
              answer: '内膜失去维持，随后脱落，出现月经。',
              explanation:
                '现在改变的是排卵后的黄体和孕激素，不能继续回答“排卵受阻”。要把事件放到正确阶段：孕激素下降与内膜维持减弱相联系。',
            },
          },
          {
            title: '避孕效果与感染防护要分开判断',
            question:
              'Method X uses hormones to suppress ovulation. Method Y is a correctly used condom. Which statement is correct?',
            options: [
              'X creates a physical barrier to HIV transmission.',
              'Y prevents sperm passage by suppressing FSH secretion.',
              'Both methods must prevent every sexually transmitted infection.',
              'X acts through hormonal regulation, while Y provides a physical barrier that can reduce transmission of several sexually transmitted infections.',
            ],
            answer: 'D：X 改变激素调节，Y 提供可降低多种感染传播风险的物理屏障。',
            steps: [
              '先分别确认两种方法的作用点：X 是排卵调节，Y 是物理屏障。',
              '抑制排卵影响卵细胞释放，不会因此在体液交换处形成屏障；避孕套则可阻挡精子和部分病原体传播。',
              'D 同时说清机制，并使用 can reduce 而非保证完全阻断所有感染，因此最准确。',
            ],
            optionNotes: [
              'A：激素调节不会制造物理屏障。',
              'B：把避孕套的作用写成抑制垂体激素。',
              'C：every 过于绝对，且 X 本身不提供屏障保护。',
              'D：区别了避孕机制和感染传播风险。',
            ],
            takeaway:
              '比较措施时，分别回答**怎样影响受精或排卵、怎样影响病原传播**。这两个答案不能相互替代。',
            variant: {
              question:
                'A copper intrauterine device contains no contraceptive hormones. Does this make it a hormonal method because it acts inside the body?',
              answer: '不是。',
              explanation:
                '分类看作用机制，不看是否放在体内。铜宫内装置不靠外源激素调节排卵；“体内使用”不能作为激素方法的判断标准。',
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
      summary: '理解病原传播、免疫记忆与药物原理，读懂试验和多因素疾病的证据。',
      paragraphs: [
        '遇到疾病题，先区分“病因是什么”和“身体怎样应对”。细菌、病毒、原生生物和真菌中的致病成员都可引起传染病，但不是所有微生物都致病。心血管病、许多癌症及部分肺、肝疾病则常有遗传、环境和生活方式等多种因素共同参与，不能看到相关性就认定只有一个原因。',
        '防御也有层次：皮肤等屏障先减少病原进入，吞噬细胞可吞入并分解病原，特异性免疫再针对抗原形成反应与记忆。治疗、疫苗和阻断传播各有任务。**把措施放到它真正作用的环节，才知道它能做什么、不能据此推断什么**。',
      ],
      rules: [
        {
          title: '病原类别与传播途径',
          text: '致病细菌、病毒、原生生物和真菌可经空气/飞沫、食物与水、接触、体液或媒介等途径传播，具体取决于病原。阻断传播应针对实际途径，如饮水卫生、洗手、通风及控制传播媒介；不能把适用于一种病原的措施自动推广给全部病原。',
        },
        {
          title: 'HIV 与免疫系统',
          text: 'HIV 可经特定感染体液传播，包括性接触相关体液、血液以及母婴传播中的乳汁等；握手和普通共同生活接触不属于其传播途径。HIV 损害辅助性 T 细胞等免疫细胞，未有效控制时可发展为 AIDS，使机体更易遭受机会性感染。**HIV 是病毒，AIDS 是由其导致的严重免疫缺陷状态，二者不是同一名称层级**。',
        },
        {
          title: '屏障、吞噬与抗体',
          text: '皮肤、黏液与纤毛等有助于阻止或清除进入途径上的病原；吞噬细胞可把病原包入并消化。抗原是可被免疫系统识别的分子特征，抗体可与特定抗原结合，中和或帮助清除病原。抗体由 B 淋巴细胞分化形成的浆细胞分泌，**不是所有白细胞都制造抗体**。',
        },
        {
          title: '疫苗与记忆细胞',
          text: '疫苗向免疫系统呈递相关抗原；课程常见例子是灭活病原体或病原体成分，另有减毒及其他技术路线。首次接触后形成相应反应和记忆细胞，之后遇到匹配抗原时通常反应更快、更强。**疫苗帮助机体建立免疫记忆，不等于直接注入现成抗体，也不保证对所有病原都有效**。',
        },
        {
          title: '抗生素为什么不能治疗病毒本身',
          text: '抗生素针对细菌的某些结构或过程，例如细胞壁合成、细菌核糖体等；病毒没有这些完整的细菌机制，依赖宿主细胞复制，所以抗生素不能直接消灭病毒。细菌间也存在敏感性差异及耐药性，不能认为同一种药对所有细菌都有效；抗生素与止痛药的目标不同。',
        },
        {
          title: '把防传播与治疗分开',
          text: '安全的血液制品、避免共用注射针具、屏障措施等可针对 HIV 的传播环节；抗逆转录病毒药物用于抑制 HIV 复制。是否降低传播、是否减少症状、是否抑制病原复制，需要分别看证据。对某种细菌有效的抗生素结果不能直接证明它也对 HIV 有效。',
        },
        {
          title: '新药与疫苗怎样检验',
          text: '临床前研究可用细胞、组织和适当的动物模型了解作用与潜在毒性。经伦理审查后进入人体临床试验，通常先小规模考察安全性和剂量，再扩大研究有效性及不良反应；疫苗试验并非只能招募已患目标疾病的人。随机分组帮助平衡混杂因素，盲法减少预期和观察偏差，对照组提供比较基线；对照可能是安慰剂或标准治疗。样本量、随访时间和不良反应也要一起看，**一次小样本结果不能证明永远安全或人人有效**。',
        },
        {
          title: '多因素非传染性疾病',
          text: '心血管病、许多癌症、部分肺和肝疾病、2 型糖尿病等常受多个因素共同影响。吸烟、营养状况、活动水平、遗传与其他环境暴露可能相互作用。某危险因素提高风险，不代表每个暴露者都会患病；相关性本身也不排除其他解释。',
        },
        {
          title: '心血管病管理的不同作用点',
          text: '他汀类降低血液胆固醇，从而降低相关风险；抗凝药降低血栓形成风险，降压药降低血压。冠脉支架帮助撑开狭窄血管，搭桥为血液提供绕过狭窄部位的通路。戒烟、适量活动和均衡饮食属于长期风险管理。**这些方式作用不同，也不意味着一次手术消除了全部长期风险**；考试比较的是原理，不是为个人选择治疗。',
        },
      ],
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
            title: '免疫记忆为什么有抗原特异性？',
            question:
              'A vaccine contains an inactivated pathogen P. After vaccination, a person produces antibodies to P and memory cells. Later the same person encounters P again. Which explanation best accounts for a faster antibody response?',
            options: [
              'Memory cells specific to P help generate antibody-producing cells more rapidly.',
              'All antibodies have become living memory cells.',
              'The vaccine has killed every P pathogen in the environment.',
              'The same response must occur equally rapidly to every unrelated pathogen.',
            ],
            answer: 'A：针对 P 的记忆细胞帮助更快产生分泌抗体的细胞。',
            steps: [
              '题目说明疫苗后形成了抗体和记忆细胞，这两者并不是一种东西。',
              '再次遇到相同病原的匹配抗原，相应记忆细胞可更快参与反应，产生分泌抗体的细胞。',
              '这种优势依赖相应抗原的识别，不能扩展成对全部无关病原都同样快，所以 A 最准确。',
            ],
            optionNotes: [
              'A：保留了记忆与特异性两个关键条件。',
              'B：抗体是蛋白质，不会直接变成细胞。',
              'C：接种不会清除外界所有病原。',
              'D：把对匹配抗原的记忆错误推广给全部病原。',
            ],
            takeaway:
              '免疫题里先辨认**抗原是被识别的特征，抗体是结合它的分子，记忆细胞保留再次反应的能力**。',
            variant: {
              question:
                'An unvaccinated person is given ready-made antibodies to P. Does this alone show that the person has formed their own memory cells to P?',
              answer: '不能。',
              explanation:
                '获得现成抗体可带来被动保护，但这本身不证明自己的免疫系统已建立相应记忆。不要把“现在有抗体”与“自己形成长期记忆”画等号。',
            },
          },
          {
            title: '人数不同的两组，怎样比较感染风险？',
            question:
              'In a randomised vaccine trial with the same follow-up conditions, 20 of 1000 vaccinated participants and 80 of 1000 control participants develop the target disease. What is the relative reduction in disease risk in the vaccinated group?',
            options: ['6%', '20%', '75%', '80%'],
            answer: 'C：75%。',
            steps: [
              '先求两组患病风险：接种组 20/1000 = 2%，对照组 80/1000 = 8%。',
              '绝对差是 8% − 2% = 6 个百分点；题目问 relative reduction，要再除以对照组风险。',
              '(8% − 2%) ÷ 8% = 6/8 = 75%。这是这次试验中观察到的相对减少，不等于每个接种者都绝不会患病。',
            ],
            optionNotes: [
              'A：6 是百分点差，不是相对减少百分比。',
              'B：把接种组患病人数 20 直接当百分数。',
              'C：以对照组风险为比较基准，计算正确。',
              'D：把对照组人数 80 当成效果百分比。',
            ],
            takeaway:
              '问 absolute difference 就相减；问 relative reduction 就**先相减，再除以对照风险**。组人数不同时，要先换成比例。',
            variant: {
              question:
                'A second trial has 20 cases among 500 vaccinated participants and 80 among 1000 controls. What is the relative risk reduction?',
              answer: '50%。',
              explanation:
                '接种组风险为 4%，对照组为 8%，相对减少 (8% − 4%)/8% = 50%。虽然患病人数仍是 20 与 80，但分母改变，不能沿用 75%。',
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
