const express = require('express');
const { SerialPort } = require('serialport');
const sqlite3 = require("sqlite3");
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require("path");
const WebSocket = require('ws');
const auth = require('./auth'); 

const app = express();
const port = 3000;

app.use(express.static('public'));

// Configuração da porta serial
const arduinoPort = new SerialPort({ path: '/dev/ttyACM0', baudRate: 9600 });
const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Middleware para JSON 
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(auth); // Usar as rotas de autenticação

const db = new sqlite3.Database("arduino.db", (err) => {
    if (err) {
        console.log("Erro ao conectar no banco de dados Sqlite:", err);
    } else {
        console.log("Conectado ao banco Sqlite");
    }
});

// Configuração do WebSocket
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Cliente conectado ao WebSocket');
});

app.use((req, res, next) => {
    if (req.session.loggedin) {
        global.userSession = req.session;
    }
    next();
});

// Registra os dados enviados pelo Arduino
parser.on('data', (data) => {
    if (global.userSession && global.userSession.loggedin) {
        const now = new Date();
        const dataAtual = now.toISOString().split('T')[0];
        const horarioAtual = now.toTimeString().split(' ')[0];
        const userId = require('./auth.js');

        db.run(
            `INSERT INTO movimentos (data, horario, estado, id_usuario) VALUES (?, ?, ?, ?)`,
            [dataAtual, horarioAtual, data.trim(), userId],
            (err) => {
                if (err) {
                    console.error("Erro ao cadastrar:", err.message);
                } else {
                    console.log("Dados cadastrados com sucesso no banco de dados");

                    const mensagem = {
                        message: "Novo dado recebido no banco!",
                        data: {
                            dataAtual,
                            horarioAtual,
                            estado: data.trim()
                        }
                    };

                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(mensagem));
                        }
                    });
                }
            }
        );
    }
});

// Direciona para a página de login.html ou index.html se estiver logado
app.get("/", (req, res) => {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'login.html'));
    }
});

// Retornar os dados da tabela movimentos
app.get('/dados', (req, res) => {
    const userId = require('./auth.js');

    const query = `SELECT * FROM movimentos WHERE id_usuario = ? ORDER BY data DESC, horario DESC`;
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error("Erro ao realizar SELECT:", err.message);
            res.status(500).send("Erro ao realizar SELECT");
        } else {
            res.json(rows);
        }
    });
});

app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
});
