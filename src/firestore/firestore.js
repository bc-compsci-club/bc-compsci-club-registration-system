const admin = require('firebase-admin');

// Initialize Cloud Firestore
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

module.exports = db;
