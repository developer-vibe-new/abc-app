const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const rentalSchema = new mongoose.Schema({
    packages: {
        type: Schema.Types.Mixed
    },

}, {
    timestamps: { createdAt: 'created', updatedAt: 'updated' },
});

module.exports = mongoose.model('rental', rentalSchema);