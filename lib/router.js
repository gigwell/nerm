var _ = require('lodash'),
    inflection = require('inflection')

_.mixin(require('underscore.string').exports())

exports.route = function(router, model) {
  var prefix = '/api/v0/',
      pluralName = inflection.pluralize(model.modelName).toLowerCase(),
      getMany = prefix + pluralName
      getOne = getMany + '/:id'

  router.get(getMany, function(req, res) {
    model.find({}).lean().exec(function(err, docs) {
      var body = _.set({}, pluralName, docs)
      res.send(body)
    })
  })

  router.get(getOne, function(req, res) {
    model.findById(req.params.id).lean().exec(function(err, doc) {
      var body = _.set({}, model.modelName.toLowerCase(), doc)
      res.send(body)
    })
  })
}
