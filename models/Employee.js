const sql = require("../lib/db.js");
const empTable = "employee_details";
const multer = require('multer');
const path = require('path');

const findAll = (req, res) => { // filters by name if params are given
  const empName = req.params.emp_name;
  let query =`SELECT * FROM ${empTable}`;
  if (req.query.empName) {
    query += ` WHERE first_name LIKE '%${empName}%' OR last_name LIKE '%${empName}%'`;
  }
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting employees. ${err}`);
    }
    return res.status(200).send({employees: rows});
  });
};

const findById = (req, res) => {
  const empDetailsId = req.params.emp_id;
  if (empDetailsId) {
    const query = `SELECT * FROM ${empTable} WHERE emp_id = '${empDetailsId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the employee. ${err}`);
      }
      return res.status(200).send({employees: rows});
    });
  } else {
    return res.status(500).send("Employee ID required");
  }
};


const search = (req, res) => {
   
    const empSkills = req.query.skill;
    const empLocation =  req.query.location ?? null;
    const empExperience = req.query.exp ?? null;
    const empRole = req.query.role ??
    
    console.log(empExperience);
    let query = `SELECT * FROM ${empTable} WHERE 1 = 1`;

    if (empLocation) {
      query = query + ` AND office_location_city LIKE '${empLocation}%'`;
    } 

    if (empExperience) {
      query = query + ` AND total_work_experience_years = ${empExperience}`;
    }                                          

    if (empRole) {
      query = query + ` AND role LIKE '%${empRole}%'`;
    }   
    
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the employee. ${err}`);
      }
      console.log(rows);
      console.log(empSkills);
      if (empSkills && rows) {
            let records = rows.filter((row)=>{
                                        let found = false;
                                        empSkills.forEach((empSkill) => {
                                            if (row.primary_skills.toLowerCase().indexOf(empSkill.toLowerCase()) >= 0) {
                                              found = true;
                                              return;    
                                            }
                                        }) 
                                        return found;                                                                      
                                      })
          return res.status(200).send({employees: records});
      }
      console.log("employees: ", rows);
      return res.status(200).send({employees: rows});
    });
};

const create = (req, res) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if(file.fieldname === "resume"){
        cb(null,'public/uploads/resume');
       }else if(file.fieldname === "profile_picture"){
        cb(null,'public/uploads/profile_picture');
       }
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}-${path.extname(file.originalname)}`);
    }
  });

  var upload = multer({ storage : storage});
  
  var multipleUpload = upload.fields([{name:'resume'}, {name: 'profile_picture'}])
  
  multipleUpload(req,res,function(err) {
    if(req.files) {
      console.log(req);
      newEmployee = req.body;
      newEmployee['resume'] = req.files['resume'][0]['filename'];
      newEmployee['profile_picture'] = req.files['profile_picture'][0]['filename'];
      // console.log(req.file.filename);
      console.log(newEmployee);
      const insertQuery = `INSERT INTO ${empTable} set ?`;
      sql.query(insertQuery, [newEmployee], (err, succeess) => {
        if (err) {
          console.log("error: ", err);
          res.status(500).send(`Problem while Adding the employee. ${err}`);
        } else {
          newEmployee.emp_id = succeess.insertId;
          res.status(200).send(newEmployee);
        }
      });
    }else{
      res.status(500).send(`Problem while Uploading files.`);
    }
  });
  
};

const update = (req, res) => {
  const { emp_id } = req.params;
  if(!emp_id){
    res.status(500).send('Employee ID is Required');
  }
  const updatedEmployee = req.body;
  const updateQuery = `UPDATE ${empTable} set ? WHERE emp_id = ?`;
  sql.query(updateQuery,[updatedEmployee, emp_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${empTable} with ID: ${emp_id}. ${err}`);
    } else {
      if (succeess.affectedRows == 1){
        console.log(`${empTable} UPDATED:` , succeess)
        updatedEmployee.emp_id = parseInt(emp_id);
        res.status(200).send(updatedEmployee);
      } else {
        res.status(404).send(`Record not found with Employee Details ID: ${emp_id}`);
      }
    }
  });
};

const erase = (req, res) => {
  const { emp_id } = req.params;
  if(!emp_id){
    res.status(500).send('Employee ID is Required');
  }
  //const updatedEmployee = req.body;
  const deleteQuery = `DELETE FROM ${empTable} WHERE emp_id = ?`;
  sql.query(deleteQuery,[emp_id], (err, succeess) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${empTable} with ID: ${emp_id}. ${err}`);
    } else {
      //console.log("DEL: ", succeess)
      if (succeess.affectedRows == 1){
        console.log(`${empTable} DELETED:` , succeess)
        //updatedEmployee.emp_id = parseInt(emp_id);
        res.status(200).send(`Deleted row from ${empTable} with ID: ${emp_id}`);
      } else {
        res.status(404).send(`Record not found with Employee Details ID: ${emp_id}`);
      }
    }
  });
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  erase,
  search
}