/* eslint-disable no-shadow */
const request = require('supertest');
const jwt = require('jwt-simple');

const app = require('../../src/app');

const MAIN_ROUTE = '/v1/users';

let user;
beforeAll(async () => {
  await app.db('transactions').del();
  await app.db('transfers').del();
  await app.db('accounts').del();
  await app.db('users').del();

  const users = await app.services.user.save({ name: 'user', mail: `${Date.now()}@mail.com`, password: 'password' });
  user = { ...users[0] };
  user.token = jwt.encode(user, 'mycustomsecret');
});

test('Deve inserir um usuário com sucesso', () => {
  const mail = `${Date.now()}@gmail.com`;
  return request(app)
    .post(MAIN_ROUTE)
    .send({ name: 'Walter Mitty', mail, password: 'pass' })
    .set('authorization', `bearer ${user.token}`)
    .then((response) => {
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Walter Mitty');
      expect(response.body.name).not.toHaveProperty('password');
    });
});

test('Deve armazenar a senha criptografada', async () => {
  const response = await request(app)
    .post(MAIN_ROUTE)
    .send({ name: 'Walter Mitty', mail: `${Date.now()}@gmail.com`, password: '@54#d83' })
    .set('authorization', `bearer ${user.token}`);

  const { id } = response.body;
  const userCreated = await app.services.user.findOne({ id });

  expect(userCreated).not.toBeNull();
  expect(userCreated.password).not.toEqual('@54#d83');
});

test('Deve listar todos os usuários', () => request(app)
  .get(MAIN_ROUTE)
  .set('authorization', `bearer ${user.token}`)
  .then((response) => {
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  }));

test('Não deve inserir um usuário sem nome', () => request(app)
  .post(MAIN_ROUTE)
  .send({ mail: 'walter@gmail.com', password: 'pass' })
  .set('authorization', `bearer ${user.token}`)
  .then((response) => {
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('name é um atributo obrigatório');
  }));

test('Não deve inserir um usuário sem email', async () => {
  const result = await request(app)
    .post(MAIN_ROUTE)
    .send({ name: 'Walter Mitty', password: 'pass' })
    .set('authorization', `bearer ${user.token}`);

  expect(result.status).toBe(400);
  expect(result.body.error).toBe('mail é um atributo obrigatório');
});

test('Não deve inserir um usuário sem senha', (done) => {
  request(app)
    .post(MAIN_ROUTE)
    .send({ name: 'Walter Mitty', mail: `${Date.now()}@gmail.com` })
    .set('authorization', `bearer ${user.token}`)
    .then((result) => {
      expect(result.status).toBe(400);
      expect(result.body.error).toBe('password é um atributo obrigatório');
      done();
    })
    .catch((error) => done.fail(error));
});

test('Não deve inserir um usuário quando o email já existir', async () => {
  const sameUser = { name: 'Walter Mitty', mail: `${Date.now()}@gmail.com`, password: 'password' };

  await app.db('users').insert(sameUser);

  const resultForSameUser = await request(app)
    .post(MAIN_ROUTE)
    .send(sameUser)
    .set('authorization', `bearer ${user.token}`);

  expect(resultForSameUser.status).toBe(400);
  expect(resultForSameUser.body.error).toBe('Já existe um usuário com o email informado');
});
