const AppError = require('../errors');

module.exports = (app) => {
  const find = (userId, filter = {}) => app
    .db('transactions')
    .join('accounts', 'accounts.id', 'acc_id')
    .where(filter)
    .andWhere('accounts.user_id', '=', userId)
    .select();

  const findOne = (filter = {}) => app
    .db('transactions')
    .where(filter)
    .first();

  const save = (transaction) => {
    const {
      description, date, amount, type,
    } = transaction;

    if (!description) throw new AppError('description é um atributo obrigatório');
    if (!date) throw new AppError('date é um atributo obrigatório');
    if (!amount) throw new AppError('amount é um atributo obrigatório');
    if (!type) throw new AppError('type é um atributo obrigatório');
    if (!['I', 'O'].includes(type)) throw new AppError(`"${type}" não é um tipo válido`);

    const newTransaction = { ...transaction };

    if ((transaction.type === 'I' && transaction.amount < 0)
      || (transaction.type === 'O' && transaction.amount > 0)) newTransaction.amount *= -1;

    return app
      .db('transactions')
      .insert(newTransaction, '*');
  };

  const update = (id, transaction) => app
    .db('transactions')
    .where({ id })
    .update(transaction, '*');

  const remove = (id) => app
    .db('transactions')
    .where({ id })
    .del();

  return {
    find, findOne, save, update, remove,
  };
};
