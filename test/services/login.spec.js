const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const connect_mongoose = require('../../api/utils/mongoose_utils');
const app = require('../../app');
const { valid_signup_user, valid_login, invalid_login } = require('../mocks/user');

chai.use(chaiHttp);
const { expect } = chai;

describe('Login tests', () => {
  const user_path = '/api/users';
  let mongoServer;

  beforeEach(async () => {
    mongoServer = new MongoMemoryServer();
    const mongo_uri = await mongoServer.getUri();
    await connect_mongoose(mongo_uri);
    // register user
    await chai
      .request(app)
      .post(`${user_path}/`)
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
        .post(`${user_path}/login`)
        .send({ user: valid_login });

      const responseUser = response.body.user;
      expect(response.body.error).to.be.undefined;
      expect(responseUser).to.exist;
      expect(responseUser).to.be.an('object');
      expect(responseUser.email).to.equal(valid_login.email.toLowerCase());
      expect(responseUser.username).to.equal(valid_signup_user.username);
    });
  });

  describe('failing tests', () => {
    it('fails for wrong user details', async () => {
      const response = await chai
        .request(app)
        .post(`${user_path}/login`)
        .send({ user: invalid_login });

      expect(response.body.user).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Email or password is invalid');
    });

    it('returns an error when user object isn\'t provided', async () => {
      const response = await chai
        .request(app)
        .post(`${user_path}/login`)
        .send(valid_login);

      const responseBody = response.body;
      expect(response.status).to.equal(400);
      expect(responseBody.error).to.exist;
      expect(responseBody.error.message).to.equal('You need to supply the user object with this request');
    });
  });
});
