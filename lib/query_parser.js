var _ = require('lodash')

var parse = exports.parse = function(query, regexes) {
  var queryObj = _.isObject(query) ? query : JSON.parse(query)

  return _.transform(queryObj, function(memo, v, k) {
    if(k === '$like')
      _.extend(memo, parse(v, true))
    else if(_.isObject(v))
      memo[k] = parse(v, !!regexes)
    else {
      memo[k] = !!regexes ? new RegExp(v, "i") : v
    }
  })
}
