'use strict';

const shelljs = require('shelljs'),
	through2 = require('through2');

/**
 * Utils
 */

const getHash = (verbosity) => {
	let hash = shelljs.exec('git describe --dirty', {silent: true}).stdout;
	hash = hash || shelljs.exec('git rev-parse HEAD', {silent: true}).stdout;
	hash = hash.match(/[^\-\n]+/g).splice(0, verbosity).join('-');
	return hash;
};

const getDate = (verbosity) => {
	let date = shelljs.exec('git show -s --format=%ci', {silent: true}).stdout;
	date = date || shelljs.exec('date +"%F %T %z"', {silent: true}).stdout;
	date = date.match(/[^\s\n]+/g).splice(0, verbosity).join(' ');
	return date;
};

const getName = (path, hash) => {
	let name = path;
	name = name.match(/([^\/]+)\.([^\.]+)/);
	name = [`${name[1]}.${name[2]}`, `${name[1]}.${hash}.${name[2]}`];
	return name;
};

const getRegx = (path, flag) => {
	let regx = path;
	regx = regx.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	regx = new RegExp(regx, flag);
	return regx;
};

const isUtf8 = (buffer) => {
	let n, byte;
	for (let i = 0; i < buffer.length; i ++) {
		byte = buffer[i];
		// 1 byte sequence
		if (!n && !(byte & 0x80 ^ 0x00)) {n = 0; continue;}
		// n byte sequence
		if (+n && !(byte & 0xc0 ^ 0x80)) {n --; continue;}
		// 2 byte sequence
		if (!n && !(byte & 0xe0 ^ 0xc0)) {n = 1; continue;}
		// 3 byte sequence
		if (!n && !(byte & 0xf0 ^ 0xe0)) {n = 2; continue;}
		// 4 byte sequence
		if (!n && !(byte & 0xf8 ^ 0xf0)) {n = 3; continue;}
		// invalid UTF-8
		return false;
	}
	// valid UTF-8
	return true;
};

/**
 * Parse
 */

const parse = (files, opts) => {
	let hash = getHash(opts.hashVerbosity),
		date = getDate(opts.dateVerbosity);
	// convert
	for (let a = 0; a < files.length; a ++) {
		let fa = files[a];
		if (!fa.path.match(opts.dontParse) && isUtf8(fa.contents)) {
			fa.revData = fa.contents.toString();
		}
		if (!fa.path.match(opts.dontRemap)) {
			fa.revPath = fa.path;
		}
	}
	// file a
	for (let a = 0; a < files.length; a ++) {
		let fa = files[a];
		// remap name
		if (!fa.path.match(opts.dontRemap) && fa.revPath) {
			let name = getName(fa.path, hash);
			fa.revPath = fa.revPath.replace(getRegx(name[0], 'g'), name[1]);
			// file b
			for (let b = 0; b < files.length; b ++) {
				let fb = files[b];
				// remap refs
				if (!fb.path.match(opts.dontParse) && fb.revData) {
					let name = getName(fa.path, hash);
					fb.revData = fb.revData.replace(getRegx(name[0], 'g'), name[1]);
				}
			}
		}
		// label
		if (!fa.path.match(opts.dontParse) && fa.revData) {
			// label hash
			if (opts.hashLabel) {
				fa.revData = fa.revData.replace(opts.hashLabel, hash);
			}
			// label date
			if (opts.dateLabel) {
				fa.revData = fa.revData.replace(opts.dateLabel, date);
			}
		}
	}
	// convert
	for (let a = 0; a < files.length; a ++) {
		let fa = files[a];
		if (!fa.path.match(opts.dontParse) && isUtf8(fa.contents)) {
			fa.contents = new Buffer(fa.revData);
		}
		if (!fa.path.match(opts.dontRemap)) {
			fa.path = fa.revPath;
		}
	}
};

/**
 * Plugs
 */

module.exports = (opts) => {
	let base, files = [];
	base = {
		dontTouch: false,
		dontRemap: false,
		dontParse: false,
		hashLabel: false,
		hashVerbosity: 4,
		dateLabel: false,
		dateVerbosity: 4
	};
	for (let key in base) {
		opts[key] = opts[key] || base[key];
	}
	return through2.obj(
		function (file, en, cb) {
			if (!file.path.match(opts.dontTouch)) {
				files.push(file);
			}
			cb();
		},
		function (cb) {
			parse(files, opts);
			for (let i = 0; i < files.length; i ++) {
				this.push(files[i]);
			}
			cb();
		}
	);
};
