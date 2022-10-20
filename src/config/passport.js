const passport = require('passport');
const { Strategy, ExtractJwt } = require('passport-jwt');

const secret = 'mycustomsecret';

module.exports = (app) => {
  const params = {
    secretOrKey: secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  };

  const strategy = new Strategy(params, async (payload, done) => {
    try {
      const user = await app.services.user.findOne({ id: payload.id });

      if (user) done(null, payload);
      else done(null, false);
    } catch (error) {
      done(error, false);
    }
  });

  passport.use(strategy);

  return {
    authenticate: () => passport.authenticate('jwt', { session: false }),
  };
};
