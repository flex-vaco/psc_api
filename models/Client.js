const sql = require("../lib/db.js");
const clientTable = "clients";
const userACL = require('../lib/userACL.js');

const findAll = (req, res) => {
  if (!userACL.hasClientReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  let query =`SELECT * FROM ${clientTable}`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting clients. ${err}`);
    }
    return res.status(200).send({clients: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasClientReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const clientDetailsId = req.params.client_id;
  if (clientDetailsId) {
    const query = `SELECT * FROM ${clientTable} WHERE client_id = '${clientDetailsId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Client. ${err}`);
      }
      
      return res.status(200).send({clients: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Client ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasClientCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const newClient = req.body;
  const insertQuery = `INSERT INTO ${clientTable} set ?`;
  sql.query(insertQuery, [newClient], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the Client. ${err}`);
    } else {
      newClient.client_id = succeess.insertId;   
      const response = {newClient, user: req.user}
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasClientUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { client_id } = req.params;
  if(!client_id){
    res.status(500).send('Client ID is Required');
  }
  const updatedClient = req.body;
  const updateQuery = `UPDATE ${clientTable} set ? WHERE client_id = ?`;
  sql.query(updateQuery,[updatedClient, client_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${clientTable} with ID: ${client_id}. ${err}`);
    } else {
      if (succeess.affectedRows == 1){
        console.log(`${clientTable} UPDATED:` , succeess)
        updatedClient.client_id = parseInt(client_id);
        const response = {updatedClient, user: req.user}
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with Client Details ID: ${client_id}`);
      }
    }
  });
};

const erase = (req, res) => {
  if (!userACL.hasClientDeleteAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { client_id } = req.params;
  if(!client_id){
    res.status(500).send('Client ID is Required');
  }

  const deleteQuery = `DELETE FROM ${clientTable} WHERE client_id = ?`;
  sql.query(deleteQuery,[client_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${clientTable} with ID: ${client_id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${clientTable} DELETED:` , succeess)
        res.status(200).send({msg: `Deleted row from ${clientTable} with ID: ${client_id}`, user: req.user});
      } else {
        res.status(404).send(`Record not found with Client Details ID: ${client_id}`);
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