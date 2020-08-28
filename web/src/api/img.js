'use strict';
import * as axios from 'axios'
import { LSCachedValue } from './cache'
import cosClient from './cos'

const bucketInfo = {
    Bucket: process.env.VUE_APP_bucket,
    Region: process.env.VUE_APP_region,
}

function getPublicURL(key) {
    return `https://${bucketInfo.Bucket}.cos.${bucketInfo.Region}.myqcloud.com/${key}`
}


function getPublicResource(key, force = false) {
    let url = getPublicURL(key)
    if (force) url += `?${Math.random()}`
    return axios.get(url)
}

async function COSAction(name, args) {
    const cos = await cosClient.val()
    return new Promise((resolve, reject) => {
        cos[name](
            { ...bucketInfo, ...args },
            (err, data) => {
                if (err) reject(err); else resolve(data);
            }
        )
    })
}

export function getObjectUrl(key, isPrivate = true) {
    return new LSCachedValue(
        ['objectURL', key, isPrivate ? 'private' : 'public'],
        async (ctx, expired) => {
            if (!isPrivate) return getPublicURL(key);

            const refetchToken = ctx.triedResign
            if (expired) {
                if (ctx.triedResign) await cosClient.refresh();
                ctx.triedResign = true
            }

            return COSAction('getObjectUrl', {
                Key: key,
                Expires: 3600,

            })
                .then(x => x.Url)
                .finally(() => { if (refetchToken) ctx.triedResign = false })
        })
}

export async function getMetaList() {
    const [metas, publicNames] = (await Promise.all([
        getPublicResource('assets/metas.json'),
        getPublicResource('assets/public.json', true)
    ])).map(x => x.data)

    return metas.map(x => {
        let meta = { ...x };
        meta.time = new Date(meta.time);
        meta.public = publicNames.indexOf(meta.name) !== -1
        return meta
    })

}

export function getImageURL(meta, size, sign = false) {
    return getObjectUrl(`assets/${size}/${meta.name}`, sign)
}

export async function modifyPriv(actions, publicNames) {
    if (Object.keys(actions).length === 0) return

    const requests = Object.entries(actions)
        .map(x => ['s'].map(size => [size, ...x]))
        .flat()
        .map(([size, name, isPublic]) => (
            COSAction(
                'putObjectAcl',
                {
                    Key: `assets/${size}/${name}`,
                    ACL: isPublic ? 'public-read' : 'private'

                }
            )
        ))
    await Promise.all(requests)

    await COSAction(
        'putObject',
        {
            Key: `assets/public.json`,
            ACL: 'public-read',
            Body: JSON.stringify(publicNames)
        }
    )
}