int ledPin = 6; // Pino do LED
int sensorPin = 7; // Pino do sensor de movimento
int leitura = 0; // Variável para armazenar a leitura do sensor
bool estadoSensor = false; // Variável para armazenar o estado do sensor

void setup() {
  Serial.begin(9600); // Inicializa a comunicação serial
  pinMode(ledPin, OUTPUT); // Define ledPin como saída
  pinMode(sensorPin, INPUT); // Define sensorPin como entrada
}

void loop() {
  leitura = digitalRead(sensorPin); // Realiza a leitura do sensor de movimento

  if (leitura == HIGH) { // Movimento detectado
    digitalWrite(ledPin, HIGH); // Aciona o LED
    if (!estadoSensor) { // Apenas envia dados uma vez por detecção
      Serial.println("Movimento detectado"); // Envia mensagem pela porta serial
      estadoSensor = true;
    }
    delay(1000); // Tempo de LED acionado
  } else { // Sem movimento
    digitalWrite(ledPin, LOW); // Desliga o LED
    if (estadoSensor) { // Apenas envia dados uma vez por ausência de detecção
      Serial.println("Sem movimento"); // Envia mensagem pela porta serial
      estadoSensor = false;
    }
  }
}
