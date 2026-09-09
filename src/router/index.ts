import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../modules/home/pages/Home.vue')
    },
    {
      path: '/games',
      name: 'games',
      component: () => import('../modules/games/pages/Games.vue')
    },
    {
      path: '/games/:gameId',
      name: 'game',
      component: () => import('../modules/games/pages/Game.vue')
    },
    {
      path: '/rules',
      name: 'rules',
      component: () => import('../modules/rules/pages/Rules.vue')
    }
  ]
});

export default router;
