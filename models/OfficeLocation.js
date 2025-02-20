const sql = require("../lib/db.js");
const officeLocationTable = "office_locations";
const userACL = require('../lib/userACL.js');

const findAll = (req, res) => {
  if (!userACL.hasLocationAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  let query =`SELECT * FROM ${officeLocationTable}`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting locations. ${err}`);
    }
    return res.status(200).send({locations: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasLocationAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const officeLocationDetailsId = req.params.office_location_id;
  if (officeLocationDetailsId) {
    const query = `SELECT * FROM ${officeLocationTable} WHERE office_location_id = '${officeLocationDetailsId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Office Location. ${err}`);
      }
      
      return res.status(200).send({locations: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Loation ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasLocationAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const newLocation = req.body;
  const insertQuery = `INSERT INTO ${officeLocationTable} set ?`;
  sql.query(insertQuery, [newLocation], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the Location. ${err}`);
    } else {
        newLocation.office_location_id = succeess.insertId;   
      const response = {newLocation, user: req.user}
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasLocationAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const { office_location_id } = req.params;
  if(!office_location_id){
    res.status(500).send('Location ID is Required');
  }
  const updatedLocation = req.body;
  const updateQuery = `UPDATE ${officeLocationTable} set ? WHERE office_location_id = ?`;
  sql.query(updateQuery,[updatedLocation, office_location_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${officeLocationTable} with ID: ${office_location_id}. ${err}`);
    } else {
      if (succeess.affectedRows == 1){
        console.log(`${officeLocationTable} UPDATED:` , succeess)
        updatedLocation.office_location_id = parseInt(office_location_id);
        const response = {updatedLocation, user: req.user}
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with Location Details ID: ${office_location_id}`);
      }
    }
  });
};


module.exports = {
  findAll,
  findById,
  create,
  update,
}