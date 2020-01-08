import mongoose from 'mongoose';
import response from '../helpers/response';
import request from '../helpers/request';
import pagination from '../helpers/pagination';

const User = mongoose.model('User');

exports.list = function(req, res) {
  if (req.currentUser.role != 'admin') return response.sendForbidden(res);
  User.paginate(request.getFilteringOptions(req, ['email', 'role']), request.getRequestOptions(req), function(err, result) {
    if (err) return res.send(err);
    pagination.setPaginationHeaders(res, result);
    res.json(result.docs);
  });
};

exports.read = function(req, res) {
  User.findById(req.params.id, function(err, user) {
    if (err) return response.sendNotFound(res);
    if (!req.currentUser.canRead(user)) return response.sendForbidden(res);
    res.json(user);
  });
};

exports.create = function(req, res) {
  const { email, password } = req.body;

  /* Can test this route via curl:

    curl -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"example"}' "http://localhost:9090/users/"; echo

  */

  // Specs require valid email less than 31 characters long
  if(!email ||
      email.length > 30 ||
     // Borrowed from https://www.regextester.com/19
     !email.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)) {
    return response.sendBadRequest(res, "Invalid email address");
  }

  // Specs require password to be between 6 and 30 characters
  if(!password ||
      password.length < 6 ||
      password.length > 30) {
      return response.sendBadRequest(res, "Invalid password, must be between 6 and 30 characters");
  }

  const validatedData = {
    // ID is automatically assigned by MongoDB
    // See FIXME in user model re: specs
    role: "user",
    email,
    password
  };

  const newUser = new User(validatedData);
  newUser.role = 'user';
  newUser.save(async function(err, user) {
    if (err) {
      return response.sendBadRequest(res, err);
    }
    
    // FIXME in the future, handle processes not succeeding
    await Promise.all([
      user.sendGreeting(),
      user.sendGiftCard()
    ]);

    response.sendCreated(res, user);
  });
};

exports.update = function(req, res) {
  const user = req.body;
  delete user.role;
  if (!req.currentUser.canEdit({ _id: req.params.id })) return response.sendForbidden(res);
  User.findOneAndUpdate({ _id: req.params.id }, user, { new: true, runValidators: true }, function(err, user) {
    if (err) return response.sendBadRequest(res, err);
    res.json(user);
  });
};

exports.delete = function(req, res) {
  User.remove({ _id: req.params.id }, function(err, user) {
    if (err) return res.send(err);
    if (!req.currentUser.canEdit(user)) return response.sendForbidden(res);
    res.json({ message: 'User successfully deleted' });
  });
};

exports.loadUser = function (req, res, next) {
  User.findById(req.params.userId, function (err, user) {
    if (err) return response.sendNotFound(res);
    if (!req.locals) req.locals = {};
    req.locals.user = user;
    next();
  });
};
