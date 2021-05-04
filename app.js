const express = require('express')
const http = require('http')
const nunjucks = require('nunjucks')
const path = require('path')
const session = require('express-session')
const bodyParser = require('body-parser')
//const sassMiddleware = require('node-sass-middleware')
const fs = require('fs')

var rtdata = "./rtdata"

if (!fs.existsSync(rtdata)) {
    fs.mkdirSync(rtdata)
}

let app = express()

nunjucks.configure('views', {
    autoescape: true,
    express: app
})
/*
app.use(sassMiddleware({
    src: path.join(__dirname, 'bootstrap'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true,
    sourceMap: true
}))
*/
app.get('/', function(req, res, next) {
    let data = {
        title: 'Welcome!',
        content: 'Please wait while we redirect you.'
    }

    res.render('index.njk', data)
})

// const setup = require('./lib/setup')
app.use(require('./lib/setup'))
app.use(require('./lib/home.js'))
app.use(session({
    secret: 'tmEzPDZ91wNL8BqgVLfKpd1RpBa6PVQxqkYYutYL',
    resave: true,
    saveUninitialized: true
}))

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));
let server = http.createServer(app)
server.listen('3000')