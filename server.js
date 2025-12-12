const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());
// Serve the built React files
app.use(express.static(path.join(__dirname, 'client/build')));

// Securely access Home Assistant Internals
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const HA_URL = 'http://supervisor/core/api';

const haClient = axios.create({
    baseURL: HA_URL,
    headers: { 
        'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

const crypto = require('crypto');

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Webhook endpoint (validates HMAC SHA256 signature in `x-hub-signature-256` header)
app.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
    if (!WEBHOOK_SECRET) {
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    const sig = req.headers['x-hub-signature-256'] || '';
    const body = req.body || Buffer.from('');
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
    const expected = `sha256=${hmac}`;
    if (!sig || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    // parse JSON body
    let payload = {};
    try { payload = JSON.parse(body.toString('utf8')); } catch (e) { payload = {}; }
    // TODO: handle webhook payload (trigger builds, refresh cache, etc.)
    console.log('Received verified webhook event');
    res.json({ received: true });
});

// Proxy: Get States
app.post('/api/states', async (req, res) => {
    try {
        const response = await haClient.get('/states');
        res.json(response.data);
    } catch (error) {
        console.error("HA API Error:", error.message);
        res.status(500).json({ error: 'Failed to fetch HA data' });
    }
});

// Proxy: Call Service
app.post('/api/service', async (req, res) => {
    const { domain, service, serviceData } = req.body;
    try {
        await haClient.post(`/services/${domain}/${service}`, serviceData);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to call service' });
    }
});

// React Router Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`RTOUCH Server running on port ${PORT}`);
});
