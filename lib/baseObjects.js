class Project {
    constructor(id, name, description, owner, issues) {
        this.id = id
        this.name = name
        this.description = description
        this.owner = owner
        this.issues = issues
    }
}

class Issue {
    constructor(id, name, description, creator, project) {
        this.id = id
        this.name = name
        this.description = description
        this.creator = creator
        this.project = project
    }
}

module.exports = {
    Project,
    Issue
}