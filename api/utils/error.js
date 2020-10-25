function ApiException({ message, status }) {
  this.name = 'Api Error';
  this.message = message;
  this.status = status;
}

ApiException.prototype = Error.prototype;

module.exports.ApiException = ApiException;
