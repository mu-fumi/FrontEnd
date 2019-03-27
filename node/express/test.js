const app = require('./express')();

app.use(function(req, res, next) {
    console.log("1 --> ", '我是一个中间件，没有路径的  所有请求都要走我这里过');
    // 这里也可以用res.end() 返回点东西，但是不会往下走了
    next()
})

app.get('/test', function(req, res) {
    console.log("2 --> ", '我是一get请求，路径是test');
    // 返回一些东西

	console.log("req --> ", req.query);
	console.log("req --> ", req.path);
	console.log("req --> ", req.hostname);

    res.end('test')
})

//
app.get('/user/:id/:name', function(req, res) {

})





app.listen(8000)