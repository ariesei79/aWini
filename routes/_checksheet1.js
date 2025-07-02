const mqtt = require('mqtt');

let latestData = null;
const client = mqtt.connect("mqtt://172.17.44.106:1883", {
    username: 'oee',
    password: 'oeemc'
});



console.log("Trying to connect to broker..."); // Tambahkan ini

client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    client.subscribe("11B", (err) => {
        if (err) console.error('❌ Failed to subscribe:', err);
        else console.log("✅ Subscribed to topic 11B");
    });
});

client.on('error', (err) => {
    console.error('❌ MQTT connection error:', err.message);
});

client.on('close', () => {
    console.warn('⚠️ MQTT connection closed');
});

client.on('message', (topic, message) => {
    if (topic === "11B") {
        try {
            const parsed = JSON.parse(message.toString());
            latestData = parsed;
            // console.log('📦 Received JSON data:', latestData);
        } catch (e) {
            latestData = message.toString().split(',');
            console.warn('📦 Received CSV-like data:', latestData);
        }
    }
});

module.exports = { client, getLatestData: () => latestData };
