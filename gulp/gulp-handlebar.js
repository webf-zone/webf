"use strict";
// Templating related modules
var handlebars = require("handlebars");

// File/folder handling modules
var fs = require("fs");

var config;
var paths;
var filters;

function registerHandlebarPartials() {
    handlebars.registerPartial("indexHeader", fs.readFileSync(paths.partials + "indexHeader.hbs").toString());
    handlebars.registerPartial("indexFooter", fs.readFileSync(paths.partials + "indexFooter.hbs").toString());
}

function registerHandlebarHelpers() {
    handlebars.registerHelper("partialEach", function (context, options) {

        var ret, length, fromIndex, howMany;

        ret = "";

        fromIndex = options.hash.from;
        howMany = options.hash.howMany;
        length = fromIndex + howMany;

        length = Math.min(context.length, length);

        for (var i = fromIndex; i < length; i++) {
            ret = ret + options.fn(context[i]);
        }

        return ret;
    });
}

var exported = {
    registerPartials: registerHandlebarPartials,
    registerHelpers: registerHandlebarHelpers
};

module.exports = function (_paths, _filters, _config) {
    paths = _paths;
    filters = _filters;
    config = _config;

    return exported;
};