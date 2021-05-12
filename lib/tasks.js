const express = require('express')
const router = express.Router()
const dbInterface = require('./dbInterface')
const session = require('express-session')
const bodyParser = require('body-parser')

var urlEncodedParser = bodyParser.urlencoded({
    extended: false
})

router.post('/api/add_task', urlEncodedParser, (req, res) => {
    if (req.session) {
        if (req.session.loggedin) {
            dbInterface.addTask(req.body.projectID, req.body.taskName, req.body.taskDesc)
            res.redirect('back')
        } else {
            res.sendStatus(403)
        }
    } else {
        res.sendStatus(403)
    }
})

router.get('/api/flagTask', urlEncodedParser, (req, res) => {
    if (req.session) {
        if (req.session.loggedin) {
            if (req.query.action == 'delete') {
                dbInterface.flagTask(req.query.taskid, req.session.uid)
                res.redirect('back')
            }
            if (req.query.action == 'take') {
                dbInterface.takeTask(req.query.taskid, req.session.uid)
                res.redirect('back')
            }
            if (req.query.action == 'release') {
                dbInterface.getTasksIDsByUID(req.session.uid).then(tasksList => {
                    if (tasksList.includes(Number(req.query.taskid))) {
                        dbInterface.releaseTask(Number(req.query.taskid)).then(discard => {
                            res.redirect('back')
                        })
                    } else {
                        res.redirect('back')
                    }
                })

            }
        } else {
            res.sendStatus(403)
        }
    } else {
        res.sendStatus(403)
    }
})

module.exports = router