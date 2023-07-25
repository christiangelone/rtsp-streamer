const configEnv = require('./config')(process.env['NODE_ENV'])
const bodyParser = require('body-parser')
const express = require('express');
const server = express();

server.use(bodyParser.json())
server.use(express.static('static'));
require('./routes')(server)

// server.use('/static', express.static('static'))
// const path = require('path')
// server.get('/', (_, res) => res.sendFile(path.join(__dirname + '/index.html')));

const port = configEnv['PORT'] || 3333
server.listen(port, () => console.log(`Server listening at port ${ port }...`));