var _ = require('lodash'),
    inflection = require('inflection'),
    Parser = require('./query_parser'),
    Permissions = require('./permissions'),
    async = require('async')

_.mixin(require('underscore.string').exports())

var defaultOpts = {
  middleware: [],
  privateAccess: function() { return false }
}

var queryDefaults = {
  q: "{}",
  populate: "",
  select: "",
  sort: ""
}

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
      return res.status(500).send({msg: arguments[0].message});

    [].shift.apply(arguments)
    fn.apply(fn, arguments)
  }
}

function sendResults(name, res, includeEnvelope) {
  return errHandler(res, function(contents) {
    var body = includeEnvelope ?
      _.set({}, name, contents) :
      contents
    res.send(body)
  })
}

function parseOptions() {
  return function(req, res, next) {
    req.nerm = {}
    if(!!req.query.resEnvelope)
      req.nerm.resEnvelope = JSON.parse(req.query.resEnvelope)
    else {
      _.defaults(req.body, {resEnvelope: true})
      req.nerm.resEnvelope = req.body.resEnvelope
    }

    if(!!req.query) {
      _.defaults(req.query, queryDefaults)
    }
    next()
  }
}

function saveAndSelect(model, item, hasAccess, select, cb) {
  var doc = !!item._doc ? item : new model(item)
  async.waterfall([
    function(next) { doc.save(next) },
    function(doc, count, next) {
      var query = model.findById(doc._id)
      Permissions.addSelectFilter(query, hasAccess, select)
        .exec(next)
    }
  ], cb)
}

exports.route = function(router, model, options) {
  var prefix = '/api/v0/',
      singularName = model.modelName.toLowerCase(),
      pluralName = inflection.pluralize(singularName),
      manyUrl = prefix + pluralName,
      singleUrl = manyUrl + '/:id',
      deselectList = Permissions.buildDeselectList(model.schema.paths)

  options = options || {}
  _.defaults(options, defaultOpts)
  if (!_.isArray(options.middleware)) options.middleware = [options.middleware]

  options.middleware.push(parseOptions(options))
  router.use(manyUrl, options.middleware)
  router.use(singleUrl, options.middleware)

  // GET many
  router.get(manyUrl, function(req, res) {
    var selectList = req.query.select.split(' '),
        select = Permissions.buildSelectString(deselectList, selectList),
        hasAccess = options.privateAccess(req),
        filter = Parser.parse(req.query.q),
        query = model.find(filter)
          .populate(req.query.populate)
          .sort(req.query.sort)

    var validQuery = Permissions.allFieldsPermitted(selectList, deselectList) &&
      Permissions.allPublic(filter, deselectList)

    if(!hasAccess && !validQuery)
      return res.status(401).send({
        msg: "Unauthorized attempt to access private field"
      })

    Permissions.addSelectFilter(query, hasAccess, select)
      .exec(sendResults(pluralName, res, req.nerm.resEnvelope))
  })

  // GET single
  router.get(singleUrl, function(req, res) {
    var selectList = req.query.select.split(' '),
        select = Permissions.buildSelectString(deselectList, selectList),
        hasAccess = options.privateAccess(req),
        query = model.findById(req.params.id)
          .populate(req.query.populate)

    if(!hasAccess && !Permissions.allFieldsPermitted(selectList, deselectList))
      return res.status(401).send({
        msg: "Unauthorized attempt to access private field"
      })

    Permissions.addSelectFilter(query, hasAccess, select)
      .exec(sendResults(singularName, res, req.nerm.resEnvelope))
  })

  // POST single
  router.post(singleUrl, function(req, res) {
    res.status(400).send({msg: "Found an ID in a POST url"})
  })

  // POST many
  router.post(manyUrl, function(req, res) {
    var select = Permissions.buildSelectString(deselectList),
        hasAccess = options.privateAccess(req),
        name = getName(singularName, pluralName, req.body)

    if(!name) return res.status(400).send({msg: "Malformed Envelope"})
    if(!hasAccess && !Permissions.allPublic(req.body[name], deselectList))
      return res.status(401).send({
        msg: "Unauthorized attempt to access private field"
      })

    if (_.isArray(req.body[name])) {
      async.map(req.body[name], function(i, next) {
        saveAndSelect(model, i, hasAccess, select, next)
      }, sendResults(name, res, req.nerm.resEnvelope))
    } else {
      saveAndSelect(model, req.body[name], hasAccess,
        select, sendResults(name, res, req.nerm.resEnvelope))
    }
  })

  // PUT many
  router.put(manyUrl, function(req, res) {
    res.status(400).send({msg: "Missing ID in a PUT url"})
  })

  // PUT single
  router.put(singleUrl, function(req, res) {
    var select = Permissions.buildSelectString(deselectList),
        hasAccess = options.privateAccess(req)
        contents = req.body[singularName]

    if(!hasAccess && !Permissions.allPublic(contents, deselectList))
      return res.status(401).send({
        msg: "Unauthorized attempt to access private field"
      })

    model.findById(req.params.id).exec(errHandler(res, function(doc) {
      _.extend(doc, contents)

      saveAndSelect(model, doc, hasAccess, select,
        sendResults(singularName, res, req.nerm.resEnvelope))
    }))
  })

  // DELETE many
  router.delete(manyUrl, function(req, res) {
    res.status(400).send({msg: "Missing ID in a DELETE url"})
  })

  // DELETE single
  router.delete(singleUrl, function(req, res) {
    model.remove({_id: req.params.id})
      .exec(errHandler(res, function(){
        res.send()
      }))
  })
}
