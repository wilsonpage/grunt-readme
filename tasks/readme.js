
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
var hogan = require('hogan.js');

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
    var pkg = grunt.config.data.pkg;
    var data = this.data;
    var files = this.files;
    var options = this.options({
      comment: 'docs/item.hogan',
      readme: 'docs/readme.hogan'
    });

    this.files.forEach(function(file) {
      var src = grunt.file.read(file.src);
      var json = dox.parseComments(src, { raw: true });
      var templates = {};

      templates.docs = hogan.compile(grunt.file.read(options.comment));
      templates.readme = hogan.compile(grunt.file.read(options.readme));

      json = preProcess(json);

      var docs = templates.docs.render({ items: json });
      var readme = templates.readme.render({ pkg: pkg, docs: docs });

      grunt.file.write(file.dest, readme);
      grunt.log.writeln('Written "' + file.dest + '" with ' + json.length + ' comments');
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