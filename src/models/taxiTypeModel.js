const mongoose = require('mongoose');

const taxiTypeSchema = new mongoose.Schema({
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    },
    type: {
        type: String,
        enum: ['operator', 'main']
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
}, { timestamps: true, versionKey: false });

module.exports.taxiTypeModel = mongoose.model("taxi_type", taxiTypeSchema);
