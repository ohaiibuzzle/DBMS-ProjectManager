const express = require('express')
//const session = require('express-session')
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
    if (req.session) {
        if (req.session.loggedin) {
            dbInterface.getIssuesArr().then(iss => {
                var data = {
                    issues: iss
                }

                res.render('issues.njk', data)
            })
        } else {
            res.redirect('/login')
        }
    } else {
        res.redirect('/login')
    }
})

router.post('/api/add_issue', urlEncodedParser, (req, res) => {
    if (req.session) {
        if (req.session.loggedin) {
            //console.log(req.body)
            var projectID = req.body.ProjectID
            var IssueName = req.body.IssueName
            var IssueDesc = req.body.IssueDesc
            var IssueOwner = req.body.IssueOwner

            dbInterface.addIssue(projectID, IssueName, IssueDesc, IssueOwner)
            res.redirect('/home/projectDetails?project=' + projectID)
        } else {
            res.redirect('/login')
        }
    } else {
        res.redirect('/login')
    }
})

router.get('/api/flagissue', urlEncodedParser, (req, res) => {
    if (req.session) {
        if (req.session.loggedin) {
            if (req.query.action == 'delete') {
                var issueid = req.query.issueid
                dbInterface.flagIssue(issueid)

                res.redirect('back');
            }

        } else {
            res.redirect('/login')
        }
    } else {
        res.redirect('/login')
    }
})

module.exports = router