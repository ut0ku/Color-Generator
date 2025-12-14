import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Library from '../views/Library.vue'
import Export from '../views/Export.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/library',
    name: 'Library',
    component: Library
  },
  {
    path: '/export',
    name: 'Export',
    component: Export
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router