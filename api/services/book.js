const { model } = require('mongoose');
const { ApiException } = require('../utils/error');

const Book = model('Book');
const User = model('User');

exports.preloadBook = async function (req, res, next, id) {
  try {
    const book = await Book
      .findById(id)
      .populate('created_by', 'username user_type')
      .populate('edited_by', 'username user_type')
      .populate('reviews', 'slug content')
      .populate('author', 'first_name family_name bio');

    if (!book) {
      throw new ApiException({
        message: 'The book you are looking for does not exist.',
        status: 404,
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
    const user = req.payload ? await User.findById(req.payload.id) : null;
    return res.json({
      book: req.book.toObjectJsonFor(user),
    });
  } catch (err) {
    next(err);
  }
};

exports.create = async function (req, res, next) {
  // TODO: sanitize and trim form values
  try {
    if (!req.body.book) {
      throw new ApiException({
        message: 'You need to supply the book object with this request.',
        status: 400,
      });
    }

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
  try {
    const user_id = req.payload.id;
    const user_obj = await User.findById(user_id);

    if (!req.body.book) {
      throw new ApiException({
        message: 'You need to supply the book object with this request.',
        status: 400,
      });
    }

    if (!user_id) {
      throw new ApiException({ status: 401 });
    }

    if ((req.book.created_by._id.toString() !== user_id.toString())
      && user_obj.user_type !== 'admin') {
      throw new ApiException({
        message: 'You must either be book creator or an admin to edit this book',
        status: 401,
      });
    }

    if (typeof req.body.book.title !== 'undefined') {
      req.book.title = req.body.book.title;
    }

    if (typeof req.body.book.summary !== 'undefined') {
      req.book.summary = req.body.book.summary;
    }

    if (typeof req.body.book.isbn !== 'undefined') {
      req.book.isbn = req.body.book.isbn;
    }

    if (typeof req.body.book.genre !== 'undefined') {
      req.book.genre = req.body.book.genre;
    }

    if (req.book.created_by._id.toString() !== user_id.toString()) {
      req.book.edited_by = user_id;
    }

    await req.book.updateOne();
    const doc = req.book.toObjectJsonFor();
    return res.status(200).json({ book: doc });
  } catch (err) {
    next(err);
  }
};

exports.delete = async function (req, res, next) {
  try {
    const user_id = req.payload.id;
    const user_obj = await User.findById(user_id);

    if ((req.book.created_by._id.toString() !== user_id.toString())
      && user_obj.user_type !== 'admin') {
      throw new ApiException({
        message: 'You must either be book creator or an admin to delete this book',
        status: 401,
      });
    }

    await Book.findByIdAndDelete(req.params.book);
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
