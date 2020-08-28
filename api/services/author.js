const { model } = require('mongoose');

const Author = model('Author');
const Book = model('Book');
const User = model('User');

exports.preloadAuthor = async function (req, res, next, id) {
  try {
    const author = await Author
      .findById(id)
      .populate('created_by', 'username user_type')
      .populate('edited_by', 'username user_type')
      .populate('books', 'title summary');

    if (!author) {
      return res.status(404).json({
        error: {
          message: 'Author does not exist',
        },
      });
    }
    req.author = author;
    return next();
  } catch (err) {
    next(err);
  }
};

exports.list = async function (_req, res, next) {
  try {
    const author_list = await Author
      .find()
      .populate('books', 'title summary')
      .sort({ family_name: 'ascending' });

    return res.json(author_list);
  } catch (err) {
    next(err);
  }
};

exports.detail = async function (req, res, next) {
  try {
    const { author } = req;
    return res.status(200).json({ author: author.toObjectJsonFor(author) });
  } catch (err) {
    next(err);
  }
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

exports.delete = async function (req, res, next) {
  try {
    const user_id = req.payload.id;
    const { author } = req;
    const user = await User.findById(user_id);
    if (
      (author.created_by._id.toString() !== user_id.toString())
        && (user.user_type !== 'admin')
    ) {
      return res.status(401).json({
        error: {
          message: 'You must either be author creator or an admin to delete this author',
        },
      });
    }

    if (author.books.length) {
      return res.status(400).json({
        error: {
          message: 'Author has books. Delete first, then try again',
        },
      });
    }

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
