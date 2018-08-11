var inquirer = require('inquirer');

var destinations = []
isBeginning = true

var destinationType = {
    type: 'list',
    name: 'destinationType',
    message: 'Please choose the destination type?',
    choices: ['mongoDB', 'mySQL', 'files', 'file', 'fileDownload', 'filesDownload']
};

var mongoDBquestions = [
    {
        type: 'input',
        name: 'DbName',
        message: 'Enter database name ...'
    }
];

var fileQuestions = [
    {
        type: 'input',
        name: 'path',
        message: 'Enter path ...'
    }
];

var fileDownloadQuestions = [
    {
        type: 'input',
        name: 'fileToDownload',
        message: 'Enter the file to download ...'
    },
    {
        type: 'input',
        name: 'fileToDownloadTo',
        message: 'Enter the file to download to ...'
    }
];

var filesDownloadQuestions = [
    {
        type: 'input',
        name: 'folderToDownloadFrom',
        message: 'Enter the folder to download from ...'
    },
    {
        type: 'input',
        name: 'folderToDownloadTo',
        message: 'Enter the folder to download to ...'
    }
];

var filesQuestions = [
    {
        type: 'confirm',
        name: 'archive',
        message: 'Want to archive these files (just hit enter for YES)?',
        default: true
    },
    {
        type: 'input',
        name: 'path',
        message: 'Enter path ...'
    },
    {
        type: 'input',
        name: 'name',
        message: 'Enter a name for this destination ...'
    }
];

var mySQLquestions = [
    {
        type: 'input',
        name: 'DbName',
        message: 'Enter database name ...'
    },
    {
        type: 'input',
        name: 'DbUser',
        message: 'Enter database user ...'
    },
    {
        type: 'input',
        name: 'DbPassword',
        message: 'Enter database password ...'
    }
];

var askForAnotherDestination = [
    {
        type: 'confirm',
        name: 'addAgain',
        message: 'Want to enter another destination (just hit enter for YES)?',
        default: true
    }
];

function destinationsBuilder() {
    return new Promise((resolve, reject) => {
        function addDestination() {
            inquirer.prompt(destinationType).then(answers => {
                switch (answers.destinationType) {
                    case 'mongoDB':
                        inquirer.prompt(mongoDBquestions).then(answers => {
                            destinations.push({
                                "type": "mongoDB",
                                "DbName": answers.DbName
                            })
                            addAnotherDest()
                        });
                        break;
                    case 'fileDownload':
                        inquirer.prompt(fileDownloadQuestions).then(answers => {
                            destinations.push({
                                "type": "fileDownload",
                                "fileToDownload": answers.fileToDownload,
                                "fileToDownloadTo": answers.fileToDownloadTo
                            })
                            addAnotherDest()
                        });
                        break;
                    case 'filesDownload':
                        inquirer.prompt(filesDownloadQuestions).then(answers => {
                            destinations.push({
                                "type": "filesDownload",
                                "folderToDownloadFrom": answers.folderToDownloadFrom,
                                "folderToDownloadTo": answers.folderToDownloadTo,
                            })
                            addAnotherDest()
                        });
                        break;
                    case 'file':
                        inquirer.prompt(fileQuestions).then(answers => {
                            destinations.push({
                                "type": "file",
                                "path": answers.path,
                            })
                            addAnotherDest()
                        });
                        break;
                    case 'files':
                        inquirer.prompt(filesQuestions).then(answers => {
                            destinations.push({
                                "type": "files",
                                "path": answers.path,
                                "archive": answers.archive,
                                "name": answers.name,
                            })
                            addAnotherDest()
                        });
                        break;
                    case 'mySQL':
                        inquirer.prompt(mySQLquestions).then(answers => {
                            destinations.push({
                                "type": "mySQL",
                                "DbName": answers.DbName,
                                "DbUser": answers.DbUser,
                                "DbPassword": answers.DbPassword,
                            })
                            addAnotherDest()
                        });
                        break;
                }

            });
        }

        function addAnotherDest() {
            if (isBeginning) {
                addDestination();
                isBeginning = false
            } else {
                inquirer.prompt(askForAnotherDestination).then(answers => {
                    if (answers.addAgain) {
                        addDestination();
                    } else {
                        resolve(destinations)
                    }
                });
            }
        }

        addAnotherDest()

    })
}

module.exports = {
    destinationsBuilder
};