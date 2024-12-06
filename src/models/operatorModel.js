const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    pancard: {
        name: { type: String, default: "" },
        number: { type: String, default: "" },
        status: { type: Number, default: 0 },
    },
    aadharcard: {
        name: { type: String, default: "" },
        number: { type: Number, default: null },
        status: { type: Number, default: 0 },
    },
    bank: {
        account_number: { type: Number, default: null },
        ifsc_code: { type: String, default: "" },
        bank_name: { type: String, default: "" },
        account_holder_name: { type: String, default: "" },
        status: { type: Number, default: 0 },
    }
});

const operatorSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        true: true
    },
    phone: {
        type: Number,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        default: "unblock"
    },
    is_active: {
        type: Boolean,
        default: false
    },
    otp: {
        type: Number
    },
    documents: documentSchema,
    kycStatus: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        default: "operator"  
    },
    token: {
        type: String
    }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('operator', operatorSchema);
