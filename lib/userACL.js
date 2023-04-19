const APP_CONSTANTS = require("./appConstants.js");

// ----- Access Control List for Employee_Details Table -----///
const getEmployeeACL = (activeUserRole) =>{
  let empACL = [];
  switch (activeUserRole) {
    case APP_CONSTANTS.USER_ROLES.ADMIN:
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
    case APP_CONSTANTS.USER_ROLES.SUPERVISOR:
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
    case APP_CONSTANTS.USER_ROLES.ADMIN:
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
    case APP_CONSTANTS.USER_ROLES.SUPERVISOR:
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
    case APP_CONSTANTS.USER_ROLES.ADMIN:
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
    case APP_CONSTANTS.USER_ROLES.SUPERVISOR:
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
  hasAllocationDeleteAccess
}