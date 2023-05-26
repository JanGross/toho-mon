require('dotenv').config()
const axios = require('axios');
const { STATUS_CODES } = require('http');
const { Webhook, MessageBuilder } = require('discord-webhook-node');

// API endpoint URL to ping
const apiUrl = process.env.API_URL;

// Discord webhook URL to send messages
const webhookUrl = process.env.WEBHOOK;

// Create a new Discord webhook instance
const webhook = new Webhook(webhookUrl);

const images = {
    oh: "https://cdn.discordapp.com/attachments/1083687175998152714/1110912960152481833/81a58a9c-cee3-473a-9ca9-08efad4de576.jpeg",
    down: "https://cdn.discordapp.com/attachments/1083687175998152714/1110913210103635998/3751235c-ed2d-46dd-9af4-e24cf3ee8d7e.jpeg",
    up: "https://cdn.discordapp.com/attachments/1083687175998152714/1110913780268924958/605e7b80-9b97-4792-b903-eaa482dd7f11.jpeg"
}

const threshold = {
    warn: 10,
    down: 20
}

let consecutiveFailures = 0;

// Function to ping the API endpoint
async function pingEndpoint() {
    try {
        // Send a GET request to the API endpoint
        const response = await axios({ url: apiUrl, timeout: 1000, method: 'get' });

        // Check if the response status is successful (2xx)
        if (response.status === 200) {
            console.log('API endpoint is online.');
            if (consecutiveFailures >= threshold.warn) {
                consecutiveFailures = 0;
                sendNotification("Recovered", "The system has recovered", color='#00FF00', image=images.up);
            }
        } else {
            // Send an error message to the Discord webhook
            handleFailure(`API endpoint returned status ${response.status}\n${STATUS_CODES[response.status]}`);
            
        }
    } catch (error) {
        // Send an error message to the Discord webhook
        consecutiveFailures += 1;
        console.log(`ERROR PINGING API. HARD FAIL (${consecutiveFailures})`);
        handleFailure(`Error occurred while pinging the API endpoint.\n${error.message}\n${STATUS_CODES[error.response?.status]}`);
    }
}

function handleFailure(errorMessage) {
    console.error(errorMessage);

    if (consecutiveFailures == threshold.down) {
        sendNotification("Down", errorMessage, color='#ff0000', image=images.down);
        return;
    }
    if (consecutiveFailures == threshold.warn) {
        sendNotification("Intermittent issues", errorMessage, '#D9B611');
        return;
    }
}

function sendNotification(statusString, reasonString, color='#00b0f4', image=images.oh) {
    const embed = new MessageBuilder()
        .setTitle('Status Update')
        .addField('Status:', statusString, true)
        .addField('Reason', reasonString)
        .setColor(color)
        .setImage(image)
        .setDescription('A change in availability has been detected!')
        .setTimestamp();

    webhook.send(embed);
}

// Call the pingEndpoint function
setInterval(pingEndpoint, 5000);
