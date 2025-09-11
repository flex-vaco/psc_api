const sql = require("../lib/db.js");
const capabilityAreaTable = "capability_area";
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');

const findAll = (req, res) => {
  if (!userACL.hasCapabilityAreaReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  let query = `SELECT ca.*, sl.name as service_line_name, lb.name as line_of_business_name FROM ${capabilityAreaTable} ca 
               LEFT JOIN service_line sl ON ca.service_line_id = sl.service_line_id
               LEFT JOIN line_of_business lb ON ca.line_of_business_id = lb.line_of_business_id`;
  let whereConditions = [];
  
  if (req.user.role !== 'administrator') {
    whereConditions.push(`ca.line_of_business_id = ${req.user.line_of_business_id}`);
  }
  
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY ca.name`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting capability areas. ${err}`);
    }
    return res.status(200).send({capabilityAreas: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasCapabilityAreaReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const capabilityAreaId = req.params.id;
  if (capabilityAreaId) {
    let query = `SELECT ca.*, sl.name as service_line_name, lb.name as line_of_business_name FROM ${capabilityAreaTable} ca 
                   LEFT JOIN service_line sl ON ca.service_line_id = sl.service_line_id 
                   LEFT JOIN line_of_business lb ON ca.line_of_business_id = lb.line_of_business_id
                   WHERE ca.capability_area_id = ?`;
    let params = [capabilityAreaId];
    
    if (req.user.role !== 'administrator') {
      query += ` AND ca.line_of_business_id = ?`;
      params.push(req.user.line_of_business_id);
    }
    
    sql.query(query, params, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Capability Area. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("Capability Area not found or access denied");
      }
      
      return res.status(200).send({capabilityArea: rows[0], user: req.user});
    });
  } else {
    return res.status(500).send("Capability Area ID required");
  }
};

const findByServiceLine = (req, res) => {
  if (!userACL.hasCapabilityAreaReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const serviceLineId = req.params.serviceLineId;
  if (serviceLineId) {
    const query = `SELECT * FROM ${capabilityAreaTable} WHERE service_line_id = ?`;
    sql.query(query, [serviceLineId], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting capability areas for service line. ${err}`);
      }
      return res.status(200).send({capabilityAreas: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Service Line ID required");
  }
};

const findByLineOfBusiness = (req, res) => {
  if (!userACL.hasCapabilityAreaReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const lineOfBusinessId = req.params.lineOfBusinessId;
  if (lineOfBusinessId) {
    const query = `SELECT * FROM ${capabilityAreaTable} WHERE line_of_business_id = ?`;
    sql.query(query, [lineOfBusinessId], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting capability areas for line of business. ${err}`);
      }
      return res.status(200).send({capabilityAreas: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Line of Business ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasCapabilityAreaCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const newCapabilityArea = req.body;
  
  if (req.user.role !== 'administrator') {
    if (!newCapabilityArea.line_of_business_id) {
      return res.status(400).send("Line of business is required for non administrator users");
    }
    if (newCapabilityArea.line_of_business_id != req.user.line_of_business_id) {
      return res.status(403).send("Non administrator users can only create capability areas in their own line of business");
    }
  }
  
  const insertQuery = `INSERT INTO ${capabilityAreaTable} set ?`;
  sql.query(insertQuery, [newCapabilityArea], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the Capability Area. ${err}`);
    } else {
      newCapabilityArea.capability_area_id = success.insertId;   
      const response = {newCapabilityArea, user: req.user}
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasCapabilityAreaUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  if(!id){
    res.status(500).send('Capability Area ID is Required');
  }
  const updatedCapabilityArea = req.body;
  
  if (req.user.role !== 'administrator') {
    const checkQuery = `SELECT line_of_business_id FROM ${capabilityAreaTable} WHERE capability_area_id = ?`;
    sql.query(checkQuery, [id], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`Problem while checking capability area access. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("Capability Area not found");
      }
      
      if (rows[0].line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users can only update capability areas in their own line of business");
      }
      
      if (updatedCapabilityArea.line_of_business_id && updatedCapabilityArea.line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users cannot change capability area's line of business");
      }
      
      proceedWithUpdate();
    });
  } else {
    proceedWithUpdate();
  }
  
  function proceedWithUpdate() {
    const updateQuery = `UPDATE ${capabilityAreaTable} set ? WHERE capability_area_id = ?`;
    sql.query(updateQuery,[updatedCapabilityArea, id], (err, success) => {
      if (err) {
        console.log("error: ", err);
        res.status(500).send(`Problem while Updating the ${capabilityAreaTable} with ID: ${id}. ${err}`);
      } else {
        if (success.affectedRows == 1){
          console.log(`${capabilityAreaTable} UPDATED:` , success)
          updatedCapabilityArea.capability_area_id = parseInt(id);
          const response = {updatedCapabilityArea, user: req.user}
          res.status(200).send(response);
        } else {
          res.status(404).send(`Record not found with Capability Area ID: ${id}`);
        }
      }
    });
  }
};

const erase = (req, res) => {
  if (!userACL.hasCapabilityAreaDeleteAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  if(!id){
    res.status(500).send('Capability Area ID is Required');
  }
  
  if (req.user.role !== 'administrator') {
    const checkQuery = `SELECT line_of_business_id FROM ${capabilityAreaTable} WHERE capability_area_id = ?`;
    sql.query(checkQuery, [id], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`Problem while checking capability area access. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("Capability Area not found");
      }
      
      if (rows[0].line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users can only delete capability areas in their own line of business");
      }
    
      proceedWithDelete();
    });
  } else {
    proceedWithDelete();
  }
  
  function proceedWithDelete() {
    const deleteQuery = `DELETE FROM ${capabilityAreaTable} WHERE capability_area_id = ?`;
    sql.query(deleteQuery,[id], (err, success) => {
      if (err) {
        console.log("error: ", err);
        res.status(500).send(`Problem while Deleting the ${capabilityAreaTable} with ID: ${id}. ${err}`);
      } else {
        if (success.affectedRows == 1){
          console.log(`${capabilityAreaTable} DELETED:` , success)
          res.status(200).send({msg: `Deleted row from ${capabilityAreaTable} with ID: ${id}`, user: req.user});
        } else {
          res.status(404).send(`Record not found with Capability Area ID: ${id}`);
        }
      }
    });
  }
};

module.exports = {
  findAll,
  findById,
  findByServiceLine,
  findByLineOfBusiness,
  create,
  update,
  erase
} 