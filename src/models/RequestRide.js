const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var RequestRideSchema = new Schema({
    ride_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
}, {
    timestamps: {
        createdAt: 'created',
        updatedAt: 'updated'
    },
    id: false,
    toJSON: {
        getters: true,
        virtuals: true
    },
    toObject: {
        getters: true,
        virtuals: true
    }
});

const requestRideModel = mongoose.model('RequestRide', RequestRideSchema);

//make this available to our users in Node applications
module.exports = requestRideModel;
