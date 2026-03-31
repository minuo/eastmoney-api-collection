<template>
  <div class="home">
    <div class="indices-section">
      <h2>📈 主要指数</h2>
      <div class="indices-grid">
        <div v-for="index in indices" :key="index.secid" class="index-card card" @click="refreshIndex(index)">
          <div class="index-name">{{ index.name }}</div>
          <div v-if="index.data" class="index-data">
            <div class="index-price">{{ index.data.f2 }}</div>
            <div :class="['index-change', index.data.f4 >= 0 ? 'text-success' : 'text-danger']">
              {{ index.data.f4 >= 0 ? '+' : '' }}{{ index.data.f4 }}%
            </div>
          </div>
          <div v-else class="loading">
            <div class="spinner"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="two-column">
      <div class="sidebar">
        <div class="notes-list-section">
          <div class="section-header">
            <h3>📝 笔记</h3>
            <button class="btn btn-primary btn-sm" @click="goToNotes">+ 新建</button>
          </div>
          <div v-if="notes.length === 0" class="empty-state">暂无笔记</div>
          <div v-else class="notes-list">
            <div v-for="note in notes.slice(0, 5)" :key="note.id" class="note-item">
              <div class="note-title">{{ note.title }}</div>
              <div class="note-date">{{ formatDate(note.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="main-content">
        <div class="funds-section">
          <div class="section-header">
            <div class="tabs">
              <button :class="['tab', { active: activeTab === 'holdings' }]" @click="activeTab = 'holdings'">
                持仓基金 ({{ holdings.length }})
              </button>
              <button :class="['tab', { active: activeTab === 'watchlist' }]" @click="activeTab = 'watchlist'">
                自选基金 ({{ watchlist.length }})
              </button>
            </div>
            <div class="actions">
              <button class="btn btn-primary btn-sm" @click="showAddFund = true">+ 添加基金</button>
              <button class="btn btn-secondary btn-sm" @click="exportData">导出数据</button>
              <label class="btn btn-secondary btn-sm">
                导入数据
                <input type="file" accept=".json" @change="importData" hidden>
              </label>
            </div>
          </div>

          <div class="card">
            <div v-if="currentList.length === 0" class="empty-state">
              {{ activeTab === 'holdings' ? '暂无持仓基金' : '暂无自选基金' }}
            </div>
            <table v-else>
              <thead>
                <tr>
                  <th @click="sortFunds('name')">名称 ↕</th>
                  <th @click="sortFunds('code')">代码</th>
                  <th @click="sortFunds('netValue')">单位净值</th>
                  <th @click="sortFunds('estimatedValue')">估算净值</th>
                  <th @click="sortFunds('costPrice')">成本价</th>
                  <th @click="sortFunds('profit')">收益</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="fund in sortedFunds" :key="fund.id" @click="goToFundDetail(fund.code)">
                  <td>{{ fund.name }}</td>
                  <td>{{ fund.code }}</td>
                  <td>{{ fund.netValue || '--' }}</td>
                  <td>{{ fund.estimatedValue || '--' }}</td>
                  <td>{{ fund.costPrice || '--' }}</td>
                  <td :class="fund.profit >= 0 ? 'text-success' : 'text-danger'">
                    {{ fund.profit ? (fund.profit >= 0 ? '+' : '') + fund.profit : '--' }}
                  </td>
                  <td class="actions-cell">
                    <button class="btn btn-secondary btn-xs" @click.stop="removeFund(fund)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddFund" class="modal">
      <div class="modal-content">
        <h3>添加基金</h3>
        <form @submit.prevent="addFund">
          <div class="form-group">
            <label>基金代码</label>
            <input 
              v-model="newFund.code" 
              required
              @blur="fetchFundName"
              placeholder="输入6位基金代码"
            >
          </div>
          <div class="form-group">
            <label>基金名称</label>
            <input 
              v-model="newFund.name" 
              required
              :disabled="isFetchingName"
              :placeholder="isFetchingName ? '正在获取...' : '输入代码后自动获取或手动填写'">
          </div>
          <div class="form-group" v-if="activeTab === 'holdings'">
            <label>成本价</label>
            <input v-model.number="newFund.costPrice" type="number" step="0.001">
          </div>
          <div class="form-group" v-if="activeTab === 'holdings'">
            <label>份额</label>
            <input v-model.number="newFund.shares" type="number" step="0.01">
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showAddFund = false">取消</button>
            <button type="submit" class="btn btn-primary">添加</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFundStore } from '../stores/fundStore'
import { api, majorIndices } from '../services/api'

const router = useRouter()
const fundStore = useFundStore()

const indices = ref(majorIndices.map(i => ({ ...i, data: null })))
const activeTab = ref('holdings')
const showAddFund = ref(false)
const sortKey = ref('name')
const sortOrder = ref('asc')
const newFund = ref({ code: '', name: '', costPrice: 0, shares: 0 })
const isFetchingName = ref(false)

const holdings = computed(() => fundStore.holdings)
const watchlist = computed(() => fundStore.watchlist)
const notes = computed(() => fundStore.notes)

const currentList = computed(() => activeTab.value === 'holdings' ? holdings.value : watchlist.value)

const sortedFunds = computed(() => {
  return [...currentList.value].sort((a, b) => {
    const aVal = a[sortKey.value] || ''
    const bVal = b[sortKey.value] || ''
    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
})

const sortFunds = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const refreshIndex = async (index) => {
  const data = await api.getStockRealTime(index.secid)
  if (data && data.data && data.data.diff && data.data.diff[0]) {
    index.data = data.data.diff[0]
  }
}

const loadIndices = async () => {
  for (const index of indices.value) {
    await refreshIndex(index)
  }
}

const fetchFundName = async () => {
  const code = newFund.value.code.trim()
  if (code.length === 6) {
    isFetchingName.value = true
    try {
      const name = await api.getFundNameByCode(code)
      if (name) {
        newFund.value.name = name
      }
    } catch (e) {
      console.error('获取基金名称失败:', e)
    } finally {
      isFetchingName.value = false
    }
  }
}

const addFund = () => {
  const fund = { ...newFund.value }
  if (activeTab.value === 'holdings') {
    fundStore.addHolding(fund)
  } else {
    fundStore.addToWatchlist(fund)
  }
  showAddFund.value = false
  newFund.value = { code: '', name: '', costPrice: 0, shares: 0 }
}

const removeFund = (fund) => {
  if (activeTab.value === 'holdings') {
    fundStore.removeHolding(fund.id)
  } else {
    fundStore.removeFromWatchlist(fund.id)
  }
}

const goToFundDetail = (code) => {
  router.push(`/fund/${code}`)
}

const goToNotes = () => {
  router.push('/notes')
}

const exportData = () => {
  const data = fundStore.exportData()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fund-data.json'
  a.click()
  URL.revokeObjectURL(url)
}

const importData = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (fundStore.importData(e.target.result)) {
        alert('导入成功！')
      } else {
        alert('导入失败，请检查文件格式')
      }
    }
    reader.readAsText(file)
  }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadIndices()
})
</script>

<style scoped>
.indices-section {
  margin-bottom: 2rem;
}

.indices-section h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.indices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.index-card {
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.index-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.index-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #666;
}

.index-price {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.index-change {
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab {
  padding: 0.5rem 1rem;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.notes-list-section .section-header {
  margin-bottom: 0.5rem;
}

.notes-list {
  max-height: 400px;
  overflow-y: auto;
}

.note-item {
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s ease;
}

.note-item:hover {
  background: #f8f9fa;
}

.note-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.note-date {
  font-size: 0.875rem;
  color: #999;
}

.actions-cell {
  text-align: center;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
