const mongoose = require("mongoose"),
	ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;



var stateSchema = new Schema({
	state: {
		type: String,
		required:true
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




//make this available to our users in Node applications
module.exports.State = mongoose.model('State', stateSchema);
