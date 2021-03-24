const faker = require('faker');

module.exports.valid_book = () => ({
  title: faker.lorem.sentence(6, 16),
  summary: faker.lorem.paragraphs(7, '\n'),
  isbn: '978-3-16-148410-0',
});
