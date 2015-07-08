var helper = require('./helper'),
    request = helper.request,
    Resource = helper.Resource

describe("DELETE", function() {
  it("will not let you delete multiple docs", function(done) {
    request.del('/api/v0/resources')
      .expect(400, {msg: "Missing ID in a DELETE url"})
      .end(done)
  })

  it('deletes a doc', function(done) {
    request.del('/api/v0/resources/ffffffffffffa00000000002')
      .expect(200)
      .end(function() {
        Resource.count().exec(function(err, count) {
          count.should.eql(1)
          done()
        })
      })
  })
})


