import EditPage from './EditPage.vue'
import SelectPage from './SelectPage'

function installDialog(interface_name, klass, Vue) {
    let NewCls = Vue.extend(klass)
    let vm = (new NewCls()).$mount()
    window.document.body.appendChild(vm.$el)

    function openDialog() {
        vm.show = true
    }

    Vue.prototype[interface_name] = {
        async query(options) {
            for (let [name, value] of Object.entries(options)) {
                vm.$set(vm, name, value)
            }
            openDialog()
            return await new Promise(resolve => {
                vm.$once('cancel', () => resolve({ action: 'cancel' }))
                vm.$once('confirm', () => resolve({ action: 'confirm' }))
            })
        }
    }

}

export default {
    install(Vue) {
        installDialog("$editPage", EditPage, Vue)
        installDialog("$selectPage", SelectPage, Vue)
    }
}