const { model } = require('mongoose');

const Author = model('Author');
const Book = model('Book');

exports.list = function (req, res, next) {
  return Author.find()
    .sort({ family_name: 'ascending' })
    .then((list) => {
      const getAuthor_books = (author) => Book
        .find({ author: author._id })
        .then((books) => ({
          ...author.toObject(),
          books_available: books.length,
        }))
        .catch(next);

      Promise
        .all(list.map(getAuthor_books))
        .then((results) => res.json(results))
        .catch(next);
    })
    .catch(next);
};

exports.detail = function (req, res, next) {
  const author = Author
    .findById(req.params.id)
    .select('-books')
    .exec();

  const author_books = Book
    .find({ author: req.params.id })
    .select('title summary')
    .exec();

  return Promise
    .all([author, author_books])
    .then(([found_author, found_author_books]) => res.status(200).json({
      author: found_author.toObjectJsonFor(found_author_books),
    }))
    .catch(next);
};

exports.create = function (req, res, next) {
  // TODO: backend form validation

  const author = new Author({
    first_name: req.body.first_name,
    family_name: req.body.family_name,
    date_of_birth: req.body.date_of_birth,
    date_of_death: req.body.date_of_death,
  });

  // const author = new Author({
  //   ...req.body,
  // });

  return author
    .save()
    .then((doc) => res.status(201).json({ author: doc }))
    .catch(next);
};

exports.update = function (req, res, next) {
  // TODO:, sanitize and check data and id passed in.

  const author = new Author({
    first_name: req.body.first_name,
    family_name: req.body.family_name,
    date_of_birth: req.body.date_of_birth,
    date_of_death: req.body.date_of_death,
    _id: req.params.id,
  });

  // const author = new Author({
  //   ...req.body,
  // });

  return author
    .update()
    .then((doc) => res.status(201).json({ author: doc }))
    .catch(next);
};

exports.delete = function (req, res, next) {
  const author = Author
    .findById(req.params.id)
    .exec();

  const author_books = Book
    .find({ author: req.params.id })
    .exec();

  return Promise
    .all([author, author_books])
    .then(([found_author, found_author_books]) => {
      if (found_author_books.length) {
        return res.status(400).json({
          message: 'Author has books. Delete first, then try again',
        });
      }
      return found_author
        .remove()
        .then(() => res.status(204))
        .catch(next);
    })
    .catch(next);
};
