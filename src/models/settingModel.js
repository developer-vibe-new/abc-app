const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    online_payment: {
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
    outstation_instruction: {
		type: String,
	},
    rental_instruction: {
		type: String,
	},
});

const settingModel = mongoose.model('setting', settingSchema);

module.exports = settingModel;