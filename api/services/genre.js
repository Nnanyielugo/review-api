const { model } = require('mongoose');
const { ApiException } = require('../utils/error');

const Genre = model('Genre');
const Book = model('Book');
const User = model('User');

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

exports.create = async function (req, res, next) {
  try {
    if (!req.body.genre) {
      throw new ApiException({
        message: 'You need to send the genre object with this request.',
        status: 400,
      });
    }

    const user = await User.findById(req.payload.id);
    if (user.user_type !== 'admin' && user.user_type !== 'moderator') {
      throw new ApiException({
        message: 'Only admins and moderators are allowed to create genres!',
        status: 403,
      });
    }

    const genre = new Genre({
      name: req.body.genre.name,
      genre_author: user,
    });

    await genre.save();
    return res.status(201).json({ genre: genre.toObjectJsonFor(user) });
  } catch (err) {
    next(err);
  }
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
