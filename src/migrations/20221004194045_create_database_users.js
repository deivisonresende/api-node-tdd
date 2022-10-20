exports.up = (knex) => knex.schema.createTable('users', (table) => {
  table.increments('id').primary();
  table.string('name').notNull();
  table.string('mail').notNull().unique();
  table.string('password').notNull();
});

exports.down = (knex) => knex.schema.dropTable('users');
