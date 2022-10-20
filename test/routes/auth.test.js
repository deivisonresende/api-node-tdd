const request = require('supertest');
const app = require('../../src/app');

test('Deve criar um usuário via signup', () => {
  const mail = `${Date.now()}@gmail.com`;

  return request(app)
    .post('/auth/signup')
    .send({ name: 'Walter', mail, password: 'pass' })
    .then((response) => {
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('name', 'Walter');
      expect(response.body).toHaveProperty('mail', mail);
      expect(response.body).not.toHaveProperty('password');
    });
});

test('Deve receber token ao logar', async () => {
  const mail = `${Date.now()}@mail.com`;
  const password = '123456';

  await app.services.user.save({
    name: 'acc',
    mail,
    password,
  });

  const { status, body } = await request(app)
    .post('/auth/signin')
    .send({ mail, password });

  expect(status).toBe(200);
  expect(body).toHaveProperty('token');
});

test('Não deve autenticar um usuário com senha incorreta ', async () => {
  const mail = `${Date.now()}@mail.com`;

  await app.services.user.save({
    name: 'acc',
    mail,
    password: '123456',
  });

  const { status, body } = await request(app)
    .post('/auth/signin')
    .send({ mail, password: 'myPassword' });

  expect(status).toBe(400);
  expect(body).not.toHaveProperty('token');
});

test('Não deve autenticar um usuário inexistente', async () => {
  const { status, body } = await request(app)
    .post('/auth/signin')
    .send({ mail: `${Date.now()}@mail.com`, password: '123456' });

  expect(status).toBe(400);
  expect(body).not.toHaveProperty('token');
});

test('Não deve acessar uma rota protegida sem token', async () => {
  const { status, body } = await request(app)
    .get('/v1/users');

  expect(status).toBe(401);
  expect(body).not.toHaveProperty('token');
});
