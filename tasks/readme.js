
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
var path = require('path');
var marked = require('marked');

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
    var codeFiles = this.data.code;
    var partialFiles = this.data.partials || [];
    var outputFiles = this.data.output;
    var partials = {};
    var data = {
      pkg: grunt.config.data.pkg,
      jsdoc: [],
      partials: {
        md: {},
        html: {}
      }
    };

    // Code
    codeFiles.forEach(function(file) {
      var path = ('object' === typeof file) ? file.path : file;
      var src = grunt.file.read(path);
      var jsdoc = dox.parseComments(src, { raw: true });

      jsdoc = preProcess(jsdoc, file);
      data.jsdoc = data.jsdoc.concat(jsdoc);
    });

    // Partials
    partialFiles.forEach(function(filepath){
      var src = grunt.file.read(filepath);
      var ext = path.extname(filepath);
      var name = path.basename(filepath, ext);

      data.partials.md[name] = hogan.compile(src).render(data);
      data.partials.html[name] = marked(data.partials.md[name]);
    });

    for (var src in outputFiles) {
      var dest = outputFiles[src];
      var ext = path.extname(dest);
      var template = hogan.compile(grunt.file.read(src));
      var output = template.render(data);

      grunt.file.write(dest, output);
      grunt.log.writeln('Written "' + dest);
    }
  });
};

function preProcess(jsdoc, options) {
  options = options || {};
  options.ctx = options.ctx || {};

  // Filter out private API
  jsdoc = jsdoc.filter(function(item) {
    return item.isPrivate === false;
  });

  // Remove line breaks
  jsdoc.forEach(function(item) {
    item.ctx = item.ctx || {};

    var ctx = {
      receiver: options.ctx.receiver || item.ctx.receiver,
      name: options.ctx.name || item.ctx.name,
      cons: options.ctx.cons || item.ctx.cons,
      type: options.ctx.type || item.ctx.type
    };

    item.title = createTitle(ctx);

    if (item.description.summary) {
      item.description.summary = item.description.summary.replace(/<br \/>/g, ' ');
    }

    if (item.description.body) {
      item.description.body = item.description.body
        .replace(/  /g, '    ')
        .replace(/Example:/g, '*Example:*');
    }
  });

  return jsdoc;
}

function createTitle(ctx) {
  var suffix = ctx.type === 'method' ? '()' : '';
  var title = ctx.cons
    ? ctx.cons + '#' + ctx.name
    : ctx.receiver + '.' + ctx.name;

  return title + suffix;
}