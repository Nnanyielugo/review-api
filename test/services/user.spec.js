const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const connect_mongoose = require('../../api/utils/mongoose_utils');
const app = require('../../app');
const {
  valid_signup_user, modified_user,
  admin_user, alternate_signup_user,
} = require('../mocks/user');

chai.use(chaiHttp);
const { expect } = chai;

describe('User tests', () => {
  const user_path = '/api/users';
  let mongoServer;
  let user;
  let admin;
  beforeEach(async () => {
    mongoServer = new MongoMemoryServer();
    const mongo_uri = await mongoServer.getUri();
    await connect_mongoose(mongo_uri);
    // register user
    const user_resp = await chai
      .request(app)
      .post(`${user_path}/`)
      .send({ user: valid_signup_user });
    // register admin
    const admin_resp = await chai
      .request(app)
      .post(`${user_path}/`)
      .send({ user: admin_user });
    user = user_resp.body.user;
    admin = admin_resp.body.user;
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {
    it('fetches the auth user object when viewing own profile', async () => {
      const response = await chai
        .request(app)
        .get(`${user_path}/${user._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send();

      const returnedUser = response.body.user;
      expect(returnedUser).to.be.an('object');
      expect(returnedUser.username).to.equal(valid_signup_user.username);
      expect(returnedUser.email).to.equal(valid_signup_user.email.toLowerCase());
    });

    it('fetches the user object when viewing profile as other user', async () => {
      const response = await chai
        .request(app)
        .get(`${user_path}/${user._id}`)
        .send();

      const returnedUser = response.body.user;
      expect(returnedUser).to.be.an('object');
      expect(returnedUser.username).to.equal(valid_signup_user.username);
      expect(returnedUser.email).to.be.undefined;
      expect(returnedUser.following).to.exist;
      expect(returnedUser.followers).to.be.an('array');
      expect(returnedUser.follower_count).to.equal(0);
    });

    it('edits the user', async () => {
      const response = await chai
        .request(app)
        .patch(`${user_path}/${user._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({ user: modified_user });

      const returnedUser = response.body.user;
      expect(returnedUser).to.be.an('object');
      expect(returnedUser.username).to.equal(modified_user.username);
      expect(returnedUser.email).to.equal(modified_user.email.toLowerCase());
      expect(returnedUser.first_name).to.equal(modified_user.first_name);
      expect(returnedUser.family_name).to.equal(modified_user.family_name);
    });

    it('suspends the user', async () => {
      const response = await chai
        .request(app)
        .post(`${user_path}/${user._id}/suspend`)
        .set('authorization', `Bearer ${admin.token}`)
        .send({ user: { _id: user._id } });

      const returnedUser = response.body.user;
      expect(returnedUser).to.be.an('object');
      expect(returnedUser.username).to.equal(user.username);
      expect(returnedUser.first_name).to.equal(user.first_name);
      expect(returnedUser.family_name).to.equal(user.family_name);
      expect(returnedUser.suspended).to.be.true;
    });
  });

  describe('failing tests', () => {
    let alternate_user;
    beforeEach(async () => {
      const _user_resp = await chai
        .request(app)
        .post(`${user_path}/`)
        .send({ user: alternate_signup_user });
      alternate_user = _user_resp.body.user;
    });

    it('returns an error when user object isn\'t provided', async () => {
      const response = await chai
        .request(app)
        .patch(`${user_path}/${user._id}`)
        .set('authorization', `Bearer ${user.token}`);

      const responseBody = response.body;
      expect(response.status).to.equal(400);
      expect(responseBody.error).to.exist;
      expect(responseBody.error.message).to.equal('You need to supply the user object with this request');
    });

    it('returns an error when another user tried to edit a user profile', async () => {
      const response = await chai
        .request(app)
        .patch(`${user_path}/${user._id}`)
        .set('authorization', `Bearer ${alternate_user.token}`)
        .send({ user: modified_user });

      const responseBody = response.body;
      expect(response.status).to.equal(400);
      expect(responseBody.error).to.exist;
      expect(responseBody.error.message).to.equal("Cannot edit another user's profile!");
    });

    it('returns an error when a non super user tries to suspend another user', async () => {
      const response = await chai
        .request(app)
        .post(`${user_path}/${user._id}/suspend`)
        .set('authorization', `Bearer ${alternate_user.token}`)
        .send({ user: { _id: user._id } });

      const responseBody = response.body;
      expect(response.status).to.equal(401);
      expect(responseBody.user).to.be.undefined;
      expect(responseBody.error).to.exist;
      expect(responseBody.error.message).to.equal('You have to be an admin or a moderator to perform this action');
    });

    it('fails when no token is provided for protected routes', async () => {
      const response = await chai
        .request(app)
        .post(`${user_path}/${user._id}/suspend`)
        .send({ user: { _id: user._id } });

      const responseBody = response.body;
      expect(response.unauthorized).to.be.true;
      expect(response.status).to.equal(401);
      expect(responseBody.user).to.be.undefined;
      expect(responseBody.error).to.exist;
      expect(responseBody.error.message).to.equal('No authorization token was found');
    });
  });
});
