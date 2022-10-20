const express = require('express');
const AppError = require('../errors');

module.exports = (app) => {
  const router = express.Router();

  router.param('id', (request, _response, next) => {
    app
      .services
      .accounts
      .findOne({ id: request.params.id })
      .then((account) => {
        if (account && account.user_id !== request.user.id) {
          throw new AppError('Este recurso não pertence ao usuário', 403);
        } else next();
      })
      .catch((error) => next(error));
  });

  router.post('/', async (request, response, next) => {
    try {
      const [account] = await app.services.accounts
        .save({ ...request.body, user_id: request.user.id });

      return response.status(201).json(account);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/', (request, response, next) => {
    app
      .services
      .accounts
      .find({ user_id: request.user.id })
      .then((accounts) => response.status(200).json(accounts))
      .catch(next);
  });

  router.get('/:id', async ({ params: { id: accId } }, response, next) => app
    .services
    .accounts
    .findById(accId)
    .then((account) => response.status(200).json(account))
    .catch(next));

  router.put('/:id', (request, response, next) => {
    app.services.accounts
      .update({ id: request.params.id, data: request.body })
      .then(([account]) => response.status(200).json(account))
      .catch(next);
  });

  router.delete('/:id', (request, response, next) => {
    app.services.accounts
      .remove(request.params.id)
      .then(() => response.status(204).send())
      .catch(next);
  });

  return router;
};
