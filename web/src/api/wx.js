'use strict';

import axios from 'axios'

const signClient = axios.create({
    baseURL: process.env.VUE_APP_authURL + 'wx'
})


function isWechat() {
    let ua = navigator.userAgent.toLowerCase();
    return ua.match(/MicroMessenger/i) == "micromessenger"
}

export default async function initWX() {
    if (!isWechat()) return
    const wx = await import("weixin-js-sdk")
    const url = process.env.VUE_APP_WX_url
    let requestBody = { url }

    let wxPayload = localStorage.getItem("wxPayload")
    if (wxPayload) {
        requestBody.payload = wxPayload
    }
    let { payload, signature, timestamp, nonceStr } = (await (signClient.post('', requestBody))).data;
    localStorage.setItem("wxPayload", payload)

    wx.config({
        debug: false,
        appId: process.env.VUE_APP_WX_appId,
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

        let title = document.title, desc
        let splitted = title.split(' | ')
        if (splitted.length >= 2) {
            title = splitted.slice(-1)[0]
            desc = splitted[0]
        }
        wx.updateAppMessageShareData({
            ...commonData, title, desc
        })
    })
}