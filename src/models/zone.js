const mongoose = require("mongoose");

const ZoneSchema = new mongoose.Schema({

  type: {
    type: String,
    default: "Feature"
  },

  properties: {
    Name: {
      type: String,
      required: true
    }
  },

  city_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City'
  },

  geometry: mongoose.Schema.Types.GeoJSON
});


module.exports = mongoose.model('Zone', ZoneSchema);