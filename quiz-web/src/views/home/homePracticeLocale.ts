// 首页精选题快照的固定翻译，仅处理示例内容，不改写接口题目或正式题库解析。
const fragments: Record<string, string> = {
  '已知条件:': 'Given:',
  '解题步骤:': 'Solution:',
  '选项核对:': 'Checking the options:',
  '结论:': 'Conclusion:',
  '（来源：2025年回忆）': '(Source: 2025 recalled question)',
  '※ 偶函数吃到相反数也给同一个值，这是本题正确项的关键。':
    'An even function has the same value at opposite inputs; this identifies the correct option.',
  '※ 令平方项为非负新变量，在分母零点处分段映射，并保留可取端点。':
    'Substitute a non-negative variable for the square, split the domain at denominator zeros, and retain any attainable endpoints.',
  '※ 答案必须包含边界点并给出见证，例如在边界处验证 $y=0$。':
    'Include the boundary and verify that it is attainable, for example by checking $y=0$ there.',
  '※ 这一步的关键关系是 $3$；后续结论必须同时保留这里的条件。':
    'The key relation in this step involves $3$; retain its conditions in the subsequent reasoning.',
  '※ 这一步的关键关系是 $2$；后续结论必须同时保留这里的条件。':
    'The key relation in this step involves $2$; retain its conditions in the subsequent reasoning.',
  '※ 联合韦达关系与严格判别式，既证明必要性也证明这些条件足够排除负根。':
    'Combine the root relations with the strict discriminant condition to prove necessity and show that the conditions exclude negative roots.',
  '※ 参数使二次项消失时，必须先按一次方程单独检查，不能直接套判别式。':
    'When a parameter eliminates the quadratic term, check the resulting linear equation separately before using the discriminant.',
  '※ 必须把“两个代换根”与“每个代换根产生两个原变量根”分开计数，并保留 $t=0$。':
    'Count the substituted roots separately from the original roots each produces, and retain the case $t=0$.',
  '※ 判断并计算“正比例模型”中的关键关系，区分每个错误选项的首个具体偏差。':
    'Identify and calculate the key relationship in the direct-proportion model, then locate the first error in each incorrect option.',
}

// 按完整固定片段替换，公式与英文原题保持原样；只用于首页静态演示快照。
export function homePracticeEnglish(text: string): string {
  let result = text
  for (const [source, translation] of Object.entries(fragments)) {
    result = result.split(source).join(translation)
  }
  return result.replace(/因此答案为 ([A-Z])。/g, 'Therefore, the answer is $1.')
}
