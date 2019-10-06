'use strict'
const {findDepartmentByName, findAllDepartments, getInlineEnum, departmentsCarousel} = require('./functions')
const {dialogflow, Suggestions, Permission, NewSurface} = require('actions-on-google')
const functions = require('firebase-functions')
const i18n = require('i18n')
const path = require('path')
let departments, fourInline, items, response


i18n.configure({
  locales: ['es-419', 'en-US'],
  directory: path.join(__dirname, '/locales'),
  defaultLocale: 'es-419'
})

const app = dialogflow({debug: true})

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
  const firstFour = departments.map(d => d.name).slice(0, 4)
  fourInline = getInlineEnum(firstFour)
}

// Helper class to ask the user if he is interested in another activity
class Helper {
  constructor (conv) {
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
  doAnotherActivity (name, transportation, departmentName, Actividades) {
    response = i18n.__('LOCATION_INTENT', {
      'place': name,
      transportation
    })
    if (Actividades) {
      this.conv.ask(i18n.__('ANOTHER_ACTIVITY', {
        Actividades,
        name,
        response
      }))
      // this.conv.ask(`Puedes realizar ${Actividades} en ${name}. ${response}`)
    } else {
      this.conv.ask(response)
    }
    this.conv.ask(i18n.__('ANOTHER_ACTIVITY_CONFIRM', {departmentName}))
    // this.conv.ask(`¿Te gustaría hacer algo más en ${departmentName}?`)
  }
  
}

// Middleware to inject our Helper class
app.middleware((conv) => {
  conv.localize = () => {
    i18n.setLocale(conv.user.locale)
  }
  conv.helper = new Helper(conv)
})

// Handles the Default Welcome Intent
app.intent('Default Welcome Intent', async conv => {
  conv.localize()
  const screenAvailable =
    conv.available.surfaces.capabilities.has(
      'actions.capability.SCREEN_OUTPUT')
  const name = conv.user.storage.userName
  if (conv.screen) {
    if (!name) {
      // Asks the user's permission to know their name, for personalization.
      conv.ask(new Permission({
        context: i18n.__('NAME_PERMISSION'),
        permissions: 'NAME'
      }))
    } else {
      // Data is fetch from firebase and the first 4 items are taken for the response
      await fetchDepartments()
      conv.localize()
      // If the user has already use our action a different greeting message is output
      let key = (conv.user.lastSeen) ? 'WELCOME_NEW' : 'WELCOME_RECURRENT'
      response = i18n.__(key, {
        fourInline,
        name
      })
      conv.ask(response)
      conv.ask(departmentsCarousel(departments))
    }
  } else if (screenAvailable) {
    // If the current device doesn't have a screen, the user is asked to switch to a screen device
    const context = i18n.__('NO_SCREEN_AVAILABLE')
    const notification = i18n.__('SCREEN_NOTIFICATION')
    const capabilities = ['actions.capability.SCREEN_OUTPUT']
    conv.ask(new NewSurface({
      context,
      notification,
      capabilities
    }))
  }
})

// Handle new Surface Intent
app.intent('actions_intent_NEW_SURFACE', async (conv, input, newSurface) => {
  // Once the transfer is confirmed conversion continues normally
  await fetchDepartments()
  conv.localize()
  let key = (newSurface.status === 'OK') ? 'SCREEN_DEVICE_ACCEPTED' : 'SCREEN_DEVICE_REJECTED'
  response = i18n.__(key, {fourInline})
  conv.ask(response)
})

// Handle Near Intent
app.intent('Near Intent', conv => {
  const permissions = []
  let context
  if (conv.user.verification === 'VERIFIED') {
    // Could use DEVICE_COARSE_LOCATION instead for city, zip code
    permissions.push('DEVICE_PRECISE_LOCATION')
    context = i18n.__('LOCATION_PERMISSION')
    conv.user.storage.near = true
  }
  const options = {
    context,
    permissions
  }
  conv.ask(new Permission(options))
})

// Handle the Dialogflow intent named 'actions_intent_PERMISSION'. If user
// agreed to PERMISSION prompt, then boolean value 'permissionGranted' is true.
app.intent('actions_intent_PERMISSION', async (conv, params, permissionGranted) => {
  // Data is fetch from firebase and the first 4 items are taken for the response
  await fetchDepartments()
  conv.localize()
  try {
    let {location} = conv.device
    let {near} = conv.user.storage
    let department, activities
    // If the permission wasn't granted we thanks otherwise the username is stored for future use
    if (!permissionGranted) {
      let key = (near) ? 'LOCATION_REJECTED' : 'NAME_PERMISSION_REJECTED'
      response = i18n.__(key, {fourInline})
    } else {
      if (location && near) {
        let target = location.city
        department = await findDepartmentByName(target)
        conv.localize()
        activities = getInlineEnum(department.activities)
        response = i18n.__('LOCATION_ACCEPTED', {
          'department': target,
          activities
        })
      } else {
        let userName = conv.user.storage.userName = conv.user.name.display
        response = i18n.__('NAME_PERMISSION_ACCEPTED', {
          fourInline,
          userName
        })
      }
    }
    
    conv.ask(response)
    if (near) {
      conv.ask(new Suggestions(department.activities))
    } else {
      // A list with all the result is shown to user for an easy interaction
      if (conv.screen) {
        conv.ask(departmentsCarousel(departments))
      }
    }
  } catch (e) {
    conv.ask(i18n.__('LOCATION_ERROR'))
  }
})

//Handles the Tourist Intent (aka the Department intent)
app.intent('Tourist Intent', async (conv, {Departamento}) => {
  try {
    // We try to get option the user choose or said and retrieve all data related
    // to that option once data is fetch the activities related are presented to the user
    let target = conv.arguments.get('OPTION') || Departamento
    const department = await findDepartmentByName(target)
    conv.localize()
    conv.data.department = department
    conv.data.departmentName = target
    response = i18n.__('TOURIST_INTENT', {
      'department': target,
      'activities': getInlineEnum(department.activities)
    })
    
    conv.ask(`${department.description}. ${response}`)
    conv.ask(i18n.__('TOURIST_QUESTION'))
    conv.ask(new Suggestions(department.activities))
  } catch (e) {
    // If an error happens or not result is found a message is prompt to the user with other
    // options he can choose. This is also triggered with implicit invocations
    await fetchDepartments()
    conv.localize()
    response = i18n.__('TOURIST_INTENT_NO_RESULTS', {fourInline})
    conv.ask(response)
  }
})

//Handles the Activities Intent
app.intent('Activities Intent', async (conv, {Actividades, Departamento}) => {
  // The department object and Name is retrive from the conversarion data
  let {department, departmentName} = conv.data
  try {
    let target = ''
    // If this intent is executed on implicit invocation the department name is pull from
    // the conv params and the data related to that department is fetch
    if (Departamento) {
      target = await findDepartmentByName(Departamento)
      conv.localize()
      conv.data.departmentName = departmentName = Departamento
      conv.data.department = department = target
    }
    // All places within that department are filter by the activity the user choose
    const results = department.places.filter(place => place.activities.includes(Actividades) === true)
    conv.data.activity = Actividades
    response = i18n.__('ACTIVITIES_INTENT', {'activity': Actividades})
    
    // if the results include more than one place they got listed so the user knows
    // how to access there. If just a single result is found all details related are
    // presented to the user and finally the user is asked if he is interested in another
    // activity
    if (results.length > 1) {
      let places = results.map(place => place.name)
      conv.ask(response)
      conv.ask(i18n.__('ACTIVITIES_PLACES', {places: getInlineEnum(places)}))
    } else {
      let {name, transportation} = results[0]
      conv.helper.doAnotherActivity(name, transportation, departmentName, Actividades)
    }
  } catch (e) {
    // No result are found different response are output according if the issue was related
    // to the Department or the Activity
    conv.ask(i18n.__('ACTIVITIES_INTENT_NO_RESULT_DEFAULT'))
    if (department && department.hasOwnProperty('activities')) {
      response = i18n.__('ACTIVITIES_INTENT_NO_RESULT_ACTIVITIES', {'activities': getInlineEnum(department.activities)})
      conv.ask(response)
      conv.ask(new Suggestions(department.activities))
    } else {
      await fetchDepartments()
      conv.localize()
      response = i18n.__('ACTIVITIES_INTENT_NO_RESULT_DEPARTMENT', {fourInline})
      conv.ask(response)
      conv.ask(new Suggestions(i18n.__('YES'), i18n.__('NO')))
    }
  }
})

//Handles the Location Intent (aka the places intent)
app.intent('Location Intent', (conv, {Lugar}) => {
  try {
    // We try to get option the user choose or said and retrieve all data related
    const place = conv.arguments.get('OPTION') || Lugar
    const {department, departmentName} = conv.data
    let {transportation} = department.places.find(p => p.name === place)
    // Details related are presented to the user and finally the user is asked if he is interested in
    // another activity
    conv.helper.doAnotherActivity(place, transportation, departmentName)
  } catch (e) {
    conv.ask(i18n.__('LOCATION_ERROR'))
  }
})

// Handles the help intent
app.intent('Help Intent', async (conv) => {
  // Data is fetch from the database and a help message is output to the user
  await fetchDepartments()
  conv.localize()
  conv.ask(i18n.__('HELP_INTENT'))
  // A list with all the result is shown to user for an easy interaction
  if (conv.screen) {
    conv.ask(departmentsCarousel(departments))
  }
})

// Handles the Activities Intent - yes & Location Intent - yes
app.intent(['Activities Intent - yes', 'Location Intent - yes'], async conv => {
  // In case the user wants to know other activities in the department, the department name
  // is retrieve form the session the user is asked what other activity he would like to do
  const {departmentName} = conv.data
  const result = await findDepartmentByName(departmentName)
  response = i18n.__('TOURIST_INTENT', {
    'department': departmentName,
    'activities': getInlineEnum(result.activities)
  })
  conv.ask(response)
  conv.ask(i18n.__('TOURIST_QUESTION'))
  conv.ask(new Suggestions(result.activities))
})

// Handles the Activities Intent - yes & Location Intent - yes
app.intent(['Activities Intent - no', 'Location Intent - no'], conv => {
  // If the user doesn't want to know more about activities related to the current department
  // the action ask if he wants to know more info about other department
  conv.ask(i18n.__('ACTIVITIES_INTENT_NO'))
  conv.ask(new Suggestions(i18n.__('YES'), i18n.__('NO')))
})

// Handles the Activities Intent no - yes & Location Intent - no - yes & Other Department Intent
app.intent(['Location Intent - no - yes', 'Activities Intent - no - yes', 'Other Department Intent'], async conv => {
  // If the user changes the current department scope data is fetch from the database
  // and a message with the departments list is output
  await fetchDepartments()
  conv.localize()
  response = i18n.__('LOCATION_INTENT_NO_YES', {fourInline})
  conv.ask(response)
  // A list with all the result is shown to user for an easy interaction
  if (conv.screen) {
    conv.ask(departmentsCarousel(departments))
  }
})

//Handles the No Input Intent
app.intent('actions_intent_NO_INPUT', (conv) => {
  // For sound only devices if no input is gathered from the user a repromt message is ask
  // in other to continue with the conversation, for the 2nd time if the user didn't say
  // anything the actions farewell to the user
  const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'))
  if (repromptCount === 0) {
    conv.ask(i18n.__('REPROMPT_1'))
  } else if (repromptCount === 1) {
    conv.ask(i18n.__('REPROMPT_2'))
  } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
    conv.close(i18n.__('REPROMPT_3'))
  }
})

exports.fulfillment = functions.https.onRequest(app)
