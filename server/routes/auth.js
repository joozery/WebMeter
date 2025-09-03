const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/database');

// Regular Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required' 
      });
    }
    
    // Find user by email
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password' 
      });
    }
    
    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
        return res.status(401).json({
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error' 
    });
  }
});

// LINE Login Configuration
const LINE_CONFIG = {
  CHANNEL_ID: process.env.LINE_CHANNEL_ID,
  CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
  CALLBACK_URL: process.env.LINE_REDIRECT_URI || 'http://localhost:3001/api/auth/line/callback',
  REDIRECT_URL: process.env.CORS_ORIGIN || 'http://localhost:8080'
};

// LINE Login URL Generator
router.get('/line/login', (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    const nonce = Math.random().toString(36).substring(7);
    
    // For now, we'll skip session storage and use a simpler approach
    // In production, you should implement proper session management
    
    const authUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
      `response_type=code&` +
      `client_id=${LINE_CONFIG.CHANNEL_ID}&` +
      `redirect_uri=${encodeURIComponent(LINE_CONFIG.CALLBACK_URL)}&` +
      `state=${state}&` +
      `scope=profile%20openid&` +
      `nonce=${nonce}`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('LINE Login error:', error);
    res.status(500).json({ error: 'Failed to get LINE login URL' });
  }
});

// LINE Login Callback
router.get('/line/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    // Verify state parameter
    if (state !== req.session.lineState) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    
    if (error) {
      return res.status(400).json({ error: 'LINE Login failed' });
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token', {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: LINE_CONFIG.CALLBACK_URL,
      client_id: LINE_CONFIG.CHANNEL_ID,
      client_secret: LINE_CONFIG.CHANNEL_SECRET
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, id_token } = tokenResponse.data;
    
    // Verify ID token
    const idTokenPayload = jwt.decode(id_token);
    if (idTokenPayload.nonce !== req.session.lineNonce) {
      return res.status(400).json({ error: 'Invalid nonce' });
    }
    
    // Get user profile
    const profileResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const userProfile = profileResponse.data;
    
    // Create or update user in database
    const user = await createOrUpdateUser({
      lineId: userProfile.userId,
      name: userProfile.displayName,
      email: idTokenPayload.email || null,
      picture: userProfile.pictureUrl,
      provider: 'line'
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        lineId: user.lineId,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${LINE_CONFIG.REDIRECT_URL}/auth/callback?token=${token}`);
    
  } catch (error) {
    console.error('LINE Login error:', error);
    res.redirect(`${LINE_CONFIG.REDIRECT_URL}/auth/error?message=Login failed`);
  }
});

// Helper function to create or update user
async function createOrUpdateUser(userData) {
  // Implement your database logic here
  // Example with MySQL:
  const { lineId, name, email, picture, provider } = userData;
  
  // Check if user exists
  const [existingUsers] = await db.query(
    'SELECT * FROM users WHERE line_id = ?',
    [lineId]
  );
  
  if (existingUsers.length > 0) {
    // Update existing user
    const [result] = await db.query(
      `UPDATE users 
       SET name = ?, email = ?, picture = ?, updated_at = NOW()
       WHERE line_id = ?`,
      [name, email, picture, lineId]
    );
    
    // Get updated user
    const [updatedUsers] = await db.query(
      'SELECT * FROM users WHERE line_id = ?',
      [lineId]
    );
    return updatedUsers[0];
  } else {
    // Create new user
    const [result] = await db.query(
      `INSERT INTO users (line_id, name, email, picture, provider, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [lineId, name, email, picture, provider]
    );
    
    // Get created user
    const [newUsers] = await db.query(
      'SELECT * FROM users WHERE line_id = ?',
      [lineId]
    );
    return newUsers[0];
  }
}

// New route for frontend to handle LINE login token exchange
router.post('/line-login', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token', new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.LINE_REDIRECT_URI,
      client_id: process.env.LINE_CHANNEL_ID,
      client_secret: process.env.LINE_CHANNEL_SECRET
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, id_token } = tokenResponse.data;

    // Get user profile from LINE
    const profileResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const userProfile = profileResponse.data;
    const decodedIdToken = jwt.decode(id_token);

    // Find or create user in the database
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE line_id = ?',
      [userProfile.userId]
    );

    let user;
    if (existingUsers.length > 0) {
      // User exists, update their info
      user = existingUsers[0];
      await db.query(
        'UPDATE users SET name = ? WHERE id = ?',
        [userProfile.displayName, user.id]
      );
    } else {
      // New user, create a new record
      const [result] = await db.query(
        'INSERT INTO users (name, email, line_id, username) VALUES (?, ?, ?, ?)',
        [userProfile.displayName, decodedIdToken.email, userProfile.userId, userProfile.displayName]
      );
      const [newUsers] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUsers[0];
    }

    // Generate JWT token for our application
    const appToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'LINE login successful',
      token: appToken,
      user
    });

  } catch (error) {
    console.error('LINE Login callback error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    
    // Check if environment variables are loaded
    if (!process.env.LINE_CHANNEL_ID || !process.env.LINE_CHANNEL_SECRET || !process.env.LINE_REDIRECT_URI) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'One or more required LINE environment variables are missing on the server.'
      });
    }

    // Provide more specific error feedback to the client
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.status(500).json({ 
        error: 'Error from LINE API',
        message: 'The server received an error while communicating with the LINE API.',
        details: error.response.data 
      });
    } else if (error.request) {
      // The request was made but no response was received
      return res.status(500).json({ 
        error: 'No response from LINE API',
        message: 'The server could not reach the LINE API. Check server network connectivity.'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({ 
        error: 'Internal server error during LINE login',
        message: error.message 
      });
    }
  }
});

module.exports = router;
