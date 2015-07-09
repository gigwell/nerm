var permissions = require('permissions')


describe('Permissions', function() {
  describe('#allPublic', function() {
    describe('with an array', function() {
      it('returns false if any object has a private field', function() {
        var objs = [
          {name: 'bobo'},
          {name: 'Mr. Moneymaker', ssno: '123.32.1234'}
        ]
        var deselect = ['ssno']
        permissions.allPublic(objs, deselect).should.eql(false)
      })

      it("correctly handles complex situations", function() {
        var objs = [
          {name: 'bobo'},
          {name: 'Mr. Moneymaker', secret: { ssno: '123.32.1234'} }
        ]
        var deselect = ['secret.ssno']
        permissions.allPublic(objs, deselect).should.eql(false)

      })
    })

    it('returns false if nested fields are in the list', function() {
      var obj = {
        name: 'bob',
        location: {
          city: 'LA'
        }
      }
      var deselect = ['location.city']
      permissions.allPublic(obj, deselect).should.eql(false)
    })

    it('returns false if any fields are in the deselect list', function() {
      var obj = {
        name: 'val'
      }
      var deselect = ['name']
      permissions.allPublic(obj, deselect).should.eql(false)

    });

    it('returns true if all fields are public', function() {
      var obj = {
        junk: 'val',
        stuff: 'cool'
      }
      var deselect = ['name']
      permissions.allPublic(obj, deselect).should.eql(true)
    })
  });

  describe('#buildDeselectList', function() {
    it('builds list from a simple schema', function() {
      var schemaPaths = {
        field1: {options: {}},
        field2: {options: { nerm: {private: true} }}
      }

      permissions.buildDeselectList(schemaPaths)
        .should.eql(['field2'])
    })
  });

  describe('#buildSelectString', function() {
    it('negates the deselect list', function() {
      permissions.buildSelectString(['field1', 'field2'])
        .should.eql('-field1 -field2')
    })
  });
});
