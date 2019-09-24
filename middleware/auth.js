const configEnv = require('../config')(process.env['NODE_ENV'])

module.exports = (req, res, next) => {
    const auth = { username: configEnv['STREAM_USERNAME'], password: configEnv['STREAM_PASSWORD'] }
    
    // parse login and password from headers
    const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
    const [username, password] = new Buffer(b64auth, 'base64').toString().split(':')

    // Verify login and password are set and correct
    if (username && password && username === auth.username && password === auth.password)
      return next()

    res.status(401).json({ error: 'authentication required'})
}