const sql = require("../lib/db.js");
const empProjAlloc = "employee_project_allocations";

const findAll = (req, res) => {
    let finalResult = [];
    try {
        const alocQry = `SELECT * FROM ${empProjAlloc}`;

        sql.query(alocQry, (err, allocations) => {
            if (err) {
                console.log("ProjectAllocation:: Err getting rows: ", err);
                return res.status(500).send(`Problem getting records. ${err}`);
            }
            allocations.forEach((aloc, idx) => {
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

                                if (allocations.length === (idx + 1)) {
                                    return res.status(200).send({ empProjAlloc: finalResult });
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
                    return res.status(200).send({ empProjAlloc: result });
                })
            }
        })
    } else {
        return res.status(500).send("Employee-Project-Allocation ID required");
    }
};

const create = (req, res) => {
  const newAllocation = req.body;
  const insertQuery = `INSERT INTO ${empProjAlloc} set ?`;
  sql.query(insertQuery, [newAllocation], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Allocating Project to Employee. ${err}`);
    } else {
      newAllocation.emp_proj_aloc_id = succeess.insertId;
      res.status(200).send(newAllocation);
    }
  });
};

const update = (req, res) => {
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
        res.status(200).send(updatedAllocation);
      } else {
        res.status(404).send(`Record not found with ID: ${emp_proj_aloc_id}`);
      }
    }
  });
};

const erase = (req, res) => {
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
        res.status(200).send(`Deleted row from ${empProjAlloc} with ID: ${emp_proj_aloc_id}`);
      } else {
        res.status(404).send(`Record not found with ID: ${emp_proj_aloc_id}`);
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