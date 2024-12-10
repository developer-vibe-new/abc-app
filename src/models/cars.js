const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
    rc: {
        number_plate_front: { type: String, default: "" },
        number_plate_back: { type: String, default: "" },
        image: { type: String, default: "" },
        status: { type: Number, default: -1 }
    },
    pollution_certificate: {
        image: { type: String, default: "" },
        expiry_date: { type: Date, default: null },
        status: { type: Number, default: -1 }
    },
    vehicle_image: {
        front_image: { type: String, default: "" },
        left_image: { type: String, default: "" },
        right_image: { type: String, default: "" },
        back_image: { type: String, default: "" },
        status: { type: Number, default: -1 }
    },
    vehicle_permit: {
        type: { type: String, default: "" },
        issue_date: { type: Date, default: null },
        expiry_date: { type: Date, default: null },
        image: { type: String, default: "" },
        status: { type: Number, default: -1 }
    },
    insurance: {
        image: { type: String, default: "" },
        expiry_date: { type: Date, default: null },
        status: { type: Number, default: -1 }
    }
});

// Default value for `documents` field
const defaultDocuments = {
    rc: {
        number_plate_front: "",
        number_plate_back: "",
        image: "",
        status: -1
    },
    pollution_certificate: {
        image: "",
        expiry_date: null,
        status: -1
    },
    vehicle_image: {
        front_image: "",
        left_image: "",
        right_image: "",
        back_image: "",
        status: -1
    },
    vehicle_permit: {
        type: "",
        issue_date: null,
        expiry_date: null,
        image: "",
        status: -1
    },
    insurance: {
        image: "",
        expiry_date: null,
        status: -1
    }
};

// Car Schema
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
    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Provider',
        default: null
    },
    documents: {
        type: documentSchema,
        default: defaultDocuments // Set default value for the entire `documents` field
    }
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

const carModel = mongoose.model('Car', CarSchema);

module.exports = carModel;
