// 首页静态课程节选：依据现有讲义组织图解旁的推理链，公式使用统一 KnowledgeText 渲染。
export interface HomeStaticLesson {
  title: string
  subtitle: string
  given: string
  caption: string
  steps: Array<{ label: string; text: string }>
  conclusion: string
  boundary: string
}

// 各科对应学习平台的具体章节；此处只压缩讲义展示，不替代正式课程或题库。
export const homeStaticLessons: Record<string, HomeStaticLesson> = {
  mathematics2: {
    title: '先看清边界，再把面积积出来。',
    subtitle: '定积分与面积 · 交点、切片与对称性',
    given: String.raw`求 $y=9-x^2$ 与 $y=5$ 围成的区域面积。`,
    caption: String.raw`每一条竖直切片的高度都是 $(9-x^2)-5$。`,
    steps: [
      { label: '确定边界', text: String.raw`$9-x^2=5\ \Rightarrow\ x=-2,\ 2$` },
      { label: '上减下', text: String.raw`$A=\int_{-2}^{2}[(9-x^2)-5]\,dx$` },
      { label: '利用对称', text: String.raw`$A=2\int_0^2(4-x^2)\,dx=2[4x-\frac{x^3}{3}]_0^2$` },
    ],
    conclusion: String.raw`$A=\dfrac{32}{3}$，且 $0<A<4\times4=16$。`,
    boundary: '切片高度必须非负；两曲线若交换上下位置，应在交点处分段。',
  },
  biology: {
    title: '已知未患病，概率就要重新算。',
    subtitle: '单基因杂交与家系图 · 从基因型到下一代概率',
    given: String.raw`常染色体隐性遗传：父母 $Aa\times Aa$，女儿未患病，其配偶为 $Aa$。`,
    caption: '排除 aa 后，余下三种等可能组合中有两种是携带者。',
    steps: [
      { label: '先筛选', text: String.raw`$P(Aa\mid\text{未患病})=\frac{2/4}{3/4}=\frac23$` },
      {
        label: '再传递',
        text: String.raw`若女儿为 $Aa$，与 $Aa$ 配偶生出 $aa$ 的概率为 $\frac14$。`,
      },
      {
        label: '合并路径',
        text: String.raw`$P(\text{子代患病})=\frac23\times\frac14+\frac13\times0$`,
      },
    ],
    conclusion: String.raw`下一代患病概率为 $\dfrac16$，不是 $\dfrac18$。`,
    boundary: '按单基因、完全显隐性模型推理；AA 与 Aa 两个名称不代表两种等可能结果。',
  },
  chemistry: {
    title: '改变反应路径，不改变能量终点。',
    subtitle: '活化能与催化剂 · 区分能垒、焓变与平衡',
    given: String.raw`放热反应：$E_{a,f}=150$，$\Delta H=-100\ \mathrm{kJ\,mol^{-1}}$。`,
    caption: '能量路径示意：峰顶相对反应物与产物的高度，分别对应正、逆向能垒。',
    steps: [
      {
        label: '认准基准',
        text: String.raw`$\Delta H=H_{\mathrm{products}}-H_{\mathrm{reactants}}$`,
      },
      { label: '反推逆向', text: String.raw`$E_{a,r}=E_{a,f}-\Delta H=150-(-100)=250$` },
      { label: '比较路径', text: '催化剂降低正、逆反应的活化能；反应物与产物的能级保持不变。' },
    ],
    conclusion: String.raw`$E_{a,r}=250\ \mathrm{kJ\,mol^{-1}}$；催化不改变 $\Delta H$。`,
    boundary: '同温下催化剂缩短达到平衡的时间，不改变平衡常数或平衡组成。',
  },
  physics: {
    title: '温度变化，怎样变成电压信号？',
    subtitle: '电路 · 热敏电阻、串联分压与信号方向',
    given: String.raw`恒压 $6\,\mathrm V$，定值电阻 $2\,\mathrm{k\Omega}$ 与 NTC 串联。`,
    caption: '输出取自 NTC 两端；升温后阻值由 4 kΩ 降至 1 kΩ。',
    steps: [
      { label: '同一电流', text: String.raw`$I=\frac{V_s}{R+R_T},\quad V_{\mathrm{out}}=IR_T$` },
      { label: '建立分压', text: String.raw`$V_{\mathrm{out}}=V_s\frac{R_T}{R+R_T}$` },
      {
        label: '代入两态',
        text: String.raw`$6\times\frac4{2+4}=4\,\mathrm V\quad\to\quad6\times\frac1{2+1}=2\,\mathrm V$`,
      },
    ],
    conclusion: String.raw`升温：$R_T\downarrow\ \Rightarrow\ I\uparrow\ \Rightarrow\ V_{\mathrm{out}}\downarrow$。`,
    boundary: '假设输出不带负载、电源电压恒定；若改取定值电阻两端电压，变化方向相反。',
  },
  'tmua-math2': {
    title: '复合函数的最值，先问输入能到哪里。',
    subtitle: '函数与常见函数性质 · 值域传递与取等条件',
    given: String.raw`$g$ 的实际值域为 $[-2,2]$，求 $g(x)^2-g(x)$ 的值域。`,
    caption: String.raw`令 $u=g(x)$，只研究 $u\in[-2,2]$ 上的 $u^2-u$。`,
    steps: [
      { label: '换元限域', text: String.raw`$u=g(x)\in[-2,2],\quad F(u)=u^2-u$` },
      {
        label: '检查内部',
        text: String.raw`$F(u)=(u-\frac12)^2-\frac14,\quad F(\frac12)=-\frac14$`,
      },
      { label: '比较端点', text: String.raw`$F(-2)=6,\quad F(2)=2$；内部最小，左端最大。` },
    ],
    conclusion: String.raw`复合函数的值域为 $\left[-\dfrac14,\ 6\right]$。`,
    boundary: 'g 需取遍给定区间，才能保证所有中间值和两端极值可达；仅有上下界还不够。',
  },
  'tmua-logic': {
    title: '能推出，不代表能倒推。',
    subtitle: '必要条件与充分条件 · 命题方向、逆否与反例',
    given: String.raw`在实数范围内，令 $P:x>2$，$Q:x^2>4$。`,
    caption: 'P 的成立范围包含在 Q 中；Q 还包含 x < −2 这一段。',
    steps: [
      { label: '正向成立', text: String.raw`$x>2\Rightarrow x^2>4$，因此 $P\Rightarrow Q$。` },
      { label: '逆向用反例', text: String.raw`$x=-3$ 时 $x^2=9>4$，但 $x>2$ 不成立。` },
      {
        label: '逆否才等价',
        text: String.raw`$P\Rightarrow Q\ \Longleftrightarrow\ \neg Q\Rightarrow\neg P$，即 $x^2\le4\Rightarrow x\le2$。`,
      },
    ],
    conclusion: String.raw`$P$ 是 $Q$ 的充分不必要条件；$Q$ 是 $P$ 的必要不充分条件。`,
    boundary: '论域是条件的一部分：若改为 x ≥ 0，则两者等价。逆命题与逆否命题不能混淆。',
  },
}
