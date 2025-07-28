const express = require("express");
// Customize the default console.log function
console.logCopy = console.log.bind(console);
console.log = function (...data) {
    const currentDate = "[" + new Date().toString() + "]";
    this.logCopy(`${currentDate}-->`, ...data);
};
require('dotenv').config();

const connectDB = require('./src/config/db.config');
const { CRON_PORT } = require('./src/config/dev.config');

// Import Cron Jobs
// Express App Initialization
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Function to start the server
const startServer = async () => {
    try {
        // Fetch constants and set globally

        const {
            sendRideReminder
        } = require("./src/config/cronjob");

        // Database Connection
        connectDB();

        // Start Cron Jobs

        sendRideReminder.start();
        // Start the Server
        app.listen(CRON_PORT, () => {
            console.log(`Server started on port ${CRON_PORT}`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
};

// Initialize and Start the Server
startServer();
