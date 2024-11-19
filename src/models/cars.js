const mongoose = require("mongoose");

const CarSchema = new mongoose.Schema({
    title: {
        type: String
    },
    make: {
        type: String
    },
    model: {
        type: String
    },
    year: {
        type: String
    },
    type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaxiType'
    }],
    is_active: {
        type: Boolean,
        default: true
    },
    city_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City'
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

// CarSchema.virtual('icon_thumb').get(function() {
//     if (this.icon != undefined && this.icon != '' && this.icon != null) {
//         return urljoin(process.env.ICON_DISPLAY_PATH, 'thumb_2x', this.icon);
//     } else {
//         return "";
//     }
// });

//make this available to our users in Node applications
module.exports = mongoose.model('Car', CarSchema);
