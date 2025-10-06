const sql = require("../lib/db.js");
const ai = require("../lib/ai.js");
const categoryTable = "categories";
const queryTable = "user_queries";
const empTable = "employee_details";
const APP_EMAIL = require("../lib/email.js");

const getCategories = (req, res) => {
  let query =`SELECT * FROM ${categoryTable}`;
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting categories. ${err}`);
    }
    return res.status(200).send({categories: rows});
  });
};

const getServiceLinesForHome = (req, res) => {
  const user = req.user;
  let query = `SELECT sl.*, lb.name as line_of_business_name FROM service_line sl 
               LEFT JOIN line_of_business lb ON sl.line_of_business_id = lb.line_of_business_id`;
  let whereConditions = [];
  let params = [];
  if (user.role === 'administrator') {
    // Administrator sees all service lines
    query += ` ORDER BY sl.name`;
  } else if (user.role === 'project_manager' || user.role === 'lobadmin') {
    
    whereConditions.push(`sl.line_of_business_id = ?`);
    params.push(user.line_of_business_id);
    query += ` WHERE ${whereConditions.join(' AND ')} ORDER BY sl.name`;
  } else if (user.role === 'off_shore_lead' || user.role === 'manager') {
    query = `SELECT sl.*, lb.name as line_of_business_name FROM service_line sl 
             LEFT JOIN line_of_business lb ON sl.line_of_business_id = lb.line_of_business_id
             INNER JOIN offshore_lead_service_lines olsl ON sl.service_line_id = olsl.service_line_id
             WHERE olsl.offshore_lead_id = ? 
             ORDER BY sl.name`;
    params.push(user.user_id);
  } else {
    // Default fallback - show all service lines
    query += ` ORDER BY sl.name`;
  }

  sql.query(query, params, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting service lines. ${err}`);
    }
    return res.status(200).send({serviceLines: rows});
  });
};

const getTechnologies = (req, res) => {
  // Get capability areas
  let capabilityQuery = `SELECT DISTINCT ca.name as capability_area_name 
                        FROM ${empTable} emp
                        LEFT JOIN employee_capability_areas eca ON eca.emp_id = emp.emp_id
                        LEFT JOIN capability_area ca ON ca.capability_area_id = eca.capability_area_id
                        WHERE ca.name IS NOT NULL`;
  
  // Get primary and secondary skills
  let skillsQuery = `SELECT secondary_skills, primary_skills FROM ${empTable}`;
  
  const empSkills = req.query.skill ? (Array.isArray(req.query.skill) ? req.query.skill : req.query.skill.split(',')) : null;
  let allTechnologies = [];
  
  // Execute capability areas query
  sql.query(capabilityQuery, (err, capabilityRows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting technologies. ${err}`);
    }
    
    let capabilityRecords = capabilityRows;
    if (empSkills && capabilityRows) {
      capabilityRecords = capabilityRows.filter((row)=>{
        let found = false;
        empSkills.forEach((empSkill) => {
          if (row.capability_area_name) {
            if (row.capability_area_name.trim().toLowerCase().includes(empSkill.trim().toLowerCase())) {
              found = true;
              return found;
            }
          }
        }) 
        return found;                                                                      
      })
    }
    
    // Add capability areas to all technologies
    capabilityRecords.forEach((record) => {
      if (record.capability_area_name) {
        allTechnologies.push(record.capability_area_name);
      }
    });
    
    // Execute skills query
    sql.query(skillsQuery, (err, skillsRows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting technologies. ${err}`);
      }
      
      let skillsRecords = skillsRows;
      if (empSkills && skillsRows) {
        skillsRecords = skillsRows.filter((row)=>{
          let found = false;
          empSkills.forEach((empSkill) => {
            if (row.primary_skills) {
              let primarySkillList = row.primary_skills.split(',');
              primarySkillList.forEach((skill)=> {
                if (skill.trim().toLowerCase().includes(empSkill.trim().toLowerCase())) {
                  found = true;
                  return found;
                }
              })
            }
          }) 
          return found;                                                                      
        })
      }
      
      // Add secondary skills and primary skills to all technologies
      skillsRecords.forEach((record) => {
        if (record.secondary_skills) {
          allTechnologies.push(record.secondary_skills);
        }
        if (record.primary_skills) {
          allTechnologies.push(record.primary_skills);
        }
      });
      
      // Process and clean up the technologies
      allTechnologies = allTechnologies.join(',').split(',').map((skill) => {
        return skill.trim().replace(/(^\w|\s\w)/g, m => m.toUpperCase());         
      }).filter((skill) => { 
        return skill !== '' && skill !== null; 
      });
      
      // Remove duplicates
      allTechnologies = Array.from(new Set(allTechnologies));
      
      return res.status(200).send({technologies: allTechnologies});
    });
  });
};

const sendEmail = (req, res) => {
  const {to, subject, text } = req.body || {to: 'rvanamala@vaco.com', subject: 'Test Subject', text: 'Some Random Text'};
  const mailData = {
      from: APP_EMAIL.MAIL_ID,
      to: to,
      subject: subject,
      text: text,
      html: '<b>Hey there! </b><br> This is our first message sent with Nodemailer<br/>',
  };

  APP_EMAIL.transporter.sendMail(mailData, (error, info) => {
      if (error) {
          return console.log(error);
      }
      res.status(200).send({ message: "Mail send", message_id: info.messageId });
  });
}

const getChatResp =  (req, res) => {
      const message = req.query.chatMessage;
       
        ai.getAIGeneratedQuery(message).then((query) => {
          sql.query(query, (err, rows) => {
            if (err) {
              console.log("error: ", err);
              return res.status(500).send(`There was a problem getting query. ${err}`);
            }
            return res.status(200).send({query:query, records:rows});
          });
        //return res.status(200).send(result);
      })
}

const runUserQuery = (req, res) => {
  const query = req.query.query;

  try {
      sql.query(query, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem in executing the query. ${err}`);
      }
        return res.status(200).send({records: rows});
      });
  }
  catch(err) {
    return res.status(500).send(`There was a problem in executing the query. ${err}`);
  }
};

const getUserQueries = (req, res) => {
  const activeUser = req.user; 
  const query = `SELECT * FROM ${queryTable} WHERE user_id = ${activeUser?.user_id}`;

  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem in executing the query. ${err}`);
    }
   
    return res.status(200).send({records: rows});
    
});
};

const saveUserQuery = (req, res) => {
  const activeUser = req.user; 
  let userQuery = req.body;
  userQuery.user_id = activeUser?.user_id;

  const insertQuery = `INSERT INTO ${queryTable} set ?`;

  try {
    sql.query(insertQuery, [userQuery] ,(err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem in inserting the User Query. ${err}`);
      }
    
      return res.status(200).send({records: rows});
      
    });
  }
  catch(err) {
      return res.status(500).send(`There was a problem in inserting the User Query. ${err}`);
  }
};


module.exports = {
    getCategories,
    getServiceLinesForHome,
    getTechnologies,
    sendEmail,
    getChatResp,
    runUserQuery,
    saveUserQuery,
    getUserQueries
}