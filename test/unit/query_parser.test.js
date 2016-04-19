var parser = require('query_parser')

describe('Query Parser', function() {
  describe('#parse', function() {
    it('creates date objects', function() {
      var dateStr = "2016-12-24T19:20:33.000Z"
      var date = new Date(dateStr)
      var q = JSON.stringify({
        $date: {createdOn: dateStr}
      })
      parser.parse(q).should.eql({
        createdOn: date
      })
    })

    it('it creates multiple dates', function() {
      var d1 = new Date("2016-12-24T19:20:33.000Z")
      var d2 = new Date("2016-12-25T19:20:33.000Z")
      var q = JSON.stringify({
        $date: {createdOn: d1.toString(), updatedOn: d2.toString()}
      })
      parser.parse(q).should.eql({
        createdOn: d1,
        updatedOn: d2
      })

    })

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
