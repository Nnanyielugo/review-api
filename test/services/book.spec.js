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
const { valid_book, invalid_book, alternate_book } = require('../mocks/book');

chai.use(chaiHttp);
const { expect } = chai;

describe.only('Book tests', () => {
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
      .send(valid_author);
    author = author_resp.body.author;

    const alternate_author_resp = await chai
      .request(app)
      .post('/api/authors/')
      .set('authorization', `Bearer ${alternate_user.token}`)
      .send(alternate_author);
    alternate_author_obj = alternate_author_resp.body.author;

    const valid_book_resp = await chai
      .request(app)
      .post('/api/books/')
      .set('authorization', `Bearer ${user.token}`)
      .send({
        ...valid_book,
        author_id: author._id,
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
          ...alternate_book,
          author_id: author._id,
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
  });
});
