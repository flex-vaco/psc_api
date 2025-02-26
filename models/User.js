const sql = require("../lib/db.js");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const APP_EMAIL = require("../lib/email.js");

const usersTable = "users";
const APP_CONSTANTS = require('../lib/appConstants.js');

const findAll = (req, res) => {
  let query =`SELECT * FROM ${usersTable}`;
  if (req.query.first_name) {
    query += ` WHERE first_name LIKE '%${req.query.first_name}%'`;
  }
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting Users. ${err}`);
    }
    return res.status(200).send({users: rows});
  });
};

const findByEmail = (req, res) => {
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
  const userId = req.params.user_id;
  
  if (userId) {
    const query = `SELECT * FROM ${usersTable} WHERE user_id = '${userId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the User. ${err}`);
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
  let query ="SELECT * FROM user_roles";

  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting User Roles. ${err}`);
    }
    return res.status(200).send({user_roles: rows});
  });
};

const create = (req, res) => {
    const newUser = req.body;
    if (!newUser.email || !newUser.password) {
        res.status(500).send("Email ID and passord are neeeded");
        return;
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
          if ((newUser.role === APP_CONSTANTS.USER_ROLES.PRODUCER) && newUser.client_ids) {
            producerClientQry = `INSERT INTO producer_clients (producer_id, client_id) VALUES ?`;
            newUser.client_ids.forEach(cl_id => {
              producerClients.push(cl_id);
            });
          }
          if (newUser.client_ids) delete newUser.client_ids;
         // Define salt rounds
         const saltRounds = 9;
         // Hash password
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
                     if (producerClientQry) {
                      let values = [];
                      producerClients.forEach(cl_id =>{
                          values.push([newUser.user_id, cl_id])
                      })
                      console.log("vv",values);
                      sql.query(producerClientQry, [values], (err, success) => {
                        if (err) {
                          console.log("error: ", err);
                          res.status(500).send(`Problem while Adding Producer_Client. ${err}`);
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
  const { user_id } = req.params;
  if(!user_id){
    res.status(500).send('User ID is Required');
  }
  const updatedUser = req.body;
  let producerClients = [];
  let producerClientQry = "";
  if ((updatedUser.role === APP_CONSTANTS.USER_ROLES.PRODUCER) && updatedUser.client_ids) {
    producerClientQry = `INSERT INTO producer_clients (producer_id, client_id) VALUES ? 
	                        ON DUPLICATE KEY UPDATE 
	                        client_id = VALUES(client_id),
	                        producer_id = VALUES(producer_id)`;

    updatedUser.client_ids.forEach(cl_id => {
      producerClients.push(cl_id);
    });
  }
  if (updatedUser.client_ids) delete updatedUser.client_ids;

  const updateQuery = `UPDATE ${usersTable} set ? WHERE user_id = ?`;
  sql.query(updateQuery,[updatedUser, user_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${usersTable} with ID: ${user_id}. ${err}`);
    } else {
      if (succeess.affectedRows == 1) {
        console.log(`${usersTable} UPDATED: `, succeess);
        updatedUser.user_id = parseInt(user_id);
          const delExisting = `DELETE FROM producer_clients WHERE producer_id = ?`;
          sql.query(delExisting, [updatedUser.user_id], (del_err, del_suc) => { //effective if user is changed from producer to other roles
            if (del_err) {
              console.log("Producer-Client deletion error: ", del_err);
              res.status(500).send(`Problem while Deleting producer_client with producer_ID: ${updatedUser.user_id}. ${del_err}`);
            } else {
              if (producerClientQry) {
                let values = [];
                producerClients.forEach(cl_id => {
                  values.push([updatedUser.user_id, cl_id])
                })
                sql.query(producerClientQry, [values], (updt_err, updt_suc) => {
                  if (del_err) {
                    console.log("Producer-Client UPDATE Error: ", updt_err);
                    res.status(500).send(`Problem while Updating producer_client with producer_ID: ${updatedUser.user_id}. ${updt_err}`);
                  } else {
                    res.status(200).send(updatedUser);
                  }
                });
              } else {
                res.status(200).send(updatedUser);
              }
            }
          });
      } else {
        res.status(404).send(`Record not found with User Details ID: ${user_id}`);
      }
    }
  });
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
  const role = req.body.role;
  if (role) {
    const query = `SELECT * FROM ${usersTable} WHERE role = '${role}'`;
    sql.query(query, (err, rows) => {
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

const erase = (req, res) => {
  const { user_id } = req.params;
  if(!user_id){
    res.status(500).send('User ID is Required');
  }
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
      APP_EMAIL.sendEmail('passwordResetRequest', values,subject = `Password Reset Request`, email);

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
  forgotPassword,
  resetPasswordRequest,
}