const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
	state: {
		type: String,
		required: true,
		unique: true
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
	},
	versionKey: false
});




//make this available to our users in Node applications
module.exports = mongoose.model('State', stateSchema);
