var helper = require('./helper'),
    request = helper.request,
    Resource = helper.Resource,
    hookSpy = helper.hookSpy

describe("POST", function() {
  it("will not let you POST an existing doc", function(done) {
    request.post('/api/v0/resources/ffffffffffffa00000000002')
      .expect(400, {msg: "Found an ID in a POST url"})
      .end(done)
  })

  it("will not let you send a malformed envelope", function(done) {
    request.post('/api/v0/resources')
      .send({resourcio: {}})
      .expect(400, { msg: "Malformed Envelope"})
      .end(done)
  })

  describe("single resource", function() {
    beforeEach(function() {
      this.name = "A New Resource"
      this.request = request.post('/api/v0/resources')
                      .send({ resource: {name: this.name} })
    })

    it("creates", function(done) {
      var name = this.name
      this.request.expect(200)
        .end(function(err, res) {
          Resource.findOne({name: name}).exec(function(err, doc){
            doc.should.be.ok
            res.body.resource.should.have.properties({
              name: name,
              _id: doc._id.toString()
            })
            done()
          })
        })
    })

    it("fires hooks", function(done) {
      this.request.end(function() {
        hookSpy.calledOnce.should.eql(true, "Hook not called once")
        done()
      })
    })
  })

  describe("multiple resources", function() {
    beforeEach(function() {
      this.name1 = "A New Resource"
      this.name2 = "A Newer Resource"
      this.request = request.post('/api/v0/resources')
                      .send({
                        resources: [{name: this.name1}, {name:this.name2}]
                      })
    })
    it("creates", function(done) {
      var name1 = this.name1,
          name2 = this.name2
      this.request.expect(200)
        .end(function(err, res) {
          Resource.find({name: /New/}).exec(function(err, docs){
            docs.length.should.eql(2)
            res.body.resources.should.match([
              {_id: docs[0]._id.toString(), name: name1},
              {_id: docs[1]._id.toString(), name: name2}
            ])
            done()
          })
        })
    })

    it("fires hooks", function(done) {
      this.request.end(function() {
        hookSpy.calledTwice.should.eql(true, "Hook not called twice")
        done()
      })
    })
  })
})
