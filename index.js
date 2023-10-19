const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const twilio = require("twilio");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const TWILIO_SID = "";
const TWILIO_AUTH_TOKEN = "";
const TWILIO_PHONE_NUMBER = "";
const MONGODB_URI ="";

const twilioClient = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true });

app.post("/cardapio", async (req, res) => {
  const twiml = new MessagingResponse();

  console.log(req.body);
  try {
    const { Body, From } = req.body;
    const order = { from: From, message: Body, timestamp: new Date() };

    // Conecte-se ao MongoDB
    await client.connect();

    // Acesse o banco de dados e insira o pedido
    const db = client.db("mydb"); // Substitua 'mydb' pelo nome do seu banco de dados
    const ordersCollection = db.collection("orders");
    const result = await ordersCollection.insertOne(order);

    console.log(`Pedido armazenado no MongoDB com o ID: ${result.insertedId}`);

    // Responda ao usuário
    twiml.message("Seu pedido foi registrado com sucesso!");

    // Enviar uma mensagem de confirmação para o usuário (opcional)
    twilioClient.messages.create({
      body: "Seu pedido foi registrado com sucesso!",
      from: `whatsapp:${TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${From}`,
    });

    // Encerre a conexão com o MongoDB
    await client.close();
  } catch (error) {
    console.error(error);
    twiml.message("Desculpe, ocorreu um erro no processamento do seu pedido.");
  }

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ouvindo na porta ${PORT}`);
});

app.post('/jogo', (req, res) => {

    const opcoes = [
        'pedra', 'papel', 'tesoura'
    ];
    
    const perde = {
        'pedra': 'papel',
        'papel': 'tesoura',
        'tesoura': 'pedra'
    }
    console.log('nova mensagem', req.body.Body);
    const usuario = req.body.Body.toLowerCase();
    switch(usuario) {
        case 'pedra':
        case 'papel': 
        case 'tesoura':
            // fazer a escolha do computador e responder quem ganhou
            const computador = opcoes[Math.floor(Math.random() * opcoes.length)];


            if (computador === usuario) {
                res.send('<Response><Message>Ops, deu empate!</Message></Response>')
            } else {
                if (perde[computador] === usuario) {
                    // computador perdeu
                    res.send(`<Response><Message>Eu escolhi *${computador}*</Message><Message>Você ganhou, mas quero jogar novamente!</Message></Response>`);
                } else {
                    // computador ganhou
                    const twiml = new twilio.twiml.MessagingResponse();
                    twiml.message(`Eu escolhi *${computador}*`);
                    twiml.message('Ganhei! Ganhei!!!')
                        .media('https://farm8.staticflickr.com/7090/6941316406_80b4d6d50e_z_d.jpg');
                    res.send(twiml.toString());
                }
            }
            break;

        default:
            // tratar "fallback intent"
            res.send('<Response><Message>Escolha Pedra, Papel ou Tesoura!</Message></Response>')
            break;
    }
    
});
