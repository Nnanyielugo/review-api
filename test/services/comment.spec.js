const chai = require('chai');
const chaiHttp = require('chai-http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { connect_mongoose } = require('../../api/utils/mongoose');
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

describe('Comment tests', () => {
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

    it('views comments for review', async () => {
      const response = await chai
        .request(app)
        .get(`${review_path}/${review._id}/comments`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.body.comments).to.be.an('array');
      expect(response.body.comments.length).to.equal(1);
      expect(response.body.comments[0]._id).to.equal(comment.body.comment._id);
    });

    it('updates comment', async () => {
      const response_comment = comment.body.comment;
      const response = await chai
        .request(app)
        .patch(`${review_path}/${review._id}/comments/${response_comment._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          comment: alternate_comment,
        });

      const responseComment = response.body.comment;
      const commentBody = comment.body.comment;

      expect(response.body.error).to.be.undefined;
      expect(responseComment._id.toString()).to.equal(commentBody._id.toString());
      expect(responseComment.content).to.equal(alternate_comment.content);
      expect(responseComment.review).to.equal(commentBody.review);
    });

    it('deletes comment', async () => {
      const response_comment = comment.body.comment;
      const response = await chai
        .request(app)
        .delete(`${review_path}/${review._id}/comments/${response_comment._id}`)
        .set('authorization', `Bearer ${user.token}`);

      const review_response = await chai
        .request(app)
        .get(`${review_path}/${review._id}`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(204);
      expect(review_response.body.review.comments.length).to.equal(0);
    });

    it('lets admin delete another user\'s comment', async () => {
      const response_comment = comment.body.comment;
      const response = await chai
        .request(app)
        .delete(`${review_path}/${review._id}/comments/${response_comment._id}`)
        .set('authorization', `Bearer ${superuser.token}`);

      const review_response = await chai
        .request(app)
        .get(`${review_path}/${review._id}`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(204);
      expect(review_response.body.review.comments.length).to.equal(0);
    });

    it('favorites a comment', async () => {
      const response_comment = comment.body.comment;
      await chai
        .request(app)
        .post(`${review_path}/${review._id}/comments/${response_comment._id}/favorite`)
        .set('authorization', `Bearer ${user.token}`)
        .send();

      const response = await chai
        .request(app)
        .get(`${review_path}/${review._id}/comments`)
        .set('authorization', `Bearer ${user.token}`);
      const alt_response = await chai
        .request(app)
        .get(`${review_path}/${review._id}/comments`)
        .set('authorization', `Bearer ${alternate_user.token}`);

      expect(response.body.comments[0].favorited).to.be.true;
      expect(response.body.comments[0].favorites_count).to.equal(1);
      expect(alt_response.body.comments[0].favorited).to.be.false;
      expect(alt_response.body.comments[0].favorites_count).to.equal(1);
    });

    it('unfavorites a comment', async () => {
      const response_comment = comment.body.comment;
      await chai
        .request(app)
        .post(`${review_path}/${review._id}/comments/${response_comment._id}/favorite`)
        .set('authorization', `Bearer ${user.token}`)
        .send();
      await chai
        .request(app)
        .post(`${review_path}/${review._id}/comments/${response_comment._id}/unfavorite`)
        .set('authorization', `Bearer ${user.token}`)
        .send();

      const response = await chai
        .request(app)
        .get(`${review_path}/${review._id}/comments`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.body.comments[0].favorited).to.be.false;
      expect(response.body.comments[0].favorites_count).to.equal(0);
    });
  });

  describe('failing tests', () => {
    it('fails when no token is provided for protected routes', async () => {
      const response = await chai
        .request(app)
        .post(`${review_path}/${review._id}/comments`)
        .send({
          review: {
            ...valid_comment,
          },
        });
      expect(response.unauthorized).to.be.true;
      expect(response.body.error).to.exist;
      expect(response.body.error.message).to.equal('No authorization token was found');
    });

    it('fails to create without a comment object', async () => {
      const response = await chai
        .request(app)
        .post(`${review_path}/${review._id}/comments`)
        .set('authorization', `Bearer ${user.token}`)
        .send({});
      expect(response.status).to.equal(400);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('You need to send the comment object with this request.');
    });

    it('fails to create comment with invalid comment object', async () => {
      const response = await chai
        .request(app)
        .post(`${review_path}/${review._id}/comments`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          comment: {
            ...invalid_comment,
          },
        });
      expect(response.status).to.equal(500);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Comment validation failed: content: Path `content` is required.');
    });

    it('fails when suspended users attempt to create comments', async () => {
      await chai
        .request(app)
        .post(`/api/users/${user._id}/suspend`)
        .set('authorization', `Bearer ${superuser.token}`)
        .send();

      const response = await chai
        .request(app)
        .post(`${review_path}/${review._id}/comments`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          comment: {
            ...alternate_comment,
          },
        });
      expect(response.status).to.equal(403);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Suspended users cannot leave comments!');
    });

    it('fails when suspended users attempt to update comments', async () => {
      const response_comment = comment.body.comment;
      await chai
        .request(app)
        .post(`/api/users/${user._id}/suspend`)
        .set('authorization', `Bearer ${superuser.token}`)
        .send();

      const response = await chai
        .request(app)
        .patch(`${review_path}/${review._id}/comments/${response_comment._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          comment: {
            ...alternate_comment,
          },
        });
      expect(response.status).to.equal(400);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Suspended users cannot edit comments!');
    });

    it('fails to update a comment with an invalid id', async () => {
      const response = await chai
        .request(app)
        .patch(`${review_path}/${review._id}/comments/5eb647261876da18d219125b`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          comment: {
            ...alternate_comment,
          },
        });

      expect(response.status).to.equal(404);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('The comment you are looking for does not exist.');
    });

    it('fails to update witout a comment object', async () => {
      const response_comment = comment.body.comment;
      const response = await chai
        .request(app)
        .patch(`${review_path}/${review._id}/comments/${response_comment._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({});
      expect(response.status).to.equal(400);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('You need to send the comment object with this request.');
    });

    it('fails when a user attempts to update a comment it did not create', async () => {
      const response_comment = comment.body.comment;
      const response = await chai
        .request(app)
        .patch(`${review_path}/${review._id}/comments/${response_comment._id}`)
        .set('authorization', `Bearer ${alternate_user.token}`)
        .send({
          comment: {
            ...alternate_comment,
          },
        });
      expect(response.status).to.equal(403);
    });

    it('fails to delete review with invalid id', async () => {
      const response = await chai
        .request(app)
        .delete(`${review_path}/${review._id}/comments/5f49249841523c293c3e387c`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(404);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('The comment you are looking for does not exist.');
    });

    it('fails to delete when another user attempts do delete a comment it did not create', async () => {
      const response_comment = comment.body.comment;
      const response = await chai
        .request(app)
        .delete(`${review_path}/${review._id}/comments/${response_comment._id}`)
        .set('authorization', `Bearer ${alternate_user.token}`);
      const review_response = await chai
        .request(app)
        .get(`${review_path}/${review._id}`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(403);
      expect(response.body.error.message).to.equal('You must either be comment creator or an admin to delete this comment');
      expect(review_response.body.review.comments.length).to.equal(1);
    });
  });
});
