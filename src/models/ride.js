const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema({

	basic: {
		ride_type: {
			type: String,
			default: "taxi"
		},

		ridestationtype: {
			type: String,
			default: "daily"
		},

		planId: {
			type: String,
			default: ""
		},

		distance: {
			type: String,
			default: "0"
		},

		pickup_distance: {
			type: String,
			default: "0"
		},

		bookdistance: {
			type: String,
			default: "0"
		},

		way: {
			type: Number,
			default: 1
		},

		booked_by: {
			type: String,
			default: "user"
		},
		schedule: {
			type: Boolean,
			default: false
		},

		reminder_sent: {
			type: Boolean,
			default: false
		},

		// requested, declined, accepted, cancelled, arrived, running, finished, scheduled, failed
		//failed in case of schedule ride failure
		ride_status: {
			type: String,
			default: "requested",
			// required: true
		},

		ride_edit_status: {
			type: String,
			default: "",
		},

		otp: {
			type: String,
			default: "",
		},

		ride_payment: {
			type: Boolean,
		},

		payment_type: {
			type: String,
			default: "cash",
			// required: true
		},

		razorpay_orderId: {
			type: String,
			default: "",
		},

		razorpay_paymentId: {
			type: String,
			default: "",
		},

		razorpay_refundId: {
			type: String,
			default: "",
		},

		NoPaymentReason: {
			type: String,
			default: "",
		},

		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user'
		},

		provider_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'provider'
		},
		// Customer Stripe Id 
		stripe_id: {
			type: String
		},
		// Driver Stripe Id 
		merchantStripe_id: {
			type: String
		},

		providername: {
			type: String,
			default: ""
		},

		cancelled_by: {
			type: String
		},

		cancel_reason: {
			type: String
		},

		vehicle: {
			title: {
				type: String
			},
			plateno: {
				type: String
			},
			color: {
				type: String
			}
		},

		is_rated: {
			type: Boolean,
			default: false
		},

		rating: {
			type: String
		},

		comment: {
			type: String
		},

		is_driver_rated: {
			type: Boolean,
			default: false
		},

		driver_rating: {
			type: String
		},

		driver_comment: {
			type: String
		},

		instructions: {
			type: String,
			default: ''
		}
	},
	time: {
		ride_on: {
			type: Date,
			// get: MODALFUNC.string_ts,
			// set: MODALFUNC.ts_string
		},
		booked: {
			type: Date,
			// get: MODALFUNC.string_ts
		},
		accepted: {
			type: Date,
			// get: MODALFUNC.string_ts,
			// set: MODALFUNC.ts_string
		},
		arrived: {
			type: Date,
			// get: MODALFUNC.string_ts
		},
		cancelled: {
			type: Date,
			// get: MODALFUNC.string_ts
		},
		started: {
			type: Date,
			// get: MODALFUNC.string_ts,
			// set: MODALFUNC.ts_string
		},
		finished: {
			type: Date,
			// get: MODALFUNC.string_ts
		}
	},
	location: {
		source: {
			longitude: {
				type: Number,
				// required: true
			},
			latitude: {
				type: Number,
				// required: true
			},
			address: {
				type: String,
				// required: true
			}
		},

		destination: {
			longitude: {
				type: Number,
				default: 0
			},
			latitude: {
				type: Number,
				default: 0
			},
			address: {
				type: String,
				default: ""
			}
		},

		stops: {
			type: [{
				longitude: {
					type: String
				},
				latitude: {
					type: String
				},
				address: {
					type: String
				},
				reachedstatus: {
					type: Boolean,
					default: false
				},
				toBeSeen: {
					type: Boolean,
					default: true
				},
				_id: false,
			}],
			default: []
		},


		arrived: {
			longitude: {
				type: Number
			},
			latitude: {
				type: Number
			},
			address: {
				type: String
			}
		},

		started: {
			longitude: {
				type: Number
			},
			latitude: {
				type: Number
			},
			address: {
				type: String
			}
		},

		finished: {
			longitude: {
				type: Number
			},
			latitude: {
				type: Number
			},
			address: {
				type: String
			}
		},

		accepted: {
			longitude: {
				type: Number
			},
			latitude: {
				type: Number
			},
			address: {
				type: String
			}
		},
		path: {
			type: String,
			default: "",
		}
	},
	outstation: {
		startkm: {
			type: String,
			default: "",
		},
		startimage: {
			type: String,
			default: "",
		},
		endkm: {
			type: String,
			default: "",
		},
		endimage: {
			type: String,
			default: "",
		}
	},

	meta: {
		category_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'taxi_type'
		},

		city_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'City'
		},

		zone_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Zone'
		},

		taxi_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'provider_taxi'
		},

		search_providers: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'provider'
		}],

		declined_providers: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'provider'
		}],

		skip_providers: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'provider'
		}],
		schedule_canclled_providers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Provider",
			},
		],
		is_reported: {
			type: Boolean
		}
	},
	payment: {
		card: {
			number: String,
			is_default: Boolean,
			brand: String,
			name: String,
			card_id: String
		},
		earnratiodata: {
			type: Number,
			default: 0
		},
		totalcharges: {
			type: Number,
			default: 0
		},
		fare_estimate: {
			type: Number
		},

		per_km: {
			type: Number,
			default: 0
		},

		base_fixed_fare: {
			type: Number,
			default: 0
		},

		onlinepayment: {
			type: Number,
			default: 0
		},

		airportcharge: {
			type: Number,
			default: 0
		},

		airportstatus: {
			type: Boolean,
			default: false
		},

		offlinepayment: {
			type: Number,
			default: 0
		},

		refund: {
			type: Number,
			default: 0
		},

		base_fare: {
			type: Number
		},

		gst_per: {
			type: Number
		},

		gst_value: {
			type: Number
		},

		pst_per: {
			type: Number
		},

		pst_value: {
			type: Number
		},

		fare_charged: {
			type: Number
		},

		waiting_second: {
			type: Number
		},
		waiting_charge: {
			type: Number
		},
		flatrate: {
			type: String
		},
		extrapaynote: {
			type: String,
			default: ''
		}
	},
	invoice_no: {
		type: Number
	},
	offer: {
		offercode: {
			type: String,
			default: ""
		},
		offer_id: {
			type: String,
			default: ""
		},
		beforefare: {
			type: Number,
			default: 0
		},
		afterfare: {
			type: Number,
			default: 0
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



// RideSchema.path('created').get(MODALFUNC.string_ts);
// RideSchema.path('updated').get(MODALFUNC.string_ts);


// RideSchema.virtual('basic.path_image').get(function () {
// 	if (this.basic.ride_status == "finished") {
// 		return process.env.RIDE_DISPLAY_PATH + 'img' + this._id.toString() + '.png';
// 	} else {
// 		return "";
// 	}
// });

// RideSchema.virtual('basic.path_image2').get(function () {
// 	if (this.basic.ride_status == "finished") {
// 		return process.env.RIDE_DISPLAY_PATH + 'img2' + this._id.toString() + '.png';
// 	} else {
// 		return "";
// 	}
// });

// RideSchema.pre('save', function (next) {
// 	var ride = this;

// 	// eslint-disable-next-line no-undef
// 	Sequence.getNext("ride", function (err, seqObj) {
// 		if (err) {
// 			if (err) return next(err);
// 		} else {


// 			var str = seqObj.seq;
// 			ride.invoice_no = str;

// 			next();
// 		}
// 	});
// });

//make this available to our users in Node applications
module.exports = mongoose.model('Ride', RideSchema);