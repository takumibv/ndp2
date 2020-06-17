"use strict";

import request = require("request");
import fs = require('fs');
import mkdirp = require('mkdirp');
import path = require('path');
import TaskQueue from './taskQueueTS';

const utilities = require('./utilities');
let downloadQueue = new TaskQueue(2);

type FixmeAny = any;

function spiderLinks(currentUrl: string, body, nesting: number, callback: Function) {
  if (nesting === 0) {
    return process.nextTick(callback);
  }

  const links = utilities.getPageLinks(currentUrl, body);
  if (links.length === 0) {
    return process.nextTick(callback);
  }

  let completed = 0, hasErrors = false;
  links.forEach(link => {
    downloadQueue.pushTask((done: Function) => {
      spider(link, nesting - 1, err => {
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

function saveFile(filename: string, contents: FixmeAny, callback: fs.NoParamCallback) {
  mkdirp(path.dirname(filename), (err: NodeJS.ErrnoException) => {
    if (err) {
      return callback(err);
    }
    fs.writeFile(filename, contents, callback);
  });
}

function download(url: string, filename: string, callback: Function) {
  console.log(`Downloading ${url}`);
  request(url, (err, response, body) => {
    if (err) {
      return callback(err);
    }
    saveFile(filename, body, err => {
      if (err) {
        return callback(err);
      }
      console.log(`Downloaded and saved: ${url}`);
      callback(null, body);
    });
  });
}

let spidering: Map<string, boolean> = new Map();
function spider(url: string, nesting: number, callback: Function) {
  if (spidering.has(url)) {
    return process.nextTick(callback);
  }
  spidering.set(url, true);

  const filename: string = utilities.urlToFilename(url);
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

spider(process.argv[2], 1, (err?: Error) => {
  if (err) {
    console.log(err);
    process.exit();
  } else {
    console.log('Download complete');
  }
});
