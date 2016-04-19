var _ = require('lodash')

var parse = exports.parse = function(query, regexes, dates) {
  var queryObj = _.isObject(query) ? query : JSON.parse(query)

  return _.transform(queryObj, function(memo, v, k) {
    if(k === '$like')
      _.extend(memo, parse(v, true, false))
    else if(k === '$date') {
      _.extend(memo, parse(v, false, true))
    }
    else if(_.isObject(v))
      memo[k] = parse(v, !!regexes, !!dates)
    else {
      if (!!regexes)
        memo[k] = new RegExp(v, "i")
      else if (!!dates) {
        memo[k] = new Date(v)
      }
      else
        memo[k] = v
    }
  })
}
