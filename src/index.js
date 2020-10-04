import Vue from 'vue'
import "@babel/polyfill";
import 'bootstrap/dist/css/bootstrap.css'
import '@fortawesome/fontawesome-free/css/all.css'
import store from './js/store.js'
import App from './components/app.vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI)

window.vm = new Vue({
    el: '#app',
    store,
    render: h => h(App)
})