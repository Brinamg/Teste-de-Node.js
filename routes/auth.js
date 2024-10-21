const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { setSession } = require('../redis');
const { check, validationResult } = require('express-validator');
const router = express.Router();

const JWT_SECRET = 'secretKey';

// Registro com validação de dados
router.post('/register', [
    check('username').notEmpty().withMessage('Username é obrigatório'),
    check('password').isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function (err) {
        if (err) return res.status(500).send('Erro no cadastro');
        res.status(201).send('Usuário cadastrado');
    });
});

// Login com JWT e armazenamento em Redis
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) return res.status(400).send('Usuário não encontrado');

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).send('Senha incorreta');

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
        setSession(user.id, token);  // Armazenar sessão no Redis
        res.json({ token });
    });
});

module.exports = router;
