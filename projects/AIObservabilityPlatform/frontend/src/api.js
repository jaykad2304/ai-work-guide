import axios from 'axios'

const API_BASE = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

export const timelineAPI = {
  getTimeline: (days = 30) => api.get(`/timeline?days=${days}`),
  getDayDetails: (date) => api.get(`/timeline/${date}`),
  getSessionDetail: (sessionId) => api.get(`/timeline/${sessionId}/detail`)
}

export const searchAPI = {
  search: (q, tool = null) => {
    let url = `/search?q=${encodeURIComponent(q)}`
    if (tool) url += `&tool=${tool}`
    return api.get(url)
  },
  searchByTopic: (topic) => api.get(`/search/topic/${topic}`)
}

export const insightsAPI = {
  getPatterns: () => api.get('/insights/patterns'),
  getRecommendations: () => api.get('/insights/recommendations'),
  getStats: () => api.get('/insights/stats'),
  generateInsights: () => api.post('/insights/generate')
}

export const exportAPI = {
  exportJson: () => api.post('/export/json'),
  exportMarkdown: () => api.post('/export/markdown')
}

export const parserAPI = {
  rescan: () => api.post('/rescan')
}

export default api
