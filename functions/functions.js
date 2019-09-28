const { admin } = require('./firebase-config');

process.env.DEBUG = 'dialogflow:debug'

const db = admin.firestore();

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

exports.findAllDepartments = () => {
    return db.collection('Departments').get()
        .then(snapshot => {
            const departments = [];
            snapshot.forEach(d => {
                const data = d.data();
                departments.push({...data, name: capitalize(data.name) });
            });
            return departments;
        })
        .catch(error => {
            console.log('Error getting documents: ', error)
            return [];
        })
};
exports.findAllDepartments();


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

exports.getInlineEnum = names => {
    let inline = "";
    if (names.length === 1) {
        inline = names[0];
    } else {
        names.forEach((d, i) => {
            inline += (i + 1 === names.length) ? `y ${d}` : (i === names.length - 2 ? `${d} ` : `${d}, `);
        });
    }
    return inline;
};