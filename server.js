const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');

const app = express();
const PORT = 3000;

// Configurações do Redis
const redis = new Redis();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Banco de dados SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
    }
});

// Rota de Registro
app.post('/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ errors: 'Usuário e senha são obrigatórios.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
        if (err) {
            return res.status(500).json({ errors: 'Erro ao registrar o usuário.' });
        }
        res.status(201).json({ message: 'Usuário registrado com sucesso.' });
    });
});

// Rota de Login
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err || !row || !bcrypt.compareSync(password, row.password)) {
            return res.status(401).json({ errors: 'Credenciais inválidas.' });
        }
        
        const token = jwt.sign({ id: row.id, username: row.username }, 'secrectkey', { expiresIn: '1h' });
        res.json({ token });
    });
});

// Rota para adicionar tarefas
app.post('/tasks', (req, res) => {
    const { title, status } = req.body;
    if (!title || !status) {
        return res.status(400).json({ error: 'Título e status da tarefa são obrigatórios.' });
    }

    db.run(`INSERT INTO tasks (title, status) VALUES (?, ?)`, [title, status], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao adicionar tarefa.' });
        }
        res.status(201).json({ message: 'Tarefa adicionada com sucesso.', id: this.lastID });
    });
});

// Rota para listar tarefas
app.get('/tasks', (req, res) => {
    db.all(`SELECT * FROM tasks`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao listar tarefas.' });
        }
        res.json(rows);
    });
});

// Rota para atualizar uma tarefa
app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Verifica se o status é válido
    if (!status || (status !== 'pending' && status !== 'completed')) {
        return res.status(400).json({ error: 'Status inválido. Deve ser "pending" ou "completed".' });
    }

    db.run(`UPDATE tasks SET status = ? WHERE id = ?`, [status, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar a tarefa.' });
        }
        res.status(200).json({ message: 'Tarefa atualizada com sucesso.' });
    });
});

// Rota para remover uma tarefa
app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM tasks WHERE id = ?`, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao remover a tarefa.' });
        }
        res.status(200).json({ message: 'Tarefa removida com sucesso.' });
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
