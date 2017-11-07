var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var babel = require('gulp-babel');
var webpack = require('webpack');
var webpackStream = require('webpack-stream');
var webpackConfig = require('./webpack.config.js');

// Tasks
gulp.task('sass', function() {
	return gulp.src('src/assets/scss/main.scss')
	.pipe(sass())
	.pipe(gulp.dest('dist/assets/_styles'))
	.pipe(browserSync.reload({
		stream: true,
	}));
});

gulp.task('js', function() {
	return gulp.src('src/assets/js/main.js')
	.pipe(webpackStream(webpackConfig), webpack)
	.pipe(babel())
	.pipe(gulp.dest('dist/assets/_js'));
})

gulp.task('img', function() {
	return gulp.src(['src/assets/img/**/*.jpg', 'src/assets/img/**/*.jpeg', 'src/assets/img/**/*.png', 'src/assets/img/**/*.gif'])
	.pipe(gulp.dest('dist/assets/_img'));
})

gulp.task('watch', ['browserSync', 'img', 'sass', 'js'], function() {
	gulp.watch('src/assets/img/**/*{jpg,jpeg,png,gif}', ['img']);
	gulp.watch('src/assets/scss/**/*.scss', ['sass']);
	gulp.watch('*.html', browserSync.reload);
	gulp.watch('src/assets/js/**/*.js', ['js']);
	gulp.watch('src/assets/js/**/*.js', browserSync.reload);
});


// Browser Sync
gulp.task('browserSync', function() {
	browserSync.init({
		server: {
			baseDir: './'
		},
	});
});
