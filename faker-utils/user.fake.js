const faker = require('faker');

module.exports.valid_signup_user = () => {
  const valid_first = faker.name.firstName();
  const valid_last = faker.name.lastName();
  return {
    email: faker.internet.email(valid_first, valid_last),
    password: 'valid_password',
    username: faker.internet.userName(valid_first, valid_last),
    displayname: `${valid_first} ${valid_last} `,
  };
};

module.exports.admin_user = () => {
  const admin_first = faker.name.firstName();
  const admin_last = faker.name.lastName();
  return {
    email: faker.internet.email(admin_first, admin_last),
    password: 'valid_password',
    username: faker.internet.userName(admin_first, admin_last),
    displayname: `${admin_first} ${admin_last} `,
    give_admin_priviledges: true,
  };
};

const alternate_first = faker.name.firstName();
const alternate_last = faker.name.lastName();
const alternate_user = {
  email: faker.internet.email(alternate_first, alternate_last),
  password: 'valid_password',
  username: faker.internet.userName(alternate_first, alternate_last),
  displayname: `${alternate_first} ${alternate_last} `,
};

module.exports.moderator_user = () => {
  const moderator_first = faker.name.firstName();
  const moderator_last = faker.name.lastName();
  return {
    email: faker.internet.email(moderator_first, moderator_last),
    password: 'valid_password',
    username: faker.internet.userName(moderator_first, moderator_last),
    displayname: `${moderator_first} ${moderator_last} `,
    give_mod_priviledges: true,
  };
};

const modified_first = faker.name.firstName();
const modified_last = faker.name.lastName();
const modified_user = {
  email: faker.internet.email(modified_first, modified_last),
  username: faker.internet.userName(modified_first, modified_last),
  displayname: `${modified_first} ${modified_last} `,
};

module.exports.alternate_user = alternate_user;
module.exports.modified_user = modified_user;
