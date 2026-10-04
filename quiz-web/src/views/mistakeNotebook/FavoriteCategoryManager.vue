<!-- 错题本收藏分类管理抽屉：在收藏列表和详情中创建、重命名、排序和删除分类。 -->
<template>
  <el-drawer
    :model-value="modelValue"
    title="管理收藏分类"
    size="460px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <p class="category-hint">{{ examType }} · 每道收藏题目归入一个分类，方便集中复习。</p>
    <div class="category-create">
      <el-input
        v-model="newName"
        maxlength="40"
        placeholder="新分类名称，如：重点复习"
        aria-label="新分类名称"
        @keyup.enter="create"
      />
      <AppButton size="small" :loading="busy" :disabled="!newName.trim()" @click="create"
        >创建</AppButton
      >
    </div>
    <p v-if="!categories.length" class="category-hint">还没有分类，创建后即可整理收藏的题目。</p>
    <div v-for="(category, index) in categories" :key="category.id" class="category-row">
      <div class="category-row__name">
        <el-input
          v-if="editing === category.id"
          v-model="editName"
          maxlength="40"
          aria-label="修改分类名称"
          @keyup.enter="rename(category.id)"
        />
        <span v-else
          >{{ category.name }} <small>{{ category.count }} 题</small></span
        >
      </div>
      <div class="category-row__actions">
        <AppButton
          v-if="editing === category.id"
          type="text"
          size="mini"
          :disabled="busy || !editName.trim()"
          @click="rename(category.id)"
          >保存</AppButton
        >
        <AppButton v-else type="text" size="mini" :disabled="busy" @click="startRename(category)"
          >重命名</AppButton
        >
        <AppButton
          type="text"
          size="mini"
          :icon="ArrowUp"
          icon-only
          :aria-label="`上移${category.name}`"
          :disabled="busy || index === 0"
          @click="move(index, -1)"
        />
        <AppButton
          type="text"
          size="mini"
          :icon="ArrowDown"
          icon-only
          :aria-label="`下移${category.name}`"
          :disabled="busy || index === categories.length - 1"
          @click="move(index, 1)"
        />
        <AppButton type="text" size="mini" :disabled="busy" @click="deleting = category"
          >删除</AppButton
        >
      </div>
    </div>
    <AppDialog
      :model-value="Boolean(deleting)"
      title="删除分类"
      confirm-text="删除分类"
      confirm-type="danger"
      :loading="busy"
      @update:model-value="deleting = null"
      @confirm="remove"
    >
      删除“{{ deleting?.name }}”后，其中的 {{ deleting?.count }} 道题目会移至未分类，收藏仍然保留。
    </AppDialog>
  </el-drawer>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import AppDialog from '@/components/AppDialog.vue'
import {
  createFavoriteCategory,
  renameFavoriteCategory,
  deleteFavoriteCategory,
  reorderFavoriteCategories,
  type FavoriteCategory,
} from '@/api/favorites'
import { useFavoritesStore } from '@/stores/favorites'
const props = defineProps<{
  modelValue: boolean
  examType: string
  categories: FavoriteCategory[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const store = useFavoritesStore()
const newName = ref('')
const editing = ref('')
const editName = ref('')
const deleting = ref<FavoriteCategory | null>(null)
const busy = ref(false)
// 统一锁定重复提交，失败时保留输入供用户修改后重试。
async function mutate(action: () => Promise<unknown>) {
  if (busy.value) return
  busy.value = true
  try {
    await action()
    store.revision++
  } catch {
    /* 公共请求层呈现错误。 */
  } finally {
    busy.value = false
  }
}
// 新分类默认排在当前列表末尾。
async function create() {
  if (!newName.value.trim()) return
  await mutate(async () => {
    await createFavoriteCategory(props.examType, newName.value.trim())
    newName.value = ''
  })
}
// 编辑时复制名称，取消或失败不会提前改变分类标签。
function startRename(category: FavoriteCategory) {
  editing.value = category.id
  editName.value = category.name
}
// 成功后再结束名称编辑。
async function rename(id: string) {
  if (!editName.value.trim()) return
  await mutate(async () => {
    await renameFavoriteCategory(id, editName.value.trim())
    editing.value = ''
  })
}
// 删除分类由服务端保留题目并清空分类归属。
async function remove() {
  if (!deleting.value) return
  const id = deleting.value.id
  await mutate(async () => {
    await deleteFavoriteCategory(id)
    Object.values(store.states).forEach((item) => {
      if (item?.categoryId === id) item.categoryId = null
    })
    deleting.value = null
  })
}
// 用户移动分类后提交完整顺序，刷新页面仍保持该顺序。
async function move(index: number, offset: number) {
  const ids = props.categories.map((item) => item.id)
  const id = ids[index]
  const target = ids[index + offset]
  if (!id || !target) return
  ids[index] = target
  ids[index + offset] = id
  await mutate(() => reorderFavoriteCategories(props.examType, ids))
}
</script>
<style scoped>
.category-hint {
  color: #737b88;
  font-size: 14px;
  line-height: 1.7;
  margin: 0 0 24px;
}
.category-create {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.category-row {
  border-top: 1px solid #edf0f3;
  padding: 16px 0;
}
.category-row__name {
  overflow-wrap: anywhere;
}
.category-row__name small {
  color: #8a929f;
  margin-left: 8px;
}
.category-row__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;
}
</style>
