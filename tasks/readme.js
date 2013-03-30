
/*jslint browser:true, node:true*/

/**
 * grunt-json
 * https://github.com/wilsonpage/grunt-json
 *
 * Copyright (c) 2012 Wilson Page
 * Licensed under the MIT license.
 */

"use strict";

/**
 * Module Dependencies
 */

var dox = require('dox');
var fs = require('fs');
var hogan = require('hogan.js');
var pkg = require('../package');
var util = require('util');

/**
 * Exports
 */

module.exports = function (grunt) {

  // Please see the grunt documentation for more information regarding task and
  // helper creation: https://github.com/gruntjs/grunt/blob/master/docs/toc.md

  // ==========================================================================
  // TASKS
  // ==========================================================================

  grunt.registerMultiTask('readme', 'Building README', function () {
    var data = this.data;
    var files = this.files;

    this.files.forEach(function(file) {
      var src = grunt.file.read(file.src);
      var json = dox.parseComments(src, { raw: true });
      var templates = {};

      templates.docs = hogan.compile(fs.readFileSync('docs/template.hogan', 'utf8'));
      templates.readme = hogan.compile(fs.readFileSync('docs/readme.hogan', 'utf8'));

      json = preProcess(json);

      var docs = templates.docs.render({ items: json });
      var readme = templates.readme.render({ pkg: pkg, docs: docs });

      grunt.file.write(file.dest, readme);
    });
  });
};


function preProcess(json) {

  // Filter out private API
  json = json.filter(function(item) {
    return item.ctx && item.isPrivate === false;
  });

  // Remove line breaks
  json.forEach(function(item) {
    if (item.description.summary) {
      item.description.summary = item.description.summary.replace(/<br \/>/g, ' ');
    }

    if (item.description.body) {
      item.description.body = item.description.body
        .replace(/  /g, '    ')
        .replace(/Example:/g, '*Example:*');
    }
  });

  return json;
}