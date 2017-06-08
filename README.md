# Rev-Tree

> Reliable filename revisioning

Rev-Tree revisions filenames using a hash of the entire source tree, this approach simplifies reference updating which only needs to match filenames. Usually filename revisioning applies a hash of each file to itself, this approach greatly complicates reference updating with matching full file paths.

A per file hash requires full path matching for file differentiation and revision propagation. This is burdened by language specific path normalisation and dynamically built paths, solutions are always incomplete and highly error prone. These problems are avoided when all files use the same revision hash.

## Install

```sh
npm install --save rev-tree
```

## Caveats

From a browser caching perspective, Rev-Tree is like dropping a nuke on a tree instead of firing an arrow at a branch. It's 100% reliable, but the browser will need to get a whole new tree instead of growing a few new branches.

Language agnostic, filename based reference updating increases the probability of false positives. Be mindful of very short names and what effect matching unrelated code might have. Extension-less names are particularly dangerous.

## Usage

Basic usage with [Gulp](//github.com/gulpjs/gulp):

```js
const gulp = require('gulp');
const revTree = require('rev-tree');

gulp.task('Revision', () => gulp.src('src/**/*')
	.pipe(revTree({
		dontRemap: /index[.]html/
	}))
	.pipe(gulp.dest('dist'));
);
```

Basic usage with [Gurt](//github.com/learningscience/gurt):

```js
const revTree = require('rev-tree');

module.exports['Revision'] = (stream) => stream
	.pipe(revTree({
		dontRemap: /index[.]html/
	}));
```

## API

### revTree([options])

#### options.hashLabel
Type: `String`, `RegExp`

Replace matching strings with hash. (Add a hash label to your content).

#### options.hashVerbosity
Type: `Number`

Specify level of hash detail. The hash is derived from git describe:
`[ last-tag, commits-since, commit-hash, dirty? ]`

#### options.dateLabel
Type: `String`, `RegExp`

Replace matching strings with date. (Add a date label to your content).

#### options.dateVerbosity
Type: `Number`

Specify level of date detail. The date is derived from git commit:
`[ commit-date, commit-time, commit-time offset ]`

#### options.dontTouch
Type: `String`, `RegExp`

Exclude matching paths (pass through untouched).

#### options.dontRemap
Type: `String`, `RegExp`

Exclude matching paths from being renamed.

#### options.dontParse
Type: `String`, `RegExp`

Exclude matching paths from being searched.

## Contribute

Suggestions and contributions will be considered. When crafting a pull request please consider if your contribution is a good fit with the project, follow contribution best practices and use the github "flow" workflow.

## License

[The MIT License](LICENSE.md)
