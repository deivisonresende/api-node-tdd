const request = require('supertest');
const jwt = require('jwt-simple');
const moment = require('moment');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/balance';
const TRANSACTION_ROUTE = '/v1/transactions';
const TRANSFER_ROUTE = '/v1/transfers';

const generateToken = (obj) => jwt.encode(obj, 'mycustomsecret');

const TOKEN = generateToken({
  id: 10100,
  name: 'user seed3',
  mail: 'user.seed3@mail.com',
});

const GENERAL_TOKEN = generateToken({
  id: 10102,
  name: 'user seed5',
  mail: 'user.seed5@mail.com',
});

beforeAll(async () => {
  await app.db('transactions').del();
  await app.db('transfers').del();
  await app.db('accounts').del();
  await app.db('users').del();
  await app.db.seed.run();
});

describe('Ao calcular o saldo do usuário', () => {
  test('Deve retornar apenas as contas com alguma transação', () => request(app)
    .get(MAIN_ROUTE)
    .set('authorization', `bearer ${TOKEN}`)
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    }));

  test('Deve adicionar valores de transações do tipo entrada', async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'transaction 1', date: new Date(), amount: 100, type: 'I', acc_id: 10100, status: true,
      });

    return request(app)
      .get(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty('id', 10100);
        expect(response.body[0]).toHaveProperty('sum', '100.00');
      });
  });

  test('Deve subtrair os valores de transações do tipo de saída', async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'transaction 1', date: new Date(), amount: 200, type: 'O', acc_id: 10100, status: true,
      });

    return request(app)
      .get(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.body[0]).toHaveProperty('id', 10100);
        expect(response.body[0]).toHaveProperty('sum', '-100.00');
      });
  });

  test('Não deve considerar saldo de contas distintas', async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'transaction 1', date: new Date(), amount: 50, type: 'I', acc_id: 10101, status: true,
      });

    return request(app)
      .get(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty('id', 10100);
        expect(response.body[0]).toHaveProperty('sum', '-100.00');
        expect(response.body[1]).toHaveProperty('id', 10101);
        expect(response.body[1]).toHaveProperty('sum', '50.00');
      });
  });

  test('Não deve considerar transações de contas de outros usuários ', async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'transaction 1', date: new Date(), amount: 200, type: 'O', acc_id: 10102, status: true,
      });

    return request(app)
      .get(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty('id', 10100);
        expect(response.body[0]).toHaveProperty('sum', '-100.00');
      });
  });

  test('Deve considerar todas as transações passadas', async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'transaction 1', date: moment().subtract(5, 'days'), amount: 250, type: 'I', acc_id: 10100, status: true,
      });

    return request(app)
      .get(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty('id', 10100);
        expect(response.body[0]).toHaveProperty('sum', '150.00');
        expect(response.body[1]).toHaveProperty('id', 10101);
        expect(response.body[1]).toHaveProperty('sum', '50.00');
      });
  });

  test('Não deve considerar transações futuras/agendadas', async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'transaction 1', date: moment().add(5, 'days'), amount: 250, type: 'I', acc_id: 10100, status: true,
      });

    return request(app)
      .get(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty('id', 10100);
        expect(response.body[0]).toHaveProperty('sum', '150.00');
        expect(response.body[1]).toHaveProperty('id', 10101);
        expect(response.body[1]).toHaveProperty('sum', '50.00');
      });
  });

  test('Não deve considerar as transações pendentes', async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'transaction 1', date: new Date(), amount: 200, type: 'I', acc_id: 10100, status: false,
      });

    return request(app)
      .get(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty('id', 10100);
        expect(response.body[0]).toHaveProperty('sum', '150.00');
        expect(response.body[1]).toHaveProperty('id', 10101);
        expect(response.body[1]).toHaveProperty('sum', '50.00');
      });
  });

  test('Deve considerar transferências', async () => {
    await request(app)
      .post(TRANSFER_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .send({
        description: 'transfer 1', date: new Date(), amount: 250, acc_ori_id: 10100, acc_dest_id: 10101,
      });

    return request(app)
      .get(MAIN_ROUTE)
      .set('authorization', `bearer ${TOKEN}`)
      .then((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[0]).toHaveProperty('id', 10100);
        expect(response.body[0]).toHaveProperty('sum', '-100.00');
        expect(response.body[1]).toHaveProperty('id', 10101);
        expect(response.body[1]).toHaveProperty('sum', '300.00');
      });
  });

  test('Deve calcular o saldo das contas do usuário', async () => request(app)
    .get(MAIN_ROUTE)
    .set('authorization', `bearer ${GENERAL_TOKEN}`)
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id', 10104);
      expect(response.body[0]).toHaveProperty('sum', '162.00');
      expect(response.body[1]).toHaveProperty('id', 10105);
      expect(response.body[1]).toHaveProperty('sum', '-248.00');
    }));
});
