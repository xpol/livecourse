
/*
 * GET lessons listing.
 */

exports.index = function(req, res){
  res.render('lessons', { title: '课程' });
};

/*
 * 
 */
exports.view = function(req, res){
  res.send("lesson "+req.params.id)
  //res.render('lessons/view', { title: '课程' });
};

