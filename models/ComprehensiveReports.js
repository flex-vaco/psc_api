const sql = require("../lib/db.js");
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');

const getDateRange = (preset) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  switch (preset) {
    case 'next_8_weeks':
      const next8Weeks = new Date(startOfDay);
      next8Weeks.setDate(next8Weeks.getDate() + 56);
      return { startDate: today.toISOString().split('T')[0], endDate: next8Weeks.toISOString().split('T')[0] };
    
    case 'last_7_days':
      const last7Days = new Date(startOfDay);
      last7Days.setDate(last7Days.getDate() - 7);
      return { startDate: last7Days.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
    
    case 'last_month':
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: lastMonth.toISOString().split('T')[0], endDate: endLastMonth.toISOString().split('T')[0] };
    
    case 'year_to_date':
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return { startDate: startOfYear.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
    
    case 'last_quarter':
      const quarter = Math.floor(today.getMonth() / 3);
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      const endOfQuarter = new Date(today.getFullYear(), quarter * 3 + 3, 0);
      return { startDate: startOfQuarter.toISOString().split('T')[0], endDate: endOfQuarter.toISOString().split('T')[0] };
    
    default:
      return { startDate: today.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
  }
};

const getWorkingDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  
  while (start <= end) {
    const dayOfWeek = start.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++;
    }
    start.setDate(start.getDate() + 1);
  }
  
  return workingDays;
};

const getFilterOptions = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const query = `SELECT line_of_business_id, name FROM line_of_business ORDER BY name`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting filter options. ${err}`);
    }
    
    const verticals = [
      { id: 'all', name: 'All' },
      ...rows.map(row => ({ id: row.line_of_business_id, name: row.name }))
    ];
    
    getServiceLinesForUser(req.user, (serviceLines) => {
    const datePresets = [
      { id: 'next_8_weeks', name: 'Next 8 Weeks' },
      { id: 'last_7_days', name: 'Last 7 Days' },
      { id: 'last_month', name: 'Last Month' },
      { id: 'year_to_date', name: 'Year to Date' },
      { id: 'last_quarter', name: 'Last Quarter' }
    ];
    
    return res.status(200).send({
      verticals: verticals,
        serviceLines: serviceLines,
      datePresets: datePresets,
      user: req.user
    });
    });
  });
};

const getServiceLinesForUser = (user, callback) => {
  let query;
  let params = [];
  
  if (user.role === 'administrator') {
    query = `SELECT sl.service_line_id, sl.name, sl.line_of_business_id, lb.name as line_of_business_name 
             FROM service_line sl 
             LEFT JOIN line_of_business lb ON sl.line_of_business_id = lb.line_of_business_id 
             ORDER BY lb.name, sl.name`;
  } else if (user.role === 'off_shore_lead' || user.role === 'manager') {
    query = `SELECT sl.service_line_id, sl.name, sl.line_of_business_id, lb.name as line_of_business_name 
             FROM service_line sl 
             LEFT JOIN line_of_business lb ON sl.line_of_business_id = lb.line_of_business_id
             INNER JOIN offshore_lead_service_lines olsl ON sl.service_line_id = olsl.service_line_id
             WHERE olsl.offshore_lead_id = ? 
             ORDER BY lb.name, sl.name`;
    params = [user.user_id];
  } else {
    query = `SELECT sl.service_line_id, sl.name, sl.line_of_business_id, lb.name as line_of_business_name 
             FROM service_line sl 
             LEFT JOIN line_of_business lb ON sl.line_of_business_id = lb.line_of_business_id 
             WHERE sl.line_of_business_id = ? 
             ORDER BY sl.name`;
    params = [user.line_of_business_id];
  }
  
  sql.query(query, params, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      callback([]);
    } else {
      const serviceLines = [
        { id: 'all', name: 'All', line_of_business_id: 'all' },
        ...rows.map(row => ({ 
          id: row.service_line_id, 
          name: row.name, 
          line_of_business_id: row.line_of_business_id,
          line_of_business_name: row.line_of_business_name
        }))
      ];
      callback(serviceLines);
    }
  });
};

const getDashboardMetrics = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const { 
    vertical, 
    serviceLine,
    datePreset, 
    startDate, 
    endDate,
    metricsVertical,
    metricsServiceLine,
    metricsDatePreset,
    metricsStartDate,
    metricsEndDate,
    utilizationVertical,
    utilizationServiceLine,
    utilizationDatePreset,
    utilizationStartDate,
    utilizationEndDate,
    allocationVertical,
    allocationServiceLine,
    allocationDatePreset,
    allocationStartDate,
    allocationEndDate
  } = req.query;
  
  const getDateRangeForSection = (datePreset, startDate, endDate, defaultWeeks = 8) => {
    const validDatePresets = ['next_8_weeks', 'last_7_days', 'last_month', 'year_to_date', 'last_quarter'];
    
    if (datePreset && validDatePresets.includes(datePreset)) {
      return getDateRange(datePreset);
    } else if (startDate && endDate) {
      return { startDate, endDate };
    } else {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + (defaultWeeks * 7));
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: futureDate.toISOString().split('T')[0]
      };
    }
  };

  const buildWhereConditions = (vertical, serviceLine, userRole, userLineOfBusinessId) => {
    let whereConditions = [];
    let params = [];
    
    if (vertical && vertical !== 'all') {
      whereConditions.push('e.line_of_business_id = ?');
      params.push(vertical);
    } else if (userRole !== 'administrator') {
      whereConditions.push('e.line_of_business_id = ?');
      params.push(userLineOfBusinessId);
    }
    
    if (serviceLine && serviceLine !== 'all') {
      whereConditions.push('e.service_line_id = ?');
      params.push(serviceLine);
    }
    
    return {
      whereClause: whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '',
      params
    };
  };

  const metricsDateRange = getDateRangeForSection(metricsDatePreset || 'next_8_weeks', metricsStartDate, metricsEndDate, 8);
  const utilizationDateRange = getDateRangeForSection(utilizationDatePreset || 'last_month', utilizationStartDate, utilizationEndDate, 8);
  const allocationDateRange = getDateRangeForSection(allocationDatePreset || 'next_8_weeks', allocationStartDate, allocationEndDate, 8);

  const metricsFilters = buildWhereConditions(metricsVertical, metricsServiceLine, req.user.role, req.user.line_of_business_id);
  const utilizationFilters = buildWhereConditions(utilizationVertical, utilizationServiceLine, req.user.role, req.user.line_of_business_id);
  const allocationFilters = buildWhereConditions(allocationVertical, allocationServiceLine, req.user.role, req.user.line_of_business_id);
  
  const activeHCQuery = `
    SELECT COUNT(DISTINCT e.emp_id) as active_hc
    FROM employee_details e
    INNER JOIN employee_project_allocations epa ON e.emp_id = epa.emp_id
    ${metricsFilters.whereClause}
    AND epa.start_date <= ? AND epa.end_date >= ?
  `;
  
  const utilizationQuery = `
    SELECT 
      COALESCE(SUM(t.hours_per_day), 0) as total_billed_hours,
      COUNT(DISTINCT e.emp_id) as total_employees,
      ${getWorkingDays(utilizationDateRange.startDate, utilizationDateRange.endDate)} as working_days
    FROM employee_details e
    LEFT JOIN timesheets t ON e.emp_id = t.emp_id 
      AND t.timesheet_date BETWEEN ? AND ?
      AND t.timesheet_status IN ('APPROVED', 'ACCEPTED')
    LEFT JOIN employee_project_allocations epa ON e.emp_id = epa.emp_id
      AND CURDATE() BETWEEN epa.start_date AND epa.end_date
    ${utilizationFilters.whereClause}
  `;
  
  const allocationForecastQuery = `
    SELECT 
      COALESCE(SUM(epa.hours_per_day * 5), 0) as total_forecasted_hours,
      COUNT(DISTINCT e.emp_id) as total_employees
    FROM employee_details e
    LEFT JOIN employee_project_allocations epa ON e.emp_id = epa.emp_id
      AND epa.start_date <= ? 
      AND epa.end_date >= ?
    ${allocationFilters.whereClause}
  `;
  
  const activeHCParams = [...metricsFilters.params, metricsDateRange.endDate, metricsDateRange.startDate];
  const utilizationParams = [utilizationDateRange.startDate, utilizationDateRange.endDate, ...utilizationFilters.params];
  const forecastParams = [allocationDateRange.endDate, allocationDateRange.startDate, ...allocationFilters.params];
  
  Promise.all([
    new Promise((resolve, reject) => {
      sql.query(activeHCQuery, activeHCParams, (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    }),
    new Promise((resolve, reject) => {
      sql.query(utilizationQuery, utilizationParams, (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    }),
    new Promise((resolve, reject) => {
      sql.query(allocationForecastQuery, forecastParams, (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    })
  ])
  .then(([activeHC, utilization, forecast]) => {
    const totalAvailableHours = utilization.total_employees * utilization.working_days * 8;
    const utilizationPercentage = totalAvailableHours > 0 ? 
      ((utilization.total_billed_hours / totalAvailableHours) * 100).toFixed(1) : 0;
    
    const totalForecastAvailableHours = forecast.total_employees * 8 * 5 * 8;
    const allocationForecastPercentage = totalForecastAvailableHours > 0 ? 
      ((forecast.total_forecasted_hours / totalForecastAvailableHours) * 100).toFixed(1) : 0;
    
    return res.status(200).send({
      metrics: {
        activeHC: activeHC.active_hc,
        utilizationPercentage: parseFloat(utilizationPercentage),
        allocationForecastPercentage: parseFloat(allocationForecastPercentage)
      },
      dateRange: metricsDateRange,
      user: req.user
    });
  })
  .catch(err => {
    console.log("error: ", err);
    return res.status(500).send(`There was a problem getting dashboard metrics. ${err}`);
  });
};

const getUtilizationTrends = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const { vertical, serviceLine, datePreset, startDate, endDate, groupBy = 'month' } = req.body;
  
  let dateRange;
  if (datePreset && datePreset !== 'custom') {
    dateRange = getDateRange(datePreset);
  } else if (startDate && endDate) {
    dateRange = { startDate, endDate };
  } else {
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    lastMonth.setDate(1);
    
    const endOfLastMonth = new Date();
    endOfLastMonth.setDate(0);
    
    dateRange = {
      startDate: lastMonth.toISOString().split('T')[0],
      endDate: endOfLastMonth.toISOString().split('T')[0]
    };
  }
  
  const { startDate: filterStart, endDate: filterEnd } = dateRange;
  
  let whereConditions = [];
  let params = [];
  
  if (vertical && vertical !== 'all') {
    whereConditions.push('e.line_of_business_id = ?');
    params.push(vertical);
  } else if (req.user.role !== 'administrator') {
    whereConditions.push('e.line_of_business_id = ?');
    params.push(req.user.line_of_business_id);
  }
  
  if (serviceLine && serviceLine !== 'all') {
    whereConditions.push('e.service_line_id = ?');
    params.push(serviceLine);
  }
  
  const shouldGroupByServiceLine = (req.user.role === 'lobadmin' || req.user.role === 'project_manager' || req.user.role === 'leadership' || req.user.role === 'off_shore_lead' || req.user.role === 'manager' || req.user.role === 'producer') && 
                                   (!serviceLine || serviceLine === 'all');
  
  if (shouldGroupByServiceLine) {
    whereConditions.push('e.service_line_id IS NOT NULL');
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  const groupByClause = groupBy === 'week' ? 
    'DATE_FORMAT(ite.Date, "%Y-%u")' : 
    'DATE_FORMAT(ite.Date, "%Y-%m")';
  
  const isOffshoreLeadWithSpecificServiceLine = (req.user.role === 'off_shore_lead' || req.user.role === 'manager') && serviceLine && serviceLine !== 'all';
  
  let serviceLineWhereClause = '';
  let serviceLineParams = [];
  let serviceLineJoinClause = '';
  if (shouldGroupByServiceLine) {
    if (req.user.role === 'off_shore_lead' || req.user.role === 'manager') {
      serviceLineJoinClause = 'INNER JOIN offshore_lead_service_lines olsl ON sl.service_line_id = olsl.service_line_id';
      serviceLineWhereClause = 'WHERE olsl.offshore_lead_id = ?';
      serviceLineParams = [req.user.user_id];
    } else if (vertical && vertical !== 'all') {
      serviceLineWhereClause = 'WHERE sl.line_of_business_id = ?';
      serviceLineParams = [vertical];
    } else if (req.user.role !== 'administrator') {
      serviceLineWhereClause = 'WHERE sl.line_of_business_id = ?';
      serviceLineParams = [req.user.line_of_business_id];
    }
  }
  
  let utilizationTrendsQuery;
  if (shouldGroupByServiceLine) {
    
    utilizationTrendsQuery = `
      SELECT 
        sl.name as vertical_name,
        ${groupByClause} as period,
        COALESCE(SUM(ite.duration), 0) as total_billed_hours,
        COUNT(DISTINCT e.emp_id) as total_employees,
        ${getWorkingDays(filterStart, filterEnd)} as working_days
      FROM service_line sl
      ${serviceLineJoinClause}
      LEFT JOIN employee_details e ON sl.service_line_id = e.service_line_id
        AND e.line_of_business_id = sl.line_of_business_id
      LEFT JOIN imported_timesheet_entries ite ON CONCAT(e.first_name, ' ', e.last_name) = ite.Employee 
        AND ite.Date BETWEEN ? AND ?
        AND e.emp_id IS NOT NULL
      ${serviceLineWhereClause}
      GROUP BY sl.service_line_id, sl.name, ${groupByClause}
      ORDER BY sl.name, period
    `;
  } else if (isOffshoreLeadWithSpecificServiceLine) {
    utilizationTrendsQuery = `
      SELECT 
        COALESCE(sl.name, 'No Service Line') as vertical_name,
        ${groupByClause} as period,
        COALESCE(SUM(ite.duration), 0) as total_billed_hours,
        COUNT(DISTINCT e.emp_id) as total_employees,
        ${getWorkingDays(filterStart, filterEnd)} as working_days
      FROM employee_details e
      LEFT JOIN service_line sl ON e.service_line_id = sl.service_line_id
      LEFT JOIN imported_timesheet_entries ite ON CONCAT(e.first_name, ' ', e.last_name) = ite.Employee 
        AND ite.Date BETWEEN ? AND ?
      ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY period
    `;
  } else {
    utilizationTrendsQuery = `
    SELECT 
      lb.name as vertical_name,
      ${groupByClause} as period,
      COALESCE(SUM(ite.duration), 0) as total_billed_hours,
      COUNT(DISTINCT e.emp_id) as total_employees,
      ${getWorkingDays(filterStart, filterEnd)} as working_days
    FROM employee_details e
    LEFT JOIN line_of_business lb ON e.line_of_business_id = lb.line_of_business_id
    LEFT JOIN imported_timesheet_entries ite ON CONCAT(e.first_name, ' ', e.last_name) = ite.Employee 
      AND ite.Date BETWEEN ? AND ?
    ${whereClause}
    GROUP BY lb.line_of_business_id, lb.name, ${groupByClause}
    ORDER BY lb.name, period
  `;
  }

  
  let queryParams;
  if (shouldGroupByServiceLine) {
    queryParams = [filterStart, filterEnd, ...serviceLineParams];
  } else {
    queryParams = [filterStart, filterEnd, ...params];
  }
  
  sql.query(utilizationTrendsQuery, queryParams, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting utilization trends. ${err}`);
    }
    
    
    const chartData = {};
    const periods = new Set();
    
    rows.forEach(row => {
      const key = row.vertical_name || 'Overall';
      if (!chartData[key]) {
        chartData[key] = [];
      }
      
      const totalAvailableHours = row.total_employees * row.working_days * 8;
      const utilizationPercentage = totalAvailableHours > 0 ? 
        ((row.total_billed_hours / totalAvailableHours) * 100) : 0;
      
      chartData[key].push({
        period: row.period,
        utilization: parseFloat(utilizationPercentage.toFixed(1)),
        billedHours: row.total_billed_hours,
        availableHours: totalAvailableHours
      });
      
      periods.add(row.period);
    });
    
    const chartDataArray = Object.keys(chartData).map(vertical => ({
      name: vertical,
      data: chartData[vertical]
    }));
    
    return res.status(200).send({
      chartData: chartDataArray,
      periods: Array.from(periods).sort(),
      dateRange: dateRange,
      groupBy: groupBy,
      user: req.user
    });
  });
};

const getAllocationForecast = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const { vertical, serviceLine, datePreset, startDate, endDate } = req.body;
  
  let forecastStartDate, forecastEndDate;
  if (datePreset && datePreset !== 'custom') {
    const dateRange = getDateRange(datePreset);
    forecastStartDate = new Date(dateRange.startDate);
    forecastEndDate = new Date(dateRange.endDate);
  } else if (startDate && endDate) {
    forecastStartDate = new Date(startDate);
    forecastEndDate = new Date(endDate);
  } else {
    forecastStartDate = new Date();
    forecastEndDate = new Date();
  forecastEndDate.setDate(forecastEndDate.getDate() + 56);
  }
  
  let whereConditions = [];
  let params = [];
  
  if (vertical && vertical !== 'all') {
    whereConditions.push('e.line_of_business_id = ?');
    params.push(vertical);
  } else if (req.user.role !== 'administrator') {
    whereConditions.push('e.line_of_business_id = ?');
    params.push(req.user.line_of_business_id);
  }
  
  if (serviceLine && serviceLine !== 'all') {
    whereConditions.push('e.service_line_id = ?');
    params.push(serviceLine);
  }
  
  const shouldGroupByServiceLine = (req.user.role === 'lobadmin' || req.user.role === 'project_manager' || req.user.role === 'leadership' || req.user.role === 'off_shore_lead' || req.user.role === 'manager' || req.user.role === 'producer') && 
                                   (!serviceLine || serviceLine === 'all');
  
  if (shouldGroupByServiceLine) {
    whereConditions.push('e.service_line_id IS NOT NULL');
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  const weeks = [];
  const totalDays = Math.ceil((forecastEndDate.getTime() - forecastStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.ceil(totalDays / 7);
  
  for (let i = 0; i < totalWeeks; i++) {
    const weekStart = new Date(forecastStartDate);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4);
    
    weeks.push({
      weekNumber: i + 1,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      label: weekStart.toISOString().split('T')[0]
    });
  }
  
  const isOffshoreLeadWithSpecificServiceLine = (req.user.role === 'off_shore_lead' || req.user.role === 'manager') && serviceLine && serviceLine !== 'all';
  
  let serviceLineWhereClause2 = '';
  let serviceLineParams2 = [];
  let serviceLineJoinClause2 = '';
  if (shouldGroupByServiceLine) {
    if (req.user.role === 'off_shore_lead' || req.user.role === 'manager') {
      serviceLineJoinClause2 = 'INNER JOIN offshore_lead_service_lines olsl ON sl.service_line_id = olsl.service_line_id';
      serviceLineWhereClause2 = 'WHERE olsl.offshore_lead_id = ?';
      serviceLineParams2 = [req.user.user_id];
    } else if (vertical && vertical !== 'all') {
      serviceLineWhereClause2 = 'WHERE sl.line_of_business_id = ?';
      serviceLineParams2 = [vertical];
    } else if (req.user.role !== 'administrator') {
      serviceLineWhereClause2 = 'WHERE sl.line_of_business_id = ?';
      serviceLineParams2 = [req.user.line_of_business_id];
    }
  }
  
  let allocationForecastQuery;
  if (shouldGroupByServiceLine) {
    allocationForecastQuery = `
      SELECT 
        sl.name as vertical_name,
        epa.start_date,
        epa.end_date,
        epa.hours_per_day,
        COUNT(DISTINCT e.emp_id) as total_employees,
        CASE 
          WHEN epa.start_date = epa.end_date THEN 1
          ELSE (
            DATEDIFF(epa.end_date, epa.start_date) + 1
            - (DATEDIFF(epa.end_date, epa.start_date) DIV 7) * 2 
            - CASE WHEN WEEKDAY(epa.start_date) = 6 THEN 1 ELSE 0 END 
            - CASE WHEN WEEKDAY(epa.end_date) = 5 THEN 1 ELSE 0 END 
          )
        END as working_days
      FROM service_line sl
      ${serviceLineJoinClause2}
      LEFT JOIN employee_details e ON sl.service_line_id = e.service_line_id
        AND e.line_of_business_id = sl.line_of_business_id
      LEFT JOIN employee_project_allocations epa ON e.emp_id = epa.emp_id
        AND epa.start_date <= ? 
        AND epa.end_date >= ?
        AND e.emp_id IS NOT NULL
      ${serviceLineWhereClause2}
      GROUP BY sl.service_line_id, sl.name, epa.start_date, epa.end_date, epa.hours_per_day
      ORDER BY sl.name, epa.start_date
    `;
  } else if (isOffshoreLeadWithSpecificServiceLine) {
    allocationForecastQuery = `
      SELECT 
        COALESCE(sl.name, 'No Service Line') as vertical_name,
        epa.start_date,
        epa.end_date,
        epa.hours_per_day,
        COUNT(DISTINCT e.emp_id) as total_employees,
        CASE 
          WHEN epa.start_date = epa.end_date THEN 1
          ELSE (
            DATEDIFF(epa.end_date, epa.start_date) + 1
            - (DATEDIFF(epa.end_date, epa.start_date) DIV 7) * 2 
            - CASE WHEN WEEKDAY(epa.start_date) = 6 THEN 1 ELSE 0 END 
            - CASE WHEN WEEKDAY(epa.end_date) = 5 THEN 1 ELSE 0 END 
          )
        END as working_days
      FROM employee_details e
      LEFT JOIN service_line sl ON e.service_line_id = sl.service_line_id
      LEFT JOIN employee_project_allocations epa ON e.emp_id = epa.emp_id
        AND epa.start_date <= ? 
        AND epa.end_date >= ?
      ${whereClause}
      GROUP BY epa.start_date, epa.end_date, epa.hours_per_day
      ORDER BY epa.start_date
    `;
  } else {
    allocationForecastQuery = `
    SELECT 
      lb.name as vertical_name,
      epa.start_date,
      epa.end_date,
      epa.hours_per_day,
      COUNT(DISTINCT e.emp_id) as total_employees,
      CASE 
        WHEN epa.start_date = epa.end_date THEN 1
        ELSE (
          DATEDIFF(epa.end_date, epa.start_date) + 1
          - (DATEDIFF(epa.end_date, epa.start_date) DIV 7) * 2 
          - CASE WHEN WEEKDAY(epa.start_date) = 6 THEN 1 ELSE 0 END 
          - CASE WHEN WEEKDAY(epa.end_date) = 5 THEN 1 ELSE 0 END 
        )
      END as working_days
    FROM employee_details e
    LEFT JOIN line_of_business lb ON e.line_of_business_id = lb.line_of_business_id
    LEFT JOIN employee_project_allocations epa ON e.emp_id = epa.emp_id
      AND epa.start_date <= ? 
      AND epa.end_date >= ?
    ${whereClause}
    GROUP BY lb.line_of_business_id, lb.name, epa.start_date, epa.end_date, epa.hours_per_day
    ORDER BY lb.name, epa.start_date
  `;
  }
  
  let forecastQueryParams;
  if (shouldGroupByServiceLine) {
    forecastQueryParams = [forecastEndDate.toISOString().split('T')[0], forecastStartDate.toISOString().split('T')[0], ...serviceLineParams2];
  } else {
    forecastQueryParams = [forecastEndDate.toISOString().split('T')[0], forecastStartDate.toISOString().split('T')[0], ...params];
  }
  
  sql.query(allocationForecastQuery, forecastQueryParams, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting allocation forecast. ${err}`);
    }
    
    const chartData = {};
    const overallData = [];
    
    weeks.forEach(week => {
      overallData.push({
        week: week.label,
        forecastedHours: 0,
        bookableHours: 0,
        allocationPercentage: 0
      });
    });
    
    rows.forEach(row => {
      const key = row.vertical_name || 'Overall';
      if (!chartData[key]) {
        chartData[key] = weeks.map(week => ({
          week: week.label,
          forecastedHours: 0,
          bookableHours: 0,
          allocationPercentage: 0
        }));
      }
      
      const totalForecastedHours = row.hours_per_day * row.working_days * row.total_employees;
      
      weeks.forEach((week, index) => {
        const weekStart = new Date(week.startDate);
        const weekEnd = new Date(week.endDate);
        const allocStart = new Date(row.start_date);
        const allocEnd = new Date(row.end_date);
        
        if (allocStart <= weekEnd && allocEnd >= weekStart) {
          const overlapStart = new Date(Math.max(weekStart.getTime(), allocStart.getTime()));
          const overlapEnd = new Date(Math.min(weekEnd.getTime(), allocEnd.getTime()));
          
          let overlapWorkingDays = 0;
          if (overlapStart.getTime() === overlapEnd.getTime()) {
            const dayOfWeek = overlapStart.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              overlapWorkingDays = 1;
            }
          } else {
            const totalDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const fullWeeks = Math.floor(totalDays / 7);
            const remainingDays = totalDays % 7;
            
            overlapWorkingDays = fullWeeks * 5;
            
            const startDayOfWeek = overlapStart.getDay();
            for (let i = 0; i < remainingDays; i++) {
              const dayOfWeek = (startDayOfWeek + i) % 7;
              if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                overlapWorkingDays++;
              }
            }
          }
          
          const weeklyForecastedHours = (totalForecastedHours / row.working_days) * overlapWorkingDays;
          const totalAvailableHours = row.total_employees * 40;
          const bookableHours = Math.max(0, totalAvailableHours - weeklyForecastedHours);
          const allocationPercentage = totalAvailableHours > 0 ? 
            ((weeklyForecastedHours / totalAvailableHours) * 100) : 0;
          
          chartData[key][index].forecastedHours += weeklyForecastedHours;
          chartData[key][index].bookableHours += bookableHours;
          chartData[key][index].allocationPercentage = Math.max(
            chartData[key][index].allocationPercentage, 
            allocationPercentage
          );
          
          overallData[index].forecastedHours += weeklyForecastedHours;
          overallData[index].bookableHours += bookableHours;
          overallData[index].allocationPercentage = Math.max(
            overallData[index].allocationPercentage,
            allocationPercentage
          );
        }
      });
    });
    
    const chartDataArray = Object.keys(chartData).map(vertical => ({
      name: vertical,
      data: chartData[vertical]
    }));
    
    return res.status(200).send({
      chartData: chartDataArray,
      weeks: weeks,
      user: req.user
    });
  });
};

const getServiceLinesByLineOfBusiness = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const { lineOfBusinessId } = req.params;
  
  if (!lineOfBusinessId || lineOfBusinessId === 'all') {
    getServiceLinesForUser(req.user, (serviceLines) => {
      return res.status(200).send({
        serviceLines: serviceLines,
        user: req.user
      });
    });
  } else {
    let query;
    let params = [];
    
    if (req.user.role === 'administrator') {
      query = `SELECT sl.service_line_id, sl.name, sl.line_of_business_id, lb.name as line_of_business_name 
               FROM service_line sl 
               LEFT JOIN line_of_business lb ON sl.line_of_business_id = lb.line_of_business_id 
               WHERE sl.line_of_business_id = ? 
               ORDER BY sl.name`;
      params = [lineOfBusinessId];
    } else if (req.user.role === 'off_shore_lead' || req.user.role === 'manager') {
      query = `SELECT sl.service_line_id, sl.name, sl.line_of_business_id, lb.name as line_of_business_name 
               FROM service_line sl 
               LEFT JOIN line_of_business lb ON sl.line_of_business_id = lb.line_of_business_id
               INNER JOIN offshore_lead_service_lines olsl ON sl.service_line_id = olsl.service_line_id
               WHERE olsl.offshore_lead_id = ? AND sl.line_of_business_id = ?
               ORDER BY sl.name`;
      params = [req.user.user_id, lineOfBusinessId];
    } else {
      if (lineOfBusinessId != req.user.line_of_business_id) {
        return res.status(403).send({error: true, message: 'Access denied to service lines from other line of business'});
      }
      query = `SELECT sl.service_line_id, sl.name, sl.line_of_business_id, lb.name as line_of_business_name 
               FROM service_line sl 
               LEFT JOIN line_of_business lb ON sl.line_of_business_id = lb.line_of_business_id 
               WHERE sl.line_of_business_id = ? 
               ORDER BY sl.name`;
      params = [lineOfBusinessId];
    }
    
    sql.query(query, params, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem getting service lines. ${err}`);
      }
      
      const serviceLines = [
        { id: 'all', name: 'All', line_of_business_id: lineOfBusinessId },
        ...rows.map(row => ({ 
          id: row.service_line_id, 
          name: row.name, 
          line_of_business_id: row.line_of_business_id,
          line_of_business_name: row.line_of_business_name
        }))
      ];
      
      return res.status(200).send({
        serviceLines: serviceLines,
        user: req.user
      });
    });
  }
};

module.exports = {
  getFilterOptions,
  getDashboardMetrics,
  getUtilizationTrends,
  getAllocationForecast,
  getServiceLinesByLineOfBusiness
};