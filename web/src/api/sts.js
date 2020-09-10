'use strict';
import * as axios from 'axios'
import md5 from 'md5-js'
import { CachedValue } from './cache'
import Deferred from './deferred'

const stsAPIClient = axios.create({
    baseURL: process.env.VUE_APP_WEB_AUTHURL
})

const stsDeferred = new Deferred();
export const stsToken = new CachedValue(
    (ctx) => {
        if (ctx.refreshFunc)
            return ctx.refreshFunc()

        return stsDeferred.promise
            .then(([token, resolveFunc]) => {
                ctx.resolveFunc = resolveFunc
                return token
            })
    }
)


export async function login(password) {
    const payload = { password: md5(password) }

    const response = (await stsAPIClient.post('', payload)).data
    if (response.error) {
        throw new Error(response.error)
    }

    stsDeferred.resolve([
        response.data,
        (() => {
            if (this.refreshing !== null) return this.refreshing
            this.refreshing = stsAPIClient.post('', payload)
                .then(response => {
                    this.refreshing = null
                    return response.data.data
                })
            return this.refreshing
        }).bind({ refreshing: null })
    ])

    return response.data
}
