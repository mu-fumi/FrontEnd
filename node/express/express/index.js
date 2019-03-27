const http = require('http')
const url = require('url')

function createApplication() {
    let app = function(req, res, next) {
        // 通过url获取请求来的路径 url.parse(urlStr, [parseQueryString], [slashesDenoteHost]);
        // node  api  的方法
        const { pathname } = url.parse(req.url, true)
        let index = 0;
        next();

        function next(err) {
            if (index >= app.RouterArr.length) {
                // 数组里面都走完了，next方法就该返回东西了
                return res.end('66666，走完了，没有匹配到路由')
            }
            let route = app.RouterArr[index++];
            if (err) {

                // 先看是不是中间件
                if (route.method == 'middle') {
                    // 在匹配路径,以请求path+‘/’结尾的都是符合的
                    if (route.path == '/' || pathname.startsWith(route.path + '/') || pathname == route.path) {
                        // 在看是不是错误处理中间件.函数名字的length  获取形参个数
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
                // 没有错误err，那么就是普通的中间件或者路由
                // 先看是不是中间件
                if (route.method == 'middle') {
                    // 在匹配路径
                    if (route.path == '/' || pathname.startsWith(route.path + '/') || pathname == route.path) {
                        route.cb(req, res, next);
                    } else {
                        next()
                    }
                } else {
                    if(route.paramsArrs){

                        let pathMatch = pathname.match(route.path)
                        if(pathMatch){
                            let params ={};
                            for (var i = 0; i < route.paramsArrs.length; i++) {
                                params[route.paramsArrs[i]] = pathMatch[i+1]
                            }
                            req.params = params;
                            return route.cb(req, res)
                        }else{
                            next()
                        }

                    }else{
                        if ((route.method == req.method.toLowerCase() || route.method == 'all') && (route.path == pathname || pathname == '*')) {
                            return route.cb(req, res)
                        } else {
                            next()
                        }
                    }

                }
            }
        }
    }

    // 用来存放请求的数组
    app.RouterArr = [];
    // 循环请求过来的方法，把对象放进去，后面解析
    http.METHODS.forEach(function(method) {
        method = method.toLocaleLowerCase();
        app[method] = function(path, cb) {
            let paramsArrs = [];
            let layer = { method, path, cb };
            // 说明有参数过来了
            if (path.includes(':')) {
                console.log("layer --> ", layer);
                path = path.replace(/:([^\/]+)/g, function() {
                    paramsArrs.push(arguments[1]);
                    return '([^\/]+)';
                })
                layer.path = path;
                layer.paramsArrs = paramsArrs;
            }
            app.RouterArr.push(layer)
        }
    })

    // all方法
    app.all = function(path, cb) {
        app.RouterArr.push({
            method: 'all',
            path,
            cb
        })
    }
    // use方法,接受中间件的
    app.use = function(path, cb) {
        // 兼容处理，当cb不是函数的时候,path改为当前路径,所有的都会进来
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
        // 用他自己创建一个http服务
        const server = http.createServer(this)
        server.listen.apply(server, arguments)
    }

    // 定义一个内置的中间件，处理get请求参数问题,所有的路径都会执行
    app.use(function(req, res, next) {
        const urlobject = url.parse(req.url, true);
        req.query = urlobject.query
        req.path = urlobject.pathname
        req.hostname = req.headers['host'].split(':')[0];
        next()
    })





    return app
}

// 内部实现，导出这个方法
module.exports = createApplication;