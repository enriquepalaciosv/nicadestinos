const { admin } = require('./firebase-config');

process.env.DEBUG = 'dialogflow:debug'

const db = admin.firestore();

exports.findDepartmentByName = departmentName => {
    return db.collection('Departments').where('name', '==', departmentName.toUpperCase())
        .get()
        .then(snapshot => {
            console.log(snapshot.size);
            snapshot.forEach(doc => console.log(doc.data()));
        })
        .catch(error => {
            console.log('Error getting documents: ', error)
        })
}