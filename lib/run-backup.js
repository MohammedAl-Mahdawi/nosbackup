var moment = require('moment');
const fs = require('fs');
var util = require('util');

var {
	filesListFolder,
	oldestDate,
	deleteFileFolder,
	getFilesList,
	deleteFile,
	sequentialIterationWithPromises,
	handleMongoDBDestination,
	handleFileDownloadDestination,
	handleFileDestination,
	handleFilesDestination,
	handleMySQLDestination,
	createTmpIfNotExist,
	handleFilesDownloadDestination
} = require('./helpers');

function runBackup(now = false) {
	/**
	 * Start log to the file
	 * https://stackoverflow.com/a/33898010/3263601
	 */
	var logFile = fs.createWriteStream('log.txt', { flags: 'w' });

	var logStdout = process.stdout;

	console.log = function () {
		logFile.write(util.format.apply(null, arguments) + '\n');
		logStdout.write(util.format.apply(null, arguments) + '\n');
	}
	console.error = console.log;
	/**
	 * End log to the file
	 */

	console.log('Backup process started at: ' + moment().format('YYYY-MM-DD-HHmm'));

	var currentDayInMonth = parseInt(moment().format('D'))//(1..31)
	var currentDayInWeek = parseInt(moment().format('E'))//(1..7 start in monday)
	var currentDateTime = moment().format('YYYY-MM-DD-HHmm')
	var backupLimit = 0
	var pathOnDropbox = ''

	if (now) {
		pathOnDropbox = '/manually'
	} else {
		if (currentDayInMonth === 1) {
			pathOnDropbox = '/monthly'
			backupLimit = NosConfig.monthlyLimit
		} else if (currentDayInWeek === 1) {
			pathOnDropbox = '/weekly'
			backupLimit = NosConfig.weeklyLimit
		} else {
			pathOnDropbox = '/daily'
			backupLimit = NosConfig.dailyLimit
		}
	}

	var folderToUploadTo = pathOnDropbox + '/' + currentDateTime

	filesListFolder(pathOnDropbox).then((currentBackupsList) => {
		if (backupLimit && currentBackupsList.entries.length >= backupLimit) {
			var foldersNames = currentBackupsList.entries.map(el => el.name)
			var oldestBackup = oldestDate(foldersNames)

			//Like await deleteFileFolder('/daily/2018-05-15-2255')
			return deleteFileFolder(pathOnDropbox + '/' + oldestBackup)
		}
	}).then(() => {
		/**
		 * Create the tmp folder if not exist
		 */
		return createTmpIfNotExist()
	}).then(() => {
		/**
		 * Cleanup the tmp folder
		 */
		//First get the files
		return getFilesList(process.cwd() + '/tmp')
	}).then((tmpFiles) => {
		//Exclude .gitignore file
		tmpFiles = tmpFiles.filter(i => i !== '.gitignore')

		//Then remove them
		return Promise.all(tmpFiles.map(function (f) {
			return deleteFile(process.cwd() + '/tmp/' + f);
		}))
	}).then(() => {
		var destinationsPromises = NosDestinations.map(d => {
			d.folderToUploadTo = folderToUploadTo
			d.currentDateTime = currentDateTime
			switch (d.type) {
				case 'file':
					return handleFileDestination.bind(null, d);
					break;
				case 'files':
					return handleFilesDestination.bind(null, d);
					break;
				case 'fileDownload':
					return handleFileDownloadDestination.bind(null, d);
					break;
				case 'filesDownload':
					return handleFilesDownloadDestination.bind(null, d);
					break;
				case 'mySQL':
					return handleMySQLDestination.bind(null, d);
					break;
				case 'mongoDB':
					return handleMongoDBDestination.bind(null, d);
					break;
			}
		})

		sequentialIterationWithPromises(destinationsPromises, () => {
			console.log('Backup process completed at: ' + moment().format('YYYY-MM-DD-HHmm'))
		})
	}).catch((e) => {
		console.log(e)
	});
};

module.exports = {
	runBackup
};