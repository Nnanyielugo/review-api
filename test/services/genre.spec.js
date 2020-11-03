const chai = require('chai');
const chaiHttp = require('chai-http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { connect_mongoose } = require('../../api/utils/mongoose');

const app = require('../../app');
const { valid_genre, alternate_genre, modified_genre } = require('../mocks/genre');
const { valid_signup_user, admin_user } = require('../mocks/user');
const { valid_book, alternate_book } = require('../mocks/book');
const { valid_author } = require('../mocks/author');


chai.use(chaiHttp);
const { expect } = chai;

describe('Genre tests', () => {
  const genre_path = '/api/genres';
  const user_path = '/api/users';
  const book_path = '/api/books';
  const author_path = '/api/authors';
  let genre;
  let alt_genre;
  let user;
  let book;
  let alt_book;
  let author;
  let superuser;
  let mongoServer;
  beforeEach(async () => {
    mongoServer = new MongoMemoryServer();
    const mongo_uri = await mongoServer.getUri();
    await connect_mongoose(mongo_uri);

    const superuser_resp = await chai
      .request(app)
      .post(`${user_path}/`)
      .send({ user: admin_user });
    superuser = superuser_resp.body.user;

    const valid_genre_resp = await chai
      .request(app)
      .post(`${genre_path}/`)
      .set('authorization', `Bearer ${superuser.token}`)
      .send({
        genre: {
          ...valid_genre,
        },
      });
    genre = valid_genre_resp;

    const alternate_genre_resp = await chai
      .request(app)
      .post(`${genre_path}/`)
      .set('authorization', `Bearer ${superuser.token}`)
      .send({
        genre: {
          ...alternate_genre,
        },
      });
    alt_genre = alternate_genre_resp;

    const author_resp = await chai
      .request(app)
      .post(`${author_path}/`)
      .set('authorization', `Bearer ${superuser.token}`)
      .send({ author: valid_author });
    author = author_resp.body.author;

    // create books
    const book_resp = await chai
      .request(app)
      .post(`${book_path}/`)
      .set('authorization', `Bearer ${superuser.token}`)
      .send({
        book: {
          ...valid_book,
          author_id: author._id,
          genre: [genre.body.genre._id, alt_genre.body.genre._id],
        },
      });
    book = book_resp.body.book;

    const alt_book_resp = await chai
      .request(app)
      .post(`${book_path}/`)
      .set('authorization', `Bearer ${superuser.token}`)
      .send({
        book: {
          ...alternate_book,
          author_id: author._id,
          genre: [genre.body.genre._id],
        },
      });
    alt_book = alt_book_resp.body.book;
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {
    it('creates a genre', () => {
      expect(genre.body.genre.name).to.equal(valid_genre.name);
      expect(genre.body.genre.genre_author.username).to.equal(admin_user.username);
    });

    it('lists genres', async () => {
      const response = await chai
        .request(app)
        .get(`${genre_path}/`);

      expect(response.body.genres).to.be.an('array');
      expect(response.body.genres.length).to.equal(2);
      expect(response.body.genres[0].name).to.equal(valid_genre.name);
      expect(response.body.genres[1].name).to.equal(alternate_genre.name);
    });

    it('gets genre details', async () => {
      const response = await chai
        .request(app)
        .get(`${genre_path}/${genre.body.genre._id}`);

      expect(response.body.genre.name).to.equal(genre.body.genre.name);
      expect(response.body.books.length).to.equal(2);
    });

    it('updates genre', async () => {
      const response = await chai
        .request(app)
        .patch(`${genre_path}/${genre.body.genre._id}`)
        .set('authorization', `Bearer ${superuser.token}`)
        .send({
          genre: {
            ...modified_genre,
          },
        });

      expect(response.body.genre._id).to.equal(genre.body.genre._id);
      expect(response.body.genre.name).to.equal(modified_genre.name);
    });

    it('deletes genre', async () => {
      const del_book1 = chai
        .request(app)
        .delete(`${book_path}/${book._id}`)
        .set('authorization', `Bearer ${superuser.token}`);
      const del_book2 = chai
        .request(app)
        .delete(`${book_path}/${alt_book._id}`)
        .set('authorization', `Bearer ${superuser.token}`);
      await Promise.all([del_book1, del_book2]);
      const response = await chai
        .request(app)
        .delete(`${genre_path}/${genre.body.genre._id}`)
        .set('authorization', `Bearer ${superuser.token}`);

      expect(response.status).to.equal(204);
    });
  });

  describe('failing tests', () => {
    beforeEach(async () => {
      const user_resp = await chai
        .request(app)
        .post(`${user_path}/`)
        .send({ user: valid_signup_user });

      user = user_resp.body.user;
    });

    it('fails when no token is provided for protected routes', async () => {
      const response = await chai
        .request(app)
        .post(`${genre_path}/`)
        .send({
          genre: {
            ...valid_genre,
          },
        });
      expect(response.unauthorized).to.be.true;
      expect(response.body.error).to.exist;
      expect(response.body.error.message).to.equal('No authorization token was found');
    });

    it('fails to create genre without genre object', async () => {
      const response = await chai
        .request(app)
        .post(`${genre_path}/`)
        .set('authorization', `Bearer ${superuser.token}`)
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('You need to send the genre object with this request.');
    });

    it('fails to create genre with invalid genre object', async () => {
      const response = await chai
        .request(app)
        .post(`${genre_path}/`)
        .set('authorization', `Bearer ${superuser.token}`)
        .send({
          genre: {},
        });

      expect(response.status).to.equal(500);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Genre validation failed: name: Path `name` is required.');
    });

    it('fails to let regular user create a genre', async () => {
      const response = await chai
        .request(app)
        .post(`${genre_path}/`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          genre: {
            ...valid_genre,
          },
        });

      expect(response.status).to.equal(403);
      expect(response.body.error).to.exist;
      expect(response.body.error.message).to.equal('Only admins and moderators are allowed to create genres!');
    });

    it('fails to create duplicate genres', async () => {
      const response = await chai
        .request(app)
        .post(`${genre_path}/`)
        .set('authorization', `Bearer ${superuser.token}`)
        .send({
          genre: {
            ...valid_genre,
          },
        });

      const list_resp = await chai
        .request(app)
        .get(`${genre_path}/`);

      expect(response.body.error).to.exist;
      expect(response.body.error.message).to.equal('Genre validation failed: name: Error, expected `name` to be unique. Value: `romance`');
      expect(list_resp.body.genres.length).to.equal(2);
    });

    it('fails to view with an invalid genre id', async () => {
      const response = await chai
        .request(app)
        .get(`${genre_path}/5eb647261876da18d219125b`);

      expect(response.status).to.equal(404);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('The genre you are looking for does not exist.');
    });

    it('fails to let another user edit a genre it did not create', async () => {
      const response = await chai
        .request(app)
        .patch(`${genre_path}/${genre.body.genre._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({
          genre: {
            ...modified_genre,
          },
        });

      expect(response.status).to.equal(403);
    });

    it('fails to delete a genre that still has books', async () => {
      const response = await chai
        .request(app)
        .delete(`${genre_path}/${genre.body.genre._id}`)
        .set('authorization', `Bearer ${superuser.token}`);

      expect(response.status).to.equal(400);
      expect(response.body.error.message).to.equal('This genre has books. Please remove books in Genre and try again');
    });

    it('fails to let another user delete a genre it did not create', async () => {
      const response = await chai
        .request(app)
        .delete(`${genre_path}/${genre.body.genre._id}`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(403);
    });
  });
});
