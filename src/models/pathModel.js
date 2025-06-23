const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var PathSchema = new Schema({

    // if city_id doesn't exists, will consider it as global price.
    ride_id: {
        type: mongoose.Schema.Types.ObjectId
    },

    // requested, declined, accepted, cancelled, arrived, running, finished
    ride_status: {
        type: String,
        default: "requested",
        required: true
    },

    loc: {
        type: [Number]
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


//make this available to our users in Node applications
module.exports = mongoose.model('Path', PathSchema);