var fs = require('fs')
var path = require('path')
var branches = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/branches/all.json')))

exports.index = function(req, res){
  res.render('branches', { path:'/branches', all:branches.all });
};
