const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var NotificationSchema = new Schema({
	activity: {
		type: String,
	},
	user_type: {
		type: String
	},
	user_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	provider_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Provider'
	},
	ride_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Ride'
	},
	msg: {
		type: String
	},
	live_on: {
		type: Date,
		default: Date.now
	},
	is_sent: {
		type: Number,
		default: 1
	}
},
	{
		timestamps: true,
		versionKey: false
	}
);
// we need to create a model to use it
module.exports.Notification = mongoose.model('notification', NotificationSchema);
