#! /usr/bin/env node

console.log('This script populates mock data to your database.');
console.warn('It is important that you specify database as argument - e.g.: populatedb mongodb://your_username:your_password@your_dabase_url');

const database_uri = process.argv.slice(2)[0];
if (!database_uri || !database_uri.startsWith('mongodb://')) {
  console.error('ERROR: You need to specify a valid mongodb URL as the first argument');
  return;
}

const mongoose = require('mongoose');
const crypto = require('crypto');
const mockData = require('./faker-utils');
const mongooseUtil = require('./api/utils/mongoose');


mongooseUtil.connect_mongoose(database_uri);
const db = mongoose.connection;
db.on('connected', () => {
  console.log(`Mongoose connected to ${database_uri} for population`);
});
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

require('./api/models');

const Book = mongoose.model('Book');
const User = mongoose.model('User');
const Review = mongoose.model('Review');
const Genre = mongoose.model('Genre');
const Author = mongoose.model('Author');
const Comment = mongoose.model('Comment');

const Users = [];
const Books = [];
const Reviews = [];
const Genres = [];
const Authors = [];
const Comments = [];

function generaterandomInt(n) {
  return Math.floor(Math.random() * Math.floor(n));
}


function createAuthor() {
  return new Promise((resolve, reject) => {
    const randomInt = generaterandomInt(Users.length);
    const randomUser = Users[randomInt];
    const generatedAuthor = mockData.author.valid_author();
    const author = new Author({
      ...generatedAuthor,
      created_by: randomUser._id,
    });
    author.save((err, doc) => {
      if (err) {
        reject(err);
      }
      resolve(doc);
    });
  });
}

async function createAuthors(n) {
  const arrayCounter = [...Array(n).keys()];
  await Promise.allSettled(arrayCounter.map(() => createAuthor()))
    .then((response) => {
      response.map((resp) => {
        if (resp.status === 'fulfilled') {
          Authors.push(resp.value);
        }
      });
    });
}

function createBook() {
  return new Promise((resolve, reject) => {
    const randomAuthor = Authors[generaterandomInt(Authors.length)];
    const randomUser = Users[generaterandomInt(Users.length)];
    const randomGenre = Genres[generaterandomInt(Genres.length)];
    const generatedBook = mockData.book.valid_book();
    const book = new Book({
      ...generatedBook,
      author: randomAuthor._id,
      created_by: randomUser._id,
      genre: randomGenre._id,
    });
    book.save((err, doc) => {
      if (err) {
        reject(err);
      }
      // author_books
      Author.findById(doc.author, (author_err, res_author) => {
        if (author_err) {
          reject(author_err);
        }
        res_author.books.push(doc._id);
        res_author.save((save_err) => {
          if (save_err) {
            reject(save_err);
          }
          resolve(doc);
        });
      });
    });
  });
}

async function createBooks(n) {
  const arrayCounter = [...Array(n).keys()];
  await Promise.allSettled(arrayCounter.map(() => createBook()))
    .then((response) => {
      response.map((resp) => {
        if (resp.status === 'fulfilled') {
          Books.push(resp.value);
        }
      });
    });
}

function createComment() {
  return new Promise((resolve, reject) => {
    const randomUser = Users[generaterandomInt(Users.length)];
    const randomReview = Reviews[generaterandomInt(Reviews.length)];
    const generatedComment = mockData.comment.valid_comment();
    const comment = new Comment({
      ...generatedComment,
      comment_author: randomUser,
      review: randomReview._id,
    });
    comment.save((comment_err, comment_doc) => {
      if (comment_err) {
        reject(comment_err);
      }

      // review comments
      Review.findById(comment_doc.review, (review_err, review_doc) => {
        if (review_err) {
          reject(review_err);
        }
        review_doc.comments.push(comment_doc._id);
        review_doc.save((review_save_err) => {
          if (review_save_err) {
            reject(review_save_err);
          }
          resolve(comment_doc);
        });
      });
    });
  });
}

async function createComments(n) {
  const arrayCounter = [...Array(n).keys()];
  await Promise.allSettled(arrayCounter.map(() => createComment()))
    .then((response) => {
      response.map((resp) => {
        if (resp.status === 'fulfilled') {
          Comments.push(resp.value);
        }
      });
    });
}

function createGenre() {
  return new Promise((resolve, reject) => {
    const randomInt = generaterandomInt(Users.length);
    const randomUser = Users[randomInt];
    const generatedGenre = mockData.genre.valid_genre();
    const genre = new Genre({
      ...generatedGenre,
      genre_author: randomUser._id,
    });
    genre.save((err, doc) => {
      if (err) {
        reject(err);
      }
      resolve(doc);
    });
  });
}

async function createGenres(n) {
  const arrayCounter = [...Array(n).keys()];
  await Promise.allSettled(arrayCounter.map(() => createGenre()))
    .then((response) => {
      response.map((resp) => {
        if (resp.status === 'fulfilled') {
          Genres.push(resp.value);
        }
      });
    });
}

function createReview() {
  return new Promise((resolve, reject) => {
    const randomBook = Books[generaterandomInt(Books.length)];
    const randomUser = Users[generaterandomInt(Users.length)];
    const generatedReview = mockData.review.valid_review();
    const review = new Review({
      ...generatedReview,
      book: randomBook,
      review_author: randomUser,
    });
    review.save((review_err, review_doc) => {
      if (review_err) {
        reject(review_err);
      }

      // book reviews
      Book.findById(review_doc.book, (book_err, book_doc) => {
        if (book_err) {
          reject(book_err);
        }

        book_doc.reviews.push(review_doc._id);
        book_doc.save((book_save_err) => {
          if (book_save_err) {
            reject(book_save_err);
          }

          // User reviews
          User.findById(review_doc.review_author, (user_err, user_doc) => {
            if (user_err) {
              reject(user_err);
            }

            user_doc.reviews.push(review_doc._id);
            user_doc.save((user_save_err) => {
              if (user_save_err) {
                reject(user_save_err);
              }
              resolve(review_doc);
            });
          });
        });
      });
    });
  });
}

async function createReviews(n) {
  const arrayCounter = [...Array(n).keys()];
  await Promise.allSettled(arrayCounter.map(() => createReview()))
    .then((response) => {
      response.map((resp) => {
        if (resp.status === 'fulfilled') {
          Reviews.push(resp.value);
        }
      });
    });
}

function createUser() {
  return new Promise((resolve, reject) => {
    const users = [
      'valid_signup_user',
      'admin_user',
      'moderator_user',
      'valid_signup_user',
      'valid_signup_user',
    ];
    const randomInt = generaterandomInt(users.length);
    const funcName = mockData.user[users[randomInt]];
    const generatedUser = funcName();
    const salt = crypto.randomBytes(16).toString('hex');
    const user = new User({
      ...generatedUser,
      salt,
      hash: crypto.pbkdf2Sync(generatedUser.password, salt, 10000, 512, 'sha512').toString('hex'),
    });
    user.save((err, doc) => {
      if (err) {
        reject(err);
      }
      resolve(doc);
    });
  });
}

async function createUsers(n) {
  const arrayCounter = [...Array(n).keys()];
  await Promise.allSettled(arrayCounter.map(() => createUser()))
    .then((response) => {
      response.map((resp) => {
        if (resp.status === 'fulfilled') {
          Users.push(resp.value);
        }
      });
    });
}


async function populate() {
  await createUsers(10);
  await createAuthors(6);
  await createGenres(4);
  await createBooks(50);
  await createReviews(200);
  await createComments(1000);

  // cleanup annd exit script
  await mongoose.connection.close();
  process.exit();
}

populate();
