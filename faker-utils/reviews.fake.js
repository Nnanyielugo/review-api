const faker = require('faker');

module.exports.valid_review = {
  content: faker.lorem.paragraphs(8),
  tags: ['thriller', 'fiction'],
};

module.exports.alternate_review = {
  content: faker.lorem.paragraphs(8),
  tags: ['thriller', 'fiction'],
};
