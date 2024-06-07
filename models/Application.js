const sql = require("../lib/db.js");
const ai = require("../lib/ai.js");
const categoryTable = "categories";
const queryTable = "user_queries";
const empTable = "employee_details";
const APP_EMAIL = require("../lib/email.js");

const getCategories = (req, res) => {
  let query =`SELECT * FROM ${categoryTable}`;
  console.log("error: ", query);
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting categories. ${err}`);
    }
    return res.status(200).send({categories: rows});
  });
};

const getTechnologies = (req, res) => {
  let query =`SELECT secondary_skills, primary_skills FROM ${empTable}`;
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting technologies. ${err}`);
    }
    const empSkills = req.query.skill;
    let records = rows;
    if (empSkills && rows) {
          records = rows.filter((row)=>{
                                    let found = false;
                                    empSkills.forEach((empSkill) => {
                                        let primarySkillList = row.primary_skills.split(',');
                                        primarySkillList.filter((skill)=> {
                                          if (skill.trim().toLowerCase() === empSkill.trim().toLowerCase()) {
                                            found = true;
                                            return found;
                                          }
                                        })
                                    }) 
                                    return found;                                                                      
                                  })
    }

        records = records.map((record) => { return record.secondary_skills;});
        records = records.join(',').split(',').map((skill) => {
                          return skill.trim().replace(/(^\w|\s\w)/g, m => m.toUpperCase());         
                          }).filter((skill) => { return skill !== '' });
        records = Array.from(new Set(records));
        
        return res.status(200).send({technologies: records});
    
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
          console.log(query);
          sql.query(query, (err, rows) => {
            if (err) {
              console.log("error: ", err);
              return res.status(500).send(`There was a problem getting query. ${err}`);
            }
            console.log(rows);
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
    getTechnologies,
    sendEmail,
    getChatResp,
    runUserQuery,
    saveUserQuery,
    getUserQueries
}