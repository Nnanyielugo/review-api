var async = require('async');
var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

// Display list of all BookInstances
//The method uses the model's find() function to return all BookInstance objects. It then daisy-chains a call to populate() with the book field—this will replace the book id stored for each BookInstance with a full Book document.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
        .populate('book')
        .exec(function(err, list_bookinstances) {
            if (err) {
                return next (err);
            }
            res.render('bookinstance_list', {
                title: 'Book Instance List', 
                bookinstance_list: list_bookinstances
            })
        })
};

// Display detail page for a specific BookInstance
//calls BookInstance.findById() with the aid of a specific book instance extracted from the url and accessed via the request parameter: req,params.id to get the details of the associated book
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function(err, bookinstance){
            if (err){
                return next(err)
            }
            res.render('bookinstance_detail',{
                title: 'Book:',
                bookinstance: bookinstance
            });
        });
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
        .exec(function(err, books){
            if(err){
                return next(err);
            }
            res.render('bookinstance_form', {
                title: 'Create Bookinstance',
                book_list: books
            });
        })
};

// Handle BookInstance create on POST
exports.bookinstance_create_post = function(req, res, next) {
    req.checkBody('book', 'Book must be specified').notEmpty(); //We won't force Alphanumeric, because book titles might have spaces.
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();
    
    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();   
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();
    
    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint, 
        status: req.body.status,
        due_back: req.body.due_back
    });

    var errors = req.validationErrors();
    if (errors) {
        
        Book.find({},'title')
        .exec(function (err, books) {
          if (err) { return next(err); }
          //Successful, so render
          res.render('bookinstance_form', { 
              title: 'Create BookInstance', 
              book_list: books, 
              selected_book: bookinstance.book._id , 
              errors: errors, 
              bookinstance: bookinstance 
            });
        });
        return;
    } 
    else {
    // Data from form is valid
    
        bookinstance.save(function (err) {
            if (err) { return next(err); }
               //successful - redirect to new book-instance record.
               res.redirect(bookinstance.url);
            }); 
    }

};

// Display BookInstance delete form on GET
//Deleting a BookInstance is the easiest of all, because there are no dependent objects. 
//In this case you can just find the associated record and delete it.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id)
    //can omit .populate function in later replications to see if it works   
        .populate('book')
        .exec(function(err, bookinstance){
            if(err){
                return next(err)
            }
            res.render('bookinstance_delete',{
                title: 'Delete Bookinstance',
                bookinstance: bookinstance
            });
        });
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function(req, res) {
    req.checkBody('bookinstanceid', 'Bookinstance id must exist').notEmpty();
    BookInstance.findById(req.body.id)
        .exec(function(err, bookinstance){
            if(err){
                return next(err)
            }
            BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookinstance(err){
                if(err){
                    return next (err)
                }
                res.redirect('/catalog/bookinstances')
            })
        })
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function(req, res) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();
    //get bookinstance and book for form
   async.parallel({
       bookinstance: function(callback){
           BookInstance.findById(req.params.id)
            .populate('book')
            .exec(callback)
       },
       books: function(callback){
           Book.find(callback)
       },
   }, function(err, results){
       if(err){
           return next (err)
       }
       res.render('bookinstance_form',{
           title: 'Update Book',
           book_list: results.books, 
           selected_book: results.bookinstance.book._id, 
           bookinstance: results.bookinstance
       });
   });
};

// Handle bookinstance update on POST
exports.bookinstance_update_post = function(req, res) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    req.checkBody('book', 'Book must be specified').notEmpty(); //We won't force Alphanumeric, because book titles might have spaces.
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();
    
    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();   
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();

    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint, 
        status: req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id
    });

    var errors = req.validationErrors();
    if(errors){
        res.render('bookinstance_form', { 
              title: 'Create BookInstance', 
              book_list: books, 
              selected_book: bookinstance.book._id , 
              errors: errors, 
              bookinstance: bookinstance 
            });
    }
    else{
        //data from form is valid. Update record
        BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, thebookinstance){
            if(err){
                return next(err)
            }
            res.redirect(thebookinstance.url)
        })
    }
};