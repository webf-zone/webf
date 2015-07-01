"use strict";

// Gulp specific modules
var gulp = require("gulp");

// Stream related modules
var through2 = require("through2");

// File/folder handling modules
var path = require("path");

// YAML related modules
var jsyaml = require("js-yaml");

// Local data pased from master gulpfile.js
var config;
var paths;
var filters;
var dataStore;

function dataStorePipeline(files) {
    return gulp.src(files, { base: paths.src, cwd: paths.src })
        .pipe(through2.obj(function (file, enc, cb) {

            var storeKey, storeData;

            storeKey = path.basename(file.history[0], ".yaml");
            storeData = jsyaml.safeLoad(file.contents.toString());

            dataStore[storeKey] = storeData;

            //this.push(file);
            cb();
        }, function (cb) {
            //console.log(dataStore.config.taxonomies.Regions);
            cb();
        }));
}

gulp.task("data-store", function () {
    return dataStorePipeline(filters.yaml);
});

var exported = {
    pipeline: dataStorePipeline
};

module.exports = function (_paths, _filters, _config, _dataStore) {
    paths = _paths;
    filters = _filters;
    config = _config;
    dataStore = _dataStore;

    return exported;
};