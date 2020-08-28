const { model } = require('mongoose');

const Book = model('Book');

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
        message: 'Book does not exist',
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
    const book = new Book({
      title: req.body.title,
      author: req.body.author_id,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre.split(','),
    });
    await book.save();
    return res.status(201).json({ book: book.toObjectJsonFor() });
  } catch (err) {
    next(err);
  }
};

exports.update = function (req, res, next) {
  const book = new Book({
    ...req.body,
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
