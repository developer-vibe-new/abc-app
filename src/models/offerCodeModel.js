const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var OfferCodeSchema = new Schema({

    offercode: {
        type: String
    },

    description: {
        type: String,
        default: ""
    },

    start_date: {
        type: String,
    },

    end_date: {
        type: String,
    },

    ride_type: {
        type: Array,
    },

    percentage: {
        type: Number,
        default: 0
    },

    price: {
        type: Number,
        default: 0
    },

    usedtimes: {
        type: Number,
        default: 0
    },

    is_active: {
        type: Boolean,
        default: true
    },

    city_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            default: null
        },
}, {
    timestamps: {
        createdAt: 'created',
        updatedAt: 'updated'
    }
});

const offerCodeModel = mongoose.model("offer_code", OfferCodeSchema);

module.exports = offerCodeModel;