import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import FundDetail from '../views/FundDetail.vue'
import Notes from '../views/Notes.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/fund/:code',
    name: 'FundDetail',
    component: FundDetail
  },
  {
    path: '/notes',
    name: 'Notes',
    component: Notes
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
