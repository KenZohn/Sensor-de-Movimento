const express = require('express');
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = 3000;

// Configuração do banco de dados
const db = mysql.createConnection({
  host: 'localhost',
  user: 'seu_usuario',
  password: 'sua_senha',
  database: 'nome_do_banco'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Conectado ao banco de dados!');
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
