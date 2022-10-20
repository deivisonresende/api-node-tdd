/* eslint-disable consistent-return */
const express = require('express');
const jwt = require('jwt-simple');
const bcrypt = require('bcrypt-nodejs');

const secret = 'mycustomsecret';

module.exports = (app) => {
  const router = express.Router();

  router.post('/signin', async ({ body: { mail, password } }, response, next) => {
    try {
      const user = await app.services.user.findOne({ mail });

      if (user && bcrypt.compareSync(password, user.password)) {
        const payload = {
          id: user.id,
          name: user.name,
          mail: user.mail,
        };

        const token = jwt.encode(payload, secret);

        return response.status(200).json({ token });
      }

      return response.status(400).send();
    } catch (error) {
      next(error);
    }
  });

  router.post('/signup', async (request, response, next) => {
    try {
      const result = await app.services.user.save(request.body);
      return response.status(201).json(result[0]);
    } catch (error) {
      return next(error);
    }
  });

  return router;
};
