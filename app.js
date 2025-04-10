const express = require('express');
const { SerialPort } = require('serialport');
const sqlite3 = require("sqlite3");
const { ReadlineParser } = require('@serialport/parser-readline');
const path = require("path");
const WebSocket = require('ws');

const app = express();
const port = 3000;

// Configurar a porta serial
const arduinoPort = new SerialPort({ path: '/dev/ttyACM0', baudRate: 9600 });
const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Middleware para JSON
app.use(express.json());

const db = new sqlite3.Database("arduino.db", (err) => {
    if (err) {
        console.log("Erro ao conectar no banco de dados Sqlite:", err);
    } else {
        console.log("Conectado ao banco Sqlite");
    }
});

// Configurar WebSocket
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Cliente conectado ao WebSocket');
});

// Registrar os dados enviados pelo Arduino
parser.on('data', (data) => {
    console.log(`Dados recebidos do Arduino: ${data}`);
  
    const now = new Date();
    const dataAtual = now.toISOString().split('T')[0];
    const horarioAtual = now.toTimeString().split(' ')[0];

    db.run(
        `INSERT INTO movimentos (data, horario, estado) VALUES (?, ?, ?)`,
        [dataAtual, horarioAtual, data.trim()],
        (err) => {
            if (err) {
                console.error("Erro ao cadastrar:", err.message);
            } else {
                console.log("Dados cadastrados com sucesso no banco de dados");

                // Notificar os clientes WebSocket
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
});


// Rota para enviar a página index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para realizar o SELECT e retornar os dados
app.get('/dados', (req, res) => {
    const query = `SELECT * FROM movimentos ORDER BY data DESC, horario DESC`;
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Erro ao realizar SELECT:", err.message);
            res.status(500).send("Erro ao realizar SELECT");
        } else {
            res.json(rows); // Retorna os dados em formato JSON
        }
    });
});

app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
});
