const { token } = require("morgan");
const sql = require("../lib/db.js");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


const usersTable = "users";

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
    // console.log("Users: ", rows);
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
      // console.log("users: ", rows);
      return res.status(200).send({user: rows[0]});
    });
  } else {
    return res.status(500).send("Email ID required");
  }
};

const userExists = (email) => {
    // Check if the email is already in use
    if (!email) {
        return false;
     }
        const query = `SELECT * FROM ${usersTable} WHERE email = '${email}'`;
        sql.query(query, (err, rows) => {
            if (err) {
                console.log("error: ", err);
                return false;
            }
            return rows.length >=1 ? true : false;
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
         // Define salt rounds
         const saltRounds = 9;
         // Hash password
         bcrypt.hash(newUser.password, saltRounds, (err, hash) => {
             if (err) throw new Error("Internal Server Error");
             newUser.password = hash;
             const insertQuery = `INSERT INTO ${usersTable} set ?`;
             sql.query(insertQuery, [newUser], (err, succeess) => {
                 if (err) {
                     console.log("error: ", err);
                     res.status(500).send(`Problem while Adding the User. ${err}`);
                 } else {
                     newUser.id = succeess.insertId;
                     res.status(200).send(newUser);
                 }
             });
         });
        }
    });
};

const signIn = (req, res) => {
    try {
        // Extract email and password from the req.body object
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
                      const jwToken = jwt.sign({id:user.id},'fract-api-jwt-secrect',{ expiresIn: '1h' });
                        return res.status(200).json({ message: "Logged in!", token: jwToken, user: user });
                    }
                    console.log(err);
                    return res.status(401).json({ message: "Invalid Credentials" });
                });
            }
        })
    } catch (error) {
        res.status(401).send(err.message);
    }
}

const update = (req, res) => {
  const { id } = req.params;
  if(!id){
    res.status(500).send('User ID is Required');
  }
  const updatedUser = req.body;
  const updateQuery = `UPDATE ${usersTable} set ? WHERE id = ?`;
  sql.query(updateQuery,[updatedUser, id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${usersTable} with ID: ${id}. ${err}`);
    } else {
      if (succeess.affectedRows == 1){
        console.log(`${usersTable} UPDATED:` , succeess)
        updatedUser.id = parseInt(id);
        res.status(200).send(updatedUser);
      } else {
        res.status(404).send(`Record not found with User Details ID: ${id}`);
      }
    }
  });
};

const erase = (req, res) => {
  const { id } = req.params;
  if(!id){
    res.status(500).send('User ID is Required');
  }
  //const updatedUser = req.body;
  const deleteQuery = `DELETE FROM ${usersTable} WHERE id = ?`;
  sql.query(deleteQuery,[id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${usersTable} with ID: ${id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${usersTable} DELETED:` , succeess)
        //updatedUser.id = parseInt(id);
        res.status(200).send(`Deleted row from ${usersTable} with ID: ${id}`);
      } else {
        res.status(404).send(`Record not found with User Details ID: ${id}`);
      }
    }
  });
};

module.exports = {
  findAll,
  findByEmail,
  create,
  update,
  erase,
  signIn
}