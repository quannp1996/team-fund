import { createRouter, createWebHistory } from 'vue-router'
import Teams from '../components/Teams.vue'
import Transactions from '../components/Transactions.vue'
import JoinGroup from '../components/JoinGroup.vue'

const routes = [
  { path: '/', component: Teams },
  { path: '/group/:id', component: Transactions, props: true },
  { path: '/join/:id', component: JoinGroup, props: true },
]

const router = createRouter({
  history: createWebHistory('/team-fund/'),
  routes,
})

export default router