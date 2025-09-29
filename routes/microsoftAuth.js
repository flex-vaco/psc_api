const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sql = require('../lib/db');

// Simple Microsoft OAuth configuration
const BASE_URL = process.env.BASE_URL || 'https://localhost:3001';
const MICROSOFT_CONFIG = {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    tenantId: process.env.MICROSOFT_TENANT_ID,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI
};

// Route to get Microsoft OAuth URL
router.get('/microsoft', (req, res) => {
    console.log("Microsoft OAuth endpoint hit", req);
    try {
        const authUrl = `https://login.microsoftonline.com/${MICROSOFT_CONFIG.tenantId}/oauth2/v2.0/authorize?` +
            `client_id=${MICROSOFT_CONFIG.clientId}&` +
            `response_type=code&` +
            `redirect_uri=${encodeURIComponent(MICROSOFT_CONFIG.redirectUri)}&` +
            `response_mode=query&` +
            `scope=openid%20profile%20email&` +
            `state=12345`;
        
        res.json({ authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error initiating Microsoft login' 
        });
    }
});

module.exports = router;
