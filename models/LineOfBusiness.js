const sql = require("../lib/db.js");
const lineOfBusinessTable = "line_of_business";
const userACL = require('../lib/userACL.js');

const findAll = (req, res) => {
  if (!userACL.hasLineOfBusinessReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  let query =`SELECT * FROM ${lineOfBusinessTable}`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting line of business. ${err}`);
    }
    return res.status(200).send({lineOfBusiness: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasLineOfBusinessReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const lineOfBusinessId = req.params.id;
  if (lineOfBusinessId) {
    const query = `SELECT * FROM ${lineOfBusinessTable} WHERE line_of_business_id = '${lineOfBusinessId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Line of Business. ${err}`);
      }
      
      return res.status(200).send({lineOfBusiness: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Line of Business ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasLineOfBusinessCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const newLineOfBusiness = req.body;
  const insertQuery = `INSERT INTO ${lineOfBusinessTable} set ?`;
  sql.query(insertQuery, [newLineOfBusiness], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the Line of Business. ${err}`);
    } else {
      newLineOfBusiness.line_of_business_id = success.insertId;   
      const response = {newLineOfBusiness, user: req.user}
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasLineOfBusinessUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { id } = req.params;
  if(!id){
    res.status(500).send('Line of Business ID is Required');
  }
  const updatedLineOfBusiness = req.body;
  const updateQuery = `UPDATE ${lineOfBusinessTable} set ? WHERE line_of_business_id = ?`;
  sql.query(updateQuery,[updatedLineOfBusiness, id], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${lineOfBusinessTable} with ID: ${id}. ${err}`);
    } else {
      if (success.affectedRows == 1){
        console.log(`${lineOfBusinessTable} UPDATED:` , success)
        updatedLineOfBusiness.line_of_business_id = parseInt(id);
        const response = {updatedLineOfBusiness, user: req.user}
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with Line of Business ID: ${id}`);
      }
    }
  });
};

const erase = (req, res) => {
  if (!userACL.hasLineOfBusinessDeleteAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { id } = req.params;
  if(!id){
    res.status(500).send('Line of Business ID is Required');
  }

  const deleteQuery = `DELETE FROM ${lineOfBusinessTable} WHERE line_of_business_id = ?`;
  sql.query(deleteQuery,[id], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${lineOfBusinessTable} with ID: ${id}. ${err}`);
    } else {
      if (success.affectedRows == 1){
        console.log(`${lineOfBusinessTable} DELETED:` , success)
        res.status(200).send({msg: `Deleted row from ${lineOfBusinessTable} with ID: ${id}`, user: req.user});
      } else {
        res.status(404).send(`Record not found with Line of Business ID: ${id}`);
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