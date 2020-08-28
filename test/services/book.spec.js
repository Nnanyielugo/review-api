const chai = require('chai');
const chaiHttp = require('chai-http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const connect_mongoose = require('../../api/utils/mongoose_utils');
const app = require('../../app');
const {
  valid_signup_user, alternate_signup_user,
  admin_user,
} = require('../mocks/user');
const { valid_author, alternate_author } = require('../mocks/author');
const {
  valid_book, invalid_book,
  alternate_book, modified_book,
} = require('../mocks/book');

chai.use(chaiHttp);
const { expect } = chai;

describe('Book tests', () => {
  let mongoServer;
  let user;
  let alternate_user;
  let author;
  let superuser;
  let alternate_author_obj;
  let book;
  beforeEach(async () => {
    mongoServer = new MongoMemoryServer();
    const mongo_uri = await mongoServer.getUri();
    await connect_mongoose(mongo_uri);
    // register user
    const user_resp = await chai
      .request(app)
      .post('/api/users/')
      .send({ user: valid_signup_user });
    user = user_resp.body.user;

    const alternate_user_resp = await chai
      .request(app)
      .post('/api/users/')
      .send({ user: alternate_signup_user });
    alternate_user = alternate_user_resp.body.user;

    const superuser_resp = await chai
      .request(app)
      .post('/api/users/')
      .send({ user: admin_user });
    superuser = superuser_resp.body.user;

    // create author
    const author_resp = await chai
      .request(app)
      .post('/api/authors/')
      .set('authorization', `Bearer ${user.token}`)
      .send({ author: valid_author });
    author = author_resp.body.author;

    const alternate_author_resp = await chai
      .request(app)
      .post('/api/authors/')
      .set('authorization', `Bearer ${alternate_user.token}`)
      .send({ author: alternate_author });
    alternate_author_obj = alternate_author_resp.body.author;

    const valid_book_resp = await chai
      .request(app)
      .post('/api/books/')
      .set('authorization', `Bearer ${user.token}`)
      .send({
        book: {
          ...valid_book,
          author_id: author._id,
        },
      });
    book = valid_book_resp;
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {
    it('fetches list of books', async () => {
      const response = await chai
        .request(app)
        .get('/api/books/');

      const responseBooks = response.body.books;
      expect(response.status).to.equal(200);
      expect(responseBooks.length).to.equal(1);
      expect(responseBooks[0].title).to.equal(book.body.book.title);
      expect(responseBooks[0].summary).to.equal(book.body.book.summary);
      expect(responseBooks[0].isbn).to.equal(book.body.book.isbn);
      expect(responseBooks[0].author._id).to.equal(author._id);
    });

    it('creates a single book', async () => {
      const response = await chai
        .request(app)
        .post('/api/books/')
        .set('authorization', `Bearer ${user.token}`)
        .send({
          book: {
            ...alternate_book,
            author_id: author._id,
          },
        });

      const responseBook = response.body.book;
      expect(response.status).to.equal(201);
      expect(responseBook.title).to.equal(alternate_book.title);
      expect(responseBook.summary).to.equal(alternate_book.summary);
      expect(responseBook.isbn).to.equal(alternate_book.isbn);
      expect(responseBook.author).to.equal(author._id);
    });

    it('fetches a single book by id', async () => {
      const response = await chai
        .request(app)
        .get(`/api/books/${book.body.book._id}`);

      const responseBook = response.body.book;
      expect(response.status).to.equal(200);
      expect(responseBook.title).to.equal(book.body.book.title);
      expect(responseBook.summary).to.equal(book.body.book.summary);
      expect(responseBook.isbn).to.equal(book.body.book.isbn);
      expect(responseBook.author._id).to.equal(author._id);
    });

    it('updates single book', async () => {
      const response = await chai
        .request(app)
        .patch(`/api/books/${book.body.book._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          book: {
            ...modified_book,
            author_id: author._id,
          },
        });

      const responseBook = response.body.book;
      expect(response.status).to.equal(200);
      expect(responseBook.title).to.equal(modified_book.title);
      expect(responseBook.summary).to.equal(modified_book.summary);
      expect(responseBook.isbn).to.equal(modified_book.isbn);
      expect(responseBook.author).to.equal(author._id);
    });

    it('lets admin update book it did not create', async () => {
      const response = await chai
        .request(app)
        .patch(`/api/books/${book.body.book._id}`)
        .set('authorization', `Bearer ${superuser.token}`)
        .send({
          book: {
            ...modified_book,
            author_id: author._id,
          },
        });

      const responseBook = response.body.book;
      expect(response.status).to.equal(200);
      expect(responseBook.title).to.equal(modified_book.title);
      expect(responseBook.summary).to.equal(modified_book.summary);
      expect(responseBook.isbn).to.equal(modified_book.isbn);
      expect(responseBook.author).to.equal(author._id);
      expect(responseBook.edited_by).to.be.a('string');
      expect(responseBook.edited_by).to.equal(superuser._id);
    });

    it('deletes book', async () => {
      const response = await chai
        .request(app)
        .delete(`/api/books/${book.body.book._id}`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(204);
    });

    it('lets admin delete a book it did not create', async () => {
      const response = await chai
        .request(app)
        .delete(`/api/books/${book.body.book._id}`)
        .set('authorization', `Bearer ${superuser.token}`);

      expect(response.status).to.equal(204);
    });
  });

  describe('failing tests', () => {
    it('fails when no token is provided for protected routes', async () => {
      const response = await chai
        .request(app)
        .post('/api/books/')
        .send({
          book: {
            ...valid_book,
            author_id: author._id,
          },
        });

      const responseBody = response.body;
      expect(response.unauthorized).to.be.true;
      expect(response.status).to.equal(401);
      expect(responseBody.user).to.be.undefined;
      expect(responseBody.error).to.exist;
      expect(responseBody.error.message).to.equal('No authorization token was found');
    });

    it('fails to create invalid book object', async () => {
      const response = await chai
        .request(app)
        .post('/api/books/')
        .set('authorization', `Bearer ${user.token}`)
        .send({
          book: {
            ...invalid_book,
            author_id: author._id,
          },
        });

      expect(response.status).to.equal(500);
      expect(response.body.author).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Book validation failed: summary: Path `summary` is required., isbn: Path `isbn` is required.');
    });

    it('fails to get detail for invalid book ', async () => {
      const response = await chai
        .request(app)
        .get('/api/books/5f49249841523c293c3e387c');

      expect(response.status).to.equal(400);
      expect(response.body.book).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Book does not exist');
    });

    it('fails to update with invalid id', async () => {
      const response = await chai
        .request(app)
        .patch('/api/books/5f49249841523c293c3e387c')
        .set('authorization', `Bearer ${user.token}`)
        .send({ book: modified_book });

      expect(response.status).to.equal(400);
      expect(response.body.book).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Book does not exist');
    });

    it('refuses non-superuser update book created by another user', async () => {
      const response = await chai
        .request(app)
        .patch(`/api/books/${book.body.book._id}`)
        .set('authorization', `Bearer ${alternate_user.token}`)
        .send({ book: modified_book });

      expect(response.status).to.equal(401);
      expect(response.body.book).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('You must either be book creator or an admin to edit this book');
    });

    it('errors out when book object is not provided for create', async () => {
      const response = await chai
        .request(app)
        .post('/api/books/')
        .set('authorization', `Bearer ${user.token}`)
        .send({
          ...valid_book,
          author_id: author._id,
        });

      expect(response.status).to.equal(400);
      expect(response.body.book).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('You need to supply the book object with this request');
    });

    it('errors out when book object is not provided for edit', async () => {
      const response = await chai
        .request(app)
        .patch(`/api/books/${book.body.book._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          ...modified_book,
          author_id: author._id,
        });

      expect(response.status).to.equal(400);
      expect(response.body.book).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('You need to supply the book object with this request');
    });

    it('fails to delete with invalid id', async () => {
      const response = await chai
        .request(app)
        .delete('/api/books/5f49249841523c293c3e387c')
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(400);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Book does not exist');
    });

    it('refuses to let non-superuser delete a book it did not create', async () => {
      const response = await chai
        .request(app)
        .delete(`/api/books/${book.body.book._id}`)
        .set('authorization', `Bearer ${alternate_user.token}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('You must either be book creator or an admin to edit this book');
    });
  });
});
