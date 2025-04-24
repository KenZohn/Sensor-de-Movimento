# Sensor de Movimento

Projeto do 4º Semestre que consistia em desenvolver um sistema que conecta o Arduino, o Banco de Dados e o Front através de uma API utilizando o Node.js.

O sensor de movimento, quando detecta um movimento, envia um sinal para a API que armazena no banco de dados, a data, o horário e o estado (Movimento detectado ou sem movimento). A página que exibe uma tabela com os dados é atualizada automaticamente quando o banco de dados recebe novos dados.

## Dispositivos e tecnologias utilizadas
- Arduino Mega 2560
- Sensor de movimento PIR
- Front: HTML, CSS e JavaScript
- Banco de Dados: SQLite3
- API: Node.js

## Dependências necessárias

``` Bash
npm init
npm install express
npm install sqlite3
npm install serialport
npm install ws
npm install express-session
```

## Autorizar acesso ao USB

``` Bash
cat /etc/group | grep vboxusers
sudo groupadd vboxusers
sudo usermod -aG vboxusers $USER
```

Reiniciar o computador.

## Executar

``` Bash
node app.js
```
Acessar http://localhost:3000/ no navegador.
