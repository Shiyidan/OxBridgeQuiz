<!-- 分配律的固定面积分块示意：图形只解释正长度模型，代数公式仍由统一组件渲染。 -->
<template>
  <figure class="expansion-figure">
    <figcaption>四个部分，四个乘积</figcaption>
    <div class="expansion-layout">
      <svg
        class="expansion-plot"
        viewBox="0 0 360 220"
        role="img"
        aria-label="长为x加2，宽为y加3的矩形，分成xy、2y、3x和6四部分；x和y为正数"
      >
        <title>用面积分块表示 (x+2)(y+3)</title>
        <rect x="52" y="35" width="180" height="100" class="area-primary" />
        <rect x="232" y="35" width="72" height="100" class="area-cross" />
        <rect x="52" y="135" width="180" height="60" class="area-cross" />
        <rect x="232" y="135" width="72" height="60" class="area-constant" />
        <text x="142" y="23">x</text>
        <text x="268" y="23">2</text>
        <text x="31" y="91">y</text>
        <text x="31" y="170">3</text>
        <text x="142" y="91">xy</text>
        <text x="268" y="91">2y</text>
        <text x="142" y="170">3x</text>
        <text x="268" y="170">6</text>
      </svg>
      <div class="expansion-notes">
        <KnowledgeText :text="expansion" />
        <p>每块面积来自一段横边乘一段竖边，最后把四块相加。</p>
        <p class="expansion-caption">
          面积示意要求 x、y &gt; 0，图形不按未知长度的比例绘制；等式本身对所有实数 x、y 都成立。
        </p>
      </div>
    </div>
  </figure>
</template>
<script setup lang="ts">
import KnowledgeText from './KnowledgeText.vue'
const expansion = String.raw`$(x+2)(y+3)=xy+3x+2y+6$`
</script>
<style scoped>
.expansion-figure {
  container-type: inline-size;
  margin: 0;
  padding: 14px 16px;
  border: 1px solid #d8e3f5;
  border-radius: 8px;
  background: #f7faff;
  color: #33465d;
}
figcaption {
  font-size: 16px;
  font-weight: 700;
  color: #1d3049;
}
.expansion-layout {
  display: grid;
  gap: 12px 24px;
  align-items: center;
  margin-top: 10px;
}
.expansion-plot {
  display: block;
  width: 100%;
  max-width: 360px;
  height: auto;
  margin: 0 auto;
}
.expansion-plot rect {
  stroke: #6688bd;
  stroke-width: 1.5;
}
.expansion-plot text {
  fill: #233e65;
  font-size: 16px;
  text-anchor: middle;
}
.area-primary {
  fill: #dfe9ff;
}
.area-cross {
  fill: #def1ec;
}
.area-constant {
  fill: #fff1d7;
}
.expansion-notes {
  min-width: 0;
  font-size: 15px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.expansion-notes p {
  margin: 7px 0 0;
}
.expansion-notes .expansion-caption {
  color: #64748b;
  font-size: 13px;
}
@container (min-width: 740px) {
  .expansion-layout {
    grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  }
}
</style>
