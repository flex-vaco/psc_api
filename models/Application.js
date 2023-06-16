const sql = require("../lib/db.js");
const categoryTable = "categories";
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

module.exports = {
    getCategories,
    getTechnologies,
    sendEmail
}