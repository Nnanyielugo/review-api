var mongoose = require('mongoose');

var Schema = mongoose.Schema

var genreSchema = Schema({
    name: {type: String, min: 3, max: 100, required: true}
});

//virtual for genre's url

genreSchema
    .virtual('url')
    .get(function(){
        return '/catalog/genre/' + this._id
    });

module.exports = mongoose.model('Genre', genreSchema);