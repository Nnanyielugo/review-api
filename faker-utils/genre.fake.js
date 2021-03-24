const faker = require('faker');

module.exports.valid_genre = () => ({
  name: faker.lorem.word(),
});

module.exports.alternate_genre = {
  genre: faker.lorem.word(),
};
