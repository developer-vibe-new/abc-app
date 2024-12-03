const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({

	transaction_no: {
		type: String
	},

	charge_id: {
		type: String,
		default: "",
	},

	ride_id: {
		type: mongoose.Schema.Types.ObjectId,
		default: null,
	},

	provider_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Provider'
	},

	total: {
		type: Number
	},

	onlinepayment: {
		type: Number,
		default: 0
	},

	offlinepayment: {
		type: Number,
		default: 0
	},

	refund: {
		type: Number,
		default: 0
	},

	p_earn: {
		type: String
	},

	c_earn: {
		type: String
	},

	p_got: {
		type: Number
	},

	c_got: {
		type: Number
	},

	type: {
		type: String,
		default: ""
	},

	pending: {
		type: String
	},

	precede_by: {
		type: Number
	},

	time: {
		accepted: {
			type: Date,

		}, cancelled: {
			type: Date,
		},
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


// TransactionSchema.path('created').get(MODALFUNC.string_ts);
// TransactionSchema.path('updated').get(MODALFUNC.string_ts);


TransactionSchema.pre('save', function (next) {

	var transaction = this;
	// eslint-disable-next-line no-undef
	Sequence.getNext("transaction", function (err, seqObj) {
		if (err) {
			if (err) return next(err);
		} else {
			var str = "" + seqObj.seq;
			var pad = "00000";
			transaction.transaction_no = pad.substring(0, pad.length - str.length) + str;
			next();
		}
	});
});


//make this available to our users in Node applications
module.exports.Transaction = mongoose.model('Transaction', TransactionSchema);