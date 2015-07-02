"use strict";

// Gulp specific modules
var gulp = require("gulp");

// File/folder handling modules
var File = require("vinyl");
var fs = require("fs");
var path = require("path");

// Stream related modules
var through2 = require("through2");

// Templating related modules
var handlebars = require("handlebars");

// YAML related modules
var frontMatter = require("gulp-front-matter");

// Common utilities
var utils = require("./gulp-utils.js");
var collectionUtils = require("./gulp-collection-utils.js");

// Local data pased from master gulpfile.js
var config;
var buildMode;
var paths;
var filters;
var dataStore;


function paginationPipeline(files) {

    return gulp.src(files, { base: paths.src, cwd: paths.src })
        .pipe(frontMatter({
            property: "frontMatter",
            remove: true
        }))
        .pipe(through2.obj(function (file, enc, cb) {
            // This part of pipeline generates Context and collection required data

            var context, collection;

            context = Object.create(dataStore);

            Object.keys(file.frontMatter).forEach(function (key) {
                context[key] = file.frontMatter[key];
            });
            delete file.frontMatter;

            file.collectionContext = context;
            this.push(file);

            cb();
        }))
        .pipe(through2.obj(function (file, enc, cb) {
            // This part of pipeline executes collectionCallback specified and gets pages to generate

            var context, collection, collecationCallback, pages;
            var collectionCallback;

            context = file.collectionContext;
            collection = context.collection;

            collectionCallback = collectionUtils[collection.generator];

            pages = collectionCallback(context, dataStore, file);

            file.pages = pages;
            this.push(file);

            cb();
        }))
        .pipe(through2.obj(function (file, enc, cb) {
            // This part of pipeline takes pages objects and generates actual files out of those.

            var pages, pipeline;

            pipeline = this;
            pages = file.pages;

            pages.forEach(function (page, index) {

                var template, output, context;
                var base, newFile;

                context = page.context;

                template = handlebars.compile(page.contents ? page.contents : file.contents.toString());
                output = template(context);
                context.contents = output;

                template = fs.readFileSync(paths.templates + (page.template ? page.template : context.template) + ".hbs").toString();
                template = handlebars.compile(template);

                output = template(context);

                base = path.join(file.path, '..');

                newFile = new File({
                    base: file.base,
                    path: path.join(base, "/" + (index + 1) + "/index.html"),
                    contents: new Buffer(output)
                });

                pipeline.push(newFile);

            });

            cb();
        }))
        /*.pipe(through2.obj(function (file, enc, cb) {
            // This part of the pipeline generates actual HTML files

            var paginator, context, currentPage;
            var template, output, listBeginning;
            var base, newFile;

            paginator = file.paginator;
            context = paginator.context;

            for (currentPage = 0; currentPage < paginator.pagesCount; currentPage++) {

                listBeginning = currentPage * paginator.pageCount;
                context[paginator.contextName] = dataStore[paginator.listToPaginate].slice(listBeginning, listBeginning + paginator.pageCount);

                template = handlebars.compile(file.contents.toString());
                output = template(context);

                template = fs.readFileSync(paths.templates + context.template + ".hbs").toString();
                template = handlebars.compile(template);

                context.contents = output;
                output = template(context);

                base = path.join(file.path, '..');

                newFile = new File({
                    base: file.base,
                    path: path.join(base, "/" + (currentPage + 1) + "/index.html"),
                    contents: new Buffer(output)
                });

                this.push(newFile);
            }

            cb();

        }))*/
        .pipe(gulp.dest(paths.dest));
}

gulp.task("collections", ["html"], function () {
    return paginationPipeline(filters.pagination);
});

var exported = {
    pipeline: paginationPipeline
};

module.exports = function (_paths, _filters, _config, _dataStore) {
    paths = _paths;
    filters = _filters;
    config = _config;
    dataStore = _dataStore;

    buildMode = config.buildMode;

    return exported;
};