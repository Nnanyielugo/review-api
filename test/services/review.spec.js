const chai = require('chai');
const chaiHttp = require('chai-http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const connect_mongoose = require('../../api/utils/mongoose_utils');
const app = require('../../app');

const {
  valid_review, alternate_review, invalid_review,
} = require('../mocks/review');
const {
  valid_signup_user, admin_user, alternate_signup_user,
} = require('../mocks/user');
const { valid_book } = require('../mocks/book');
const { valid_author } = require('../mocks/author');

chai.use(chaiHttp);
const { expect } = chai;

describe('Review tests', () => {
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
    review = valid_review_resp;
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {
    it('fetches list of reviews', async () => {
      const response = await chai
        .request(app)
        .get(`${review_path}/`);

      expect(response.body.reviews).to.be.an('array');
      expect(response.body.reviewsCount).to.equal(1);
      expect(response.body.reviews[0].slug).to.equal(review.body.review.slug);
    });

    it('creates a single review', () => {
      expect(review.body.error).to.be.undefined;
      expect(review.status).to.equal(201);
      expect(review.body.review.content).to.equal(valid_review.content);
    });

    it('fetches a single review', async () => {
      const response = await chai
        .request(app)
        .get(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.body.error).to.be.undefined;
      expect(response.body.review._id).to.equal(review.body.review._id);
      expect(response.body.review.content).to.equal(review.body.review.content);
    });

    it('adds review id to book.reviews of the book being reviewed', () => {
      expect(review.body.error).to.be.undefined;
      expect(review.status).to.equal(201);
      expect(review.body.review.book.reviews[0].toString()).to.equal(review.body.review._id);
    });

    it('edits a review', async () => {
      const response = await chai
        .request(app)
        .patch(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          review: {
            ...alternate_review,
          },
        });

      expect(response.status).to.equal(200);
      expect(response.body.error).to.be.undefined;
      expect(response.body.review._id).to.equal(review.body.review._id);
      expect(response.body.review.content).to.equal(alternate_review.content);
    });

    it('deletes a review', async () => {
      const response = await chai
        .request(app)
        .delete(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${user.token}`);
      const list = await chai
        .request(app)
        .get(`${review_path}`);

      expect(response.status).to.equal(204);
      expect(list.body.reviewsCount).to.equal(0);
    });

    it('lets admin user delete a review it did not create', async () => {
      const response = await chai
        .request(app)
        .delete(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${superuser.token}`);
      const list = await chai
        .request(app)
        .get(`${review_path}`);

      expect(response.status).to.equal(204);
      expect(list.body.reviewsCount).to.equal(0);
    });

    it('favorites a review', async () => {
      await chai
        .request(app)
        .post(`${review_path}/${review.body.review._id}/favorite`)
        .set('authorization', `Bearer ${user.token}`)
        .send();

      const response = await chai
        .request(app)
        .get(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${user.token}`);
      const alt_response = await chai
        .request(app)
        .get(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${alternate_user.token}`);

      expect(response.body.review.favorited).to.be.true;
      expect(response.body.review.favorites_count).to.equal(1);
      expect(alt_response.body.review.favorited).to.be.false;
      expect(alt_response.body.review.favorites_count).to.equal(1);
    });

    it('unfavorites a review', async () => {
      await chai
        .request(app)
        .post(`${review_path}/${review.body.review._id}/favorite`)
        .set('authorization', `Bearer ${user.token}`)
        .send();

      await chai
        .request(app)
        .post(`${review_path}/${review.body.review._id}/unfavorite`)
        .set('authorization', `Bearer ${user.token}`)
        .send();

      const response = await chai
        .request(app)
        .get(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.body.review.favorited).to.be.false;
      expect(response.body.review.favorites_count).to.equal(0);
    });
  });

  describe('failing tests', () => {
    it('fails when no token is provided for protected routes', async () => {
      const response = await chai
        .request(app)
        .post(`${review_path}/`)
        .send({
          review: {
            ...valid_review,
            book_id: book._id,
          },
        });
      expect(response.unauthorized).to.be.true;
      expect(response.body.error).to.exist;
      expect(response.body.error.message).to.equal('No authorization token was found');
    });

    it('fails to create review with invalid review object', async () => {
      const response = await chai
        .request(app)
        .post(`${review_path}/`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          review: {
            ...invalid_review,
            book_id: book._id,
          },
        });
      expect(response.status).to.equal(500);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Review validation failed: content: Path `content` is required.');
    });

    it('fails to create with an invalid bookid', async () => {
      const response = await chai
        .request(app)
        .post(`${review_path}/`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          review: {
            ...invalid_review,
            book_id: '5eb647261876da18d219125b',
          },
        });
      expect(response.status).to.equal(400);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('The book you are trying to review does not exist!');
    });

    it('fails when suspended users attempt to create reviews', async () => {
      await chai
        .request(app)
        .post(`/api/users/${user._id}/suspend`)
        .set('authorization', `Bearer ${superuser.token}`)
        .send();

      const response = await chai
        .request(app)
        .post(`${review_path}/`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          review: {
            ...valid_review,
            book_id: book._id,
          },
        });
      // console.log(respon/se.body)
      expect(response.status).to.equal(400);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Suspended users cannot make reviews!');
    });

    it('fails to fetch a review with an invalid id', async () => {
      const response = await chai
        .request(app)
        .get(`${review_path}/5eb647261876da18d219125b`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(404);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('The review you are looking for does not exist.');
    });

    it('fails to update witout a review object', async () => {
      const response = await chai
        .request(app)
        .patch(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({});
      expect(response.status).to.equal(400);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('You need to send the review object with this request.');
    });

    it('fails to update witout an invalid review id', async () => {
      const response = await chai
        .request(app)
        .patch(`${review_path}/5eb647261876da18d219125b`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          review: {
            ...alternate_review,
          },
        });
      expect(response.status).to.equal(404);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('The review you are looking for does not exist.');
    });

    it('fails when suspended users attempt to update reviews', async () => {
      await chai
        .request(app)
        .post(`/api/users/${user._id}/suspend`)
        .set('authorization', `Bearer ${superuser.token}`)
        .send();

      const response = await chai
        .request(app)
        .patch(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          review: {
            ...alternate_review,
            book_id: book._id,
          },
        });
      expect(response.status).to.equal(400);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Suspended users cannot make reviews!');
    });

    it('fails when a user attempts to update a review it did not create', async () => {
      const response = await chai
        .request(app)
        .patch(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${alternate_user.token}`)
        .send({
          review: {
            ...alternate_review,
            book_id: book._id,
          },
        });
      expect(response.status).to.equal(403);
    });

    it('fails to delete review with invalid id', async () => {
      const response = await chai
        .request(app)
        .delete(`${review_path}/5f49249841523c293c3e387c`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(404);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('The review you are looking for does not exist.');
    });

    it('fails to delete when another user attempts do delete a review it did not create', async () => {
      const response = await chai
        .request(app)
        .delete(`${review_path}/${review.body.review._id}`)
        .set('authorization', `Bearer ${alternate_user.token}`);
      const list = await chai
        .request(app)
        .get(`${review_path}`);

      expect(response.status).to.equal(403);
      expect(response.body.error.message).to.equal('You must either be book creator or an admin to delete this review');
      expect(list.body.reviewsCount).to.equal(1);
    });
  });
});
