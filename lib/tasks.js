const express = require('express')
const router = express.Router()
const dbInterface = require('./dbInterface')
const session = require('express-session')
const bodyParser = require('body-parser')

var urlEncodedParser = bodyParser.urlencoded({
    extended: false
})

router.get('/api/flagTask', urlEncodedParser, (req, res) => {
    if (session.loggedin) {
        if (req.query.action == 'delete') {
            dbInterface.flagTask(req.query.taskid, session.uid)
            res.redirect('back')
        }
        if (req.query.action == 'take') {
            dbInterface.takeTask(req.query.taskid, session.uid)
            res.redirect('back')
        }
    } else {
        res.sendStatus(403)
    }
})

module.exports = router