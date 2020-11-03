const { model } = require('mongoose');
const { ApiException } = require('../utils/error');

const Genre = model('Genre');
const Book = model('Book');
const User = model('User');

exports.preloadGenre = async function (req, res, next, id) {
  try {
    const genre = await Genre
      .findById(id);

    if (!genre) {
      throw new ApiException({
        message: 'The genre you are looking for does not exist.',
        status: 404,
      });
    }

    req.genre = genre;
    return next();
  } catch (err) {
    next(err);
  }
};

exports.list = async function (req, res, next) {
  try {
    const genres = await Genre
      .find()
      .sort([['name', 'ascending']]);
    return res.status(200).json({ genres });
  } catch (err) {
    next(err);
  }
};

exports.detail = async function (req, res, next) {
  try {
    const genre_id = req.genre._id;
    const genre_books = await Book.find({
      genre: genre_id,
    });

    return res.json({
      genre: req.genre,
      books: genre_books,
    });
  } catch (err) {
    next(err);
  }
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

exports.update = async function (req, res, next) {
  try {
    if (req.genre.genre_author.toString() !== req.payload.id.toString()) {
      throw new ApiException({ status: 403 });
    }
    const user = await User.findById(req.payload.id);
    if (typeof req.body.genre.name !== 'undefined') {
      req.genre.name = req.body.genre.name;
      req.genre.genre_author = user; // hack to avoid populating genre author in preload
    }

    await req.genre.updateOne();
    return res.json({
      genre: req.genre.toObjectJsonFor(user),
    });
  } catch (err) {
    next(err);
  }
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
