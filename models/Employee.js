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
    // console.log("employees: ", rows);
    return res.status(200).send({employees: rows});
  });
  //res.render("customers", { customers: rows });
};

const findById = (req, res) => {
  const empDetailsId = req.params.id;
  if (empDetailsId) {
    const query = `SELECT * FROM ${empTable} WHERE id = '${empDetailsId}'`;
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

const create = (req, res) => {
  const newEmployee = req.body;
  const insertQuery = `INSERT INTO ${empTable} set ?`;
  sql.query(insertQuery, [newEmployee], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the employee. ${err}`);
    } else {
      newEmployee.id = succeess.insertId;
      res.status(200).send(newEmployee);
    }
  });
};

const update = (req, res) => {
  const { id } = req.params;
  if(!id){
    res.status(500).send('Employee ID is Required');
  }
  const updatedEmployee = req.body;
  const updateQuery = `UPDATE ${empTable} set ? WHERE id = ?`;
  sql.query(updateQuery,[updatedEmployee, id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${empTable} with ID: ${id}. ${err}`);
    } else {
      if (succeess.affectedRows == 1){
        console.log(`${empTable} UPDATED:` , succeess)
        updatedEmployee.id = parseInt(id);
        res.status(200).send(updatedEmployee);
      } else {
        res.status(404).send(`Record not found with Employee Details ID: ${id}`);
      }
    }
  });
};

const erase = (req, res) => {
  const { id } = req.params;
  if(!id){
    res.status(500).send('Employee ID is Required');
  }
  //const updatedEmployee = req.body;
  const deleteQuery = `DELETE FROM ${empTable} WHERE id = ?`;
  sql.query(deleteQuery,[id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${empTable} with ID: ${id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${empTable} DELETED:` , succeess)
        //updatedEmployee.id = parseInt(id);
        res.status(200).send(`Deleted row from ${empTable} with ID: ${id}`);
      } else {
        res.status(404).send(`Record not found with Employee Details ID: ${id}`);
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