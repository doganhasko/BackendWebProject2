const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(value) {
        return !/\d/.test(value);
      },
      message: 'Username cannot contain numbers'
    },
    minlength: [5, 'Username must be at least 5 characters']
  
  },
  password: {
    type: String,
    required: true,
    minlength: [5, 'Password must be at least 5 characters'] 

  },

  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(value) {
        return /\S+@\S+\.\S+/.test(value);
      },
      message: 'Invalid email format'
    }
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(value) {
        // Check if the phone number starts with '+32'
        return value.startsWith('+32');
      },
      message: 'Phone number must start with +32'
    }
  },
  address: {
    type: String, 
    required: false
  }
});



module.exports = mongoose.model('User', UserSchema);