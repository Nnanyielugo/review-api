const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');

chai.use(chaiHttp);
const { expect } = chai;

describe('App tests', () => {
  describe('passing tests', () => {
    it('gets to the index route', async () => {
      const response = await chai
        .request(app)
        .get('/')
        .send();

      expect(response.status).to.equal(200);
      expect(response.body.message).to.be.a('string');
      expect(response.body.error).to.be.undefined;
      expect(response.body.message).to.equal('You have reached the library api');
    });
  });

  describe('failing tests', () => {
    it('fails for routes that do not exist', async () => {
      const response = await chai
        .request(app)
        .get('/not_exist')
        .send();

      expect(response.status).to.equal(404);
      expect(response.body.error).to.exist;
      expect(response.body.error.message).to.equal('Not Found');
    });
  });
});
