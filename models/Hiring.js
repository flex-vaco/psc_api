const sql = require("../lib/db.js");
const hiringsTable = "hirings";
const usersTable = "users";
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');
const APP_EMAIL = require("../lib/email.js");
const usersModel = require('./User.js');

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
    query = `SELECT 
                  h.*,
                  JSON_OBJECT(
                      'emp_id', e.emp_id,
                      'first_name', e.first_name,
                      'last_name', e.last_name,
                      'emp_email', e.email,
                      'rate_per_hour', e.rate_per_hour,
                      'designation', e.designation,
                      'manager_email', e.manager_email,
                      'manager_name', e.manager_name,
                      'manager_id', e.manager_id
                  ) AS employee_details
                  
              FROM 
                  ${hiringsTable} h
              JOIN 
                  employee_details e ON h.emp_id = e.emp_id
              WHERE 
                hiring_id = ${hiringId}`;
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
  newHiring.manager_id = employeeDetails.manager_id || 0;

  delete newHiring.employeeDetails;
  
  const insertQuery = `INSERT INTO ${hiringsTable} set ?`;
  sql.query(insertQuery, [newHiring], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem creating Hiring. ${err}`);
    } else {
      if (employeeDetails?.manager_email) {
        const empName = `${employeeDetails.first_name} ${employeeDetails.last_name}`;
        const values = {
          managerName: employeeDetails.manager_name,
          producerName: `${activeUser.first_name} ${activeUser.last_name}`,
          employeeName: empName,
          producerEmail: activeUser.email
        };
        APP_EMAIL.sendEmail('newRequest', values,subject = `Booking query for ${empName}`, employeeDetails.manager_email);

        const response = {newHiring, user: req.user}
        res.status(200).send(response);
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
        const response = {updatedHiring, user: req.user};
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

const enquiredByMe = (req, res) => {
  const activeUser = req.user;
  if (!userACL.hasHiringAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.READ)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }
  
  let query = `SELECT 
                  h.*,
                  JSON_OBJECT(
                      'emp_id', e.emp_id,
                      'first_name', e.first_name,
                      'last_name', e.last_name,
                      'emp_email', e.email
                  ) AS employee_details,
                  JSON_OBJECT(
                      'manager_id', u.user_id,
                      'manager_first_name', u.first_name,
                      'manager_last_name', u.last_name,
                      'manager_email', u.email
                  ) AS manager_details
              FROM 
                  ${hiringsTable} h
              JOIN 
                  employee_details e ON h.emp_id = e.emp_id
              JOIN 
                  users u ON h.manager_id = u.user_id
              WHERE 
                  h.created_by = ${activeUser?.user_id}
              order by 
                  h.hiring_id desc`;

  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting hirings. ${err}`);
    } else {
      return res.status(200).send({ hirings: rows, user: req.user });
    }
  })
}

const enquiredToMe = (req, res) => {
  const activeUser = req.user;
  if (!userACL.hasHiringAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.READ)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }
  
  let query = `SELECT 
                  h.*,
                  JSON_OBJECT(
                      'emp_id', e.emp_id,
                      'first_name', e.first_name,
                      'last_name', e.last_name,
                      'emp_email', e.email
                  ) AS employee_details,
                  JSON_OBJECT(
                      'manager_id', u.user_id,
                      'manager_first_name', u.first_name,
                      'manager_last_name', u.last_name,
                      'manager_email', u.email
                  ) AS manager_details
              FROM 
                  ${hiringsTable} h
              JOIN 
                  employee_details e ON h.emp_id = e.emp_id
              JOIN 
                  users u ON h.created_by = u.user_id
              WHERE 
                  h.manager_id = ${activeUser?.user_id}
              order by 
                  h.hiring_id desc`;


  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting hirings. ${err}`);
    } else {
      return res.status(200).send({ hirings: rows, user: req.user });
    }
  })
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  erase,
  enquiredByMe,
  enquiredToMe
}