const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var ChatSchema = new Schema({
    ride_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride'
    },
    type: {
        type: String,
        default: "user"
    },
    msg: {
        type: String
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

//make this available to our users in Node applications
module.exports.Chat = mongoose.model('chat', ChatSchema);
