# bccompsci.club handleJoin

The handleJoin Google Cloud Function for handling member join requests. Stores new member data on MySQL and Google Cloud Firestore.

## Environment Variables

**MAILCHIMP_API_KEY:** The Mailchimp API Key for the Mailchimp account.\
**MAILCHIMP_SERVER:** The Mailchimp server being used by the Mailchimp account. For example, "us19".\
**MAILCHIMP_MAILING_LIST_ID:** The Mailchimp mailing list ID to subscribe new members to.\
**DB_SOCKET:** The UNIX socket of the MySQL database to connect to.\
**DB_PORT:** The port of the MySQL database to connect to.\
**DB_USERNAME:** The username of the MySQL database user to connect with.\
**DB_PASSWORD:** The password of the MySQL database user to connect with.\
**DB_DATABASE:** The database to use in the MySQL database.
