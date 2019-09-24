const stream = require('./stream')

module.exports = api => {
    api.get('/health', (req, res) => res.status(200).end())
    api.use('/stream', stream)
    return api
}