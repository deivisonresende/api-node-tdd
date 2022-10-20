const AppError = require('../errors');

module.exports = (app) => {
  const findAll = () => app.db('accounts')
    .select();

  const find = (filter = {}) => app.db('accounts')
    .where(filter)
    .select();

  const findOne = (filter = {}) => app.db('accounts')
    .where(filter)
    .select()
    .first();

  const findById = async (id, userId) => {
    const acc = await app.db('accounts')
      .where({ id })
      .first();

    if (!acc) throw new AppError('Esta conta não existe', 404);
    if (acc.user_id !== userId) throw new AppError('Este recurso não pertence ao usuário', 403);
  };

  const save = async (account) => {
    const { name, user_id: userId } = account;

    if (!name) throw new AppError('name é um atributo obrigatório');

    const [acc] = await find({ name, user_id: userId });
    if (acc) throw new AppError('Já existe uma conta com esse nome informado para este usuário');

    return app.db('accounts')
      .insert(account, '*');
  };

  const update = ({ id, data }) => app.db('accounts')
    .where({ id })
    .update(data, '*');

  const remove = async (id) => {
    const transaction = await app.services.transactions.findOne({ acc_id: id });
    if (transaction) throw new AppError('Não é possível excluir constas que possuem transações');

    return app.db('accounts')
      .where({ id })
      .del();
  };

  return {
    save, findAll, findById, update, remove, find, findOne,
  };
};
