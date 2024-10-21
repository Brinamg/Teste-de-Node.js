const jwt = require('jsonwebtoken');
const { getSession } = require('../redis');
const JWT_SECRET = 'secretKey';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Token não fornecido');

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send('Falha ao autenticar token');

        // Verificar se a sessão está ativa no Redis
        getSession(decoded.id, (sessionToken) => {
            if (sessionToken !== token) return res.status(401).send('Sessão expirada');
            req.user = decoded;
            next();
        });
    });
};

module.exports = { verifyToken };
