import { createApp } from 'vue';
import router from './router.js?v=21';

const app = createApp({
    template: `
        <router-view></router-view>
    `
});

app.use(router);
app.mount('#app');
