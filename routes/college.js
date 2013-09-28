var fs = require('fs')
var colleges = JSON.parse(fs.readFileSync('db/colleges/all.json'))



/*
 * GET colleges listing.
 */

exports.index = function(req, res){
  res.render('colleges', { path: '/colleges', all:colleges.all });
};

/*
 * 
 */
