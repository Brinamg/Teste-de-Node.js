const express = require('express');
const { db } = require('../database');
const { verifyToken } = require('../middleware/authMiddleware');
const { check, validationResult } = require('express-validator');
const router = express.Router();

// Listar tarefas
router.get('/', verifyToken, (req, res) => {
    db.all(`SELECT * FROM tasks WHERE userId = ?`, [req.user.id], (err, tasks) => {
        if (err) return res.status(500).send('Erro ao listar tarefas');
        res.json(tasks);
    });
});

// Adicionar tarefa com validação
router.post('/', verifyToken, [
    check('title').notEmpty().withMessage('O título da tarefa é obrigatório'),
    check('status').isIn(['pending', 'completed']).withMessage('Status inválido')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, status } = req.body;
    db.run(`INSERT INTO tasks (userId, title, status) VALUES (?, ?, ?)`, [req.user.id, title, status], function (err) {
        if (err) return res.status(500).send('Erro ao adicionar tarefa');
        res.status(201).send('Tarefa adicionada');
    });
});

// Atualizar tarefa com validação
router.put('/:id', verifyToken, [
    check('status').isIn(['pending', 'completed']).withMessage('Status inválido')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    db.run(`UPDATE tasks SET status = ? WHERE id = ? AND userId = ?`, [status, req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).send('Erro ao atualizar tarefa');
        res.send('Tarefa atualizada');
    });
});

// Remover tarefa
router.delete('/:id', verifyToken, (req, res) => {
    db.run(`DELETE FROM tasks WHERE id = ? AND userId = ?`, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).send('Erro ao remover tarefa');
        res.send('Tarefa removida');
    });
});

module.exports = router;
