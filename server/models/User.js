const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: [9, 'Username must be at least 9 characters'] 

  },
  password: {
    type: String,
    required: true,
    minlength: [9, 'Username must be at least 9 characters'] 

  }
});



module.exports = mongoose.model('User', UserSchema);