const { model } = require('mongoose');
const passport = require('passport');
const utils = require('../utils/user');
const { ApiException } = require('../utils/error');

const User = model('User');

module.exports.signup = async (req, res, next) => {
  try {
    if (!req.body.user) {
      throw new ApiException({
        message: 'You need to supply the user object with this request',
        status: 400,
      });
    }

    if (
      !req.body.user.username
        || !req.body.user.password
        || !req.body.user.email
        || !req.body.user.first_name
        || !req.body.user.family_name
    ) {
      // generic error message since there will be frontend validation
      throw new ApiException({
        message: 'Required form values need to be complete!',
        status: 400,
      });
    }

    const user = new User({
      username: req.body.user.username,
      email: req.body.user.email,
      first_name: req.body.user.first_name,
      family_name: req.body.user.family_name,
    });

    user.setPassword(req.body.user.password);

    if (req.body.user.give_admin_priviledges) {
      user.user_type = 'admin';
    }

    if (req.body.user.give_mod_priviledges) {
      user.user_type = 'moderator';
    }

    await user.save();
    return res.json({ user: user.toAuthJsonFor() });
  } catch (err) {
    next(err);
  }
};

module.exports.login = (req, res, next) => {
  if (!req.body.user) {
    throw new ApiException({
      message: 'You need to supply the user object with this request',
      status: 400,
    });
  }

  if (!req.body.user.email) {
    throw new ApiException({
      message: 'Email can\'t be blank',
      status: 422,
    });
  }

  if (!req.body.user.password) {
    throw new ApiException({
      message: 'Password can\'t be blank',
      status: 422,
    });
  }

  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      throw new ApiException({
        status: 422,
        message: info.error.message,
      });
    }
    if (user.suspended && user.suspension_timeline > Date.now()) {
      utils.unsuspend_user(user._id);
    }
    user.token = user.generateJwt();
    return res.json({ user: user.toAuthJsonFor() });
  })(req, res, next);
};

module.exports.get = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      throw new ApiException({ status: 401 });
    }

    if (user.suspended && user.suspension_timeline > Date.now()) {
      user = await User.findByIdAndUpdate().update({
        suspended: false,
        suspension_timeline: null,
      });
    }

    // change returned object depending on who is making the request
    if (req.payload) {
      if (req.payload.id.toString() === user._id.toString()) {
        return res.json({ user: user.toAuthJsonFor() });
      }
      const viewing_user = await User.findById(req.payload.id);
      return res.json({ user: user.toObjectJsonFor(viewing_user) });
    }
    return res.json({ user: user.toObjectJsonFor() });
  } catch (err) {
    next(err);
  }
};

module.exports.update = async (req, res, next) => {
  try {
    if (!req.body.user) {
      throw new ApiException({
        message: 'You need to supply the user object with this request',
        status: 400,
      });
    }

    const request_user = await User.findById(req.params.id);
    if (request_user._id.toString() !== req.payload.id.toString()) {
      throw new ApiException({
        message: 'Cannot edit another user\'s profile!',
        status: 400,
      });
    }
    const user = await User.findByIdAndUpdate(req.payload.id, req.body.user, { new: true });
    if (!user) {
      throw new ApiException({ status: 401 });
    }
    return res.json({ user: user.toAuthJsonFor() });
  } catch (err) {
    next(err);
  }
};

module.exports.suspend = async (req, res, next) => {
  try {
    const super_user = await User.findById(req.payload.id);
    if (!super_user) {
      throw new ApiException({ status: 401 });
    }
    if (super_user.user_type !== 'admin' && super_user.user_type !== 'moderator') {
      throw new ApiException({
        message: 'You have to be an admin or a moderator to perform this action',
        status: 401,
      });
    }

    const user = await utils.suspend_user(req.params.id);
    return res.json({ user: user.toObjectJsonFor(user) });
  } catch (err) {
    next(err);
  }
};

module.exports.follow = async (req, res, next) => {
  try {
    const user_id = req.payload.id;
    const user = await User.findById(user_id);
    const target_user = await User.findById(req.params.id);
    if (!user) {
      throw new ApiException({ status: 401 });
    }
    if (user.isFollowing(target_user._id)) {
      throw new ApiException({
        message: 'You are already following this user',
        status: 400,
      });
    }

    await user.follow(target_user);
    const count = await User.countDocuments({ followers: { $in: [user._id] } });
    await target_user.updateFollowerCount(count);
    return res.json({
      user: user.toObjectJsonFor(target_user),
      target_user: target_user.toObjectJsonFor(user),
    });
  } catch (err) {
    next(err);
  }
};

module.exports.unfollow = async (req, res, next) => {
  try {
    const user_id = req.payload.id;
    const user = await User.findById(user_id);
    const target_user = await User.findById(req.params.id);
    if (!user) {
      throw new ApiException({ status: 401 });
    }
    if (!user.isFollowing(target_user._id)) {
      throw new ApiException({
        message: 'You don\'t follow this user',
        status: 400,
      });
    }

    await user.unfollow(target_user);
    const count = await User.countDocuments({ followers: { $in: [user._id] } });
    await target_user.updateFollowerCount(count);
    return res.json({
      user: user.toObjectJsonFor(target_user),
      target_user: target_user.toObjectJsonFor(user),
    });
  } catch (err) {
    next(err);
  }
};
