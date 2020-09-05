'use strict';
import { LSCachedValue } from './cache'
import * as cos from './cos'
import * as sts from './sts'

export function getObjectUrl(key, isPrivate = true) {
    return new LSCachedValue(
        ['objectURL', key, isPrivate ? 'private' : 'public'],
        async (ctx, expired) => {
            if (!isPrivate) return cos.getPublicURL(key);

            const refetchToken = ctx.triedResign
            if (expired) {
                if (ctx.triedResign) await cos.client.refresh();
                ctx.triedResign = true
            }

            return cos.action('getObjectUrl', {
                Key: key,
                Expires: 3600,

            })
                .then(x => x.Url)
                .finally(() => { if (refetchToken) ctx.triedResign = false })
        })
}

export async function getMetaList() {
    const [metas, publicNames] = await Promise.all([
        cos.getPublicResource('assets/metas.json', true),
        cos.getPublicResource('assets/list/public.json', true)
    ])

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
            cos.action(
                'putObjectAcl',
                {
                    Key: `assets/${size}/${name}`,
                    ACL: isPublic ? 'public-read' : 'private'

                }
            )
        ))
    await Promise.all(requests)

    await cos.action(
        'putObject',
        {
            Key: `assets/list/public.json`,
            ACL: 'public-read',
            CacheControl: 'private,max-age=31536000',
            Body: JSON.stringify(publicNames)
        }
    )
}

export async function getMessages(isPublic) {
    let lst;
    if (isPublic)
        lst = await cos.getPublicResource('assets/list/public-msg.json', true)
    else {
        const url = getObjectUrl('assets/list/private-msg.json')
        await url.refresh()
        lst = await cos.fetch(await url.val(), true)
    }
    return lst.map(
        ([text, time, style]) => ({
            text,
            time,
            style
        }))
}

export async function saveMessages(msgList) {

    function filterMessages(isPublic) {
        return msgList
            .filter(x => x.public === isPublic)
            .map(({ data }) => [data.text, data.time, data.style])
    }

    const publicList = filterMessages(true)
    const privateList = filterMessages(false)

    await Promise.all([
        cos.action(
            'putObject',
            {
                Key: `assets/list/public-msg.json`,
                ACL: 'public-read',
                CacheControl: 'private,max-age=31536000',
                Body: JSON.stringify(publicList)
            }
        ),
        cos.action(
            'putObject',
            {
                Key: `assets/list/private-msg.json`,
                ACL: 'private',
                CacheControl: 'private,max-age=31536000',
                Body: JSON.stringify(privateList)
            }
        ),
    ])
}

export const login = sts.login;