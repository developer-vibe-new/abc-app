const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

// const adminRegisterSchema = new Schema({
//     username: {
//         type: String,
//         required: true
//     },
//     email: {
//         type: String,
//         required: true
//     },
//     password: {
//         type: String,
//         required:true
//     },
//     auth_key:{
//         type:String,
//         default:""
//     }
// }, {
//     timestamps: {
//         createdAt: 'created',
//         updatedAt: 'updated'
//     }
// });


const adminRegisterSchema = new mongoose.Schema({


	// Role type to seprate super_admin and admins
	/*
		super_admin, admin, 
	*/
	role_type: {
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
		required: true
	},

	// Basic details of user name, email
	last_name: {
		type: String,
		required: true
	},

	email: {
		type: String
	},

	mobile: {
		type: String
	},

	password: {
		type: String,
		// select: false
	},

	// flag to define if user is active or not, admin can manage this flag from admin panel
	is_active: {
		type: Boolean,
		default: true
	},

	// if user is varified his/her email address then this will be 1
	is_verified: {
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

	permissions: [{ type: String }]

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


adminRegisterSchema.pre('save', function (next) {

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

module.exports = mongoose.model('Admin', adminRegisterSchema);