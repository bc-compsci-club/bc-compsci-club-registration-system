const mailchimp = require('@mailchimp/mailchimp_marketing');

// Initialize Mailchimp API
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER,
});

module.exports = mailchimp;