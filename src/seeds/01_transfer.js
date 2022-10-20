exports.seed = async (knex) => {
  await knex('transactions').del();
  await knex('transfers').del();
  await knex('accounts').del();
  await knex('users').del();

  await knex('users').insert([
    {
      id: 10000,
      name: 'user seed1',
      mail: 'user.seed1@mail.com',
      password: '$2a$10$PVGcq7VtxvBcyu2yk3fHJuIQD9mxfkvpfgw/xiTAlNTfoDcQpGv6W',
    },
    {
      id: 10001,
      name: 'user seed2',
      mail: 'user.seed2@mail.com',
      password: '$2a$10$PVGcq7VtxvBcyu2yk3fHJuIQD9mxfkvpfgw/xiTAlNTfoDcQpGv6W',
    },
  ]);

  await knex('accounts').insert([
    { id: 10000, name: 'acc1 seed1', user_id: 10000 },
    { id: 10001, name: 'acc2 seed1', user_id: 10000 },
    { id: 10002, name: 'acc1 seed2', user_id: 10001 },
    { id: 10003, name: 'acc2 seed2', user_id: 10001 },
  ]);

  await knex('transfers').insert([
    {
      id: 10000,
      description: 'transfer seed1',
      user_id: 10000,
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      amount: 100,
      date: new Date(),
    },
    {
      id: 10001,
      description: 'transfer seed2',
      user_id: 10001,
      acc_ori_id: 10002,
      acc_dest_id: 10003,
      amount: 100,
      date: new Date(),
    },
  ]);

  await knex('transactions').insert([
    {
      description: 'Transfer to acc2 user1',
      date: new Date(),
      amount: -100,
      type: 'O',
      acc_id: 10000,
      transfer_id: 10000,
    },
    {
      description: 'Transfer from acc1 user1',
      date: new Date(),
      amount: 100,
      type: 'I',
      acc_id: 10001,
      transfer_id: 10000,
    },
    {
      description: 'Transfer to acc2 user2',
      date: new Date(),
      amount: -100,
      type: 'O',
      acc_id: 10002,
      transfer_id: 10001,
    },
    {
      description: 'Transfer from acc1 user2',
      date: new Date(),
      amount: 100,
      type: 'I',
      acc_id: 10003,
      transfer_id: 10001,
    },
  ]);
};
