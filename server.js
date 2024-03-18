const express = require('express');
const WebSocket = require('ws');
const fetch = require('node-fetch');

const promoCodesArray = [];
const logsArray = []; // Array to store received messages for logging

const endpoint = "wss://api.haader.com/socket.io/?EIO=4&transport=websocket";
const headers = {
    "origin": "https://api.haader.com:443",
    "Upgrade": "websocket",
    "Connection": "Upgrade",
    "Sec-WebSocket-Key": "0x0Q1sVpXQ91LUvede97hw==",
    "Sec-WebSocket-Version": "13",
    "Sec-WebSocket-Extensions": "permessage-deflate",
    "Host": "api.haader.com",
    "Accept-Encoding": "gzip",
    "User-Agent": "okhttp/4.10.0"
};

let socket;

function connectWebSocket() {
    socket = new WebSocket(endpoint, [], headers);

    socket.onopen = function (event) {
        console.log("WebSocket connection established.");
        socket.send("40/socket.io");

        setInterval(() => {
            socket.send("3");
        }, 10000);
    };

    socket.onmessage = function (event) {
        const rawData = event.data.trim();
        logsArray.push(rawData); // Add received message to logs array
        if (rawData.includes('"code":"')) {
            const promoCode = extractPromoCode(rawData);
            if (!promoCodesArray.includes(promoCode)) {
                promoCodesArray.push(promoCode);
                updateLoadingLog(`Received Promo Code: ${promoCode}`);
            }
        }
    };

    socket.onerror = function (error) {
        console.error("WebSocket error:", error);
    };

    socket.onclose = function (event) {
        console.log("WebSocket connection closed. Reconnecting...");
        setTimeout(connectWebSocket, 1000);
    };
}

function extractPromoCode(rawData) {
    const regex = /"code":"([^"]+)"/;
    const match = rawData.match(regex);
    return match ? match[1] : null;
}

function updateLoadingLog(message) {
    process.stdout.write("\r" + message);
}

connectWebSocket();

// Express app setup
const app = express();
const port = 3000;

// Serve index.html as the homepage
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Expose an API to retrieve promo codes
app.get('/promo-codes', (req, res) => {
    res.json(promoCodesArray);
});

// Expose an API to retrieve logs
app.get('/logs', (req, res) => {
    res.json(logsArray);
});

// Serve static files
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
