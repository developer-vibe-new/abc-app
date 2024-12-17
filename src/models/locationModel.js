const mongoose = require("mongoose"),
	ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

var LocationSchema = new Schema({

    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
		ref: 'Provider',
		unique: true
    },
    
	type_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaxiType'
    }],

    zone_id: {
        type: mongoose.Schema.Types.ObjectId,
		ref: 'Zone'
    },
	// array for ['longitude', 'latitude']
	// searching uses mangodb 2dsphere indexing so longitude must be saved as first element of array
	locations: [
		{
		  type: {
			type: String,
			enum: ['Point'],
			default: 'Point'
		  },
		  coordinates: {
			type: [Number],
			required: true,
			index: '2dsphere'
		  }
		}
	],
	
	gotohomelocation: {
		type: [Number],
		default: null
	},

	bearing: {
		type: Number
	},

	available: {
		type: Boolean,
		default: true
	},

	goToHome: {
		type: Boolean,
		default: false
	},

	blocked: {
		type: Boolean,
		default: false
	},
	driver_type: {
		type: Boolean,
		default: false,//if driver is Tablet Driver then it was to be true
	},
	driver: {
		type: String,
		default: 'mobile'
	},
	time_estimate :{
		type:Number,
		default:5
	},
	lastlocationTime: {
		type: Date
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
const locationModel = mongoose.model('Location', LocationSchema);

module.exports = locationModel;