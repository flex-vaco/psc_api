const sql = require("../lib/db.js");
const userRolesTable = "user_roles";
const userACL = require('../lib/userACL.js');
const { reloadUserRoles } = require('../lib/appConstants');

const findAll = (req, res) => {
  if (!userACL.hasUserRoleReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  let query = `
    SELECT ur.*, lb.name as line_of_business_name 
    FROM ${userRolesTable} ur 
    LEFT JOIN line_of_business lb ON ur.line_of_business_id = lb.line_of_business_id
  `;
  let whereConditions = [];
  
  if (req.user.role !== 'administrator') {
    whereConditions.push(`ur.line_of_business_id = ${req.user.line_of_business_id}`);
  }
  
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY ur.role`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting user roles. ${err}`);
    }
    return res.status(200).send({userRoles: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasUserRoleReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const roleId = req.params.id;
  if (roleId) {
    const query = `
      SELECT ur.*, lb.name as line_of_business_name 
      FROM ${userRolesTable} ur 
      LEFT JOIN line_of_business lb ON ur.line_of_business_id = lb.line_of_business_id
      WHERE ur.role_id = ?
    `;
    sql.query(query, [roleId], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the User Role. ${err}`);
      }
      
      return res.status(200).send({userRole: rows[0], user: req.user});
    });
  } else {
    return res.status(500).send("User Role ID required");
  }
};

const findByLineOfBusiness = (req, res) => {
  if (!userACL.hasUserRoleReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const lineOfBusinessId = req.params.lineOfBusinessId;
  if (lineOfBusinessId) {
    const query = `
      SELECT ur.*, lb.name as line_of_business_name 
      FROM ${userRolesTable} ur 
      LEFT JOIN line_of_business lb ON ur.line_of_business_id = lb.line_of_business_id
      WHERE ur.line_of_business_id = ?
      ORDER BY ur.role
    `;
    sql.query(query, [lineOfBusinessId], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting user roles for line of business. ${err}`);
      }
      return res.status(200).send({userRoles: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Line of Business ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasUserRoleCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const newUserRole = req.body;
  
  // Validate required fields
  if (!newUserRole.role || !newUserRole.name || !newUserRole.role_description || !newUserRole.line_of_business_id) {
    return res.status(400).send("Role name, display name, description, and line of business are required");
  }
  
  const insertQuery = `INSERT INTO ${userRolesTable} SET ?`;
  sql.query(insertQuery, [newUserRole], async (err, result) => {
    if (err) {
      console.error("Error adding user role:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to add user role" 
      });
    }
    
    const reloadResult = reloadUserRoles();
    
    if (reloadResult.success) {
      res.status(201).json({
        success: true,
        message: "User role added and constants reloaded successfully",
        roleId: result.insertId
      });
    } else {
      res.status(201).json({
        success: true,
        message: "User role added but failed to reload constants",
        roleId: result.insertId,
        warning: reloadResult.message
      });
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasUserRoleUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  if (!id) {
    return res.status(400).send('User Role ID is Required');
  }
  
  const updatedUserRole = req.body;
  
  // Validate required fields
  if (!updatedUserRole.role || !updatedUserRole.name || !updatedUserRole.role_description || !updatedUserRole.line_of_business_id) {
    return res.status(400).send("Role name, display name, description, and line of business are required");
  }
  
  const updateQuery = `UPDATE ${userRolesTable} SET ? WHERE role_id = ?`;
  sql.query(updateQuery, [updatedUserRole, id], (err, success) => {
    if (err) {
      console.log("error: ", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).send("Role name already exists");
      }
      return res.status(500).send(`Problem while updating the User Role with ID: ${id}. ${err}`);
    } else {
      if (success.affectedRows == 1) {
        console.log(`${userRolesTable} UPDATED:`, success);
        updatedUserRole.role_id = parseInt(id);
        const response = {updatedUserRole, user: req.user};
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with User Role ID: ${id}`);
      }
    }
  });
};

const erase = (req, res) => {
  if (!userACL.hasUserRoleDeleteAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  if (!id) {
    return res.status(400).send('User Role ID is Required');
  }

  // Check if role is being used by any users
  const checkUsageQuery = `SELECT COUNT(*) as count FROM users WHERE role = (SELECT role FROM ${userRolesTable} WHERE role_id = ?)`;
  sql.query(checkUsageQuery, [id], (err, result) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`Problem while checking role usage. ${err}`);
    }
    
    if (result[0].count > 0) {
      return res.status(400).send("Cannot delete role as it is currently assigned to users");
    }
    
    const deleteQuery = `DELETE FROM ${userRolesTable} WHERE role_id = ?`;
    sql.query(deleteQuery, [id], (err, success) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`Problem while deleting the User Role with ID: ${id}. ${err}`);
      } else {
        if (success.affectedRows == 1) {
          console.log(`${userRolesTable} DELETED:`, success);
          res.status(200).send({msg: `Deleted row from ${userRolesTable} with ID: ${id}`, user: req.user});
        } else {
          res.status(404).send(`Record not found with User Role ID: ${id}`);
        }
      }
    });
  });
};

module.exports = {
  findAll,
  findById,
  findByLineOfBusiness,
  create,
  update,
  erase
};
