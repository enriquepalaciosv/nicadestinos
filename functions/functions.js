const { admin } = require('./firebase-config');

process.env.DEBUG = 'dialogflow:debug'

const db = admin.firestore();

exports.findDepartmentByName = departmentName => {
    return db.collection('Departments').where('name', '==', departmentName.toUpperCase())
        .get()
        .then(snapshot => {
            let department = "";
            snapshot.forEach(d => { department = d.data() });
            return department;
        })
        .catch(error => {
            console.log('Error getting documents: ', error)
            return "Sin resultados";
        })
}

//exports.findDepartmentByName('Granada');