"use strict";

var gulp = require("gulp");

// Stream related modules
var through2 = require("through2");
var lazypipe = require("lazypipe");

// File/folder handling modules
var rename = require("gulp-rename");
var path = require("path");

function appendSourcemap(extension) {
    return through2.obj(function (file, enc, cb) {

        var filename = path.basename(file.path),
            contents = file.contents.toString(),
            sourceMapComment;

        if (path.extname(file.path) === extension) {

            if (extension === ".js") {
                sourceMapComment = "//# sourceMappingURL=./" + filename + ".map";
            } else {
                sourceMapComment = "/*# sourceMappingURL=./" + filename + ".map */";
            }

            contents += sourceMapComment;
            file.contents = new Buffer(contents);
        }

        this.push(file);
        cb();
    });
}


function renamePipeline() {
    return lazypipe()
        .pipe(rename, function (path) {

            path.dirname = path.dirname.replace(/topPages(\/)*(\\)*/g, "");

            if (path.dirname === "home" && path.basename === "home" && path.extname === ".html") {
                path.dirname = "";
            }

            if (path.extname === ".md") {
                path.extname = ".html";
            }

            if (path.extname === ".html") {
                path.basename = "index";
            }

        })();
}

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

var exported = {
    appendSourcemap: appendSourcemap,
    renamePipeline: renamePipeline
};

module.exports = exported;