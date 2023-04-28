const sql = require("../lib/db.js");
const categoryTable = "categories";
const empTable = "employee_details";

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

module.exports = {
    getCategories,
    getTechnologies
}