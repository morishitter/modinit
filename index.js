
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var mkdirp = require('mkdirp');

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
    "testfw": res.testfw,
    "travis": travis,
    "readme": res.readme,
    "license": res.license
  };
};

Modinit.prototype.template = function (prompt, modinitrc, result, options) {
  /*
  var templatePath;
  module.paths.some(function (gmp) {
    console.log(path.join(gmp, 'modinit/template'))
    fs.exists(path.join(gmp, 'modinit/template'), function (exist) {
      if (exist) {
        console.log("aaaaaaaaaaa")
        templatePath = path.join(gmp, 'modinit/template');
        return false;
      }
    })
  });
  console.log(templatePath)
  */
  var templatePath = '/usr/local/lib/node_modules/modinit/template';

  var readme = _.template(fs.readFileSync(templatePath + '/readme.markdown').toString());
  var _package = _.template(fs.readFileSync(templatePath + '/_package.json').toString());
  var license = _.template(fs.readFileSync(templatePath + '/LICENSE').toString());
  var cmd = _.template(fs.readFileSync(templatePath + '/cmd.js').toString());
  var test = _.template(fs.readFileSync(templatePath + '/test.js').toString());
  var _index = fs.readFileSync(templatePath + '/_index.js').toString();
  var travis = fs.readFileSync(templatePath + '/travis.yml').toString();
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
  if (options.bin) package_obj['cmd'] = true;
  else package_obj['cmd'] = false;

  _package = _package(package_obj);

  license = license({
    'author': modinitrc.author
  });

  cmd = cmd({
    'moduleName': moduleVarName
  });

  test = test({
    'testfw': modinitrc.testfw,
    'moduleName': moduleVarName
  });

  var res = {};
  res.readme = readme;
  res.readmeStyle = modinitrc.readme;
  res._package = _package;
  res.license = license;
  res._index = _index;
  res.gitignore = gitignore;
  res.test = test;
  res.moduleName = moduleName;
  res.moduleVarName = moduleVarName;
  if (options.bin) res.cmd = cmd;
  if (modinitrc.travis) res.travis = travis;

  return res;
};

Modinit.prototype.build = function (templates) {
  mkdirp(templates.moduleName, function (err) {
    if (err) throw err;
  });

  if (templates.cmd) {
    mkdirp(templates.moduleName + '/bin', function (err) {
      if (err) throw err;
    });
  }

  mkdirp(templates.moduleName + '/test', function (err) {
    if (err) throw err;
  });


  fs.writeFile(templates.moduleName + '/index.js', templates._index, function (err) {
    if (err) throw err;
  });

  fs.writeFile(templates.moduleName + '/test/test.js', templates.test, function (err) {
    if (err) throw err;
  });

  fs.writeFile(templates.moduleName + '/' + templates.readmeStyle, templates.readme, function (err) {
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

  if (templates.cmd) {
    fs.writeFile(templates.moduleName + '/bin/' + templates.moduleName, templates.cmd, function (err) {
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
