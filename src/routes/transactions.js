const express = require('express');
const AppError = require('../errors');

module.exports = (app) => {
  const router = express.Router();

  router.param('id', async ({ params: { id: transactionId }, user: { id: userId } }, response, next) => {
    try {
      const transaction = await app.services.transactions.find(userId, { 'transactions.id': transactionId });

      if (!transaction.length) throw new AppError('Este recurso não pertence ao usuário', 403);
      else next();
    } catch (error) {
      next(error);
    }
  });

  router.get('/', (request, response, next) => app
    .services
    .transactions
    .find(request.user.id)
    .then((transactions) => response.json(transactions))
    .catch(next));

  router.post('/', (request, response, next) => app
    .services
    .transactions
    .save(request.body)
    .then((transactions) => response.status(201).json(transactions))
    .catch(next));

  router.get('/:id', ({ params: { id } }, response, next) => app
    .services
    .transactions
    .findOne({ id })
    .then((transaction) => response.status(200).json(transaction))
    .catch(next));

  router.put('/:id', ({ params: { id }, body }, response, next) => app
    .services
    .transactions
    .update(id, body)
    .then((transaction) => response.status(200).json(transaction[0]))
    .catch(next));

  router.delete('/:id', ({ params: { id } }, response, next) => app
    .services
    .transactions
    .remove(id)
    .then(() => response.status(204).end())
    .catch(next));

  return router;
};
