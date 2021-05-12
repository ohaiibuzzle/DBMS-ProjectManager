const express = require('express')
const routes = express.Router()
const bodyParser = require('body-parser')
const session = require('express-session')

const base = require('./baseObjects.js')
const dbInterface = require('./dbInterface.js')

var jsonParser = bodyParser.json()
var urlEncodedParser = bodyParser.urlencoded({
    extended: false
})

routes.get('/home/projects', (req, res, next) => {
    if (req.session) {
        if (req.session.loggedin) {
            dbInterface.getProjectsArr().then((prj) => {
                let data = {
                    currentuid: req.session.uid,
                    projects: prj
                }
                res.render('projects.njk', data)
                next()
            })
        } else {
            res.redirect('/login')
        }
    } else {
        res.redirect('/login')
    }
})

routes.post('/api/add_project', urlEncodedParser, (req, res) => {
    if (req.session) {
        if (req.session.loggedin) {
            var body = req.body

            dbInterface.addProject(body.projectName, body.projectDesc, body.projectOwner, 1)

            res.writeHead(302, {
                'Location': '/home/projects'
            })
            res.end()
        } else {
            res.sendStatus(403)
        }
    } else {
        res.sendStatus(403)
    }
})

routes.get('/home/projectDetails', (req, res, next) => {
    if (req.session) {
        if (req.session.loggedin) {
            var query = req.query
            dbInterface.getProjectMemberList(req.query.project).then(members => {
                if (members.includes(parseInt(req.session.uid))) {
                    dbInterface.getProjectDetails(query.project).then(data => {
                        data.currentuid = req.session.uid

                        dbInterface.getTasksByProjectID(query.project).then(tasksList => {
                            data.tasks = tasksList
                            res.render('projectDetails.njk', data)
                        })
                    })
                } else {
                    res.redirect('back')
                }
            })

        } else {
            res.redirect('/login')
        }
    } else {
        res.redirect('/login')
    }

    //res.render('')
})

routes.post('/api/add_member', urlEncodedParser, (req, res) => {
    if (req.session) {
        if (req.session.loggedin) {
            dbInterface.addMember(req.body.projectID, req.body.memberID)
            res.redirect('back')
        } else {
            res.sendStatus(403)
        }
    } else {
        res.sendStatus(403)
    }

})

routes.get('/api/flagmember', urlEncodedParser, (req, res) => {
    if (req.session) {
        if (req.session.loggedin) {
            var projectid = req.query.projectid
            var memberid = req.query.memberid
            if (req.query.action == 'delete') {
                dbInterface.getProjectOwner(projectid).then(owner => {
                    if (owner == memberid) res.redirect('/home/projectDetails?project=' + projectid)
                    else {
                        dbInterface.flagMember(projectid, memberid)
                        res.redirect('/home/projectDetails?project=' + projectid)
                    }
                })
            }

        } else {
            res.redirect('/login')
        }
    } else {
        res.redirect('/login')
    }
})

module.exports = routes