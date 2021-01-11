const { v4: uuidv4 } = require('uuid');
const db = require('./firestore');

const addToCloudFirestore = async (newMember) => {
  const { firstName, lastName, email } = newMember;

  // The Cloud Firestore members collection
  const collectionRef = db.collection('members');

  // Generate unique document ID
  const docId = `${firstName} ${lastName} ${email} ${uuidv4()}`;
  const docRef = collectionRef.doc(docId);

  // Check if the member's email is already in Cloud Firestore
  const firestoreQueryResult = await collectionRef
    .where('email', '==', email)
    .get();
  if (firestoreQueryResult.empty) {
    // Add member to Cloud Firestore
    console.log('Adding member to the Cloud Firestore database...');
    await docRef.set({
      firstName: firstName,
      lastName: lastName,
      email: email,
      joinDate: new Date(),
    });
    console.log('Successfully added member to the Cloud Firestore database.');
  } else {
    console.warn(
      `The member ${firstName} ${lastName} with email ${email} is already registered!`
    );
  }
};

module.exports = addToCloudFirestore;
