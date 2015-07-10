var permissions = require('permissions')


describe('Permissions', function() {
  describe('#containsFields', function() {
    describe('with an array', function() {
      it('returns true if any object is in the list', function() {
        var objs = [
          {name: 'bobo'},
          {name: 'Mr. Moneymaker', ssno: '123.32.1234'}
        ]
        var deselect = ['ssno']
        permissions.containsFields(objs, deselect).should.eql(true)
      })

      it("correctly handles complex situations", function() {
        var objs = [
          {name: 'bobo'},
          {name: 'Mr. Moneymaker', secret: { ssno: '123.32.1234'} }
        ]
        var deselect = ['secret.ssno']
        permissions.containsFields(objs, deselect).should.eql(true)

      })
    })

    it('returns true if nested fields are in the list', function() {
      var obj = {
        name: 'bob',
        location: {
          city: 'LA'
        }
      }
      var deselect = ['location.city']
      permissions.containsFields(obj, deselect).should.eql(true)
    })

    it('returns true if any fields are in the list', function() {
      var obj = {
        name: 'val'
      }
      var deselect = ['name']
      permissions.containsFields(obj, deselect).should.eql(true)

    });

    it('returns false if no fields are in the list', function() {
      var obj = {
        junk: 'val',
        stuff: 'cool'
      }
      var deselect = ['name']
      permissions.containsFields(obj, deselect).should.eql(false)
    })
  });

  describe('#getPathsWithOption', function() {
    it('handles array values', function() {
      var schemaPaths = {
        field1: {options: {type: [{nerm: {private: true}}]}},
        field2: {options: {type: [{}]}}
      }
      permissions.getPathsWithOption(schemaPaths, 'private')
        .should.eql(['field1'])
    })

    it('builds list from a simple schema', function() {
      var schemaPaths = {
        field1: {options: {}},
        field2: {options: { nerm: {readOnly: true} }}
      }

      permissions.getPathsWithOption(schemaPaths, 'readOnly')
        .should.eql(['field2'])
    })
  });

  describe('#allFieldsPermitted', function() {
    it('returns true if all fields are accessible', function() {
      permissions.allFieldsPermitted(['blah'], ['wocka'])
        .should.eql(true)
    });

    it('returns false if trying to access a forbidden field', function() {
      permissions.allFieldsPermitted(['blah'], ['wocka', 'blah'])
        .should.eql(false)
    });

    it('returns false if accessing forbidden fields with mods', function() {
      permissions.allFieldsPermitted(['-blah'], ['wocka', 'blah'])
        .should.eql(false)

      permissions.allFieldsPermitted(['+blah'], ['wocka', 'blah'])
        .should.eql(false)
    });
  });

  describe('#buildSelectString', function() {
    it('negates the deselect list', function() {
      permissions.buildSelectString(['field1', 'field2'])
        .should.eql('-field1 -field2')
    })
  });
});
