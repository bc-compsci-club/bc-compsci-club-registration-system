# Registration System - Brooklyn College Computer Science Club

The new backend registration system for the BC Computer Science Club. Stores new member data on MySQL and Google Cloud Firestore.

## Environment Variables

### Database

**DB_DIALECT:** The SQL dialect to use. We use MySQL at the Brooklyn College Computer Science Club, but it should work with other SQL dialects.\
**DB_SOCKET:** The UNIX socket of the SQL database to connect to.\
**DB_PORT:** The port of the SQL database to connect to.\
**DB_USERNAME:** The username of the SQL database user to connect with.\
**DB_PASSWORD:** The password of the SQL database user to connect with.\
**DB_DATABASE:** The database to use in the SQL database.

### Mailchimp

**MAILCHIMP_API_KEY:** The Mailchimp API Key for the Mailchimp account.\
**MAILCHIMP_SERVER:** The Mailchimp server being used by the Mailchimp account. For example, "us19".\
**MAILCHIMP_MAILING_LIST_ID:** The Mailchimp mailing list ID to subscribe new members to.
