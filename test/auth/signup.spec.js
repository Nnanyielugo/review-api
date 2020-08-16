const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const { valid_signup_user, invalid_signup_no_email } = require('./mocks');

chai.use(chaiHttp);
const { expect } = chai;

describe('Signup tests', () => {
  let mongoServer;
  beforeEach(async () => {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {
    it('successfully registers user', async () => {
      const response = await chai
        .request(app)
        .post('/api/users/')
        .send({ user: valid_signup_user });

      expect(response.body.error).to.be.undefined;
      expect(response.status).to.equal(200);
      expect(response.body.user.username).to.equal(valid_signup_user.username);
      expect(response.body.user.email).to.equal(valid_signup_user.email);
      expect(response.body.user.token).to.exist;
    });
  });

  describe('failing tests', () => {
    it('fails for incomplete user details', async () => {
      const response = await chai
        .request(app)
        .post('/api/users/')
        .send({ user: invalid_signup_no_email });

      expect(response.body.user).to.be.undefined;
      expect(response.status).to.equal(400);
      expect(response.body.error).to.exist;
      expect(response.body.error.message).to.be.a('string');
      expect(response.body.error.message).to.equal('Required form values need to be complete!');
    });
  });
});
