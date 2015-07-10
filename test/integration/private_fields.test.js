var helper = require('./helper'),
    request = helper.request,
    async = require('async'),
    _ = require('lodash')

_.mixin(require('underscore.string').exports())

describe('Private Field retrieval', function() {
  var ops = [
    {
      name: 'GET one',
      method: 'get',
      dataMethod: 'query',
      url: '/api/v0/%s/ffffffffffffa00000000001'
    },
    {
      name: 'GET many',
      method: 'get',
      dataMethod: 'query',
      url: '/api/v0/%s'
    },
    {
      name: 'POST one',
      method: 'post',
      dataMethod: 'send',
      url: '/api/v0/%s',
      data: { name: "New Resource", address: { state: "Idaho" } }
    },
    {
      name: 'POST many',
      method: 'post',
      dataMethod: 'send',
      url: '/api/v0/%s',
      data: [
        { name: "New Resource", address: { state: "Idaho" }},
        { name: "Old Resource", address: { state: "Hawaii"}}
      ]
    },
    {
      name: 'PUT',
      method: 'put',
      dataMethod: 'send',
      url: '/api/v0/%s/ffffffffffffa00000000001',
      data: { name: "Changed Resource" }
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
    it('does not retrieve private fields', function(done) {
      async.eachSeries(ops, function(op, next) {
        var url = _.sprintf(op.url, 'resources'),
            envelope = _.isArray(op.data) ? 'resources' : 'resource'
            rawData = {resEnvelope: false}

        if (op.dataMethod === 'query')
          _.extend(rawData, op.data)
        else
          _.set(rawData, envelope, op.data)

        request[op.method](url)[op.dataMethod](rawData)
          .expect(200)
          .expect(function(res) {
            verify(op.name, res.body, function(item) {
              item.should.not.have.property('junk')
              item.should.not.have.property('tags')
            })
          })
          .end(next)
      }, done)
    })

    it('does not retrive private nested fields', function(done) {
      async.eachSeries(ops, function(op, next) {
        var url = _.sprintf(op.url, 'nestedresources'),
            envelope = _.isArray(op.data) ? 'nestedresources' : 'nestedresource'
            rawData = {resEnvelope: false}

        if (op.dataMethod === 'query')
          _.extend(rawData, op.data)
        else
          _.set(rawData, envelope, op.data)

        request[op.method](url)[op.dataMethod](rawData)
          .expect(200)
          .expect(function(res) {
            verify(op.name, res.body, function(item) {
              item.address.should.not.have.property('city')
            })
          })
          .end(next)
      }, done)
    })

  });

  describe('with access', function() {
    it('retrieves private fields', function(done) {
      async.eachSeries(ops, function(op, next) {
        var url = _.sprintf(op.url, 'resources'),
            envelope = _.isArray(op.data) ? 'resources' : 'resource'
            rawData = {admin: true, resEnvelope: false}

        if (op.dataMethod === 'query')
          _.extend(rawData, op.data)
        else
          _.set(rawData, envelope, op.data)

        request[op.method](url)[op.dataMethod](rawData)
          .expect(200)
          .expect(function(res) {
            verify(op.name, res.body, function(item) {
              item.should.have.property('junk')
            })
          })
          .end(next)
      }, done)
    })
  });
});

describe('Private Field Modification', function() {
  var ops = [
    {
      name: 'POST one',
      method: 'post',
      url: '/api/v0/%s',
      data: {
        name: 'New Resource',
        junk: 'Philo',
        address: { city: 'Garbagetown'}
      }
    },
    {
      name: 'POST many',
      method: 'post',
      url: '/api/v0/%s',
      data: [
        {
          name: 'New Resource',
          junk: 'Philo',
          address: { city: 'Garbagetown'}
        }, {
          name: 'Newer Resource',
          junk: 'Gunge',
          address: { city: 'Trashville'}
        }
      ]
    },
    {
      name: 'PUT',
      method: 'put',
      url: '/api/v0/%s/ffffffffffffa00000000001',
      data: {
        name: "Changed Resource",
        junk: 'Philo',
        address: { city: 'Garbagetown' }
      }
    }
  ]

  describe('without access', function() {
    it('should not allow private field modification', function(done) {
      async.eachSeries(ops, function(op, next) {
        var url = _.sprintf(op.url, 'resources'),
            envelope = _.isArray(op.data) ? 'resources' : 'resource'
            rawData = {resEnvelope: false}

        _.set(rawData, envelope, op.data)

        request[op.method](url)
          .send(rawData)
          .expect(401, {msg: "Unauthorized attempt to access private field" })
          .end(next)
      }, done)
    })

    it('should not allow nested private field modification', function(done) {
      async.eachSeries(ops, function(op, next) {
        var url = _.sprintf(op.url, 'nestedresources'),
            envelope = _.isArray(op.data) ? 'nestedresources' : 'nestedresource'
            rawData = {resEnvelope: false}

        _.set(rawData, envelope, op.data)
        request[op.method](url).send(rawData)
          .expect(401, {msg: "Unauthorized attempt to access private field" })
          .end(next)
      }, done)
    })
  });

  describe('with access', function() {
    it('should allow private field modification', function(done) {
      async.eachSeries(ops, function(op, next) {
        var url = _.sprintf(op.url, 'resources'),
            envelope = _.isArray(op.data) ? 'resources' : 'resource'
            rawData = {admin: true, resEnvelope: false}

        _.set(rawData, envelope, op.data)

        request[op.method](url)
          .send(rawData)
          .expect(200)
          .end(next)
      }, done)
    })
  });

})

describe('Private Field Selection', function() {
  describe('without access', function() {
    it('should not allow private field selection', function(done) {
      request.get('/api/v0/resources')
        .query({select: 'junk'})
        .expect(401, {msg: "Unauthorized attempt to access private field" })
        .end(done)
    })

    it('should not allow nested private field selection', function(done) {
      request.get('/api/v0/nestedresources')
        .query({select: 'address.city'})
        .expect(401, {msg: "Unauthorized attempt to access private field" })
        .end(done)
    })
  })

  describe('with access', function() {
    it('should allow private field selection', function(done) {
      request.get('/api/v0/resources')
        .query({admin: true, select: 'junk'})
        .expect(200)
        .expect(function(res) {
          res.body.resources.should.matchEach(function(i) {
            i.should.not.have.property('name')
          })
        })
        .end(done)
    })
  })
})

describe('Private Field Filtering', function() {
  describe('without access', function() {
    it('should not allow private field selection', function(done) {
      request.get('/api/v0/resources')
        .query({q: JSON.stringify({junk: 'trash'})})
        .expect(401, {msg: "Unauthorized attempt to access private field" })
        .end(done)
    })

    it('should not allow nested private field selection', function(done) {
      request.get('/api/v0/nestedresources')
        .query({q: JSON.stringify({'address.city': 'trashville'})})
        .expect(401, {msg: "Unauthorized attempt to access private field" })
        .end(done)
    })
  })

  describe('with access', function() {
    it('should allow private field selection', function(done) {
      request.get('/api/v0/resources')
        .query({admin: true, q: JSON.stringify({'junk': 'trash'})})
        .expect(200)
        .end(done)
    })
  })
})
