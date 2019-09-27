'use strict'
const {findDepartmentByName} = require('./functions')
const {dialogflow, Suggestions} = require('actions-on-google')
const functions = require('firebase-functions')
const app = dialogflow({debug: true})
const response = require('./responses.json')

app.intent('Default Welcome Intent', conv => {
  conv.ask('Hola, bienvenido a Nica Destinos, puedo ayudarte a encontrar destinos en Esteli, Matagalpa, Granada y Rivas')
  conv.ask('¿Que departamento deseas visitar en Nicaragua?')
  conv.ask(new Suggestions('Granada', 'Matagalpa'))
})

app.intent('Tourist Intent', async (conv, {Departamento}) => {
  const department = await findDepartmentByName(Departamento)
  conv.ask(department.description)
  let respuesta = response[conv.intent]
  conv.data.department = department
  respuesta = respuesta.replace('${departament}', Departamento)
  respuesta = respuesta.replace('${activities}', department.activities.toString())
  conv.ask(respuesta)
})

app.intent('Activities Intent', (conv, {Actividades}) => {
  const {department} = conv.data;
  const places = department.places.filter(place => place.activities.includes(Actividades) === true)
  let placesNames = places.map(p => p.name).toString()
  let respuesta = response[conv.intent]
  conv.data.activity = Actividades
  respuesta = respuesta.replace('${activity}', Actividades)
  conv.ask(respuesta + placesNames)
  conv.ask('A cual te gustaria ir?')
})


exports.fulfillment = functions.https.onRequest(app)
