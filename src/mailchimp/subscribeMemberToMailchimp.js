const mailchimp = require('./mailchimp');
const md5 = require('md5');

const listId = process.env.MAILCHIMP_MAILING_LIST_ID; // ID for the main mailing list.

// Check if member is in the mailing list and subscribe them if they aren't in the mailing list
const subscribeMemberToMailchimp = async (newMember) => {
  const { firstName, lastName, email } = newMember;
  const subscriberHash = md5(email.toLowerCase());

  console.log('Attempting to subscribe the member to the Mailchimp mailing list...');

  try {
    // Check if the member is already in the list
    const response = await mailchimp.lists.getListMember(
      listId,
      subscriberHash
    );

    console.log(
      `The subscription status for the email "${email}" is ${response.status}.`
    );
  } catch (e) {
    // A status of 404 here means the member isn't in the mailing list
    if (e.status === 404) {
      console.log(
        `The email "${email}" is not subscribed to the mailing list. Subscribing...`
      );

      // Because the member isn't in the mailing list, add the member to the mailing list
      try {
        const response = await mailchimp.lists.addListMember(listId, {
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            FNAME: firstName,
            LNAME: lastName,
          },
        });

        console.log(
          `Successfully subscribed member to the mailing list! The contact's id is ${response.id}.`
        );
      } catch (error) {
        console.error('Unable to subscribe member to the mailing list.');
        console.error(error);
      }
    }
  }
};

module.exports = subscribeMemberToMailchimp;
