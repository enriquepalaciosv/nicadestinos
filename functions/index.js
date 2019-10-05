'use strict'
const { findDepartmentByName, findAllDepartments, getInlineEnum } = require('./functions')
let template = require('lodash.template');
const { dialogflow, Suggestions, List, Permission } = require('actions-on-google')
const functions = require('firebase-functions')
const app = dialogflow({ debug: true })
const responses = require('./responses.json')

let departments, fourInline, items, response, responseFn

//todo: Repeat Intent

/**
 * Fetch the data related to all departments from the database
 * and create all items needed to be displayed on the `Departments List`
 * @return {Promise<void>}
 */
const fetchDepartments = async function () {
  departments = await findAllDepartments()
  items = {}
  departments.forEach(d => {
    items[d.name] = {}
    items[d.name]['title'] = d.name
    items[d.name]['description'] = d.description
  })
  departments = departments.map(d => d.name)
  const firstFour = departments.slice(0, 4);
  fourInline = getInlineEnum(firstFour)
}

// Helper class to ask the user if he is interested in another activity
class Helper {
  constructor(conv) {
    this.conv = conv
  }
  
  /**
   * Ask the user which activities he can perform in the current department or
   * if he is interested in something else
   * @param {string} name - Place name
   * @param {string} transportation - Transportation description
   * @param {string} departmentName - Department name
   * @param {string} [Actividades] - All activities related to the department
   */
  doAnotherActivity(name, transportation, departmentName, Actividades) {
    responseFn = template(responses['Location Intent'])
    response = responseFn({'place': name, transportation})
    if (Actividades) {
      this.conv.ask(`Puedes realizar ${Actividades} en ${name}. ${response}`)
    } else {
      this.conv.ask(response)
    }
    this.conv.ask(`¿Te gustaría hacer algo más en ${departmentName}?`)
    this.conv.ask(new Suggestions('Sí', 'No'))
  }

}

// Middleware to inject our Helper class
app.middleware((conv) => {
  conv.helper = new Helper(conv)
})

// Handles the Default Welcome Intent
app.intent('Default Welcome Intent', async conv => {
  const name = conv.user.storage.userName;
  if (!name) {
    // Asks the user's permission to know their name, for personalization.
    conv.ask(new Permission({
      context: responses['Name Permission'],
      permissions: 'NAME',
    }));
  } else {
    // Data is fetch from firebase and the first 4 items are taken for the response
    await fetchDepartments()
  
    // If the user has already use our action a different greeting message is output
    if (conv.user.lastSeen) {
      responseFn = template(responses[conv.intent][0])
    } else {
      responseFn = template(responses[conv.intent][1])
    }
    response = responseFn({fourInline, name})
    conv.ask(response)
  
    // A list with all the result is shown to user for an easy interaction
    if (conv.screen) {
      conv.ask(new List({
        title: 'Lista de Departamentos',
        items
      }))
    }
  }
})

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('actions_intent_PERMISSION', async (conv, params, permissionGranted) => {
  // Data is fetch from firebase and the first 4 items are taken for the response
  await fetchDepartments()
  
  // If the permission wasn't granted we thanks otherwise the username is stored for future use
  if (!permissionGranted) {
    responseFn = template(responses['Name Permission - Rejected'])
    response = responseFn({fourInline})
  } else {
    responseFn = template(responses['Name Permission - Accepted'])
    let userName = conv.user.storage.userName = conv.user.name.display
    response = responseFn({fourInline, userName})
  }
  conv.ask(response)
  // A list with all the result is shown to user for an easy interaction
  if (conv.screen) {
    conv.ask(new List({
      title: 'Lista de Departamentos',
      items
    }))
  }
})

//Handles the Tourist Intent (aka the Department intent)
app.intent('Tourist Intent', async (conv, { Departamento }) => {
  try {
    // We try to get option the user choose or said and retrieve all data related
    // to that option once data is fetch the activities related are presented to the user
    let target = conv.arguments.get('OPTION') || Departamento
    const department = await findDepartmentByName(target)
    responseFn = template(responses[conv.intent])
    conv.data.department = department
    conv.data.departmentName = target
    response = responseFn({'department': target, 'activities': getInlineEnum(department.activities)})
    conv.ask(`${department.description}. ${response}`)
    conv.ask('¿Qué te gustaría hacer?')
    conv.ask(new Suggestions(department.activities))
  } catch (e) {
    // If an error happens or not result is found a message is prompt to the user with other
    // options he can choose. This is also triggered with implicit invocations
    await fetchDepartments()
    responseFn = template(responses['Tourist Intent - No Results'])
    response = responseFn({fourInline})
    conv.ask(response)
  }
})

//Handles the Activities Intent
app.intent('Activities Intent', async (conv, { Actividades, Departamento }) => {
  // The department object and Name is retrive from the conversarion data
  let { department, departmentName } = conv.data
  try {
    let target = ''
    // If this intent is executed on implicit invocation the department name is pull from
    // the conv params and the data related to that department is fetch
    if (Departamento) {
      target = await findDepartmentByName(Departamento)
      conv.data.departmentName = departmentName = Departamento
      conv.data.department = department = target
    }
    // All places within that department are filter by the activity the user choose
    const results = department.places.filter(place => place.activities.includes(Actividades) === true)
    responseFn = template(responses[conv.intent])
    conv.data.activity = Actividades
    response = responseFn({'activity': Actividades})
    
    // if the results include more than one place they got listed so the user knows
    // how to access there. If just a single result is found all details related are
    // presented to the user and finally the user is asked if he is interested in another
    // activity
    if (results.length > 1) {
      let places = results.map(place => place.name)
      conv.ask(response)
      conv.ask(`${getInlineEnum(places)}. ¿A cúal te gustaría ir?`)
    } else {
      let { name, transportation } = results[0]
      conv.helper.doAnotherActivity(name, transportation, departmentName, Actividades)
    }
  } catch (e) {
    // No result are found different response are output according if the issue was related
    // to the Department or the Activity
    conv.ask(responses['Activities Intent - No Result - Default'])
    if (department && department.hasOwnProperty('activities')) {
      responseFn = template(responses['Activities Intent - No Result - Activities'])
      response = responseFn({'activities': getInlineEnum(department.activities)})
      conv.ask(response)
      conv.ask(new Suggestions(department.activities))
    } else {
      await fetchDepartments()
      responseFn = template(responses['Activities Intent - No Result - Department'])
      response = responseFn({fourInline})
      conv.ask(response)
    }
  }
})

//Handles the Location Intent (aka the places intent)
//todo: add try catch in case no property is found
app.intent('Location Intent', (conv, { Lugar }) => {
  // We try to get option the user choose or said and retrieve all data related
  const place = conv.arguments.get('OPTION') || Lugar
  const { department, departmentName } = conv.data
  let { transportation } = department.places.find(p => p.name === place)
  
  // Details related are presented to the user and finally the user is asked if he is interested in
  // another activity
  conv.helper.doAnotherActivity(place, transportation, departmentName)
})

// Handles the help intent
app.intent('Help Intent', async (conv) => {
  // Data is fetch from the database and a help message is output to the user
  await fetchDepartments()
  conv.ask(responses[conv.intent])
  // A list with all the result is shown to user for an easy interaction
  if (conv.screen) {
    conv.ask(new List({
      title: 'Lista de Departamentos',
      items
    }))
  }
})

// Handles the Activities Intent - yes & Location Intent - yes
app.intent(['Activities Intent - yes', 'Location Intent - yes'], async conv => {
  // In case the user wants to know other activities in the department, the department name
  // is retrieve form the session the user is asked what other activity he would like to do
  const { departmentName } = conv.data
  const result = await findDepartmentByName(departmentName)
  responseFn = template(responses['Tourist Intent'])
  response = responseFn({'department': departmentName, 'activities': getInlineEnum(result.activities)})
  conv.ask(response)
  conv.ask('¿Qué te gustaría hacer?')
  conv.ask(new Suggestions(result.activities))
})

// Handles the Activities Intent - yes & Location Intent - yes
app.intent(['Activities Intent - no', 'Location Intent - no'], conv => {
  // If the user doesn't want to know more about activities related to the current department
  // the action ask if he wants to know more info about other department
  conv.ask(responses[conv.intent])
  conv.ask(new Suggestions('Sí', 'No'))
})

// Handles the Activities Intent no - yes & Location Intent - no - yes & Other Department Intent
app.intent(['Location Intent - no - yes', 'Activities Intent - no - yes', 'Other Department Intent'], async conv => {
  // If the user changes the current department scope data is fetch from the database
  // and a message with the departments list is output
  await fetchDepartments()
  responseFn = template(responses[conv.intent])
  response = responseFn({fourInline})
  conv.ask(response)
  // A list with all the result is shown to user for an easy interaction
  if (conv.screen) {
    conv.ask(new List({
      title: 'Lista de Departamentos',
      items
    }))
  }
})

//Handles the No Input Intent
app.intent('actions_intent_NO_INPUT', (conv) => {
  // For sound only devices if no input is gathered from the user a repromt message is ask
  // in other to continue with the conversation, for the 2nd time if the user didn't say
  // anything the actions farewell to the user
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
