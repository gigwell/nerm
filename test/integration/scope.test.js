var helper = require("./helper"),
    request = helper.request

describe('Scoping', function() {
  describe('GET', function() {

    it('filters by scope function', function(done) {
      request.get('/api/v0/fnscopes')
        .expect(200)
        .expect(function(res) {
          res.body.fnscopes.length.should.eql(1)
          res.body.fnscopes[0].name.should.eql('Best Resource')
        })
        .end(done)
    })

    it("doesn't trample existing query", function(done) {
      request.get('/api/v0/literalscopes')
        .query({q: JSON.stringify({$like: {name: 'Scope'}})})
        .expect(200)
        .expect(function(res) {
          res.body.literalscopes.length.should.eql(1)
          res.body.literalscopes[0].name.should.eql('Best Scoped Resource')
        })
        .end(done)
    })

    it('Filters by literal scope Object', function(done) {
      request.get('/api/v0/literalscopes')
        .expect(200)
        .expect(function(res) {
          res.body.literalscopes.length.should.eql(2)
          res.body.literalscopes.should.containDeep([
            {name: 'Best Resource'},
            {name: 'Best Scoped Resource'}
          ])
        })
        .end(done)
    })
  })
})
