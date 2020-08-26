const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const { valid_signup_user } = require('./mocks/user');
const { valid_author, invalid_author } = require('./mocks/author');

chai.use(chaiHttp);
const { expect } = chai;

describe.only('Author tests', () => {
  let mongoServer;
  let user;
  beforeEach(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();
    const options = {
      useFindAndModify: false,
      useNewUrlParser: true,
    };
    await mongoose.connect(mongoUri, options);
    // register user
    const user_resp = await chai
      .request(app)
      .post('/api/users/')
      .send({ user: valid_signup_user });
    user = user_resp.body.user;
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {
    it('creates a valid author', async () => {
      const response = await chai
        .request(app)
        .post('/api/authors/')
        .set('authorization', `Bearer ${user.token}`)
        .send(valid_author);

      const responseAuthor = response.body.author;
      expect(response.status).to.equal(201);
      expect(response.body.error).to.be.undefined;
      expect(responseAuthor.first_name).to.equal(valid_author.first_name);
      expect(responseAuthor.family_name).to.equal(valid_author.family_name);
      expect(responseAuthor.date_of_birth).to.equal(valid_author.date_of_birth);
      expect(responseAuthor.date_of_death).to.equal(valid_author.date_of_death);
      expect(responseAuthor.bio).to.equal(valid_author.bio);
      expect(responseAuthor.created_by).to.equal(user._id);
    });
  });

  describe('failing tests', () => {
    it('fails for an invalid author', async () => {
      const response = await chai
        .request(app)
        .post('/api/authors/')
        .set('authorization', `Bearer ${user.token}`)
        .send(invalid_author);

      expect(response.status).to.equal(500);
      expect(response.body.author).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Author validation failed: first_name: can\'t be blank, family_name: can\'t be blank');
    });
  });
});
