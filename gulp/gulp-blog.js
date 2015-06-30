"use strict";

// Gulp specific modules
var gulp = require("gulp");

// File/folder handling modules
var path = require("path");

// Stream related modules
var through2 = require("through2");

// YAML related modules
var frontMatter = require("gulp-front-matter");

// Local data pased from master gulpfile.js
var config;
var paths;
var filters;
var dataStore;

var _blog = {};

function blogCollectionPipeline(files) {

    return gulp.src(files, { base: paths.src, cwd: paths.src })
        .pipe(frontMatter({
            property: "frontMatter",
            remove: true
        }))
        .pipe(through2.obj(function (file, enc, cb) {

            var yamlObj, blogObj, filename, index, _isFileAlreadyIncluded;

            //filename = file.history[0];
            filename = file.path;
            yamlObj = file.frontMatter;
            blogObj = yamlObj.blog;

            // Add this page to blog collection only if page belongs to blog category
            if (blogObj) {
                _isFileAlreadyIncluded = filename in _blog;

                // TODO - arranging tags for the blog
                //blogObj.tags

                blogObj.url = "/" + path.relative(process.cwd() + "/" + file.cwd, file.path);
                blogObj.url = blogObj.url.replace(/\\/g, "/");

                if (_isFileAlreadyIncluded === false) {
                    dataStore.blogs.push(blogObj);
                } else {

                    // If file is already included, then just update blog object
                    index = dataStore.blogs.indexOf(_blog[filename]);

                    if (index > -1) {
                        dataStore.blogs.slice(index, 1, blogObj);
                    }
                }
                _blog[filename] = blogObj;

            }

            //this.push(file);
            cb();
        }, function (cb) {
            // Sort blog by last modified date
            sortBlogByLastModifiedDate(dataStore.blogs);
            //console.log(dataStore);
            cb();
        }));
}

gulp.task("blog-collection", ["tags"], function () {
    return blogCollectionPipeline([filters.mdhtml]);
});

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

function sortBlogByLastModifiedDate(blogs) {

    // Descending sort
    blogs.sort(function (blog1, blog2) {

        var date1, date2;

        date1 = new Date(blog1.modified).getTime();
        date2 = new Date(blog2.modified).getTime();

        if (date1 < date2) {
            return 1;
        } else if (date1 > date2) {
            return -1;
        } else {
            return 0;
        }

    });
}


var exported = {
    pipeline: blogCollectionPipeline
};

module.exports = function (_paths, _filters, _config, _dataStore) {
    paths = _paths;
    filters = _filters;
    config = _config;

    dataStore = _dataStore;

    return exported;
};