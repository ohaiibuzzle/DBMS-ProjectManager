const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const dbSetup = require('./dbSetup.js')
var rtdata = './rtdata'

router.get('/setup', function(req, res, next) {
    fs.access(rtdata + '/usercreds', fs.F_OK, (err) => {
        if (err) {
            let data = {
                title: "Server setup",
            }
            res.render('setup.njk', data)
            next()
            return;
        }
        let data = {
            title: "Server setup",
            errorMsg: "Your server has already been set up.",
            errorHelp: "If you need to setup your server again, remove the " +
                rtdata + " directory",
            code: 1
        }
        res.render('error.njk', data);
        next()
    })

})

router.get('/usercreds', function(req, res, next) {
    var creds = {
        host: req.query.sva,
        user: req.query.svu,
        port: req.query.svp,
        passwd: req.query.svpw,
        dbase: req.query.dbase
    }
    fs.writeFileSync(rtdata + "/usercreds.json", JSON.stringify(creds), 'utf-8')
    dbSetup.setupDB(creds.host, creds.user, creds.passwd, creds.dbase, creds.port).then(r => {
        res.sendStatus(200)
        next()
    })

})

module.exports = router;