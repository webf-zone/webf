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
    var tagStreamQueue = [];
    var blogStreamQueue = [];

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
            var hbsContext;

            hbsContext = Object.create(dataStore);

            Object.keys(file.frontMatter).forEach(function (key) {
                hbsContext[key] = file.frontMatter[key];
            });
            delete file.frontMatter;

            file.hbsContext = hbsContext;

            this.push(file);
            cb();

        }))
        .pipe(through2.obj(function (file, enc, cb) {

            // Manipulate tags
            var hbsContext, filename;

            //filename = file.history[0];
            filename = file.path;
            hbsContext = file.hbsContext;

            if (!!hbsContext.blog && hbsContext.blog.tags instanceof Array) {
                // Get actual tag object for each tag
                hbsContext.blog.tags = tagManager.updateTags(hbsContext.blog.tags, filename);
            }

            tagStreamQueue.push(file);
            cb();

        }, function (cb) {

            var stream = this;

            tagManager.sortTags(dataStore.tags);
            tagStreamQueue.forEach(function (file) {
                stream.push(file);
            });
            cb();
        }))
        .pipe(through2.obj(function (file, enc, cb) {
            // Manipulate blog
            var hbsContext, filename, blogObj;

            filename = file.path;
            hbsContext = file.hbsContext;
            blogObj = hbsContext.blog;

            if (blogObj) {
                blogManager.updateBlogs(blogObj, filename, file);
            }

            blogStreamQueue.push(file);
            cb();
        }, function (cb) {

            var stream = this;

            blogManager.sortBlogs(dataStore.blogs);
            blogStreamQueue.forEach(function (file) {
                stream.push(file);
            });
            cb();
        }))
        .pipe(through2.obj(function (file, enc, cb) {

            // Compile handlebar template and produce final html file
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
        .pipe(utils.renamePipeline())
        .pipe(gulp.dest(paths.dest));
}

gulp.task("html", ["data-store"], function () {
    return htmlPipeline([filters.mdhtml]);
});

var tagManager = {

    _isIncluded: {},

    _tags: {},

    updateTags: function (tags, filename) {

        var manager, tagList, uniqueList, _isFileAlreadyIncluded;

        manager = this;
        uniqueList = [];
        tagList = [];

        _isFileAlreadyIncluded = filename in manager._isIncluded;
        manager._isIncluded[filename] = true;

        tags.forEach(function (tag) {
            var tagKey, tagValue, tagObj;

            // Replace white space with dash (hypens) & vice a versa
            tag = tag.toLowerCase();
            tagKey = tag.replace(/(\s)+/g, "-");
            tagValue = tagKey.replace(/-/g, " ");

            if (uniqueList.indexOf(tagKey) === -1) {
                uniqueList.push(tagKey);

                tagObj = manager._tags[tagKey];

                if (tagObj) {
                    // It is already included
                    if (_isFileAlreadyIncluded === false) {
                        tagObj.count++;
                    }
                } else {
                    // Straight away include it as it is not included
                    tagObj = manager._tags[tagKey] = {
                        tag: tagKey,
                        display: tagValue,
                        count: 1,
                        url: dataStore.config.tags.baseUrl + tagKey
                    };
                    dataStore.tags.push(tagObj);
                }
                tagList.push(tagObj);
            }

        });

        return tagList;
    },

    sortTags: function (tags) {
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
};

var blogManager = {
    _blog: {},

    _updateBlogStructure: function (blogObj, file) {

        // TODO - This needs some improvement

        blogObj.title = file.hbsContext.title;
        blogObj.published = utils.getFormattedDate(blogObj.published);
        blogObj.modified = utils.getFormattedDate(blogObj.modified);
        blogObj.author = dataStore.people[blogObj.author];

        blogObj.url = "/" + path.relative(process.cwd() + "/" + file.cwd, file.path);
        blogObj.url = blogObj.url.replace(/\\/g, "/");

    },

    updateBlogs: function (blogObj, filename, file) {

        var manager, index, _isFileAlreadyIncluded;

        manager = this;

        manager._updateBlogStructure(blogObj, file);

        _isFileAlreadyIncluded = filename in manager._blog;

        if (_isFileAlreadyIncluded === true) {
            // If file is already included, then just update blog object
            index = dataStore.blogs.indexOf(manager._blog[filename]);
            dataStore.blogs.slice(index, 1, blogObj);

        } else {
            dataStore.blogs.push(blogObj);
        }

        manager._blog[filename] = blogObj;

    },

    sortBlogs: function (blogs) {

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
};

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