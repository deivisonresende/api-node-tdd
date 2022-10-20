module.exports = function AppError(message, status = 400) {
  this.error = message;
  this.status = status;
};
