/* eslint-disable consistent-return */
const express = require('express');
const AppError = require('../errors');

module.exports = (app) => {
  const router = express.Router();

  router.param('id', async (request, _response, next) => {
    try {
      const transfer = await app
        .services
        .transfers
        .findOne({ id: request.params.id });

      if (transfer.user_id !== request.user.id) throw new AppError('Este recurso não pertence ao usuário', 403);

      next();
    } catch (error) {
      next(error);
    }
  });

  const middleware = ({ body, user }, _response, next) => {
    app.services.transfers.validateTransfer({ ...body, user_id: user.id })
      .then(() => next())
      .catch((error) => next(error));
  };

  router.get('/', async (request, response, next) => {
    try {
      const transfers = await app
        .services
        .transfers
        .find({ user_id: request.user.id });

      return response.json(transfers);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async ({ params: { id } }, response, next) => {
    try {
      const transfer = await app
        .services
        .transfers
        .findOne({ id });

      return response.json(transfer);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', middleware, async ({ body, user: { id: userId } }, response, next) => {
    try {
      const transfer = await app
        .services
        .transfers
        .save({ ...body, user_id: userId });

      return response.status(201).json(transfer);
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', middleware, async ({ params: { id }, body, user: { id: userId } }, response, next) => {
    try {
      const transfer = await app
        .services
        .transfers
        .update({ id, body: { ...body, user_id: userId }, userId });

      return response.status(200).json(transfer);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async ({ params: { id }, user: { id: userId } }, response, next) => {
    try {
      await app
        .services
        .transfers
        .remove({ id, userId });

      return response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
};
