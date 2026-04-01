<template>
  <div class="fund-detail">
    <div class="detail-header">
      <button class="btn btn-secondary" @click="goBack">← 返回</button>
      <h2>{{ fundName }} ({{ fundCode }})</h2>
    </div>

    <div class="two-column">
      <div class="main-content">
        <div class="card">
          <h3>📊 收益率走势</h3>
          <div class="chart-controls">
            <select v-model="range" @change="loadYieldData">
              <option value="1m">近1月</option>
              <option value="3m">近3月</option>
              <option value="6m">近6月</option>
              <option value="y">近1年</option>
              <option value="3y">近3年</option>
            </select>
            <select v-model="benchmark" @change="loadYieldData">
              <option value="000300">沪深300</option>
              <option value="000001">上证指数</option>
              <option value="399001">深证成指</option>
            </select>
          </div>
          <div ref="yieldChart" class="chart"></div>
        </div>

        <div class="card">
          <h3>📈 净值走势</h3>
          <div class="chart-controls">
            <select v-model="netRange" @change="loadNetData">
              <option value="1m">近1月</option>
              <option value="3m">近3月</option>
              <option value="6m">近6月</option>
              <option value="y">近1年</option>
            </select>
            <label v-for="indicator in indicators" :key="indicator.key">
              <input type="checkbox" v-model="indicator.enabled" @change="updateNetChart">
              {{ indicator.name }}
            </label>
          </div>
          <div ref="netChart" class="chart"></div>
        </div>
      </div>

      <div class="sidebar">
        <div class="card">
          <h3>💼 持仓管理</h3>
          <div v-if="holding" class="holding-info">
            <div class="info-row">
              <span>成本价:</span>
              <span>{{ holding.costPrice }}</span>
            </div>
            <div class="info-row">
              <span>份额:</span>
              <span>{{ holding.shares }}</span>
            </div>
            <div class="info-row">
              <span>金额:</span>
              <span>{{ (holding.costPrice * holding.shares).toFixed(2) }}</span>
            </div>
            <button class="btn btn-danger" @click="removeHolding">删除持仓</button>
          </div>
          <div v-else class="no-holding">
            <p>暂无持仓</p>
            <button class="btn btn-primary" @click="showAddHolding = true">添加持仓</button>
          </div>
        </div>

        <div class="card">
          <h3>📝 相关笔记</h3>
          <div v-if="relatedNotes.length === 0" class="empty">暂无相关笔记</div>
          <div v-else class="notes-list">
            <div v-for="note in relatedNotes" :key="note.id" class="note-item" @click="goToNote(note.id)">
              <div class="note-title">{{ note.title }}</div>
              <div class="note-date">{{ formatDate(note.createdAt) }}</div>
            </div>
          </div>
          <button class="btn btn-primary" @click="createNote">+ 新建笔记</button>
        </div>
      </div>
    </div>

    <div v-if="showAddHolding" class="modal">
      <div class="modal-content">
        <h3>添加持仓</h3>
        <form @submit.prevent="addHolding">
          <div class="form-group">
            <label>成本价</label>
            <input v-model.number="newHolding.costPrice" type="number" step="0.001" required>
          </div>
          <div class="form-group">
            <label>份额</label>
            <input v-model.number="newHolding.shares" type="number" step="0.01" required>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showAddHolding = false">取消</button>
            <button type="submit" class="btn btn-primary">添加</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFundStore } from '../stores/fundStore'
import { api } from '../services/api'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const fundStore = useFundStore()

const fundCode = computed(() => route.params.code)
const fundName = ref('基金详情')

const range = ref('y')
const benchmark = ref('000300')
const netRange = ref('y')

const yieldChart = ref(null)
const netChart = ref(null)
let yieldChartInstance = null
let netChartInstance = null

const holding = computed(() => {
  return fundStore.holdings.find(h => h.code === fundCode.value)
})

const relatedNotes = computed(() => {
  return fundStore.notes.filter(n => n.fundCode === fundCode.value)
})

const showAddHolding = ref(false)
const newHolding = ref({ costPrice: 0, shares: 0 })

const indicators = ref([
  { key: 'ma', name: 'MA', enabled: true },
  { key: 'rsi', name: 'RSI', enabled: false },
  { key: 'bias', name: 'BIAS', enabled: false }
])

const loadYieldData = async () => {
  console.log('loadYieldData', fundCode.value, benchmark.value, range.value)
  const data = await api.getFundAccumulatedPerformance(fundCode.value, benchmark.value, range.value)
  if (data && data.data) {
    updateYieldChart(data.data)
  }
}

const updateYieldChart = (data) => {
  if (!yieldChartInstance) return

  const dates = data.map(item => item.pdate)
  const fundYield = data.map(item => parseFloat(item.yield))
  const indexYield = data.map(item => parseFloat(item.indexYield))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['基金收益率', '基准收益率']
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%' }
    },
    series: [
      {
        name: '基金收益率',
        type: 'line',
        data: fundYield,
        smooth: true,
        lineStyle: { color: '#667eea', width: 2 }
      },
      {
        name: '基准收益率',
        type: 'line',
        data: indexYield,
        smooth: true,
        lineStyle: { color: '#764ba2', width: 2 }
      }
    ]
  }

  yieldChartInstance.setOption(option)
}

const loadNetData = async () => {
  console.log('loadNetData', fundCode.value, netRange.value)
  const data = await api.getFundNetList(fundCode.value)
  if (data) {
    updateNetChart(data)
  }
}

const updateNetChart = (data) => {
  if (!netChartInstance || !data || !Array.isArray(data)) return

  // 处理API返回的数据
  const dates = data.map(item => item.FSRQ || '')
  const values = data.map(item => parseFloat(item.DWJZ) || 0)

  const series = [{
    name: '单位净值',
    type: 'line',
    data: values,
    smooth: true,
    lineStyle: { color: '#667eea', width: 2 }
  }]

  if (indicators.value.find(i => i.key === 'ma' && i.enabled)) {
    series.push({
      name: 'MA5',
      type: 'line',
      data: values.map((v, i) => i < 4 ? null : values.slice(i-4, i+1).reduce((a, b) => a + b) / 5),
      smooth: true,
      lineStyle: { color: '#f39c12', width: 1 }
    })
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function(params) {
        const date = params[0].axisValue
        const value = params[0].value.toFixed(4)
        return `${date}<br/>单位净值: ${value}`
      }
    },
    legend: {
      data: series.map(s => s.name)
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45,
        interval: Math.floor(dates.length / 10)
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series
  }

  netChartInstance.setOption(option)
}

const addHolding = () => {
  fundStore.addHolding({
    code: fundCode.value,
    name: fundName.value,
    ...newHolding.value
  })
  showAddHolding.value = false
  newHolding.value = { costPrice: 0, shares: 0 }
}

const removeHolding = () => {
  if (holding.value) {
    fundStore.removeHolding(holding.value.id)
  }
}

const createNote = () => {
  router.push('/notes')
}

const goToNote = (noteId) => {
  router.push('/notes')
}

const goBack = () => {
  router.back()
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  yieldChartInstance = echarts.init(yieldChart.value)
  netChartInstance = echarts.init(netChart.value)

  loadYieldData()
  loadNetData()

  window.addEventListener('resize', () => {
    yieldChartInstance?.resize()
    netChartInstance?.resize()
  })
})

onUnmounted(() => {
  yieldChartInstance?.dispose()
  netChartInstance?.dispose()
})
</script>

<style scoped>
.fund-detail {
  padding: 1rem 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-header h2 {
  margin: 0;
}

.chart {
  height: 300px;
  margin-top: 1rem;
}

.chart-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.chart-controls select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.chart-controls label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.holding-info .info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.holding-info .btn {
  margin-top: 1rem;
  width: 100%;
}

.no-holding {
  text-align: center;
  padding: 1rem;
}

.no-holding p {
  color: #999;
  margin-bottom: 1rem;
}

.notes-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 1rem;
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

.empty {
  text-align: center;
  padding: 1rem;
  color: #999;
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
  max-width: 400px;
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
