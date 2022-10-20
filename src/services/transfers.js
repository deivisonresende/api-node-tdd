/* eslint-disable object-curly-newline */

const AppError = require('../errors');

module.exports = (app) => {
  const find = (filter = {}) => app
    .db('transfers')
    .where(filter)
    .select();

  const findOne = (filter = {}) => app
    .db('transfers')
    .where(filter)
    .first();

  const validateTransfer = async (transfer) => {
    if (!transfer.description) throw new AppError('description é um atributo obrigatório');
    if (!transfer.amount) throw new AppError('amount é um atributo obrigatório');
    if (!transfer.date) throw new AppError('date é um atributo obrigatório');
    if (!transfer.acc_ori_id) throw new AppError('acc_ori_id é um atributo obrigatório');
    if (!transfer.acc_dest_id) throw new AppError('acc_dest_id é um atributo obrigatório');
    if (transfer.acc_ori_id === transfer.acc_dest_id) throw new AppError('Não é possível transferir de uma conta para ela mesma');

    const acc = await app.services.accounts.findOne({ id: transfer.acc_ori_id });
    if (acc.user_id !== transfer.user_id) throw new AppError('A conta de origem informada não pertence ao usuário');
  };

  const save = async (body) => {
    const [transfer] = await app
      .db('transfers')
      .insert(body, '*');

    const transactions = [
      {
        description: `Transfer to acc ${transfer.acc_dest_id}`,
        date: transfer.date,
        amount: (transfer.amount * -1),
        type: 'O',
        acc_id: transfer.acc_ori_id,
        transfer_id: transfer.id,
        status: true,
      },
      {
        description: `Transfer from acc ${transfer.acc_ori_id}`,
        date: transfer.date,
        amount: transfer.amount,
        type: 'I',
        acc_id: transfer.acc_dest_id,
        transfer_id: transfer.id,
        status: true,
      },
    ];

    await app.db('transactions').insert(transactions);

    return transfer;
  };

  const update = async ({ id, body }) => {
    const [transfer] = await app
      .db('transfers')
      .where({ id })
      .update(body, '*');

    const transactions = [
      {
        description: `Transfer to acc ${transfer.acc_dest_id}`,
        date: transfer.date,
        amount: (transfer.amount * -1),
        type: 'O',
        acc_id: transfer.acc_ori_id,
        transfer_id: id,
      },
      {
        description: `Transfer from acc ${transfer.acc_ori_id}`,
        date: transfer.date,
        amount: transfer.amount,
        type: 'I',
        acc_id: transfer.acc_dest_id,
        transfer_id: id,
      },
    ];

    await app.db('transactions').where({ transfer_id: id }).del();
    await app.db('transactions').insert(transactions);

    return transfer;
  };

  const remove = async ({ id }) => {
    await app.db('transactions').where({ transfer_id: id }).del();
    await app
      .db('transfers')
      .where({ id })
      .del();

    return true;
  };

  return { find, save, findOne, update, remove, validateTransfer };
};
