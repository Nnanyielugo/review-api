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
