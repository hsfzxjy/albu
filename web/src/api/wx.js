'use strict';

import axios from 'axios'
import { decodeShareURL } from './sharing'

const signClient = axios.create({
    baseURL: process.env.VUE_APP_WEB_AUTHURL + 'wx'
})


export function isWechat() {
    let ua = navigator.userAgent.toLowerCase();
    return ua.match(/MicroMessenger/i) == "micromessenger"
}

export async function initWX() {
    if (!isWechat()) return
    const wx = await import("weixin-js-sdk")
    const url = location.href.split('#')[0]
    let requestBody = { url }

    let wxPayload = localStorage.getItem("wxPayload")
    if (wxPayload) {
        requestBody.payload = wxPayload
    }
    let { payload, signature, timestamp, nonceStr } = (await (signClient.post('', requestBody))).data;
    localStorage.setItem("wxPayload", payload)

    wx.config({
        debug: false,
        appId: process.env.VUE_APP_WX_APPID,
        signature,
        timestamp,
        nonceStr,
        jsApiList: [
            'updateTimelineShareData',
            'updateAppMessageShareData',
            // 'onMenuShareTimeline',
            // 'onMenuShareAppMessage',
        ]
    })

    wx.ready(() => {
        const commonData = {
            link: location.href,
            imgUrl: `${url}wx_cover.png`,
        }
        wx.updateTimelineShareData({
            ...commonData,
            title: document.title
        })

        let title = process.env.VUE_APP_WEB_TITLE, desc = decodeShareURL(false)

        if (desc) {
            [title, desc] = [desc, title]
        }
        wx.updateAppMessageShareData({
            ...commonData, title, desc
        })
    })
}

export async function updateShareInfo(desc, link) {
    const wx = await import("weixin-js-sdk");
    const url = location.href.split('#')[0]

    wx.ready(() => {
        const commonData = {
            link,
            imgUrl: `${url}wx_cover.jpg`,
        }
        const title = process.env.VUE_APP_WEB_TITLE
        wx.updateTimelineShareData({
            ...commonData,
            title: desc ? desc + ' | ' + title : title,
        })
        wx.updateAppMessageShareData({
            ...commonData,
            title: desc ? desc : title,
            desc: desc ? title : undefined
        })
    })
}