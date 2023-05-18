const sql = require("../lib/db.js");
const TIMESHEET_STATUS = {}
const USER_ROLES = {}

const loadStatuses = () => {
  try {
    const statusesQry = "SELECT * from statuses";
    sql.query(statusesQry, (err, rows) => {
      if (err) {
        console.error("ERROR-loadStatuses:: ", err)
      }
      rows.map(s => {
        if (s.context == "TIMESHEET") {
          TIMESHEET_STATUS[s.status_name] = {}
          TIMESHEET_STATUS[`${s.status_name}`]['ID'] = s.status_id;
          TIMESHEET_STATUS[`${s.status_name}`]['NAME'] = s.status_name;
          TIMESHEET_STATUS[`${s.status_name}`]['DESC'] = s.description;
        }
      })
      console.log("STATUSES LOADED AS CONSTANTS")
    });
  } catch (err) {
    console.error("ERROR-loadStatuses:: ", err)
  }
};

loadStatuses();

const loadUserRoles = () => {
  try {
    const statusesQry = "SELECT * from user_roles";
    sql.query(statusesQry, (err, rows) => {
      if (err) {
        console.error("ERROR-loadUserRoles:: ", err)
      }
      rows.forEach(r => {
          const k = r.role?.toUpperCase();
          USER_ROLES[k] = r.role;
      })
      console.log("USER-ROLES LOADED AS CONSTANTS")
    });
  } catch (err) {
    console.error("ERROR-loadUserRoles:: ", err)
  }
};

loadUserRoles();

const ACCESS_LEVELS = {
  READ: "read",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
};



module.exports = {
  USER_ROLES,
  ACCESS_LEVELS,
  TIMESHEET_STATUS
}