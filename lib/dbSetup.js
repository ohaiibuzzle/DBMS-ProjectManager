const mariadb = require('mariadb');
const fs = require('fs');
const baseObject = require('./baseObjects.js');

const {
    exit
} = require('process');
const {
    randomInt
} = require('crypto');

async function setupDB(host, user, password, database, port) {
    const pool = mariadb.createPool({
        host: host,
        user: user,
        password: password,
        port: port
    })

    let connection = await pool.getConnection()
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\`;`)
    await connection.query(`CREATE DATABASE \`${database}\`;`)
    await connection.query(`USE \`${database}\`;`)

    await connection.query(`DROP TABLE IF EXISTS \`People\`;`)
    await connection.query(`CREATE TABLE \`People\` (
      \`ID\` int(11) NOT NULL AUTO_INCREMENT,
      \`FullName\` longtext NOT NULL,
      \`DOB\` datetime DEFAULT NULL,
      \`PersonIntro\` longtext DEFAULT NULL,
      \`OtherProfiles\` longtext DEFAULT NULL,
      PRIMARY KEY (\`ID\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await connection.query(`DROP TABLE IF EXISTS \`Credentials\`;`)
    await connection.query(`CREATE TABLE \`Credentials\` (
        \`ID\` int(11) NOT NULL,
        \`Username\` text NOT NULL,
        \`Password\` text NOT NULL,
        \`Blocked\` tinyint(1) NOT NULL DEFAULT 0,
        KEY \`ID\` (\`ID\`),
        CONSTRAINT \`Credentials_ibfk_1\` FOREIGN KEY (\`ID\`) REFERENCES \`People\` (\`ID\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await connection.query(`DROP TABLE IF EXISTS \`Projects\`;`)
    await connection.query(`CREATE TABLE \`Projects\` (
        \`ProjectID\` int(11) NOT NULL AUTO_INCREMENT,
        \`ProjectName\` longtext NOT NULL,
        \`ProjectDesc\` longtext NOT NULL,
        \`ProjectOwner\` int(11) NOT NULL,
        \`ProjectStatus\` tinyint(1) NOT NULL,
        PRIMARY KEY (\`ProjectID\`),
        KEY \`ProjectOwner\` (\`ProjectOwner\`),
        CONSTRAINT \`Projects_ibfk_1\` FOREIGN KEY (\`ProjectOwner\`) REFERENCES \`People\` (\`ID\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await connection.query(`DROP TABLE IF EXISTS \`ProjectMembers\`;`)
    await connection.query(`CREATE TABLE \`ProjectMembers\` (
        \`Project\` int(11) NOT NULL,
        \`People\` int(11) NOT NULL,
        KEY \`Project\` (\`Project\`),
        KEY \`People\` (\`People\`),
        CONSTRAINT \`ProjectMembers_ibfk_3\` FOREIGN KEY (\`Project\`) REFERENCES \`Projects\` (\`ProjectID\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`ProjectMembers_ibfk_4\` FOREIGN KEY (\`People\`) REFERENCES \`People\` (\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)


    await connection.query(`DROP TABLE IF EXISTS \`Tasks\`;`)
    await connection.query(`CREATE TABLE \`Tasks\` (
        \`TaskID\` int(11) NOT NULL AUTO_INCREMENT,
        \`TaskName\` longtext NOT NULL,
        \`TaskContent\` longtext NOT NULL,
        \`TaskAssignment\` int(11) DEFAULT NULL,
        \`TaskStatus\` int(11) DEFAULT NULL,
        \`IssueID\` int(11) DEFAULT NULL,
        \`FromProject\` int(11) DEFAULT NULL,
        PRIMARY KEY (\`TaskID\`),
        KEY \`TaskAssignment\` (\`TaskAssignment\`),
        KEY \`IssueID\` (\`IssueID\`),
        KEY \`FromProject\` (\`FromProject\`),
        CONSTRAINT \`Tasks_ibfk_1\` FOREIGN KEY (\`TaskAssignment\`) REFERENCES \`People\` (\`ID\`),
        CONSTRAINT \`Tasks_ibfk_3\` FOREIGN KEY (\`FromProject\`) REFERENCES \`Projects\` (\`ProjectID\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await connection.query(`DROP TABLE IF EXISTS \`Issues\`;`)
    await connection.query(`CREATE TABLE \`Issues\` (
      \`IssueID\` int(11) NOT NULL AUTO_INCREMENT,
      \`IssueName\` longtext NOT NULL,
      \`IssueContent\` longtext NOT NULL,
      \`IssueCreator\` int(11) NOT NULL,
      \`IssueStatus\` tinyint(1) NOT NULL DEFAULT 1,
      \`TaskID\` int(11) DEFAULT NULL,
      \`Project\` int(11) NOT NULL,
      PRIMARY KEY (\`IssueID\`),
      KEY \`IssueCreator\` (\`IssueCreator\`),
      KEY \`TaskID\` (\`TaskID\`),
      KEY \`Project\` (\`Project\`),
      CONSTRAINT \`Issues_ibfk_1\` FOREIGN KEY (\`TaskID\`) REFERENCES \`Tasks\` (\`TaskID\`),
      CONSTRAINT \`Issues_ibfk_2\` FOREIGN KEY (\`IssueCreator\`) REFERENCES \`People\` (\`ID\`),
      CONSTRAINT \`Issues_ibfk_3\` FOREIGN KEY (\`Project\`) REFERENCES \`Projects\` (\`ProjectID\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await connection.query(`ALTER TABLE \`Tasks\`
    ADD FOREIGN KEY (\`IssueID\`) REFERENCES \`Issues\` (\`IssueID\`);`)

    await connection.query(`INSERT INTO People (FullName, DOB, PersonIntro, OtherProfiles)
    VALUES ('Admin','1970/01/01','Admin User','')`).then(r => {
        connection.query(`SELECT LAST_INSERT_ID() AS lastID`).then(id => {
            connection.query(`INSERT INTO Credentials (ID, Username, Password)
    VALUES (${id[0].lastID},'admin','ChangeMe1!')`).then(r => {
                connection.close()
            })
        })
    })

}

module.exports = {
    setupDB
}