const sql = require("../lib/db.js");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const APP_EMAIL = require("../lib/email.js");

const usersTable = "users";
const APP_CONSTANTS = require('../lib/appConstants.js');
const userACL = require('../lib/userACL.js');

const findAll = (req, res) => {
  if (!userACL.hasUserReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  let query = `SELECT u.*, lb.name as line_of_business_name FROM ${usersTable} u LEFT JOIN line_of_business lb ON u.line_of_business_id = lb.line_of_business_id`;
  let whereConditions = [];
  
  if (req.user.role !== 'administrator') {
    whereConditions.push(`u.line_of_business_id = ${req.user.line_of_business_id}`);
  }
  
  if (req.query.first_name) {
    whereConditions.push(`u.first_name LIKE '%${req.query.first_name}%'`);
  }
  
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY u.first_name, u.last_name`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting Users. ${err}`);
    }
    return res.status(200).send({users: rows});
  });
};

const findByEmail = (req, res) => {
  if (!userACL.hasUserReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const emailId = req.params.email;
  if (emailId) {
    const query = `SELECT * FROM ${usersTable} WHERE email = '${emailId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the User. ${err}`);
      }
      return res.status(200).send({user: rows[0]});
    });
  } else {
    return res.status(500).send("Email ID required");
  }
};

const findById = (req, res) => {
  if (!userACL.hasUserReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const userId = req.params.user_id;
  
  if (userId) {
    let query = `SELECT u.*, lb.name as line_of_business_name FROM ${usersTable} u LEFT JOIN line_of_business lb ON u.line_of_business_id = lb.line_of_business_id WHERE u.user_id = ?`;
    let params = [userId];
    
    if (req.user.role !== 'administrator') {
      query += ` AND u.line_of_business_id = ?`;
      params.push(req.user.line_of_business_id);
    }
    
    sql.query(query, params, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the User. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("User not found or access denied");
      }
      
      if (rows[0]?.role === APP_CONSTANTS.USER_ROLES.PRODUCER) {
        const producerClientsQry = `SELECT * FROM producer_clients WHERE producer_id = ${userId}`;
        sql.query(producerClientsQry, (err, cl_ids) => {
          if (err) {
            console.log("error: ", err);
            return res.status(500).send(`There was a problem finding the Producer clients. ${err}`);
          } else {
            rows[0].producer_clients = cl_ids;
            return res.status(200).send({ user: rows[0] });
          }
        })
      } else {
        return res.status(200).send({user: rows[0]});
      }
    });
  } else {
    return res.status(500).send("User ID required");
  }
};

const getUserRoles = (req, res) => {
  let query = "SELECT * FROM user_roles";
  let whereConditions = [];
  if (req.user.role !== 'administrator') {
    whereConditions.push(`line_of_business_id = ${req.user.line_of_business_id}`);
  }
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  query += ` ORDER BY role`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting User Roles. ${err}`);
    }
    return res.status(200).send({user_roles: rows});
  });
};

const create = (req, res) => {
    if (!userACL.hasUserCreateAccess(req.user.role)) {
        const msg = `User role '${req.user.role}' does not have privileges on this action`;
        return res.status(404).send({error: true, message: msg});
    }
    
    const newUser = req.body;
    if (!newUser.email || !newUser.password) {
        res.status(500).send("Email ID and passord are neeeded");
        return;
    }
    
    if (req.user.role !== 'administrator') {
        if (!newUser.line_of_business_id) {
            return res.status(400).send("Line of business is required for non administrator users");
        }
        if (newUser.line_of_business_id != req.user.line_of_business_id) {
            return res.status(403).send("Non administrator users can only create users in their own line of business");
        }
    }
    const chkUsrQuery = `SELECT * FROM ${usersTable} WHERE email = '${newUser.email}'`;
    sql.query(chkUsrQuery, (err, rows) => {
        if (err) throw new Error(`Internal Server Error: ${err}`);
        if (rows.length >=1){
            console.log(`User Already exists with email ID. ${newUser.email}`)
            res.status(500).send(`User Already exists with email ID. ${newUser.email}`);
        } else {
          let producerClients = [];
          let producerClientQry = "";
          let offshoreLeadServiceLines = [];
          let offshoreLeadServiceLineQry = "";
          
          if ((newUser.role === APP_CONSTANTS.USER_ROLES.PRODUCER) && newUser.client_ids) {
            producerClientQry = `INSERT INTO producer_clients (producer_id, client_id) VALUES ?`;
            newUser.client_ids.forEach(cl_id => {
              producerClients.push(cl_id);
            });
          }
          
          if ((newUser.role === APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD) && newUser.service_line_ids) {
            offshoreLeadServiceLineQry = `INSERT INTO offshore_lead_service_lines (offshore_lead_id, service_line_id) VALUES ?`;
            newUser.service_line_ids.forEach(sl_id => {
              offshoreLeadServiceLines.push(sl_id);
            });
          }
          
          if (newUser.client_ids) delete newUser.client_ids;
          if (newUser.service_line_ids) delete newUser.service_line_ids;
         // Define salt rounds
         const saltRounds = 9;
         // Hash password
         const values = {
          userName: `${newUser.first_name} ${newUser.last_name}`,
          userEmail: newUser.email,
          userPassword: newUser.password,
          loginLink: `${process.env.VACO_FLEX_UI}`
        };
         bcrypt.hash(newUser.password, saltRounds, (err, hash) => {
             if (err) throw new Error("Internal Server Error");
             newUser.password = hash;
             newUser.needsPasswordReset = true;
             const insertQuery = `INSERT INTO ${usersTable} set ?`;
             sql.query(insertQuery, [newUser], (err, succeess) => {
                 if (err) {
                     console.log("error: ", err);
                     res.status(500).send(`Problem while Adding the User. ${err}`);
                 } else {
                     newUser.user_id = succeess.insertId;
                     
                      //APP_EMAIL.sendEmail('newUserCreation', values,subject = `Welcome to Vaco Flex - Your New Account Details`, newUser.email);
                     if (producerClientQry) {
                      let values = [];
                      producerClients.forEach(cl_id =>{
                          values.push([newUser.user_id, cl_id])
                      })
                      sql.query(producerClientQry, [values], (err, success) => {
                        if (err) {
                          console.log("error: ", err);
                          res.status(500).send(`Problem while Adding Producer_Client. ${err}`);
                      } else {
                        // Handle offshore lead service lines after producer clients
                        if (offshoreLeadServiceLineQry) {
                          let serviceLineValues = [];
                          offshoreLeadServiceLines.forEach(sl_id =>{
                              serviceLineValues.push([newUser.user_id, sl_id])
                          })
                          sql.query(offshoreLeadServiceLineQry, [serviceLineValues], (err, success) => {
                            if (err) {
                              console.log("error: ", err);
                              res.status(500).send(`Problem while Adding Offshore_Lead_Service_Line. ${err}`);
                          } else {
                            res.status(200).send(newUser);
                          }
                          });
                        } else {
                          res.status(200).send(newUser);
                        }
                      }
                      });
                     } else if (offshoreLeadServiceLineQry) {
                      let serviceLineValues = [];
                      offshoreLeadServiceLines.forEach(sl_id =>{
                          serviceLineValues.push([newUser.user_id, sl_id])
                      })
                      sql.query(offshoreLeadServiceLineQry, [serviceLineValues], (err, success) => {
                        if (err) {
                          console.log("error: ", err);
                          res.status(500).send(`Problem while Adding Offshore_Lead_Service_Line. ${err}`);
                      } else {
                        res.status(200).send(newUser);
                      }
                      });
                     } else {
                      res.status(200).send(newUser);
                     }
                 }
             });
         });
        }
    });
};

const signIn = (req, res) => {
    try {
        const { email, password } = req.body;
        const chkUsrQuery = `SELECT * FROM ${usersTable} WHERE email = '${email}'`;
        sql.query(chkUsrQuery, (err, rows) => {
            if (err) throw new Error(`Internal Server Error: ${err}`);

            if (rows.length == 0) {
                return res.status(401).json({ message: "Invalid Credentials" });
            } else {
                const user = rows[0];
                // Compare passwords
                bcrypt.compare(password, user.password, (err, result) => {
                    if (result) {
                      delete user["password"];
                      const jwToken = jwt.sign({user:user},process.env.JWT_SECRET,{ expiresIn: '3h' });
                        return res.status(200).json({ message: "Logged in!", token: jwToken, user: user });
                    }
                    console.log(err);
                    return res.status(401).json({ message: "Invalid Credentials" });
                });
            }
        })
    } catch (error) {
        res.status(401).send(error.message);
    }
}

const update = (req, res) => {
  if (!userACL.hasUserUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { user_id } = req.params;
  if(!user_id){
    res.status(500).send('User ID is Required');
  }
  const updatedUser = req.body;
  
  if (req.user.role !== 'administrator') {
    const checkQuery = `SELECT line_of_business_id FROM ${usersTable} WHERE user_id = ?`;
    sql.query(checkQuery, [user_id], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`Problem while checking user access. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("User not found");
      }
      
      if (rows[0].line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users can only update users in their own line of business");
      }
      
      if (updatedUser.line_of_business_id && updatedUser.line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users cannot change user's line of business");
      }
      
      proceedWithUpdate();
    });
  } else {
    proceedWithUpdate();
  }
  
  function proceedWithUpdate() {
  let producerClients = [];
  let producerClientQry = "";
  let offshoreLeadServiceLines = [];
  let offshoreLeadServiceLineQry = "";
  
  if ((updatedUser.role === APP_CONSTANTS.USER_ROLES.PRODUCER) && updatedUser.client_ids) {
    producerClientQry = `INSERT INTO producer_clients (producer_id, client_id) VALUES ? 
	                        ON DUPLICATE KEY UPDATE 
	                        client_id = VALUES(client_id),
	                        producer_id = VALUES(producer_id)`;

    updatedUser.client_ids.forEach(cl_id => {
      producerClients.push(cl_id);
    });
  }
  
  if ((updatedUser.role === APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD) && updatedUser.service_line_ids) {
    offshoreLeadServiceLineQry = `INSERT INTO offshore_lead_service_lines (offshore_lead_id, service_line_id) VALUES ? 
	                        ON DUPLICATE KEY UPDATE 
	                        service_line_id = VALUES(service_line_id),
	                        offshore_lead_id = VALUES(offshore_lead_id)`;

    updatedUser.service_line_ids.forEach(sl_id => {
      offshoreLeadServiceLines.push(sl_id);
    });
  }
  
  if (updatedUser.client_ids) delete updatedUser.client_ids;
  if (updatedUser.service_line_ids) delete updatedUser.service_line_ids;

  const updateQuery = `UPDATE ${usersTable} set ? WHERE user_id = ?`;
  sql.query(updateQuery,[updatedUser, user_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${usersTable} with ID: ${user_id}. ${err}`);
    } else {
      if (succeess.affectedRows == 1) {
        console.log(`${usersTable} UPDATED: `, succeess);
        updatedUser.user_id = parseInt(user_id);
          // Delete existing producer clients and offshore lead service lines
          const delExistingProducer = `DELETE FROM producer_clients WHERE producer_id = ?`;
          const delExistingOffshoreLead = `DELETE FROM offshore_lead_service_lines WHERE offshore_lead_id = ?`;
          
          sql.query(delExistingProducer, [updatedUser.user_id], (del_prod_err, del_prod_suc) => {
            if (del_prod_err) {
              console.log("Producer-Client deletion error: ", del_prod_err);
              res.status(500).send(`Problem while Deleting producer_client with producer_ID: ${updatedUser.user_id}. ${del_prod_err}`);
            } else {
              sql.query(delExistingOffshoreLead, [updatedUser.user_id], (del_offshore_err, del_offshore_suc) => {
                if (del_offshore_err) {
                  console.log("Offshore-Lead-Service-Line deletion error: ", del_offshore_err);
                  res.status(500).send(`Problem while Deleting offshore_lead_service_lines with offshore_lead_id: ${updatedUser.user_id}. ${del_offshore_err}`);
                } else {
                  // Handle producer clients
                  if (producerClientQry) {
                    let values = [];
                    producerClients.forEach(cl_id => {
                      values.push([updatedUser.user_id, cl_id])
                    })
                    sql.query(producerClientQry, [values], (updt_err, updt_suc) => {
                      if (updt_err) {
                        console.log("Producer-Client UPDATE Error: ", updt_err);
                        res.status(500).send(`Problem while Updating producer_client with producer_ID: ${updatedUser.user_id}. ${updt_err}`);
                      } else {
                        // Handle offshore lead service lines
                        if (offshoreLeadServiceLineQry) {
                          let serviceLineValues = [];
                          offshoreLeadServiceLines.forEach(sl_id => {
                            serviceLineValues.push([updatedUser.user_id, sl_id])
                          })
                          sql.query(offshoreLeadServiceLineQry, [serviceLineValues], (updt_offshore_err, updt_offshore_suc) => {
                            if (updt_offshore_err) {
                              console.log("Offshore-Lead-Service-Line UPDATE Error: ", updt_offshore_err);
                              res.status(500).send(`Problem while Updating offshore_lead_service_lines with offshore_lead_id: ${updatedUser.user_id}. ${updt_offshore_err}`);
                            } else {
                              res.status(200).send(updatedUser);
                            }
                          });
                        } else {
                          res.status(200).send(updatedUser);
                        }
                      }
                    });
                  } else if (offshoreLeadServiceLineQry) {
                    let serviceLineValues = [];
                    offshoreLeadServiceLines.forEach(sl_id => {
                      serviceLineValues.push([updatedUser.user_id, sl_id])
                    })
                    sql.query(offshoreLeadServiceLineQry, [serviceLineValues], (updt_offshore_err, updt_offshore_suc) => {
                      if (updt_offshore_err) {
                        console.log("Offshore-Lead-Service-Line UPDATE Error: ", updt_offshore_err);
                        res.status(500).send(`Problem while Updating offshore_lead_service_lines with offshore_lead_id: ${updatedUser.user_id}. ${updt_offshore_err}`);
                      } else {
                        res.status(200).send(updatedUser);
                      }
                    });
                  } else {
                    res.status(200).send(updatedUser);
                  }
                }
              });
            }
          });
      } else {
        res.status(404).send(`Record not found with User Details ID: ${user_id}`);
      }
    }
  });
  }
};

const resetPassword = (req, res) => {
  const { user_id } = req.params;
  if(!user_id){
    res.status(500).send('User ID is Required');
  }
  const updatedUser = req.body;
  const updateQuery = `UPDATE ${usersTable} set ? WHERE user_id = ?`;
  // Define salt rounds
  const saltRounds = 9;
  // Hash password
  bcrypt.hash(updatedUser.password, saltRounds, (err, hash) => {
      if (err) throw new Error("Internal Server Error");
      updatedUser.password = hash;
      sql.query(updateQuery,[updatedUser, user_id], (err, succeess) => {
        if (err) {
          console.log("error: ", err);
          res.status(500).send(`Problem while Updating the ${usersTable} with ID: ${user_id}. ${err}`);
        } else {
          if (succeess.affectedRows == 1){
            console.log(`${usersTable} UPDATED:` , succeess)
            updatedUser.user_id = parseInt(user_id);
            res.status(200).send(updatedUser);
          } else {
            res.status(404).send(`Record not found with User Details ID: ${user_id}`);
          }
        }
      });
  });

};

const getUserByRole = (req, res) => {
  if (!userACL.hasUserReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const role = req.body.role;
  if (role) {
    let query = `SELECT * FROM ${usersTable} WHERE role = ?`;
    let params = [role];
    
    // Add line of business filter for non-administrator users
    if (req.user.role !== 'administrator') {
      query += ` AND line_of_business_id = ?`;
      params.push(req.user.line_of_business_id);
    }
    
    sql.query(query, params, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Users. ${err}`);
      }
      return res.status(200).send({users: rows});
    });
  } else {
    return res.status(500).send("Role is required");
  }
}

const getManagersByLineOfBusiness = (req, res) => {
  if (!userACL.hasUserReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { line_of_business_id } = req.body;
  if (!line_of_business_id) {
    return res.status(500).send("Line of Business ID is required");
  }
  
  const query = `SELECT * FROM ${usersTable} WHERE (role = 'manager' OR role = 'offshorelead') AND line_of_business_id = ?`;
  sql.query(query, [line_of_business_id], (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem finding the Managers. ${err}`);
    }
    return res.status(200).send({users: rows});
  });
}

const erase = (req, res) => {
  if (!userACL.hasUserDeleteAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { user_id } = req.params;
  if(!user_id){
    res.status(500).send('User ID is Required');
  }
  
  if (req.user.role !== 'administrator') {
    const checkQuery = `SELECT line_of_business_id FROM ${usersTable} WHERE user_id = ?`;
    sql.query(checkQuery, [user_id], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`Problem while checking user access. ${err}`);
      }
      
      if (rows.length === 0) {
        return res.status(404).send("User not found");
      }
      
      if (rows[0].line_of_business_id != req.user.line_of_business_id) {
        return res.status(403).send("Non administrator users can only delete users in their own line of business");
      }
      
      proceedWithDelete();
    });
  } else {
    proceedWithDelete();
  }
  
  function proceedWithDelete() {
    const deleteQuery = `DELETE FROM ${usersTable} WHERE user_id = ?`;
    sql.query(deleteQuery,[user_id], (err, succeess) => {
      if (err) {
        console.log("error: ", err);
        res.status(500).send(`Problem while Deleting the ${usersTable} with ID: ${user_id}. ${err}`);
      } else {
        if (succeess.affectedRows == 1){
          console.log(`${usersTable} DELETED:` , succeess)
          res.status(200).send(`Deleted row from ${usersTable} with ID: ${user_id}`);
        } else {
          res.status(404).send(`Record not found with User Details ID: ${user_id}`);
        }
      }
    });
  }
};

const forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(500).send('Email ID is Required');
  }
  const query = `SELECT * FROM ${usersTable} WHERE email = '${email}'`;
  const protocol = req.protocol;  
  const host = req.get('host');

  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem finding the User. ${err}`);
    }
    if (rows.length == 0) {
      return res.status(404).send(`User not found with Email ID: ${email}`);
    } else {
      const user = rows[0];
      const jwToken = jwt.sign({ userId: user.user_id, email: user.email },process.env.JWT_SECRET,{ expiresIn: '3h' });
      const values = {
        resetLink: `${process.env.VACO_FLEX_UI}/updatePassword?token=${jwToken}`,
        userName: `${user.first_name} ${user.last_name}`
      };
      
      return res.status(200).json({ message: "Token Generated!", token: jwToken });
    }
  });
}

const resetPasswordRequest = (req, res) => {
  const { token, newPassword } = req.body;

  try {

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const selectQuery = 'SELECT user_id FROM users WHERE user_id = ? AND email = ?';
      sql.query(selectQuery, [decoded.userId, decoded.email], (err, users) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (users.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        bcrypt.hash(newPassword, 9, (hashErr, hashedPassword) => {
          if (hashErr) {
            console.error(hashErr);
            return res.status(500).json({ error: 'Error hashing password' });
          }

          const updateQuery = 'UPDATE users SET password = ? WHERE user_id = ?';
          sql.query(updateQuery, [hashedPassword, decoded.userId], (updateErr, result) => {
            if (updateErr) {
              console.error(updateErr);
              return res.status(500).send(`Error updating password ${updateErr}`);
            }
            return res.status(200).send({'Password updated successfully': true});
          });
        });
      });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Token has expired' });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}

const findByLineOfBusiness = (req, res) => {
  if (!userACL.hasUserReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  const lineOfBusinessId = req.params.lineOfBusinessId;
  if (lineOfBusinessId) {
    const query = `SELECT u.*, lb.name as line_of_business_name FROM ${usersTable} u LEFT JOIN line_of_business lb ON u.line_of_business_id = lb.line_of_business_id WHERE u.line_of_business_id = ? ORDER BY u.first_name, u.last_name`;
    sql.query(query, [lineOfBusinessId], (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting users for line of business. ${err}`);
      }
      return res.status(200).send({users: rows, user: req.user});
    });
  } else {
    return res.status(500).send("Line of Business ID required");
  }
};

const getOffshoreLeadsByServiceLine = (req, res) => {
  if (!userACL.hasUserReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const serviceLineId = req.params.serviceLineId;
  if (!serviceLineId) {
    return res.status(400).send({error: true, message: "Service Line ID is required"});
  }
  
  const query = `
    SELECT DISTINCT u.user_id, u.first_name, u.last_name, u.email, u.role, u.line_of_business_id
    FROM ${usersTable} u
    INNER JOIN offshore_lead_service_lines olsl ON u.user_id = olsl.offshore_lead_id
    WHERE olsl.service_line_id = ? AND u.role = 'off_shore_lead'
    ORDER BY u.first_name, u.last_name
  `;
  
  sql.query(query, [serviceLineId], (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting offshore leads for service line. ${err}`);
    }
    return res.status(200).send({offshoreLeads: rows, user: req.user});
  });
};

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  erase,
  signIn,
  getUserRoles,
  resetPassword,
  getUserByRole,
  getManagersByLineOfBusiness,
  findByLineOfBusiness,
  getOffshoreLeadsByServiceLine,
  forgotPassword,
  resetPasswordRequest,
}