const mongoose = require('mongoose');

const providerTaxiSchema = new mongoose.Schema({
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

const defaultproviderTaxiDocuments = {
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

const documentSchema = new mongoose.Schema({
	driving_license: {
		number: { type: String, default: "" },
		expiry_date: { type: Date, default: null },
		front_image: { type: String, default: "" },
		back_image: { type: String, default: "" },
		status: { type: Number, default: -1 }
	},
	aadhaar_card: {
		number: { type: String, default: "" },
		name: { type: String, default: "" },
		status: { type: Number, default: -1 }
	},
	pan_card: {
		name: { type: String, default: "" },
		number: { type: String, default: "" },
		status: { type: Number, default: -1 }
	},
	bank_details: {
		account_number: { type: Number, default: null },
		ifsc_code: { type: String, default: "" },
		bank_name: { type: String, default: "" },
		account_holder_name: { type: String, default: "" },
		status: { type: Number, default: -1 }
	}
});

const defaultDocuments = {
	driving_license: {
		number: "",
		expiry_date: null,
		front_image: "",
		back_image: "",
		status: -1
	},
	aadhaar_card: {
		number: "",
		front_image: "",
		back_image: "",
		status: -1
	}
};

const providerSchema = new mongoose.Schema({
	first_name: {
		type: String,
		default: ""

	},
	documents: {
		type: documentSchema,
		default: defaultDocuments
	},
	providerTaxiDocuments: {
		type: providerTaxiSchema,
		default: defaultproviderTaxiDocuments
	},
	providerTaxi_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'provider_taxi',
		default: null
	},
	operator_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Operator',
		default: null
	},
	last_name: {
		type: String,
		default: ""

	},
	taxi_type: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'taxi_type',
		default: null

	},
	full_name: {
		type: String,
	},
	city_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'City',
		default: null
	},
	comment: {
		type: String,
	},
	email: {
		type: String,
		default: ""
	},
	mobile: {
		type: String
	},
	password: {
		type: String,
		select: false
	},
	balance: {
		type: Number,
		default: 0
	},
	pending_balance: {
		type: Number,
		default: 0
	},
	os: {
		type: String,
		default: ""
	},
	profile_image: {
		type: String,
		default: ""
	},
	arn_token: {
		type: String
	},
	fcm_token: {
		type: String,
		default: ""
	},
	login_token: {
		type: String,
		index: true
	},
	is_active: {
		type: Boolean,
		default: true
	},
	ridereceive: {
		type: Boolean,
		default: true
	},
	profile_status: {
		type: String,
		default: "registered"
	},
	email_verified: {
		type: Boolean,
		default: false
	},
	is_notify: {
		type: Boolean,
		default: true
	},
	is_online: {
		type: Boolean,
		default: false
	},
	is_outstation: {
		type: Boolean,
		default: true
	},
	in_ride: {
		type: Boolean,
		default: false
	},

	goToHome: {
		type: Boolean,
		default: false
	},
	ride_id: {
		type: mongoose.Schema.Types.ObjectId
	},

	online_taxi: {
		type: mongoose.Schema.Types.ObjectId,
	},
	total_earnings: {
		type: Number,
		default: 0
	},

	total_rides: {
		type: Number,
		default: 0
	},
	pending_amount: {
		type: Number,
		default: 0
	},
	device_id: {
		type: String,
		default: ''
	},
	photo: {
		type: String
	},
	otp: {
		type: Number
	},
	zone_id: {
		type: mongoose.Schema.Types.ObjectId
	},
	subzone_id: {
		type: mongoose.Schema.Types.ObjectId
	},
	stripe_id: {
		type: String
	},
	kycStatus: {
		type: Number,
		default: 0
	},
	vehicleStatus: {
		type: Number,
		default: 0
	},
	stripe_verified: {
		type: Boolean,
		default: false
	},
	home_address: {
		type: Object,
	},
	is_delete: {
		type: Boolean,
		default: false
	},
	stripe_charges_enabled: {
		type: Boolean,
		default: false
	},
	status: {
		type: String,
		default: "Unblock"
	},
	total_rating: {
		type: Number,
		default: 0
	},
	rated: {
		type: Number,
		default: 0
	},
}, { timestamps: true, versionKey: false });

providerSchema.virtual('avg_rating').get(function () {
	if (this.total_rating == 0 || this.rated == 0) {
		return 0;
	} else {
		return parseFloat((this.total_rating / this.rated).toFixed(1));
	}
});
module.exports = mongoose.model('provider', providerSchema);

// module.exports = provideModel;