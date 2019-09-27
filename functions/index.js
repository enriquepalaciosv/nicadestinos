'use strict'
const {findDepartmentByName} = require('./functions')
const {dialogflow, Suggestions} = require('actions-on-google')
const functions = require('firebase-functions')
const app = dialogflow({debug: true})
// const response = require(./responses.json')

// const Departments = [
//   {
//     'name': 'Granada',
//     'description': 'El norteño departamento de Madriz posee diversos atractivos naturales y culturales en su mediano territorio, compuesto por altos valles interrumpidos por montañas en donde predominan las frescas temperaturas. ',
//     'creationDate': '2019-09-27',
//     'places': [
//       {
//         'name': 'cerrito Las Banderas',
//         'description': 'Una de las elevaciones de la montañosa, rural y silvestre isla Zapatera es el cerro Las Banderas',
//         'transportation': 'La forma más fácil de llegar a la isla Zapatera es desde el puerto de Asese, en Granada. Sin embargo, no existe transporte público a la isla, así que la única forma es pagando un viaje privado.',
//         'activities': [
//           'canopy',
//           'escalar'
//         ],
//         'category': 'cerros',
//         'type': 'attractions'
//       },
//       {
//         'name': 'Casa Isla Zopango',
//         'description': ' Casa Zopango puede recibir a 10 huéspedes (8 adultos y 2 niños de cualquier edad). La recepción en la casa y la isla solo es posibe con reservaciones anticipadas.',
//         'transportation': 'Ubicada en la isleta privada Zopango, en el archipiélago de las isletas y la bahía de Asese (30 minutos de Granada).',
//         'activities': [
//           'Avistamiento de aves',
//           'Pesca',
//           'Paseo en lancha'
//         ],
//         'category': 'hotel',
//         'type': 'lodge'
//       }
//     ]
//   },
//   {
//     'name': 'Matagalpa',
//     'description': 'es uno de los mayores atractivos turísticos de Nicaragua, y uno de los puntos más visitados por turístas extranjeros en la actualidad. ',
//     'creationDate': '2019-09-27',
//     'places': [
//       {
//         'name': 'cañon de Somoto',
//         'description': 'una de las formaciones rocosas más antiguas de Centroamérica, se ha convertido en los últimos tiempos en uno de los principales destinos de la zona Norte de Nicaragua.',
//         'transportation': 'primero debes de tomar el transporte público que se dirija hacia Somoto, luego',
//         'activities': [
//           'nadar',
//           'senderismo'
//         ],
//         'category': 'cañon',
//         'type': 'attractions'
//       },
//       {
//         'name': 'Hostal san Jose',
//         'description': ' es un negocio familiar ubicado.',
//         'transportation': 'en la zona céntrica de la ciudad de Somoto, a pocas cuadras del parque central, de la terminal de buses interurbanos.',
//         'activities': [
//           'Desayuno'
//         ],
//         'category': 'hostal',
//         'type': 'lodge'
//       }
//     ]
//   }
// ]

app.intent('Default Welcome Intent', conv => {
  conv.ask('Hola, bienvenido a Nica Destinos, puedo ayudar a encontrar destinos en Esteli, Matagalpa, Granada y Rivas')
  conv.ask('¿Que departamento deseas visitar en Nicaragua?')
  conv.ask(new Suggestions('Granada', 'Matagalpa'))
})

app.intent('Department Intent', async (conv, {Departamento}) => {
  const department = await findDepartmentByName(Departamento)
  conv.ask(department.description)
  conv.ask(`Tengo información sobre lugares turísticos y hospedajes en ${Departamento}, ¿Cúal opcion te gustaría?`)
  conv.ask(new Suggestions('Lugares turísticos', 'Hospedajes'))
})


exports.fulfillment = functions.https.onRequest(app)
