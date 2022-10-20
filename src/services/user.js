const bcrypt = require('bcrypt-nodejs');
const AppError = require('../errors');

module.exports = (app) => {
  const findAll = (filter = {}) => app.db('users').where(filter).select(['id', 'name', 'mail']);

  const findOne = (filter) => app.db('users').where(filter).first();

  const generateHas = (value) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(value, salt);
  };

  const save = async (user) => {
    if (!user.name) throw new AppError('name é um atributo obrigatório');
    if (!user.mail) throw new AppError('mail é um atributo obrigatório');
    if (!user.password) throw new AppError('password é um atributo obrigatório');

    const userExist = await findOne({ mail: user.mail });
    if (userExist) throw new AppError('Já existe um usuário com o email informado');

    const newUser = { ...user };
    newUser.password = generateHas(user.password);
    return app.db('users').insert(newUser, ['id', 'name', 'mail']);
  };

  return { findAll, save, findOne };
};
