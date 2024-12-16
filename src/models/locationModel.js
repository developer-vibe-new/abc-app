const mongoose = require("mongoose"),
	ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
const MODALFUNC = require('./model_functions').functions;

var Provider = require('./Provider').Provider;
var TaxiType = require('./TaxiType').TaxiType;
var Zone = require('./Zone').Zone;

var LocationSchema = new Schema({

    provider_id: {
        type: mongoose.Schema.Types.ObjectId,
		ref: 'Provider'
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
	location: {
		type: [Number]
	},

	gotohomelocation: {
		type: [Number],
		default:""
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



LocationSchema.path('created').get(MODALFUNC.string_ts);
LocationSchema.path('updated').get(MODALFUNC.string_ts);

LocationSchema.index({
	"location": '2dsphere',
	"gotohomelocation":'2dsphere',
});

//make this available to our users in Node applications
module.exports.Location = mongoose.model('Location', LocationSchema);