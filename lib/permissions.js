var _ = require('lodash'),
    flatten = require('flat')

exports.getPathsWithOption = function(paths, option) {
  var res = _.reduce(paths, function(memo, val, key) {
    if(_.isArray(val.options.type)){
      var anyWithOption = _.any(val.options.type, function(t) {
        return _.get(t, 'nerm.' + option)
      })

      if(anyWithOption) memo.push(key)
    }
    else if(_.get(val, 'options.nerm.' + option))
      memo.push(key)

    return memo
  }, [])
  return res;
}

exports.buildSelectString = function(deselectList) {
  return _.map(deselectList, function(i) { return '-' + i })
    .join(' ')
}

exports.containsFields = function(obj, deselectList) {
  var objArray = obj
  if(!_.isArray(obj)) objArray = [obj]

  return _.any(objArray, function(o) {
    var modifyList = _.keys(flatten(_.cloneDeep(o)))
    return _.intersection(modifyList, deselectList).length !== 0
  })
}

exports.allFieldsPermitted = function(fields, forbidden) {
  fields = _.map(fields, function(v) {
    return v[0] === '+' || v[0] === '-' ? v.substring(1) : v
  })
  return _.intersection(fields, forbidden).length === 0
}
