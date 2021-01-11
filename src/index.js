const sanitize = require('mongo-sanitize');
const emailValidator = require('email-validator');

require('./sequelize/sequelize.js');
require('./firestore/firestore.js');
require('./mailchimp/mailchimp.js');

const addMemberToSql = require('sequelize/addMemberToSql');
const addMemberToFirestore = require('firestore/addMemberToFirestore');
const subscribeMemberToMailchimp = require('mailchimp/subscribeMemberToMailchimp.js');

const GENERAL_ERROR_MESSAGE = `An error occurred while we were trying to register you for the club! Please try again. If that still doesn't work, please send us an email at contact@bccompsci.club so we can register you manually.`;
const INVALID_EMAIL_ERROR_MESSAGE = `The email address you entered is invalid. Please try again. If that doesn't work, please send us an email at contact@bccompsci.club so we can register you manually.`;

/**
 * HTTP Cloud Function. Powered by Node.js and Express.
 * https://cloud.google.com/functions/docs/writing/http#http_frameworks
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
exports.handleJoin = async (req, res) => {
  // Accept only POST methods
  // https://cloud.google.com/functions/docs/writing/http#handling_http_methods
  if (req.method !== 'POST') {
    console.error('Invalid request type!');
    res.status(405).send(GENERAL_ERROR_MESSAGE);
    return;
  }

  // Check for correct referer and reject if it isn't from the official website
  if (!(req.get('referer').substring(0, 22) === 'https://bccompsci.club')) {
    console.error('Incorrect referer!');
    console.log('Referer: ' + req.get('referer'));
    res.status(403).send(GENERAL_ERROR_MESSAGE);
    return;
  }

  // Sanitize and parse inputs
  const newMember = {
    firstName: sanitize(req.body['first-name']),
    lastName: sanitize(req.body['last-name']),
    email: sanitize(req.body['email']),
  };

  console.log(
    `${newMember.firstName} ${newMember.lastName} is requesting to join the club with email ${newMember.email}`
  );

  // Validate email address form before adding to database
  if (!emailValidator.validate(newMember.email)) {
    console.error('Invalid email address!');
    res.status(400).send(INVALID_EMAIL_ERROR_MESSAGE);
    return;
  }

  // Add member to SQL database
  console.log('Step 1: Add member to SQL database');
  try {
    await addMemberToSql(newMember);
  } catch (error) {
    console.error('Unable to add member to the SQL database.');
    console.error(error);
  }

  // Add member to Cloud Firestore database
  console.log('Step 2: Add member to Cloud Firestore database');
  try {
    await addMemberToFirestore(newMember);
  } catch (error) {
    console.error('Unable to add user to the Cloud Firestore database.');
    console.error(error);
  }

  // Subscribe the member to the Mailchimp mailing list
  console.log('Step 3: Subscribe member to Mailchimp mailing list');
  try {
    await subscribeMemberToMailchimp(newMember);
    console.log('Mailchimp mailing list subscription complete.');
  } catch (error) {
    console.error(
      'There was an error subscribing the member to the mailing list.'
    );
    console.error(error);
  }

  console.log(
    `${newMember.firstName} ${newMember.lastName} has joined the club with email ${newMember.email}`
  );

  // Redirect to welcome page after adding to the database and subscribing to Mailchimp
  console.log(
    'Member registration complete! Redirecting member to the welcome page...'
  );
  res.redirect('https://bccompsci.club/welcome');
};
