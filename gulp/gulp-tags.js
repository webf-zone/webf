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

var _isIncluded = {};
var _tags = {};

function tagPipeline(files) {

    /* Generates tags & sort them */
    return gulp.src(files, { base: paths.src, cwd: paths.src })
        .pipe(frontMatter({
            property: "frontMatter",
            remove: true
        }))
        .pipe(through2.obj(function (file, enc, cb) {

            var tags, yamlObj, filename, _isFileAlreadyIncluded;

            //filename = file.history[0];
            filename = file.path;
            yamlObj = file.frontMatter;

            _isFileAlreadyIncluded = filename in _isIncluded;
            _isIncluded[filename] = true;

            // Create tag list
            if (!!yamlObj.blog && yamlObj.blog.tags instanceof Array) {

                // Remove duplicate tags if any
                tags = getUniqueList(yamlObj.blog.tags);

                tags.forEach(function (tag) {

                    var tagObj, tagKey;

                    // Replace white space with dash (hypens)
                    tagKey = tag.replace(/\s/g, "-");
                    tagObj = _tags[tagKey];

                    if (tagObj) {
                        // It is already included
                        if (_isFileAlreadyIncluded === false) {
                            tagObj.count++;
                        }
                    } else {
                        // Straight away include it as it is not included
                        tagObj = _tags[tagKey] = {
                            tag: tagKey,
                            display: tag.replace(/-/g, " "),
                            count: 1,
                            list: [],
                            url: dataStore.config.tags.baseUrl + tagKey
                        };
                        dataStore.tags.push(tagObj);
                    }

                });
            }
            cb();
        }, function (cb) {
            // Sort tags by count
            sortTagsByOccurenceCount(dataStore.tags);
            //console.log(_tags);
            //console.log(dataStore.tags);
            cb();
        }));
}

function getUniqueList(list) {

    var uniqueList = [];

    // Remove duplicates if any & change to lowercase
    list.forEach(function (listItem) {
        listItem = listItem.toLowerCase();

        if (uniqueList.indexOf(listItem) < 0) {
            uniqueList.push(listItem);
        }

    });

    return uniqueList;
}

function sortTagsByOccurenceCount(tags) {

    // Descending sort
    tags.sort(function (tagObj1, tagObj2) {
        if (tagObj1.count < tagObj2.count) {
            return 1;
        } else if (tagObj1.count > tagObj2.count) {
            return -1;
        } else {
            return 0;
        }
    });

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