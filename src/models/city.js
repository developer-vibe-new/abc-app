const mongoose = require("mongoose"),
    ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

var CitySchema = new Schema({

    // min fare
    name: {
        type: String,
        requried: true
    },
    city: {
        type: String,
        requried: true
    },
    state: {
        type: String,
        requried: true
    },
    country: {
        type: String,
        requried: true
    },
    coordinates: { type: [Number], index: "2dsphere",default:[0,0] },// [longitude, latitude]
    // per kilometer
    icon: {
        type: String
    },
	gst: {
        type: String

    },
	pst: {
        type: String

    },
	earn_ratio: {
        type: String

    },
    is_active: {
        type: Boolean,
        default: true
    }

},{
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
module.exports.City = mongoose.model('City', CitySchema);
