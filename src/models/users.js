const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const LocSchema = new mongoose.Schema({
	longitude: {
		type: Number,
		required: true
	},
	latitude: {
		type: Number,
		required: true
	},
	address: {
		type: String,
		required: true
	},
	fav_type: {
		type: String,
		required: true
	}
});
// eslint-disable-next-line no-unused-vars
const userbalance = new mongoose.Schema({
	balance: {
		type: Number,
		default: 0
	},
	bonus: {
		type: Number,
		default: 0
	},
	withdraw: {
		type: Number,
		default: 0
	}
});
const UserSchema = new mongoose.Schema({


	// Role id to seprate normal users from admin
	/*
		customer, provider
	*/
	role_id: {
		type: String,
		default: "customer",
		select: false
	},

	customer_no: {
		type: String
	},
	// userbalance: userbalance,
	// Basic details of user name, email
	first_name: {
		type: String,
		// required: true
		default: ""
	},

	userbalance: {
		type: String,
		default: 0
	},

	// Basic details of user name, email
	last_name: {
		type: String,
		// required: true
		default: ""
	},

	full_name: {
		type: String,
		// required: true
	},

	email: {
		type: String
	},

	mobile: {
		type: String,
		required: true
	},

	country_code: {
		type: String
	},

	password: {
		type: String,
		select: false
	},


	// os will be 'android'  or 'ios'
	os: {
		type: String,
		// required: true,
	},

	// source will be 'email'  or 'social'
	source: {
		type: String,
		// required: true,
		default: ""
	},

	social_type: {
		type: String
	},

	social_id: {
		type: String
	},


	// latest device token of user's logged in device
	arn_token: {
		type: String,
		default: ""
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

	// otp 
	otp: {
		type: String
	},

	mobileDetails: {
		type: String,
		default: "mobile"
	},

	// flag to define if user is active or not, admin can manage this flag from admin panel
	is_active: {
		type: Boolean,
		default: true
	},

	// profile status registered, mobile_verified, complete
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

	profile_image: {
		type: String,
		default: ""
	},

	// If customer is in a ride
	in_ride: {
		type: Boolean,
		default: false
	},

	// If customer is in a ride, ride_id
	ride_id: {
		type: mongoose.Schema.Types.ObjectId
	},

	last_notification: {
		type: Date,
		default: Date.now
	},

	// Badge to show unread notifications
	badge: {
		type: Number,
		default: 0
	},
	stripe_id: {
		type: String
	},
	//save user encrypted card info for Stripe Payment getway
	stripe_card_data: [{
		_id: mongoose.Schema.Types.ObjectId,
		number: String,
		brand: String,
		name: String,
		card_id: String,
		is_default: {
			type: Boolean,
			default: false
		},
	}],
	//save user encrypted card info for Authrize Payment getway use that
	card_data: [{
		_id: mongoose.Schema.Types.ObjectId,
		number: String,

		is_default: {
			type: Boolean,
			default: false
		},
		brand: String,
		name: String,
		card_id: String
	}],

	fav_loc: [LocSchema],

	// en and fr
	language: {
		type: String,
		default: "en"
	},
	login_time: {
		type: Date,
		get: String,
		set: String
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



UserSchema.pre('save', function (next) {

	var user = this;
	// eslint-disable-next-line no-undef
	Sequence.getNext("user", function (err, seqObj) {
		if (err) {
			if (err) return next(err);
		} else {
			var str = "" + seqObj.seq;
			var pad = "00000";
			user.customer_no = pad.substring(0, pad.length - str.length) + str;
			next();
		}
	});
});



//http://devsmash.com/blog/password-authentication-with-mongoose-and-bcrypt
UserSchema.pre('save', function (next) {

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


//make this available to our users in Node applications
module.exports.User = mongoose.model('User', UserSchema);
module.exports.Loc = mongoose.model('Loc', LocSchema);