const path = require('path');
const db = require('dropbox-stream');
const fs = require('fs');
const got = require('got');
var moment = require('moment');
var archiver = require('archiver');

function upload(opt) {
    return new Promise((resolve, reject) => {
        const FILETOUPLOAD = opt.fileToUpload;

        const up = db.createDropboxUploadStream({
            token: NosConfig.accessToken,
            filepath: opt.folderName + '/' + path.basename(FILETOUPLOAD),
            chunkSize: 1000 * 1024,
            autorename: true
        })
            .on('error', err => {
                reject(err)
                console.log(err)
            })
            .on('progress', res => console.log(res))
            .on('metadata', metadata => {
                resolve(metadata)
                console.log('Metadata', metadata)
            })

        fs.createReadStream(FILETOUPLOAD).pipe(up)
            .on('finish', () => {
                // console.log('This fires before metadata!')
            })
    })
}

function download(opt) {
    return new Promise((resolve, reject) => {
        /**
         * Is the folder of the FILETODOWNLOADTO must be exist
         */
        const FILETODOWNLOAD = opt.fileToDownload;
        const FILETODOWNLOADTO = opt.fileToDownloadTo;

        db.createDropboxDownloadStream({
            token: NosConfig.accessToken,
            filepath: FILETODOWNLOAD
        })
            .on('error', err => {
                console.log(err)
                reject(err)
            })
            .on('metadata', metadata => {
                console.log('Metadata', metadata)
            })
            .on('progress', res => console.log(res))
            .pipe(fs.createWriteStream(FILETODOWNLOADTO))
            .on('finish', () => {
                console.log('Done!')
                resolve()
            });
    })
}

function mySQL(opt) {
    return new Promise((resolve, reject) => {
        /**
         * MySQL
         * https://stackoverflow.com/a/48035109/3263601
         */
        var spawn = require('child_process').spawn;
        var wstream = fs.createWriteStream(opt.dumpFile + '.sql');



        if (opt['DbPassword']) {
            var tags = [
                '-u',
                opt.DbUser,
                '--password=' + opt.DbPassword,
                opt.DbName,
            ]
        } else {
            var tags = [
                '-u',
                opt.DbUser,
                opt.DbName,
            ]
        }

        var mysqldump = spawn('mysqldump', tags);

        mysqldump
            .stdout
            .pipe(wstream).on('finish', function () {
                console.log('mySQL Job Completed!')
                resolve()
            })
            .on('error', function (err) {
                console.log(err)
                reject(err)
            });
    })
}

function mongoDB(opt) {
    return new Promise((resolve, reject) => {

        var spawn = require('child_process').spawn;

        var mongoDBWstream = fs.createWriteStream(opt.dumpFile + '.archive');

        var mongodump = spawn('mongodump', [
            '--archive',
            '--db',
            opt.DbName,
        ]);

        mongodump
            .stdout
            .pipe(mongoDBWstream).on('finish', function () {
                console.log('mongoDB Job Completed!')
                resolve()
            })
            .on('error', function (err) {
                console.log(err)
                reject(err)
            });
    })
}

async function filesListFolder(pathOnDB = "") {
    /**
     * List Folder
     * https://www.dropbox.com/developers/documentation/http/documentation#files-list_folder
     */
    try {
        const response = await got.post('https://api.dropboxapi.com/2/files/list_folder', {
            headers: {
                'Authorization': 'Bearer ' + NosConfig.accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON
                .stringify({
                    "path": pathOnDB,
                    "recursive": false,
                    "include_media_info": false,
                    "include_deleted": false,
                    "include_has_explicit_shared_members": false,
                    "include_mounted_folders": true
                })
        });
        return JSON.parse(response.body);
    } catch (error) {
        throw error
    }
}

async function deleteFileFolder(pathOnDB = "") {
    /**
     * Delete File/Folder
     * https://www.dropbox.com/developers/documentation/http/documentation#files-delete_v2
     */
    try {
        const response = await got.post('https://api.dropboxapi.com/2/files/delete_v2', {
            headers: {
                'Authorization': 'Bearer ' + NosConfig.accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON
                .stringify({
                    "path": pathOnDB
                })
        });
        return JSON.parse(response.body);
    } catch (error) {
        throw error
    }
}

/**
 * folders like [
        '2018-05-15-2255',
        '2018-05-15-2245',
        '2018-05-16-2255',
        '2018-04-16-2256',
        '2018-05-31-2256'
    ]
 */
function oldestDate(folders) {
    var sortedFolders = folders.sort(function (left, right) {
        return moment(left, 'YYYY-MM-DD-HHmm').diff(moment(right, 'YYYY-MM-DD-HHmm'))
    });

    if (sortedFolders.length) {
        return sortedFolders[0]
    }

    return null
}

function getFilesList(folderPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                reject(err);
            }
            resolve(files)
        });
    })
}

function deleteFile(file) {
    return new Promise((resolve, reject) => {
        fs.unlink(file, (err) => {
            if (err) {
                reject(err)
            }
            resolve()
        });
    })
}

function createTmpIfNotExist() {
    return new Promise((resolve, reject) => {
        var dir = process.cwd() + '/tmp';

        fs.exists(dir, (exists) => {
            if (exists) {
                resolve()
            } else {
                fs.mkdir(dir, (err) => {
                    if (err) {
                        reject(err)
                    }
                    resolve()
                })
            }
        });

    })
}

function archiveMaker(opt) {
    return new Promise((resolve, reject) => {
        console.log('Archiver working on: ' + process.cwd() + '/tmp/' + opt.name + '.zip')
        // create a file to stream archive data to.
        var output = fs.createWriteStream(process.cwd() + '/tmp/' + opt.name + '.zip');
        var archive = archiver('zip', {
            zlib: { level: 0 } // Sets the compression level.
        });

        // listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved
        output.on('close', function () {
            resolve()
            console.log(archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
        });

        // This event is fired when the data source is drained no matter what was the data source.
        // It is not part of this library but rather from the NodeJS Stream API.
        // @see: https://nodejs.org/api/stream.html#stream_event_end
        output.on('end', function () {
            console.log('Data has been drained');
        });

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
            } else {
                // throw error
                throw err;
            }
        });

        // good practice to catch this error explicitly
        archive.on('error', function (err) {
            reject(err)
            throw err;
        });

        // pipe archive data to the file
        archive.pipe(output);

        // append files from a sub-directory, putting its contents at the root of archive
        archive.directory(opt.path, false);

        // finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        archive.finalize();
    })
}

function sequentialIterationWithPromises(tasks, cb = null) {
    let promise = tasks.reduce((prev, task) => {
        return prev.then(() => {
            return task();
        });
    }, Promise.resolve());

    promise.then(() => {
        //All tasks completed
        if (cb instanceof Function) {
            cb()
        }
    });
}

function handleMongoDBDestination(destination) {
    return new Promise((resolve, reject) => {
        var dumpFile2 = process.cwd() + '/tmp/' + destination.DbName
        var opt2 = {
            DbName: destination.DbName,
            dumpFile: dumpFile2
        }

        mongoDB(opt2).then(() => {
            upload({ fileToUpload: dumpFile2 + '.archive', folderName: destination.folderToUploadTo }).then(() => {
                resolve()
            }).catch((e) => {
                console.log(e)
                reject(e)
            });
        }).catch((e) => {
            console.log(e)
            reject(e)
        });
    })
}

function handleFileDownloadDestination(destination) {
    return new Promise((resolve, reject) => {
        download({ fileToDownload: destination.fileToDownload, fileToDownloadTo: destination.fileToDownloadTo }).then(() => {
            resolve()
        }).catch((e) => {
            console.log(e)
            reject(e)
        });
    })
}

function handleFileDestination(destination) {
    return new Promise((resolve, reject) => {
        upload({ fileToUpload: destination.path, folderName: destination.folderToUploadTo }).then(() => {
            resolve()
        }).catch((e) => {
            console.log(e)
            reject(e)
        });
    })
}

function handleFilesDestination(destination) {
    return new Promise((resolve, reject) => {
        if (destination.archive) {
            var archiveName = destination.name + '_' + destination.currentDateTime
            archiveMaker({ path: destination.path, name: archiveName }).then(() => {
                upload({ fileToUpload: process.cwd() + '/tmp/' + archiveName + '.zip', folderName: destination.folderToUploadTo }).then(() => {
                    resolve()
                }).catch((e) => {
                    console.log(e)
                    reject(e)
                });
            }).catch((e) => {
                console.log(e)
                reject(e)
            });
        } else {
            getFilesList(destination.path).then((filesNames) => {
                var uploadPromises = filesNames.map(f => {
                    return () => {
                        return new Promise((resolve, reject) => {
                            upload({ fileToUpload: destination.path + '/' + f, folderName: destination.folderToUploadTo }).then(() => {
                                resolve()
                            }).catch((e) => {
                                console.log(e)
                                reject(e)
                            });
                        })
                    }
                })

                sequentialIterationWithPromises(uploadPromises, () => {
                    resolve()
                })
            }).catch((e) => {
                console.log(e)
                reject(e)
            });
        }
    })
}

function handleMySQLDestination(destination) {
    return new Promise((resolve, reject) => {
        var dumpFile = process.cwd() + '/tmp/' + destination.DbName
        var opt = {
            DbUser: destination.DbUser,
            DbName: destination.DbName,
            dumpFile: dumpFile
        }

        if (destination['DbPassword']) {
            opt.DbPassword = destination.DbPassword
        }

        mySQL(opt).then(() => {
            upload({ fileToUpload: dumpFile + '.sql', folderName: destination.folderToUploadTo }).then(() => {
                resolve()
            }).catch((e) => {
                console.log(e)
                reject(e)
            });
        }).catch((e) => {
            console.log(e)
            reject(e)
        });
    })
}

function handleFilesDownloadDestination(destination) {
    return new Promise((resolve, reject) => {
        filesListFolder(destination.folderToDownloadFrom).then((contentList) => {
            //Get only the names of the files(ignore folders!)
            var filesNames = contentList.entries.filter(el => el['.tag'] === 'file').map(el => el.name)

            var downloadPromises = filesNames.map(f => {
                return () => {
                    return new Promise((resolve, reject) => {
                        download({ fileToDownload: destination.folderToDownloadFrom + '/' + f, fileToDownloadTo: destination.folderToDownloadTo + '/' + f }).then(() => {
                            resolve()
                        }).catch((e) => {
                            console.log(e)
                            reject(e)
                        });
                    })
                }
            })

            sequentialIterationWithPromises(downloadPromises, () => {
                resolve()
            })
        }).catch((e) => {
            console.log(e)
            reject(e)
        });
    })
}

module.exports = {
    upload,
    download,
    mySQL,
    mongoDB,
    filesListFolder,
    getFilesList,
    oldestDate,
    deleteFileFolder,
    deleteFile,
    archiveMaker,
    sequentialIterationWithPromises,
    handleMongoDBDestination,
    handleFileDownloadDestination,
    handleFileDestination,
    handleFilesDestination,
    handleMySQLDestination,
    createTmpIfNotExist,
    handleFilesDownloadDestination
};