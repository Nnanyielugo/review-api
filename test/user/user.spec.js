const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const {
  valid_signup_user, modified_user,
  admin_signup_user,
} = require('./mocks');

chai.use(chaiHttp);
const { expect } = chai;

describe('User tests', () => {
  let mongoServer;
  let user;
  let admin;
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
    const admin_resp = await chai
      .request(app)
      .post('/api/users/')
      .send({ user: admin_signup_user });
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
        .get(`/api/users/user/${user._id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send();

      const returnedUser = response.body.user;
      expect(returnedUser).to.be.an('object');
      expect(returnedUser.username).to.equal(valid_signup_user.username);
      expect(returnedUser.email).to.equal(valid_signup_user.email);
    });

    it('fetches the user object when viewing profile as other user', async () => {
      const response = await chai
        .request(app)
        .get(`/api/users/user/${user._id}`)
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
        .patch('/api/users/user')
        .set('authorization', `Bearer ${user.token}`)
        .send({ user: modified_user });

      const returnedUser = response.body.user;
      expect(returnedUser).to.be.an('object');
      expect(returnedUser.username).to.equal(modified_user.username);
      expect(returnedUser.email).to.equal(modified_user.email);
      expect(returnedUser.first_name).to.equal(modified_user.first_name);
      expect(returnedUser.family_name).to.equal(modified_user.family_name);
    });

    it('suspends the user', async () => {
      const response = await chai
        .request(app)
        .post('/api/users/user/suspend')
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
});
