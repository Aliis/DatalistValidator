import '@fortawesome/fontawesome-free/css/all.css'
import '@mdi/font/css/materialdesignicons.css'
import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import {store} from './store/store'

Vue.config.productionTip = false;
Vue.use(Vuetify, {
    iconfont: 'mdi'
})

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount("#app");
