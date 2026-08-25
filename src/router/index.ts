import { createRouter, createWebHistory } from 'vue-router'
import SearchView from '../views/SearchView/SearchView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/grid',
      name: 'grid',
      component: () => import('../views/GridView/GridView.vue'),
    },
    {
      path: '/tree',
      name: 'tree',
      component: () => import('../views/TreeView/TreeView.vue'),
    },
  ],
})

export default router
