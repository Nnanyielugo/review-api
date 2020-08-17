const { model } = require('mongoose');

const Book = model('Book');

exports.list = function (_, res, next) {
  return Book
    .find({})
    .select('title author')
    .populate('author')
    .then((books) => {
      res.status(200).json({
        books,
      });
    })
    .catch(next);
};

exports.detail = function (req, res, next) {
  return Book
    .findById(req.params.id)
    .populate('auhor')
    .populate('genre')
    .then((book) => {
      if (!book) {
        return res.status(400).json({
          message: 'Book does not exist',
        });
      }
      return res.send(200).json({
        book,
      });
    })
    .catch(next);
};

exports.create = function (req, res, next) {
  // TODO: sanitize and trim form values

  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    summary: req.body.summary,
    isbn: req.body.isbn,
    genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre.split(','),
  });

  return book
    .save()
    .then((doc) => res.send(201).json({ book: doc }))
    .catch(next);
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
