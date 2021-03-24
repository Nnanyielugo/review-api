const faker = require('faker');

const valid_author = () => ({
  first_name: faker.name.firstName(),
  family_name: faker.name.lastName(),
  date_of_birth: faker.date.past(80),
  date_of_death: faker.date.past(10),
  bio: faker.lorem.paragraph(4),
});

const modified_author = {
  first_name: faker.name.firstName(),
  family_name: faker.name.lastName(),
  date_of_birth: faker.date.past(80),
  date_of_death: faker.date.past(10),
  bio: faker.lorem.paragraph(4),
};

const alternate_author = {
  first_name: faker.name.firstName(),
  family_name: faker.name.lastName(),
  date_of_birth: faker.date.past(80),
  date_of_death: faker.date.past(10),
  bio: faker.lorem.paragraph(4),
};

module.exports.modified_author = modified_author;
module.exports.valid_author = valid_author;
module.exports.alternate_author = alternate_author;
