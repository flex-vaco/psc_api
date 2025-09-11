const sql = require("../lib/db.js");
const empProjUtili = "employee_project_utilization";
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');

const forecastHours = (req, res) => {
    if (!userACL.hasUtilizationReadAccess(req.user.role)) {
      const msg = `User role '${req.user.role}' does not have privileges on this action`;
      return res.status(404).send({error: true, message: msg});
    }
    let finalResult = [];
    try {
        const filterStartDate = req.body.startDateFilter;
        const filterEndDate = req.body.endDateFilter;

        let finalDates = [{
            'startDate' : filterStartDate,
            'endDate' : filterEndDate
        }];

        let utiliQry = '';

        if(req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
            const producerClientIds = `SELECT client_id from producer_clients WHERE producer_id = ${req.user.user_id}`;
            //const producerClientId = req.user.client_id || null;
            utiliQry = `SELECT GROUP_CONCAT(forecast_hours_per_week) as forecast,GROUP_CONCAT(week_starting) as weeksStarting, emp_id, ${empProjUtili}.project_id 
                FROM ${empProjUtili} 
                JOIN project_details on ${empProjUtili}.project_id = project_details.project_id
                WHERE project_details.client_id IN (${producerClientIds})
                AND week_starting between '${filterStartDate}' AND '${filterEndDate}'
                GROUP BY emp_id ORDER BY ${empProjUtili}.project_id ASC`;
          } else {
            utiliQry = `SELECT GROUP_CONCAT(forecast_hours_per_week) as forecast,GROUP_CONCAT(week_starting) as weeksStarting, emp_id, project_id 
                FROM ${empProjUtili}  
                WHERE week_starting between '${filterStartDate}' AND '${filterEndDate}' 
                GROUP BY emp_id ORDER BY project_id ASC`;
          }

        sql.query(utiliQry, (err, utilizations) => {
            if (utilizations.length == 0) {
                console.log('empty');
                return res.status(200).send({ empForecastResults: finalResult, finalDates: finalDates });
            }
            if (err) {
                console.log("ProjectUtilization:: Err getting rows: ", err);
                return res.status(500).send(`Problem getting records. ${err}`);
            }
            let recCount = 0;
            utilizations.forEach((utili) => {
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
                                        recCount = recCount+1;
                                        if (recCount === utilizations.length) {
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
        const filterStartDate = req.body.startDateFilter;
        const filterEndDate = req.body.endDateFilter;

        let finalDates = [{
            'startDate' : filterStartDate,
            'endDate' : filterEndDate
        }];

    let utiliQry = '';
    if(req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
        const producerClientIds = `SELECT client_id from producer_clients WHERE producer_id = ${req.user.user_id}`;
        utiliQry = `SELECT GROUP_CONCAT(week_starting) as weeksStarting, GROUP_CONCAT(proj_hours_per_week) 
                as proj_hours_per_week,GROUP_CONCAT(allc_work_hours_per_week) 
                as allc_work_hours_per_week,GROUP_CONCAT(pto_hours_per_week) 
                as pto_hours_per_week, emp_id, ${empProjUtili}.project_id 
            FROM ${empProjUtili}  
            JOIN project_details on ${empProjUtili}.project_id = project_details.project_id
            WHERE project_details.client_id IN (${producerClientIds})
            AND week_starting between '${filterStartDate}' AND '${filterEndDate}'
            GROUP BY emp_id ORDER BY ${empProjUtili}.project_id ASC`;
      } else {
        utiliQry = `SELECT GROUP_CONCAT(week_starting) as weeksStarting, GROUP_CONCAT(proj_hours_per_week) 
                as proj_hours_per_week,GROUP_CONCAT(allc_work_hours_per_week) 
                as allc_work_hours_per_week,GROUP_CONCAT(pto_hours_per_week) 
                as pto_hours_per_week, emp_id, project_id 
            FROM ${empProjUtili}  
            WHERE week_starting between '${filterStartDate}' AND '${filterEndDate}'
            GROUP BY emp_id ORDER BY project_id ASC`;
      }
        sql.query(utiliQry, (err, utilizations) => {
            if (utilizations.length == 0) {
                console.log('empty');
                return res.status(200).send({ empForecastResults: finalResult, finalDates: finalDates });
            }
            if (err) {
                console.log("ProjectUtilization:: Err getting rows: ", err);
                return res.status(500).send(`Problem getting records. ${err}`);
            }
            let recCount = 0;
            utilizations.forEach((utili) => {
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
                                        recCount = recCount+1
                                        if (recCount === utilizations.length) {
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

  const utilization = (req, res) => {
    if (!userACL.hasUtilizationReadAccess(req.user.role)) {
      const msg = `User role '${req.user.role}' does not have privileges on this action`;
      return res.status(404).send({error: true, message: msg});
    } 
    let finalResult = [];
    try {
        const filterStartDate = req.body.startDateFilter;
        const filterEndDate = req.body.endDateFilter;

        let finalDates = [{
            'startDate' : filterStartDate,
            'endDate' : filterEndDate
        }];

        // Get week dates between start and end date
        const getMondays = (startDate, endDate) => {
            const mondays = [];
            startDate = new Date(startDate.getTime());
            startDate.setDate(startDate.getDate() + (8 - startDate.getDay()) % 7);
            
            while (startDate < endDate) {
                var monday = new Date(startDate.getTime());
                mondays.push(monday.toISOString().split('T')[0]);
                startDate.setDate(startDate.getDate() + 7);
            }
            return mondays;
        };

        const weekDates = getMondays(new Date(filterStartDate), new Date(filterEndDate));

        let utiliQry = '';
        if(req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
            const producerClientIds = `SELECT client_id from producer_clients WHERE producer_id = ${req.user.user_id}`;
            utiliQry = `SELECT 
                Employee,
                Customer,
                DATE_FORMAT(Date, '%Y-%u') as week_key,
                SUM(Duration) as total_duration
                FROM imported_timesheet_entries 
                WHERE Date BETWEEN '${filterStartDate}' AND '${filterEndDate}'
                AND line_of_business_id IN (SELECT line_of_business_id FROM line_of_business WHERE client_id IN (${producerClientIds}))
                GROUP BY Employee, Customer, DATE_FORMAT(Date, '%Y-%u')
                ORDER BY Employee, Customer, week_key`;
        } else {
            utiliQry = `SELECT 
                Employee,
                Customer,
                DATE_FORMAT(Date, '%Y-%u') as week_key,
                SUM(Duration) as total_duration
                FROM imported_timesheet_entries 
                WHERE Date BETWEEN '${filterStartDate}' AND '${filterEndDate}'
                GROUP BY Employee, Customer, DATE_FORMAT(Date, '%Y-%u')
                ORDER BY Employee, Customer, week_key`;
        }

        sql.query(utiliQry, (err, utilizations) => {
            if (utilizations.length == 0) {
                console.log('empty');
                return res.status(200).send({ empUtilizationResults: finalResult, finalDates: finalDates, weekDates: weekDates });
            }
            if (err) {
                console.log("Utilization:: Err getting rows: ", err);
                return res.status(500).send(`Problem getting records. ${err}`);
            }

            // Group by employee and customer
            const groupedData = {};
            utilizations.forEach((util) => {
                const key = `${util.Employee}_${util.Customer}`;
                if (!groupedData[key]) {
                    groupedData[key] = {
                        Employee: util.Employee,
                        Customer: util.Customer,
                        weeks: {}
                    };
                }
                groupedData[key].weeks[util.week_key] = util.total_duration;
            });

            // Convert to final result format
            Object.values(groupedData).forEach((group) => {
                let weekData = [];
                weekDates.forEach((weekDate) => {
                    const weekKey = new Date(weekDate).toISOString().split('T')[0];
                    const weekYear = new Date(weekDate).getFullYear();
                    const weekNum = Math.ceil((new Date(weekDate) - new Date(weekYear, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
                    const weekKeyFormatted = `${weekYear}-${weekNum.toString().padStart(2, '0')}`;
                    
                    if (group.weeks[weekKeyFormatted]) {
                        const hours = group.weeks[weekKeyFormatted];
                        const percentage = ((hours / 40) * 100).toFixed(1);
                        weekData.push({
                            hours: hours,
                            percentage: percentage
                        });
                    } else {
                        weekData.push({
                            hours: 0,
                            percentage: 0
                        });
                    }
                });

                finalResult.push({
                    Employee: group.Employee,
                    Customer: group.Customer,
                    weekData: weekData
                });
            });

            return res.status(200).send({ 
                empUtilizationResults: finalResult, 
                finalDates: finalDates, 
                weekDates: weekDates 
            });
        });
    } catch (err) {
        console.log("Utilization:: Unknown Err:", err);
        return res.status(500).send(`Problem getting records. ${err}`);
    }
  };

  module.exports = {
    forecastHours,
    availableHours,
    utilization
  }