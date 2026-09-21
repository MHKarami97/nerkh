import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import AssetDetailView from './views/AssetDetailView.vue'

// Hash-based history (#/asset/xyz) is used deliberately: GitHub Pages is
// pure static hosting with no server-side rewrite rules, so a normal
// history-mode route would 404 on a hard refresh of a deep link. Hash
// routing needs zero extra server configuration.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/asset/:symbol', name: 'asset-detail', component: AssetDetailView },
  ],
  // Always start a new page at the top instead of keeping whatever scroll
  // position the previous page was at.
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})
