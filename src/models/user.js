import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;
const UserSchema = new Schema({
  // FIXME: Specs call for an 'id' (UUID/v4) field.
  // However, that conflicts with MongoDB's default behavior,
  // creating an ID as a 12-byte BSON byte structure.
  // Additionally, Mongoose automatically adds a getter for
  // 'id' and an implicit '_id' field on Schemas
  // with an ObjectId type to map to MongoDB's behavior.
  // This conflict between Specs and MongoDB behavior must be 
  // resolved before adding an 'id' field.
  // - JB 20200108
  email: {
    type: String,
    required: true,
    index: { unique: true }
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum : ['user', 'admin'],
    default: 'user'
  },
  items : [{
    type: Schema.Types.ObjectId,
    ref: 'Item'
  }]
});

UserSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.password;
    return ret;
  }
});

UserSchema.pre('save', function(next) {
  if (!this.isModified('password')) return next();

  bcrypt.hash(this.password, 10, function(err, hash) {
    if (err) return next(err);

    this.password = hash;
    next();
  });
});

UserSchema.methods.getTokenData = function() {
  return {
    id: this.id,
    email: this.email
  }
};

UserSchema.methods.verifyPassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};

UserSchema.methods.equals = function(user) {
  return this._id == user._id;
};

UserSchema.methods.canRead = function(object) {
  return this.equals(object) ||
    (object.owner && object.owner == this.id) ||
    this.role == "admin";
};

UserSchema.methods.canEdit = function(object) {
  return this.canRead(object); // can be extended later
};

UserSchema.methods.sendGreeting = function() {
  // Specs say to print all SEND actions to console
  console.log(`[ SEND ] 
    To: ${this.email}
    From: hello@ourawesomewebsite.com
    Subject: Registration Confirmation
    Body:
      Welcome, ${this.email}! Thanks for registering for OurAwesomeWebsite.com! Have a great day!

      Cheers!
      - OurAwesomeWebsite.com
  `);
  // Specs require success to be returned to registration process.
  // In real implementation, only return true of the the external sending 
  // process (e.g. mail relay) was successful.
  return true;
}

UserSchema.methods.sendGiftCard = function() {
  // Just a random number 24 digits long
  const giftCardId = new Array(24).fill().map(() => Math.ceil(Math.random() * 9)).join('');

  // Specs say to print all SEND actions to console
  console.log(`[ SEND ] 
    To: ${this.email}
    From: hello@ourawesomewebsite.com
    Subject: Gift Card
    Body:
      Hey, ${this.email}! Because you're so awesome, OurAwesomeWebsite is offering you 
      this awesome gift card. Just enter this code the next time you checkout for 
      50% off your next order:
        
        GC-${giftCardId}

      Cheers!
      - OurAwesomeWebsite.com
  `);
  // Specs require success to be returned to registration process.
  // In real implementation, only return true of the the external sending 
  // process (e.g. mail relay) was successful.
  return true;
}

UserSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', UserSchema);
