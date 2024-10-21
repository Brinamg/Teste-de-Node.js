const redis = require('redis');
let client;

const connectRedis = () => {
    client = redis.createClient();
    client.on('error', (err) => console.log('Erro no Redis', err));
    client.on('connect', () => console.log('Conectado ao Redis'));
};

const setSession = (key, value) => {
    client.setex(key, 3600, value); // Sessão com expiração de 1 hora
};

const getSession = (key, callback) => {
    client.get(key, (err, data) => {
        if (err) throw err;
        callback(data);
    });
};

module.exports = { client, connectRedis, setSession, getSession };
