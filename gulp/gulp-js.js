"use strict";

// Gulp specific modules
var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");

// JS related modules
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");

// Common utilities
var utils = require("./gulp-utils.js");

// Local data pased from master gulpfile.js
var config;
var buildMode;
var paths;
var filters;

function jsPipeline(files) {

    var stream = gulp.src(files, { base: paths.src, cwd: paths.src });

    if (buildMode === "release") {
        stream.pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write(".", { addComment: false }))
        .pipe(utils.appendSourcemap(".js"));
    }

    stream.pipe(utils.renamePipeline())
        .pipe(gulp.dest(paths.dest));

    return stream;
}

gulp.task("js", function () {
    return jsPipeline(filters.js);
});

gulp.task("jsbundle", function () {
    return gulp.src(paths.jsBundle, { base: paths.src, cwd: paths.src })
        .pipe(sourcemaps.init())
        .pipe(concat(paths.jsBundleName))
        .pipe(uglify())
        .pipe(sourcemaps.write(".", { addComment: false }))
        .pipe(utils.appendSourcemap(".js"))
        .pipe(gulp.dest(paths.dest + paths.js));
});

var exported = {
    pipeline: jsPipeline
};

module.exports = function (_paths, _filters, _config) {
    paths = _paths;
    filters = _filters;
    config = _config;

    buildMode = config.buildMode;

    return exported;
};