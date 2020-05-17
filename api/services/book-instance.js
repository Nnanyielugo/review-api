const async = require('async');
const { model } = require('mongoose');
// const BookInstance = require('../models/book-instance');
// const Book = require('../models/book');

const BookInstance = model('BookInstance');
const Book = model('Book');

exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec((err, list_bookinstances) => {
      if (err) {
        return next(err);
      }
      // res.render('bookinstance_list', {
      //   title: 'Book Instance List',
      //   bookinstance_list: list_bookinstances
      // })
    });
};

exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      // res.render('bookinstance_detail',{
      //     title: 'Book:',
      //     bookinstance: bookinstance
      // });
    });
};

exports.bookinstance_create_get = function (req, res, next) {
  Book.find({}, 'title')
    .exec((err, books) => {
      if (err) {
        return next(err);
      }
      // res.render('bookinstance_form', {
      //     title: 'Create Bookinstance',
      //     book_list: books
      // });
    });
};

exports.bookinstance_create_post = function (req, res, next) {
  req.checkBody('book', 'Book must be specified').notEmpty(); // We won't force Alphanumeric, because book titles might have spaces.
  req.checkBody('imprint', 'Imprint must be specified').notEmpty();
  req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();

  req.sanitize('book').escape();
  req.sanitize('imprint').escape();
  req.sanitize('status').escape();
  req.sanitize('book').trim();
  req.sanitize('imprint').trim();
  req.sanitize('status').trim();
  req.sanitize('due_back').toDate();

  const bookinstance = new BookInstance({
    book: req.body.book,
    imprint: req.body.imprint,
    status: req.body.status,
    due_back: req.body.due_back,
  });

  const errors = req.validationErrors();
  if (errors) {
    Book.find({}, 'title')
      .exec((err, books) => {
        if (err) { return next(err); }
        // Successful, so render
        // res.render('bookinstance_form', {
        //     title: 'Create BookInstance',
        //     book_list: books,
        //     selected_book: bookinstance.book._id ,
        //     errors: errors,
        //     bookinstance: bookinstance
        //   });
      });
    return;
  }

  // Data from form is valid

  bookinstance.save((err) => {
    if (err) { return next(err); }
    // successful - redirect to new book-instance record.
    //  res.redirect(bookinstance.url);
  });
};

exports.bookinstance_delete_get = function (req, res, next) {
  BookInstance.findById(req.params.id)
    // can omit .populate function in later replications to see if it works
    .populate('book')
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      res.render('bookinstance_delete', {
        title: 'Delete Bookinstance',
        bookinstance,
      });
    });
};

exports.bookinstance_delete_post = function (req, res) {
  req.checkBody('bookinstanceid', 'Bookinstance id must exist').notEmpty();
  BookInstance.findById(req.body.id)
    .exec((err, bookinstance) => {
      if (err) {
        // return next(err);
      }
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, (err) => {
        if (err) {
          // return next(err);
        }
        res.redirect('/catalog/bookinstances');
      });
    });
};

exports.bookinstance_update_get = function (req, res) {
  req.sanitize('id').escape();
  req.sanitize('id').trim();
  // get bookinstance and book for form
  async.parallel({
    bookinstance(callback) {
      BookInstance.findById(req.params.id)
        .populate('book')
        .exec(callback);
    },
    books(callback) {
      Book.find(callback);
    },
  }, (err, results) => {
    if (err) {
      // return next(err);
    }
    res.render('bookinstance_form', {
      title: 'Update Book',
      book_list: results.books,
      selected_book: results.bookinstance.book._id,
      bookinstance: results.bookinstance,
    });
  });
};

exports.bookinstance_update_post = function (req, res) {
  req.sanitize('id').escape();
  req.sanitize('id').trim();

  req.checkBody('book', 'Book must be specified').notEmpty(); // We won't force Alphanumeric, because book titles might have spaces.
  req.checkBody('imprint', 'Imprint must be specified').notEmpty();
  req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();

  req.sanitize('book').escape();
  req.sanitize('imprint').escape();
  req.sanitize('status').escape();
  req.sanitize('book').trim();
  req.sanitize('imprint').trim();
  req.sanitize('status').trim();
  req.sanitize('due_back').toDate();

  const bookinstance = new BookInstance({
    book: req.body.book,
    imprint: req.body.imprint,
    status: req.body.status,
    due_back: req.body.due_back,
    _id: req.params.id,
  });

  const errors = req.validationErrors();
  if (errors) {
    // res.render('bookinstance_form', {
    //   title: 'Create BookInstance',
    //   book_list: books,
    //   selected_book: bookinstance.book._id,
    //   errors,
    //   bookinstance,
    // });
  } else {
    // data from form is valid. Update record
    BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, (err, thebookinstance) => {
      if (err) {
        // return next(err);
      }
      res.redirect(thebookinstance.url);
    });
  }
};
