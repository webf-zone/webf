"use strict";

// Gulp specific modules
var gulp = require("gulp");

// Stream related modules
var through2 = require("through2");

// YAML related modules
var frontMatter = require("gulp-front-matter");

// Local data pased from master gulpfile.js
var config;
var paths;
var filters;
var dataStore;

function tagPipeline(files) {

    var isIncluded, _tags;

    if (tagPipeline._isIncluded) {
        isIncluded = tagPipeline._isIncluded;
        _tags = tagPipeline._tags;
    } else {
        isIncluded = tagPipeline._isIncluded = {};
        _tags = tagPipeline._tags = {};
    }

    /* Generates tags as well as taxonomy */
    return gulp.src(files, { base: paths.src, cwd: paths.src })
        .pipe(frontMatter({
            property: "frontMatter",
            remove: true
        }))
        .pipe(through2.obj(function (file, enc, cb) {

            var tags, yamlObj, _isIncluded;

            yamlObj = file.frontMatter;

            _isIncluded = file.history[0] in isIncluded;
            isIncluded[file.history[0]] = true;

            // Create tag list
            if (yamlObj.tags instanceof Array) {

                tags = [];

                // Remove duplicates if any & change to lowercase
                yamlObj.tags.forEach(function (tag) {
                    tag = tag.toLowerCase();

                    if (tags.indexOf(tag) < 0) {
                        tags.push(tag);
                    }

                });



                tags.forEach(function (tag) {

                    var tagObj;

                    tag = tag.toLowerCase();
                    tagObj = _tags[tag];

                    if (tagObj) {
                        // It is already included
                        if (_isIncluded === false) {
                            tagObj.count++;
                        }
                    } else {
                        // Straight away include it as it is not included
                        tagObj = _tags[tag] = {
                            tag: tag,
                            count: 1
                        };
                        dataStore.tags.push(tagObj);
                    }

                });
            }
            cb();
        }, function (cb) {
            // Sort tags by count

            //console.log(dataStore.tags);
            cb();
        }));
}

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

gulp.task("tags", ["data-store"], function () {
    return tagPipeline([filters.mdhtml]);
});

var exported = {
    pipeline: tagPipeline
};

module.exports = function (_paths, _filters, _config, _dataStore) {
    paths = _paths;
    filters = _filters;
    config = _config;

    dataStore = _dataStore;

    return exported;
};