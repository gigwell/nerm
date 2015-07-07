var _ = require('lodash'),
    inflection = require('inflection'),
    async = require('async')

_.mixin(require('underscore.string').exports())

function getName(singular, plural, body) {
  if(body[singular])
    return singular
  else if(body[plural])
    return plural
  else
    return;
}

// This returs a FN that assumes that the first argument
// passed to it will be the error arg. If it is present
// it sends a 500, otherwise it strips the err out of the arg array
// and passes the rest of the args along to the callback provided
function errHandler(res, fn) {
  return function() {
    if(arguments[0])
      return res.status(500).send({mdg: arguments[0].message});

    [].shift.apply(arguments)
    fn.apply(fn, arguments)
  }
}

function sendResults(name, res) {
  return errHandler(res, function(contents) {
    var body = _.set({}, name, contents)
    res.send(body)
  })
}

exports.route = function(router, model, options) {
  var prefix = '/api/v0/',
      singularName = model.modelName.toLowerCase(),
      pluralName = inflection.pluralize(singularName),
      manyUrl = prefix + pluralName,
      singleUrl = manyUrl + '/:id'

  options = options || {}
  _.defaults(options, { middleware: null })

  if (!!options.middleware) router.use(options.middleware)

  router.get(manyUrl, function(req, res) {
    var query = JSON.parse(req.query.q || "{}")
    model.find(query).lean()
      .exec(sendResults(pluralName, res))
  })

  router.get(singleUrl, function(req, res) {
    model.findById(req.params.id).lean()
      .exec(sendResults(singularName, res))
  })

  router.post(singleUrl, function(req, res) {
    res.status(400).send({msg: "Found an ID in a POST url"})
  })

  router.post(manyUrl, function(req, res) {
    var name = getName(singularName, pluralName, req.body)
    if(!name) return res.status(400).send({msg: "Malformed Envelope"})

    if (_.isArray(req.body[name])) {
      async.map(req.body[name], function(i, next) {
        var item = new model(i)
        item.save(next)
      }, sendResults(name, res))
    } else {
      var item = new model(req.body[name])
      item.save(sendResults(name, res))
    }
  })

  router.put(manyUrl, function(req, res) {
    res.status(400).send({msg: "Missing ID in a PUT url"})
  })

  router.del(manyUrl, function(req, res) {
    res.status(400).send({msg: "Missing ID in a DELETE url"})
  })

  router.put(singleUrl, function(req, res) {
    model.findById(req.params.id).exec(errHandler(res, function(doc) {
      _.extend(doc, req.body[singularName])
      doc.save(sendResults(singularName, res))
    }))
  })

  router.delete(singleUrl, function(req, res) {
    model.remove({_id: req.params.id})
      .exec(errHandler(res, function(){
        res.send()
      }))
  })
}
