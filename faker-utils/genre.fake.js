const faker = require('faker');

module.exports.valid_genre = () => ({
  name: faker.lorem.word(),
});
