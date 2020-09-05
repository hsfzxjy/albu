import EditPage from './EditPage.vue'

export default {
    install(Vue) {
        let NewCls = Vue.extend(EditPage)
        let vm = (new NewCls()).$mount()
        window.document.body.appendChild(vm.$el)

        function openEditPage() {
            vm.show = true
        }

        Vue.prototype.$editPage = {
            async query(msg, styleChoices) {
                vm.msg = msg
                vm.styleChoices = styleChoices
                openEditPage()
                return await new Promise(resolve => {
                    vm.$once('cancel', () => resolve({ action: 'cancel' }))
                    vm.$once('confirm', () => resolve({ action: 'confirm' }))
                })
            }
        }
    }
}