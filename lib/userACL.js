const APP_CONSTANTS = require("./appConstants.js");

// ----- Access Control List for Employee_Details Table -----///
const getEmployeeACL = (activeUserRole) =>{
  let empACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.PRODUCER:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    case APP_CONSTANTS.USER_ROLES.MANAGER:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.PROJECT_MANAGER:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.LOBADMIN:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.LEADERSHIP:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return empACL;
    default:
      return empACL
  }
};

const hasEmployeeReadAccess = (activeUserRole) => {
  return (getEmployeeACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasEmployeeWriteAccess = (activeUserRole) => {
  return (getEmployeeACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasEmployeeUpdateAccess = (activeUserRole) => {
  return (getEmployeeACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasEmployeeCreateAccess = (activeUserRole) => {
  return (getEmployeeACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasEmployeeDeleteAccess = (activeUserRole) => {
  return (getEmployeeACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

// ----- Access Control List for Project_Details Table -----///
const getProjectACL = (activeUserRole) =>{
  let empACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.PRODUCER:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    case APP_CONSTANTS.USER_ROLES.MANAGER:
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.LOBADMIN:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.PROJECT_MANAGER:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    default:
      return empACL
  }
};

const hasProjectReadAccess = (activeUserRole) => {
  return (getProjectACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasProjectWriteAccess = (activeUserRole) => {
  return (getProjectACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasProjectUpdateAccess = (activeUserRole) => {
  return (getProjectACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasProjectCreateAccess = (activeUserRole) => {
  return (getProjectACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasProjectDeleteAccess = (activeUserRole) => {
  return (getProjectACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

// ----- Access Control List for Employee_Project_Details Table -----///
const getAllocationACL = (activeUserRole) =>{
  let empACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.PRODUCER:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    case APP_CONSTANTS.USER_ROLES.MANAGER:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.LOBADMIN:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.PROJECT_MANAGER:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return empACL;
    default:
      return empACL
  }
};

const hasAllocationReadAccess = (activeUserRole) => {
  return (getAllocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasAllocationWriteAccess = (activeUserRole) => {
  return (getAllocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasAllocationUpdateAccess = (activeUserRole) => {
  return (getAllocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasAllocationCreateAccess = (activeUserRole) => {
  return (getAllocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasAllocationDeleteAccess = (activeUserRole) => {
  return (getAllocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

// ----- Access Control List for Employee_Project_Utilization Table -----///
const getUtilizationACL = (activeUserRole) =>{
  let empACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.PRODUCER:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    case APP_CONSTANTS.USER_ROLES.MANAGER:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.PROJECT_MANAGER:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    case APP_CONSTANTS.USER_ROLES.LOB_ADMIN:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    default:
      return empACL
  }
};


const hasUtilizationReadAccess = (activeUserRole) => {
  return (getUtilizationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasUtilizationWriteAccess = (activeUserRole) => {
  return (getUtilizationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasUtilizationUpdateAccess = (activeUserRole) => {
  return (getUtilizationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasUtilizationCreateAccess = (activeUserRole) => {
  return (getUtilizationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasUtilizationDeleteAccess = (activeUserRole) => {
  return (getUtilizationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

const getCategoryACL = (activeUserRole) =>{
  let empACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    default:
      return empACL
  }
};

const hasCategoryReadAccess = (activeUserRole) => {
  return (getCategoryACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasCategoryWriteAccess = (activeUserRole) => {
  return (getCategoryACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasCategoryUpdateAccess = (activeUserRole) => {
  return (getCategoryACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasCategoryCreateAccess = (activeUserRole) => {
  return (getCategoryACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}

// ----- Access Control List for Client_Details Table -----///
const getClientACL = (activeUserRole) =>{
  let empACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.PRODUCER:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    case APP_CONSTANTS.USER_ROLES.MANAGER:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    case APP_CONSTANTS.USER_ROLES.PROJECT_MANAGER:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    case APP_CONSTANTS.USER_ROLES.LOB_ADMIN:
      empACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ])
      return empACL;
    default:
      return empACL
  }
};


const hasClientReadAccess = (activeUserRole) => {
  return (getClientACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasClientWriteAccess = (activeUserRole) => {
  return (getClientACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasClientUpdateAccess = (activeUserRole) => {
  return (getClientACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasClientCreateAccess = (activeUserRole) => {
  return (getClientACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasClientDeleteAccess = (activeUserRole) => {
  return (getClientACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

const getLocationACL = (activeUserRole) =>{
  let empACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return empACL;
      case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
        empACL.push(
          ...[
            APP_CONSTANTS.ACCESS_LEVELS.READ,
          ]
        );
        return empACL;
    case APP_CONSTANTS.USER_ROLES.LOBADMIN:
      empACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return empACL;

    default:
      return empACL
  }
};


const hasLocationReadAccess = (activeUserRole) => {
  return (getLocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasLocationWriteAccess = (activeUserRole) => {
  return (getLocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasLocationCreateAccess = (activeUserRole) => {
  return (getLocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasLocationUpdateAccess = (activeUserRole) => {
  return (getLocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasLocationDeleteAccess = (activeUserRole) => {
  return (getLocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

const getLineOfBusinessACL = (activeUserRole) =>{
  let lineOfBusinessACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      lineOfBusinessACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return lineOfBusinessACL;
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      lineOfBusinessACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return lineOfBusinessACL;
    default:
      return lineOfBusinessACL
  }
};

const hasLineOfBusinessReadAccess = (activeUserRole) => {
  return (getLineOfBusinessACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasLineOfBusinessWriteAccess = (activeUserRole) => {
  return (getLineOfBusinessACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasLineOfBusinessUpdateAccess = (activeUserRole) => {
  return (getLineOfBusinessACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasLineOfBusinessCreateAccess = (activeUserRole) => {
  return (getLineOfBusinessACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasLineOfBusinessDeleteAccess = (activeUserRole) => {
  return (getLineOfBusinessACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

// ----- Access Control List for Service Line Table -----///
const getServiceLineACL = (activeUserRole) =>{
  let serviceLineACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      serviceLineACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return serviceLineACL;
    case APP_CONSTANTS.USER_ROLES.LOBADMIN:
      serviceLineACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return serviceLineACL;
    case APP_CONSTANTS.USER_ROLES.PROJECT_MANAGER:
      serviceLineACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return serviceLineACL;
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      serviceLineACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return serviceLineACL;
    default:
      return serviceLineACL
  }
};

const hasServiceLineReadAccess = (activeUserRole) => {
  return (getServiceLineACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ) || 
          hasOffshoreLeadServiceLineAccess(activeUserRole));
}
const hasServiceLineWriteAccess = (activeUserRole) => {
  return (getServiceLineACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasServiceLineUpdateAccess = (activeUserRole) => {
  return (getServiceLineACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasServiceLineCreateAccess = (activeUserRole) => {
  return (getServiceLineACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasServiceLineDeleteAccess = (activeUserRole) => {
  return (getServiceLineACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

const hasOffshoreLeadServiceLineAccess = (activeUserRole) => {
  return activeUserRole === APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD;
}

// ----- Access Control List for Capability Area Table -----///
const getCapabilityAreaACL = (activeUserRole) =>{
  let capabilityAreaACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      capabilityAreaACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return capabilityAreaACL;
    case APP_CONSTANTS.USER_ROLES.LOBADMIN:
      capabilityAreaACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return capabilityAreaACL;
    case APP_CONSTANTS.USER_ROLES.PROJECT_MANAGER:
      capabilityAreaACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return capabilityAreaACL;
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      capabilityAreaACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return capabilityAreaACL;
    default:
      return capabilityAreaACL
  }
};

const hasCapabilityAreaReadAccess = (activeUserRole) => {
  return (getCapabilityAreaACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ) || 
          hasOffshoreLeadCapabilityAreaAccess(activeUserRole));
}
const hasCapabilityAreaWriteAccess = (activeUserRole) => {
  return (getCapabilityAreaACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasCapabilityAreaUpdateAccess = (activeUserRole) => {
  return (getCapabilityAreaACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasCapabilityAreaCreateAccess = (activeUserRole) => {
  return (getCapabilityAreaACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasCapabilityAreaDeleteAccess = (activeUserRole) => {
  return (getCapabilityAreaACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

const hasOffshoreLeadCapabilityAreaAccess = (activeUserRole) => {
  return activeUserRole === APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD;
}

// ----- Access Control List for Work Request Table -----///
const getWorkRequestACL = (activeUserRole) =>{
  let workRequestACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
    case APP_CONSTANTS.USER_ROLES.MANAGER:
    case APP_CONSTANTS.USER_ROLES.PRODUCER:
    case APP_CONSTANTS.USER_ROLES.LOBADMIN:
    case APP_CONSTANTS.USER_ROLES.PROJECT_MANAGER:
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      workRequestACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return workRequestACL;
    default:
      return workRequestACL
  }
};

const hasWorkRequestReadAccess = (activeUserRole) => {
  return (getWorkRequestACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasWorkRequestWriteAccess = (activeUserRole) => {
  return (getWorkRequestACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasWorkRequestUpdateAccess = (activeUserRole) => {
  return (getWorkRequestACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasWorkRequestCreateAccess = (activeUserRole) => {
  return (getWorkRequestACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasWorkRequestDeleteAccess = (activeUserRole) => {
  return (getWorkRequestACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

// ----- Access Control List for Timesheets Table -----///
const getTimesheetACL = (activeUserRole) =>{
  let timesheetACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      timesheetACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return timesheetACL;
    case APP_CONSTANTS.USER_ROLES.PRODUCER:
      timesheetACL.push(...[APP_CONSTANTS.ACCESS_LEVELS.READ, APP_CONSTANTS.ACCESS_LEVELS.UPDATE])
      return timesheetACL;
    case APP_CONSTANTS.USER_ROLES.MANAGER:
      timesheetACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return timesheetACL;
    case APP_CONSTANTS.USER_ROLES.EMPLOYEE:
      timesheetACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE
        ]
      );
      return timesheetACL;
    default:
      return timesheetACL
  }
};

const hasTimesheetAccess = (activeUserRole, accessLevel) => {
  return (getTimesheetACL(activeUserRole).includes(accessLevel));
}

// ----- Access Control List for Hirings Table -----///
const getHiringACL = (activeUserRole) =>{
  let hiringACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      hiringACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return hiringACL;
    case APP_CONSTANTS.USER_ROLES.PRODUCER:
    case APP_CONSTANTS.USER_ROLES.MANAGER:
      hiringACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
        ]
      );
      return hiringACL;
    default:
      return hiringACL
  }
};

const hasHiringAccess = (activeUserRole, accessLevel) => {
  return (getHiringACL(activeUserRole).includes(accessLevel));
}

// ----- Access Control List for User Roles Table -----///
const getUserRoleACL = (activeUserRole) =>{
  let userRoleACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
      userRoleACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return userRoleACL;
    case APP_CONSTANTS.USER_ROLES.MANAGER:
      userRoleACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
        ]
      );
      return userRoleACL;
    default:
      return userRoleACL
  }
};

const hasUserRoleReadAccess = (activeUserRole) => {
  return (getUserRoleACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasUserRoleWriteAccess = (activeUserRole) => {
  return (getUserRoleACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasUserRoleUpdateAccess = (activeUserRole) => {
  return (getUserRoleACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasUserRoleCreateAccess = (activeUserRole) => {
  return (getUserRoleACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasUserRoleDeleteAccess = (activeUserRole) => {
  return (getUserRoleACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

// ----- Access Control List for Users Table -----///
const getUserACL = (activeUserRole) =>{
  let userACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
    case APP_CONSTANTS.USER_ROLES.LOBADMIN:
      userACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return userACL;
    case APP_CONSTANTS.USER_ROLES.PROJECTMANAGER:
      userACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
        ]
      );
      return userACL;
    default:
      return userACL
  }
};

const hasUserReadAccess = (activeUserRole) => {
  return (getUserACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}
const hasUserWriteAccess = (activeUserRole) => {
  return (getUserACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.WRITE));
}
const hasUserUpdateAccess = (activeUserRole) => {
  return (getUserACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.UPDATE));
}
const hasUserCreateAccess = (activeUserRole) => {
  return (getUserACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.CREATE));
}
const hasUserDeleteAccess = (activeUserRole) => {
  return (getUserACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.DELETE));
}

// ----- Access Control List for Offshore Lead Employee Access -----///
const getOffshoreLeadEmployeeACL = (activeUserRole) =>{
  let offshoreLeadEmployeeACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      offshoreLeadEmployeeACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return offshoreLeadEmployeeACL;
    default:
      return offshoreLeadEmployeeACL
  }
};

const hasOffshoreLeadEmployeeAccess = (activeUserRole) => {
  return (getOffshoreLeadEmployeeACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}

// ----- Access Control List for Offshore Lead Project Access -----///
const getOffshoreLeadProjectACL = (activeUserRole) =>{
  let offshoreLeadProjectACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      offshoreLeadProjectACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return offshoreLeadProjectACL;
    default:
      return offshoreLeadProjectACL
  }
};

const hasOffshoreLeadProjectAccess = (activeUserRole) => {
  return (getOffshoreLeadProjectACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}

// ----- Access Control List for Offshore Lead Work Request Access -----///
const getOffshoreLeadWorkRequestACL = (activeUserRole) =>{
  let offshoreLeadWorkRequestACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMINISTRATOR:
    case APP_CONSTANTS.USER_ROLES.OFF_SHORE_LEAD:
      offshoreLeadWorkRequestACL.push(
        ...[
          APP_CONSTANTS.ACCESS_LEVELS.READ,
          APP_CONSTANTS.ACCESS_LEVELS.UPDATE,
          APP_CONSTANTS.ACCESS_LEVELS.CREATE,
          APP_CONSTANTS.ACCESS_LEVELS.DELETE,
        ]
      );
      return offshoreLeadWorkRequestACL;
    default:
      return offshoreLeadWorkRequestACL
  }
};

const hasOffshoreLeadWorkRequestAccess = (activeUserRole) => {
  return (getOffshoreLeadWorkRequestACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
}

module.exports={
  hasEmployeeReadAccess,
  hasEmployeeWriteAccess,
  hasEmployeeCreateAccess,
  hasEmployeeDeleteAccess,
  hasEmployeeUpdateAccess,
  hasProjectCreateAccess,
  hasProjectDeleteAccess,
  hasProjectReadAccess,
  hasProjectWriteAccess,
  hasProjectUpdateAccess,
  hasAllocationCreateAccess,
  hasAllocationReadAccess,
  hasAllocationWriteAccess,
  hasAllocationUpdateAccess,
  hasAllocationDeleteAccess,
  hasUtilizationReadAccess,
  hasUtilizationWriteAccess,
  hasUtilizationUpdateAccess,
  hasUtilizationCreateAccess,
  hasUtilizationDeleteAccess,
  hasClientCreateAccess,
  hasClientDeleteAccess,
  hasClientReadAccess,
  hasClientWriteAccess,
  hasClientUpdateAccess,
  hasTimesheetAccess,
  hasHiringAccess,
  hasCategoryReadAccess,
  hasCategoryWriteAccess,
  hasCategoryUpdateAccess,
  hasCategoryCreateAccess,
  hasLocationReadAccess,
  hasLocationWriteAccess,
  hasLocationCreateAccess,
  hasLocationUpdateAccess,
  hasLocationDeleteAccess,
  hasLineOfBusinessCreateAccess,
  hasLineOfBusinessDeleteAccess,
  hasLineOfBusinessReadAccess,
  hasLineOfBusinessWriteAccess,
  hasLineOfBusinessUpdateAccess,
  hasServiceLineCreateAccess,
  hasServiceLineDeleteAccess,
  hasServiceLineReadAccess,
  hasServiceLineWriteAccess,
  hasServiceLineUpdateAccess,
  hasOffshoreLeadServiceLineAccess,
  hasCapabilityAreaCreateAccess,
  hasCapabilityAreaDeleteAccess,
  hasCapabilityAreaReadAccess,
  hasCapabilityAreaWriteAccess,
  hasCapabilityAreaUpdateAccess,
  hasOffshoreLeadCapabilityAreaAccess,
  hasWorkRequestCreateAccess,
  hasWorkRequestDeleteAccess,
  hasWorkRequestReadAccess,
  hasWorkRequestWriteAccess,
  hasWorkRequestUpdateAccess,
  hasUserRoleReadAccess,
  hasUserRoleWriteAccess,
  hasUserRoleUpdateAccess,
  hasUserRoleCreateAccess,
  hasUserRoleDeleteAccess,
  hasUserReadAccess,
  hasUserWriteAccess,
  hasUserUpdateAccess,
  hasUserCreateAccess,
  hasUserDeleteAccess,
  hasOffshoreLeadEmployeeAccess,
  hasOffshoreLeadProjectAccess,
  hasOffshoreLeadWorkRequestAccess
}