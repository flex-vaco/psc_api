const sql = require("../lib/db.js");
const empProjUtili = "employee_project_utilization";
const userACL = require('../lib/userACL.js');

const findAll = (req, res) => {
  if (!userACL.hasUtilizationReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  let finalResult = [];
  try {
      const utiliQry = `SELECT * FROM ${empProjUtili}`;

      sql.query(utiliQry, (err, utilizations) => {
          if (err) {
              console.log("ProjectUtilization:: Err getting rows: ", err);
              return res.status(500).send(`Problem getting records. ${err}`);
          }
          utilizations.forEach((utili, idx) => {
              const empQry = `SELECT * FROM employee_details WHERE emp_id = '${utili.emp_id}'`;
              sql.query(empQry, (err, empRows) => {
                  if (err) {
                      console.log("ProjectUtilization:: Err getting Employee details: ", err);
                      return res.status(500).send(`Problem getting records. ${err}`);
                  } else {
                      utili.empDetails = empRows[0];
                      const prjQry = `SELECT * FROM project_details WHERE project_id = '${utili.project_id}'`;
                      sql.query(prjQry, (err, prjRows) => {
                          if (err) {
                              console.log("ProjectUtilization:: Err getting Project details:", err);
                              return res.status(500).send(`Problem getting records. ${err}`);
                          } else {
                              utili.projectDetails = prjRows[0];
                              finalResult.push(utili);

                              if (utilizations.length === (idx + 1)) {
                                  return res.status(200).send({ empProjUtili: finalResult });
                              }
                          }
                      })
                  }
              })
          })
      });
  } catch (err) {
      console.log("ProjectUtilization:: Unkown Err:", err);
  }
};

const create = (req, res) => {
  if (!userACL.hasUtilizationCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const newUtilization = req.body;
  const insertQuery = `INSERT INTO ${empProjUtili} set ?`;
  sql.query(insertQuery, [newUtilization], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Allocating Project to Employee. ${err}`);
    } else {
      newUtilization.emp_proj_util_id = succeess.insertId;
      res.status(200).send(newUtilization);
    }
  });
};

const erase = (req, res) => {
  if (!userACL.hasUtilizationDeleteAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { emp_proj_utili_id } = req.params;
  if(!emp_proj_utili_id){
    res.status(500).send('Employee-Project-Utilization ID is Required');
  }
  const deleteQuery = `DELETE FROM ${empProjUtili} WHERE emp_proj_utili_id = ?`;
  sql.query(deleteQuery,[emp_proj_utili_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${empProjUtili} with ID: ${emp_proj_utili_id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${empProjUtili} DELETED:` , succeess)
        res.status(200).send(`Deleted row from ${empProjUtili} with ID: ${emp_proj_utili_id}`);
      } else {
        res.status(404).send(`Record not found with ID: ${emp_proj_utili_id}`);
      }
    }
  });
};

const findById = async (req, res) => {
  if (!userACL.hasUtilizationReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const empProjUtiliID = req.params.emp_proj_utili_id;
  let result = [];
  if (empProjUtiliID) {
      const query = `SELECT * FROM ${empProjUtili} WHERE emp_proj_utili_id = '${empProjUtiliID}'`;
      sql.query(query, async (err, utiliRows) => {
          if (err) {
              console.log("error: ", err);
              return res.status(500).send(`There was a problem finding the Utilization. ${err}`);
          } else {
              result = utiliRows[0];
              const empQry = `SELECT * FROM employee_details WHERE emp_id = '${utiliRows[0].emp_id}'`;
              sql.query(empQry, (err, empRows) => {
                  if (err) {
                      console.log("Error in EMP:: ", err);
                  } else {
                      result.empDetails = empRows[0];
                  }
              })
              const prjQry = `SELECT * FROM project_details WHERE project_id = '${utiliRows[0].project_id}'`;
              sql.query(prjQry, (err, prjRows) => {
                  if (err) {
                      console.log("Error in Projects:: ", err);
                  } else {
                      result.projectDetails = prjRows[0]
                  }
                  return res.status(200).send({ empProjUtili: result });
              })
          }
      })
  } else {
      return res.status(500).send("Employee-Project-Utilization ID required");
  }
};

const update = (req, res) => {
  if (!userACL.hasUtilizationUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { emp_proj_utili_id } = req.params;
  if(!emp_proj_utili_id){
    res.status(500).send('Employee-Project-Utilization ID is Required');
  }
  const updatedUtilization= req.body;
  const updateQuery = `UPDATE ${empProjUtili} set ? WHERE emp_proj_utili_id = ?`;
  sql.query(updateQuery,[updatedUtilization, emp_proj_utili_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${empProjUtili} with ID: ${emp_proj_utili_id}. ${err}`);
    } else {
      if (succeess.affectedRows == 1){
        console.log(`${empProjUtili} UPDATED:` , succeess)
        updatedUtilization.emp_proj_utili_id = parseInt(emp_proj_utili_id);
        res.status(200).send(updatedUtilization);
      } else {
        res.status(404).send(`Record not found with ID: ${emp_proj_utili_id}`);
      }
    }
  });
};

module.exports = {
  findAll,
  create,
  erase,
  findById,
  update
}