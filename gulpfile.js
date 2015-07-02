// Gulp specific modules
var gulp = require("gulp");
var runSequence = require("run-sequence");

// File/folder handling modules
var del = require("del");
var path = require("path");

// Logger modules
var gutil = require("gulp-util");
var colors = gutil.colors;

// Reading package.json file
var pkg = require("./package.json");
var props = pkg.props;
var buildMode = process.argv[2] || "dev";

// Data variables
var config = {
    pkg: pkg,
    buildMode: buildMode
};

// This 'dataStore' is the context for all handlebar templates
var dataStore = {
    tags: [],
    blogs: []
};

//Polyfill
require("es6-promise").polyfill();

// System wide paths
var paths = (function () {

    var src = "./src/";

    return {
        src: src,
        dest: "./dist/",
        js: "./js/",
        icons: src + "/img/svg-icons/",
        templates: src + "templates/",
        partials: src + "templates/partials/",
        resources: props.resources,
        jsBundle: props.jsBundle,
        jsBundleName: "bundle.js"
    };

})();

// File selection filters
var filters = (function () {
    return {
        all: "**/*.*",
        js: "**/*.js",
        md: "**/*.md",
        svg: "**/*.svg",
        scss: "**/*.scss",
        html: "**/*.html",
        mdhtml: "**/*.{md,html}",
        fonts: "**/*.{eot,svg,ttf,woff,woff2}",
        images: "**/*.{png,jpg,jpeg,gif}",
        templates: "**/*.hbs",
        pagination: "**/*.collection",
        yaml: "**/*.{yaml,yml}"
    };

})();

// Clean the dist directory
del.sync([paths.dest]);

// Gulp task - copy
require("./gulp/gulp-copy.js")(paths, filters);

// Gulp task - data-store
var taskDataStore = require("./gulp/gulp-data-store.js")(paths, filters, config, dataStore);

// Handlebar utilities
var taskHandlebar = require("./gulp/gulp-handlebar.js")(paths, filters, config, dataStore);

// Gulp task - html
var taskHtml = require("./gulp/gulp-html.js")(paths, filters, config, dataStore);

// Gulp task - js
var taskJs = require("./gulp/gulp-js.js")(paths, filters, config, dataStore);

// Gulp task - paginate
var taskJs = require("./gulp/gulp-collection.js")(paths, filters, config, dataStore);

// Gulp task - sass
var taskSass = require("./gulp/gulp-sass.js")(paths, filters, config);

// Gulp task - svg-sprite
var taskSvg = require("./gulp/gulp-svg.js")(paths, filters, config, dataStore);

// Shared utilities
var utils = require("./gulp/gulp-utils.js")

// Gulp task - default, release, test, common
require("./gulp/gulp-run.js");

gulp.task("watcher", function (done) {

    gulp.watch([paths.src + filters.scss], function (event) {
        taskSass.pipeline([event.path, "./scss/main.scss"]);
        gutil.log("Modified:", colors.yellow(getRelativePath(event.path)));
    });

    gulp.watch([filters.mdhtml], { cwd: paths.src }, function (event) {
        taskHtml.pipeline(event.path);
        gutil.log("Modified:", colors.yellow(getRelativePath(event.path)));
    });

    gulp.watch(filters.js, { cwd: paths.src }, function (event) {
        taskJs.pipeline(event.path);
        gutil.log("Modified:", colors.yellow(getRelativePath(event.path)));
    });

    // Since app.js is part of jsbundle, create watch on this file and execute jsbundle task.
    gulp.watch("js/app.js", { cwd: paths.src }, ["jsbundle"]);

    gulp.watch(filters.templates, { cwd: paths.templates }, function (event) {
        if (event.path.indexOf("partials")) {
            taskHandlebar.registerPartials();
        }

        runSequence("html", function () {
            gutil.log("Modified:", colors.yellow(getRelativePath(event.path)));
        });
    });

    done();

    function getRelativePath(modifiedPath) {
        return path.relative(process.cwd() + "/" + paths.src, modifiedPath);
    }
});

taskHandlebar.registerPartials();
taskHandlebar.registerHelpers();

