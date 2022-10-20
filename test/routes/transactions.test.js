const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transactions';

const random = (max) => Math.floor(Math.random() * max);

let user1;
let user2;
let accUser1;
let accUser2;

beforeAll(async () => {
  await app.db('transactions').del();
  await app.db('transfers').del();
  await app.db('accounts').del();
  await app.db('users').del();

  const users = await app.db('users').insert([
    { name: 'user #1', mail: 'user1@mail.com', password: '$2a$10$PVGcq7VtxvBcyu2yk3fHJuIQD9mxfkvpfgw/xiTAlNTfoDcQpGv6W' },
    { name: 'user #2', mail: 'user2@mail.com', password: '$2a$10$PVGcq7VtxvBcyu2yk3fHJuIQD9mxfkvpfgw/xiTAlNTfoDcQpGv6W' },
  ], '*');

  [user1, user2] = users;

  user1.token = jwt.encode(user1, 'mycustomsecret');

  delete user1.password;
  delete user1.password;

  const accounts = await app.db('accounts').insert([
    { name: 'Acc #1', user_id: user1.id },
    { name: 'Acc #2', user_id: user2.id },
  ], '*');

  [accUser1, accUser2] = accounts;
});

test('Deve listar apenas as transações do usuário', async () => {
  await app.db('transactions').insert([
    {
      description: 't1', date: new Date(), amount: 100, type: 'I', acc_id: accUser1.id,
    },
    {
      description: 't2', date: new Date(), amount: 100, type: 'I', acc_id: accUser2.id,
    },
  ]);

  return request(app)
    .get(MAIN_ROUTE)
    .set('authorization', `bearer ${user1.token}`)
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('description', 't1');
    });
});

test('Deve inserir uma transação', async () => request(app)
  .post(MAIN_ROUTE)
  .send({
    description: 'new t1',
    date: new Date(),
    amount: 100,
    type: 'I',
    acc_id: accUser1.id,
  })
  .set('authorization', `bearer ${user1.token}`)
  .then((response) => {
    expect(response.status).toBe(201);
    expect(response.body[0]).toHaveProperty('acc_id', accUser1.id);
  }));

test('Deve retornar uma transação por ID', async () => {
  const [{ id }] = await app.db('transactions').insert({
    description: `#${random(500)}`,
    date: new Date(),
    amount: 1500,
    type: 'I',
    acc_id: accUser1.id,
  }, ['id']);

  return request(app)
    .get(`${MAIN_ROUTE}/${id}`)
    .set('authorization', `bearer ${user1.token}`)
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('amount', '1500.00');
      expect(response.body).toHaveProperty('type', 'I');
      expect(response.body).toHaveProperty('acc_id', accUser1.id);
      expect(response.body).toHaveProperty('id', id);
    });
});

test('Não deve retornar por ID uma transação de outro usuário', async () => {
  const [{ id }] = await app.db('transactions').insert({
    description: `#${random(500)}`,
    date: new Date(),
    amount: 1500,
    type: 'I',
    acc_id: accUser2.id,
  }, ['id']);

  return request(app)
    .get(`${MAIN_ROUTE}/${id}`)
    .set('authorization', `bearer ${user1.token}`)
    .then((response) => {
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Este recurso não pertence ao usuário');
    });
});

test('Deve alterar uma transação por ID', async () => {
  const [{ id }] = await app.db('transactions').insert({
    description: `#${random(500)}`,
    date: new Date(),
    amount: 1500,
    type: 'I',
    acc_id: accUser1.id,
  }, ['id']);

  return request(app)
    .put(`${MAIN_ROUTE}/${id}`)
    .send({
      description: 'updated',
    })
    .set('authorization', `bearer ${user1.token}`)
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('description', 'updated');
      expect(response.body).toHaveProperty('id', id);
    });
});

test('Não deve alterar por ID uma transação de outro usuário', async () => {
  const [{ id }] = await app.db('transactions').insert({
    description: `#${random(500)}`,
    date: new Date(),
    amount: 1500,
    type: 'I',
    acc_id: accUser2.id,
  }, ['id']);

  return request(app)
    .put(`${MAIN_ROUTE}/${id}`)
    .send({
      description: 'updated',
    })
    .set('authorization', `bearer ${user1.token}`)
    .then((response) => {
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Este recurso não pertence ao usuário');
    });
});

test('Deve remover uma transação por ID', async () => {
  const [{ id }] = await app.db('transactions').insert({
    description: `#${random(500)}`,
    date: new Date(),
    amount: 1500,
    type: 'I',
    acc_id: accUser1.id,
  }, ['id']);

  return request(app)
    .delete(`${MAIN_ROUTE}/${id}`)
    .set('authorization', `bearer ${user1.token}`)
    .then((response) => {
      expect(response.status).toBe(204);
    });
});

test('Não deve remover uma transação por ID', async () => {
  const [{ id }] = await app.db('transactions').insert({
    description: `#${random(500)}`,
    date: new Date(),
    amount: 1500,
    type: 'I',
    acc_id: accUser2.id,
  }, ['id']);

  return request(app)
    .delete(`${MAIN_ROUTE}/${id}`)
    .set('authorization', `bearer ${user1.token}`)
    .then((response) => {
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Este recurso não pertence ao usuário');
    });
});

test('Transações do tipo entrada (I) devem ser positivas', () => request(app)
  .post(MAIN_ROUTE)
  .send({
    description: `#${random(500)}`,
    date: new Date(),
    amount: -1000,
    type: 'I',
    acc_id: accUser1.id,
  })
  .set('authorization', `bearer ${user1.token}`)
  .then((response) => {
    expect(response.status).toBe(201);
    expect(response.body[0]).toHaveProperty('amount', '1000.00');
  }));

test('Transações do tipo saída (O) devem ser negativas', () => request(app)
  .post(MAIN_ROUTE)
  .send({
    description: `#${random(500)}`,
    date: new Date(),
    amount: 1000,
    type: 'O',
    acc_id: accUser1.id,
  })
  .set('authorization', `bearer ${user1.token}`)
  .then((response) => {
    expect(response.status).toBe(201);
    expect(response.body[0]).toHaveProperty('amount', '-1000.00');
  }));

test('Não deve inserir uma transação sem descrição', async () => request(app)
  .post(MAIN_ROUTE)
  .send({
    date: new Date(),
    amount: 100,
    type: 'I',
    acc_id: accUser1.id,
  })
  .set('authorization', `bearer ${user1.token}`)
  .then((response) => {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'description é um atributo obrigatório');
  }));

test('Não deve inserir uma transação sem data', async () => request(app)
  .post(MAIN_ROUTE)
  .send({
    description: `${random(1000)}`,
    amount: 100,
    type: 'I',
    acc_id: accUser1.id,
  })
  .set('authorization', `bearer ${user1.token}`)
  .then((response) => {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'date é um atributo obrigatório');
  }));

test('Não deve inserir uma transação sem valor', async () => request(app)
  .post(MAIN_ROUTE)
  .send({
    description: `${random(1000)}`,
    date: new Date(),
    type: 'I',
    acc_id: accUser1.id,
  })
  .set('authorization', `bearer ${user1.token}`)
  .then((response) => {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'amount é um atributo obrigatório');
  }));

test('Não deve inserir uma transação sem tipo', async () => request(app)
  .post(MAIN_ROUTE)
  .send({
    description: `${random(1000)}`,
    date: new Date(),
    amount: 100,
    acc_id: accUser1.id,
  })
  .set('authorization', `bearer ${user1.token}`)
  .then((response) => {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'type é um atributo obrigatório');
  }));

test('Não deve inserir uma transação com tipo inválido', async () => request(app)
  .post(MAIN_ROUTE)
  .send({
    description: `${random(1000)}`,
    date: new Date(),
    amount: 100,
    type: 'J',
    acc_id: accUser1.id,
  })
  .set('authorization', `bearer ${user1.token}`)
  .then((response) => {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', '"J" não é um tipo válido');
  }));

test('Não deve remover conta com transação', async () => {
  await app.db('transactions').insert({
    description: `#${random(500)}`,
    date: new Date(),
    amount: 1500,
    type: 'I',
    acc_id: accUser1.id,
  }, ['id']);

  return request(app)
    .delete(`/v1/accounts/${accUser1.id}`)
    .set('authorization', `bearer ${user1.token}`)
    .then((response) => {
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Não é possível excluir constas que possuem transações');
    });
});
