/// <reference path="./typings/tsd.d.ts"/>

import * as gulp from 'gulp';
import * as ts from 'gulp-typescript';
import * as concat from 'gulp-concat';
import * as runSequence from 'run-sequence';

import mocha = require('gulp-mocha');
import watch = require('gulp-watch');

function tsProjectFactory(module, target?):ts.Project {
  var config = require('./tsconfig.json').compilerOptions;
  config.module = module || config.module;
  config.target = target || config.target;
  var tsProject = ts.createProject(config);
  return tsProject;
}

function registerTransformLibTask(type, module?) {
  let name = `transform:${type}`;
  gulp.task(name, () => {
    'use strict';
    let tsresult = gulp
      .src([`./${type}/**/*.ts`])
      .pipe(ts(tsProjectFactory(module)));
    return tsresult.js.pipe(gulp.dest(`./dist/${type}/`))
  });
  return name;
}

let transforms = [
  registerTransformLibTask('lib', 'umd')
];

let testTransform:string[] = [
  registerTransformLibTask('test')
];

gulp.task('generate:dts', () => {
  'use strict';
  gulp.src('./lib/**/*.ts')
    .pipe(gulp.dest('temp'));
  let tsresult = gulp.src('./temp/**/*.ts')
    .pipe(ts(tsProjectFactory('commonjs')));

  return tsresult.dts.pipe(gulp.dest('./temp'))
});

gulp.task('build:dev', transforms, () => {
  'use strict';
  return gulp.src(['./dist/**/*.js'])
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch:lib', () => {
  'use strict';
  watch('./lib/**/*.ts', () => {
    gulp.start('build:dev');
  });
});

gulp.task('test', ['transform:test'], () => {
  return gulp.src(['./dist/test/**/*.spec.js'])
    .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('build', ['build:dev', 'transform:test']);

gulp.task('watch', () => {
  watch(['./lib/**/*.ts', './test/**/*.ts'], () => {
    runSequence('test');
  });
});
