const mariadb = require('mariadb');
const fs = require('fs');
const baseObject = require('./baseObjects.js');

var userdata = require('../rtdata/usercreds.json');
const {
    exit
} = require('process');
const {
    randomInt
} = require('crypto');

const pool = mariadb.createPool({
    host: userdata.host,
    user: userdata.user,
    password: userdata.passwd,
    database: userdata.dbase,
    port: userdata.port
})

async function getProjects() {
    let connection
    try {
        connection = await pool.getConnection()
        const rows = await connection.query(`SELECT A.ProjectID, A.ProjectName, A.ProjectDesc, B.FullName, A.ProjectStatus, COUNT(C.IssueID) AS IssueCount
        FROM Projects AS A 
        INNER JOIN People AS B ON A.ProjectOwner = B.ID
        LEFT JOIN Issues AS C ON A.ProjectID = C.Project
        GROUP BY A.ProjectID
        `)
        connection.close()
        return rows
    } catch (err) {
        throw err;
    } finally {
        connection.close();
    }
}

async function getProjectsArr() {
    var rows = await getProjects()
    var projects = []
    rows.forEach(element => {
        var prj = new baseObject.Project(element.ProjectID, element.ProjectName, element.ProjectDesc, element.FullName, element.IssueCount)
        projects.push(prj)
        //console.log(prj)
    })
    return projects
}

async function getProjectOwner(projectID) {
    let connection = await pool.getConnection()
    let result = await connection.query(`SELECT ProjectOwner FROM Projects WHERE ProjectID=${projectID}`)
    connection.close()
    if (result.length > 0) return result[0].ProjectOwner
    else return null
}

async function getIssues() {
    let connection
    try {
        connection = await pool.getConnection()
        const rows = await connection.query(`SELECT A.IssueID, A.IssueName, A.IssueContent, B.FullName, C.ProjectName 
            FROM Issues AS A
            INNER JOIN People AS B
            ON A.IssueCreator = B.ID
            INNER JOIN Projects AS C
            ON A.Project = C.ProjectID
            WHERE A.IssueStatus = 1`)
        connection.close()
        return rows
    } catch (err) {
        throw err
    } finally {
        connection.close()
    }
}

async function getIssuesArr() {
    var rows = await getIssues()
    var issues = []
    rows.forEach(element => {
        var iss = new baseObject.Issue(element.IssueID, element.IssueName, element.IssueContent, element.FullName, element.ProjectName)
        issues.push(iss)
    })

    return issues
}

async function addProject(ProjectName, ProjectDesc, ProjectOwner, ProjectStatus) {
    let connection = await pool.getConnection()
    connection.query(`INSERT INTO Projects (ProjectName , ProjectDesc , ProjectOwner , ProjectStatus)
        VALUES('${ProjectName}', '${ProjectDesc}', '${ProjectOwner}', '${ProjectStatus}')`)
    let id = await connection.query(`SELECT LAST_INSERT_ID() AS lastID`)

    await connection.query(`INSERT INTO ProjectMembers (Project, People)
    VALUES(${id[0].lastID}, ${ProjectOwner})`)

    connection.close()

}

async function getProjectDetails(projectID) {
    let connection = await pool.getConnection()
    const basicdetails = await connection.query(`SELECT * FROM Projects WHERE ProjectID = ${projectID}`)
    const members = await connection.query(`SELECT People FROM ProjectMembers WHERE Project = ${projectID}`)
    const issues = await connection.query(`SELECT A.IssueID, A.IssueName, A.IssueContent, B.FullName
    FROM Issues AS A
    INNER JOIN People AS B
    ON A.IssueCreator = B.ID
    WHERE A.Project = ${projectID} AND A.IssueStatus = 1
    GROUP BY B.FullName
    ORDER BY IssueID`)

    var details = basicdetails[0]

    details['issues'] = issues
    details['members'] = []


    for (const member of members) {
        try {
            var result = await connection.query(`SELECT P.ID, P.FullName, C.CNT FROM People AS P, (
                SELECT COUNT(*) AS CNT FROM Issues WHERE Project=${projectID} AND IssueCreator=${member.People}
                ) AS C WHERE ID=${member.People}`)
            if (result[0] != null) {
                //console.log(result)
                details['members'].push({
                    'id': result[0].ID,
                    'name': result[0].FullName,
                    'issueCount': result[0].CNT
                })
            }
        } catch (err) {

        }
    }

    connection.close()
    // console.log(details)
    return details
}

async function getProjectMemberList(projectID) {
    let connection = await pool.getConnection()
    var rows = await connection.query(`SELECT People FROM ProjectMembers
    WHERE Project = ${projectID}`)

    var toReturn = []
    rows.forEach(element => {
        toReturn.push(element['People'])
    })

    connection.close()
    return toReturn
}

async function validateCredentials(username, passwd) {
    if (username && passwd) {
        let connection = await pool.getConnection()
        var results = await connection.query(`SELECT * FROM Credentials WHERE Username='${username}' AND Password='${passwd}'`)
        connection.close()
        if (results.length > 0) return results[0].ID
        else return null
    }
    return null
}

async function addIssue(projectID, issue, issueContent, issueCreator) {
    let connection = await pool.getConnection()
    await connection.query(`INSERT INTO Issues (IssueName, IssueContent, IssueCreator, Project)
    VALUES('${issue}','${issueContent}',${issueCreator},${projectID})`)
    connection.close()
}

async function addTask(projectID, task, taskContent) {
    let connection = await pool.getConnection()
    await connection.query(`INSERT INTO Tasks (TaskName, TaskContent, FromProject, TaskStatus)
    VALUES('${task}','${taskContent}',${projectID}, 1)`)
    connection.close()
}

async function addMember(projectID, memberID) {
    let connection = await pool.getConnection()
    await connection.query(`INSERT INTO ProjectMembers (Project, People)
    VALUES(${projectID}, ${memberID})`)
    connection.close()
}

async function flagMember(projectID, memberID) {
    let connection = await pool.getConnection()
    await connection.query(`DELETE FROM ProjectMembers 
    WHERE Project  = ${ projectID } AND People = ${ memberID }`)
    connection.close()
}

async function flagIssue(issueID) {
    let connection = await pool.getConnection()
    await connection.query(`UPDATE Issues SET
    IssueStatus = '0'
    WHERE IssueID = ${issueID};`)
    connection.close()
}

async function queryMembers() {
    let connection = await pool.getConnection()
    let rows = await connection.query(`SELECT * FROM People`)

    //console.log(rows)
    connection.close()

    return rows
}

async function getTasksByUID(uid) {
    let connection = await pool.getConnection()
    let rows = await connection.query(`SELECT Tasks.TaskID, Tasks.TaskName, Tasks.TaskContent, Projects.ProjectName FROM Tasks
    INNER JOIN Projects
    ON Tasks.FromProject = Projects.ProjectID
    WHERE Tasks.TaskAssignment = ${uid} AND Tasks.TaskStatus = 1`)

    connection.close()

    return rows
}

async function getTasksByProjectID(projectID) {
    let connection = await pool.getConnection()
    let rows = await connection.query(`SELECT Tasks.TaskID, Tasks.TaskName, Tasks.TaskContent, Tasks.TaskAssignment, People.FullName FROM Tasks
    LEFT JOIN People
    ON Tasks.TaskAssignment = People.ID
    WHERE Tasks.FromProject = ${projectID} AND Tasks.TaskStatus = 1`)

    connection.close()

    return rows
}

async function getTasksIDsByUID(uid) {
    let connection = await pool.getConnection()
    let rows = await connection.query(`SELECT Tasks.TaskID FROM Tasks WHERE Tasks.TaskAssignment= ${uid}`)

    connection.close()

    var ids = []
    rows.forEach(element => {
        ids.push(element['TaskID'])
    })

    return ids
}

async function flagTask(taskid, uid) {
    let connection = await pool.getConnection()
    let rows = await connection.query(`UPDATE Tasks
    SET TaskStatus = 0
    WHERE TaskID = ${taskid} AND TaskAssignment = ${uid}`)
    connection.close()
}

async function takeTask(taskid, uid) {
    let connection = await pool.getConnection()
    await connection.query(`UPDATE Tasks
    SET TaskAssignment=${uid}
    WHERE TaskID=${taskid}`).then(r => {
        connection.close()
    })
}

async function releaseTask(taskid) {
    let connection = await pool.getConnection()
    await connection.query(`UPDATE Tasks
    SET TaskAssignment = NULL
    WHERE TaskID = ${taskid}`).then(r => {
        connection.close()
    })
}

async function changepasswd(uid, newpasswd) {
    let connection = await pool.getConnection()
    await connection.query(`UPDATE Credentials
    SET Password = '${newpasswd}'
    WHERE ID = ${uid}`).then(r => {
        connection.close()
    })
}

async function newMember(fullName, dob, personIntro, otherProfiles, username, passwd) {
    let connection = await pool.getConnection()
    await connection.query(`INSERT INTO People (FullName, DOB, PersonIntro, OtherProfiles)
    VALUES ('${fullName}','${dob}','${personIntro}','${otherProfiles}')`).then(r => {
        connection.query(`SELECT LAST_INSERT_ID() AS lastID`).then(id => {
            connection.query(`INSERT INTO Credentials (ID, Username, Password)
        VALUES (${id[0].lastID},'${username}','${passwd}')`).then(r => {
                connection.close()
            })
        })
    })
}

module.exports = {
    getProjectsArr,
    getIssuesArr,
    getProjectOwner,
    addProject,
    getProjectDetails,
    getProjectMemberList,
    validateCredentials,
    addIssue,
    addTask,
    addMember,
    flagMember,
    flagIssue,
    queryMembers,
    getTasksByUID,
    getTasksByProjectID,
    getTasksIDsByUID,
    flagTask,
    takeTask,
    releaseTask,
    changepasswd,
    newMember
}