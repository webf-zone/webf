// Gulp specific modules
var gulp = require("gulp");
var gulpFilter = require("gulp-filter");
var cache = require("gulp-cached");
var sourcemaps = require("gulp-sourcemaps");
var runSequence = require("run-sequence");

// Logger modules
var gutil = require("gulp-util");
var colors = gutil.colors;

// File/folder handling modules
var del = require("del");
var fs = require("fs");
var glob = require("glob");
var path = require("path");
var rename = require("gulp-rename");

// DOM parser modules
var cheerio = require("cheerio");
var gulpCheerio = require("gulp-cheerio");

// CSS, SASS, JS related modules
var sass = require("gulp-sass");
var minifyCSS = require("gulp-minify-css");
var autoprefixer = require("autoprefixer-core");
var postCss = require("gulp-postcss");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");

// Stream related modules
var merge = require("merge-stream");
var through2 = require("through2");
var lazypipe = require("lazypipe");

// SVG and sprite related modules
var svgSprite = require("gulp-svg-sprite");

// Templating related modules
var frontMatter = require("gulp-front-matter");
var handlebars = require("handlebars");
var markdown = require("gulp-markdown");

var pkg = require("./package.json");
var props = pkg.props;
var browsers = props.targetBrowsers;

var buildMode = process.argv[2] || "dev";

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
        templates: "**/*.hbs.html"
    };
})();


// Local variables used throughout
var templateRegistry = {},
    compiledTemplates = {};

registerHandlebarPartials();
registerHandlebarHelpers();

// Clean the dist directory
del.sync([paths.dest]);

function renamePipeline() {
    return lazypipe()
        .pipe(rename, function (path) {

            path.dirname = path.dirname.replace(/topPages(\/)*(\\)*/g, "");

            if (path.dirname === "home" && path.basename === "home" && path.extname === ".html") {
                path.dirname = "";
            }

            if (path.extname === ".md") {
                path.extname = ".html";
            }

            if (path.extname === ".html") {
                path.basename = "index";
            }

        })();
};

function htmlPipeline(files) {

    var mdFilter = gulpFilter(filters.md);

    return gulp.src(files, { base: paths.src, cwd: paths.src })
        .pipe(frontMatter({
            property: "frontMatter",
            remove: true
        }))
        .pipe(mdFilter)
        .pipe(markdown())
        .pipe(mdFilter.restore())
        .pipe(through2.obj(function (file, enc, cb) {
            var yaml = file.frontMatter,
                templateName = yaml.template,
                templateContent,
                compiledTemplate,
                templateOutput;

            templateContent = fs.readFileSync(paths.templates + templateName + ".hbs.html").toString();
            compiledTemplate = handlebars.compile(templateContent);

            templateOutput = compiledTemplate({
                contents: file.contents.toString(),
                scss: yaml.scss,
                js: yaml.js,
                title: yaml.title,
                social: yaml.social,
                breadcrumbs: yaml.breadcrumbs
            });

            file.contents = new Buffer(templateOutput);

            this.push(file);
            cb();
        }))
        .pipe(mapUrl())
        .pipe(renamePipeline())
        .pipe(gulp.dest(paths.dest));
}

function sassPipeline(files) {

    return gulp.src(files, { base: paths.src, cwd: paths.src })
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(postCss([autoprefixer({ browsers: browsers })]))
        .pipe(buildMode === "release" ? minifyCSS() : gutil.noop())
        .pipe(sourcemaps.write(".", { addComment: false }))
        .pipe(appendSourcemap(".css"))
        .pipe(renamePipeline())
        .pipe(gulp.dest(paths.dest));
};

function jsPipeline(files) {

    var stream = gulp.src(files, { base: paths.src, cwd: paths.src });

    if (buildMode == "release") {
        stream.pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write(".", { addComment: false }))
        .pipe(appendSourcemap(".js"))
    }

    stream.pipe(renamePipeline())
        .pipe(gulp.dest(paths.dest));

    return stream;
}

gulp.task("copy", function () {
    return gulp.src([filters.fonts, filters.images], { base: paths.src, cwd: paths.src })
        .pipe(gulp.dest(paths.dest));
});

gulp.task("svg-sprite", function () {
    var config = {
        shape: {
            id: {
                generator: "icon-%s"
            }
        },
        mode: {
            symbol: {
                dest: "."
                //example: true
            }
        }
    };

    return gulp.src([filters.svg], { base: paths.icons, cwd: paths.icons })
        .pipe(svgSprite(config))
        .pipe(gulp.dest(paths.dest));
});

gulp.task("html", function () {
    return htmlPipeline([filters.mdhtml, "!" + filters.templates]);
});

gulp.task("sass", function () {
    return sassPipeline(filters.scss);
});

gulp.task("js", function () {
    return jsPipeline(filters.js);
});

gulp.task("jsbundle", function () {
    return gulp.src(paths.jsBundle, { base: paths.src, cwd: paths.src })
        .pipe(sourcemaps.init())
        .pipe(concat(paths.jsBundleName))
        .pipe(uglify())
        .pipe(sourcemaps.write(".", { addComment: false }))
        .pipe(appendSourcemap(".js"))
        .pipe(gulp.dest(paths.dest + paths.js));
});

gulp.task("resource", function (done) {

    var streams = merge(),
        resources = Object.keys(paths.resources);

    if (resources.length > 0) {
        resources.forEach(function (resource) {

            var stream = gulp.src(resource, { cwd: paths.src })
                            .pipe(rename(function (path) {
                                path.dirname = "";
                            }))
                            .pipe(gulp.dest(paths.dest + paths.resources[resource]));

            streams.add(stream);
        });

        return streams;
    } else {
        done();
    }

});

gulp.task("watcher", function (done) {

    gulp.watch([paths.src + filters.scss], function (event) {
        sassPipeline([event.path, "./scss/main.scss"]);
        gutil.log("Modified:", colors.yellow(getRelativePath(event.path)));
    });

    gulp.watch([filters.mdhtml, "!" + filters.templates], { cwd: paths.src }, function (event) {
        htmlPipeline(event.path);
        gutil.log("Modified:", colors.yellow(getRelativePath(event.path)));
    });

    gulp.watch(filters.js, { cwd: paths.src }, function (event) {
        jsPipeline(event.path);
        gutil.log("Modified:", colors.yellow(getRelativePath(event.path)));
    });

    // Since app.js is part of jsbundle, create watch on this file and execute jsbundle task.
    gulp.watch("js/app.js", { cwd: paths.src }, ["jsbundle"]);

    gulp.watch(filters.templates, { cwd: paths.templates }, function (event) {
        if (event.path.indexOf("partials")) {
            registerHandlebarPartials();
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

gulp.task("common", ["copy", "svg-sprite", "html", "sass", "js", "jsbundle", "resource"]);

gulp.task("dev", ["common", "watcher"], function (done) {
    gutil.log(colors.bold.yellow("Watchers Established. You can now start coding."));
    done();
});

gulp.task("release", ["common"], function (done) {
    gutil.log(colors.bold.yellow("Product build is ready."));
});

gulp.task("default", ["release"], function (done) {
    done();
});

function appendSourcemap(extension) {
    return through2.obj(function (file, enc, cb) {

        var filename = path.basename(file.path),
            contents = file.contents.toString(),
            sourceMapComment;

        if (path.extname(file.path) === extension) {

            if (extension === ".js") {
                sourceMapComment = "//# sourceMappingURL=./" + filename + ".map";
            } else {
                sourceMapComment = "/*# sourceMappingURL=./" + filename + ".map */";
            }

            contents += sourceMapComment;
            file.contents = new Buffer(contents);
        }

        this.push(file);
        cb();
    });
}

function mapUrl() {
    return through2.obj(function (file, enc, cb) {

        var html = file.contents.toString(),
            $;

        $ = cheerio.load(html);

        $("a[href]").each(function (index) {
            var item = $(this);

            //console.log(item.attr("href"), ":", getNormalizedUrl(item.attr("href")));
            item.attr("href", getNormalizedUrl(item.attr("href")));
        });

        file.contents = new Buffer($.html().replace(/&#xFEFF;/g, ""));

        this.push(file);
        cb();
    });
}

function getNormalizedUrl(rawUrl) {

    var normalizedUrl = "";

    // This is an absolute URL
    if (rawUrl.indexOf("http") === 0) {
        return rawUrl;
    }
    //rawUrl = path.normalize(rawUrl).replace(new RegExp(escapeRegExp("\\"), 'g'), "/");
    rawUrl = path.normalize(rawUrl).replace(new RegExp("\\\\", 'g'), "/");

    if (rawUrl === "" || rawUrl === "/") {
        normalizedUrl = "/";
    } else if (rawUrl === "#") {
        normalizedUrl = "#";
    } else {

        // Path should be normalized. Outside of directory
        // Get rid of all the ../ at the beginning of path
        rawUrl = rawUrl.replace(new RegExp("\\.\\.\/", "g"), "/");
        rawUrl = rawUrl.replace(new RegExp("\/\/+"), "/");

        if (/^((\/topPages)?\/home\/home.html)$/g.test(rawUrl)) {
            normalizedUrl = "/";
        } else if (/^(\/topPages){1}/g.test(rawUrl)) {
            normalizedUrl = rawUrl.replace("/topPages", "");
        } else if (/^\//g.test(rawUrl)) {
            normalizedUrl = rawUrl;
        } else if (/^([a-z|A-Z])+/g.test(rawUrl)) {
            normalizedUrl = rawUrl;
        } else {
            normalizedUrl = "#invalid";
        }
    }

    normalizedUrl = normalizedUrl.replace(".md", ".html");

    return normalizedUrl;
}

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function registerHandlebarPartials() {
    handlebars.registerPartial('indexHeader', fs.readFileSync(paths.partials + "indexHeader.hbs.html").toString());
    handlebars.registerPartial('indexFooter', fs.readFileSync(paths.partials + "indexFooter.hbs.html").toString());
}

function registerHandlebarHelpers() {
}