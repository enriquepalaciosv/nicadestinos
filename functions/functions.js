const functions = require('firebase-functions');
const admin = require('firebase-admin');

process.env.DEBUG = 'dialogflow:debug';

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

exports.aniTest = Departmento => {
    db.collection("departments").where("name", "==", Departmento.toLowerCase())
        .get()
        .then((querySnapshot) => {
            console.log(querySnapshot.data());
            return querySnapshot.data();
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });
};