module.exports = {
    ENV: process.env['NODE_ENV'],
    PORT: process.env['PORT'],
    JWT_SECRET: process.env['JWT_SECRET'],
    STREAM_USERNAME: process.env['STREAM_USERNAME'],
    STREAM_PASSWORD: process.env['STREAM_PASSWORD'],
    STREAM_PROTOCOL: 'udp',
    USE_TLS: true,
    TLS_KEY_PATH: process.env['TLS_KEY_PATH'],
    TLS_CRT_PATH: process.env['TLS_CRT_PATH'],
}