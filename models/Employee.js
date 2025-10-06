const sql = require("../lib/db.js");
const empTable = "employee_details";
const empCapabilityAreasTable = "employee_capability_areas";
const multer = require('multer');
const path = require('path');
const userACL = require('../lib/userACL.js');
const empProjAlloc = "employee_project_allocations";

const findAll = (req, res) => { 
  if (!userACL.hasEmployeeReadAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const managerEmail = req.query?.manager_email;
  const userRole = req.user.role;
  const userLineOfBusinessId = req.user.line_of_business_id;
 
  let query = `SELECT e.*, sl.name as service_line_name, lb.name as line_of_business_name 
               FROM ${empTable} e 
               LEFT JOIN service_line sl ON e.service_line_id = sl.service_line_id
               LEFT JOIN line_of_business lb ON e.line_of_business_id = lb.line_of_business_id`;
  let whereConditions = [];
  let queryParams = [];
  
  if (managerEmail) {
    whereConditions.push(`e.manager_email = ?`);
    queryParams.push(managerEmail);
  }
  
  if (userRole !== 'administrator' && userLineOfBusinessId) {
    if (userLineOfBusinessId == 1) {
      whereConditions.push(`e.line_of_business_id = ?`);
      queryParams.push(userLineOfBusinessId);
    } else if (userRole === 'off_shore_lead' || userRole === 'manager') {
      query += ` INNER JOIN offshore_lead_service_lines olsl ON e.service_line_id = olsl.service_line_id`;
      whereConditions.push(`olsl.offshore_lead_id = ?`);
      queryParams.push(req.user.user_id);
    } else {
      whereConditions.push(`e.line_of_business_id = ?`);
      queryParams.push(userLineOfBusinessId);
    }
  }
  
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  sql.query(query, queryParams, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting employees. ${err}`);
    }
    return res.status(200).send({employees: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const empDetailsId = req.params.emp_id;
  if (empDetailsId) {
    const query = `SELECT e.*, sl.name as service_line_name, lb.name as line_of_business_name 
                   FROM ${empTable} e 
                   LEFT JOIN service_line sl ON e.service_line_id = sl.service_line_id
                   LEFT JOIN line_of_business lb ON e.line_of_business_id = lb.line_of_business_id
                   WHERE e.emp_id = '${empDetailsId}'`;
    sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the employee. ${err}`);
      }
      
      if (rows.length > 0) {
        // Fetch capability areas for this employee
        const capabilityQuery = `SELECT ca.capability_area_id, ca.name as capability_area_name 
                                FROM ${empCapabilityAreasTable} eca 
                                JOIN capability_area ca ON eca.capability_area_id = ca.capability_area_id 
                                WHERE eca.emp_id = ?`;
        sql.query(capabilityQuery, [empDetailsId], (capErr, capRows) => {
          if (capErr) {
            console.log("error fetching capability areas: ", capErr);
            return res.status(500).send(`There was a problem finding the employee capability areas. ${capErr}`);
          }
          
          rows[0].capability_areas = capRows;
          return res.status(200).send({employees: rows, user: req.user});
        });
      } else {
        return res.status(200).send({employees: rows, user: req.user});
      }
    });
  } else {
    return res.status(500).send("Employee ID required");
  }
};


const search = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
    const empSkills = req.query.skill;
    const empLocation =  req.query.location ?? null;
    const empExperience = req.query.exp ?? null;
    const empRole = req.query.role ?? null;
    const empAvailability = req.query.availability ?? null;
    const userRole = req.user.role;
    const userLineOfBusinessId = req.user.line_of_business_id;
    
    let query = `SELECT emp.*, 
                  COALESCE(SUM(ea.hours_per_day) * 5, 0) AS alc_per_week,
                  GROUP_CONCAT(DISTINCT ca.name) AS capability_areas
                  FROM ${empTable} emp
                  LEFT JOIN employee_project_allocations ea
                  ON ea.emp_id = emp.emp_id 
                  AND CURDATE() BETWEEN ea.start_date AND ea.end_date
                  LEFT JOIN ${empCapabilityAreasTable} eca
                  ON eca.emp_id = emp.emp_id
                  LEFT JOIN capability_area ca
                  ON ca.capability_area_id = eca.capability_area_id`;
    
    // Filter by line of business or service lines if user is not administrator
    if (userRole !== 'administrator' && userLineOfBusinessId) {
      if (userLineOfBusinessId == 1) {
        query += ` WHERE emp.line_of_business_id = ${userLineOfBusinessId}`;
      } else if (userRole === 'off_shore_lead' || userRole === 'manager') {
        query += ` INNER JOIN offshore_lead_service_lines olsl ON emp.service_line_id = olsl.service_line_id`;
        query += ` WHERE olsl.offshore_lead_id = ${req.user.user_id}`;
      } else {
        query += ` WHERE emp.line_of_business_id = ${userLineOfBusinessId}`;
      }
    } else {
      query += ` WHERE 1 = 1`;
    }

    if (empLocation) {
      query = query + ` AND emp.office_location_city LIKE '${empLocation}%'`;
    } 

    if (empExperience) {
      query = query + ` AND emp.total_work_experience_years <= ${empExperience}`;
    }                                          

    if (empRole) {
      query = query + ` AND emp.role LIKE '%${empRole}%'`;
    }   

    query = query + ` GROUP BY emp.emp_id`;
    
    if (empAvailability) {
      query = query + ` HAVING (40 - COALESCE(alc_per_week, 0)) >= ${empAvailability}`;
    }
  
    sql.query(query, (err, rows) => { 
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the employee. ${err}`);
      }
      if (empSkills && rows) {
            let records = rows.filter((row)=>{
                                        let found = false;
                                        empSkills.forEach((empSkill) => {
                                             // Check capability_areas
                                             if (row.capability_areas) {
                                               let capabilityAreaList = row.capability_areas.split(',');
                                               capabilityAreaList.forEach((capabilityArea)=> {
                                                    if (capabilityArea.trim().toLowerCase() === empSkill.trim().toLowerCase()) {
                                                      found = true;
                                                      return found;
                                                    }
                                               })
                                             }
                                             // Check primary_skills
                                             if (row.primary_skills) {
                                               let primarySkillList = row.primary_skills.split(',');
                                               primarySkillList.forEach((skill)=> {
                                                    if (skill.trim().toLowerCase() === empSkill.trim().toLowerCase()) {
                                                      found = true;
                                                      return found;
                                                    }
                                               })
                                             }
                                             // Check secondary_skills
                                             if (row.secondary_skills) {
                                               let secondarySkillList = row.secondary_skills.split(',');
                                               secondarySkillList.forEach((skill)=> {
                                                    if (skill.trim().toLowerCase() === empSkill.trim().toLowerCase()) {
                                                      found = true;
                                                      return found;
                                                    }
                                               })
                                             }
                                        }) 
                                        return found;                                                                      
                                      })
          return res.status(200).send({employees: records, user: req.user});
      }
      return res.status(200).send({employees: rows, user: req.user});
    });
};

const create = (req, res) => {
  if (!userACL.hasEmployeeCreateAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const fileNameSuffix = Date.now();
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if(file.fieldname === "resume"){
        cb(null,'public/uploads/resume');
       }else if(file.fieldname === "profile_picture"){
        cb(null,'public/uploads/profile_picture');
       }
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${fileNameSuffix}${path.extname(file.originalname)}`);
    }
  });

  var upload = multer({ storage : storage});
  
  var multipleUpload = upload.fields([{name:'resume'}, {name: 'profile_picture'}])
  
  multipleUpload(req,res,function(err) {
    if(req.files) {
      newEmployee = req.body;
      newEmployee['resume'] = req.files['resume'][0]['filename'];
      newEmployee['profile_picture'] = req.files['profile_picture'][0]['filename'];
      
      // Extract capability area IDs from the request
      let capabilityAreaIds = [];
      if (req.body.capability_area_ids) {
        try {
          // Try to parse as JSON first (from UI)
          capabilityAreaIds = JSON.parse(req.body.capability_area_ids);
        } catch (e) {
          // If not JSON, treat as array or single value
          capabilityAreaIds = Array.isArray(req.body.capability_area_ids) ? 
            req.body.capability_area_ids : [req.body.capability_area_ids];
        }
      }
      
      // Remove capability_area_ids from newEmployee as it's not a column in employee_details
      delete newEmployee.capability_area_ids;
      
      console.log(newEmployee);
      const insertQuery = `INSERT INTO ${empTable} set ?`;
      sql.query(insertQuery, [newEmployee], (err, success) => {
        if (err) {
          console.log("error: ", err);
          res.status(500).send(`Problem while Adding the employee. ${err}`);
        } else {
          const empId = success.insertId;
          newEmployee.emp_id = empId;
          
          // Insert capability areas if provided
          if (capabilityAreaIds.length > 0) {
            const capabilityAreasData = capabilityAreaIds.map(caId => ({
              emp_id: empId,
              capability_area_id: caId
            }));
            
            const capabilityAreasQuery = `INSERT INTO ${empCapabilityAreasTable} SET ?`;
            let completedInserts = 0;
            let hasError = false;
            
            capabilityAreasData.forEach(data => {
              sql.query(capabilityAreasQuery, [data], (capErr) => {
                if (capErr) {
                  console.log("Error inserting capability area:", capErr);
                  if (!hasError) {
                    hasError = true;
                    res.status(500).send(`Problem while Adding employee capability areas. ${capErr}`);
                  }
                } else {
                  completedInserts++;
                  if (completedInserts === capabilityAreasData.length && !hasError) {
                    const response = {newEmployee, user: req.user};
                    res.status(200).send(response);
                  }
                }
              });
            });
          } else {
            const response = {newEmployee, user: req.user};
            res.status(200).send(response);
          }
        }
      });
    }else{
      res.status(500).send(`Problem while Uploading files.`);
    }
  });
  
};

const update = (req, res) => {
  if (!userACL.hasEmployeeUpdateAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({ error: true, message: msg });
  }

  const { emp_id } = req.params;
  if (!emp_id) {
    res.status(500).send({ error: true, message:'Employee ID is Required'});
  }
  const fileNameSuffix = Date.now();
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "resume") {
        cb(null, "public/uploads/resume");
      } else if (file.fieldname === "profile_picture") {
        cb(null, 'public/uploads/profile_picture');
      }
    },
    filename: (req, file, cb) => {
      if (file.fieldname === "resume") {
        //Use the exisitng file-name if it has one
        if (req.body.resume_file_name && ![null, 'null'].includes(req.body.resume_file_name)) {
          cb(null, req.body.resume_file_name);
        } else {
          cb(null, `${file.fieldname}-${fileNameSuffix}${path.extname(file.originalname)}`);
        }
      } else if (file.fieldname === "profile_picture") {
        //Use the exisitng file-name if it has one
        if (req.body.profile_pic_file_name && ![null, 'null'].includes(req.body.profile_pic_file_name)) {
          cb(null, req.body.profile_pic_file_name);
        } else {
          cb(null, `${file.fieldname}-${fileNameSuffix}${path.extname(file.originalname)}`);
        }
      }
    }
  });

  const upload = multer({ storage: storage });
  const fileUploader = upload.fields([{ name: 'resume' }, { name: 'profile_picture' }]);

  fileUploader(req, res, (err)=> {
    const updatedEmployee = req.body;

    if (req.files?.resume) updatedEmployee['resume'] = req.files.resume[0]['filename'];
    if (req.files?.profile_picture)  updatedEmployee['profile_picture'] = req.files['profile_picture'][0]['filename'];
     
    delete(updatedEmployee.resume_file_name);
    delete(updatedEmployee.profile_pic_file_name);

    // Extract capability area IDs from the request
    let capabilityAreaIds = [];
    if (req.body.capability_area_ids) {
      try {
        // Try to parse as JSON first (from UI)
        capabilityAreaIds = JSON.parse(req.body.capability_area_ids);
      } catch (e) {
        // If not JSON, treat as array or single value
        capabilityAreaIds = Array.isArray(req.body.capability_area_ids) ? 
          req.body.capability_area_ids : [req.body.capability_area_ids];
      }
    }
    
    // Remove capability_area_ids from updatedEmployee as it's not a column in employee_details
    delete updatedEmployee.capability_area_ids;

    const updateQuery = `UPDATE ${empTable} set ? WHERE emp_id = ?`;
    sql.query(updateQuery, [updatedEmployee, emp_id], (err, success) => {
      if (err) {
        console.log("error: ", err);
        res.status(500).send(`Problem while Updating the ${empTable} with ID: ${emp_id}. ${err}`);
      } else {
        if (success.affectedRows == 1) {
          updatedEmployee.emp_id = parseInt(emp_id);
          
          // Update capability areas
          // First, delete existing capability areas
          const deleteCapabilityQuery = `DELETE FROM ${empCapabilityAreasTable} WHERE emp_id = ?`;
          sql.query(deleteCapabilityQuery, [emp_id], (delErr) => {
            if (delErr) {
              console.log("Error deleting existing capability areas:", delErr);
              res.status(500).send(`Problem while updating employee capability areas. ${delErr}`);
              return;
            }
            
            // Insert new capability areas if provided
            if (capabilityAreaIds.length > 0) {
              const capabilityAreasData = capabilityAreaIds.map(caId => ({
                emp_id: parseInt(emp_id),
                capability_area_id: caId
              }));
              
              const capabilityAreasQuery = `INSERT INTO ${empCapabilityAreasTable} SET ?`;
              let completedInserts = 0;
              let hasError = false;
              
              capabilityAreasData.forEach(data => {
                sql.query(capabilityAreasQuery, [data], (capErr) => {
                  if (capErr) {
                    console.log("Error inserting capability area:", capErr);
                    if (!hasError) {
                      hasError = true;
                      res.status(500).send(`Problem while updating employee capability areas. ${capErr}`);
                    }
                  } else {
                    completedInserts++;
                    if (completedInserts === capabilityAreasData.length && !hasError) {
                      const response = { updatedEmployee, user: req.user }
                      res.status(200).send(response);
                    }
                  }
                });
              });
            } else {
              const response = { updatedEmployee, user: req.user }
              res.status(200).send(response);
            }
          });
        } else {
          res.status(404).send({error: true, message:`Record not found with Employee Details ID: ${emp_id}`});
        }
      }
    });
  });

};

const erase = (req, res) => {
  if (!userACL.hasEmployeeDeleteAccess(req.user.role) && !userACL.hasOffshoreLeadEmployeeAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

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
        //updatedEmployee.emp_id = parseInt(emp_id);
        res.status(200).send({msg:`Deleted row from ${empTable} with ID: ${emp_id}`, user: req.user});
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