import { createRouter, createWebHashHistory } from 'vue-router';
// import Dashboard from './views/Dashboard.js';

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: () => import('./views/Dashboard.js?v=5') // Lazy load with cache bust
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('./views/Login.js?v=14') // Login pagement version
    },
    {
        path: '/otp',
        name: 'OTPVerification',
        component: () => import('./views/OTPVerification.js?v=8') // OTP Verification pagersion
    },
    {
        path: '/access-management',
        name: 'AccessManagement',
        component: () => import('./views/AccessManagement.js?v=20') // Access Management page
    },
    {
        path: '/bot-health',
        name: 'BotHealth',
        component: () => import('./views/BotHealth.js?v=16') // Bot Health page
    },
    {
        path: '/bot-health/drilldown',
        name: 'BotHealthDrilldown',
        component: () => import('./views/BotHealthDrilldown.js?v=8') // Bot Health Drilldown page
    },
    {
        path: '/trading-activity',
        name: 'TradingActivity',
        component: () => import('./views/TradingActivity.js?v=19') // Trading Activity page
    },
    {
        path: '/trading-activity/drilldown',
        name: 'TradingActivityDrilldown',
        component: () => import('./views/TradingActivityDrilldown.js?v=10') // Trading Activity Drilldown page
    },
    {
        path: '/pipeline',
        name: 'Pipeline',
        component: () => import('./views/Pipeline.js?v=12') // Pipeline page
    },
    {
        path: '/pipeline/drilldown',
        name: 'PipelineDrilldown',
        component: () => import('./views/PipelineDrilldown.js?v=8') // Pipeline Drilldown page
    },
    {
        path: '/change-tracker',
        name: 'ChangeTracker',
        component: () => import('./views/ChangeTracker.js?v=11') // Change Tracker page
    },
    // Add more routes here as needed
];

const router = createRouter({
    history: createWebHashHistory(), // Using Hash history for simpler server setup (no rewrite rules needed)
    routes
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('moon_office_token');
    const publicPages = ['/login', '/otp'];
    const authRequired = !publicPages.includes(to.path);

    if (authRequired && !token) {
        return next('/login');
    }

    // Redirect from Dashboard if no permission
    if (to.path === '/' || to.name === 'Dashboard') {
        const cachedPerms = localStorage.getItem('moon_office_permissions');
        if (cachedPerms) {
            try {
                const features = JSON.parse(cachedPerms);
                if (!features.includes('main_dashboard')) {
                    return next('/bot-health');
                }
            } catch (e) {
                console.error('Failed to parse permissions in router', e);
            }
        }
    }

    next();
});

export default router;
