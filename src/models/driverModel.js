const mongoose = require("mongoose"),
	ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;
var DriverSchema = new Schema({

	provider_no: {
		type: String
	},

	city_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'City',
		default: null
	},

	// Basic details of user name, email
	first_name: {
		type: String,
		default: ""

	},

	last_name: {
		type: String,
		default: ""

	},

	full_name: {
		type: String,

	},

	email: {
		type: String,
		default: ""
	},

	mobile: {
		type: String
	},

	callingmobile: {
		type: String
	},

	country_code: {
		type: String,
		default: "+91"
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
	// os will be 'android'  or 'ios'
	os: {
		type: String
	},
	image: {
		type: String
	},

	// latest arn token
	arn_token: {
		type: String
	},
	fcm_token: {
		type: String,
		default: ""
	},
	// login token dynamically generated while login to authenticate user in furthure api
	login_token: {
		type: String,
		index: true
	},


	// flag to define if user is active or not, admin can manage this flag from admin panel
	is_active: {
		type: Boolean,
		default: true
	},

	// is_owner: {
	// 	type: Boolean,
	// 	default: false
	// },

	// parent: {
	// 	type: mongoose.Schema.Types.ObjectId,
	// 	default: null
	// },

	comment: {
		type: String
	},

	ridereceive: {
		type: Boolean,
		default: true
	},

	// profile status registered, mobile_verified, card_verified, complete
	profile_status: {
		type: String,
		default: "registered"
	},


	// if user is varified his/her email address then this will be 1
	email_verified: {
		type: Boolean,
		default: false
	},

	// verificaiton_token will be sent in activation email in encryt format and will be used
	// to activate user once activation is clicked
	verification_token: {
		type: String
	},

	// reset_token will be sent in reset password email in encryt format and will be used
	// to verify the user
	reset_token: {
		type: String
	},

	// If this flag will be false user will not get any kind of push notification.
	is_notify: {
		type: Boolean,
		default: true
	},

	// If this flag will be false provider is not online, and if true means provider is online.
	is_online: {
		type: Boolean,
		default: false
	},

	is_outstation: {
		type: Boolean,
		default: true
	},

	is_rental: {
		type: Boolean,
		default: true
	},

	// If customer is in a ride
	in_ride: {
		type: Boolean,
		default: false
	},

	goToHome: {
		type: Boolean,
		default: false
	},

	// If customer is in a ride, ride_id
	ride_id: {
		type: mongoose.Schema.Types.ObjectId
	},

	online_taxi: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ProviderTaxi'
	},

	rated: {
		type: Number,
		default: 0
	},

	total_rating: {
		type: Number,
		default: 0
	},

	total_earnings: {
		type: Number,
		default: 0
	},

	total_rides: {
		type: Number,
		default: 0
	},

	mobileDetails: {
		type: String,
		default: "mobile"
	},

	pending_amount: {
		type: Number,
		default: 0
	},
	login_time: {
		type: Date,
		
	},
	device_id: {
		type: String,
		default: ''
	},
	last_notification: {
		type: Date,
		default: Date.now
	},

	last_active: {
		type: Date,
		default: Date.now
	},

	// Badge to show unread notifications
	badge: {
		type: Number,
		default: 0
	},

	other_info: {
		type: Schema.Types.Mixed
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
	city_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'City'
	},
	zone_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Zone'
	},
	subzone_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'SubZone'
	},
	// en and fr
	language: {
		type: String,
		default: "en"
	},
	//This is for Stripe Bank Account Stores 
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

	//This is Stripe Merchent Id
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
	//This is for Payout Enable on stripe
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

	gotohometime: {
		type: Date
	},
	//This is for Payment Accpted Enable on stripe
	stripe_charges_enabled: {
		type: Boolean,
		default: false
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





DriverSchema.pre('save', function (next) {

	var user = this;
	Sequence.getNext("Driver", function (err, seqObj) {
		if (err) {
			if (err) return next(err);
		} else {
			var str = "" + seqObj.seq
			var pad = "00000"
			user.customer_no = pad.substring(0, pad.length - str.length) + str;
			next();
		}
	});
});



//http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt
DriverSchema.pre('save', function (next) {

	var user = this;

	// only hash the password if it has been modified (or is new)
	if (!user.isModified('password')) return next();

	// generate a salt
	bcrypt.genSalt(10, function (err, salt) {
		if (err) return next(err);

		// hash the password using our new salt
		bcrypt.hash(user.password, salt, function (err, hash) {
			if (err) return next(err);

			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});
});


DriverSchema.virtual('profile_photo').get(function () {
	if (this.photo != undefined && this.photo != '' && this.photo != null) {
		return urljoin(process.env.DRIVER_DISPLAY_PATH, this.photo);
	} else {
		return "";
	}
});

DriverSchema.virtual('avg_rating').get(function () {


	if (this.total_rating == 0 || this.rated == 0) {
		return 0;
	} else {
		return parseFloat((this.total_rating / this.rated).toFixed(1));
	}
});

//make this available to our users in Node applications
module.exports.Driver = mongoose.model('Driver', DriverSchema);
