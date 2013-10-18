var fs = require('fs')
var path = require('path')
var colleges = JSON.parse(fs.readFileSync(path.join(__dirname,'../db/colleges/all.json')))



/*
 * GET colleges listing.
 */

exports.index = function(req, res){
  res.render('colleges', { path: '/colleges', all:colleges.all });
};

/*
 * 
 */
