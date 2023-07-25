const configEnv = require('./config')(process.env['NODE_ENV']);
const bodyParser = require('body-parser');
const express = require('express');
const https = require('https');
const fs = require('fs');

const server = express();

server.use(bodyParser.json());
server.use(express.static('static'));
require('./routes')(server);

const port = configEnv['PORT'] || 3333;

if (configEnv['USE_TLS']) {
    const options = {
        key: fs.readFileSync(configEnv['TLS_KEY_PATH']),
        cert: fs.readFileSync(configEnv['TLS_CRT_PATH'])
    };
    
    https.createServer(options, server)
      .listen(port, () => console.log(`Server listening at port ${ port }...`));
} else {
    server.listen(port, () => console.log(`Server listening at port ${ port }...`));
}
