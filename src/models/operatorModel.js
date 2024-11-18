const mongoose = require('mongoose');

const operatorSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        true: true
    },
    phone: {
        type: Number,
        required: true,
        trim: true,
        unique: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: Boolean,
        default: false
    },
    otp: {
        type: Number
    },
    token: {
        type: String
    }
}, { timestamps: true, versionKey: false });

const operatorModel = mongoose.model('operator', operatorSchema);

module.exports = operatorModel;