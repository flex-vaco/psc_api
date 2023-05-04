const sql = require("../lib/db.js");
const empProjAlloc = "employee_project_allocations";
const userACL = require('../lib/userACL.js');

const empProjAllocAsOnToday = (req, res) => {
  if (!userACL.hasAllocationReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
    const emp_id = req.body?.empId;
    try { 
      const empPrjAlcQry = `SELECT SUM(hours_per_day)*5 as alc_per_week, emp_id
         FROM ${empProjAlloc}
         WHERE CURDATE() BETWEEN start_date AND end_date
         AND emp_id = ${emp_id}
         group by emp_id`;
        sql.query(empPrjAlcQry, (err, empPrjAlcToday) => {
            if (err) {
              console.log("ERRR",err)
              return res.status(500).send(`Problem getting records. ${err}`);
            }
            return res.status(200).send({ empProjAllocToday: empPrjAlcToday, user: req.user });
        });
    } catch (err) {
        console.log("ProjectAllocation:: Error:", err);
    }
};

const findAll = (req, res) => {
  if (!userACL.hasAllocationReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
    let finalResult = [];
    try {
        const alocQry = `SELECT * FROM ${empProjAlloc}`;

        sql.query(alocQry, (err, allocations) => {
            if (err) {
                console.log("ProjectAllocation:: Err getting rows: ", err);
                return res.status(500).send(`Problem getting records. ${err}`);
            }
            let recCount = 0;
            allocations.forEach((aloc) => {
                const empQry = `SELECT * FROM employee_details WHERE emp_id = '${aloc.emp_id}'`;
                sql.query(empQry, (err, empRows) => {
                    if (err) {
                        console.log("ProjectAllocation:: Err getting Employee details: ", err);
                        return res.status(500).send(`Problem getting records. ${err}`);
                    } else {
                        aloc.empDetails = empRows[0];
                        const prjQry = `SELECT * FROM project_details WHERE project_id = '${aloc.project_id}'`;
                        sql.query(prjQry, (err, prjRows) => {
                            if (err) {
                                console.log("ProjectAllocation:: Err getting Project details:", err);
                                return res.status(500).send(`Problem getting records. ${err}`);
                            } else {
                                aloc.projectDetails = prjRows[0];
                                finalResult.push(aloc);
                                recCount = recCount+1;
                                if (recCount === allocations.length) {
                                    return res.status(200).send({ empProjAlloc: finalResult, user: req.user });
                                }
                            }
                        })
                    }
                })
            })
        });
    } catch (err) {
        console.log("ProjectAllocation:: Unkown Err:", err);
    }
};

const findById = async (req, res) => {
  if (!userACL.hasAllocationReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
    const empProjAllocID = req.params.emp_proj_aloc_id;
    let result = [];
    if (empProjAllocID) {
        const query = `SELECT * FROM ${empProjAlloc} WHERE emp_proj_aloc_id = '${empProjAllocID}'`;
        sql.query(query, async (err, alocRows) => {
            if (err) {
                console.log("error: ", err);
                return res.status(500).send(`There was a problem finding the Allocation. ${err}`);
            } else {
                result = alocRows[0];
                const empQry = `SELECT * FROM employee_details WHERE emp_id = '${alocRows[0].emp_id}'`;
                sql.query(empQry, (err, empRows) => {
                    if (err) {
                        console.log("Error in EMP:: ", err);
                    } else {
                        result.empDetails = empRows[0];
                    }
                })
                const prjQry = `SELECT * FROM project_details WHERE project_id = '${alocRows[0].project_id}'`;
                sql.query(prjQry, (err, prjRows) => {
                    if (err) {
                        console.log("Error in Projects:: ", err);
                    } else {
                        console.log("Project rows in func", prjRows[0]);
                        result.projectDetails = prjRows[0]
                    }
                    // console.log("empProjAlloc: ", rows);
                    return res.status(200).send({ empProjAlloc: result, user: req.user });
                })
            }
        })
    } else {
        return res.status(500).send("Employee-Project-Allocation ID required");
    }
};

const findByEmpId = (req, res) => {
  const empid = req.query.empid;
  try {
      const alocQry = `SELECT * FROM ${empProjAlloc} WHERE emp_id = ${empid}` ;

      sql.query(alocQry, (err, allocations) => {
          if (err) {
              console.log("ProjectAllocation:: Err getting rows: ", err);
              return res.status(500).send(`Problem getting records. ${err}`);
          }
          return res.status(200).send({employee_allocation: allocations});
      });
  } catch (err) {
      console.log("ProjectAllocation:: Unkown Err:", err);
  }
};

const create = (req, res) => {
  if (!userACL.hasAllocationCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const newAllocation = req.body;
  const insertQuery = `INSERT INTO ${empProjAlloc} set ?`;
  sql.query(insertQuery, [newAllocation], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Allocating Project to Employee. ${err}`);
    } else {
      newAllocation.emp_proj_aloc_id = succeess.insertId;
      const response = {newAllocation,user: req.user};
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasAllocationUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { emp_proj_aloc_id } = req.params;
  if(!emp_proj_aloc_id){
    res.status(500).send('Employee-Project-Allocation ID is Required');
  }
  const updatedAllocation = req.body;
  const updateQuery = `UPDATE ${empProjAlloc} set ? WHERE emp_proj_aloc_id = ?`;
  sql.query(updateQuery,[updatedAllocation, emp_proj_aloc_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${empProjAlloc} with ID: ${emp_proj_aloc_id}. ${err}`);
    } else {
      if (succeess.affectedRows == 1){
        console.log(`${empProjAlloc} UPDATED:` , succeess)
        updatedAllocation.emp_proj_aloc_id = parseInt(emp_proj_aloc_id);
        const response = {updatedAllocation, user: req.user}
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with ID: ${emp_proj_aloc_id}`);
      }
    }
  });
};

const erase = (req, res) => {
  if (!userACL.hasAllocationDeleteAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { emp_proj_aloc_id } = req.params;
  if(!emp_proj_aloc_id){
    res.status(500).send('Employee-Project-Allocation ID is Required');
  }
  const deleteQuery = `DELETE FROM ${empProjAlloc} WHERE emp_proj_aloc_id = ?`;
  sql.query(deleteQuery,[emp_proj_aloc_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${empProjAlloc} with ID: ${emp_proj_aloc_id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${empProjAlloc} DELETED:` , succeess)
        res.status(200).send({msg: `Deleted row from ${empProjAlloc} with ID: ${emp_proj_aloc_id}`, user: req.user});
      } else {
        res.status(404).send(`Record not found with ID: ${emp_proj_aloc_id}`);
      }
    }
  });
};

const findEmpByProjectId = async (req, res) => {
  if (!userACL.hasUtilizationCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const empProjID = req.params.emp_proj_id;
  let result = [];
  if (empProjID) {
    let query =`SELECT emp_details.* FROM employee_details emp_details, ${empProjAlloc} emp_project_alloc`;
    
    query += ` WHERE emp_details.emp_id=emp_project_alloc.emp_id and emp_project_alloc.project_id = '${empProjID}'`;

    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting projects. ${err}`);
      }
      // console.log("projects: ", rows);
      return res.status(200).send({employees: rows});
    });
  } else {
      return res.status(500).send("Employee-Project-Allocation ID required");
  }
};

const findByEmpProjectId = (req, res) => {
  if (!userACL.hasUtilizationCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const empId = req.body.emp_id;
  const projectId = req.body.project_id;
  console.log(req.body.emp_id);
  console.log('inside project_employees_alloc');
  if (projectId, empId) {
    let query =`SELECT * FROM ${empProjAlloc} WHERE emp_id = '${empId}' and project_id = '${projectId}'`;
    
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting Allocation Details. ${err}`);
      }
      // console.log("projects: ", rows);
      return res.status(200).send({allocations: rows});
    });
  } else {
      return res.status(500).send("Employee, Project ID required");
  }
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  erase,
  findEmpByProjectId,
  findByEmpProjectId,
  findByEmpId,
  empProjAllocAsOnToday
}