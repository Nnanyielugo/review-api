const faker = require('faker');

module.exports.valid_review = () => ({
  content: faker.lorem.paragraphs(8),
});
