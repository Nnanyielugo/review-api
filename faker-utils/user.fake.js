const faker = require('faker');

const valid_first = faker.name.firstName();
const valid_last = faker.name.lastName();
const valid_signup_user = {
  email: faker.internet.email(valid_first, valid_last),
  password: 'valid_password',
  username: faker.internet.userName(valid_first, valid_last),
  display_name: `${valid_first} ${valid_last} `,
};

const admin_first = faker.name.firstName();
const admin_last = faker.name.lastName();
const admin_user = {
  email: faker.internet.email(admin_first, admin_last),
  password: 'valid_password',
  username: faker.internet.userName(admin_first, admin_last),
  display_name: `${admin_first} ${admin_last} `,
  give_admin_priviledges: true,
};

const alternate_first = faker.name.firstName();
const alternate_last = faker.name.lastName();
const alternate_user = {
  email: faker.internet.email(alternate_first, alternate_last),
  password: 'valid_password',
  username: faker.internet.userName(alternate_first, alternate_last),
  display_name: `${alternate_first} ${alternate_last} `,
};

const moderator_first = faker.name.firstName();
const moderator_last = faker.name.lastName();
const moderator_user = {
  email: faker.internet.email(moderator_first, moderator_last),
  password: 'valid_password',
  username: faker.internet.userName(moderator_first, moderator_last),
  display_name: `${moderator_first} ${moderator_last} `,
  give_mod_priviledges: true,
};

const modified_first = faker.name.firstName();
const modified_last = faker.name.lastName();
const modified_user = {
  email: faker.internet.email(modified_first, modified_last),
  username: faker.internet.userName(modified_first, modified_last),
  display_name: `${modified_first} ${modified_last} `,
};

module.exports.valid_signup_user = valid_signup_user;
module.exports.admin_user = admin_user;
module.exports.moderator_user = moderator_user;
module.exports.alternate_user = alternate_user;
module.exports.modified_user = modified_user;
