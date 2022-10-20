const moment = require('moment');

exports.seed = async (knex) => {
  await knex('users').insert([
    {
      id: 10100,
      name: 'user seed3',
      mail: 'user.seed3@mail.com',
      password: '$2a$10$PVGcq7VtxvBcyu2yk3fHJuIQD9mxfkvpfgw/xiTAlNTfoDcQpGv6W',
    },
    {
      id: 10101,
      name: 'user seed4',
      mail: 'user.seed4@mail.com',
      password: '$2a$10$PVGcq7VtxvBcyu2yk3fHJuIQD9mxfkvpfgw/xiTAlNTfoDcQpGv6W',
    },
    {
      id: 10102,
      name: 'user seed5',
      mail: 'user.seed5@mail.com',
      password: '$2a$10$PVGcq7VtxvBcyu2yk3fHJuIQD9mxfkvpfgw/xiTAlNTfoDcQpGv6W',
    },
  ]);

  await knex('accounts').insert([
    { id: 10100, name: 'acc1 seed3', user_id: 10100 },
    { id: 10101, name: 'acc2 seed3', user_id: 10100 },
    { id: 10102, name: 'acc1 seed4', user_id: 10101 },
    { id: 10103, name: 'acc2 seed4', user_id: 10101 },
    { id: 10104, name: 'acc1 seed5', user_id: 10102 },
    { id: 10105, name: 'acc2 seed5', user_id: 10102 },
  ]);

  await knex('transfers').insert([
    {
      id: 10100,
      description: 'transfer seed1',
      user_id: 10102,
      acc_ori_id: 10104,
      acc_dest_id: 10105,
      amount: 256,
      date: new Date(),
    },
    {
      id: 10101,
      description: 'transfer seed2',
      user_id: 10101,
      acc_ori_id: 10102,
      acc_dest_id: 10103,
      amount: 512,
      date: new Date(),
    },
  ]);

  await knex('transactions').insert([
    {
      description: '#2',
      date: new Date(),
      amount: 2,
      type: 'I',
      acc_id: 10104,
      status: true,
    },
    {
      description: '#4',
      date: new Date(),
      amount: 4,
      type: 'I',
      acc_id: 10102,
      status: true,
    },
    {
      description: '#8',
      date: new Date(),
      amount: 8,
      type: 'I',
      acc_id: 10105,
      status: true,
    },
    {
      description: '#16',
      date: new Date(),
      amount: 16,
      type: 'I',
      acc_id: 10104,
      status: false,
    },
    {
      description: '#32',
      date: moment().subtract(5, 'days'),
      amount: 32,
      type: 'I',
      acc_id: 10104,
      status: true,
    },
    {
      description: '#64',
      date: moment().add(5, 'days'),
      amount: 64,
      type: 'I',
      acc_id: 10104,
      status: true,
    },
    {
      description: '#-128',
      date: new Date(),
      amount: -128,
      type: 'O',
      acc_id: 10104,
      status: true,
    },
    {
      description: '#256',
      date: new Date(),
      amount: 256,
      type: 'I',
      acc_id: 10104,
      status: true,
    },
    {
      description: '#-256',
      date: new Date(),
      amount: -256,
      type: 'O',
      acc_id: 10105,
      status: true,
    },
    {
      description: '#512',
      date: new Date(),
      amount: 512,
      type: 'I',
      acc_id: 10102,
      status: true,
    },
    {
      description: '#-512',
      date: new Date(),
      amount: -512,
      type: 'O',
      acc_id: 10103,
      status: true,
    },
  ]);
};
