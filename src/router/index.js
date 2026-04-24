import { createRouter, createWebHistory } from 'vue-router'
import Teams from '../components/Teams.vue'
import Transactions from '../components/Transactions.vue'

const routes = [
  { path: '/', component: Teams },
  { path: '/group/:id', component: Transactions, props: true },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router