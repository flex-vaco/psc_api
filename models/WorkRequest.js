const sql = require("../lib/db.js");
const workRequestTable = "work_request";
const workRequestCapabilityAreasTable = "work_request_capability_areas";
const workRequestResourcesTable = "work_request_resources";
const workRequestOffshoreLeadsTable = "work_request_offshore_leads";
const userACL = require('../lib/userACL.js');

const findAll = (req, res) => {
  if (!userACL.hasWorkRequestReadAccess(req.user.role) && !userACL.hasOffshoreLeadWorkRequestAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  let query = `
    SELECT wr.*, 
           sl.name as service_line_name,
           lb.name as line_of_business_name,
           pd.project_name,
           pd.project_location,
           u.first_name, u.last_name,
           GROUP_CONCAT(DISTINCT ca.name) as capability_areas,
           GROUP_CONCAT(DISTINCT CONCAT(ed.first_name, ' ', ed.last_name)) as assigned_resources,
           GROUP_CONCAT(DISTINCT CONCAT(ol.first_name, ' ', ol.last_name)) as offshore_leads
    FROM ${workRequestTable} wr
    LEFT JOIN service_line sl ON wr.service_line_id = sl.service_line_id
    LEFT JOIN line_of_business lb ON wr.line_of_business_id = lb.line_of_business_id
    LEFT JOIN project_details pd ON wr.project_id = pd.project_id
    LEFT JOIN users u ON wr.submitted_by = u.user_id
    LEFT JOIN ${workRequestCapabilityAreasTable} wrca ON wr.work_request_id = wrca.work_request_id
    LEFT JOIN capability_area ca ON wrca.capability_area_id = ca.capability_area_id
    LEFT JOIN ${workRequestResourcesTable} wrr ON wr.work_request_id = wrr.work_request_id
    LEFT JOIN employee_details ed ON wrr.employee_id = ed.emp_id
    LEFT JOIN ${workRequestOffshoreLeadsTable} wrol ON wr.work_request_id = wrol.work_request_id
    LEFT JOIN users ol ON wrol.offshore_lead_id = ol.user_id
  `;
  
  // Add role-based filtering
  let whereConditions = [];
  
  if (req.user.role === 'administrator') {
    // Admin can see all requests - no additional filtering needed
  } else if (req.user.role === 'offshore_lead') {
    // Offshore lead can only see requests assigned to them
    whereConditions.push(`EXISTS (SELECT 1 FROM ${workRequestOffshoreLeadsTable} wrol WHERE wrol.work_request_id = wr.work_request_id AND wrol.offshore_lead_id = ${req.user.user_id})`);
    whereConditions.push(`wr.line_of_business_id = ${req.user.line_of_business_id}`);
  } else if (req.user.role === 'project_manager') {
    // Project manager can only see requests made by them
    whereConditions.push(`wr.submitted_by = ${req.user.user_id}`);
  } else {
    // Other roles (manager, producer, lobadmin) - filter by line of business
    whereConditions.push(`wr.line_of_business_id = ${req.user.line_of_business_id}`);
  }
  
  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(' AND ')}`;
  }
  
  query += ` GROUP BY wr.work_request_id ORDER BY wr.created_at DESC`;
  
  sql.query(query, (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting work requests. ${err}`);
    }
    return res.status(200).send({workRequests: rows, user: req.user});
  });
};

const findById = (req, res) => {
  if (!userACL.hasWorkRequestReadAccess(req.user.role) && !userACL.hasOffshoreLeadWorkRequestAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const workRequestId = req.params.id;
  if (workRequestId) {
    let query = `
      SELECT wr.*, 
             sl.name as service_line_name,
             lb.name as line_of_business_name,
             pd.project_name,
             pd.project_location,
             u.first_name, u.last_name
      FROM ${workRequestTable} wr
      LEFT JOIN service_line sl ON wr.service_line_id = sl.service_line_id
      LEFT JOIN line_of_business lb ON wr.line_of_business_id = lb.line_of_business_id
      LEFT JOIN project_details pd ON wr.project_id = pd.project_id
      LEFT JOIN users u ON wr.submitted_by = u.user_id
      WHERE wr.work_request_id = ?
    `;
    
    let params = [workRequestId];
    
    // Add line of business filter for non-administrator users
    if (req.user.role !== 'administrator') {
      query += ` AND wr.line_of_business_id = ?`;
      params.push(req.user.line_of_business_id);
    }
    
    // Add offshore lead filter
    if (req.user.role === 'offshore_lead') {
      query += ` AND EXISTS (SELECT 1 FROM ${workRequestOffshoreLeadsTable} wrol WHERE wrol.work_request_id = wr.work_request_id AND wrol.offshore_lead_id = ?)`;
      params.push(req.user.user_id);
    }
    
          sql.query(query, params, (err, rows) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`There was a problem finding the Work Request. ${err}`);
      }
      
      if (rows.length > 0) {
        // Get capability areas for this work request
        const capabilityAreasQuery = `
          SELECT ca.* 
          FROM ${workRequestCapabilityAreasTable} wrca
          LEFT JOIN capability_area ca ON wrca.capability_area_id = ca.capability_area_id
          WHERE wrca.work_request_id = ?
        `;
        
        sql.query(capabilityAreasQuery, [workRequestId], (err, capabilityAreas) => {
          if (err) {
            console.log("error: ", err);
            return res.status(500).send(`There was a problem getting capability areas. ${err}`);
          }
          
          // Get assigned resources for this work request
          const resourcesQuery = `
            SELECT ed.*, wrr.allocation_percentage
            FROM ${workRequestResourcesTable} wrr
            LEFT JOIN employee_details ed ON wrr.employee_id = ed.emp_id
            WHERE wrr.work_request_id = ?
          `;
          
          sql.query(resourcesQuery, [workRequestId], (err, resources) => {
            if (err) {
              console.log("error: ", err);
              return res.status(500).send(`There was a problem getting resources. ${err}`);
            }
            
            // Get assigned offshore leads for this work request
            const offshoreLeadsQuery = `
              SELECT u.user_id, u.first_name, u.last_name, u.email, u.role
              FROM ${workRequestOffshoreLeadsTable} wrol
              LEFT JOIN users u ON wrol.offshore_lead_id = u.user_id
              WHERE wrol.work_request_id = ?
            `;
            
            sql.query(offshoreLeadsQuery, [workRequestId], (err, offshoreLeads) => {
              if (err) {
                console.log("error: ", err);
                return res.status(500).send(`There was a problem getting offshore leads. ${err}`);
              }
              
              const workRequest = rows[0];
              workRequest.capability_areas = capabilityAreas;
              workRequest.resources = resources;
              workRequest.offshore_leads = offshoreLeads;
              
              return res.status(200).send({workRequest: workRequest, user: req.user});
            });
          });
        });
      } else {
        return res.status(404).send({error: true, message: "Work Request not found"});
      }
    });
  } else {
    return res.status(500).send("Work Request ID required");
  }
};

const create = (req, res) => {
  if (!userACL.hasWorkRequestCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  console.log("workRequestDatas: ", req.body);
  // Set line of business based on user role
  let lineOfBusinessId = req.body.line_of_business_id;
  if (req.user.role !== 'administrator') {
    lineOfBusinessId = req.user.line_of_business_id;
  }
  
  const workRequestData = {
    title: req.body.title,
    service_line_id: req.body.service_line_id,
    line_of_business_id: lineOfBusinessId,
    project_id: req.body.project_id,
    duration_from: req.body.duration_from,
    duration_to: req.body.duration_to,
    hours_per_week: req.body.hours_per_week,
    notes: req.body.notes || '',
    status: 'draft'
  };
  workRequestData.submitted_by = req.user.user_id;
  
  const insertQuery = `INSERT INTO ${workRequestTable} SET ?`;
  sql.query(insertQuery, [workRequestData], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Adding the Work Request. ${err}`);
    } else {
      const workRequestId = success.insertId;
      
      // Insert capability areas if provided
      if (req.body.capability_area_ids && req.body.capability_area_ids.length > 0) {
        const capabilityAreasData = req.body.capability_area_ids.map(caId => ({
          work_request_id: workRequestId,
          capability_area_id: caId
        }));
        
        const capabilityAreasQuery = `INSERT INTO ${workRequestCapabilityAreasTable} SET ?`;
        capabilityAreasData.forEach(data => {
          sql.query(capabilityAreasQuery, [data], (err) => {
            if (err) console.log("Error inserting capability area:", err);
          });
        });
      }
      
      // Insert resources if provided
      if (req.body.resource_ids && req.body.resource_ids.length > 0) {
        const resourcesData = req.body.resource_ids.map(empId => ({
          work_request_id: workRequestId,
          employee_id: empId
        }));
        
        const resourcesQuery = `INSERT INTO ${workRequestResourcesTable} SET ?`;
        resourcesData.forEach(data => {
          sql.query(resourcesQuery, [data], (err) => {
            if (err) console.log("Error inserting resource:", err);
          });
        });
      }
      
      // Insert offshore leads if provided
      if (req.body.offshore_lead_ids && req.body.offshore_lead_ids.length > 0) {
        const offshoreLeadsData = req.body.offshore_lead_ids.map(leadId => ({
          work_request_id: workRequestId,
          offshore_lead_id: leadId
        }));
        
        const offshoreLeadsQuery = `INSERT INTO ${workRequestOffshoreLeadsTable} SET ?`;
        offshoreLeadsData.forEach(data => {
          sql.query(offshoreLeadsQuery, [data], (err) => {
            if (err) console.log("Error inserting offshore lead:", err);
          });
        });
      }
      
              workRequestData.work_request_id = workRequestId;
      const response = {newWorkRequest: workRequestData, user: req.user}
      res.status(200).send(response);
    }
  });
};

const update = (req, res) => {
  if (!userACL.hasWorkRequestUpdateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  if(!id){
    res.status(500).send('Work Request ID is Required');
  }
  
  const updatedWorkRequest = req.body;
  
  // Parse JSON strings from FormData
  let capabilityAreaIds = [];
  let resourceIds = [];
  let offshoreLeadIds = [];
  
  if (updatedWorkRequest.capability_area_ids) {
    try {
      capabilityAreaIds = JSON.parse(updatedWorkRequest.capability_area_ids);
    } catch (e) {
      console.log("Error parsing capability_area_ids:", e);
    }
  }
  
  if (updatedWorkRequest.resource_ids) {
    try {
      resourceIds = JSON.parse(updatedWorkRequest.resource_ids);
    } catch (e) {
      console.log("Error parsing resource_ids:", e);
    }
  }
  
  if (updatedWorkRequest.offshore_lead_ids) {
    try {
      offshoreLeadIds = JSON.parse(updatedWorkRequest.offshore_lead_ids);
    } catch (e) {
      console.log("Error parsing offshore_lead_ids:", e);
    }
  }
  console.log("updatedWorkRequest: ", updatedWorkRequest);
  console.log("Parsed capabilityAreaIds:", capabilityAreaIds);
  console.log("Parsed resourceIds:", resourceIds);
  
  // Set line of business based on user role
  let lineOfBusinessId = updatedWorkRequest.line_of_business_id;
  if (req.user.role !== 'administrator') {
    lineOfBusinessId = req.user.line_of_business_id;
  }
  
  // Only update fields that exist in the work_request table
  const workRequestData = {
    title: updatedWorkRequest.title,
    service_line_id: updatedWorkRequest.service_line_id,
    line_of_business_id: lineOfBusinessId,
    project_id: updatedWorkRequest.project_id,
    duration_from: updatedWorkRequest.duration_from,
    duration_to: updatedWorkRequest.duration_to,
    hours_per_week: updatedWorkRequest.hours_per_week,
    notes: updatedWorkRequest.notes
  };
  
  const updateQuery = `UPDATE ${workRequestTable} SET ? WHERE work_request_id = ?`;
  sql.query(updateQuery,[workRequestData, id], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Updating the ${workRequestTable} with ID: ${id}. ${err}`);
    } else {
      if (success.affectedRows == 1){
        console.log(`${workRequestTable} UPDATED:` , success)
        
        // Update capability areas if provided
        if (capabilityAreaIds && capabilityAreaIds.length > 0) {
          // Delete existing capability areas
          sql.query(`DELETE FROM ${workRequestCapabilityAreasTable} WHERE work_request_id = ?`, [id], (err) => {
            if (err) console.log("Error deleting existing capability areas:", err);
            
            // Insert new capability areas
            const capabilityAreasData = capabilityAreaIds.map(caId => ({
              work_request_id: id,
              capability_area_id: caId
            }));
            
            const capabilityAreasQuery = `INSERT INTO ${workRequestCapabilityAreasTable} SET ?`;
            capabilityAreasData.forEach(data => {
              sql.query(capabilityAreasQuery, [data], (err) => {
                if (err) console.log("Error updating capability area:", err);
              });
            });
          });
        }
        
        // Update resources if provided
        if (resourceIds && resourceIds.length > 0) {
          // Delete existing resources
          sql.query(`DELETE FROM ${workRequestResourcesTable} WHERE work_request_id = ?`, [id], (err) => {
            if (err) console.log("Error deleting existing resources:", err);
            
            // Insert new resources
            const resourcesData = resourceIds.map(empId => ({
              work_request_id: id,
              employee_id: empId
            }));
            
            console.log("Inserting resources data:", resourcesData);
            
            const resourcesQuery = `INSERT INTO ${workRequestResourcesTable} SET ?`;
            resourcesData.forEach(data => {
              sql.query(resourcesQuery, [data], (err) => {
                if (err) console.log("Error updating resource:", err);
                else console.log("Resource inserted successfully:", data);
              });
            });
          });
        }
        
        // Update offshore leads if provided
        if (offshoreLeadIds && offshoreLeadIds.length > 0) {
          // Delete existing offshore leads
          sql.query(`DELETE FROM ${workRequestOffshoreLeadsTable} WHERE work_request_id = ?`, [id], (err) => {
            if (err) console.log("Error deleting existing offshore leads:", err);
            
            // Insert new offshore leads
            const offshoreLeadsData = offshoreLeadIds.map(leadId => ({
              work_request_id: id,
              offshore_lead_id: leadId
            }));
            
            console.log("Inserting offshore leads data:", offshoreLeadsData);
            
            const offshoreLeadsQuery = `INSERT INTO ${workRequestOffshoreLeadsTable} SET ?`;
            offshoreLeadsData.forEach(data => {
              sql.query(offshoreLeadsQuery, [data], (err) => {
                if (err) console.log("Error updating offshore lead:", err);
                else console.log("Offshore lead inserted successfully:", data);
              });
            });
          });
        }
        
        updatedWorkRequest.work_request_id = parseInt(id);
        const response = {updatedWorkRequest, user: req.user}
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with Work Request ID: ${id}`);
      }
    }
  });
};

const erase = (req, res) => {
  if (!userACL.hasWorkRequestDeleteAccess(req.user.role) && !userACL.hasOffshoreLeadWorkRequestAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  if(!id){
    res.status(500).send('Work Request ID is Required');
  }

  const deleteQuery = `DELETE FROM ${workRequestTable} WHERE work_request_id = ?`;
  sql.query(deleteQuery,[id], (err, success) => {
    if (err) {
      console.log("error: ", err);
      res.status(500).send(`Problem while Deleting the ${workRequestTable} with ID: ${id}. ${err}`);
    } else {
      if (success.affectedRows == 1){
        console.log(`${workRequestTable} DELETED:` , success)
        res.status(200).send({msg: `Deleted row from ${workRequestTable} with ID: ${id}`, user: req.user});
      } else {
        res.status(404).send(`Record not found with Work Request ID: ${id}`);
      }
    }
  });
};

const getResourcesByCapabilityAreas = (req, res) => {
  if (!userACL.hasWorkRequestReadAccess(req.user.role) && !userACL.hasOffshoreLeadWorkRequestAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { capabilityAreaIds } = req.body;
  console.log("capabilityAreaIds: ", capabilityAreaIds);
  if (!capabilityAreaIds || capabilityAreaIds.length === 0) {
    return res.status(400).send({error: true, message: "Capability area IDs are required"});
  }
  
  // Build query to get employees who have the specified capability areas
  let whereConditions = [];
  whereConditions.push(`eca.capability_area_id IN (${capabilityAreaIds.map(() => '?').join(',')})`);

  if (req.user.role !== 'administrator') {
    whereConditions.push(`ed.line_of_business_id = ?`);
  }

  const query = `
    SELECT DISTINCT ed.*, 
           GROUP_CONCAT(DISTINCT ca.name) as capability_areas
    FROM employee_details ed
    INNER JOIN employee_capability_areas eca ON ed.emp_id = eca.emp_id
    LEFT JOIN capability_area ca ON eca.capability_area_id = ca.capability_area_id
    WHERE ${whereConditions.join(' AND ')}
    GROUP BY ed.emp_id
    ORDER BY ed.first_name, ed.last_name
  `;

  const queryParams = [...capabilityAreaIds];
  if (req.user.role !== 'administrator') {
    queryParams.push(req.user.line_of_business_id);
  }

  sql.query(query, queryParams, (err, results) => {
    console.log("results: ", queryParams);
    if (err) {
      console.log("Error fetching resources by capability areas:", err);
      return res.status(500).send({error: true, message: 'Error fetching resources'});
    }
    
    res.send({error: false, resources: results});
  });
};

const getCapabilityAreasByLineOfBusiness = (req, res) => {
  if (!userACL.hasWorkRequestReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const lineOfBusinessId = req.params.lineOfBusinessId;
  if (!lineOfBusinessId) {
    return res.status(400).send({error: true, message: "Line of Business ID is required"});
  }
  
  const query = `
    SELECT ca.*, sl.name as service_line_name
    FROM capability_area ca
              LEFT JOIN service_line sl ON ca.service_line_id = sl.service_line_id
    WHERE ca.line_of_business_id = ?
    ORDER BY ca.name
  `;
  
  sql.query(query, [lineOfBusinessId], (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting capability areas for line of business. ${err}`);
    }
    return res.status(200).send({capabilityAreas: rows, user: req.user});
  });
};

const getOffshoreLeadsByServiceLine = (req, res) => {
  if (!userACL.hasWorkRequestReadAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const serviceLineId = req.params.serviceLineId;
  if (!serviceLineId) {
    return res.status(400).send({error: true, message: "Service Line ID is required"});
  }
  
  const query = `
    SELECT DISTINCT u.user_id, u.first_name, u.last_name, u.email, u.role, u.line_of_business_id
    FROM users u
    INNER JOIN offshore_lead_service_lines olsl ON u.user_id = olsl.offshore_lead_id
    WHERE olsl.service_line_id = ? AND u.role = 'off_shore_lead'
    ORDER BY u.first_name, u.last_name
  `;
  
  sql.query(query, [serviceLineId], (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting offshore leads for service line. ${err}`);
    }
    return res.status(200).send({offshoreLeads: rows, user: req.user});
  });
};

const getWorkRequestsByOffshoreLead = (req, res) => {
  if (!userACL.hasOffshoreLeadWorkRequestAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const offshoreLeadId = req.user.user_id;
  
  let query = `
    SELECT wr.*, 
           sl.name as service_line_name,
           lb.name as line_of_business_name,
           pd.project_name,
           pd.project_location,
           u.first_name, u.last_name,
           GROUP_CONCAT(DISTINCT ca.name) as capability_areas,
           GROUP_CONCAT(DISTINCT CONCAT(ed.first_name, ' ', ed.last_name)) as assigned_resources
    FROM ${workRequestTable} wr
    LEFT JOIN service_line sl ON wr.service_line_id = sl.service_line_id
    LEFT JOIN line_of_business lb ON wr.line_of_business_id = lb.line_of_business_id
    LEFT JOIN project_details pd ON wr.project_id = pd.project_id
    LEFT JOIN users u ON wr.submitted_by = u.user_id
    LEFT JOIN ${workRequestCapabilityAreasTable} wrca ON wr.work_request_id = wrca.work_request_id
    LEFT JOIN capability_area ca ON wrca.capability_area_id = ca.capability_area_id
    LEFT JOIN ${workRequestResourcesTable} wrr ON wr.work_request_id = wrr.work_request_id
    LEFT JOIN employee_details ed ON wrr.employee_id = ed.emp_id
    INNER JOIN ${workRequestOffshoreLeadsTable} wrol ON wr.work_request_id = wrol.work_request_id
    WHERE wrol.offshore_lead_id = ? AND wr.line_of_business_id = ? AND wr.status != 'draft'
    GROUP BY wr.work_request_id
    ORDER BY wr.created_at DESC
  `;
  
  sql.query(query, [offshoreLeadId, req.user.line_of_business_id], (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem getting work requests for offshore lead. ${err}`);
    }
    return res.status(200).send({workRequests: rows, user: req.user});
  });
};

// New function for offshore lead to get filtered resources
const getFilteredResourcesForOffshoreLead = (req, res) => {
  if (!userACL.hasOffshoreLeadWorkRequestAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { capabilityAreaIds } = req.body;
  
  if (!capabilityAreaIds || capabilityAreaIds.length === 0) {
    return res.status(400).send({error: true, message: "Capability area IDs are required"});
  }
  
  // Build query to get employees who have the specified capability areas
  const query = `
    SELECT DISTINCT ed.*, 
           GROUP_CONCAT(DISTINCT ca.name) as capability_areas
    FROM employee_details ed
    INNER JOIN employee_capability_areas eca ON ed.emp_id = eca.emp_id
    LEFT JOIN capability_area ca ON eca.capability_area_id = ca.capability_area_id
    WHERE eca.capability_area_id IN (${capabilityAreaIds.map(() => '?').join(',')})
      AND ed.line_of_business_id = ?
    GROUP BY ed.emp_id
    ORDER BY ed.first_name, ed.last_name
  `;

  const queryParams = [...capabilityAreaIds, req.user.line_of_business_id];

  sql.query(query, queryParams, (err, results) => {
    if (err) {
      console.log("Error fetching filtered resources:", err);
      return res.status(500).send({error: true, message: 'Error fetching resources'});
    }
    
    res.send({error: false, resources: results});
  });
};

// New function for offshore lead to approve/reject work request
const updateWorkRequestStatus = (req, res) => {
  if (!userACL.hasOffshoreLeadWorkRequestAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  const { status, resourceIds, rejectionReason } = req.body;
  
  if (!id) {
    return res.status(500).send('Work Request ID is Required');
  }
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).send({error: true, message: 'Status must be either "approved" or "rejected"'});
  }
  
  // Verify that the offshore lead is assigned to this work request
  const verifyQuery = `
    SELECT wr.* FROM ${workRequestTable} wr
    INNER JOIN ${workRequestOffshoreLeadsTable} wrol ON wr.work_request_id = wrol.work_request_id
    WHERE wr.work_request_id = ? AND wrol.offshore_lead_id = ? AND wr.line_of_business_id = ?
  `;
  
  sql.query(verifyQuery, [id, req.user.user_id, req.user.line_of_business_id], (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem verifying work request access. ${err}`);
    }
    
    if (rows.length === 0) {
      return res.status(404).send({error: true, message: "Work Request not found or you don't have access to it"});
    }
    
    const workRequest = rows[0];
    
    // Update work request status
    const updateData = { status };
    if (status === 'rejected' && rejectionReason) {
      updateData.notes = (workRequest.notes || '') + `\n\nRejection Reason: ${rejectionReason}`;
    }
    
    const updateQuery = `UPDATE ${workRequestTable} SET ? WHERE work_request_id = ?`;
    sql.query(updateQuery, [updateData, id], (err, success) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`Problem while updating the work request status. ${err}`);
      }
      
      if (success.affectedRows === 1) {
        // If approved and resources are provided, update the resources
        if (status === 'approved' && resourceIds && resourceIds.length > 0) {
          // Delete existing resources
          sql.query(`DELETE FROM ${workRequestResourcesTable} WHERE work_request_id = ?`, [id], (err) => {
            if (err) {
              console.log("Error deleting existing resources:", err);
            } else {
              // Insert new resources
              const resourcesData = resourceIds.map(empId => ({
                work_request_id: id,
                employee_id: empId,
                allocation_percentage: 100
              }));
              
              const resourcesQuery = `INSERT INTO ${workRequestResourcesTable} SET ?`;
              resourcesData.forEach(data => {
                sql.query(resourcesQuery, [data], (err) => {
                  if (err) console.log("Error inserting resource:", err);
                });
              });
            }
          });
        }
        
        const response = {
          message: `Work request ${status} successfully`,
          workRequestId: id,
          status: status,
          user: req.user
        };
        
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with Work Request ID: ${id}`);
      }
    });
  });
};

// Submit work request (draft to submitted)
const submitWorkRequest = (req, res) => {
  if (!userACL.hasWorkRequestCreateAccess(req.user.role)) {
    const msg = `User role '${req.user.role}' does not have privileges on this action`;
    return res.status(404).send({error: true, message: msg});
  }
  
  const { id } = req.params;
  
  if (!id) {
    return res.status(500).send('Work Request ID is Required');
  }
  
  // Verify that the user is the creator of this work request and it's in draft status
  const verifyQuery = `
    SELECT wr.* FROM ${workRequestTable} wr
    WHERE wr.work_request_id = ? AND wr.submitted_by = ? AND wr.status = 'draft'
  `;
  
  sql.query(verifyQuery, [id, req.user.user_id], (err, rows) => {
    if (err) {
      console.log("error: ", err);
      return res.status(500).send(`There was a problem verifying work request access. ${err}`);
    }
    
    if (rows.length === 0) {
      return res.status(404).send({error: true, message: "Work Request not found, not in draft status, or you don't have permission to submit it"});
    }
    
    const workRequest = rows[0];
    
    // Update work request status to submitted
    const updateData = { 
      status: 'submitted',
      submitted_at: new Date()
    };
    
    const updateQuery = `UPDATE ${workRequestTable} SET ? WHERE work_request_id = ?`;
    sql.query(updateQuery, [updateData, id], (err, success) => {
      if (err) {
        console.log("error: ", err);
        return res.status(500).send(`Problem while submitting the work request. ${err}`);
      }
      
      if (success.affectedRows === 1) {
        const response = {
          message: 'Work request submitted successfully',
          workRequestId: id,
          status: 'submitted',
          user: req.user
        };
        
        res.status(200).send(response);
      } else {
        res.status(404).send(`Record not found with Work Request ID: ${id}`);
      }
    });
  });
};

module.exports = {
  findAll,
  findById,
  create,
  update,
  erase,
  getResourcesByCapabilityAreas,
  getCapabilityAreasByLineOfBusiness,
  getOffshoreLeadsByServiceLine,
  getWorkRequestsByOffshoreLead,
  getFilteredResourcesForOffshoreLead,
  updateWorkRequestStatus,
  submitWorkRequest
} 