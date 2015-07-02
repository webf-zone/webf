"use strict";

var gulp = require("gulp");

// Stream related modules
var through2 = require("through2");
var lazypipe = require("lazypipe");

// File/folder handling modules
var rename = require("gulp-rename");
var path = require("path");

function getFormattedDate(dateString) {
    var date = new Date(dateString);

    return date.getFullYear() + " " + _getMonthName(date) + ", " + date.getDate();
}

function _getMonthName(date) {
    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return monthNames[date.getMonth()];
}

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
    renamePipeline: renamePipeline,
    getFormattedDate: getFormattedDate
};

module.exports = exported;


function mapUrl() {
    return through2.obj(function (file, enc, cb) {

        var html = file.contents.toString(),
            $;

        $ = cheerio.load(html);

        $("a[href]").each(function (index) {
            var item = $(this);

            //console.log(item.attr("href"), ":", getNormalizedUrl(item.attr("href")));
            item.attr("href", getNormalizedUrl(item.attr("href")));
        });

        file.contents = new Buffer($.html().replace(/&#xFEFF;/g, ""));

        this.push(file);
        cb();
    });
}

function getNormalizedUrl(rawUrl) {

    var normalizedUrl = "";

    // This is an absolute URL
    if (rawUrl.indexOf("http") === 0) {
        return rawUrl;
    }
    //rawUrl = path.normalize(rawUrl).replace(new RegExp(escapeRegExp("\\"), 'g'), "/");
    rawUrl = path.normalize(rawUrl).replace(new RegExp("\\\\", 'g'), "/");

    if (rawUrl === "" || rawUrl === "/") {
        normalizedUrl = "/";
    } else if (rawUrl === "#") {
        normalizedUrl = "#";
    } else {

        // Path should be normalized. Outside of directory
        // Get rid of all the ../ at the beginning of path
        rawUrl = rawUrl.replace(new RegExp("\\.\\.\/", "g"), "/");
        rawUrl = rawUrl.replace(new RegExp("\/\/+"), "/");

        if (/^((\/topPages)?\/home\/home.html)$/g.test(rawUrl)) {
            normalizedUrl = "/";
        } else if (/^(\/topPages){1}/g.test(rawUrl)) {
            normalizedUrl = rawUrl.replace("/topPages", "");
        } else if (/^\//g.test(rawUrl)) {
            normalizedUrl = rawUrl;
        } else if (/^([a-z|A-Z|0-9])+/g.test(rawUrl)) {
            normalizedUrl = rawUrl;
        } else {
            normalizedUrl = "#invalid";
        }
    }

    normalizedUrl = normalizedUrl.replace(".md", ".html");

    return normalizedUrl;
}
