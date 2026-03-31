import { defineStore } from 'pinia'
import { ref } from 'vue'

const safeJSONParse = (str, defaultValue) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('JSON解析失败:', e);
    return defaultValue;
  }
};

const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('localStorage不可用:', e);
    return false;
  }
};

const storageAvailable = isStorageAvailable();

export const useFundStore = defineStore('fund', () => {
  const holdings = ref([])
  const watchlist = ref([])
  const notes = ref([])

  const loadFromStorage = () => {
    if (!storageAvailable) return;
    
    try {
      const savedHoldings = localStorage.getItem('fundHoldings')
      const savedWatchlist = localStorage.getItem('fundWatchlist')
      const savedNotes = localStorage.getItem('fundNotes')
      
      if (savedHoldings) holdings.value = safeJSONParse(savedHoldings, [])
      if (savedWatchlist) watchlist.value = safeJSONParse(savedWatchlist, [])
      if (savedNotes) notes.value = safeJSONParse(savedNotes, [])
    } catch (e) {
      console.error('从localStorage加载数据失败:', e);
    }
  }

  const saveHoldings = () => {
    if (!storageAvailable) return;
    try {
      localStorage.setItem('fundHoldings', JSON.stringify(holdings.value))
    } catch (e) {
      console.error('保存持仓数据失败:', e);
    }
  }

  const saveWatchlist = () => {
    if (!storageAvailable) return;
    try {
      localStorage.setItem('fundWatchlist', JSON.stringify(watchlist.value))
    } catch (e) {
      console.error('保存自选数据失败:', e);
    }
  }

  const saveNotes = () => {
    if (!storageAvailable) return;
    try {
      localStorage.setItem('fundNotes', JSON.stringify(notes.value))
    } catch (e) {
      console.error('保存笔记数据失败:', e);
    }
  }

  const addHolding = (fund) => {
    if (!fund || !fund.code) {
      console.error('添加持仓失败: 缺少必要信息');
      return;
    }
    
    holdings.value.push({
      ...fund,
      id: Date.now(),
      createdAt: new Date().toISOString()
    })
    saveHoldings()
  }

  const updateHolding = (id, updates) => {
    const index = holdings.value.findIndex(h => h.id === id)
    if (index !== -1) {
      holdings.value[index] = { ...holdings.value[index], ...updates }
      saveHoldings()
    }
  }

  const removeHolding = (id) => {
    holdings.value = holdings.value.filter(h => h.id !== id)
    saveHoldings()
  }

  const addToWatchlist = (fund) => {
    if (!fund || !fund.code) {
      console.error('添加自选失败: 缺少必要信息');
      return;
    }
    
    if (!watchlist.value.find(w => w.code === fund.code)) {
      watchlist.value.push({
        ...fund,
        id: Date.now(),
        createdAt: new Date().toISOString()
      })
      saveWatchlist()
    }
  }

  const removeFromWatchlist = (id) => {
    watchlist.value = watchlist.value.filter(w => w.id !== id)
    saveWatchlist()
  }

  const addNote = (note) => {
    if (!note) {
      console.error('添加笔记失败: 缺少笔记数据');
      return;
    }
    
    notes.value.push({
      ...note,
      id: Date.now(),
      createdAt: new Date().toISOString()
    })
    saveNotes()
  }

  const updateNote = (id, updates) => {
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notes.value[index] = { ...notes.value[index], ...updates, updatedAt: new Date().toISOString() }
      saveNotes()
    }
  }

  const removeNote = (id) => {
    notes.value = notes.value.filter(n => n.id !== id)
    saveNotes()
  }

  const exportData = () => {
    try {
      return JSON.stringify({
        holdings: holdings.value,
        watchlist: watchlist.value,
        notes: notes.value,
        exportedAt: new Date().toISOString()
      }, null, 2)
    } catch (e) {
      console.error('导出数据失败:', e);
      return null;
    }
  }

  const importData = (jsonData) => {
    try {
      const data = JSON.parse(jsonData)
      
      if (!data || typeof data !== 'object') {
        throw new Error('无效的JSON数据格式');
      }
      
      if (data.holdings && Array.isArray(data.holdings)) {
        holdings.value = data.holdings;
      }
      if (data.watchlist && Array.isArray(data.watchlist)) {
        watchlist.value = data.watchlist;
      }
      if (data.notes && Array.isArray(data.notes)) {
        notes.value = data.notes;
      }
      
      saveHoldings();
      saveWatchlist();
      saveNotes();
      
      return true;
    } catch (e) {
      console.error('导入数据失败:', e);
      return false;
    }
  }

  loadFromStorage()

  return {
    holdings,
    watchlist,
    notes,
    addHolding,
    updateHolding,
    removeHolding,
    addToWatchlist,
    removeFromWatchlist,
    addNote,
    updateNote,
    removeNote,
    exportData,
    importData,
    loadFromStorage
  }
})
