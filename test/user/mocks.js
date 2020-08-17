module.exports.valid_signup_user = {
  email: 'test@email.com',
  password: 'test_password',
  username: 'test_username',
  first_name: 'test_firstname',
  family_name: 'test_familyname',
};

module.exports.alternate_signup_user = {
  email: 'alternate_test@email.com',
  password: 'alternate_test_password',
  username: 'alternate_test_username',
  first_name: 'alternate_test_firstname',
  family_name: 'alternate_test_familyname',
};

module.exports.admin_signup_user = {
  email: 'admin_test@email.com',
  password: 'admin_test_password',
  username: 'admin_test_username',
  first_name: 'admin_test_firstname',
  family_name: 'admin_test_familyname',
  give_admin_priviledges: true,
};

module.exports.moderator_signup_user = {
  email: 'moderator_test@email.com',
  password: 'moderator_test_password',
  username: 'moderator_test_username',
  first_name: 'moderator_test_firstname',
  family_name: 'moderator_test_familyname',
  give_mod_priviledges: true,
};

module.exports.modified_user = {
  email: 'modified_test@email.com',
  username: 'modified_test_username',
  first_name: 'modified_test_firstname',
  family_name: 'modified_test_familyname',
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
