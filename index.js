'use strict';

var path = require('path');

var ngAnnotate = require('ng-annotate');

var sourceMap = require('source-map');
var convertSourceMap = require('convert-source-map');

var SourceMapGenerator = sourceMap.SourceMapGenerator;
var SourceMapConsumer = sourceMap.SourceMapConsumer;


function factory(logger, basePath) {
    var log = logger.create('preprocessor.ng-annotate');

    return function (content, file, done) {
        var result = ngAnnotate( content, {
            add: true,
            'single_quotes': true,
            map: {inline: false}
        });


        var sourceRelativePath = path.relative(basePath, file.path);

        var existingSourceMapResult = convertSourceMap.fromSource(content);

        var sourceMapJSON = result.map;

        if (existingSourceMapResult) {
            sourceMapJSON = mergeSourceMap(sourceRelativePath, existingSourceMapResult.toJSON(), sourceMapJSON);
        }

        done(null, result.src + '\n' + convertSourceMap.fromJSON(sourceMapJSON).toComment());
    };


    function mergeSourceMap(sourceRelativePath, inputSourceMapJSON, sourceMapJSON) {
        var generator = SourceMapGenerator.fromSourceMap(new SourceMapConsumer(inputSourceMapJSON));

        var sourceMap = JSON.parse(sourceMapJSON);
        sourceMap.file = sourceRelativePath;

        generator.applySourceMap(new SourceMapConsumer(sourceMap));

        return generator.toString();
    }
}

factory.$inject = ['logger', 'config.basePath'];

module.exports = {
    'preprocessor:ng-annotate': ['factory', factory]
};
