const sql = require("../lib/db.js");
const hiringCommentsTable = "hiring_comments";
const path = require('path');
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');
const APP_EMAIL = require("../lib/email.js");
const utils = require("../lib/utils.js");

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
    const siteDefaults = utils.getAppConstants();
    sql.query(query, (err, rows) => {
        if (err) {
            console.log("error: ", err);
            return res.status(500).send(`There was a problem adding the hiring comment. ${err}`);
        }
        const comment_query = `SELECT 
                            u.user_id,
                            u.first_name,
                            u.last_name,
                            u.email,
                            CASE 
                                WHEN hc.commented_by = h.created_by THEN h.manager_id 
                                ELSE h.created_by 
                            END AS recipient_user_id
                        FROM 
                            hiring_comments hc
                        JOIN 
                            hirings h ON hc.hiring_id = h.hiring_id
                        JOIN 
                            users u ON u.user_id = (
                                CASE 
                                    WHEN hc.commented_by = h.created_by THEN h.manager_id 
                                    ELSE h.created_by 
                                END
                            )
                        WHERE 
                            hc.hiring_comment_id = ${rows.insertId}`;
        sql.query(comment_query, (err, results) => {
            if (err) {
                console.error('Error retrieving recipient details:', err);
                return;
            }

            if (results.length > 0) {
                const recipient = results[0];
                const recipientEmail = recipient.email;
                const subject = `New comment added by ${recipient.first_name} ${recipient.last_name}`;

                const values = {
                    commentText: comment,
                    commenterName: `${req.user.first_name} ${req.user.last_name}`,
                    userName: `${recipient.first_name} ${recipient.last_name}`,
                    siteName: siteDefaults.siteName,
                };

                APP_EMAIL.sendEmail('newComment', values, subject, recipientEmail, (err, emailResult) => {
                    if (err) {
                        console.error('Error sending email:', err);
                    } else {
                        console.log('Email sent successfully:', emailResult);
                    }
                });
            } else {
                console.error('No recipient found for the provided comment.');
            }
        });
        return res.status(200).send({message: "Comment added successfully", user: req.user});
    });
}

module.exports = {
    findByHiringId,
    create,
};