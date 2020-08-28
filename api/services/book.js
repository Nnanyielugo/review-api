const { model } = require('mongoose');

const Book = model('Book');

exports.preloadBook = async function (req, res, next, id) {
  try {
    const book = await Book
      .findById(id)
      .populate('created_by', 'username user_type')
      .populate('edited_by', 'username user_type')
      .populate('reviews', 'slug content');

    if (!book) {
      return res.status(400).json({
        error: {
          message: 'Book does not exist',
        },
      });
    }
    req.book = book;
    return next();
  } catch (err) {
    next(err);
  }
};

exports.list = async function (_, res, next) {
  try {
    const books = await Book
      .find()
      .populate('author', 'first_name family_name bio');
    return res.status(200).json({ books });
  } catch (err) {
    next(err);
  }
};

exports.detail = async function (req, res, next) {
  try {
    const book = await Book
      .findById(req.params.book)
      .populate('author', 'first_name family_name bio')
      .populate('genre');
    if (!book) {
      return res.status(400).json({
        error: {
          message: 'Book does not exist',
        },
      });
    }

    return res.status(200).json({
      book,
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async function (req, res, next) {
  // TODO: sanitize and trim form values
  try {
    const user_id = req.payload.id;
    const book = new Book({
      title: req.body.book.title,
      author: req.body.book.author_id,
      summary: req.body.book.summary,
      created_by: user_id,
      isbn: req.body.book.isbn,
      genre: (typeof req.body.book.genre === 'undefined') ? [] : req.body.book.genre.split(','),
    });
    await book.save();
    return res.status(201).json({ book: book.toObjectJsonFor() });
  } catch (err) {
    next(err);
  }
};

exports.update = async function (req, res, next) {
  const request_book = req.book;
  const book = new Book({
    ...req.body.book,
    genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre.split(','),
  });

  return book
    .update()
    .then((doc) => res.status(201).json({ book: doc }))
    .catch(next);
};

exports.delete = function (req, res, next) {
  return Book
    .findByIdAndDelete(req.payload.id)
    .then(() => res.send(204))
    .catch(next);
};
