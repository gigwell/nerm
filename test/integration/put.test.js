var helper = require('./helper'),
    request = helper.request,
    Resource = helper.Resource,
    hookSpy = helper.hookSpy

describe("PUT", function() {
  it('will not let you PUT a new doc', function(done) {
    request.put('/api/v0/resources')
      .expect(400, {msg: "Missing ID in a PUT url"})
      .end(done)
  })

  it('updates a document', function(done) {
    request.put('/api/v0/resources/ffffffffffffa00000000002')
      .send({ resource: {name: 'OK Resource'}})
      .expect(200)
      .end(function(err, res) {
        res.body.resource.should.have.properties({ name: 'OK Resource' })
        Resource.findById("ffffffffffffa00000000002")
        .exec(function(err, doc) {
          doc.name.should.eql('OK Resource')
          done()
        })
      })
  })

  it("fires hooks", function(done) {
    request.put('/api/v0/resources/ffffffffffffa00000000002')
      .send({ resource: {name: 'OK Resource'}})
      .expect(200)
      .end(function() {
        hookSpy.called.should.eql(true, "Hook not called")
        hookSpy.calledOnce.should.eql(true, "Hook not called once")
        done()
      })
  })
})

