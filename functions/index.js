'use strict'
const {findDepartmentByName, findAllDepartments, getInlineEnum} = require('./functions')
const {dialogflow, Suggestions, List} = require('actions-on-google')
const functions = require('firebase-functions')
const app = dialogflow({debug: true})
const responses = require('./responses.json')

app.intent('Default Welcome Intent', async conv => {
  let departments = await findAllDepartments()
  departments = departments.map(d => d.name)
  const departmentList = getInlineEnum(departments)
  conv.ask(`Hola, bienvenido a Nica Destinos, puedo ayudarte a encontrar destinos en ${departmentList}.`)
  conv.ask('¿Que departamento deseas visitar en Nicaragua?')
  conv.ask(new Suggestions(departments))
})

app.intent('Tourist Intent', async (conv, {Departamento}) => {
  try {
    const department = await findDepartmentByName(Departamento)
    let response = responses[conv.intent]
    conv.data.department = department
    response = response.replace('${departament}', Departamento)
    response = response.replace('${activities}', getInlineEnum(department.activities))
    conv.ask(`${department.description} ${response}`)
    conv.ask('¿Qué te gustaría hacer?')
    conv.ask(new Suggestions(department.activities))
  } catch (e) {
    let departments = await findAllDepartments()
    departments = departments.map(d => d.name)
    const departmentList = getInlineEnum(departments)
    conv.ask(`No he encontrado resultado para ${Departamento}`)
    conv.ask(`Puedes consultar destinos en ${departmentList}.`)
    conv.ask(new Suggestions(departments))
  }
})

app.intent('Activities Intent', (conv, {Actividades}) => {
  const {department} = conv.data
  const results = department.places.filter(place => place.activities.includes(Actividades) === true)
  console.log('places', results)
  let response = responses[conv.intent]
  conv.data.activity = Actividades
  response = response.replace('${activity}', Actividades)
  if (results.length > 1) {
    let items = {}
    results.forEach(place => {
      items[place.name] = {}
      items[place.name]['title'] = place.name
      items[place.name]['description'] = place.description
    })
    let places = results.map(place => place.name)
    conv.ask(response)
    conv.ask(`${getInlineEnum(places)}. A cúal te gustaria ir?`)
    if (conv.screen) {
      conv.ask(new List({
        title: 'Lista de Lugares',
        items
      }))
    }
  } else {
    let response = responses['Location Intent']
    let {name, transportation} = results[0]
    conv.data.place = name
    response = response.replace('${place}', name)
    response = response.replace('${transportation}', transportation)
    conv.ask(`Puedes realizar ${Actividades} en ${name}. ${response}`)
  }
})

app.intent('Location Intent', (conv, {Lugar}) => {
  const place = conv.arguments.get('OPTION') || Lugar;
  console.log('place', place)
  const {department} = conv.data
  let {transportation} = department.places.find(p => p.name === place)
  let response = responses[conv.intent]
  conv.data.place = place
  response = response.replace('${place}', place)
  response = response.replace('${transportation}', transportation)
  conv.ask(response)
})

exports.fulfillment = functions.https.onRequest(app)
