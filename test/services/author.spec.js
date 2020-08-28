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

describe('Author tests', () => {
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
      .send({ author: valid_author });
    author = author_resp;

    const alternate_author_resp = await chai
      .request(app)
      .post('/api/authors/')
      .set('authorization', `Bearer ${alternate_user.token}`)
      .send({ author: alternate_author });
    alternate_author_obj = alternate_author_resp.body.author;
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('passing tests', () => {
    it('creates a valid author', async () => {
      const responseAuthor = author.body.author;
      expect(author.status).to.equal(201);
      expect(author.body.error).to.be.undefined;
      expect(responseAuthor.first_name).to.equal(valid_author.first_name);
      expect(responseAuthor.family_name).to.equal(valid_author.family_name);
      expect(responseAuthor.date_of_birth).to.equal(valid_author.date_of_birth);
      expect(responseAuthor.date_of_death).to.equal(valid_author.date_of_death);
      expect(responseAuthor.bio).to.equal(valid_author.bio);
      expect(responseAuthor.created_by).to.equal(user._id);
    });

    it('list authors and sorts by family name', async () => {
      const response = await chai
        .request(app)
        .get('/api/authors/');

      expect(response.status).to.equal(200);
      expect(response.body.length).to.equal(2);
      // sorts by family name, so Ernser would come before Stehr
      expect(response.body[0].first_name).to.equal(alternate_author_obj.first_name);
      expect(response.body[1].first_name).to.equal(author.body.author.first_name);
    });

    it('gets a single author', async () => {
      const author_id = author.body.author._id;
      const response = await chai
        .request(app)
        .get(`/api/authors/${author_id}`);

      const responseAuthor = response.body.author;
      expect(response.status).to.equal(200);
      expect(response.body.error).to.be.undefined;
      expect(responseAuthor).to.be.an('object');
      expect(responseAuthor._id).to.equal(author_id);
      expect(responseAuthor.books.length).to.equal(0);
      expect(responseAuthor.first_name).to.equal(author.body.author.first_name);
      expect(responseAuthor.last_name).to.equal(author.body.author.last_name);
      expect(responseAuthor.bio).to.equal(author.body.author.bio);
      expect(responseAuthor.date_of_birth).to.equal(author.body.author.date_of_birth);
      expect(responseAuthor.date_of_death).to.equal(author.body.author.date_of_death);
      expect(responseAuthor.created_by._id.toString()).to.equal(user._id.toString());
    });

    it('it modifies an existing author', async () => {
      const author_id = author.body.author._id;
      const response = await chai
        .request(app)
        .patch(`/api/authors/${author_id}`)
        .set('authorization', `Bearer ${user.token}`)
        .send({ author: modified_author });

      const responseAuthor = response.body.author;
      expect(response.status).to.equal(201);
      expect(response.body.error).to.be.undefined;
      expect(responseAuthor).to.be.an('object');
      expect(responseAuthor._id).to.equal(author.body.author._id);
      expect(responseAuthor.books.length).to.equal(author.body.author.books.length);
      expect(responseAuthor.first_name).to.equal(modified_author.first_name);
      expect(responseAuthor.last_name).to.equal(modified_author.last_name);
      expect(responseAuthor.bio).to.equal(modified_author.bio);
      expect(responseAuthor.date_of_birth).to.equal(modified_author.date_of_birth);
      expect(responseAuthor.date_of_death).to.equal(modified_author.date_of_death);
      expect(responseAuthor.created_by._id.toString()).to.equal(user._id.toString());
    });

    it('it lets a superuser edit an author it did not create', async () => {
      const author_id = author.body.author._id;
      const response = await chai
        .request(app)
        .patch(`/api/authors/${author_id}`)
        .set('authorization', `Bearer ${superuser.token}`)
        .send({ author: modified_author });

      const responseAuthor = response.body.author;
      expect(response.status).to.equal(201);
      expect(response.body.error).to.be.undefined;
      expect(responseAuthor).to.be.an('object');
      expect(responseAuthor._id).to.equal(author.body.author._id);
      expect(responseAuthor.books.length).to.equal(author.body.author.books.length);
      expect(responseAuthor.first_name).to.equal(modified_author.first_name);
      expect(responseAuthor.last_name).to.equal(modified_author.last_name);
      expect(responseAuthor.bio).to.equal(modified_author.bio);
      expect(responseAuthor.date_of_birth).to.equal(modified_author.date_of_birth);
      expect(responseAuthor.date_of_death).to.equal(modified_author.date_of_death);
      expect(responseAuthor.created_by._id.toString()).to.equal(user._id.toString());
    });

    it('deletes an existing author', async () => {
      const author_id = author.body.author._id;
      const response = await chai
        .request(app)
        .delete(`/api/authors/${author_id}`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(204);
    });

    it('lets superuser delete an author it did not create', async () => {
      const author_id = author.body.author._id;
      const response = await chai
        .request(app)
        .delete(`/api/authors/${author_id}`)
        .set('authorization', `Bearer ${superuser.token}`);

      expect(response.status).to.equal(204);
    });
  });

  describe('failing tests', () => {
    it('fails when no token is provided for protected routes', async () => {
      const response = await chai
        .request(app)
        .post('/api/authors/')
        .send({ author: valid_author });

      expect(response.unauthorized).to.be.true;
      expect(response.status).to.equal(401);
      expect(response.body.author).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('No authorization token was found');
    });

    it('fails to create for an invalid author object', async () => {
      const response = await chai
        .request(app)
        .post('/api/authors/')
        .set('authorization', `Bearer ${user.token}`)
        .send({ author: invalid_author });

      expect(response.status).to.equal(500);
      expect(response.body.author).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Author validation failed: first_name: can\'t be blank, family_name: can\'t be blank');
    });

    it('fails for invalid author id', async () => {
      const response = await chai
        .request(app)
        .patch('/api/authors/5f48345bdb170e117aa39151')
        .set('authorization', `Bearer ${user.token}`)
        .send({ author: modified_author });

      expect(response.status).to.equal(404);
      expect(response.body.author).to.be.undefined;
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('Author does not exist');
    });

    it('it fails when user isn\'t creator of author, or superuser', async () => {
      const author_id = author.body.author._id;
      const response = await chai
        .request(app)
        .patch(`/api/authors/${author_id}`)
        .set('authorization', `Bearer ${alternate_user.token}`)
        .send({ author: modified_author });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('You must either be author author or an admin to edit this author');
    });

    it('fails when user didn\'t create author, or is not a superuser', async () => {
      const response = await chai
        .request(app)
        .delete(`/api/authors/${alternate_author_obj._id}`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.message).to.equal('You must either be author creator or an admin to delete this author');
    });

    // TODO: failing test for author books
    it.skip('fails when author still has books', async () => {
      const author_id = author.body.author._id;
      const response = await chai
        .request(app)
        .delete(`/api/authors/${author_id}`)
        .set('authorization', `Bearer ${user.token}`);

      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal('Author has books. Delete first, then try again');
    });
  });
});
