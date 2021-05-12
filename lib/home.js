const express = require('express')
const session = require('express-session')
const router = express.Router()
const dbInterface = require('./dbInterface')

router.get('/home', (req, res, next) => {
    if (req.session) {
        //console.log(req.session)
        if (req.session.loggedin) {
            dbInterface.getTasksByUID(req.session.uid).then(taskList => {
                var data = {
                    tasks: taskList
                }
                res.render('dashbrd.njk', data)
            })

        } else {
            res.redirect('/login')
        }
    } else {
        res.redirect('/login')
    }
})

router.use(require('./login.js'))

router.use(require('./projects.js'))

router.use(require('./issues.js'))

router.get('/home/boards', (req, res, next) => {
    let data = {

    }
    res.render('boards.njk')
})

router.get('/home/team', (req, res, next) => {
    if (req.session) {
        if (req.session.loggedin) {
            dbInterface.queryMembers().then(memberList => {
                var data = {
                    members: memberList
                }
                res.render('team.njk', data)
            })

        } else {
            res.redirect('/login')
        }
    } else {
        res.redirect('/login')
    }
})

router.use(require('./tasks.js'))

router.get('/home/integrations', (req, res, next) => {
    let data = {

    }
    res.render('integrations.njk')
})


module.exports = router