var async = require('async');
var Book = require('../models/book');
var Author = require('../models/author');

//display list of all authors
exports.author_list = function(req, res, next){
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec(function(err, list_author){
            if(err) {
                return next(err);
            }
            res.render('author_list',{
                title: 'Author List',
                author_list: list_author
            })
        })

};

//display detail page for a specific Author
//The method uses async.parallel() to query the Author and their associated Book instances in parallel, with the callback rendering the page when (if) both requests complete successfully
exports.author_detail = function(req, res, next) {
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id)
                .exec(callback);
        },
        authors_books: function(callback) {
            Book.find({'author': req.params.id}, 'title summary')
                .exec(callback)
        },
    }, function(err, results){
        if(err){
            return next (err);
        }
        res.render('author_detail', {
            title: 'Author Detail',
            author: results.author,
            author_books: results.authors_books
        })
    })
};

//display Auhor create form on GET
exports.author_create_get = function(req, res, next) {
    res.render('author_form', {title: 'Create Author'});
};

//handle Author create on POST
exports.author_create_post = function(req, res, next) {
    req.checkBody('first_name', 'First name must be specified.').notEmpty();
    req.checkBody('family_name', 'Family name must be specified.').notEmpty();
    req.checkBody('family_name', 'Family name must be alphanumeric text').isAlpha();
    req.checkBody('date_of_birth', 'Invalid date').optional({ checkFalsy: true }).isDate();
    req.checkBody('date_of_death', 'Invalid date').optional({ checkFalsy: true }).isDate();

    req.sanitize('first_name').escape();
    req.sanitize('family_name').escape();
    req.sanitize('first_name').trim();
    req.sanitize('family_name').trim();
    req.sanitize('date_of_birth').toDate();
    req.sanitize('date_of_death').toDate();

    var errors = req.validationErrors();

    var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death
    });

    if (errors){
        res.render('author_form', {
            title: 'Create Author',
            author: author,
            errors: errors
        });
        return;
    }
    else {
        //data from form is valid

        author.save(function(err){
            if (err){
                return next(err);
            }
            res.redirect(author.url);
        });
    }
};

// Display Author delete form on GET
exports.author_delete_get = function(req, res, next) {
    async.parallel({
        author: function(callback){
            Author.findById(req.params.id)
                .exec(callback);
        },
        author_books: function(callback){
            Book.find({'author': req.params.id})
                .exec(callback)
        },
    }, function(err, results){
        if(err){
            return next(err);
        }
        res.render('author_delete', {
            title: 'Delete Author',
            author: results.author,
            author_books: results.author_books
        });
    });
};

// Handle Author delete on POST
exports.author_delete_post = function(req, res, next) {
    req.checkBody('authorid', 'Author id must exist').notEmpty();
    
    async.parallel({
        author: function(callback){
                Author.findById(req.body.authorid)
                    .exec(callback);
        },
        authors_books: function(callback){
            Book.find({ 'author': req.body.authorid}, 'title summary')
                .exec(callback);
        },
    }, function(err, results){
        if(err){
            return next(err);
        }
        //success
        if(results.authors_books.length > 0) {
            //Author has books. Render in the same way as for a GET route
            res.render('author_delete',{
                title: 'Delete Author',
                author: results.author,
                author_books: results.authors_books
            });
            return;
        }
        else{
            //author has no books. Delete object and redirect to the list of authors.
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err){
                if(err){
                    return next(err);
                }
                //if success, go to author list
                res.redirect('/catalog/authors');
            });
        }
    });
};

// Display Author update form on GET
exports.author_update_get = function(req, res, next) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();
    //get author for form
   Author.findById(req.params.id)
    .exec(function(err, author){
        if (err){
            return next(err);
        }
        res.render('author_form',{
           title: 'Update Author',
           author: author
       });
    })
};

// Handle Author update on POST
exports.author_update_post = function(req, res) {
    //sanitize id passed in
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    //check other data
    req.checkBody('first_name', 'First name must not ne empty').notEmpty();
    req.checkBody('family_name', 'Last name must not be empty').notEmpty();
    req.checkBody('family_name', 'Last name must be alphanumeric text').isAlpha();
    req.checkBody('date_of_birth', 'Invalid date').optional({ checkFalsy: true }).isDate();
    req.checkBody('date_of_death', 'Invalid date').optional({ checkFalsy: true }).isDate();

    req.sanitize('first_name').escape();
    req.sanitize('family_name').escape();
    req.sanitize('date_of_birth').escape();
    req.sanitize('date_of_death').escape();
    req.sanitize('first_name').trim();
    req.sanitize('family_name').trim();
    req.sanitize('date_of_birth').trim();
    req.sanitize('date_of_death').trim();

    var author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id: req.params.id
    });

    var errors = req.validationErrors();
    if(errors){        
        res.render('author_form', {
            title: 'Update Author',
            author: author,
            errors: errors
        });       
    }
    else {
        //data from form is valid. Update record
        Author.findByIdAndUpdate(req.params.id, author, {}, function(err, theauthor){
            if(err){
                return next(err);
            }
            res.redirect(theauthor.url)
        })
    }
    
};
