'use strict';

export class CachedValue {
    constructor(getter) {
        this._getter = getter
        this._refreshing = null
        this._ctx = {}
    }
    _getValue() {
        return this._value
    }
    _setValue(val) {
        this._value = val
    }
    clear() {
        this._value = undefined
    }
    getter(f) {
        this._getter = f
    }
    refresh(...args) {
        if (this._refreshing !== null) return this._refreshing
        this._value = undefined
        this._refreshing = this._getter(this._ctx, ...args)
        this._refreshing = this._refreshing
            .finally(() => this._refreshing = null)
            .then(value => this._setValue(value))
        return this._refreshing
    }
    async val() {
        const value = this._getValue()
        if (value !== undefined) {
            return await value
        }
        await this.refresh()
        return await this._getValue()
    }
}

export class LSCachedValue extends CachedValue {
    constructor(key, getter) {
        super(getter)
        if (Array.isArray(key)) {
            key = key.join('')
        }
        this.key = key
    }
    _getValue() {
        let value = window.localStorage.getItem(this.key)
        return value === null ? undefined : JSON.parse(value)
    }
    _setValue(val) {
        window.localStorage.setItem(this.key, JSON.stringify(val))
    }
    refresh(...args) {
        window.localStorage.removeItem(this.key)
        return super.refresh(...args)
    }
}