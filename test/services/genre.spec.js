const chai = require('chai');
const chaiHttp = require('chai-http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { connect_mongoose } = require('../../api/utils/mongoose');

const app = require('../../app');
const { valid_genre, alternate_genre } = require('../mocks/genre');
const {
  valid_signup_user, admin_user, alternate_signup_user,
} = require('../mocks/user');

chai.use(chaiHttp);
const { expect } = chai;

describe.only('Genre tests', () => {
  const genre_path = '/api/genres';
  const user_path = '/api/users';
  let genre;
  let user;
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
  });

  describe('failing tests', () => {
    it('fails to let regular user create a genre', async () => {
      const user_resp = await chai
        .request(app)
        .post(`${user_path}/`)
        .send({ user: valid_signup_user });

      user = user_resp.body.user;
      const response = await chai
        .request(app)
        .post(`${genre_path}/`)
        .set('authorization', `Bearer ${user_resp.body.user.token}`)
        .send({
          genre: {
            ...valid_genre,
          },
        });

      expect(response.status).to.equal(403);
      expect(response.body.error).to.exist;
      expect(response.body.error.message).to.equal('Only admins and moderators are allowed to create genres!');
    });
  });
});
