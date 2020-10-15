const chai = require('chai');
const chaiHttp = require('chai-http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const connect_mongoose = require('../../api/utils/mongoose_utils');
const app = require('../../app');

const {
  valid_signup_user, admin_user, alternate_signup_user,
} = require('../mocks/user');
const {
  valid_comment, alternate_comment, invalid_comment,
} = require('../mocks/comment');
const { valid_review, alternate_review } = require('../mocks/review');
const { valid_book } = require('../mocks/book');
const { valid_author } = require('../mocks/author');

chai.use(chaiHttp);
const { expect } = chai;

describe.only('Comment tests', () => {
  const review_path = '/api/reviews';
  const book_path = '/api/books';
  const user_path = '/api/users';
  const author_path = '/api/authors';
  let mongoServer;
  let user;
  let alternate_user;
  let superuser;
  let author;
  let review;
  let book;
  let comment;

  beforeEach(async () => {
    mongoServer = new MongoMemoryServer();
    const mongo_uri = await mongoServer.getUri();
    await connect_mongoose(mongo_uri);

    // create 3 users
    const user_resp = await chai
      .request(app)
      .post(`${user_path}/`)
      .send({ user: valid_signup_user });
    user = user_resp.body.user;

    const alternate_user_resp = await chai
      .request(app)
      .post(`${user_path}/`)
      .send({ user: alternate_signup_user });
    alternate_user = alternate_user_resp.body.user;

    const superuser_resp = await chai
      .request(app)
      .post(`${user_path}/`)
      .send({ user: admin_user });
    superuser = superuser_resp.body.user;

    // create author
    const author_resp = await chai
      .request(app)
      .post(`${author_path}/`)
      .set('authorization', `Bearer ${user.token}`)
      .send({ author: valid_author });
    author = author_resp.body.author;

    // create book
    const valid_book_resp = await chai
      .request(app)
      .post(`${book_path}/`)
      .set('authorization', `Bearer ${user.token}`)
      .send({
        book: {
          ...valid_book,
          author_id: author._id,
        },
      });
    book = valid_book_resp.body.book;

    // create review
    const valid_review_resp = await chai
      .request(app)
      .post(`${review_path}/`)
      .set('authorization', `Bearer ${user.token}`)
      .send({
        review: {
          ...valid_review,
          book_id: book._id,
        },
      });
    review = valid_review_resp.body.review;

    // create comment
    const valid_comment_resp = await chai
      .request(app)
      .post(`${review_path}/${review._id}/comments`)
      .set('authorization', `Bearer ${user.token}`)
      .send({
        comment: valid_comment,
      });
    comment = valid_comment_resp;
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {
    it('creates a comment', async () => {
      const response = await chai
        .request(app)
        .get(`${review_path}/${review._id}`)
        .set('authorization', `Bearer ${user.token}`);

      const response_comment = comment.body.comment;
      expect(response_comment.content).to.equal(valid_comment.content);
      expect(response_comment.review).to.equal(review._id);
      expect(response.body.review.comments[0].toString()).to.equal(response_comment._id.toString());
    });
  });
});
