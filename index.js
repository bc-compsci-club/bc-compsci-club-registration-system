const admin = require("firebase-admin");
const mailchimp = require("@mailchimp/mailchimp_marketing");
const { Sequelize, DataTypes } = require("sequelize");
const sanitize = require("mongo-sanitize");
const { v4: uuidv4 } = require("uuid");
const md5 = require("md5");

// Initialize MySQL
const sequelize = new Sequelize({
  dialect: "mysql",
  dialectOptions: {
    socketPath: process.env.DB_SOCKET,
  },
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Initialize Cloud Firestore
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

// Initialize Mailchimp API
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER,
});

/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
exports.handleJoin = async (req, res) => {
  // Check for requests other than POST and reject them
  if (req.method !== "POST") {
    console.error("Invalid request type!");
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Check for correct referer and reject if it isn't from the official website
  if (
    !(req.get("referer").substring(0, 27) === "https://bccompsci.club/join")
  ) {
    console.error("Incorrect referer!");
    console.log("Referer: " + req.get("referer"));
    res.status(403).send("Forbidden");
    return;
  }

  // Sanitize and parse inputs
  const body = req.body;

  const firstName = sanitize(body["first-name"]);
  const lastName = sanitize(body["last-name"]);
  const email = sanitize(body["email"]);

  console.log(
    `${firstName} ${lastName} is requesting to join the club with email ${email}`
  );

  // Validate data before adding to database
  if (
    // Validate form data
    firstName === "" ||
    lastName === "" ||
    !email.includes("@") ||
    // Validate data types
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof email !== "string"
  ) {
    console.error("Form data invalid!");
    res.status(400).send("Bad Request");
    return;
  }

  // MySQL database
  // Define the sequelize model
  const member = sequelize.define("member", {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    joinDate: {
      type: DataTypes.TIME,
      allowNull: false,
    },
  });

  // Connect and add the member to the MySQL database
  try {
    // Connect to the MySQL database
    console.log("Connecting to the MySQL database...");
    await sequelize.authenticate();
    console.log("Successfully connected to MySQL database.");

    // Add member
    console.log("Adding member to the MySQL database...");
    await member.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      joinDate: new Date(),
    });
    console.log("Successfully added member to MySQL database.");

    // Close connection
    console.log("Cleaning up and closing MySQL database connection...");
    await sequelize.connectionManager.close();
    console.log("Successfully closed MySQL database connection.");
  } catch (error) {
    console.error(`Unable to add user to the MySQL database. Reason: ${error}`);
  }

  // Cloud Firestore database
  // Generate unique document ID
  const docId = `${firstName} ${lastName} ${email} ${uuidv4()}`;
  const docRef = db.collection("members").doc(docId);

  // Add the member to the Cloud Firestore database
  try {
    console.log("Adding member to the Cloud Firestore database...");
    await docRef.set({
      firstName: firstName,
      lastName: lastName,
      email: email,
      joinDate: new Date(),
    });
    console.log("Successfully added member to the Cloud Firestore database.");
  } catch (error) {
    console.error(
      `Unable to add user to the Cloud Firestore database. Reason: ${error}`
    );
  }

  console.log(
    `${firstName} ${lastName} has joined the club with email ${email}.`
  );

  // Prepare the Mailchimp API
  const listId = process.env.MAILCHIMP_MAILING_LIST_ID; // ID for the main mailing list.
  const subscriberHash = md5(email.toLowerCase());

  // Check if member is in the mailing list and subscribe them if they aren't in the mailing list
  async function processSubscribe() {
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
            status: "subscribed",
            merge_fields: {
              FNAME: firstName,
              LNAME: lastName,
            },
          });

          console.log(
            `Successfully subscribed member to the mailing list! The contact's id is ${response.id}.`
          );
        } catch (error) {
          console.error(
            `Unable to subscribe member to the mailing list. Reason: ${error}`
          );
        }
      }
    }
  }

  // Subscribe the member to the Mailchimp mailing list
  try {
    console.log("Subscribing the member to the Mailchimp mailing list...");
    await processSubscribe();
    console.log("Mailchimp mailing list subscription complete.");
  } catch (e) {
    console.error(
      "There was an error subscribing the member to the mailing list."
    );
  }

  console.log(
    "Member registration complete! Redirecting member to the welcome page..."
  );

  // Redirect to welcome page after adding to the database and subscribing
  res.redirect("https://bccompsci.club/welcome");
};
