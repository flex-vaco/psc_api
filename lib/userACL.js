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
    default:
      return empACL
  }
};

const hasEmployeeReadAccess = (activeUserRole) => {
  return (getEmployeeACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
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
    default:
      return empACL
  }
};

const hasAllocationReadAccess = (activeUserRole) => {
  return (getAllocationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
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
    default:
      return empACL
  }
};

const hasUtilizationReadAccess = (activeUserRole) => {
  return (getUtilizationACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
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
    default:
      return empACL
  }
};


const hasClientReadAccess = (activeUserRole) => {
  return (getClientACL(activeUserRole).includes(APP_CONSTANTS.ACCESS_LEVELS.READ));
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

module.exports={
  hasEmployeeReadAccess,
  hasEmployeeCreateAccess,
  hasEmployeeDeleteAccess,
  hasEmployeeUpdateAccess,
  hasProjectCreateAccess,
  hasProjectDeleteAccess,
  hasProjectReadAccess,
  hasProjectUpdateAccess,
  hasAllocationCreateAccess,
  hasAllocationReadAccess,
  hasAllocationUpdateAccess,
  hasAllocationDeleteAccess,
  hasUtilizationReadAccess,
  hasUtilizationUpdateAccess,
  hasUtilizationCreateAccess,
  hasUtilizationDeleteAccess,
  hasClientCreateAccess,
  hasClientDeleteAccess,
  hasClientReadAccess,
  hasClientUpdateAccess,
  hasTimesheetAccess,
  hasHiringAccess
}