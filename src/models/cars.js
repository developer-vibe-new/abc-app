const mongoose = require("mongoose");

const CarSchema = new mongoose.Schema({
    title: {
        type: String
    },
    make: {
        type: String
    },
    model: {
        type: String
    },
    year: {
        type: String
    },
    taxi_type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaxiType'
    }],
    operator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator',
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    },
    city_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
    },
    kycStatus: {
        type: Number,
        default: 0
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
    },
    
});

const carModel = mongoose.model('Car', CarSchema);

module.exports = carModel;
