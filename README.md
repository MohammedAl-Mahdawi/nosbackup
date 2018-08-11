# NOSBackup

A CLI application that allows you to backup what you want and when you want from your PC/server to Dropbox, NOSBackup uses streams and chunks in order to handle big data.


## Table of Contents

1.  [Documentation](#documentation)
    1.  [Requirements](#requirements)
    2.  [Installation](#installation)
    3.  [How to use it](#usage)
    4.  [How it works](#howitworks)
    5.  [nosbackup.config.json](#nosbackup-config-json)
    6.  [nosbackup.destinations.json](#nosbackup-destinations-json)
    6.  [Commands](#commands)
    6.  [Questions](#questions)


2.  [Support](#support)
3.  [News](#news)
4.  [License](#license)


## [Documentation](#documentation)

<a name="documentation"></a>

### Requirements

<a name="requirements"></a>

1. First make sure you have the latest version of [Node.js](https://nodejs.org) installed.
2. Create a Dropbox app from [here](https://www.dropbox.com/developers/apps/create) and save its access token to use it later with NOSBackup.
3. Create four folders in your Dropbox app folder with these names: `manually`, `daily`, `weekly`, and `monthly`.
4. NOSBackup rely on `mysqldump` and `mongodump` to backup MySQL and MongoDB databases, so make sure these tools are installed if you are planning to backup these databases.

### Installation

<a name="installation"></a>

Run:

```shell
npm install nosbackup -g
```


<a name="usage"></a>

### How to use it?

Go to an empty folder that you have permissions to write into it and run: 

```shell
nosbackup b now
```

### How it works

<a name="howitworks"></a>

NOSBackup needs two files in the directory that you run it within it, these files are `nosbackup.config.json` and `nosbackup.destinations.json`, so when you run it for the first time it will ask you to create these configurations and destinations files then it will be able to continue.

NOSBackup currently able to create a daily, weekly, monthly and manually backups, the manually backup is the backup that you can create manually at any time without a schedule.


### nosbackup.config.json

<a name="nosbackup-config-json"></a>


NOSBackup uses this file to save its configurations, here is a sample of this file:

```json
{
	"accessToken": "your-dropbox-app-access-token",
	"monthlyLimit": 4,
	"weeklyLimit": 4,
	"dailyLimit": 30,
	"backupAtHour": 4,
	"backupAtMinute": 30
}
```

You can create this file manually by using any text editor or you can let NOSBackup generates it for you, here is what every configuration means:

- **accessToken**: (String) Your Dropbox app access token.
- **monthlyLimit**: (Number) How many backups should remain in the `monthly` folder, when this number reached and NOSBackup wants to create a new backup it will delete the oldest backup first.
- **weeklyLimit**: (Number) How many backups should remain in the `weekly` folder, when this number reached and NOSBackup wants to create a new backup it will delete the oldest backup first.
- **dailyLimit**: (Number) How many backups should remain in the `daily` folder, when this number reached and NOSBackup wants to create a new backup it will delete the oldest backup first.
- **backupAtHour**: (Number) At which hour(24-hour clock) you want this backup to run.
- **backupAtMinute**: (Number) At which minute you want this backup to run.


### nosbackup.destinations.json

<a name="nosbackup-destinations-json"></a>

NOSBackup uses this file to save the destinations, here is a sample of this file:

```json
[
    {
        "type": "fileDownload",
        "fileToDownload": "/daily/2018-01-02-0103/name_2018-01-02-0103.zip",
        "fileToDownloadTo": "/home/mohammed/Documents/Tmp/20/name_2018-01-02-0103.zip"
    },
    {
        "type": "filesDownload",
        "folderToDownloadFrom": "/daily/2018-01-02-0103",
        "folderToDownloadTo": "/home/mohammed/Documents/Tmp/21"
    },
    {
        "type": "files",
        "archive": true,
        "path": "/media/mohammed/My Passport/Dropbox/htdocs/my-files",
        "name": "my-files"
    },
    {
        "type": "files",
        "archive": false,
        "path": "/media/mohammed/My Passport/Dropbox/Pictures/"
    },
    {
        "type": "file",
        "path": "/media/mohammed/My Passport/Dropbox/Pictures/featured.jpg"
    },
    {
        "type": "mySQL",
        "DbName": "tajer",
        "DbUser": "root",
        "DbPassword": ""
    },
    {
        "type": "mySQL",
        "DbName": "NosBackupTest",
        "DbUser": "root"
    },
    {
        "type": "mongoDB",
        "DbName": "Nos"
    }
]
```

You can create this file manually using any text editor or you can let NOSBackup generate it for you.

The destinations is self explained, you can have as many destinations as you want, the destinations will run sequentially for many reason, here is explanation for these destinations:

- **fileDownload**: In these destinations you have a file in your Dropbox folder app and you want to download it, the `fileToDownload` is the file that you want to download and `fileToDownloadTo` is where you want to download this file to.
- **filesDownload**: In these destinations you have a bunch of files in a folder in your Dropbox folder app and you want to download them, the `folderToDownloadFrom` is the folder that you want to download these files from it and `folderToDownloadTo` is where you want to download these files to.
- **files**: In these destinations you have a bunch of files in a local folder and you want to upload them to your Dropbox folder app, you can archive them(zip them) then upload them or you can upload them as they, just specify where these files are in `path` and whether you want to archive them or not in `archive` and give then a unique name in `name`.
- **file**: In these destinations you have a file in a local folder and you want to upload it to your Dropbox folder app, just specify where this file live in `path`.
- **mySQL**: In this destinations you have a MySQL database and you want to back it up and upload it to your Dropbox folder app.
- **mongoDB**: In these destinations you have a MongoDB database and you want to back it up and upload it to your Dropbox folder app.


### Commands

<a name="commands"></a>

```shell
  Usage: nosbackup [options] [command]

  PC/Server backup CLI app to backup to Dropbox using streams and chunks to handle big data.

  Options:

    -V, --version     output the version number
    -h, --help        output usage information

  Commands:

    configurations|c  Reset the configurations
    destinations|d    Reset destinations
    backup|b [now]    Backup, using the existing configurations and destinations, or create them if they are not exist.
```

For example you can run:

```shell
nosbackup b
```
or
```shell
nosbackup backup
```
To run the backup and create the configurations and destinations files if they are not exist.

This option will run the backup in schedule mode, if you want to run the backup immediately you can run:

```shell
nosbackup b now
```

or

```shell
nosbackup backup now
```

To create/recreate the configurations file run:

```shell
nosbackup c
```
or
```shell
nosbackup configurations
```

To create/recreate the destinations file file run:

```shell
nosbackup d
```
or
```shell
nosbackup destinations
```

To get help run:

```
nosbackup -h
```
or
```
nosbackup --help
```


<a name="questions"></a>

### Questions

**How to daemonized, monitor and keep NOSBackup alive forever.**

There are a lot of tools, however you can use [PM2](https://github.com/Unitech/PM2/) to achieve that.
1. First install PM2 by running `npm install pm2 -g`
2. Run `pm2 start 'nosbackup b'` in the folder that you specified for NOSBackup(must have write permissions).
3. To stop and delete it(undo the above) you can run `pm2 delete 'nosbackup b'`


## Support

<a name="support"></a>

This app is built to run on Linux PCs/servers, so please report an issue only if you run a Linux base operating system, unfortunately I will not be able to test it and reproduce the issue on the other platforms because I dont have them.

You are welcome to contribute code and provide pull requests for NOSBackup, also please feel free to suggest or request any features or enhancements.



## License

<a name="license"></a>

Copyright (c) 2018 [Mohammed Al-Mahdawi](https://al-mahdawi.com/)
Licensed under the MIT license.