var _ = require("lodash")

exports.get = function(req, scope, cb) {
  if(_.isFunction(scope)) {
    if(scope.length === 2) return scope(req, cb)
    else cb(scope(req))
  } else cb(scope)
}
