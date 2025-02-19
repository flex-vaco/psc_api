const sql = require("../lib/db.js");
const hiringCommentsTable = "hiring_comments";
const path = require('path');
const userACL = require('../lib/userACL.js');

const findByHiringId = (req, res) => {

    const hiringId = req.params.hiring_id;
  
    if (hiringId) {
        const query = `SELECT hc.*, u.first_name, u.last_name FROM ${hiringCommentsTable} hc
                        JOIN 
                        users u ON hc.commented_by = u.user_id
                        WHERE 
                        hiring_id = ${hiringId} order by hc.hiring_comment_id desc`;
        sql.query(query, (err, rows) => {
            if (err) {
                console.log("error: ", err);
                return res.status(500).send(`There was a problem finding the hiring comments. ${err}`);
            }
            return res.status(200).send({comments: rows, user: req.user});
        });
    } else {
        return res.status(500).send("Hiring ID required");
    }
}

const create = (req, res) => {
    const hiringId = req.body.hiring_id;
    const comment = req.body.comment;
    const userId = req.user.user_id;
    const query = `INSERT INTO ${hiringCommentsTable} (hiring_id, comment, commented_by) VALUES ('${hiringId}', '${comment}', '${userId}')`;
    sql.query(query, (err, rows) => {
        if (err) {
            console.log("error: ", err);
            return res.status(500).send(`There was a problem adding the hiring comment. ${err}`);
        }
        return res.status(200).send({message: "Comment added successfully", user: req.user});
    });
}

module.exports = {
    findByHiringId,
    create,
};