var _ = require('lodash'),
    inflection = require('inflection'),
    Parser = require('./query_parser'),
    Scope = require('./scope_getter'),
    Permissions = require('./permissions'),
    async = require('async')

_.mixin(require('underscore.string').exports())

var defaultOpts = {
  middleware: [],
  privateAccess: function() { return false },
  writeAccess: function() { return false },
  scope: {},
  version: 'v0'
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
  //console.log('nerm errHandler: return cb');
  return function() {
    if(arguments[0]) {
      return res.status(500).json({msg: arguments[0].message});
    }

    [].shift.apply(arguments)
    fn.apply(fn, arguments)
  }
}

function sendResults(name, res, includeEnvelope) {
  //console.log('nerm: sendResults');
  return errHandler(res, function(contents) {
    var body = includeEnvelope ?
      _.set({}, name, contents) :
      contents;
    //console.log('nerm: sendResults, res json body');
    res.json(body)
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
  //console.log('nerm: saveAndSelect')
  async.waterfall([
    function(next) {
      //console.log('nerm: doc save', { next });
      doc.save(next)
    },
    function(doc, next) {
      model.findById(doc._id)
        .select(!!hasAccess ? '' : select)
        .exec(next)
    }
  ], cb)
}

exports.defaults = function(options) {
  defaultOpts = _.defaults(options, defaultOpts)
}

exports.route = function(router, model, options) {
  options = options || {}
  _.defaults(options, defaultOpts)

  var prefix = _.sprintf('/api/%s/', defaultOpts.version),
      singularName = model.modelName.toLowerCase(),
      pluralName = inflection.pluralize(singularName),
      manyUrl = prefix + pluralName,
      singleUrl = manyUrl + '/:id',
      countUrl = manyUrl + '/count',
      paths = model.schema.paths,
      deselectList = Permissions.getPathsWithOption(paths, 'private'),
      readOnlyList = Permissions.getPathsWithOption(paths, 'readOnly')

  if (!_.isArray(options.middleware)) options.middleware = [options.middleware]

  options.middleware.push(parseOptions(options))

  // GET count
  router.get(countUrl, options.middleware, function(req, res) {
     var filter = _.extend(Parser.parse(req.query.q))

    Scope.get(req, options.scope, function(scope) {
      var query = model.find(filter)
        .and(scope)

      query.count(sendResults(`${pluralName}.count`, res,
            req.nerm.resEnvelope))
    })
  })

  // GET many
  router.get(manyUrl, options.middleware, function(req, res) {
    var selectList = req.query.select.split(' '),
        hasAccess = options.privateAccess(req),
        filter = _.extend(Parser.parse(req.query.q)),
        distinctField = req.query.distinct,
        distinct = !!req.query.distinct,
        limit = req.query.limit,
        skip = req.query.skip,
        selector = !hasAccess && _.isBlank(req.query.select) ?
          Permissions.buildSelectString(deselectList) :
          req.query.select

    var validQuery = Permissions.allFieldsPermitted(selectList, deselectList) &&
      !Permissions.containsFields(filter, deselectList)

    if(!hasAccess && !validQuery)
      return res.status(401).json({
        msg: "Unauthorized attempt to access private field"
      })

    Scope.get(req, options.scope, function(scope) {
      var query = null, resultName = pluralName;

      if(distinct) {
        query = model.distinct(distinctField, filter).and(scope)
        resultName = `${pluralName}.${distinctField}`
      } else {
        query = model.find(filter).and(scope)
        // chris.roberson: Ensure there is something to pass in
        // since an exception is raised with an empty string
        if (req.query.populate && req.query.populate.length) {
          query = query.populate(req.query.populate)
        }
        query = query.sort(req.query.sort).select(selector)
      }

      if (limit) query = query.limit(parseInt(limit))
      if (skip) query = query.skip(parseInt(skip))

      query.exec(sendResults(resultName, res, req.nerm.resEnvelope))
    })
  })

  // GET single
  router.get(singleUrl, options.middleware, function(req, res) {
    var hasAccess = options.privateAccess(req),
        selectList = req.query.select.split(' '),
        selector = !hasAccess && _.isBlank(req.query.select) ?
          Permissions.buildSelectString(deselectList) :
          req.query.select

    if(!hasAccess && !Permissions.allFieldsPermitted(selectList, deselectList))
      return res.status(401).json({
        msg: "Unauthorized attempt to access private field"
      })

    model.findById(req.params.id)
      .select(selector)
      .populate(req.query.populate)
      .exec(sendResults(singularName, res, req.nerm.resEnvelope))
  })

  // POST single
  router.post(singleUrl, function(req, res) {
    res.status(400).json({msg: "Found an ID in a POST url"})
  })

  // POST many
  router.post(manyUrl, options.middleware, function(req, res) {
    //console.log('nerm: POST MANY!');
    var select = Permissions.buildSelectString(deselectList),
        hasAccess = options.privateAccess(req),
        isWriter = options.writeAccess(req),
        name = getName(singularName, pluralName, req.body)

    if(!name) return res.status(400).json({msg: "Malformed Envelope"})
    if(!hasAccess && Permissions.containsFields(req.body[name], deselectList))
      return res.status(401).json({
        msg: "Unauthorized attempt to access private field"
      })

    if(!isWriter && Permissions.containsFields(req.body[name], readOnlyList))
      return res.status(401).json({
        msg: "Attempted to modify a read only field"
      })

    if (_.isArray(req.body[name])) {
      async.map(req.body[name], function(i, next) {
        saveAndSelect(model, i, hasAccess, select, next)
      }, sendResults(name, res, req.nerm.resEnvelope))
    } else {
      //console.log('nerm: save single result');
      saveAndSelect(model, req.body[name], hasAccess,
        select, sendResults(name, res, req.nerm.resEnvelope))
    }
  })

  // PUT many
  router.put(manyUrl, function(req, res) {
    res.status(400).json({msg: "Missing ID in a PUT url"})
  })

  // PUT single
  router.put(singleUrl, options.middleware, function(req, res) {
    var select = Permissions.buildSelectString(deselectList),
        hasAccess = options.privateAccess(req),
        isWriter = options.writeAccess(req),
        contents = req.body[singularName]

    if(!hasAccess && Permissions.containsFields(contents, deselectList))
      return res.status(401).json({
        msg: "Unauthorized attempt to access private field"
      })

    if(!isWriter && Permissions.containsFields(contents, readOnlyList))
      return res.status(401).json({
        msg: "Attempted to modify a read only field"
      })

    var selector = !!hasAccess ? '' : select

    model.findOneAndUpdate({_id: req.params.id}, contents, {
      select: selector,
      new: true
    }).exec(sendResults(singularName, res, req.nerm.resEnvelope))
  })

  // DELETE many
  router.delete(manyUrl, function(req, res) {
    res.status(400).json({msg: "Missing ID in a DELETE url"})
  })

  // DELETE single
  router.delete(singleUrl, options.middleware, function(req, res) {
    model.remove({_id: req.params.id})
      .exec(errHandler(res, function(){
        res.json({msg: "OK"})
      }))
  })
}
