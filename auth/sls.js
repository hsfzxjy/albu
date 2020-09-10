const express = require('express')
const cors = require('cors')
const crypto = require('crypto');
const config = require('./config.json');
const getCredential = require('qcloud-cos-sts').getCredential;
const axios = require('axios');

function encodePayload(data) {
  const algorithm = 'aes-192-cbc';
  const key = crypto.scryptSync(config.secret, 'salt', 24)
  const iv = Buffer.alloc(16, 0);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  return new Promise(resolve => {
    let result = []
    cipher.on('readable', () => {
      let chunk;
      while (null !== (chunk = cipher.read())) {
        result.push(chunk.toString('hex'));
      }
    })
    cipher.on('end', () => {
      resolve(result.join(''))
    })

    cipher.write(JSON.stringify(data))
    cipher.end()
  })
}

function decodePayload(token) {
  const algorithm = 'aes-192-cbc';
  const key = crypto.scryptSync(config.secret, 'salt', 24)
  const iv = Buffer.alloc(16, 0);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  return new Promise(resolve => {
    let decrypted = []
    decipher.on('readable', () => {
      let chunk;
      while (null !== (chunk = decipher.read())) {
        decrypted.push(chunk.toString('utf8'));
      }
    })
    decipher.on('end', () => {
      try {
        resolve(JSON.parse(decrypted.join('')))
      } catch (e) {
        resolve(undefined)
      }
    })

    decipher.write(token, 'hex')
    decipher.end()
  })
}

function isPasswordMatched(password) {
  for (let expected of config.passwords) {
    const hashed_expected = crypto
      .createHash('md5')
      .update(expected)
      .digest("hex")
      .toLowerCase()
    if (hashed_expected === password) return true;
  }
  return false
}

async function getCOSCredential() {
  const arguments = {
    secretId: config.tcloud.secretId,
    secretKey: config.tcloud.secretKey,
    bucket: config.cos.bucket,
    region: config.cos.region,
    policy: {
      version: '2.0',
      statement: [{
        'effect': 'allow',
        'action': [
          'name/cos:GetObject',
          'name/cos:GetObjectACL',
          'name/cos:PutObjectACL',
          'name/cos:PutObject',
        ],
        "principal": { "qcs": ["*"] },
        "resource": [`qcs::cos:ap-nanjing:uid/${config.tcloud.appId}:${config.cos.bucket}/*`]
      }]
    },
  }
  return new Promise(resolve => {
    getCredential(arguments, (_err, data) => {
      resolve({
        ExpiredTime: data.expiredTime,
        StartTime: data.startTime,
        TmpSecretId: data.credentials.tmpSecretId,
        TmpSecretKey: data.credentials.tmpSecretKey,
        XCosSecurityToken: data.credentials.sessionToken,
      })
    })
  })

}

async function handleBody(body) {
  try {
    body = JSON.parse(body)
  } catch (e) {
    body = {}
  }

  if (body.password === undefined)
    return { 'error': 'password required' }
  if (!isPasswordMatched(body.password))
    return { 'error': 'password mismatched' }

  return { data: await getCOSCredential() }
}

const app = express()
app.use(cors())
app.use(function (req, res, next) {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    req.rawBody = data;
    next();
  });
});

// Routes
app.post(`/`, (req, res) => {
  handleBody(req.rawBody)
    .then(result => res.json(result))
})

async function wxSign(body) {
  let { url, payload } = body;
  if (!url) { return { 'error': 'empty url' } }

  if (payload) payload = await decodePayload(payload)
  if (!payload || payload.expiration < +new Date()) {
    let { access_token } = (await axios.request({
      url: 'https://api.weixin.qq.com/cgi-bin/token',
      params: {
        grant_type: "client_credential",
        appid: config.wx.appId,
        secret: config.wx.appSecret,
      }
    })).data;
    if (!access_token) return { 'error': 'bad token' }

    let { ticket } = (await axios.request({
      url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
      params: {
        access_token,
        type: 'jsapi'
      }
    })).data;

    if (!ticket) return { 'error': 'bad ticket' }
    let expiration = +new Date() + 7200 * 1000;

    payload = { ticket, expiration }
  }

  const nonceStr = Math.random().toString();
  const timestamp = Math.floor(+new Date() / 1000);

  const stringToSign = `jsapi_ticket=${payload.ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`

  let sha1sum = crypto.createHash('sha1')
  sha1sum.update(stringToSign)
  let signature = sha1sum.digest('hex')

  return {
    payload: await encodePayload(payload),
    signature,
    nonceStr,
    timestamp
  }
}

app.post(`/wx`, (req, res) => {
  let body = {}
  try {
    body = JSON.parse(req.rawBody)
  } catch (e) { }

  wxSign(body)
    .then(result => res.json(result))
})

// Error handler
app.use(function (err, req, res, next) {
  console.error(err)
  res.status(500).send('Internal Serverless Error')
})

app.listen(8090)

module.exports = app
