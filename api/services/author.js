const { model } = require('mongoose');

const Author = model('Author');
const Book = model('Book');
const User = model('User');

exports.preloadAuthor = function (req, res, next, id) {
  Author
    .findById(id)
    .populate('created_by')
    .populate('edited_by')
    .populate('books')
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

exports.list = async function (req, res, next) {
  try {
    const author_list = await Author
      .find()
      .sort({ family_name: 'ascending' });
    const get_author_books = async (author) => {
      const author_books = await Book
        .find({ author: author._id });
      return {
        ...author.toObject(),
        book_count: author_books.length,
      };
    };

    const list_results = await Promise.all(author_list.map(get_author_books));
    return res.json(list_results);
  } catch (err) {
    next(err);
  }
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

exports.update = async function (req, res, next) {
  // TODO:, sanitize and check data and id passed in.
  try {
    const user_id = req.payload.id;
    const author = await Author.findById(req.params.author);
    const user_obj = await User.findById(req.payload.id);

    if (!author) {
      return res.sendStatus(404);
    }
    if (
      (req.author.created_by._id.toString() !== user_id.toString())
        && (user_obj.user_type !== 'admin')
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

    if (typeof req.body.family_name !== 'undefined') {
      req.author.family_name = req.body.family_name;
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
      req.author.edited_by = user_id;
    }

    await req.author.updateOne();
    const doc = req.author.toObjectJsonFor(req.author);
    return res.status(201).json({ author: doc });
  } catch (err) {
    next(err);
  }
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
