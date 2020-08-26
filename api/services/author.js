const { model } = require('mongoose');

const Author = model('Author');
const Book = model('Book');

exports.preloadAuthor = function (req, res, next, id) {
  Author
    .findById(id)
    .populate('created_by')
    .then((author) => {
      if (!author) {
        return res.status(404).json({
          error: {
            message: 'Author does not exist',
          },
        });
      }
      req.author = author;
      return next();
    })
    .catch(next);
};

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

exports.create = async function (req, res, next) {
  try {
    // TODO: backend form validation
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      created_by: req.payload.id,
      bio: req.body.bio,
    });

    const doc = await author.save();
    return res.status(201).json({ author: doc });
  } catch (err) {
    next(err);
  }
};

exports.update = function (req, res, next) {
  // TODO:, sanitize and check data and id passed in.
  const user_id = req.payload.id;
  Author
    .findById(req.payload.id)
    .then((author) => {
      if (!author) {
        return res.sendStatus(404);
      }
      if (
        (req.author.created_by._id.toString() !== user_id.toString())
          && (req.author.user_type !== 'admin')
      ) {
        return res.status(401).json({
          error: {
            message: 'You must either be author author or an admin to edit this author',
          },
        });
      }
      if (typeof req.body.first_name !== 'undefined') {
        req.author.first_name = req.body.first_name;
      }

      if (typeof req.body.last_name !== 'undefined') {
        req.author.last_name = req.body.last_name;
      }

      if (typeof req.body.date_of_birth !== 'undefined') {
        req.author.date_of_birth = req.body.date_of_birth;
      }

      if (typeof req.body.date_of_death !== 'undefined') {
        req.author.date_of_death = req.body.date_of_death;
      }

      if (typeof req.body.bio !== 'undefined') {
        req.author.bio = req.body.bio;
      }

      if (req.author.created_by._id.toString() !== user_id.toString()) {
        req.author.edited_by = author;
      }

      return author
        .update()
        .then((doc) => res.status(201).json({ author: doc }))
        .catch(next);
    })
    .catch(next);
};

exports.delete = function (req, res, next) {
  const user_id = req.payload.id;
  if (
    (req.author.created_by._id.toString() !== user_id.toString())
      && (req.author.user_type !== 'admin')
  ) {
    return res.status(401).json({
      error: {
        message: 'You must either be author author or an admin to delete this author',
      },
    });
  }
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
          error: {
            message: 'Author has books. Delete first, then try again',
          },
        });
      }
      return found_author
        .remove()
        .then(() => res.status(204))
        .catch(next);
    })
    .catch(next);
};
