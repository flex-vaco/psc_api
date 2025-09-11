const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const multer = require('multer');
const WorkRequest = require('../models/WorkRequest.js');
const verifyToken = require('../lib/verifyJWToken.js');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(multer().any()); // Handle multipart/form-data for all workRequest routes

router.get("/", verifyToken, WorkRequest.findAll);
router.get("/:id", verifyToken, WorkRequest.findById);
router.post("/add", verifyToken, WorkRequest.create);
router.post("/update/:id", verifyToken, WorkRequest.update);
router.get("/delete/:id", verifyToken, WorkRequest.erase);
router.post("/resourcesByCapabilityAreas", verifyToken, WorkRequest.getResourcesByCapabilityAreas);
router.get("/capabilityAreasByLineOfBusiness/:lineOfBusinessId", verifyToken, WorkRequest.getCapabilityAreasByLineOfBusiness);
router.get("/offshoreLeads/serviceLine/:serviceLineId", verifyToken, WorkRequest.getOffshoreLeadsByServiceLine);
router.get("/offshoreLead/assigned", verifyToken, WorkRequest.getWorkRequestsByOffshoreLead);

// New routes for offshore lead workflow
router.post("/offshoreLead/filteredResources", verifyToken, WorkRequest.getFilteredResourcesForOffshoreLead);
router.post("/offshoreLead/updateStatus/:id", verifyToken, WorkRequest.updateWorkRequestStatus);

// Submit work request (draft to submitted)
router.post("/submit/:id", verifyToken, WorkRequest.submitWorkRequest);

module.exports = router; 