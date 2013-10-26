
/*
 * GET home page.
 */

exports.index = function(req, res, next) {
    db.get("SELECT COUNT(*) as num FROM Musee", function(err, result) {
        if(err) return next(err);
        res.render('index', { title: "AlloMusée - " + result.num + " musées" });
    });
};
