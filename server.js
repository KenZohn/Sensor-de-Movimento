const express = require('express');
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const bodyParser = require('body-parser');
const sqlite3 = require("sqlite3");

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
})

const db = new sqlite3.Database("arduino.db", (err) => {
  if (err) {
      console.log("Erro ao conectar no banco de dados Sqlite:",err);
  }
  else{
      console.log("Conectado ao banco Sqlite");
  }
});

// Configuração da porta serial
const arduinoPort = new SerialPort('COM3', { baudRate: 9600 }); // Substitua 'COM3' pela porta correta
const parser = arduinoPort.pipe(new Readline({ delimiter: '\n' })); // Lê os dados linha a linha

parser.on('data', (data) => {
  console.log(`Dados recebidos do Arduino: ${data}`);

  const now = new Date();
  const dataAtual = now.toISOString().split('T')[0];
  const horarioAtual = now.toTimeString().split(' ')[0];

  const query = 'INSERT INTO deteccoes (data, horario, estado) VALUES (?, ?, ?)';
  db.query(query, [dataAtual, horarioAtual, data.trim()], (err, result) => {
    if (err) throw err;
    console.log('Dados inseridos no banco com sucesso!');
  });
});

app.use(bodyParser.json());

// Rota para buscar dados no banco
app.get('/api/dados', (req, res) => {
  const query = 'SELECT * FROM deteccoes';
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
