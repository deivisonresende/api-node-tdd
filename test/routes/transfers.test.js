const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/transfers';
let TOKEN;

beforeAll(async () => {
  await app.db('transactions').del();
  await app.db('transfers').del();
  await app.db('accounts').del();
  await app.db('users').del();

  await app.db.seed.run();

  TOKEN = jwt.encode({
    id: 10000,
    name: 'user seed1',
    mail: 'user.seed1@mail.com',
  }, 'mycustomsecret');
});

test('Deve listar apenas as transferências do usuário', () => request(app)
  .get(MAIN_ROUTE)
  .set('authorization', `bearer ${TOKEN}`)
  .then((response) => {
    expect(response.status).toBe(200);
    expect(response.body[0]).toHaveProperty('description', 'transfer seed1');
  }));

test('Deve inserir uma transferência', async (done) => {
  const { status, body: { id, description } } = await request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .send({
      description: 'transfer seed1',
      user_id: 10000,
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      amount: 200,
      date: new Date(),
    });

  expect(status).toBe(201);
  expect(description).toEqual('transfer seed1');

  const transactions = await app.db('transactions').where({ transfer_id: id });
  expect(transactions.length).toBe(2);
  expect(transactions[0].description).toBe('Transfer to acc 10001');
  expect(transactions[0].amount).toBe('-200.00');
  expect(transactions[0].acc_id).toBe(10000);
  expect(transactions[1].description).toBe('Transfer from acc 10000');
  expect(transactions[1].amount).toBe('200.00');
  expect(transactions[1].acc_id).toBe(10001);

  done();
});

describe('Ao salvar uma transferência válida', () => {
  let transferId;
  let income;
  let outcome;

  test('Deve retornar o status 201 e os dados da transferência', async (done) => {
    const { status, body: { id, description } } = await request(app)
      .post(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'transfer seed1',
        user_id: 10000,
        acc_ori_id: 10000,
        acc_dest_id: 10001,
        amount: 200,
        date: new Date(),
      });

    expect(status).toBe(201);
    expect(description).toEqual('transfer seed1');

    transferId = id;

    done();
  });

  test('As transações equivalentes devem ter sido geradas', async (done) => {
    const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('amount');
    expect(transactions.length).toBe(2);

    [outcome, income] = transactions;

    done();
  });

  test('A transação de saída deve ser negativa', (done) => {
    expect(outcome.description).toBe('Transfer to acc 10001');
    expect(outcome.amount).toBe('-200.00');
    expect(outcome.acc_id).toBe(10000);
    expect(outcome.type).toBe('O');

    done();
  });

  test('A transação de entrada deve ser positiva', (done) => {
    expect(income.description).toBe('Transfer from acc 10000');
    expect(income.amount).toBe('200.00');
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe('I');

    done();
  });

  test('A transação de saída deve ser positiva', (done) => {
    expect(income.description).toBe('Transfer from acc 10000');
    expect(income.amount).toBe('200.00');
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe('I');

    done();
  });

  test('Ambas transações devem referenciar à transferência originária', (done) => {
    expect(outcome.status).toBe(true);
    expect(income.status).toBe(true);

    done();
  });

  test('Ambas transações devem possuir o status realizado', (done) => {
    expect(outcome.transfer_id).toBe(transferId);
    expect(income.transfer_id).toBe(transferId);

    done();
  });
});

describe('Ao tentar inserir uma transferência inválida', () => {
  const validTransfer = {
    description: 'transfer seed1',
    user_id: 10000,
    acc_ori_id: 10000,
    acc_dest_id: 10001,
    transfer_id: 10000,
    amount: 200,
    date: new Date(),
  };

  const template = (newData, errorMessage) => request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .send({ ...validTransfer, ...newData })
    .then((response) => {
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', errorMessage);
    });

  test(
    'Não deve inserir sem descrição',
    () => template({ description: null }, 'description é um atributo obrigatório'),
  );

  test(
    'Não deve inserir sem valor',
    () => template({ amount: null }, 'amount é um atributo obrigatório'),
  );

  test(
    'Não deve inserir sem data',
    () => template({ date: null }, 'date é um atributo obrigatório'),
  );

  test(
    'Não deve inserir sem conta de origem',
    () => template({ acc_ori_id: null }, 'acc_ori_id é um atributo obrigatório'),
  );

  test(
    'Não deve inserir sem conta de destino',
    () => template({ acc_dest_id: null }, 'acc_dest_id é um atributo obrigatório'),
  );

  test(
    'Não deve inserir se a conta de origem e destino forem iguais',
    () => template({ acc_ori_id: 10000, acc_dest_id: 10000 }, 'Não é possível transferir de uma conta para ela mesma'),
  );

  test(
    'Não deve inserir se as contas pertencerem a outro usuário',
    () => template({ acc_ori_id: 10002 }, 'A conta de origem informada não pertence ao usuário'),
  );
});

test('Deve retornar uma transferência pelo Id', async () => {
  const { status, body: { description } } = await request(app)
    .get(`${MAIN_ROUTE}/10000`)
    .set('authorization', `bearer ${TOKEN}`);

  expect(status).toBe(200);
  expect(description).toBe('transfer seed1');
});

describe('Ao alterar uma transferência válida', () => {
  let transferId;
  let income;
  let outcome;

  test('Deve retornar o status 200 e os dados da transferência', async (done) => {
    const { status, body: { id, description, amount } } = await request(app)
      .put(`${MAIN_ROUTE}/10000`)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'transfer updated',
        user_id: 10000,
        acc_ori_id: 10000,
        acc_dest_id: 10001,
        amount: 500,
        date: new Date(),
      });

    expect(status).toBe(200);
    expect(description).toEqual('transfer updated');
    expect(amount).toEqual('500.00');

    transferId = id;

    done();
  });

  test('As transações equivalentes devem ter sido geradas', async (done) => {
    const transactions = await app.db('transactions').where({ transfer_id: transferId }).orderBy('amount');
    expect(transactions.length).toBe(2);

    [outcome, income] = transactions;

    done();
  });

  test('A transação de saída deve ser negativa', (done) => {
    expect(outcome.description).toBe('Transfer to acc 10001');
    expect(outcome.amount).toBe('-500.00');
    expect(outcome.acc_id).toBe(10000);
    expect(outcome.type).toBe('O');

    done();
  });

  test('A transação de saída deve ser negativa', (done) => {
    expect(income.description).toBe('Transfer from acc 10000');
    expect(income.amount).toBe('500.00');
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe('I');

    done();
  });

  test('A transação de entrada deve ser positiva', (done) => {
    expect(income.description).toBe('Transfer from acc 10000');
    expect(income.amount).toBe('500.00');
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe('I');

    done();
  });

  test('Ambas transações devem referenciar à transferência originária', (done) => {
    expect(outcome.transfer_id).toBe(transferId);
    expect(income.transfer_id).toBe(transferId);

    done();
  });
});

describe('Ao tentar alterar uma transferência inválida', () => {
  const validTransfer = {
    description: 'transfer seed1',
    user_id: 10000,
    acc_ori_id: 10000,
    acc_dest_id: 10001,
    amount: 200,
    date: new Date(),
  };

  const template = (newData, errorMessage) => request(app)
    .put(`${MAIN_ROUTE}/10000`)
    .set('authorization', `bearer ${TOKEN}`)
    .send({ ...validTransfer, ...newData })
    .then((response) => {
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', errorMessage);
    });

  test(
    'Não deve inserir sem descrição',
    () => template({ description: null }, 'description é um atributo obrigatório'),
  );

  test(
    'Não deve inserir sem valor',
    () => template({ amount: null }, 'amount é um atributo obrigatório'),
  );

  test(
    'Não deve inserir sem data',
    () => template({ date: null }, 'date é um atributo obrigatório'),
  );

  test(
    'Não deve inserir sem conta de origem',
    () => template({ acc_ori_id: null }, 'acc_ori_id é um atributo obrigatório'),
  );

  test(
    'Não deve inserir sem conta de destino',
    () => template({ acc_dest_id: null }, 'acc_dest_id é um atributo obrigatório'),
  );

  test(
    'Não deve inserir se a conta de origem e destino forem iguais',
    () => template({ acc_ori_id: 10000, acc_dest_id: 10000 }, 'Não é possível transferir de uma conta para ela mesma'),
  );

  test(
    'Não deve inserir se as contas pertencerem a outro usuário',
    () => template({ acc_ori_id: 10002 }, 'A conta de origem informada não pertence ao usuário'),
  );
});

describe('Ao remover uma transferência válida', () => {
  const transferId = '10000';

  test('Deve retornar o status 204', async (done) => {
    const { status } = await request(app)
      .delete(`${MAIN_ROUTE}/${transferId}`)
      .set('authorization', `bearer ${TOKEN}`);

    expect(status).toBe(204);
    done();
  });

  test('O registro de transferência deve ser removido', async (done) => {
    const transfers = await app.db('transfers').where({ id: transferId });
    expect(transfers).toHaveLength(0);

    done();
  });

  test('As transações associadas à transferência devem ser removidas', async (done) => {
    const transactions = await app.db('transactions').where({ transfer_id: transferId });
    expect(transactions).toHaveLength(0);

    done();
  });

  test('Não deve remover transferências de outro usuário ', () => request(app)
    .delete(`${MAIN_ROUTE}/10001`)
    .set('authorization', `bearer ${TOKEN}`)
    .then(({ status, body }) => {
      expect(status).toBe(403);
      expect(body).toHaveProperty('error', 'Este recurso não pertence ao usuário');
    }));
});
