const sql = require("../lib/db.js");
const empTable = "employee_details";

const findAll = (req, res) => {
  let query =`SELECT * FROM ${empTable}`;
  if (req.query.first_name) {
    query += ` WHERE first_name LIKE '%${req.query.first_name}%'`;
  }
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting employees. ${err}`);
    }
    return res.status(200).send({employees: rows});
  });
  //res.render("customers", { customers: rows });
};

const findById = (req, res) => {
  const empDetailsId = req.params.emp_id;
  if (empDetailsId) {
    const query = `SELECT * FROM ${empTable} WHERE emp_id = '${empDetailsId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the employee. ${err}`);
      }
      // console.log("employees: ", rows);
      return res.status(200).send({employees: rows});
    });
  } else {
    return res.status(500).send("Employee ID required");
  }
};


const search = (req, res) => {
   
    const empSkill = req.query.skill;
    const empLocation =  req.query.location ?? null;
    const empExperience = req.query.exp ?? null;
    const empRole = req.query.role ??
    
    console.log(empExperience);
    let query = `SELECT * FROM ${empTable} WHERE primary_skills LIKE '%${empSkill}%'`;

    if (empLocation) {
      query = query + ` AND office_location_city LIKE '${empLocation}%'`;
    } 

    if (empExperience) {
      query = query + ` AND total_work_experience_years >= ${empExperience}`;
    }                                          

    if (empRole) {
      query = query + ` AND role LIKE '%${empRole}%'`;
    }   
    
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the employee. ${err}`);
      }
      console.log("employees: ", rows);
      return res.status(200).send({employees: rows});
    });
};

const create = (req, res) => {
  const newEmployee = req.body;
  const insertQuery = `INSERT INTO ${empTable} set ?`;
  sql.query(insertQuery, [newEmployee], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the employee. ${err}`);
    } else {
      newEmployee.emp_id = succeess.insertId;
      res.status(200).send(newEmployee);
    }
  });
};

const update = (req, res) => {
  const { emp_id } = req.params;
  if(!emp_id){
    res.status(500).send('Employee ID is Required');
  }
  const updatedEmployee = req.body;
  const updateQuery = `UPDATE ${empTable} set ? WHERE emp_id = ?`;
  sql.query(updateQuery,[updatedEmployee, emp_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${empTable} with ID: ${emp_id}. ${err}`);
    } else {
      if (succeess.affectedRows == 1){
        console.log(`${empTable} UPDATED:` , succeess)
        updatedEmployee.emp_id = parseInt(emp_id);
        res.status(200).send(updatedEmployee);
      } else {
        res.status(404).send(`Record not found with Employee Details ID: ${emp_id}`);
      }
    }
  });
};

const erase = (req, res) => {
  const { emp_id } = req.params;
  if(!emp_id){
    res.status(500).send('Employee ID is Required');
  }
  //const updatedEmployee = req.body;
  const deleteQuery = `DELETE FROM ${empTable} WHERE emp_id = ?`;
  sql.query(deleteQuery,[emp_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${empTable} with ID: ${emp_id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${empTable} DELETED:` , succeess)
        //updatedEmployee.emp_id = parseInt(emp_id);
        res.status(200).send(`Deleted row from ${empTable} with ID: ${emp_id}`);
      } else {
        res.status(404).send(`Record not found with Employee Details ID: ${emp_id}`);
      }
    }
  });
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  erase,
  search
}