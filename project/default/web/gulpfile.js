var gulp = require('gulp'),
    connect = require('gulp-connect'),
    proxy = require('http-proxy-middleware'),
    minimist = require('minimist');

var defaultOptions = {
    default: {
        serverUrl: 'http://127.0.0.1:8081',
        connectPort: 8000,
        livereloadPort: 35729,
        app: 'app/',
        output: 'app/',
    }
};

var options = minimist(process.argv.slice(2), defaultOptions);
var baseFolder = options.app;
var paths = {
  js: [baseFolder + 'scripts/**/*.js'],
  css: [baseFolder + 'styles/**/*.css'],
  html: [
    baseFolder + 'views/**/*.html',
    baseFolder + 'index.html'
  ]
};

gulp.task('watch', function() {
  gulp.watch([paths.js, paths.css, paths.html], ['reload']);
});

gulp.task('reload', function() {
    gulp.src(baseFolder + '**')
        .pipe(connect.reload());
});

gulp.task('default', ['watch', 'connect']);

gulp.task('serve', ['watch', 'connect']);

gulp.task('connect', function() {
    connect.server({
        root: ['.'],
        port: options.connectPort,
        livereload: {
            port: options.livereloadPort
        },
        middleware: function(conn, opt) {
            return [
                proxy('!/app/**', {
                    target: options.serverUrl,
                    changeOrigin: false,
                    ws: true
                })
            ];
        }
    });
});