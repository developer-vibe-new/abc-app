const mongoose = require('mongoose');

const taxiTypeSchema = new mongoose.Schema({
    city_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    },
    operator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator',
        default: null
    },
    title: {
        type: String
    },

    icon: {
        type: String,
        default: ""
    },
    base_fare: {
        type: Number,
        default: 0
    },
    airportCharge: {
        type: Number,
        default: 0,
    },
    fixed_fare: {
        type: Number,
        default: 0
    },
    distance_fare: {
        type: Number,
        default: 0
    },
    time_fare: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: "INR"
    },
    is_active: {
        type: Boolean,
        default: true
    },
    outstation_status: {
        type: Boolean,
        default: true
    },
    outstation_distance_fare: {
        type: Number,
        default: 0
    },
    rental_distance_fare: {
        type: Number,
        default: 0
    },
    outstation_two_distance_fare: {
        type: Number,
        default: 0
    },



}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("taxi_type", taxiTypeSchema);
