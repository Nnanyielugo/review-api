const chai = require('chai');
const chaiHttp = require('chai-http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const connect_mongoose = require('../../api/utils/mongoose_utils');
const app = require('../../app');
const {
  valid_signup_user, alternate_signup_user,
  admin_user,
} = require('../mocks/user');
const {
  valid_author, invalid_author,
  modified_author, alternate_author,
} = require('../mocks/author');

chai.use(chaiHttp);
const { expect } = chai;

describe('Book tests', () => {
  let mongoServer;
  let user;
  let alternate_user;
  let author;
  let superuser;
  let alternate_author_obj;
  beforeEach(async () => {
    mongoServer = new MongoMemoryServer();
    const mongo_uri = await mongoServer.getUri();
    await connect_mongoose(mongo_uri);
    // register user
    const user_resp = await chai
      .request(app)
      .post('/api/users/')
      .send({ user: valid_signup_user });
    user = user_resp.body.user;

    const alternate_user_resp = await chai
      .request(app)
      .post('/api/users/')
      .send({ user: alternate_signup_user });
    alternate_user = alternate_user_resp.body.user;

    const superuser_resp = await chai
      .request(app)
      .post('/api/users/')
      .send({ user: admin_user });
    superuser = superuser_resp.body.user;

    // create author
    const author_resp = await chai
      .request(app)
      .post('/api/authors/')
      .set('authorization', `Bearer ${user.token}`)
      .send(valid_author);
    author = author_resp.body.author;

    const alternate_author_resp = await chai
      .request(app)
      .post('/api/authors/')
      .set('authorization', `Bearer ${alternate_user.token}`)
      .send(alternate_author);
    alternate_author_obj = alternate_author_resp.body.author;
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {});
});
