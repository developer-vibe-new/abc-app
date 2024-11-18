const GeoJSON = require('mongoose-geojson-schema');
const mongoose = require("mongoose"),
  ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;



var ZoneSchema = new Schema({

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