const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connect_mongoose } = require('../../api/utils/mongoose');

const app = require('../../app');
const {
  valid_signup_user, invalid_signup_no_email,
  admin_user, moderator_user,
} = require('../mocks/user');

chai.use(chaiHttp);
const { expect } = chai;

describe('Signup tests', () => {
  const user_path = '/api/users';
  let mongoServer;
  beforeEach(async () => {
    mongoServer = new MongoMemoryServer();
    const mongo_uri = await mongoServer.getUri();
    await connect_mongoose(mongo_uri);
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {
    it('successfully registers regular user', async () => {
      const response = await chai
        .request(app)
        .post(`${user_path}/`)
        .send({ user: valid_signup_user });

      const returnedUser = response.body.user;
      expect(response.body.error).to.be.undefined;
      expect(response.status).to.equal(200);
      expect(returnedUser.activeUser.username).to.equal(valid_signup_user.username);
      expect(returnedUser.activeUser.email).to.equal(valid_signup_user.email.toLowerCase());
      expect(returnedUser.token).to.exist;
      expect(returnedUser.activeUser.user_type).to.equal('user');
    });

    it('successfully registers admin user', async () => {
      const response = await chai
        .request(app)
        .post(`${user_path}/`)
        .send({ user: admin_user });

      const returnedUser = response.body.user;
      expect(response.body.error).to.be.undefined;
      expect(response.status).to.equal(200);
      expect(returnedUser.activeUser.username).to.equal(admin_user.username);
      expect(returnedUser.activeUser.email).to.equal(admin_user.email.toLowerCase());
      expect(returnedUser.token).to.exist;
      expect(returnedUser.activeUser.user_type).to.equal('admin');
    });

    it('successfully registers moderator', async () => {
      const response = await chai
        .request(app)
        .post(`${user_path}/`)
        .send({ user: moderator_user });

      const returnedUser = response.body.user;
      expect(response.body.error).to.be.undefined;
      expect(response.status).to.equal(200);
      expect(returnedUser.activeUser.username).to.equal(moderator_user.username);
      expect(returnedUser.activeUser.email).to.equal(moderator_user.email.toLowerCase());
      expect(returnedUser.token).to.exist;
      expect(returnedUser.activeUser.user_type).to.equal('moderator');
    });
  });

  describe('failing tests', () => {
    it('returns an error when user object isn\'t provided', async () => {
      const response = await chai
        .request(app)
        .post(`${user_path}/`)
        .send(valid_signup_user);

      const responseBody = response.body;
      expect(response.status).to.equal(400);
      expect(responseBody.error).to.exist;
      expect(responseBody.error.message).to.equal('You need to supply the user object with this request');
    });

    it('fails for incomplete user details', async () => {
      const response = await chai
        .request(app)
        .post(`${user_path}/`)
        .send({ user: invalid_signup_no_email });

      expect(response.body.user).to.be.undefined;
      expect(response.status).to.equal(400);
      expect(response.body.error).to.exist;
      expect(response.body.error.message).to.be.a('string');
      expect(response.body.error.message).to.equal('Required form values need to be complete!');
    });

    it.skip('fails to register duplicate users', () => {});
  });
});
