const sql = require("../lib/db.js");
const hiringsTable = "hirings";
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');
const APP_EMAIL = require("../lib/email.js");

const findAll = (req, res) => {
  const activeUser = req.user;
  if (!userACL.hasHiringAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.READ)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }
  
  let query = '';
  if (req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
    query = `SELECT * FROM ${hiringsTable} WHERE created_by = ${activeUser?.user_id}`;
  } else {
    query = `SELECT * FROM ${hiringsTable}`;
  }

  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting hirings. ${err}`);
    } else {
      return res.status(200).send({ hirings: rows, user: req.user });
    }
  })
};

const findById = (req, res) => {
  const hiringId = req.params.hiring_id;
  const activeUser = req.user;

  if (!hiringId) return res.status(500).send("Hiring ID required");

  if (!userACL.hasHiringAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.READ)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }
  
  let query = '';
  if (req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
    query = `SELECT * FROM ${hiringsTable} WHERE created_by = ${activeUser?.user_id} AND hiring_id = ${hiringId}`;
  } else {
    query = `SELECT * FROM ${hiringsTable} WHERE hiring_id = ${hiringId}`;
  }

  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting hirings. ${err}`);
    } else {
      return res.status(200).send({ hirings: rows, user: req.user });
    }
  })
};

const create = (req, res) => {
  const activeUser = req.user;

  if (!userACL.hasHiringAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.CREATE)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const newHiring = req.body;
  newHiring.created_by = activeUser?.user_id;
  newHiring.updated_by = activeUser?.user_id;
  const employeeDetails = newHiring.employeeDetails || null;
  delete newHiring.employeeDetails;

  const insertQuery = `INSERT INTO ${hiringsTable} set ?`;
  sql.query(insertQuery, [newHiring], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem creating Hiring. ${err}`);
    } else {
      if (employeeDetails?.manager_email) {
        const empName = `${employeeDetails.first_name} ${employeeDetails.last_name}`;
        const htmlMessage = `<b>Hey ${employeeDetails.manager_name}! </b> <br/>
                              This is an enquiry from ${activeUser.first_name} ${activeUser.last_name} regarding ${empName}<br/>
                              You can reach Producer on the email ${activeUser.email}<br/>`;
        const mailData = {
          from: APP_EMAIL.MAIL_ID,
          to: employeeDetails.manager_email,
          subject: `Booking query for ${empName}`,
          text: 'Mail from Flex App.',
          html: htmlMessage,
        };

        APP_EMAIL.transporter.sendMail(mailData, (error, info) => {
            if (error) {
                return console.log(error);
            }
            newHiring.hiring_id = succeess.insertId;
            const email = { message: "E-Mail sent to Resource Manager", message_id: info.messageId }
            const response = {newHiring, email, user: req.user}
            res.status(200).send(response);
        });
      } else {
        newHiring.hiring_id = succeess.insertId;
        const response = {newHiring, user: req.user}
        res.status(200).send(response);
      }
    }
  });
};

const update = (req, res) => {
  const updatedHiring = req.body;
  const hiringId = updatedHiring.hiring_id;
  const activeUser = req.user;
  if (!hiringId) return res.status(500).send("Hiring ID required");

  if (!userACL.hasHiringAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.UPDATE)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }
  
  updatedHiring.updated_by = activeUser?.user_id;
  const updateQuery = `UPDATE ${hiringsTable} set ? WHERE hiring_id = ?`;
  sql.query(updateQuery,[updatedHiring, hiringId], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${hiringsTable} with ID: ${hiringId}. ${err}`);
    } else {
      if (succeess.affectedRows == 1){
        console.log(`${hiringsTable} UPDATED:` , succeess)
        updatedHiring.hiring_id = parseInt(hiringId);
        const response = {updatedHiring, user: req.user}
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with Hiring ID: ${hiringId}`);
      }
    }
  });
};

const erase = (req, res) => {
  const hiring = req.body;
  const hiringId = hiring.hiring_id;
  const activeUser = req.user;

  if (!hiringId) return res.status(500).send("Hiring ID required");

  if (!userACL.hasHiringAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.DELETE)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }
  
  const deleteQuery = `DELETE FROM ${hiringsTable} WHERE hiring_id = ?`;
  sql.query(deleteQuery,[hiringId], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${hiringsTable} with ID: ${hiringId}. ${err}`);
    } else {
      if (succeess.affectedRows == 1){
        console.log(`${hiringsTable} DELETED:` , succeess)
        res.status(200).send({msg: `Deleted row from ${hiringsTable} with ID: ${hiringId}`, user: req.user});
      } else {
        res.status(404).send(`Record not found with ID: ${hiringId}`);
      }
    }
  });
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  erase
}