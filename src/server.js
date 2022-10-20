const app = require('./app');

app.listen(3001, () => console.log(`server listening on port 3001 in ${process.env.NODE_ENV} mode`));
