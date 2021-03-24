const faker = require('faker');

module.exports.valid_review = () => ({
  content: faker.lorem.paragraphs(8),
});

module.exports.alternate_review = {
  content: faker.lorem.paragraphs(8),
};
