const sql = require("../lib/db.js");
const empProjUtili = "employee_project_utilization";
const userACL = require('../lib/userACL.js');

const forecastHours = (req, res) => {
    if (!userACL.hasUtilizationReadAccess(req.user.role)) {
      const msg = `User role '${req.user.role}' does not have privileges on this action`;
      return res.status(404).send({error: true, message: msg});
    }
    let finalResult = [];
    try {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        let filterStartDate = startDate.getFullYear() + "-" + (startDate.getMonth()+1) + "-" + startDate.getDate();
        console.log(filterStartDate);
        const futureMonth = today.getMonth() + 2;
        const endDate = new Date(today.getFullYear(), futureMonth + 1, 0);
        let filterEndDate = endDate.getFullYear() + "-" + (endDate.getMonth()+1) + "-" + endDate.getDate();

        let finalDates = [{
            'startDate' : filterStartDate,
            'endDate' : filterEndDate
        }];

        const utiliQry = `SELECT GROUP_CONCAT(forecast_hours_per_week) as forecast,GROUP_CONCAT(week_starting) as weeksStarting, emp_id, project_id FROM employee_project_utilization where week_starting between '${filterStartDate}' AND '${filterEndDate}' GROUP BY emp_id ORDER BY project_id ASC`;
        
        sql.query(utiliQry, (err, utilizations) => {
            if (err) {
                console.log("ProjectUtilization:: Err getting rows: ", err);
                return res.status(500).send(`Problem getting records. ${err}`);
            }
            utilizations.forEach((utili, idx) => {
                const empQry = `SELECT * FROM employee_details WHERE emp_id = '${utili.emp_id}'`;
                sql.query(empQry, (err, empRows) => {
                    if (err) {
                        console.log("ProjectUtilization:: Err getting Employee details: ", err);
                        return res.status(500).send(`Problem getting records. ${err}`);
                    } else {
                        utili.empDetails = empRows[0];
                        const prjQry = `SELECT * FROM project_details WHERE project_id = '${utili.project_id}'`;
                        sql.query(prjQry, (err, prjRows) => {
                            if (err) {
                                console.log("ProjectUtilization:: Err getting Project details:", err);
                                return res.status(500).send(`Problem getting records. ${err}`);
                            } else {
                                utili.projectDetails = prjRows[0];
                                const clientQry = `SELECT * FROM clients WHERE client_id = '${prjRows[0].client_id}'`;
                                sql.query(clientQry, (err, clientRows) => {
                                    if (err) {
                                        console.log("ProjectUtilization:: Err getting Project details:", err);
                                        return res.status(500).send(`Problem getting records. ${err}`);
                                    } else {
                                        utili.clientDetails = clientRows[0]; 
                                        finalResult.push(utili);
                                
                                        if (utilizations.length === (idx + 1)) {
                                            return res.status(200).send({ empForecastResults: finalResult, finalDates: finalDates });
                                        }
                                    }
                                })
                                
                            }
                        })
                    }
                })
            })
        });
    } catch (err) {
        console.log("ProjectUtilization:: Unkown Err:", err);
    }
  };

  const availableHours = (req, res) => {
    if (!userACL.hasUtilizationReadAccess(req.user.role)) {
      const msg = `User role '${req.user.role}' does not have privileges on this action`;
      return res.status(404).send({error: true, message: msg});
    }
    let finalResult = [];
    try {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        let filterStartDate = startDate.getFullYear() + "-" + (startDate.getMonth()+1) + "-" + startDate.getDate();
        console.log(filterStartDate);
        const futureMonth = today.getMonth() + 2;
        const endDate = new Date(today.getFullYear(), futureMonth + 1, 0);
        let filterEndDate = endDate.getFullYear() + "-" + (endDate.getMonth()+1) + "-" + endDate.getDate();

        let finalDates = [{
            'startDate' : filterStartDate,
            'endDate' : filterEndDate
        }];

        const utiliQry = `SELECT GROUP_CONCAT(week_starting) as weeksStarting, GROUP_CONCAT(proj_hours_per_week) as proj_hours_per_week,GROUP_CONCAT(allc_work_hours_per_week) as allc_work_hours_per_week,GROUP_CONCAT(pto_hours_per_week) as pto_hours_per_week, emp_id, project_id FROM employee_project_utilization where week_starting between '${filterStartDate}' AND '${filterEndDate}' GROUP BY emp_id ORDER BY project_id ASC`;
        
        sql.query(utiliQry, (err, utilizations) => {
            if (err) {
                console.log("ProjectUtilization:: Err getting rows: ", err);
                return res.status(500).send(`Problem getting records. ${err}`);
            }
            utilizations.forEach((utili, idx) => {
                const empQry = `SELECT * FROM employee_details WHERE emp_id = '${utili.emp_id}'`;
                sql.query(empQry, (err, empRows) => {
                    if (err) {
                        console.log("ProjectUtilization:: Err getting Employee details: ", err);
                        return res.status(500).send(`Problem getting records. ${err}`);
                    } else {
                        utili.empDetails = empRows[0];
                        const prjQry = `SELECT * FROM project_details WHERE project_id = '${utili.project_id}'`;
                        sql.query(prjQry, (err, prjRows) => {
                            if (err) {
                                console.log("ProjectUtilization:: Err getting Project details:", err);
                                return res.status(500).send(`Problem getting records. ${err}`);
                            } else {
                                utili.projectDetails = prjRows[0];
                                const clientQry = `SELECT * FROM clients WHERE client_id = '${prjRows[0].client_id}'`;
                                sql.query(clientQry, (err, clientRows) => {
                                    if (err) {
                                        console.log("ProjectUtilization:: Err getting Project details:", err);
                                        return res.status(500).send(`Problem getting records. ${err}`);
                                    } else {
                                        utili.clientDetails = clientRows[0]; 
                                        finalResult.push(utili);
                                
                                        if (utilizations.length === (idx + 1)) {
                                            return res.status(200).send({ empForecastResults: finalResult, finalDates: finalDates });
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            })
        });
    } catch (err) {
        console.log("ProjectUtilization:: Unkown Err:", err);
    }
  };

  module.exports = {
    forecastHours,
    availableHours
  }