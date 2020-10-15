const { model } = require('mongoose');

const Book = model('Book');
const User = model('User');

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
          message: 'The book you are looking for does not exist.',
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
    if (!req.body.book) {
      return res.status(400).json({
        error: {
          message: 'You need to supply the book object with this request',
        },
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
      return res.status(400).json({
        error: {
          message: 'You need to supply the book object with this request',
        },
      });
    }

    if (!user_id) {
      return res.sendStatus(401);
    }

    if ((req.book.created_by._id.toString() !== user_id.toString())
      && user_obj.user_type !== 'admin') {
      return res.status(401).json({
        error: {
          message: 'You must either be book creator or an admin to edit this book',
        },
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
      return res.status(401).json({
        error: {
          message: 'You must either be book creator or an admin to delete this book',
        },
      });
    }

    await Book.findByIdAndDelete(req.params.book);
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
