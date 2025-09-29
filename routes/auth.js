const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const sql = require('../lib/db');

// Simple Microsoft OAuth configuration
const BASE_URL = process.env.BASE_URL || 'https://localhost:3001';
const MICROSOFT_CONFIG = {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    tenantId: process.env.MICROSOFT_TENANT_ID,
    redirectUri: process.env.MICROSOFT_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:3001'}/api/auth/azuread/redirect`
};

// Route to get Microsoft OAuth URL
router.get('/microsoft', (req, res) => {
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

// Azure AD redirect handler
router.get('/redirect', async (req, res) => {
    try {
        const { code, error } = req.query;
        if (error) {
            return res.redirect(`${BASE_URL}/login?error=` + encodeURIComponent(error));
        }
        
        if (!code) {
            return res.redirect(`${BASE_URL}/login?error=No authorization code received`);
        }

        // Exchange code for token
        const tokenResponse = await fetch(`https://login.microsoftonline.com/${MICROSOFT_CONFIG.tenantId}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: MICROSOFT_CONFIG.clientId,
                // client_secret: process.env.MICROSOFT_CLIENT_SECRET,
                code: code,
                redirect_uri: MICROSOFT_CONFIG.redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();
        if (tokens.error) {
            return res.redirect(`${BASE_URL}/login?error=` + encodeURIComponent(tokens.error_description || tokens.error));
        }

        // Get user info
        const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });
        
        const userProfile = await userResponse.json();
        const email = userProfile.mail || userProfile.userPrincipalName;
        // Check if user exists in database
        sql.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.redirect(`${BASE_URL}/login?error=Database error occurred during login`);
            }

            if (rows.length === 0) {
                // User not found - redirect to login with error message
                return res.redirect(`${BASE_URL}/login?error=User not found. Please contact your administrator to create an account.`);
            }

            const user = rows[0];
            // Remove password from user object before creating JWT
            delete user.password;
            const token = jwt.sign(
                { user: user },
                process.env.JWT_SECRET,
                { expiresIn: '3h' }
            );

            // Set cookie and redirect to login page with success parameters
            res.cookie('jwt-access-token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
            
            // Redirect to login page with token and user data
            res.redirect(`${BASE_URL}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
        });

    } catch (error) {
        console.error('Microsoft login error:', error);
        res.redirect(`${BASE_URL}/login?error=Microsoft login failed. Please try again.`);
    }
});

module.exports = router;
