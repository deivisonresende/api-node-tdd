exports.up = (knex) => knex.schema.createTable('transactions', (table) => {
  table.increments('id').primary();
  table.string('description').notNull();
  table.enu('type', ['I', 'O']).notNull();
  table.date('date').notNull();
  table.decimal('amount', 15, 2);
  table.boolean('status').notNull().default(false);
  table.integer('acc_id')
    .references('id')
    .inTable('accounts')
    .notNull();
});

exports.down = (knex) => knex.schema.dropTable('transactions');
