const configEnv = require('../config')(process.env['NODE_ENV'])
const express = require('express');
const router = express.Router();
const Stream = require('../stream')

const jwt = require('jsonwebtoken')
const authMiddleware = require('../middleware/auth')

const FreePort = require('find-free-port');
const findFreePort = () => FreePort(24000, 24999)

const streams = {}
router.post('/', [ authMiddleware ], (req, res) => {
  const { name, uri, duration } = req.body
  findFreePort().then(([port]) => {
    if (!streams[name]) {
      const stream = new Stream({
        name,
        streamUrl: uri,
        wsPort: port,
        secure: true,
        protocol: configEnv['STREAM_PROTOCOL'],
        ffmpegOptions: { // options ffmpeg flags
          '-stats': '', // an option with no neccessary value uses a blank string
          '-r': 30, // options with required values specify the value after the key
          '-vf': 'scale=320:-1',
          '-d': 4 + duration
        }
      })
      streams[name] = stream
    }
    setTimeout(() => {
      if (streams[name]){
        streams[name].stop()
        delete streams[name]
      }
    }, 4000 + (duration * 1000))
    res.status(200).json({
      port,
      token: jwt.sign(
        { name },
        configEnv['JWT_SECRET'],
        { expiresIn: Math.floor(Date.now() / 1000) + duration }
      )
    })
  })
  .catch(err => res.status(500).json({ error: `Could not find free port: ${err}` }))
})

router.post('/stop', [ authMiddleware ], (req, res) => {
  const { name } = req.body
  if(!name) return res.status(400).end()
  if(!streams[name]) return res.status(400).end()
  
  streams[name].stop()
  delete streams[name]
  return res.status(200).json({})
})

module.exports = router