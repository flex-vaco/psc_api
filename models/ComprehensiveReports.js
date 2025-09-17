const sql = require("../lib/db.js");
const userACL = require('../lib/userACL.js');
const APP_CONSTANTS = require('../lib/appConstants.js');

// Helper function to get date ranges for presets
const getDateRange = (preset) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  switch (preset) {
    case 'next_8_weeks':
      const next8Weeks = new Date(startOfDay);
      next8Weeks.setDate(next8Weeks.getDate() + 56); // 8 weeks
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

// Helper function to get working days between two dates
const getWorkingDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  
  while (start <= end) {
    const dayOfWeek = start.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
      workingDays++;
    }
    start.setDate(start.getDate() + 1);
  }
  
  return workingDays;
};

// Get filter options
const getFilterOptions = (req, res) => {
  console.log("getFilterOptions", req.user.role);
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
    
    const datePresets = [
      { id: 'next_8_weeks', name: 'Next 8 Weeks' },
      { id: 'last_7_days', name: 'Last 7 Days' },
      { id: 'last_month', name: 'Last Month' },
      { id: 'year_to_date', name: 'Year to Date' },
      { id: 'last_quarter', name: 'Last Quarter' }
    ];
    
    return res.status(200).send({
      verticals: verticals,
      datePresets: datePresets,
      user: req.user
    });
  });
};

// Get dashboard metrics
const getDashboardMetrics = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const { 
    vertical, 
    datePreset, 
    startDate, 
    endDate,
    metricsVertical,
    metricsDatePreset,
    metricsStartDate,
    metricsEndDate,
    utilizationVertical,
    utilizationDatePreset,
    utilizationStartDate,
    utilizationEndDate,
    allocationVertical,
    allocationDatePreset,
    allocationStartDate,
    allocationEndDate
  } = req.query;
  
  // Helper function to get date range
  const getDateRangeForSection = (datePreset, startDate, endDate, defaultWeeks = 8) => {
    if (datePreset && datePreset !== 'custom') {
      return getDateRange(datePreset);
    } else if (startDate && endDate) {
      return { startDate, endDate };
    } else {
      // Default to specified weeks
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + (defaultWeeks * 7));
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: futureDate.toISOString().split('T')[0]
      };
    }
  };

  // Helper function to build where conditions
  const buildWhereConditions = (vertical, userRole, userLineOfBusinessId) => {
    let whereConditions = [];
    let params = [];
    
    if (vertical && vertical !== 'all') {
      whereConditions.push('e.line_of_business_id = ?');
      params.push(vertical);
    } else if (userRole !== 'administrator') {
      whereConditions.push('e.line_of_business_id = ?');
      params.push(userLineOfBusinessId);
    }
    
    return {
      whereClause: whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '',
      params
    };
  };

  // Get filters for each section
  const metricsDateRange = getDateRangeForSection(metricsDatePreset, metricsStartDate, metricsEndDate, 8);
  const utilizationDateRange = getDateRangeForSection(utilizationDatePreset, utilizationStartDate, utilizationEndDate, 8);
  const allocationDateRange = getDateRangeForSection(allocationDatePreset, allocationStartDate, allocationEndDate, 8);

  const metricsFilters = buildWhereConditions(metricsVertical, req.user.role, req.user.line_of_business_id);
  const utilizationFilters = buildWhereConditions(utilizationVertical, req.user.role, req.user.line_of_business_id);
  const allocationFilters = buildWhereConditions(allocationVertical, req.user.role, req.user.line_of_business_id);
  
  // 1. Active HC (employees working on projects in the selected date range)
  const activeHCQuery = `
    SELECT COUNT(DISTINCT e.emp_id) as active_hc
    FROM employee_details e
    INNER JOIN employee_project_allocations epa ON e.emp_id = epa.emp_id
    ${metricsFilters.whereClause}
    AND epa.start_date <= ? AND epa.end_date >= ?
  `;
  
  // 2. Utilization % calculation
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
  
  // 3. Allocation Forecast % for next 8 weeks
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
  
  // Execute all queries
  const activeHCParams = [...metricsFilters.params, metricsDateRange.endDate, metricsDateRange.startDate];
  const utilizationParams = [...utilizationFilters.params, utilizationDateRange.startDate, utilizationDateRange.endDate];
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
    // Calculate metrics
    const totalAvailableHours = utilization.total_employees * utilization.working_days * 8;
    const utilizationPercentage = totalAvailableHours > 0 ? 
      ((utilization.total_billed_hours / totalAvailableHours) * 100).toFixed(1) : 0;
    
    const totalForecastAvailableHours = forecast.total_employees * 8 * 5 * 8; // 8 hours/day * 5 days/week * 8 weeks
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

// Get utilization trends
const getUtilizationTrends = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const { vertical, datePreset, startDate, endDate, groupBy = 'month' } = req.body;
  
  // Default to last month if no date range specified
  let dateRange;
  if (datePreset && datePreset !== 'custom') {
    dateRange = getDateRange(datePreset);
  } else if (startDate && endDate) {
    dateRange = { startDate, endDate };
  } else {
    // Default to last month
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    lastMonth.setDate(1); // First day of last month
    
    const endOfLastMonth = new Date();
    endOfLastMonth.setDate(0); // Last day of previous month
    
    dateRange = {
      startDate: lastMonth.toISOString().split('T')[0],
      endDate: endOfLastMonth.toISOString().split('T')[0]
    };
  }
  
  const { startDate: filterStart, endDate: filterEnd } = dateRange;
  
  // Build base query conditions
  let whereConditions = [];
  let params = [];
  
  // Add line of business filter
  if (vertical && vertical !== 'all') {
    whereConditions.push('e.line_of_business_id = ?');
    params.push(vertical);
  } else if (req.user.role !== 'administrator') {
    whereConditions.push('e.line_of_business_id = ?');
    params.push(req.user.line_of_business_id);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Group by clause
  const groupByClause = groupBy === 'week' ? 
    'DATE_FORMAT(ite.date, "%Y-%u")' : 
    'DATE_FORMAT(ite.date, "%Y-%m")';
  
  const utilizationTrendsQuery = `
    SELECT 
      lb.name as vertical_name,
      ${groupByClause} as period,
      COALESCE(SUM(ite.duration), 0) as total_billed_hours,
      COUNT(DISTINCT e.emp_id) as total_employees,
      ${getWorkingDays(filterStart, filterEnd)} as working_days
    FROM employee_details e
    LEFT JOIN line_of_business lb ON e.line_of_business_id = lb.line_of_business_id
    LEFT JOIN imported_timesheet_entries ite ON ite.date BETWEEN ? AND ?
    ${whereClause}
    GROUP BY lb.line_of_business_id, lb.name, ${groupByClause}
    ORDER BY lb.name, period
  `;

  console.log("utilizationTrendsQuery: ", utilizationTrendsQuery);
  
  const queryParams = [filterStart, filterEnd, ...params];
  
  sql.query(utilizationTrendsQuery, queryParams, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting utilization trends. ${err}`);
    }
    
    // Process data for charts
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
    
    // Convert to array format for charts
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

// Get allocation forecast
const getAllocationForecast = (req, res) => {
  if (!userACL.hasEmployeeReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }

  const { vertical } = req.body;
  
  // Get next 8 weeks
  const forecastStartDate = new Date();
  const forecastEndDate = new Date();
  forecastEndDate.setDate(forecastEndDate.getDate() + 56); // 8 weeks
  
  // Build base query conditions
  let whereConditions = [];
  let params = [];
  
  // Add line of business filter
  if (vertical && vertical !== 'all') {
    whereConditions.push('e.line_of_business_id = ?');
    params.push(vertical);
  } else if (req.user.role !== 'administrator') {
    whereConditions.push('e.line_of_business_id = ?');
    params.push(req.user.line_of_business_id);
  }
  
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  // Generate 8 weeks data
  const weeks = [];
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(forecastStartDate);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 4); // Monday to Friday
    
    weeks.push({
      weekNumber: i + 1,
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      label: weekStart.toISOString().split('T')[0]
    });
  }
  
  // Get allocation data for each week
  const allocationForecastQuery = `
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
  
  const queryParams = [forecastEndDate.toISOString().split('T')[0], forecastStartDate.toISOString().split('T')[0], ...params];
  
  sql.query(allocationForecastQuery, queryParams, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting allocation forecast. ${err}`);
    }
    
    // Process data for charts
    const chartData = {};
    const overallData = [];
    
    // Initialize chart data
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
      
      // Calculate total forecasted hours for this allocation
      const totalForecastedHours = row.hours_per_day * row.working_days * row.total_employees;
      
      // Find which weeks this allocation covers and calculate overlap
      weeks.forEach((week, index) => {
        const weekStart = new Date(week.startDate);
        const weekEnd = new Date(week.endDate);
        const allocStart = new Date(row.start_date);
        const allocEnd = new Date(row.end_date);
        
        // Check if allocation overlaps with this week
        if (allocStart <= weekEnd && allocEnd >= weekStart) {
          // Calculate the actual overlap in days for this week
          const overlapStart = new Date(Math.max(weekStart.getTime(), allocStart.getTime()));
          const overlapEnd = new Date(Math.min(weekEnd.getTime(), allocEnd.getTime()));
          
          // Calculate working days in the overlap period
          let overlapWorkingDays = 0;
          if (overlapStart.getTime() === overlapEnd.getTime()) {
            // Same day
            const dayOfWeek = overlapStart.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
              overlapWorkingDays = 1;
            }
          } else {
            // Multiple days - calculate working days in overlap
            const totalDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const fullWeeks = Math.floor(totalDays / 7);
            const remainingDays = totalDays % 7;
            
            overlapWorkingDays = fullWeeks * 5; // 5 working days per week
            
            // Add remaining working days
            const startDayOfWeek = overlapStart.getDay();
            for (let i = 0; i < remainingDays; i++) {
              const dayOfWeek = (startDayOfWeek + i) % 7;
              if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
                overlapWorkingDays++;
              }
            }
          }
          
          // Calculate forecasted hours for this week based on overlap
          const weeklyForecastedHours = (totalForecastedHours / row.working_days) * overlapWorkingDays;
          const totalAvailableHours = row.total_employees * 40; // 40 hours per week
          const bookableHours = Math.max(0, totalAvailableHours - weeklyForecastedHours);
          const allocationPercentage = totalAvailableHours > 0 ? 
            ((weeklyForecastedHours / totalAvailableHours) * 100) : 0;
          
          chartData[key][index].forecastedHours += weeklyForecastedHours;
          chartData[key][index].bookableHours += bookableHours;
          chartData[key][index].allocationPercentage = Math.max(
            chartData[key][index].allocationPercentage, 
            allocationPercentage
          );
          
          // Update overall data
          overallData[index].forecastedHours += weeklyForecastedHours;
          overallData[index].bookableHours += bookableHours;
          overallData[index].allocationPercentage = Math.max(
            overallData[index].allocationPercentage,
            allocationPercentage
          );
        }
      });
    });
    
    // Convert to array format for charts
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

module.exports = {
  getFilterOptions,
  getDashboardMetrics,
  getUtilizationTrends,
  getAllocationForecast
};
