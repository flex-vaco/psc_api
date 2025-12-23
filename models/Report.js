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
                ite.Employee,
                ite.Customer,
                DATE_FORMAT(ite.Date, '%Y-%u') as week_key,
                SUM(ite.Duration) as total_duration
                FROM imported_timesheet_entries ite
                WHERE ite.Date BETWEEN '${filterStartDate}' AND '${filterEndDate}'
                AND ite.line_of_business_id IN (SELECT line_of_business_id FROM line_of_business WHERE client_id IN (${producerClientIds}))
                GROUP BY ite.Employee, ite.Customer, DATE_FORMAT(ite.Date, '%Y-%u')
                ORDER BY ite.Employee, ite.Customer, week_key`;
        } else {
            utiliQry = `SELECT 
                ite.Employee,
                ite.Customer,
                DATE_FORMAT(ite.Date, '%Y-%u') as week_key,
                SUM(ite.Duration) as total_duration
                FROM imported_timesheet_entries ite
                WHERE ite.Date BETWEEN '${filterStartDate}' AND '${filterEndDate}'
                GROUP BY ite.Employee, ite.Customer, DATE_FORMAT(ite.Date, '%Y-%u')
                ORDER BY ite.Employee, ite.Customer, week_key`;
        }

        // Query to get allocation hours per Employee-Customer-Week
        // Matching chain:
        // 1. imported_timesheet_entries.Employee (VARCHAR string like "John Doe")
        // 2. → JOIN employee_details using: TRIM(CONCAT(first_name, ' ', last_name)) = TRIM(Employee)
        // 3. → This gives us employee_details.emp_id
        // 4. → JOIN employee_project_allocations using: emp_id = emp_id
        // 5. → Also match project: project_details.project_name = Customer, then project_id = project_id
        // Note: This is a name-based match which can fail if names don't match exactly (spacing, case, etc.)
        let allocationQry = '';
        if(req.user.role == APP_CONSTANTS.USER_ROLES.PRODUCER) {
            const producerClientIds = `SELECT client_id from producer_clients WHERE producer_id = ${req.user.user_id}`;
            allocationQry = `SELECT 
                ite.Employee,
                ite.Customer,
                ite.week_key,
                ed.emp_id,
                COALESCE(SUM(epa.hours_per_day), 0) as total_hours_per_day
                FROM (
                    SELECT DISTINCT 
                        Employee,
                        Customer,
                        DATE_FORMAT(Date, '%Y-%u') as week_key,
                        Date as sample_date
                    FROM imported_timesheet_entries
                    WHERE Date BETWEEN '${filterStartDate}' AND '${filterEndDate}'
                    AND line_of_business_id IN (SELECT line_of_business_id FROM line_of_business WHERE client_id IN (${producerClientIds}))
                ) ite
                LEFT JOIN employee_details ed ON TRIM(CONCAT(COALESCE(ed.first_name, ''), ' ', COALESCE(ed.last_name, ''))) = TRIM(ite.Employee)
                LEFT JOIN project_details pd ON TRIM(pd.project_name) = TRIM(ite.Customer)
                LEFT JOIN employee_project_allocations epa ON epa.emp_id = ed.emp_id 
                    AND epa.project_id = pd.project_id
                    AND DATE_SUB(ite.sample_date, INTERVAL WEEKDAY(ite.sample_date) DAY) <= epa.end_date
                    AND DATE_ADD(DATE_SUB(ite.sample_date, INTERVAL WEEKDAY(ite.sample_date) DAY), INTERVAL 6 DAY) >= epa.start_date
                WHERE ed.emp_id IS NOT NULL AND pd.project_id IS NOT NULL
                GROUP BY ite.Employee, ite.Customer, ite.week_key, ed.emp_id`;
        } else {
            allocationQry = `SELECT 
                ite.Employee,
                ite.Customer,
                ite.week_key,
                ed.emp_id,
                COALESCE(SUM(epa.hours_per_day), 0) as total_hours_per_day
                FROM (
                    SELECT DISTINCT 
                        Employee,
                        Customer,
                        DATE_FORMAT(Date, '%Y-%u') as week_key,
                        Date as sample_date
                    FROM imported_timesheet_entries
                    WHERE Date BETWEEN '${filterStartDate}' AND '${filterEndDate}'
                ) ite
                LEFT JOIN employee_details ed ON TRIM(CONCAT(COALESCE(ed.first_name, ''), ' ', COALESCE(ed.last_name, ''))) = TRIM(ite.Employee)
                LEFT JOIN project_details pd ON TRIM(pd.project_name) = TRIM(ite.Customer)
                LEFT JOIN employee_project_allocations epa ON epa.emp_id = ed.emp_id 
                    AND epa.project_id = pd.project_id
                    AND DATE_SUB(ite.sample_date, INTERVAL WEEKDAY(ite.sample_date) DAY) <= epa.end_date
                    AND DATE_ADD(DATE_SUB(ite.sample_date, INTERVAL WEEKDAY(ite.sample_date) DAY), INTERVAL 6 DAY) >= epa.start_date
                WHERE ed.emp_id IS NOT NULL AND pd.project_id IS NOT NULL
                GROUP BY ite.Employee, ite.Customer, ite.week_key, ed.emp_id`;
        }

        sql.query(utiliQry, (err, utilizations) => {
            if (err) {
                console.log("Utilization:: Err getting rows: ", err);
                return res.status(500).send(`Problem getting records. ${err}`);
            }

            if (utilizations.length == 0) {
                console.log('empty');
                return res.status(200).send({ empUtilizationResults: finalResult, finalDates: finalDates, weekDates: weekDates });
            }

            // Get allocation hours
            sql.query(allocationQry, (err, allocations) => {
                if (err) {
                    console.log("Utilization:: Err getting allocation rows: ", err);
                    return res.status(500).send(`Problem getting allocation records. ${err}`);
                }

                if (allocations.length > 0) {
                    console.log("Utilization:: Sample allocation:", JSON.stringify(allocations[0]));
                    console.log("Utilization:: Sample allocation details - Employee:", allocations[0].Employee, ", emp_id:", allocations[0].emp_id, ", Customer:", allocations[0].Customer, ", week_key:", allocations[0].week_key);
                } else {
                    console.log("Utilization:: WARNING: No allocations found. This could mean:");
                    console.log("  - Employee names don't match between imported_timesheet_entries and employee_details");
                    console.log("  - Customer names don't match between imported_timesheet_entries and project_details");
                    console.log("  - No allocations exist for the date range");
                    console.log("Utilization:: Sample timesheet entry Employee names:", utilizations.slice(0, 3).map(u => u.Employee));
                }

                // Create a map of allocation hours by Employee-Customer-Week
                const allocationMap = {};
                allocations.forEach((alloc) => {
                    const key = `${alloc.Employee}_${alloc.Customer}_${alloc.week_key}`;
                    allocationMap[key] = parseFloat(alloc.total_hours_per_day) || 0;
                    console.log(`Utilization:: Allocation map key: ${key}, emp_id: ${alloc.emp_id}, hours_per_day: ${allocationMap[key]}`);
                });

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
                    const allocationKey = `${util.Employee}_${util.Customer}_${util.week_key}`;
                    const allocationHours = allocationMap[allocationKey] || 0;
                    groupedData[key].weeks[util.week_key] = {
                        total_duration: util.total_duration,
                        total_hours_per_day: allocationHours
                    };
                });

                // Helper function to calculate MySQL week key (DATE_FORMAT(date, '%Y-%u'))
                // %u: Week (00-53), where Sunday is the first day of the week
                const getMySQLWeekKey = (dateStr) => {
                    const date = new Date(dateStr);
                    const year = date.getFullYear();
                    const jan1 = new Date(year, 0, 1);
                    const daysDiff = Math.floor((date - jan1) / (1000 * 60 * 60 * 24));
                    const jan1Day = jan1.getDay(); // 0=Sunday, 1=Monday, etc.
                    // MySQL %u: Week starts on Sunday (0), week 1 is first week with a Sunday
                    // Calculate week number: days from Jan 1 + offset for first week
                    const weekNum = Math.floor((daysDiff + jan1Day) / 7) + 1;
                    return `${year}-${weekNum.toString().padStart(2, '0')}`;
                };

                // Convert to final result format
                Object.values(groupedData).forEach((group) => {
                    let weekData = [];
                    weekDates.forEach((weekDate) => {
                        // Use MySQL week key format to match the SQL query
                        const weekKeyFormatted = getMySQLWeekKey(weekDate);
                        
                        if (group.weeks[weekKeyFormatted]) {
                            const hours = group.weeks[weekKeyFormatted].total_duration;
                            const totalHoursPerDay = group.weeks[weekKeyFormatted].total_hours_per_day;
                            // Convert hours_per_day to weekly hours (multiply by 5 for working days)
                            const weeklyAllocatedHours = totalHoursPerDay * 5;
                            const percentage = weeklyAllocatedHours > 0 ? ((hours / weeklyAllocatedHours) * 100).toFixed(1) : '0.0';
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