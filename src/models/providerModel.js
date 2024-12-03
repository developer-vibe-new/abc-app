const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
	first_name: {
		type: String,
		default: ""

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
		type: String
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

	documents: [{
		_id: mongoose.Schema.Types.ObjectId,
		name: String,
		date: String,
		path: String
	}],
	zone_id: {
		type: mongoose.Schema.Types.ObjectId
	},
	subzone_id: {
		type: mongoose.Schema.Types.ObjectId
	},
	bank_data: [{
		_id: mongoose.Schema.Types.ObjectId,
		account_holder_type: String,
		account_holder_name: String,
		routing_number: String,
		accountNumber: String,
		bank_name: String,
		bank_id: String,
		is_default: {
			type: Boolean,
			default: false
		},
	}],
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
	}
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('provider', providerSchema);

// module.exports = provideModel;