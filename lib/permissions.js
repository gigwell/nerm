var _ = require('lodash'),
    flatten = require('flat')

exports.buildDeselectList = function(paths) {
  var res = _.reduce(paths, function(memo, val, key) {
    if(val.options.nerm && val.options.nerm.private)
      memo.push(key)

    return memo
  }, [])
  return res;
}

exports.buildSelectString = function(deselectList) {
  return _.map(deselectList, function(i) { return '-' + i }).join(' ')
}

exports.addSelectFilter = function(query, hasAccess, selectString) {
  return hasAccess ? query : query.select(selectString)
}

exports.allPublic = function(obj, deselectList) {
  if(!_.isArray(obj)) obj = [obj]

  return _.all(obj, function(o) {
    var modifyList = _.keys(flatten(o))
    return _.intersection(modifyList, deselectList).length === 0
  })
}

