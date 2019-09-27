const { dialogflow } = require('actions-on-google');
const functions = require('firebase-functions');

const app = dialogflow({ debug: true });

app.intent('intent-name', (conv, parameters) => {
    return conv.ask('¿Que puedo hacer por ti?');
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);