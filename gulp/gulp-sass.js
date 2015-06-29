"use strict";

var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");

// CSS, SASS related modules
var sass = require("gulp-sass");
var minifyCSS = require("gulp-minify-css");
var autoprefixer = require("autoprefixer-core");
var postCss = require("gulp-postcss");

// Logger modules
var gutil = require("gulp-util");
var colors = gutil.colors;

// Common utilities
var utils = require("./gulp-utils.js");

// Local data pased from master gulpfile.js
var config;
var browsers;
var buildMode;
var paths;
var filters;

function sassPipeline(files) {

    return gulp.src(files, { base: paths.src, cwd: paths.src })
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(postCss([autoprefixer({ browsers: browsers })]))
        .pipe(buildMode === "release" ? minifyCSS() : gutil.noop())
        .pipe(sourcemaps.write(".", { addComment: false }))
        .pipe(utils.appendSourcemap(".css"))
        .pipe(utils.renamePipeline())
        .pipe(gulp.dest(paths.dest));
}

gulp.task("sass", function () {
    return sassPipeline(filters.scss);
});

var exported = {
    pipeline: sassPipeline
};

module.exports = function (_paths, _filters, _config) {
    paths = _paths;
    filters = _filters;
    config = _config;

    browsers = config.pkg.props.targetBrowsers;
    buildMode = config.buildMode;

    return exported;
};