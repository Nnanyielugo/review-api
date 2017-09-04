var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');

var async = require('async');

//The async.parallel() method is passed an object with functions for getting the counts for each of our models. These functions are all started at the same time. When all them have completed the final callback is invoked with the counts in the results parameter (or an error).
//On success the callback function calls res.render(), specifying a view (template) named 'index' and an object containing the data that is to be inserted into it (this includes the results object that contains our model counts). The data is supplied as key-value pairs, and can be accessed in the template using the key.
exports.index = function(req, res, next) {
    async.parallel({
        book_count: function(callback) {
            Book.count(callback);
        },
        book_instance_count: function(callback) {
            BookInstance.count(callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.count({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.count(callback);
        },
        genre_count: function(callback){
            Genre.count(callback);
        },
    }, function(err, results) {
        res.render('index', {
            title: 'Local Library',
            error: err,
            data: results
        });
    });
};

// Display list of all books
//The method uses the model's find() function to return all Book objects, selecting to return the only the title and author as we don't need the other fields (it will also return the _id and virtual fields). Here we also call populate() on Book, specifying the author field—this will replace the stored book author id with the full author details.
exports.book_list = function(req, res, next) {
    Book.find({}, 'title author ')
    .populate('author')
    .exec(function(err, list_books){
        if (err) {
            return next(err);
        }
        res.render('book_list', {
            title: 'Book List',
            book_list: list_books
        });
    });
};

// Display detail page for a specific book
//uses async.parallel to find the book and its associated copies (BookInstances) in parallel
exports.book_detail = function(req, res, next) {
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },

        book_instance: function(callback){
            BookInstance.find({'book': req.params.id})
            //.populate('book)
            .exec(callback);
        },
    }, function(err, results){
        if (err){
            return next (err);
        }
        res.render('book_detail', {
            title: 'Title',
            book: results.book,
            book_instances: results.book_instance
        })
    })
};

// Display book create form on GET
//This uses the async module to get all Author and Genre objects. These are then passed to the view as variables named authors and genres
exports.book_create_get = function(req, res, next) {
    //get all authors and genres, which will be use to addint to the book
    async.parallel({
        authors: function(callback){
            Author.find(callback);
        },
        genres: function(callback){
            Genre.find(callback);
        },
    }, function(err, results){
        res.render('book_form', {
            title: 'Create Book',
            authors: results.authors,
            genres: results.genres
        });
    });
};

// Handle book create on POST
exports.book_create_post = function(req, res, next) {
    req.checkBody('title', 'Title must not be empty.').notEmpty();
    req.checkBody('author', 'Author must not be empty').notEmpty();
    req.checkBody('summary', 'Summary must not be empty').notEmpty();
    req.checkBody('isbn', 'ISBN must not be empty').notEmpty();
    
    req.sanitize('title').escape();
    req.sanitize('author').escape();
    req.sanitize('summary').escape();
    req.sanitize('isbn').escape();
    req.sanitize('title').trim();     
    req.sanitize('author').trim();
    req.sanitize('summary').trim();
    req.sanitize('isbn').trim();
    req.sanitize('genre').escape();
    
    var book = new Book({
        title: req.body.title, 
        author: req.body.author, 
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre.split(",")
    });
    console.log('Book:' + book);
    var errors = req.validationErrors();
    if (errors) {
        //some validator errors we would need to re-render in book

        //get all authors and genres for form
        async.parallel({
            authors: function(callback){
                Author.find(callback);
            },
            genres: function(callback){
                Genre.find(callback);
            },
        }, function(err, results){
            if(err) {
                return next(err);
            }
            for(i = 0; i < results.genres.length; i++){
                if(book.genre.indexOf(results.genres[i]._id) > -1){
                    results.genres[i].cheked='true';
                }
            }
            res.render('book_form', {
                title: 'Create Book',
                authors: results.authors,
                genres: results.genres,
                book: book,
                errors: errors
            });
        });
    }
    else {
        //data from form is valid
        book.save(function(err){
            if (err) {
                return next(err);
            }
            res.redirect(book.url);
        });
    }
};

// Display book delete form on GET
//Deleting a Book is also similar, but you need to check that there are no associated BookInstances.
exports.book_delete_get = function(req, res, next) {
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id)
                .exec(callback);
        },
        book_bookinstance: function(callback){
            BookInstance.find({'book': req.params.id})
                .exec(callback)
        },
    }, function(err, results){
        if(err){
            return next(err);
        }
        res.render('book_delete',{
            title: 'Delete Book',
            book: results.book,
            bookinstance: results.book_bookinstance
        });
    });
};

// Handle book delete on POST
exports.book_delete_post = function(req, res, next) {
    req.checkBody('bookid', 'Book id must exist').notEmpty();

    async.parallel({
        book: function(callback){
            Book.findById(req.body.bookid)
                .exec(callback)
        },
        book_bookinstance: function(callback){
            BookInstance.find({'book': req.body.bookid}, 'imprint status due_back')
                .exec(callback);
        }
    }, function(err, results){
        if(err){
            return next(err)
        }
        if(results.book_bookinstance.length > 0){
            //book has bookinstance. Render in the same way as a GET route
            res.render('book_delete', {
                title: 'Delete Book',
                book:results.book,
                bookinstance: results.book_bookinstance
            });
            return;
        }
        else{
            //book has no bookinstance. Delete object and redirect to list of books.
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err){
                if(err){
                    return next(err);
                }
                res.redirect('/catalog/books');
            })
        }
    })
};

// Display book update form on GET
//The controller gets the id of the Book to be updated from the URL parameter (req.params.id). It uses the async.parallel() method to get the specified Book record (populating its genre and author fields) and lists of all the Author and Genre objects. When all operations have completed it marks the currently selected genres as checked and then renders the book_form.pug view, passing variables for title, book, all authors, and all genres.
exports.book_update_get = function(req, res, next) {
    
    req.sanitize('id').escape();
    req.sanitize('id').trim();
    //get book, authors and genres for form
    async.parallel({
        book: function(callback){
            Book.findById(req.params.id)
                .populate('author')
                .populate('genre')
                .exec(callback);
        },
        authors: function(callback){
            Author.find(callback);
        },
        genres: function(callback){
            Genre.find(callback);
        },
    }, function(err, results){
        if (err){
            return next(err);
        }
        for (var all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++){
            for(var book_g_iter = 0; book_g_iter < results.book.length; book_g_iter++){
                if(results.genres[all_g_iter]._id.toString()==results.book.genre[book_g_iter]._id.toString()){
                    results.genres[all_g_iter].checked='true';
                }
            }
        }
        res.render('book_form', {
            title: 'Update Book',
            authors: results.authors,
            genres: results.genres,
            book: results.book
        });
    });

};

// Handle book update on POST
//This is very similar to the post route used when creating a Book. First we validate and sanitize the book data from the form and use it to create a new Book object (setting its _id value to the id of the object to update). If there are errors when we validate the data then we re-render the form, additionally displaying the data entered by the user, the errors, and lists of genres and authors. If there are no errors then we call Book.findByIdAndUpdate() to update the Book document, and then redirect to its detail page.
exports.book_update_post = function(req, res, next) {
    //Sanitize id passed in. 
    req.sanitize('id').escape();
    req.sanitize('id').trim();
    
    //Check other data
    req.checkBody('title', 'Title must not be empty.').notEmpty();
    req.checkBody('author', 'Author must not be empty').notEmpty();
    req.checkBody('summary', 'Summary must not be empty').notEmpty();
    req.checkBody('isbn', 'ISBN must not be empty').notEmpty();
    
    req.sanitize('title').escape();
    req.sanitize('author').escape();
    req.sanitize('summary').escape();
    req.sanitize('isbn').escape();
    req.sanitize('title').trim();
    req.sanitize('author').trim(); 
    req.sanitize('summary').trim();
    req.sanitize('isbn').trim();
    req.sanitize('genre').escape();

    var book = new Book({
        title: req.body.title, 
        author: req.body.author, 
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre.split(","),
        _id: req.params.id //this is required, or a new id will be assigned
    });

    var errors = req.validationErrors();
    if(errors){
        //re-render book with error information
        //get all authors and genres for form
        async.parallel({
            authors: function(callback) {
                Author.find(callback);
            },
            genres: function(callback) {
                Genre.find(callback);
            },
        }, function(err, results) {
            if (err) { return next(err); }
            
            // Mark our selected genres as checked
            for (i = 0; i < results.genres.length; i++) {
                if (book.genre.indexOf(results.genres[i]._id) > -1) {
                    results.genres[i].checked='true';
                }
            }
            res.render('book_form', { 
                title: 'Update Book',
                authors:results.authors, 
                genres:results.genres, 
                book: book, 
                errors: errors });
        });
    }
    else{
        //data from form is valid. Update the record
        Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook){
            if(err){
                return next(err);
            }
            res.redirect(thebook.url)
        })
    }
};