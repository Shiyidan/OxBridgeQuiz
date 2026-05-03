<template>
  <div ref="container" class="tikz-block">
    <div v-if="loading" class="loading">{{ statusText }}</div>
    <div v-if="error" class="error">图形渲染失败</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  code: string
}

const props = defineProps<Props>()
const container = ref<HTMLElement>()
const loading = ref(true)
const error = ref(false)
const statusText = ref('引擎初始化中...')

onMounted(() => render())

function extractTikzCode(code: string): string {
  const match = code.match(/(\\begin\{(tikzpicture|circuitikz)\}[\s\S]*?\\end\{\2\})/)
  if (match) return match[1]
  return code
    .replace(/\\documentclass(\[.*?\])?\{.*?\}/g, '')
    .replace(/\\usepackage(\[.*?\])?\{.*?\}/g, '')
    .replace(/\\begin\{document\}/g, '')
    .replace(/\\end\{document\}/g, '')
    .trim()
}

function waitForEngine(): Promise<void> {
  if ((window as any).__tikzjaxReady) {
    return Promise.resolve()
  }
  statusText.value = '引擎初始化中...'
  return new Promise(resolve => {
    document.addEventListener('tikzjax-engine-ready', () => resolve(), { once: true })
    // 超时兜底
    setTimeout(() => resolve(), 15000)
  })
}

async function render() {
  if (!container.value) return

  // 等待引擎预热完成
  await waitForEngine()

  statusText.value = '正在渲染图形...'
  const tikz = extractTikzCode(props.code)

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;visibility:hidden;'

  const script = document.createElement('script')
  script.type = 'text/tikz'
  script.textContent = tikz
  wrapper.appendChild(script)

  let resolved = false
  const done = (ok: boolean) => {
    if (resolved) return
    resolved = true
    script.removeEventListener('tikzjax-load-finished', onFinish)
    clearTimeout(timeout)
    if (ok) {
      const svg = wrapper.querySelector('svg')
      if (svg && container.value) {
        container.value.innerHTML = ''
        container.value.appendChild(svg.cloneNode(true))
        loading.value = false
      }
    } else {
      error.value = true
      loading.value = false
    }
    if (document.body.contains(wrapper)) document.body.removeChild(wrapper)
  }

  const onFinish = () => done(true)
  script.addEventListener('tikzjax-load-finished', onFinish)

  const timeout = setTimeout(() => {
    done(!!wrapper.querySelector('svg'))
  }, 12000)

  document.body.appendChild(wrapper)
}
</script>

<style scoped>
.tikz-block { margin: 16px 0; text-align: center; min-height: 60px; }
.tikz-block :deep(svg) { max-width: 100%; height: auto; }
.loading { color: #666; padding: 12px; background: #f5f5f5; border-radius: 4px; font-size: 13px; }
.error { color: #ff4d4f; padding: 12px; background: #fff2f0; border-radius: 4px; font-size: 13px; }
</style>
