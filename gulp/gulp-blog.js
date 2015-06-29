function blogMetaPipeline(files) {

    var isIncluded;

    if (blogMetaPipeline._isIncluded) {
        isIncluded = blogMetaPipeline._isIncluded;
    } else {
        isIncluded = blogMetaPipeline._isIncluded = {};
    }

    return gulp.src(files, { base: paths.src, cwd: paths.src })
        .pipe(frontMatter({
            property: "frontMatter",
            remove: true
        }))
        .pipe(through2.obj(function (file, enc, cb) {

            var yamlObj;

            yamlObj = file.frontMatter;

            if (yamlObj.blog) {
            }

            this.push(file);
            cb();
        }));
}

gulp.task("blog-meta", function () {
    return blogMetaPipeline([filters.mdhtml]);
});