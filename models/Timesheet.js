const sql = require("../lib/db.js");
const timesheets = "timesheets";
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');
const utils = require("../lib/utils.js");
const empTable = "employee_details";
const projectTable = "project_details";


const getTimesheets = (req, res) => {
  const { monthStartDate, monthEndDate } = utils.getStartEndDatesCurrentMonth();
  const activeUser = req.user;

  if (!userACL.hasTimesheetAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.READ)) {
    const msg = `User role '${activeUser?.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }

  let tsQry = `SELECT * FROM ${timesheets} WHERE timesheet_date 
    BETWEEN STR_TO_DATE("${monthStartDate}", "%Y-%m-%d") AND STR_TO_DATE("${monthEndDate}", "%Y-%m-%d")`;
  switch (activeUser?.role) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      tsQry = tsQry;
      break;
    case APP_CONSTANTS.USER_ROLES.MANAGER:
      tsQry = tsQry + `AND manager_email = ${activeUser?.email}`;
      break;
    case APP_CONSTANTS.USER_ROLES.EMPLOYEE:
      tsQry = tsQry + `AND emp_id = ${activeUser?.emp_id}`;
      break;
    case APP_CONSTANTS.USER_ROLES.PRODUCER:
      tsQry = tsQry + `AND project_id = ${activeUser?.project_id}`;
      break;
    default:
      return res.status(404).send({ error: true, message: `User with role: ${activeUser?.role} not authorized to get timesheets.` });
  }
  
  try {
    sql.query(tsQry, (err, rows) => {
      if (err) {
        console.log("ERRR", err)
        return res.status(500).send(`Problem getting records. ${err}`);
      }
      return res.status(200).send({ timesheets: rows, user: req.user });
    });
  } catch (err) {
    console.log("ProjectAllocation:: Error:", err);
  }
};

const getTimesheetsByAllocation = (req, res) => {
  const activeUser = req.user;
  const {givenDate, projectId, empId} = req.body;

  if(!givenDate){
    res.status(500).send('Date is Required to get timesheets');
  }
  
  if (!userACL.hasTimesheetAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.READ)) {
    const msg = `User role '${activeUser?.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }

  const tsAlocQry = `SELECT timesheets.*, EPA.emp_proj_aloc_id, EPA.hours_per_day as allocation_hrs_per_day, project_details.project_name, project_details.project_location
      FROM timesheets
      JOIN employee_project_allocations EPA on EPA.project_id = timesheets.project_id
      JOIN project_details on project_details.project_id = timesheets.project_id
      WHERE timesheets.emp_id=${empId}
      AND '${givenDate}' BETWEEN EPA.start_date and EPA.end_date
      AND timesheet_date = '${givenDate}'
      AND timesheets.project_id = ${projectId}`;

  try {
    sql.query(tsAlocQry, (err, rows) => {
      if (err) {
        console.log("ERRR", err)
        return res.status(500).send(`Problem getting records. ${err}`);
      }
      return res.status(200).send({ timesheetsByAllocation: rows, user: req.user });
    });
  } catch (err) {
    console.log("ProjectAllocation:: Error:", err);
  }

}

const create = (req, res) => {
  const activeUser = req.user;

  if (!userACL.hasTimesheetAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.CREATE)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }
  const data = req.body;
  let newTimesheets = [];
  newTimesheets = data.map((obj) => {
    obj.comments = JSON.stringify(obj.comments);
    obj['created_by'] = activeUser?.user_id;
    obj['updated_by'] = activeUser?.user_id;
    return (Object.keys(obj).map((key) => obj[key]));
  });

  const fieldNames = Object.keys(data[0]).join();

  const insertQuery = `INSERT INTO ${timesheets} (${fieldNames}) VALUES ?`;

  sql.query(insertQuery, [newTimesheets], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem Creating Timesheet. ${err}`);
    } else {
      console.log("Inserted TimeSheets: ", success);
      const response = { message: `inserted ${success.affectedRows} rows`, user: req.user };
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  const activeUser = req.user;

  if (!userACL.hasTimesheetAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.UPDATE)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }

  const data = req.body; //need an Array
  if (data?.length <= 0) {
    res.status(500).send('Received Empty Array. Values are requied to update.');
  }

  let updates = data.map((obj) => { //stringify JSON object of comments
    obj.comments = JSON.stringify(obj.comments);
    obj.created_by = activeUser?.user_id;
    obj.updated_by = activeUser?.user_id;
    return obj;
  });

  let updateQuries = '';
  updates.forEach((item) => {
    updateQuries += sql.format(`UPDATE ${timesheets} SET
     ${Object.keys(item)
        .filter((key) => key !== 'timesheet_id')
        .map((key) => `${key} = '${item[key]}'`).join(', ')} WHERE timesheet_id = ${item.timesheet_id};`)
  });

  sql.query(updateQuries, (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${timesheets}. ${err}`);
    } else {
      console.log("Updated TimeSheets: ", success);
      const response = { message: `updated ${success.length} rows`, user: req.user };
      res.status(200).send(response);
    }
  });
};

const changeStatus = (req, res) => {
  const activeUser = req.user;

  if (!userACL.hasTimesheetAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.UPDATE)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const status = req.body.status;
  if((activeUser?.role !== APP_CONSTANTS.USER_ROLES.MANAGER) && (status === APP_CONSTANTS.TIMESHEET_STATUS.APPROVED)) {
    const msg = `User role '${req.user.role}' can not Approve timesheets`;
    return res.status(404).send({error: true, message: msg});
  }
  const empId = req.body.emp_id;
  const managerEmail = req.body.manager_email;
  const startDate = req.body.start_date;
  const endDate = req.body.end_date;
  const projectId = req.body.project_id;

  let statusChangeQry = `UPDATE ${timesheets} SET timesheet_status = '${status}'
      WHERE emp_id = ${empId}
      AND manager_email = '${managerEmail}'
      AND timesheet_date BETWEEN '${startDate}' AND '${endDate}'`;
  
  if (projectId) {
    statusChangeQry += ` AND project_id = ${projectId}`;
  }

  if(activeUser?.role === APP_CONSTANTS.USER_ROLES.EMPLOYEE) {
    statusChangeQry += ` AND timesheet_status NOT IN ('APPROVED','ACCEPTED')`;
  } else if(activeUser?.role === APP_CONSTANTS.USER_ROLES.MANAGER) {
    statusChangeQry += ` AND timesheet_status != 'ACCEPTED'`;
  }
    
  sql.query(statusChangeQry, (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while updating the ${timesheets}. ${err}`);
    } else {
      console.log("STS: ", succeess)
      if (succeess.affectedRows >= 1){
        console.log(`${timesheets} UPDATED:` , succeess)
        res.status(200).send({message: `${succeess.affectedRows} rows updated as ${status}`, user: req.user});
      } else {
        res.status(404).send({message: `No Records to update, to status: ${status}`});
      }
    }
  });
};
const erase = (req, res) => {
  const activeUser = req.user;

  if (!userACL.hasTimesheetAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.DELETE)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const {timesheet_id } = req.params;
  if(!timesheet_id){
    res.status(500).send('ID is Required');
  }
  const deleteQuery = `DELETE FROM ${timesheets} WHERE timesheet_id = ?`;
  sql.query(deleteQuery,[timesheet_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${timesheets} with ID: ${timesheet_id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${timesheets} DELETED:` , succeess)
        res.status(200).send({msg: `Deleted row from ${timesheets} with ID: ${timesheet_id}`, user: req.user});
      } else {
        res.status(404).send(`Record not found with ID: ${timesheet_id}`);
      }
    }
  });
};

const approvePendingEmployees = (req, res) => { // filters by name if params are given
  const activeUser = req.user;

  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  if((req.user.role !== APP_CONSTANTS.USER_ROLES.MANAGER) && (activeUser?.role !== APP_CONSTANTS.USER_ROLES.PRODUCER)) {
    const msg = `User role '${req.user.role}' can not Approve timesheets`;
    return res.status(404).send({error: true, message: msg});
  }
  let query='';
  if(req.user.role == APP_CONSTANTS.USER_ROLES.MANAGER) {
      const managerEmail = req.user.email;

      query =`SELECT distinct ${timesheets}.emp_id, ${timesheets}.project_id, ${empTable}.first_name, ${empTable}.last_name, ${projectTable}.project_name FROM ${timesheets}`;

      query += ` JOIN ${empTable} on ${empTable}.emp_id = ${timesheets}.emp_id`;
      query += ` JOIN ${projectTable} on ${projectTable}.project_id = ${timesheets}.project_id`;

      if (managerEmail) {
        query += ` WHERE ${empTable}.manager_email = '${managerEmail}' and ${timesheets}.timesheet_status = 'SUBMITTED'`;
      }
      
  }
  
  if(req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
    const clientId = req.user.client_id;
    query =`SELECT distinct ${timesheets}.emp_id, ${timesheets}.project_id, ${empTable}.first_name, ${empTable}.last_name, ${projectTable}.project_name FROM ${timesheets}`;

    query += ` JOIN ${empTable} on ${empTable}.emp_id = ${timesheets}.emp_id`;
    query += ` JOIN ${projectTable} on ${projectTable}.project_id = ${timesheets}.project_id`;
    
    if (clientId) {
      query += ` WHERE ${timesheets}.timesheet_status = 'APPROVED' and ${projectTable}.client_id = ${clientId}`;
    }
    console.log(query);
  }
  console.log(query);
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting employees. ${err}`);
    }
    return res.status(200).send({employees: rows, user: req.user});
  });
};

const findByPendingEmployeeTimesheet = (req, res) => { 
  const activeUser = req.user;
  const empId = req.body.params.emp_id;
  const projectId = req.body.params.project_id;
  console.log(activeUser);
  if (!userACL.hasTimesheetAccess(activeUser?.role, APP_CONSTANTS.ACCESS_LEVELS.UPDATE)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  if((req.user.role !== APP_CONSTANTS.USER_ROLES.MANAGER) && (activeUser?.role !== APP_CONSTANTS.USER_ROLES.PRODUCER)) {
    const msg = `User role '${req.user.role}' can not Approve timesheets`;
    return res.status(404).send({error: true, message: msg});
  }

  let query =`SELECT ${timesheets}.*, ${empTable}.first_name, ${empTable}.last_name, ${projectTable}.project_name FROM ${timesheets}`;
  query += ` JOIN ${empTable} on ${empTable}.emp_id = ${timesheets}.emp_id`;
  query += ` JOIN ${projectTable} on ${projectTable}.project_id = ${timesheets}.project_id`;
  query += ` where ${timesheets}.emp_id = '${empId}' and ${timesheets}.project_id = '${projectId}'`;

  if(req.user.role == APP_CONSTANTS.USER_ROLES.MANAGER) {
    query += ` and ${timesheets}.timesheet_status = 'SUBMITTED'`;
  }

  if(req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
    query += ` and ${timesheets}.timesheet_status = 'APPROVED'`;
  }
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting timesheet details. ${err}`);
    }
    return res.status(200).send({timesheets: rows});
  });

}
const changeStatusSupervisior = (req, res) => { 
  const activeUser = req.user;
  
  if((req.user.role !== APP_CONSTANTS.USER_ROLES.MANAGER) && (activeUser?.role !== APP_CONSTANTS.USER_ROLES.PRODUCER)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const status = req.body.status;
 
  const empId = req.body.emp_id;
  const projectId = req.body.project_id;
  const timesheetId = req.body.timesheet_id;
  
  let timesheetStatus ='';
  if(req.user.role == APP_CONSTANTS.USER_ROLES.MANAGER) {
    timesheetStatus = 'SUBMITTED';
  }

  if(req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
    timesheetStatus = 'APPROVED';
  }

  const statusChangeQry = `UPDATE ${timesheets} SET timesheet_status = '${status}'
      WHERE emp_id = ${empId}
      AND project_id = ${projectId}
      AND timesheet_status = '${timesheetStatus}' AND timesheet_id IN (${timesheetId});`;

  sql.query(statusChangeQry, (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while updating the ${timesheets}. ${err}`);
    } else {
      console.log("STS: ", succeess)
      if (succeess.affectedRows >= 1){
        console.log(`${timesheets} UPDATED:` , succeess)
        res.status(200).send({msg: `${succeess.affectedRows} rows updated as ${status}`, user: req.user});
      } else {
        res.status(404).send(`Record not found`);
      }
    }
  });
}

module.exports = {
    getTimesheets,
    getTimesheetsByAllocation,
    changeStatus,
    create,
    update,
    erase,
    approvePendingEmployees,
    findByPendingEmployeeTimesheet,
    changeStatusSupervisior
}