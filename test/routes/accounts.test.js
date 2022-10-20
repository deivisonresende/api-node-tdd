const request = require('supertest');
const jwt = require('jwt-simple');
const app = require('../../src/app');

const MAIN_ROUTE = '/v1/accounts';
let user;
let secondaryUser;

beforeAll(async () => {
  await app.db('transactions').del();
  await app.db('transfers').del();
  await app.db('accounts').del();
  await app.db('users').del();

  let users = await app.services.user.save({ name: 'user', mail: `${Date.now()}@mail.com`, password: 'password' });
  user = { ...users[0] };
  user.token = jwt.encode(user, 'mycustomsecret');

  users = await app.services.user.save({ name: 'user 2', mail: `${Date.now()}@mail.com`, password: 'password' });
  secondaryUser = { ...users[0] };
});

test('Deve listar apenas as contas do usuário', async () => {
  await app.db('accounts').insert([
    { name: 'Acc user 1', user_id: user.id },
    { name: 'Acc user 2', user_id: secondaryUser.id },
  ]);

  return request(app).get(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .then((result) => {
      expect(result.status).toBe(200);
      expect(result.body.length).toBe(1);
      expect(result.body[0].name).toBe('Acc user 1');
    });
});

test('Deve inserir uma conta com sucesso', async () => request(app)
  .post(MAIN_ROUTE)
  .send({ name: 'acc #123' })
  .set('authorization', `bearer ${user.token}`)
  .then((result) => {
    expect(result.status).toBe(201);
    expect(result.body).toHaveProperty('name', 'acc #123');
  }));

test('Não deve inserir uma conta sem nome', async () => request(app)
  .post(MAIN_ROUTE)
  .send({})
  .set('authorization', `bearer ${user.token}`)
  .then((result) => {
    expect(result.status).toBe(400);
    expect(result.body).toHaveProperty('error', 'name é um atributo obrigatório');
  }));

test('Não deve inserir uma conta de nome duplicado, para o mesmo usuário', async () => {
  await app.db('accounts').insert({ name: 'Acc duplicada', user_id: user.id });

  return request(app)
    .post(MAIN_ROUTE)
    .set('authorization', `bearer ${user.token}`)
    .send({ name: 'Acc duplicada', user_id: user.id })
    .then((result) => {
      expect(result.status).toBe(400);
      expect(result.body).toHaveProperty('error', 'Já existe uma conta com esse nome informado para este usuário');
    });
});

test('Não deve listar as contas de outro usuário', async () => {
  const [{ id: accId }] = await app.db('accounts').insert({ name: 'Acc user 2', user_id: secondaryUser.id }, ['id']);

  return request(app).get(`${MAIN_ROUTE}/${accId}`)
    .set('authorization', `bearer ${user.token}`)
    .then((result) => {
      expect(result.status).toBe(403);
      expect(result.body).toHaveProperty('error', 'Este recurso não pertence ao usuário');
    });
});

test('Não deve listar uma conta inexistente', async () => request(app)
  .get(`${MAIN_ROUTE}/0`)
  .set('authorization', `bearer ${user.token}`)
  .then((response) => {
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Esta conta não existe');
  }));

test('Deve alterar uma conta pelo Id', async () => {
  const [{ id }] = await app.db('accounts').insert({ name: 'acc #1', user_id: user.id }, ['id']);

  return request(app).put(`${MAIN_ROUTE}/${id}`)
    .send({ name: 'acc #2' })
    .set('authorization', `bearer ${user.token}`)
    .then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'acc #2');
      expect(response.body).toHaveProperty('user_id', user.id);
    });
});

test('Não deve alterar a conta de outros usuário', async () => {
  const [{ id }] = await app.db('accounts').insert({ name: 'acc #1', user_id: secondaryUser.id }, ['id']);

  return request(app).put(`${MAIN_ROUTE}/${id}`)
    .send({ name: 'acc #2' })
    .set('authorization', `bearer ${user.token}`)
    .then((response) => {
      expect(response.status).toBe(403);
    });
});

test('Deve remover uma conta pelo Id', async () => {
  const [{ id }] = await app.db('accounts').insert({ name: 'acc #1', user_id: user.id }, ['id']);

  return request(app)
    .delete(`${MAIN_ROUTE}/${id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((response) => {
      expect(response.status).toBe(204);
    });
});

test('Não deve remover a conta de outros usuário', async () => {
  const [{ id }] = await app.db('accounts').insert({ name: 'acc #1', user_id: secondaryUser.id }, ['id']);

  return request(app)
    .delete(`${MAIN_ROUTE}/${id}`)
    .set('authorization', `bearer ${user.token}`)
    .then((response) => {
      expect(response.status).toBe(403);
    });
});
