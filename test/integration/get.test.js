var helper = require('./helper'),
    request = helper.request

describe("GET", function() {
  it("returns all objects of the specified type", function(done) {
    request.get('/api/v0/resources')
      .expect(200)
      .expect(function(res) {
        res.body.resources.should.match([
            {_id: "ffffffffffffa00000000001", name: "Best Resource"},
            {_id: "ffffffffffffa00000000002", name: "Worst Resource"}
        ])
      })
      .end(done)
  })

  it("returns an individual item", function(done) {
    request.get('/api/v0/resources/ffffffffffffa00000000002')
      .expect(200)
      .expect(function(res) {
        res.body.resource.should.have.properties({
          name: "Worst Resource"
        })
      })
      .end(done)
  })

  it("contains virtuals", function(done) {
    request.get('/api/v0/resources')
      .expect(200)
      .expect(function(res) {
        res.body.resources.should.matchEach({
          secret: "shhhh"
        })
      })
      .end(done)
  })

  it("returns a filtered set", function(done) {
    request.get('/api/v0/resources')
      .query({q: JSON.stringify({name: "Worst Resource"})})
      .expect(200)
      .expect(function(res) {
        res.body.resources.length.should.eql(1)
        res.body.resources.should.match([
            {_id: "ffffffffffffa00000000002", name: "Worst Resource"}
        ])
      })
      .end(done)
  })

  it("returns a filtered set by regexp", function(done) {
    request.get('/api/v0/resources')
      .query({q: JSON.stringify({$like: {name: "Worst"}})})
      .expect(200)
      .expect(function(res) {
        res.body.resources.length.should.eql(1)
        res.body.resources.should.match([
            {_id: "ffffffffffffa00000000002", name: "Worst Resource"}
        ])
      })
      .end(done)
  })

  describe('with populated fields', function() {
    it('returns the with the child doc', function(done) {
      request.get('/api/v0/resources/ffffffffffffa00000000002')
        .query({populate: '_child'})
        .expect(200)
        .expect(function(res) {
          res.body.resource._child.should.have.properties({
            name: 'Best Child'
          })
        })
        .end(done)
    })
  });

  describe('with sorted fields', function() {
    it('sorts the docs', function(done) {
      request.get('/api/v0/resources')
        .query({sort: '-name'})
        .expect(200)
        .expect(function(res) {
          res.body.resources.should.match([
            {name: 'Worst Resource'},
            {name: 'Best Resource'}
          ])
        })
        .end(done)
    })
  });

  describe('with selected fields', function() {
    it('sorts the docs', function(done) {
      request.get('/api/v0/resources/ffffffffffffa00000000002')
        .query({select: '-name'})
        .expect(200)
        .expect(function(res) {
          res.body.resource
            .should.not.have.property('name')
        })
        .end(done)
    })
  });
})

