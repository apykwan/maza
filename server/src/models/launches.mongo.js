const mongoose = require('mongoose');

const launchesSchema = mongoose.Schema({
    flightNumber: {
        type: Number,
        required: true,
        default: 100,
        min: 100,
        max: 999
    },
    launchDate: {
        type: Date,
        required: true
    },
    mission: {
        type: String,
        required: true
    },
    rocket: {
        type: String,
        required: true
    },
    target: {
        type: String
    },
    customers: [ String ],
    upcoming: {
        type: Boolean,
        required: true
    },
    success: {
        type: Boolean,
        required: true,
        default: true
    }
});

// launchesSchema.pre(/^find/, function(next) {
//     this.populate({
//             path: 'target',
//             select: '-__v -_id'
//     });
//     next();
// });

// Connects launchesSchema with the "launches" collection
module.exports = mongoose.model('Launch', launchesSchema);