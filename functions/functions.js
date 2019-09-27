const { admin } = require('./firebase-config');

process.env.DEBUG = 'dialogflow:debug'

const db = admin.firestore();

exports.findDepartmentByName = departmentName => {
    return db.collection('Departments').where('name', '==', departmentName.toUpperCase())
        .get()
        .then(snapshot => {
            let dep;
            snapshot.forEach(d => { dep = d.data() });
            return dep;
        })
        .catch(error => {
            console.log('Error getting documents: ', error)
        })
}

//exports.findDepartmentByName('Granada')