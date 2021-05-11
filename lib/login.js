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

router.get('/home/changepasswd', (req, res, next) => {
    if (session.loggedin) {
        let data = {
            'UID': session.uid,
        }
        res.render('chpasswd.njk', data)
    } else {
        res.redirect('/home')
    }
})

router.post('/api/changepasswd', urlEncodedParser, (req, res) => {
    if (session.loggedin) {
        if (req.body.newpasswd.length >= 8) {
            dbInterface.changepasswd(session.uid, req.body.newpasswd)
            res.redirect('/home')
        } else {
            let data = {
                'errorMsg': 'Invalid password',
                'errorHelp': 'Your password must be longer than 8 characters',
                'code': 2
            }
            res.render('error.njk', data)
        }
    } else {
        res.sendStatus('403')
    }
})

router.get('/api/logout', (req, res) => {
    session.loggedin = false
    session.username = null
    res.redirect('/')
})

router.post('/api/new_user', urlEncodedParser, (req, res) => {
    if (session.loggedin) {
        //console.log(req.body)
        if (req.body.newUName && req.body.memberName) {
            let randomPw = makerandom(16)
            dbInterface.newMember(req.body.memberName, req.body.memberDOB,
                req.body.memberIntro, '', req.body.newUName, randomPw).then(r => {
                    let data = {
                        'memberUName': req.body.newUName,
                        'memberPassword': randomPw
                    }
                    res.render('newUserSuccess.njk', data)
                },
                err => {
                    let data = {
                        'errorMsg': 'Cannot create member',
                        'errorHelp': err,
                        'code': 3
                    }
                    res.render('error.njk', data)
                })
        } else {
            let data = {
                'errorMsg': 'Cannot create member',
                'errorHelp': 'Check the input data',
                'code': 4
            }
            res.render('error.njk', data)
        }
    } else {
        res.sendStatus(403)
    }
})

function makerandom(length) {
    var result = [];
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() *
            charactersLength)));
    }
    return result.join('');
}

module.exports = router