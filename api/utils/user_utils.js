const User = require('mongoose').model('User');

module.exports.unsuspend_user = async (user_id) => {
  const user = await User.findByIdAndUpdate(user_id, {
    suspended: false,
    suspension_timeline: null,
  }, { new: true });
  return user;
};

module.exports.suspend_user = async (user_id) => {
  const user = await User.findByIdAndUpdate(user_id, {
    suspended: true,
    suspension_timeline: Date.now() + 21600000, // 6 hours - default
  }, { new: true });
  return user;
};
