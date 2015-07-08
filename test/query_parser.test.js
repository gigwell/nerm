var parser = require('../lib/query_parser')

describe('Query Parser', function() {
  describe('#parse', function() {
    it('parses regular JSON', function() {
      var q = JSON.stringify({
        name: 'cooldude',
        location: { name: 'coolplace' }
      })

      parser.parse(q).should.eql({
        name: 'cooldude',
        location: { name: 'coolplace' }
      })
    })

    it("parses regex", function() {
      var q = JSON.stringify({$like: {name: "mooglefoogle"}})
      parser.parse(q).should.eql({
        name: /mooglefoogle/i
      })
    });

    it('parses multiple regexes', function() {
      var q = JSON.stringify({
        $like: {name: "mooglefoogle", place: 'scrubblebees'}
      })

      parser.parse(q).should.eql({
        name: /mooglefoogle/i,
        place: /scrubblebees/i
      })
    })

    it("parses both exact matches and regexps together", function() {
      var q = JSON.stringify({
        $like: {name: "moogerfooger"},
        place: 'scrubblebees'
      })

      parser.parse(q).should.eql({
        name: /moogerfooger/i,
        place: 'scrubblebees'
      })
    })

    it("handles deeply nested regexes", function() {
      var q = JSON.stringify({
        name: "moogerfooger",
        place: {
          $like: {city: 'scrubblebees'},
          state: 'sanitano'
        }
      })

      parser.parse(q).should.eql({
        name: "moogerfooger",
        place: { city: /scrubblebees/i, state: 'sanitano' }
      })
    })

    it("handles a deeply nested like statement", function() {
      var q = JSON.stringify({
        $like: {
          place: { city: 'scrubblebees', state: 'sanitano' }
        }
      })

      parser.parse(q).should.eql({
        place: { city: /scrubblebees/i, state: /sanitano/i }
      })
    })
  });
});
