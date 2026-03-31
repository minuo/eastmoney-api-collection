<template>
  <div class="notes-page">
    <div class="notes-sidebar">
      <div class="sidebar-header">
        <h3>📝 笔记列表</h3>
        <button class="btn btn-primary btn-sm" @click="createNewNote">+ 新建</button>
      </div>
      <div class="notes-list">
        <div
          v-for="note in notes"
          :key="note.id"
          :class="['note-item', { active: currentNote?.id === note.id }]"
          @click="selectNote(note)"
        >
          <div class="note-title">{{ note.title || '无标题' }}</div>
          <div class="note-preview">{{ getPreview(note.content) }}</div>
          <div class="note-date">{{ formatDate(note.updatedAt || note.createdAt) }}</div>
        </div>
      </div>
    </div>

    <div class="notes-editor">
      <div v-if="!currentNote" class="empty-state">
        <p>选择或创建一个笔记开始编辑</p>
      </div>
      <template v-else>
        <div class="editor-header">
          <input
            v-model="currentNote.title"
            class="title-input"
            placeholder="笔记标题"
            @input="saveCurrentNote"
          />
          <div class="editor-actions">
            <button
              :class="['btn', 'btn-sm', { active: !isPreview }]"
              @click="isPreview = false"
            >
              编辑
            </button>
            <button
              :class="['btn', 'btn-sm', { active: isPreview }]"
              @click="isPreview = true"
            >
              预览
            </button>
            <button class="btn btn-danger btn-sm" @click="deleteCurrentNote">删除</button>
          </div>
        </div>

        <div class="editor-content">
          <textarea
            v-if="!isPreview"
            v-model="currentNote.content"
            class="content-textarea"
            placeholder="使用 Markdown 格式编写笔记..."
            @input="saveCurrentNote"
          />
          <div
            v-else
            class="content-preview"
            v-html="renderedContent"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFundStore } from '../stores/fundStore'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const fundStore = useFundStore()

const notes = computed(() => fundStore.notes)
const currentNote = ref(null)
const isPreview = ref(false)

const renderedContent = computed(() => {
  if (!currentNote.value?.content) return ''
  const html = marked(currentNote.value.content)
  return DOMPurify.sanitize(html)
})

const createNewNote = () => {
  const newNote = {
    title: '',
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  fundStore.addNote(newNote)
  currentNote.value = notes.value[notes.value.length - 1]
  isPreview.value = false
}

const selectNote = (note) => {
  currentNote.value = { ...note }
  isPreview.value = false
}

const saveCurrentNote = () => {
  if (currentNote.value) {
    fundStore.updateNote(currentNote.value.id, {
      title: currentNote.value.title,
      content: currentNote.value.content,
      updatedAt: new Date().toISOString()
    })
  }
}

const deleteCurrentNote = () => {
  if (currentNote.value && confirm('确定要删除这个笔记吗？')) {
    fundStore.removeNote(currentNote.value.id)
    currentNote.value = null
  }
}

const getPreview = (content) => {
  if (!content) return ''
  return content.substring(0, 50) + (content.length > 50 ? '...' : '')
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  if (notes.value.length > 0 && !currentNote.value) {
    selectNote(notes.value[0])
  }
})
</script>

<style scoped>
.notes-page {
  display: flex;
  height: calc(100vh - 80px);
  gap: 1rem;
}

.notes-sidebar {
  width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
}

.notes-list {
  flex: 1;
  overflow-y: auto;
}

.note-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s ease;
}

.note-item:hover {
  background: #f8f9fa;
}

.note-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.note-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.note-preview {
  font-size: 0.875rem;
  opacity: 0.7;
  margin-bottom: 0.25rem;
}

.note-date {
  font-size: 0.75rem;
  opacity: 0.5;
}

.notes-editor {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.editor-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.title-input {
  flex: 1;
  border: none;
  font-size: 1.25rem;
  font-weight: 600;
  outline: none;
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

.editor-actions .btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.editor-content {
  flex: 1;
  overflow: hidden;
}

.content-textarea {
  width: 100%;
  height: 100%;
  border: none;
  padding: 1rem;
  font-size: 1rem;
  line-height: 1.6;
  resize: none;
  outline: none;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.content-preview {
  width: 100%;
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
  line-height: 1.6;
}

.content-preview :deep(h1),
.content-preview :deep(h2),
.content-preview :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
}

.content-preview :deep(p) {
  margin-bottom: 1rem;
}

.content-preview :deep(ul),
.content-preview :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.content-preview :deep(code) {
  background: #f4f4f4;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.content-preview :deep(pre) {
  background: #f4f4f4;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.content-preview :deep(pre code) {
  background: none;
  padding: 0;
}

.content-preview :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 1rem;
  margin-left: 0;
  color: #666;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}
</style>
