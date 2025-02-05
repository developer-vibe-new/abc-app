var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SettingSchema = new Schema({

	ios_version: {
		type: String,
		required: true
	},
	ios_link: {
		type: String,
		required: true
	},
	online_payment: {
		type: Boolean,
		default: false,
		required: true
	},
	ios_force_update: {
		type: Boolean,
		default: false,
		required: true
	},
	android_version: {
		type: String,
		required: true
	},
	android_link: {
		type: String,
		required: true
	},
	android_force_update: {
		type: Boolean,
		default: false,
		required: true
	},
	support_no: {
		type: String,
	},

	daily_instruction: {
		type: String,
	},
	rental_instruction: {
		type: String,
	},
	outstation_instruction: {
		type: String,
	},



	driver_ios_version: {
		type: String,
		required: true
	},
	driver_ios_link: {
		type: String,
		required: true
	},
	driver_ios_force_update: {
		type: Boolean,
		default: false,
		required: true
	},
	driver_android_version: {
		type: String,
		required: true
	},
	driver_android_link: {
		type: String,
		required: true
	},
	driver_android_force_update: {
		type: Boolean,
		default: false,
		required: true
	},



	ride_settings: {
		ride_attempt: {
			type: Number,
			default: 1,
			required: true
		},
		request_time: {
			type: Number,
			default: 30,
			required: true
		},
		last_updated: {
			type: Number,
			default: 2,
			required: true
		}
	},
	payment: {
		credit_earn_ratio: {
			type: Number,
			default: 10,
			required: true
		},
		debit_earn_ratio: {
			type: Number,
			default: 10,
			required: true
		},
		notrans_debit_earn_ratio: {
			type: Number,
			default: 10,
			required: true
		},
		trans_cash_earn_ratio: {
			type: Number,
			default: 10,
			required: true
		},
		trans_debit_earn_ratio: {
			type: Number,
			default: 10,
			required: true
		},
		admin_earnRatio: {
			type: Number,
			default: 15,
			required: true
		},
		user_earn_ratio: {
			type: Number,
			default: 20,
			required: true
		},
		driver_earn_ratio: {
			type: Number,
			default: 20,
			required: true
		},
		user_app_charges: {
			type: Number,
			default: 20,
			required: true
		},
		credit_limit: {
			type: Number,
			default: 200,
			required: true
		},
		//vivek add field in setting to manage price fot waiting
		waiting_permin_charge: {
			type: Number,
			default: 0.1,
			required: true
		},
	}

});

module.exports = mongoose.model('setting', SettingSchema);