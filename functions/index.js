'use strict'
const {aniTest} = require('./functions')
const {dialogflow, Suggestions} = require('actions-on-google')
const functions = require('firebase-functions')
const app = dialogflow({debug: true})

app.intent('Default Welcome Intent', conv => {
  conv.ask('Hola, bienvenido a Nica Destinos, puedo ayudar a encontrar destinos en Esteli, Matagalpa, Granada y Rivas')
  conv.ask('¿Que departamento deseas visitar en Nicaragua?')
  conv.ask(new Suggestions('Esteli', 'Matagalpa'))
})


app.intent('Ani Test Intent', async (conv, {Departamento}) => {
  const department = await aniTest(Departamento)
  conv.ask('Result: ' + department.description)
})

exports.fulfillment = functions.https.onRequest(app);
