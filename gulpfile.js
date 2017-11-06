var gulp = require('gulp');
var sass = require('gulp-sass');


gulp.task('sass', function() {
	return gulp.src('src/assets/scss/main.scss')
	.pipe(sass())
	.pipe(gulp.dest('dist/assets/_styles'))
})
