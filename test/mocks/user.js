/**
 * Using hardcoded data printed from faker test utilities
 * because using faker to gennerate data directly (data is
 * saved in variables so assertions can be called on them)
 * sometimes produces inconsistent results and breaks the tests
 */
const valid_signup_user = {
  email: 'Hildegard68@yahoo.com',
  password: 'valid_password',
  username: 'Hildegard50',
  displayname: 'Hildegard Goodwin',
};

const admin_user = {
  email: 'Juwan_Nolan6@yahoo.com',
  password: 'valid_password',
  username: 'Juwan.Nolan',
  displayname: 'Juwan Nolan',
  give_admin_priviledges: true,
};

const alternate_signup_user = {
  email: 'Dario.Grimes96@yahoo.com',
  password: 'valid_password',
  username: 'Dario67',
  displayname: 'Dario Grimes',
};

const moderator_user = {
  email: 'Jarvis_Boyer@hotmail.com',
  password: 'valid_password',
  username: 'Jarvis_Boyer',
  displayname: 'Jarvis Boyer',
  give_mod_priviledges: true,
};

const modified_user = {
  email: 'Allene29@hotmail.com',
  username: 'Allene_Kassulke',
  displayname: 'Allene Kassulke',
};

module.exports.valid_signup_user = valid_signup_user;

module.exports.alternate_signup_user = alternate_signup_user;

module.exports.admin_user = admin_user;

module.exports.moderator_user = moderator_user;

module.exports.modified_user = modified_user;

module.exports.invalid_signup_no_email = {
  password: valid_signup_user.password,
  username: valid_signup_user.username,
  first_name: valid_signup_user.first_name,
  family_name: valid_signup_user.family_name,
};

module.exports.valid_login = {
  email: valid_signup_user.email,
  password: valid_signup_user.password,
};

module.exports.invalid_login = {
  email: 'invalid@email.com',
  password: 'invalid_password',
};
