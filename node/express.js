const http = require('http')
const url = require('url')

function createApplication() {
    let app = function(req, res, next) {
        const { pathname } = url.parse(req.url, true)
        let index = 0;

        function next(err) {
            if (index >= app.RouterArr.length) {
                return res.end('66666')
            }
            let route = app.RouterArr[index++];
            if (err) {

                // 先看是不是中间件
                if (route.method == 'middle') {
                    // 在匹配路径
                    if (route.path == '/' || pathname.startsWith(route.path + '/') || pathname == route.path) {
                        // 在看是不是错误处理中间件.函数名字的length  获取参数个数
                        if (route.cb.length == 4) {
                            route.cb(err, req, res, next);
                        } else {
                            next(err)
                        }
                    } else {
                        next(err)
                    }
                } else {
                    // 不是的话就放下去执行
                    next(err)
                }

            } else {
                // 先看是不是中间件
                if (route.method == 'middle') {
                    // 在匹配路径
                    if (route.path == '/' || pathname.startsWith(route.path + '/') || pathname == route.path) {
                        route.cb(req, res, next);
                    } else {
                        next()
                    }
                } else {
                    if ((route.method == req.method.toLowerCase() || route.method == 'all') && (route.path == pathname || pathname == '*')) {
                        return route.cb(req, res)
                    } else {
                        next()
                    }
                }
            }
        }

        next();

    }








    app.RouterArr = [];
    http.METHODS.forEach(function(method) {
        method = method.toLocaleLowerCase();
        app[method] = function(path, cb) {
            app.RouterArr.push({
                method,
                path,
                cb
            })
        }
    })




    app.all = function(path, cb) {
        app.RouterArr.push({
            method: 'all',
            path,
            cb
        })
    }

    app.use = function(path, cb) {
        // 兼容处理，当cb不存在的时候，path改为根目录
        if (typeof cb != 'function') {
            cb = path;
            path = '/'
        }
        app.RouterArr.push({
            method: 'middle',
            path,
            cb
        })
    }






    app.listen = function() {
        const server = http.createServer(app)
        server.listen.apply(server, arguments)
    }




    return app
}

module.exports = createApplication
