const express = require('express')
const cors = require('cors')
const crypto = require('crypto');
const config = require('./config.json');
const getCredential = require('qcloud-cos-sts').getCredential;

function getPayload(data) {
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
      resolve({
        data: data,
        token: result.join('')
      })
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
      resolve({
        data: JSON.parse(decrypted.join('')),
        token: token
      })
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
    secretId: config.cos.secretId,
    secretKey: config.cos.secretKey,
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
        "resource": [`qcs::cos:ap-nanjing:uid/${config.cos.appId}:${config.cos.bucket}/*`]
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

  if (body.token === undefined)
    return getPayload(await getCOSCredential())
  else
    return decodePayload(body.token)
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

// Error handler
app.use(function (err, req, res, next) {
  console.error(err)
  res.status(500).send('Internal Serverless Error')
})

app.listen(8090)

module.exports = app
