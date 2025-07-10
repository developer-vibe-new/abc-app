// const Provider = require('../../models/providerModel');
const Ride = require('../../models/ride');
// const mongoose = require('mongoose');
const moment = require('moment');
const FUNC = require('../../functions/function');
// const rentalModel = require('../../models/rentalModel');
// const locationModel = require('../../models/locationModel');
// const notificationModel = require('../../models/notificationModel');
// const { PushNotifications } = require('../../config/notification');

exports.sendRideReminder = async () => {
    try {
        const min_schedule_time = moment().add(15, 'minutes').toDate();
        const ridesArr = [];

        const rides_pending = await Ride.find({
            "basic.schedule": true,
            "basic.ride_status": "scheduled",
            "basic.reminder_sent": false,
            "basic.provider_id": { $exists: true },
            "time.ride_on": { $lte: min_schedule_time },
        });

        // console.log("rides_pending------------->>>>>>>>>>>>>", rides_pending);

        if (rides_pending.length > 0) {
            // Using for...of loop for async iteration
            for (let ride_details of rides_pending) {
                await FUNC.schedule_ride_reminder(ride_details.toObject());
                ridesArr.push(ride_details._id);
            }

            // After processing all rides, update reminder_sent to true
            await Ride.updateOne(
                { _id: { $in: ridesArr } },
                { $set: { "basic.reminder_sent": true } },
                { multi: true }
            );
        }
    } catch (err) {
        console.error("Error in sendRideReminder:", err);
    }
};
exports.checkRidesPending = async () => {
    try {
        const min_schedule_time = moment().add(30, 'minutes').toDate();

        const rides_pending = await Ride.find({
            "basic.schedule": true,
            "basic.ride_status": "scheduled",
            "basic.provider_id": { $exists: true },
            "time.ride_on": { $lte: min_schedule_time },
        }).populate({ path: "basic.user_id" });

        if (rides_pending.length > 0) {
            for (let ride_details of rides_pending) {
                await FUNC.driver_not_responding(ride_details);
            }
        }
    } catch (err) {
        console.error('Error checking pending rides:', err);
    }
};