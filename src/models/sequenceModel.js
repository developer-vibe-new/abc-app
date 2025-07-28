const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var SequenceSchema = new Schema({
    model_name: {
        type: String,
        required: true
    },

    seq: {
        type: Number,
        default: 0
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


SequenceSchema.statics.getNext = async function getNext(model_name) {
    return await this.findOneAndUpdate(
        { model_name: model_name },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
    );
};


/*SequenceSchema.methods.getNext = function(cb) {
    return this.model('Sequence').findAndModify({
        query: {
            model_name: this.model_name
        },
        update: {
            $inc: {
                seq: 1
            }
        },
        new: true
    }, cb);
};
*/
//make this available to our users in Node applications
module.exports.Sequence = mongoose.model('Sequence', SequenceSchema);