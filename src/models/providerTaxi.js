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
		ref: 'Operator',
		defaut: null
	},
	plateno: {
		type: String,
		required: false
	},
	documents: {
		type: documentSchema,
		default: defaultDocuments // Set default value for the entire `documents` field
	},
	// engine: {
	// 	type: String,
	// 	default: ""
	// },
	// pst_no: {
	// 	type: String,
	// 	default: ""
	// },
	// gst_no: {
	// 	type: String,
	// 	default: ""
	// },
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
	city_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'City'
	},
	is_active: {
		type: Boolean,
		default: true
	},
	status: {
		type: Boolean,
		default: false
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

const providerTaxiMoodel = mongoose.model('provider_taxi', ProviderTaxiSchema);
module.exports = providerTaxiMoodel;