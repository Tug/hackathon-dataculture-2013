
/*
 * GET users listing.
 */

exports.list = function(req, res, err) {
    db.all("SELECT * FROM Musee WHERE latitude!='' AND longitude!=''", function(err, result) {
        if(err) return next(err);
        res.json(result);
    });
};