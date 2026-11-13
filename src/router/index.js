import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import FormContainerView from '../views/FormContainerView.vue'
import TersimpanView from '../views/TersimpanView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/input/:kode',
    name: 'FormInput',
    component: FormContainerView,
  },
  {
    path: '/tersimpan',
    name: 'Tersimpan',
    component: TersimpanView,
  },
  // Fallback redirect ke Home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
