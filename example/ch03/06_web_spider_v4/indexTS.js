"use strict";
exports.__esModule = true;
var request = require("request");
var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");
var taskQueueTS_1 = require("./taskQueueTS");
var utilities = require('./utilities');
var downloadQueue = new taskQueueTS_1["default"](2);
function spiderLinks(currentUrl, body, nesting, callback) {
    if (nesting === 0) {
        return process.nextTick(callback);
    }
    var links = utilities.getPageLinks(currentUrl, body);
    if (links.length === 0) {
        return process.nextTick(callback);
    }
    var completed = 0, hasErrors = false;
    links.forEach(function (link) {
        downloadQueue.pushTask(function (done) {
            spider(link, nesting - 1, function (err) {
                if (err) {
                    hasErrors = true;
                    return callback(err);
                }
                if (++completed === links.length && !hasErrors) {
                    callback();
                }
                done();
            });
        });
    });
}
function saveFile(filename, contents, callback) {
    mkdirp(path.dirname(filename), function (err) {
        if (err) {
            return callback(err);
        }
        fs.writeFile(filename, contents, callback);
    });
}
function download(url, filename, callback) {
    console.log("Downloading " + url);
    request(url, function (err, response, body) {
        if (err) {
            return callback(err);
        }
        saveFile(filename, body, function (err) {
            if (err) {
                return callback(err);
            }
            console.log("Downloaded and saved: " + url);
            callback(null, body);
        });
    });
}
var spidering = new Map();
function spider(url, nesting, callback) {
    if (spidering.has(url)) {
        return process.nextTick(callback);
    }
    spidering.set(url, true);
    var filename = utilities.urlToFilename(url);
    fs.readFile(filename, 'utf8', function (err, body) {
        if (err) {
            if (err.code !== 'ENOENT') {
                return callback(err);
            }
            return download(url, filename, function (err, body) {
                if (err) {
                    return callback(err);
                }
                spiderLinks(url, body, nesting, callback);
            });
        }
        spiderLinks(url, body, nesting, callback);
    });
}
spider(process.argv[2], 1, function (err) {
    if (err) {
        console.log(err);
        process.exit();
    }
    else {
        console.log('Download complete');
    }
});
