'use strict'
const { findDepartmentByName, findAllDepartments, getInlineEnum } = require('./functions')
const { dialogflow, Suggestions, List } = require('actions-on-google')
const functions = require('firebase-functions')
const app = dialogflow({ debug: true })
const responses = require('./responses.json')

let departments, departmentList, items

//todo: Repeat Intent

const fetchDepartments = async function () {
  departments = await findAllDepartments()
  items = {}
  departments.forEach(d => {
    items[d.name] = {}
    items[d.name]['title'] = d.name
    items[d.name]['description'] = d.description
  })
  departments = departments.map(d => d.name)
  departmentList = getInlineEnum(departments)
}

class Helper {
  constructor(conv) {
    this.conv = conv
  }

  doAnotherActivity(name, transportation, departmentName, Actividades) {
    let response = responses['Location Intent']
    response = response.replace('${place}', name)
    response = response.replace('${transportation}', transportation)
    if (Actividades) {
      this.conv.ask(`Puedes realizar ${Actividades} en ${name}. ${response}`)
    } else {
      this.conv.ask(response)
    }
    this.conv.ask(`¿Te gustaría hacer algo más en ${departmentName}?`)
    this.conv.ask(new Suggestions('Sí', 'No'))
  }

}

app.middleware((conv) => {
  conv.helper = new Helper(conv)
})

// Handles the Default Welcome Intent
app.intent('Default Welcome Intent', async conv => {
  let response
  // Data is fetch from firebase and the first 4 items are taken for the response
  await fetchDepartments()
  const firstFour = departments.slice(0, 4);
  const fourInline = getInlineEnum(firstFour);
  
  // If the user has already use our action a different greeting message is output
  if (conv.user.lastSeen) {
    response = responses[conv.intent][0]
  } else {
    response = responses[conv.intent][1]
  }
  response = response.replace('${fourInline}', fourInline)
  conv.ask(response)
  
  // A list with all the result is shown to user for an easy interaction
  if (conv.screen) {
    conv.ask(new List({
      title: 'Lista de Departamentos',
      items
    }))
  }
})

app.intent('Tourist Intent', async (conv, { Departamento }) => {
  try {
    let target = conv.arguments.get('OPTION') || Departamento
    const department = await findDepartmentByName(target)
    let response = responses[conv.intent]
    conv.data.department = department
    conv.data.departmentName = target
    response = response.replace('${departament}', target)
    response = response.replace('${activities}', getInlineEnum(department.activities))
    conv.ask(`${department.description}. ${response}`)
    conv.ask('¿Qué te gustaría hacer?')
    conv.ask(new Suggestions(department.activities))
  } catch (e) {
    await fetchDepartments()
    conv.ask(`No he encontrado resultados`)
    conv.ask(`Puedes consultar destinos en ${departmentList}.`)
  }
})

app.intent('Activities Intent', async (conv, { Actividades, Departamento }) => {
  let { department, departmentName } = conv.data
  try {
    let target = ''
    if (Departamento) {
      target = await findDepartmentByName(Departamento)
      conv.data.departmentName = departmentName = Departamento
      conv.data.department = department = target
    }
    const results = department.places.filter(place => place.activities.includes(Actividades) === true)
    let response = responses[conv.intent]
    conv.data.activity = Actividades
    response = response.replace('${activity}', Actividades)
    if (results.length > 1) {
      let places = results.map(place => place.name)
      conv.ask(response)
      conv.ask(`${getInlineEnum(places)}. ¿A cúal te gustaría ir?`)
    } else {
      let { name, transportation } = results[0]
      conv.helper.doAnotherActivity(name, transportation, departmentName, Actividades)
    }
  } catch (e) {
    conv.ask(`No he encontrado actividades de ese tipo en ese departamento.`)
    if (department && department.hasOwnProperty('activities')) {
      conv.ask(`Sin embargo puedes hacer ${getInlineEnum(department.activities)}. Cúal te gusta?`)
    } else {
      await fetchDepartments()
      conv.ask(`Puedes consultar destinos en ${departmentList}.`)
    }
  }
})

app.intent('Location Intent', (conv, { Lugar }) => {
  const place = conv.arguments.get('OPTION') || Lugar
  const { department, departmentName } = conv.data
  let { transportation } = department.places.find(p => p.name === place)
  conv.helper.doAnotherActivity(place, transportation, departmentName)
})


// app.intent('Help Intent', async (conv) => {
//   await fetchDepartments()
//   departmentList = departmentList.replace('y', 'o')
//   conv.ask('Puedo brindarte información sobre lugares recomendados y agradables en Nicaragua. Solo di el nombre del departamento que quieras visitar.')
//   conv.ask(departmentList)
// })

app.intent(['Activities Intent - yes', 'Location Intent - yes'], async conv => {
  const { departmentName } = conv.data
  const result = await findDepartmentByName(departmentName)
  let response = responses['Tourist Intent']
  response = response.replace('${departament}', departmentName)
  response = response.replace('${activities}', getInlineEnum(result.activities))
  conv.ask(response)
  conv.ask('¿Qué te gustaría hacer?')
  conv.ask(new Suggestions(result.activities))
})

app.intent(['Activities Intent - no', 'Location Intent - no'], conv => {
  conv.ask('Deseas saber sobre otro departamento?')
  conv.ask(new Suggestions('Sí', 'No'))
})

app.intent(['Location Intent - no - yes', 'Activities Intent - no - yes', 'Other Department Intent'], async conv => {
  await fetchDepartments()
  conv.ask(`Puedes relizar actividades en ${departmentList}.`)
  conv.ask('¿Cuál te gustaría conocer?')
  if (conv.screen) {
    conv.ask(new List({
      title: 'Lista de Departamentos',
      items
    }))
  }
})

app.intent('actions_intent_NO_INPUT', (conv) => {
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'))
  if (repromptCount === 0) {
    conv.ask('Cúal departamento?')
  } else if (repromptCount === 1) {
    conv.ask(`Por favor di el nombre de un departamento.`)
  } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
    conv.close('No he podido entenderte, por favor prueba mas tarde')
  }
})

exports.fulfillment = functions.https.onRequest(app)
