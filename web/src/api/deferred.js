export default class Deferred {
    constructor() {
        this.init()
    }
    init() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        })
    }
    then(...args) {
        this.promise.then(...args)
        return this
    }
    catch(...args) {
        this.promise.catch(...args)
        return this
    }
    finally(...args) {
        this.promise.finally(...args)
        return this
    }
}