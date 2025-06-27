const appUtils = require('./appUtils');
const fcm = require('./fcm');
const Notifications = {
    PushNotifications: async (params) => {
        return new Promise((resolve, reject) => {
            try {
                const pushLoad = {
                    title: params.title || '',
                    body: params.message,
                    type: params.type,
                    notification: {
                        title: params.message,
                        entityId: params.entityId,
                        displayPicture: '',
                        type: params.type,
                        userId: params.receiverId,
                    },
                    data: {
                        title: params.message,
                        entityId: params.entityId,
                        displayPicture: '',
                        type: params.type,
                        userId: params.receiverId,
                    },
                };
                const tokenChunks = appUtils.splitArrayInToChunks([params.deviceTokens]);
                if (global.constant.PUSH_SENDING_TYPE.FCM === 2) {
                    const promiseResult = [];
                    for (let i = 0; i < tokenChunks.length; i++) {
                        const message = appUtils.formatDataForPush(pushLoad, tokenChunks[i]);
                        promiseResult.push(fcm.sendPush(message));
                    }
                    resolve(Promise.all(promiseResult));
                } else {
                    return;
                }
            } catch (error) {
                reject(error);
            }
        });
    },

    PushAllNotifications: async (params) => {
        return new Promise((resolve, reject) => {
            try {
                //console.log("push")
                const pushLoad = {
                    title: params.title || '',
                    body: params.message,
                    type: params.type,
                    notification: {
                        title: params.message,
                        // entityId: params.entityId,
                        displayPicture: '',
                        type: params.type,
                        // userId: params.receiverId,
                    },
                    data: {
                        title: params.message,
                        // entityId: params.entityId,
                        displayPicture: '',
                        type: params.type,
                        // userId: params.receiverId,
                    },
                };
                // console.log("-----pushLoad------", params.deviceTokens);

                const tokenChunks = appUtils.splitArrayInToChunks(params.deviceTokens);
                // console.log("outside", params);
                if (global.constant.PUSH_SENDING_TYPE.FCM === 2) {
                    const promiseResult = [];
                    for (let i = 0; i < tokenChunks.length; i++) {
                        // console.log("inside");
                        const message = appUtils.formatDataForPush(pushLoad, tokenChunks[i]);
                        promiseResult.push(fcm.sendPush(message));
                    }
                    resolve(Promise.all(promiseResult));
                } else {
                    return;
                }
            } catch (error) {
                console.log('error', error);
                reject(error);
            }
        });
    }
};

module.exports = Notifications;