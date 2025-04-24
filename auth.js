const express = require('express');
const session = require('express-session');
const sqlite3 = require("sqlite3");
const path = require("path");

const router = express.Router();

router.use(session({
    secret: 'joaozinho',
    resave: true,
    saveUninitialized: true
}));

const db = new sqlite3.Database("arduino.db", (err) => {
    if (err) {
        console.log("Erro ao conectar no banco de dados Sqlite:", err);
    } else {
        console.log("Conectado ao banco Sqlite");
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        senha TEXT NOT NULL,
        email TEXT NOT NULL
    )
`);

// Página de login
router.get('/login', function(request, response) {
    response.sendFile(path.join(__dirname + '/login.html'));
});

// Autenticação
router.post('/auth', function(request, response) {
    let username = request.body.username;
    let password = request.body.password;

    if (username && password) {
        db.get('SELECT * FROM usuarios WHERE nome = ? AND senha = ?', 
            [username, password], function(error, user) {
            if (error) {
                console.error(error);
                return response.send('Erro ao consultar banco de dados');
            }

            console.log(user);

            // Se o usuário for encontrado
            if (user) {
                // Autentica o usuário
                request.session.loggedin = true;
                request.session.userid = user.id;
                request.session.username = user.nome;

                module.exports = user.id;
                // Redireciona para a página home
                response.redirect('/');
            } else {
                response.send('Login ou senha incorretos!');
            }
        });
    } else {
        response.send('Insira Login e Senha!');
    }
});

// Rota para cadastro
router.get('/cadastro', function(request, response) {
    response.sendFile(path.join(__dirname + '/cadastro.html'));
});

router.post('/criar', function(request, response) {
    const { nome, senha, email } = request.body;

    if (!nome || !senha || !email) {
        return response.json({ message: "Todos os campos devem ser preenchidos!" });
    }

    db.run(
        `INSERT INTO usuarios (nome, senha, email) VALUES (?, ?, ?)`,
        [nome, senha, email], (err) => {
            if (err) {
                return response.json({ message: "Erro ao cadastrar usuário", error: err.message });
            }
            response.redirect('/login');
        }
    );
});

// Desloga
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Erro ao encerrar sessão:", err);
            res.status(500).send("Erro ao encerrar sessão");
        } else {
            global.userSession = null;
            res.redirect('/login');
        }
    });
});

module.exports = router;