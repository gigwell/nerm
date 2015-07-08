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

})

