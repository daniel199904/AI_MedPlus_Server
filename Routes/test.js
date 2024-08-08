const Express = require(`express`);
const Router = Express.Router();

Router.get(`/`, (Req, Res) => {
	Res.render(`test`);
	Res.end();
});

module.exports = Router;