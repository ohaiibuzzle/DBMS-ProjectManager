const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()
const session = require('express-session')

const dbInterface = require('./dbInterface')

const urlEncodedParser = bodyParser.urlencoded({
    extended: false
})

router.get('/login', (req, res) => {
    res.render('login.njk')
})

router.post('/api/login', urlEncodedParser, (req, res) => {
    var username = req.body.username
    var passwd = req.body.passwd

    dbInterface.validateCredentials(username, passwd).then(uid => {
        if (uid != null) {
            session.loggedin = true
            session.username = username
            session.uid = uid
            res.redirect('/home')
        } else {
            res.send('Invalid username or password!')
        }
        res.end()
    })
})

router.get('/api/logout', (req, res) => {
    session.loggedin = false
    session.username = null
    res.redirect('/')
})

module.exports = router