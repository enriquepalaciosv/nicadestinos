const { dialogflow, Suggestions } = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({ debug: true });

app.intent('Default Welcome Intent', (conv, parameters) => {
    conv.ask('Hola, bienvenido a Nica Destinos, puedo ayudar a encontrar destinos en Esteli, Matagalpa, Granada y Rivas');
    conv.ask('¿Que departamento deseas visitar en Nicaragua?');
    conv.ask(new Suggestions('Esteli', 'Matagalpa'));
    _
});


app.intent('Ani Test Intent', (conv, { Departamento }) => {

});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);