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
  let query =`SELECT group_concat(primary_skills) as tech_skills FROM ${empTable}`;
  console.log("error: ", query);
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting technologies. ${err}`);
    }
    let techSkills = [];
    if (rows) {
      techSkills = Array.from(new Set(rows[0].tech_skills.split(',')));
      console.log(techSkills);
    }
    return res.status(200).send({technologies: techSkills});
  });
};

module.exports = {
    getCategories,
    getTechnologies
}