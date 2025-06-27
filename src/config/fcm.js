const admin = require('firebase-admin');
const serviceAccount1 = require('./firebase-adminsdk.json');

// Initialize the second app with a different unique name
const app2 = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount1),
}, 'app2');


let fcm_fun = {
    sendPush: async (message) => {
        return new Promise((resolve, reject) => {
            try {
                app2.messaging().send(message)
                    .then((response) => {
                        console.log('Successfully sent message');
                        resolve(response);
                    })
                    .catch((error) => {
                        console.log('Error sending message:', error);
                        reject(error);
                    });
            } catch (error) {
                reject(error);
            }
        });
    },
    subscribeToTopic: async (deviceIds, topic) => {
        return new Promise((resolve, reject) => {
            app2.messaging().subscribeToTopic(deviceIds, topic)
                .then((response) => {
                    // console.log("Subscribed to topic");
                    resolve(response);
                })
                .catch((error) => {
                    console.error("Error subscribing to topic:", error);
                    reject(error);
                });
        });
    },
    unsubscribeToTopic: async (deviceIds, topic) => {
        return new Promise((resolve, reject) => {
            app2.messaging().unsubscribeFromTopic(deviceIds, topic)
                .then((response) => {
                    console.log("Unsubscribed from topic:", response);
                    resolve(response);
                })
                .catch((error) => {
                    console.error("Error unsubscribing from topic:", error);
                    reject(error);
                });
        });
    }
};
module.exports = fcm_fun;