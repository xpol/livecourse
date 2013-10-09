var fs = require('fs')
var branches = JSON.parse(fs.readFileSync('db/branches/all.json'))

exports.index = function(req, res){
  res.render('branches', { path:'/branches', all:branches.all });
};
