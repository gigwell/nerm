var helper = require('./helper'),
    request = helper.request,
    MWSpy = helper.MWSpy,
    _ = helper._


describe("options", function() {
  describe("middleware", function() {
    it("calls the middleware", function(done) {
      request.get('/api/v0/resources')
        .expect(200)
        .end(function() {
          MWSpy.calledOnce.should.eql(true, "MW not called")
          done()
        })
    })
  })
})

describe('with envelope off', function() {
  describe('GET', function() {
    it('single return no envelope', function(done) {
      request.get('/api/v0/resources/ffffffffffffa00000000002')
        .query({resEnvelope: false})
        .expect(200)
        .expect(function(res) {
          res.body.should.have.properties({
            name: "Worst Resource"
          })
        })
        .end(done)
      });

    it('multiple return no envelope', function(done) {
      request.get('/api/v0/resources')
        .query({resEnvelope: false})
        .expect(200)
        .expect(function(res) {
          _.isArray(res.body)
            .should.eql(true, "Body is not an array")
        })
        .end(done)
      });
  });

  it('POST returns no envelope', function(done) {
    var name = "A New Resource"
    request.post('/api/v0/resources')
      .send({ resEnvelope: false, resource: {name: name} })
      .end(function(err, res) {
        res.body.should.have.properties({ name: name })
        done()
      })
  });

  it('PUT returns no envelope', function(done) {
    var name = "A New Resource"
    request.put('/api/v0/resources/ffffffffffffa00000000002')
      .send({ resEnvelope: false, resource: {name: name} })
      .end(function(err, res) {
        res.body.should.have.properties({ name: name })
        done()
      })
  });
});

