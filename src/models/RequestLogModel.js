const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MODALFUNC = require('./model_functions').functions;

var RequestLogSchema = new Schema({
    basic: {
        ride_type: {
            type: String,
            default: "taxi"
        },
        schedule: {
            type: Boolean,
            default: false
        },
        ride_status: {
            type: String,
            default: "requested",
            required: true
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        razorpay_orderId: {
            type: String,
            default: "",
        },

        razorpay_paymentId: {
            type: String,
            default: "",
        },

        razorpay_refundId: {
            type: String,
            default: "",
        },
    },
    location: {
        source: {
            longitude: {
                type: Number,
                required: true
            },
            latitude: {
                type: Number,
                required: true
            },
            address: {
                type: String,
                required: true
            }
        },
        destination: {
            longitude: {
                type: Number,
                default: 0
            },
            latitude: {
                type: Number,
                default: 0
            },
            address: {
                type: String,
                default: ""
            }
        }
    },
    meta: {
        category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TaxiType'
        },
        city_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City'
        },
        zone_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zone'
        }
    },
    payment: {
        fare_estimate: {
            type: Number
        },

        onlinepayment: {
            type: Number,
            default: 0
        },

        offlinepayment: {
            type: Number,
            default: 0
        },

        refund: {
            type: Number,
            default: 0
        },
    },
    time: {
        ride_on: {
            type: Date,
            get: MODALFUNC.string_ts,
            set: MODALFUNC.ts_string
        }
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

RequestLogSchema.path('created').get(MODALFUNC.string_ts);
RequestLogSchema.path('updated').get(MODALFUNC.string_ts);
module.exports.RequestLog = mongoose.model('RequestLog', RequestLogSchema, 'request_logs');