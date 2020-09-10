'use strict';
import * as axios from 'axios'
import { CachedValue } from './cache'
import { stsToken } from './sts'
import COS from 'cos-js-sdk-v5'

const bucketInfo = {
    Bucket: process.env.VUE_APP_COS_BUCKET,
    Region: process.env.VUE_APP_COS_REGION,
}

export function getPublicURL(key) {
    return `https://${bucketInfo.Bucket}.cos.${bucketInfo.Region}.myqcloud.com/${key}`
}

export function fetch(url, force = false) {
    if (force) {
        if (url.indexOf('?') === -1) url += '?'
        url = url.replace('?', `?seed=${Math.random()}&`)
    }
    return axios.get(url).then(x => x.data)
}

export function getPublicResource(key, force = false) {
    let url = getPublicURL(key)
    return fetch(url, force)
}

export async function action(name, args) {
    const cos = await client.val()
    return new Promise((resolve, reject) => {
        cos[name](
            { ...bucketInfo, ...args },
            (err, data) => {
                if (err) reject(err); else resolve(data);
            }
        )
    })
}

export const client = new CachedValue(
    async () => {
        await stsToken.refresh()
        const token = await stsToken.val()
        return new COS({
            getAuthorization: (_, callback) => {
                callback(token)
            }
        })
    }
)

