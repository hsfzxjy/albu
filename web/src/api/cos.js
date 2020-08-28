'use strict';
import { CachedValue } from './cache'
import { stsToken } from './sts'
import COS from 'cos-js-sdk-v5'

export default new CachedValue(
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

