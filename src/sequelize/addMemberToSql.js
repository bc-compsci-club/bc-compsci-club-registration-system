const sequelize = require('./sequelize');
const { models } = require('./models/member.model');

const addMemberToSql = async (newMember) => {
  const { firstName, lastName, email } = newMember;

  // Connect and add the member to the SQL database
  console.log('Connecting to the SQL database...');
  await sequelize.authenticate();
  console.log('Successfully connected to SQL database.');

  // Check if the member's email is already in the database
  const queryResult = await models.member.findAll({
    where: {
      email: email,
    },
  });

  if (queryResult.length === 0) {
    // Add member if the member's email isn't already in the database
    console.log('Adding member to the SQL database...');
    await models.member.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      joinDate: new Date(),
    });
    console.log('Successfully added member to SQL database.');
  } else {
    console.warn(
      `The member ${firstName} ${lastName} with email ${email} is already in the SQL database!`
    );
  }
};

module.exports = addMemberToSql;
