const { model } = require('mongoose');

const Genre = model('Genre');
const Book = model('Book');

exports.list = function (req, res, next) {
  return Genre
    .find()
    .sort([['name', 'ascending']])
    .then((genres) => res.status(200).json({ genres }))
    .catch(next);
};

exports.detail = function (req, res, next) {
  const genre = Genre
    .findById(req.params.id)
    .exec();
  const genre_books = Book
    .find({ genre: req.params.id })
    .exec();
  return Promise
    .all([genre, genre_books])
    .then(([found_genre, found_genre_books]) => res.status(200).json({
      genre: found_genre,
      genre_books: found_genre_books,
    }))
    .catch(next);
};

exports.create = function (req, res, next) {
  const genre = new Genre({
    name: req.body.name,
  });

  return Genre
    .findOne({ name: req.body.name })
    .then((found_genre) => {
      if (found_genre) {
        res.status(400).json({
          message: 'Genre already exists',
        });
      }
      genre
        .save()
        .then((doc) => res.status(201).json({ genre: doc }))
        .catch(next);
    })
    .catch(next);
};

exports.update = function (req, res, next) {
  const genre = new Genre({
    name: req.body.name,
  });

  return genre
    .update()
    .then((doc) => res.status(201).json({ genre: doc }))
    .catch(next);
};

exports.delete = function (req, res, next) {
  const genre = Genre
    .findById(req.params.id)
    .exec();
  const genre_books = Book
    .find({ genre: req.params.id })
    .exec();

  return Promise
    .all([genre, genre_books])
    .then(([found_genre, found_genre_books]) => {
      if (found_genre_books.length) {
        return res.status(400).json({ message: 'This genre has books. Please remove books in Genre and try again' });
      }
      return found_genre
        .remove()
        .then(() => res.status(204))
        .catch(next);
    })
    .catch(next);
};
