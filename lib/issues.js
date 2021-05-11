const express = require('express')
const session = require('express-session')
const router = express.Router()
const dbInterface = require('./dbInterface.js')
const bodyParser = require('body-parser')
const {
    request
} = require('express')

const urlEncodedParser = bodyParser.urlencoded({
    extended: false
})

router.get('/home/issues', (req, res, next) => {
    if (session.loggedin) {
        dbInterface.getIssuesArr().then(iss => {
            var data = {
                issues: iss
            }

            res.render('issues.njk', data)
        })
    } else {
        res.redirect('/login')
    }
})

router.post('/api/add_issue', urlEncodedParser, (req, res) => {
    if (session.loggedin) {
        var projectID = req.body.projectID
        var IssueName = req.body.IssueName
        var IssueDesc = req.body.IssueDesc
        var issueOwner = req.body.issueOweer

        dbInterface.addIssue(projectID, issueName, IssueDesc, issueOwner)
        res.redirect('/home/projectDetails?project=' + projectID)
    }
})

router.get('/api/flagissue', urlEncodedParser, (req, res) => {
    if (session.loggedin) {
        if (req.query.action == 'delete') {
            var issueid = req.query.issueid
            dbInterface.flagIssue(issueid)

            res.redirect('back');
        }

    } else {
        res.redirect('/login')
    }
})

module.exports = router