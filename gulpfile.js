var uglify = require('gulp-uglify');
var gulp = require('gulp');

var browserify = require('gulp-browserify');

var mainFile = "src/script/main.js";

var browserifyConfig = {
    transform: ["reactify"],
    debug : !gulp.env.production
};

var paths = {
    html: "src/*.html",
    media: "src/media/**/*",
    script: "src/script/**/*.js"
}

// Basic usage

gulp.task('script', function() {
    // Single entry point to browserify
    gulp.src(mainFile)
        .pipe(browserify(browserifyConfig))
        //.pipe(uglify())
        .pipe(gulp.dest("build"));
});

gulp.task('html', function () {
    gulp.src(paths.html)
        .pipe(gulp.dest("build"));
});

gulp.task('media', function () {
    gulp.src(paths.media)
        .pipe(gulp.dest("build/media"));
});

gulp.task('watchdog', function () {
    gulp.watch(paths.script, ['script']);
    gulp.watch(paths.media, ['media']);
    gulp.watch(paths.html, ['html']);
});

gulp.task("watch", ["script", "html", "media", "watchdog"]);
gulp.task("prod", ["script", "html", "media", "uglify"]);
gulp.task("default", ["script", "html", "media"]);
