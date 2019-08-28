import Vue from 'vue'
import Router from 'vue-router'
import store from './store'

import Home from './components/Home.vue'
import Addons from './components/Addons.vue'
import Browse from './components/Browse.vue'
import Settings from './components/Settings.vue'
import Login from './components/Login.vue'

Vue.use(Router)

let router = new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home,
            meta: {
                requiresAuth: true
            },
            children: [
                {
                    path: '/addons',
                    name: 'addons',
                    component: Addons,
                    meta: {
                        requiresAuth: true
                    }
                },
                {
                    path: '/browse',
                    name: 'browse',
                    component: Browse,
                    meta: {
                        requiresAuth: true
                    }
                },
                {
                    path: '/settings',
                    name: 'settings',
                    component: Settings,
                    meta: {
                        requiresAuth: true
                    }
                }
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        }
    ]
})

router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (store.getters['auth/isLoggedIn']) {
            next()
            return
        }
        next('/login')
    } else {
        next()
    }
})

export default router
