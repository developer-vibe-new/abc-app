const mongoose = require("mongoose");
const { type } = require("os");
const Schema = mongoose.Schema;

var rentalSchema = new Schema({
    packages: {
        type: Schema.Types.Mixed
    },

}, {
    timestamps: { createdAt: 'created', updatedAt: 'updated' },
});

module.exports = mongoose.model('rental', rentalSchema);