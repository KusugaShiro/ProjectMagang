import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import FormContainerView from '../views/FormContainerView.vue'
import TersimpanView from '../views/TersimpanView.vue'
import LoginView from '../views/LoginView.vue'
import { isAuthenticated } from '../lib/session'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true },
  },
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
  // Fallback redirect ke Home (guard akan mengarahkan ke /login bila belum masuk)
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

router.beforeEach((to) => {
  if (!to.meta.public && !isAuthenticated.value) {
    return {
      name: 'Login',
      query: to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : {},
    }
  }
  if (to.name === 'Login' && isAuthenticated.value) {
    return { path: '/' }
  }
  return true
})
