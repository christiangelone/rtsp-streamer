const environments = {
    production: require('./production'),
    development: require('./development'),
    testing: require('./testing'),
}

module.exports = env => (
    env
        ? environments[env]
        : { isTesting: process.env['NODE_ENV'] === 'testing' }
)