const mongoose = require("mongoose");

const ProviderTaxiSchema = new mongoose.Schema({
	provider_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Provider'
	},

	car_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Car'
	},
	type_ids: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'TaxiType'
	}],
	operator_id: {
		type: mongoose.Schema.Types.ObjectId,
        ref: 'Operator'
	},
	plateno: {
		type: String,
		required: false
	},
	engine: {
		type: String,
		default: ""
	},
	pst_no: {
		type: String,
		default: ""
	},
	gst_no: {
		type: String,
		default: ""
	},
	year: {
		type: String,
		required: false
	},
	registration_no: {
		type: String,
		required: false
	},
	color: {
		type: String
	},
	rc_photo: {
		type: String
	},
	car_photo: {
		type: String
	},
	documents: [{
		_id: mongoose.Schema.Types.ObjectId,
		name: String,
		date: String,
		path: String
	}],
	city_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'City'
	},
	carLeftImage: {
		type: String
	},
	carRigthImage: {
		type: String
	},
	carBackImage: {
		type: String
	},
	carFrontImage: {
		type: String
	},
	is_active: {
		type: Boolean,
		default: true
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

const providerTaxiMoodel = mongoose.model('ProviderTaxi', ProviderTaxiSchema);
//make this available to our users in Node applications
module.exports = providerTaxiMoodel;