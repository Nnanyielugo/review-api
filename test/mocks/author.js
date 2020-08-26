module.exports.valid_author = {
  first_name: 'Maureen',
  family_name: 'Stehr',
  date_of_birth: '2009-11-17T12:40:50.488Z',
  date_of_death: '2018-01-18T18:14:02.578Z',
  bio:
   'Aliquid perspiciatis nihil labore quod rerum. Vitae sed quia totam sit corrupti. Velit animi suscipit ullam. Nihil libero voluptas facilis neque aliquid. Libero distinctio doloremque facilis neque magni autem eum. Porro sint voluptatum sint nulla earum quia.',
};

module.exports.invalid_author = {
  date_of_birth: this.valid_author.date_of_birth,
  date_of_death: this.valid_author.date_of_death,
  bio: this.valid_author.bio,
};
