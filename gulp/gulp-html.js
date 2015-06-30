"use strict";

// Gulp specific modules
var gulp = require("gulp");
var gulpFilter = require("gulp-filter");

// File/folder handling modules
var fs = require("fs");
var path = require("path");

// Stream related modules
var through2 = require("through2");

// DOM parser modules
var cheerio = require("cheerio");

// Templating related modules
var handlebars = require("handlebars");
var markdown = require("gulp-markdown");

// YAML related modules
var frontMatter = require("gulp-front-matter");
var jsyaml = require("js-yaml");

// Common utilities
var utils = require("./gulp-utils.js");


// Local data pased from master gulpfile.js
var config;
var buildMode;
var paths;
var filters;
var dataStore;

function htmlPipeline(files) {

    var mdFilter = gulpFilter(filters.md);

    return gulp.src(files, { base: paths.src, cwd: paths.src })
        .pipe(frontMatter({
            property: "frontMatter",
            remove: true
        }))
        .pipe(mdFilter)
        .pipe(markdown())
        .pipe(mdFilter.restore())
        .pipe(through2.obj(function (file, enc, cb) {
            // Create handlebar context required for template compilation
            // yamlObj is the extracted yaml frontMatter from each file
            var yamlObj;

            yamlObj = Object.create(dataStore);

            Object.keys(file.frontMatter).forEach(function (key) {
                yamlObj[key] = file.frontMatter[key];
            });

            file.hbsContext = yamlObj;

            this.push(file);
            cb();

        }))
        .pipe(through2.obj(function (file, enc, cb) {
            var template, output, hbsContext;

            // Retrive the context for file
            hbsContext = file.hbsContext;

            // First, compile content of each html/md file as template and execute against hbsContext
            template = handlebars.compile(file.contents.toString());
            output = template(hbsContext);

            // Set the contents of context to output of first compilation
            hbsContext.contents = output;

            // Second, compile master template
            template = fs.readFileSync(paths.templates + hbsContext.template + ".hbs").toString();
            template = handlebars.compile(template);

            // Now execute master template against second compilation
            output = template(hbsContext);

            // Set the contents of file to ouput of second compilation
            file.contents = new Buffer(output);

            this.push(file);
            cb();
        }))
        .pipe(mapUrl())
        .pipe(utils.renamePipeline())
        .pipe(gulp.dest(paths.dest));
}

gulp.task("html", ["data-store", "tags"], function () {
    return htmlPipeline([filters.mdhtml]);
});

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


var exported = {
    pipeline: htmlPipeline
};

module.exports = function (_paths, _filters, _config, _dataStore) {
    paths = _paths;
    filters = _filters;
    config = _config;
    dataStore = _dataStore;

    buildMode = config.buildMode;

    return exported;
};