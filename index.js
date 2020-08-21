const admin = require("firebase-admin");
const mailchimp = require("@mailchimp/mailchimp_marketing");
const { Sequelize } = require("sequelize");
const sanitize = require("mongo-sanitize");
const { v4: uuidv4 } = require("uuid");
const md5 = require("md5");
const { Sequelize } = require("sequelize");

// Initialize Cloud Firestore
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

// Initialize MySQL
const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

// Initialize Mailchimp
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
  // Check for requests other than POST
  if (req.method !== "POST") {
    console.error("Invalid request type!");
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Check for correct referer
  // if (
  //   !(req.get("referer").substring(0, 27) === "https://bccompsci.club/join")
  // ) {
  //   console.error("Incorrect referer!");
  //   console.log("Referer: " + req.get("referer"));
  //   res.status(403).send("Forbidden");
  //   return;
  // }

  // Sanitize and parse inputs
  const body = req.body;

  const firstName = sanitize(body["first-name"]);
  const lastName = sanitize(body["last-name"]);
  const email = sanitize(body["email"]);

  console.log(
    `${firstName} ${lastName} is requesting to join the club with email ${email}.`
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

  // Cloud Firestore database
  // Generate unique document ID
  const docId = `${firstName} ${lastName} ${email} ${uuidv4()}`;
  const docRef = db.collection("members").doc(docId);

  // Add the member
  await docRef.set({
    firstName: firstName,
    lastName: lastName,
    email: email,
    joinDate: new Date(),
  });

  // MySQL database
  // Define the model
  const Member = sequelize.define("Member", {
    firstName: {
      type: sequelize.DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: sequelize.DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: sequelize.DataTypes.STRING,
      allowNull: false,
    },
    joinDate: {
      type: sequelize.DataTypes.TIME,
      allowNull: false,
    },
  });

  // Connect and add the member
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL Database");

    await Member.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      joinDate: new Date(),
    });
    console.log("Added new member to MySQL Database.");
  } catch (error) {
    console.error(`Unable to connect to MySQL Database. Reason: ${error}`);
  }

  console.log(
    `${firstName} ${lastName} has joined the club with email ${email}.`
  );

  // Mailchimp API
  const listId = process.env.MAILCHIMP_MAILING_LIST_ID; // ID for the main mailing list.
  const subscriberHash = md5(email.toLowerCase());

  async function processSubscribe() {
    try {
      const response = await mailchimp.lists.getListMember(
        listId,
        subscriberHash
      );

      console.log(
        `The subscription status for the email "${email}" is ${response.status}.`
      );
    } catch (e) {
      if (e.status === 404) {
        console.log(
          `The email "${email}" is not subscribed to the mailing list. Subscribing...`
        );

        const response = await mailchimp.lists.addListMember(listId, {
          email_address: email,
          status: "subscribed",
          merge_fields: {
            FNAME: firstName,
            LNAME: lastName,
          },
        });

        console.log(
          `Successfully subscribed member to the club newsletter! The contact's id is ${response.id}.`
        );
      }
    }
  }

  // Subscribe the member
  await processSubscribe();

  // Redirect to welcome page
  res.redirect("https://bccompsci.club/welcome");
};
