const sql = require("../lib/db.js");
const projectTable = "project_details";
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');

const findAll = (req, res) => {
  if (!userACL.hasProjectReadAccess(req.user.role) && !userACL.hasOffshoreLeadProjectAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  let finalResult = [];
  let query='';
  if(req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
    const producerClientIds = `SELECT client_id from producer_clients WHERE producer_id = ${req.user.user_id}`;
    query = `SELECT * FROM ${projectTable}
    WHERE client_id IN (${producerClientIds})`;
  } else {
    query = `SELECT * FROM ${projectTable}`;
    
    // Add line of business filter for non-administrator users
    if (req.user.role !== 'administrator') {
      query += ` WHERE line_of_business_id = ${req.user.line_of_business_id}`;
    }
  }

  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting projects. ${err}`);
    }
    let recCount = 0;
    rows.forEach((row) => {
      const clientQry = `SELECT * FROM clients WHERE client_id = '${row.client_id}'`;
      sql.query(clientQry, (err, clientRows) => {
          if (err) {
              console.log("Project: Err getting Client details:", err);
              return res.status(500).send(`Problem getting records. ${err}`);
          } else {
              row.clientDetails = clientRows[0];
              finalResult.push(row);
              recCount = recCount+1;
              if (recCount === rows.length) {
                  return res.status(200).send({ projects: finalResult, user: req.user });
              }
          }
      })      
              
    })
  });
};

const findById = (req, res) => {
  if (!userACL.hasProjectReadAccess(req.user.role) && !userACL.hasOffshoreLeadProjectAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const projectDetailsId = req.params.project_id;
  if (projectDetailsId) {
    let query='';
    let params = [];
    
    if(req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
      const producerClientIds = `SELECT client_id from producer_clients WHERE producer_id = ${req.user.user_id}`;
      query = `SELECT * FROM ${projectTable}
      WHERE client_id IN (${producerClientIds})
      AND project_id = ?`;
      params.push(projectDetailsId);
    } else {
      query = `SELECT * FROM ${projectTable} WHERE project_id = ?`;
      params.push(projectDetailsId);
      
      // Add line of business filter for non-administrator users
      if (req.user.role !== 'administrator') {
        query += ` AND line_of_business_id = ?`;
        params.push(req.user.line_of_business_id);
      }
    }
     
    sql.query(query, params, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Project. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("Project not found or access denied");
      }
      
      return res.status(200).send({projects: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Project ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasProjectCreateAccess(req.user.role) && !userACL.hasOffshoreLeadProjectAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const newProject = req.body;
  
  // Set line of business based on user role
  if (req.user.role !== 'administrator') {
    if (!newProject.line_of_business_id) {
      return res.status(400).send("Line of business is required for non administrator users");
    }
    if (newProject.line_of_business_id != req.user.line_of_business_id) {
      return res.status(403).send("Non administrator users can only create projects in their own line of business");
    }
  }
  
  const insertQuery = `INSERT INTO ${projectTable} set ?`;
  sql.query(insertQuery, [newProject], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the Project. ${err}`);
    } else {
      newProject.project_id = succeess.insertId;
      const response = {newProject, user: req.user}
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasProjectUpdateAccess(req.user.role) && !userACL.hasOffshoreLeadProjectAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { project_id } = req.params;
  if(!project_id){
    res.status(500).send('Project ID is Required');
  }
  
  const updatedProject = req.body;
  
  if (req.user.role !== 'administrator') {
    const checkQuery = `SELECT line_of_business_id FROM ${projectTable} WHERE project_id = ?`;
    sql.query(checkQuery, [project_id], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`Problem while checking project access. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("Project not found");
      }
      
      if (rows[0].line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users can only update projects in their own line of business");
      }
      
      if (updatedProject.line_of_business_id && updatedProject.line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users cannot change project's line of business");
      }
      
      proceedWithUpdate();
    });
  } else {
    proceedWithUpdate();
  }
  
  function proceedWithUpdate() {
    const updateQuery = `UPDATE ${projectTable} set ? WHERE project_id = ?`;
    sql.query(updateQuery,[updatedProject, project_id], (err, succeess) => {
      if (err) {
        console.log("error: ", err);
        res.status(500).send(`Problem while Updating the ${projectTable} with ID: ${project_id}. ${err}`);
      } else {
        if (succeess.affectedRows == 1){
          console.log(`${projectTable} UPDATED:` , succeess)
          updatedProject.project_id = parseInt(project_id);
          const response = {updatedProject, user: req.user}
          res.status(200).send(response);
        } else {
          res.status(404).send(`Record not found with Project Details ID: ${project_id}`);
        }
      }
    });
  }
};

const erase = (req, res) => {
  if (!userACL.hasProjectDeleteAccess(req.user.role) && !userACL.hasOffshoreLeadProjectAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { project_id } = req.params;
  if(!project_id){
    res.status(500).send('Project ID is Required');
  }
  //const updatedProject = req.body;
  const deleteQuery = `DELETE FROM ${projectTable} WHERE project_id = ?`;
  sql.query(deleteQuery,[project_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${projectTable} with ID: ${project_id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${projectTable} DELETED:` , succeess)
        //updatedProject.project_id = parseInt(project_id);
        res.status(200).send({msg: `Deleted row from ${projectTable} with ID: ${project_id}`, user: req.user});
      } else {
        res.status(404).send(`Record not found with Project Details ID: ${project_id}`);
      }
    }
  });
};

const findByLineOfBusiness = (req, res) => {
  if (!userACL.hasProjectReadAccess(req.user.role) && !userACL.hasOffshoreLeadProjectAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const lineOfBusinessId = req.params.lineOfBusinessId;
  if (lineOfBusinessId) {
    const query = `SELECT * FROM ${projectTable} WHERE line_of_business_id = ?`;
    sql.query(query, [lineOfBusinessId], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting projects for line of business. ${err}`);
      }
      return res.status(200).send({projects: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Line of Business ID required");
  }
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  erase,
  findByLineOfBusiness
}