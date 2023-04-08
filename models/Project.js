const sql = require("../lib/db.js");
const projectTable = "project_details";

const findAll = (req, res) => {
  let query =`SELECT * FROM ${projectTable}`;
  if (req.query.first_name) {
    query += ` WHERE first_name LIKE '%${req.query.first_name}%'`;
  }
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting projects. ${err}`);
    }
    // console.log("projects: ", rows);
    return res.status(200).send({projects: rows});
  });
  //res.render("customers", { customers: rows });
};

const findById = (req, res) => {
  const empDetailsId = req.params.id;
  if (empDetailsId) {
    const query = `SELECT * FROM ${projectTable} WHERE id = '${empDetailsId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Project. ${err}`);
      }
      // console.log("projects: ", rows);
      return res.status(200).send({projects: rows});
    });
  } else {
    return res.status(500).send("Project ID required");
  }
};

const create = (req, res) => {
  const newProject = req.body;
  const insertQuery = `INSERT INTO ${projectTable} set ?`;
  sql.query(insertQuery, [newProject], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the Project. ${err}`);
    } else {
      newProject.id = succeess.insertId;
      res.status(200).send(newProject);
    }
  });
};

const update = (req, res) => {
  const { id } = req.params;
  if(!id){
    res.status(500).send('Project ID is Required');
  }
  const updatedProject = req.body;
  const updateQuery = `UPDATE ${projectTable} set ? WHERE id = ?`;
  sql.query(updateQuery,[updatedProject, id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${projectTable} with ID: ${id}. ${err}`);
    } else {
      if (succeess.changedRows == 1){
        console.log(`${projectTable} UPDATED:` , succeess)
        updatedProject.id = parseInt(id);
        res.status(200).send(updatedProject);
      } else {
        res.status(404).send(`Record not found with Project Details ID: ${id}`);
      }
    }
  });
};

const erase = (req, res) => {
  const { id } = req.params;
  if(!id){
    res.status(500).send('Project ID is Required');
  }
  //const updatedProject = req.body;
  const deleteQuery = `DELETE FROM ${projectTable} WHERE id = ?`;
  sql.query(deleteQuery,[id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${projectTable} with ID: ${id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${projectTable} DELETED:` , succeess)
        //updatedProject.id = parseInt(id);
        res.status(200).send(`Deleted row from ${projectTable} with ID: ${id}`);
      } else {
        res.status(404).send(`Record not found with Project Details ID: ${id}`);
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