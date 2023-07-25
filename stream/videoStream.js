const configEnv = require('../config')(process.env['NODE_ENV'])

const https = require('https');
const ws = require('ws')
const util = require('util')
const events = require('events')
const Mpeg1Muxer = require('./mpeg1muxer')
const jwt = require('jsonwebtoken')
const fs = require('fs')

const STREAM_MAGIC_BYTES = "jsmp" // Must be 4 bytes

VideoStream = function(options) {
  this.options = options
  this.name = options.name
  this.streamUrl = options.streamUrl
  this.width = options.width
  this.height = options.height
  this.wsPort = options.wsPort
  this.secure = options.secure
  this.inputStreamStarted = false
  this.stream = undefined
  this.startMpeg1Stream()
  this.pipeStreamToSocketServer()
  return this
}

util.inherits(VideoStream, events.EventEmitter)

VideoStream.prototype.stop = function() {
  console.log('Stopping streaming...')
  this.wsServer.close()
  if(this.server)
    this.server.close()
  this.stream.kill()
  this.inputStreamStarted = false
  return this
}

VideoStream.prototype.startMpeg1Stream = function() {
  var gettingInputData, gettingOutputData, inputData, outputData
  this.mpeg1Muxer = new Mpeg1Muxer({
    ffmpegOptions: this.options.ffmpegOptions,
    url: this.streamUrl,
    protocol: this.options.protocol
  })
  this.stream = this.mpeg1Muxer.stream
  if (this.inputStreamStarted) {
    return
  }
  this.mpeg1Muxer.on('mpeg1data', (data) => {
    return this.emit('camdata', data)
  })
  gettingInputData = false
  inputData = []
  gettingOutputData = false
  outputData = []
  this.mpeg1Muxer.on('ffmpegStderr', (data) => {
    var size
    data = data.toString()
    if (data.indexOf('Input #') !== -1) {
      gettingInputData = true
    }
    if (data.indexOf('Output #') !== -1) {
      gettingInputData = false
      gettingOutputData = true
    }
    if (data.indexOf('frame') === 0) {
      gettingOutputData = false
    }
    if (gettingInputData) {
      inputData.push(data.toString())
      size = data.match(/\d+x\d+/)
      if (size != null) {
        size = size[0].split('x')
        if (this.width == null) {
          this.width = parseInt(size[0], 10)
        }
        if (this.height == null) {
          return this.height = parseInt(size[1], 10)
        }
      }
    }
  })
  this.mpeg1Muxer.on('ffmpegStderr', function(data) {
    return global.process.stderr.write(data)
  })
  this.mpeg1Muxer.on('exitWithError', () => {
    return this.emit('exitWithError')
  })
  return this
}

VideoStream.prototype.pipeStreamToSocketServer = function() {
  let server = undefined
  let port = undefined
  if (configEnv['USE_TLS']) {
    const options = {
      key: fs.readFileSync(configEnv['TLS_KEY_PATH']),
      cert: fs.readFileSync(configEnv['TLS_CRT_PATH'])
    };
    server = https.createServer(options, (_, res) => {
      res.writeHeader(200);
      res.end();
    });
    server.listen(this.wsPort);
    this.server = server
  } else {
    port = this.wsPort
  }

  this.wsServer = new ws.Server({
    verifyClient: (info, done) => {
      if (this.secure) {
        const token = info.req.url.substring(1);
        if (!token) done(false, 401, 'Unauthorized')
        else jwt.verify(token, configEnv['JWT_SECRET'], (err, _) => err ? done(false, 401, 'Unauthorized') : done(true))
      } else {
        done(true)
      }
    },
    server,
    port,
  })
  this.wsServer.on("connection", (socket, request) => {
    return this.onSocketConnect(socket, request)
  })
  this.wsServer.broadcast = function(data, opts) {
    var results
    results = []
    for (let client of this.clients) {
      if (client.readyState === 1) {
        results.push(client.send(data, opts))
      } else {
        results.push(console.log("Error: Client from remoteAddress " + client.remoteAddress + " not connected."))
      }
    }
    return results
  }
  return this.on('camdata', (data) => {
    return this.wsServer.broadcast(data)
  })
}

VideoStream.prototype.onSocketConnect = function(socket, request) {
  var streamHeader
  // Send magic bytes and video size to the newly connected socket
  // struct { char magic[4]; unsigned short width, height;}
  streamHeader = new Buffer(8)
  streamHeader.write(STREAM_MAGIC_BYTES)
  streamHeader.writeUInt16BE(this.width, 4)
  streamHeader.writeUInt16BE(this.height, 6)
  socket.send(streamHeader, { binary: true })

  console.log(`${this.name}: New WebSocket Connection (` + this.wsServer.clients.size + " total)")

  socket.remoteAddress = request.connection.remoteAddress

  return socket.on("close", (code, message) => {
    return console.log(`${this.name}: Disconnected WebSocket (` + this.wsServer.clients.size + " total)")
  })
}

module.exports = VideoStream