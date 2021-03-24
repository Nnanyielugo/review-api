const { model } = require('mongoose');
const { ApiException } = require('../utils/error');

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
      throw new ApiException({
        message: 'The author you are looking for does not exist.',
        status: 404,
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
    if (!req.body.author) {
      throw new ApiException({
        message: 'You need to supply the author object with this request',
        status: 400,
      });
    }

    const author = new Author({
      first_name: req.body.author.first_name,
      family_name: req.body.author.family_name,
      date_of_birth: req.body.author.date_of_birth,
      date_of_death: req.body.author.date_of_death,
      created_by: req.payload.id,
      bio: req.body.author.bio,
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
    if (!req.body.author) {
      throw new ApiException({
        message: 'You need to supply the author object with this request',
        status: 400,
      });
    }

    const user_id = req.payload.id;
    const author = await Author.findById(req.params.author);
    const user_obj = await User.findById(req.payload.id);

    if (!author) {
      throw new ApiException({ status: 404 });
    }
    if (
      (req.author.created_by._id.toString() !== user_id.toString())
        && (user_obj.user_type !== 'admin')
    ) {
      throw new ApiException({
        message: 'You must either be author author or an admin to edit this author',
        status: 401,
      });
    }

    if (typeof req.body.author.first_name !== 'undefined') {
      req.author.first_name = req.body.author.first_name;
    }

    if (typeof req.body.author.family_name !== 'undefined') {
      req.author.family_name = req.body.author.family_name;
    }

    if (typeof req.body.author.date_of_birth !== 'undefined') {
      req.author.date_of_birth = req.body.author.date_of_birth;
    }

    if (typeof req.body.author.date_of_death !== 'undefined') {
      req.author.date_of_death = req.body.author.date_of_death;
    }

    if (typeof req.body.author.bio !== 'undefined') {
      req.author.bio = req.body.author.bio;
    }

    if (req.author.created_by._id.toString() !== user_id.toString()) {
      req.author.edited_by = user_id;
    }

    await req.author.save();
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
      throw new ApiException({
        message: 'You must either be author creator or an admin to delete this author',
        status: 401,
      });
    }

    if (author.books.length) {
      throw new ApiException({
        message: 'Author has books. Delete first, then try again',
        status: 400,
      });
    }

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};
