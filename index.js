var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var config = require('node-prefix');
var nodePrefix = config.prefix();
var globalModulePath = config.global('modinit');

module.exports = Modinit;

function Modinit () {
    if (!(this instanceof Modinit)) return new Modinit();
}

Modinit.prototype.create = function (res) {
    if (res.travis === "Y") var travis = true;
    else var travis = false;

    return {
        "github": res.github,
        "author": res.author,
        "mail": res.mail,
        "travis": travis,
        "readme": res.readme,
        "changelog": res.changelog,
        "license": res.license
    };
};

Modinit.prototype.template = function (prompt, modinitrc, result, options) {
    var templatePath = globalModulePath + '/template';

    var readme = _.template(fs.readFileSync(templatePath + '/readme.markdown').toString());
    var changelog = _.template(fs.readFileSync(templatePath + '/changelog.markdown').toString());
    var _package = _.template(fs.readFileSync(templatePath + '/_package.json').toString());
    var license = _.template(fs.readFileSync(templatePath + '/license').toString());
    var cli = _.template(fs.readFileSync(templatePath + '/cli.js').toString());
    var test = _.template(fs.readFileSync(templatePath + '/test.js').toString());
    var _index = fs.readFileSync(templatePath + '/_index.js').toString();
    var travis = fs.readFileSync(templatePath + '/travis.yml').toString();
    var editorconfig = fs.readFileSync(templatePath + '/editorconfig').toString();
    var gitignore = fs.readFileSync(templatePath + '/gitignore').toString();

    var moduleName = prompt.moduleName;
    var moduleVarName = prompt.moduleName;

    var keywords = function (val) {
        return val.split(',').map(function (v) {
            return v.trim();
        }).filter(function (v) {
            return v.length > 0;
        });
    }(result['keywords']);

    readme = readme({
        'moduleName': moduleName,
        'description': prompt.description,
        'github': modinitrc.github,
        'author': modinitrc.author
    });

    var package_obj = {
        'moduleName': moduleName,
        'description': prompt.description,
        'github': modinitrc.github,
        'author': modinitrc.author,
        'keywords': keywords
    };
    if (options.bin) package_obj['cli'] = true;
    else package_obj['cli'] = false;

    _package = _package(package_obj);

    license = license({
        'author': modinitrc.author
    });

    cli = cli({
        'moduleName': moduleVarName
    });

    test = test({
        'moduleName': moduleVarName
    });

    var res = {};
    res.readme = readme;
    res.readmeStyle = modinitrc.readme;
    res.changelog = changelog;
    res.changelogStyle = modinitrc.changelog;
    res._package = _package;
    res.license = license;
    res._index = _index;
    res.gitignore = gitignore;
    res.editorconfig = editorconfig;
    res.test = test;
    res.moduleName = moduleName;
    res.moduleVarName = moduleVarName;
    if (options.bin) res.cli = cli;
    if (modinitrc.travis) res.travis = travis;

    return res;
};

Modinit.prototype.build = function (templates) {
    mkdirp(templates.moduleName, function (err) {
        if (err) throw err;
    });

    mkdirp(templates.moduleName + '/test', function (err) {
        if (err) throw err;
    });


    fs.writeFile(templates.moduleName + '/index.js', templates._index, function (err) {
        if (err) throw err;
    });

    fs.writeFile(templates.moduleName + '/test/index.js', templates.test, function (err) {
        if (err) throw err;
    });

    fs.writeFile(templates.moduleName + '/' + templates.readmeStyle, templates.readme, function (err) {
        if (err) throw err;
    });

    fs.writeFile(templates.moduleName + '/' + templates.changelogStyle, templates.changelog, function (err) {
        if (err) throw err;
    });

    fs.writeFile(templates.moduleName + '/.gitignore', templates.gitignore, function (err) {
        if (err) throw err;
    });

    fs.writeFile(templates.moduleName + '/LICENSE', templates.license, function (err) {
        if (err) throw err;
    });

    fs.writeFile(templates.moduleName + '/package.json', templates._package, function (err) {
        if (err) throw err;
    });

    fs.writeFile(templates.moduleName + '/.editorconfig', templates.editorconfig, function (err) {
        if (err) throw err;
    });

    if (templates.cli) {
        fs.writeFile(templates.moduleName + '/cli.js', templates.cli, function (err) {
            if (err) throw err;
        });
    }

    if (templates.travis) {
        fs.writeFile(templates.moduleName + '/.travis.yml', templates.travis, function (err) {
            if (err) throw err;
        });
    }

    return true;
};

Modinit.prototype.rename = function (afterModName) {
    var beforeModName = path.basename(process.cwd());
    var BeforeModName = beforeModName.charAt(0).toUpperCase() + beforeModName.slice(1);
    var AfterModName = afterModName.charAt(0).toUpperCase() + afterModName.slice(1);

    changeFiles = [
        './package.json',
        './readme.markdown',
        './test/index.js',
        './index.js'
    ];

    changeFiles.forEach(function (changeFile) {
        var fileStr = fs.readFileSync(changeFile).toString();
        var renamed = fileStr.replace(new RegExp(beforeModName, 'g'), afterModName);
        renamed = renamed.replace(new RegExp(BeforeModName, 'g'), AfterModName);

        fs.writeFile(changeFile, renamed, function (err) {
            if (err) throw err;
        });
    });

    console.log("Renamed to " + afterModName);
};
