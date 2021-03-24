const faker = require('faker');

module.exports.valid_book = () => ({
  title: faker.lorem.sentence(6, 16),
  summary: faker.lorem.paragraphs(7, '\n'),
  isbn: '978-3-16-148410-0',
});

module.exports.alternate_book = {
  title: faker.lorem.sentence(6, 16),
  summary: faker.lorem.paragraphs(7, '\n'),
  isbn: '988-3-16-168410-9',
};

module.exports.modified_book = {
  title: faker.lorem.sentence(6, 16),
  summary: faker.lorem.paragraphs(7, '\n'),
  isbn: '978-3-16-148410-0',
};
