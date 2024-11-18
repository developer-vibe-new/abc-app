const mongoose = require("mongoose");
const { type } = require("os");
const Schema = mongoose.Schema;

var rentalSchema = new Schema({
    packages: {
        type: Object
    },

}, {
    timestamps: { createdAt: 'created', updatedAt: 'updated' },
});

module.exports.rental = mongoose.model('rental', rentalSchema);