const User = require('mongoose').model('User');

module.exports.unsuspend_user = async (user_id) => {
  const user = await User.findByIdAndUpdate(user_id, {
    suspended: false,
    suspension_timeline: null,
  }, { new: true });
  return user;
};
