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

module.exports = mongoose.model('rental', rentalSchema);