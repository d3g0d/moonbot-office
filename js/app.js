import { createApp } from 'vue';
import router from './router.js?v=12';

const app = createApp({
    template: `
        <router-view></router-view>
    `
});

app.use(router);
app.mount('#app');
