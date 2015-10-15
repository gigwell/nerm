var scope = require('scope_getter')

describe('Scope Getter', function() {
  describe('with a function', function() {
    it('callsback with the results of a sync function', function() {
      var scoper = function(req) {
        return {scope: req.scope}
      }

      scope.get({scope: '42'}, scoper, function(scope) {
        scope.should.eql({scope: '42'})
      })
    });

    it('delegates the callback to an async fn', function() {
      var scoper = function(req, cb) { cb({scope: req.scope}) }

      scope.get({scope: '42'}, scoper, function(scope) {
        scope.should.eql({scope: '42'})
      })
    })
  });

  describe('with a literal', function() {
    it('callsback with the literal object', function(done) {
      scope.get({}, {scope: '42'}, function(scope) {
        scope.should.eql({scope: '42'})
        done()
      })
    })
  });

});
