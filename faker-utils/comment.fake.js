const faker = require('faker');

module.exports.valid_comment = () => ({
  content: faker.lorem.paragraphs(2),
});
