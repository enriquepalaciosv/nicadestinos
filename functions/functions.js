const { admin } = require('./firebase-config');

process.env.DEBUG = 'dialogflow:debug'

const db = admin.firestore();

exports.findAllDepartments = () => {
    return db.collection('Departments').get()
        .then(snapshot => {
            const departments = [];
            snapshot.forEach(d => departments.push(d.data()));
            return departments;
        })
        .catch(error => {
            console.log('Error getting documents: ', error)
            return [];
        })
};

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
//exports.findAllDepartments();