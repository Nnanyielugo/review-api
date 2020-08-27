module.exports.valid_author = {
  first_name: 'Maureen',
  family_name: 'Stehr',
  date_of_birth: '2009-11-17T12:40:50.488Z',
  date_of_death: '2018-01-18T18:14:02.578Z',
  bio:
   'Aliquid perspiciatis nihil labore quod rerum. Vitae sed quia totam sit corrupti. Velit animi suscipit ullam. Nihil libero voluptas facilis neque aliquid. Libero distinctio doloremque facilis neque magni autem eum. Porro sint voluptatum sint nulla earum quia.',
};

module.exports.modified_author = {
  first_name: 'Gregoria',
  family_name: 'Ratke',
  date_of_birth: '1975-05-04T19:19:15.975Z',
  date_of_death: '2019-05-18T02:08:36.778Z',
  bio: 'Modi sint dicta voluptates sit perferendis nemo nulla architecto. Numquam nesciunt debitis quos officiis ullam consequatur omnis facilis. Autem vitae iusto veritatis dolores tempora atque tempore maxime exercitationem. Enim consequuntur et ducimus qui magni explicabo asperiores iusto aut. Fugit tenetur omnis rerum voluptatem.',
};

module.exports.alternate_author = {
  first_name: 'Erin',
  family_name: 'Ernser',
  date_of_birth: '1997-07-15T03:25:07.964Z',
  date_of_death: '2013-01-23T23:53:35.325Z',
  bio:
   'Est atque aliquam voluptatibus voluptatem dolores alias et voluptatem praesentium. Facere et nulla. Repudiandae sit harum dolor consequatur deserunt nisi. Occaecati quas similique tempora pariatur ut recusandae.',
};

module.exports.invalid_author = {
  date_of_birth: this.valid_author.date_of_birth,
  date_of_death: this.valid_author.date_of_death,
  bio: this.valid_author.bio,
};
