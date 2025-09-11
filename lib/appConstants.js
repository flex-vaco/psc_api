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
          TIMESHEET_STATUS[`${s.status_name}`] = s.status_name;
        }
      })
      console.log("TIMESHEET STATUSES LOADED AS CONSTANTS")
    });
  } catch (err) {
    console.error("ERROR-loadStatuses:: ", err)
  }
};

loadStatuses();

const loadUserRoles = () => {
  try {
    const userRolesQry = "SELECT * from user_roles";
    sql.query(userRolesQry, (err, rows) => {
      if (err) {
        console.error("ERROR-loadUserRoles:: ", err)
      }
      rows.forEach(r => {
          const k = r.role?.toUpperCase();
          USER_ROLES[k] = r.role;
      })
      console.log("USER-ROLES LOADED AS CONSTANTS", USER_ROLES)
    });
  } catch (err) {
    console.error("ERROR-loadUserRoles:: ", err)
  }
};

loadUserRoles();
const reloadUserRoles = async () => {
  try {
    loadUserRoles();
    return { success: true, message: "User roles reloaded successfully" };
  } catch (error) {
    return { success: false, message: "Failed to reload user roles", error };
  }
};

const ACCESS_LEVELS = {
  READ: "read",
  WRITE: "write",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
};



module.exports = {
  USER_ROLES,
  ACCESS_LEVELS,
  TIMESHEET_STATUS,
  reloadUserRoles
}