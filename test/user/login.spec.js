const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const { valid_signup_user, valid_login, invalid_login } = require('./mocks');


chai.use(chaiHttp);

const { expect } = chai;

describe('Login tests', () => {
  let mongoServer;

  beforeEach(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri);

    await chai
      .request(app)
      .post('/api/users/')
      .send({ user: valid_signup_user });
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {
    it('successfully logs in', async () => {
      const response = await chai
        .request(app)
        .post('/api/users/login')
        .send({ user: valid_login });

      expect(response.body.user).to.exist;
      expect(response.body.user).to.be.an('object');
      expect(response.body.user.email).to.equal(valid_login.email);
      expect(response.body.user.username).to.equal(valid_signup_user.username);
    });
  });

  describe('failing tests', () => {
    it('fails for wrong user details', async () => {
      const response = await chai
        .request(app)
        .post('/api/users/login')
        .send({ user: invalid_login });

      expect(response.body.user).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Email or password is invalid');
    });
  });
});
