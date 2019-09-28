const admin = require('firebase-admin')
const serviceAccount = require("./serviceAccountKey.json");
const functions = require('firebase-functions')


if (process.env.FIREBASE_CONFIG) {
    admin.initializeApp(functions.config().firebase)
} else {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://nicadestinos-vsismk.firebaseio.com"
    });
}

exports.admin = admin;