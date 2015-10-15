var helper = require('./helper'),
    request = helper.request,
    async = require('async'),
    _ = require('lodash')

_.mixin(require('underscore.string').exports())

describe('Read only Fields', function() {
  var ops = [
    {
      name: 'POST one',
      method: 'post',
      url: '/api/v0/%s',
      data: { junk: "Trash", address: { city: "Brooklyn" } }
    },
    {
      name: 'POST many',
      method: 'post',
      dataMethod: 'send',
      url: '/api/v0/%s',
      data: [
        { junk: "Trash", address: { city: "Brooklyn" }},
        { junk: "Trash", address: { city: "West Islip"}}
      ]
    },
    {
      name: 'PUT',
      method: 'put',
      dataMethod: 'send',
      url: '/api/v0/%s/ffffffffffffa00000000001',
      data: { junk: "Trash", address: {city: "Brooklyn"} }
    }
  ]

  function verify(name, contents, assertion) {
    try {
      if(_.isArray(contents))
        contents.should.matchEach(assertion)
      else
        assertion(contents)
    } catch(e) {
      throw new Error(e.message + " in " + name)
    }
  }

  describe('without access', function() {
    it('cannot write read only  fields', function(done) {
      async.eachSeries(ops, function(op, next) {
        var url = _.sprintf(op.url, 'resources'),
            envelope = _.isArray(op.data) ? 'resources' : 'resource'
            rawData = {admin: true, resEnvelope: false}

        _.set(rawData, envelope, op.data)
        request[op.method](url).send(rawData)
          .expect(401, {msg: "Attempted to modify a read only field"})
          .end(next)
      }, done)
    })

    it('cannot write nested read only fields', function(done) {
      async.eachSeries(ops, function(op, next) {
        var url = _.sprintf(op.url, 'nestedresources'),
            envelope = _.isArray(op.data) ? 'nestedresources' : 'nestedresource'
            rawData = {resEnvelope: false, admin: true}

        _.set(rawData, envelope, op.data)
        request[op.method](url).send(rawData)
          .expect(401, {msg: "Attempted to modify a read only field"})
          .end(next)
      }, done)
    })

  });

  describe('with access', function() {
    it('allowd private fields modification', function(done) {
      async.eachSeries(ops, function(op, next) {
        var url = _.sprintf(op.url, 'resources'),
            envelope = _.isArray(op.data) ? 'resources' : 'resource'
            rawData = {writer: true, admin: true, resEnvelope: false}

        _.set(rawData, envelope, op.data)
        request[op.method](url).send(rawData)
          .expect(200)
          .expect(function(res) {
            verify(op.name, res.body, function(item) {
              item.should.have.property('junk', "Trash")
            })
          })
          .end(next)
      }, done)
    })
  });
});

