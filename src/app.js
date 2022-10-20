const app = require('express')();
const consign = require('consign');
const knex = require('knex');
const winston = require('winston');
const uuid = require('uuidv4');
const knexfile = require('../knexfile');
const AppError = require('./errors');

app.db = knex(knexfile[process.env.NODE_ENV]);

app.log = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console({ format: winston.format.json({ space: 1 }) }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'warn',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json({ space: 1 })),
    }),
  ],
});

consign({ cwd: 'src', verbose: false })
  .include('./config/passport.js')
  .then('./config/middlewares.js')
  .then('./services')
  .then('./routes')
  .then('./config/router.js')
  .into(app);

app.get('/', (_request, response) => response.json());

app.use((error, request, response, next) => {
  const id = uuid();

  const { name, message, stack } = error;
  if (error instanceof AppError) response.status(error.status).send(error);
  else {
    app.log.error({
      id, name, message, stack,
    });

    response.status(500).json({ id, error: 'Internal server error' });
  }

  next();
});

module.exports = app;
