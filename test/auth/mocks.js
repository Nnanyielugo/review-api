module.exports.valid_signup_user = {
  email: 'test@email.com',
  password: 'test_password',
  username: 'test_username',
  first_name: 'test_firstname',
  family_name: 'test_familyname',
};

module.exports.invalid_signup_no_email = {
  password: 'test_password',
  username: 'test_username',
  first_name: 'test_firstname',
  family_name: 'test_familyname',
};

module.exports.valid_login = {
  email: 'test@email.com',
  password: 'test_password',
};

module.exports.invalid_login = {
  email: 'invalid@email.com',
  password: 'test_password',
};
