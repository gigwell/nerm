require("coffee-script/register")
require('should')

var express = require('express'),
    fixtureConf = require("./fixtures/config"),
    fixtures = require('mongo-fixtures'),
    mongoose = require('mongoose'),
    Nerm = require(".."),
    app = express(),
    supertest = require('supertest')

mongoose.connect("mongodb://33.33.33.100:27017/nerm-test")
var Resource = mongoose.model('Resource', new mongoose.Schema({ name: String }))

Nerm.route(app, Resource)
app.listen(5050)

var request = supertest.agent(app)

before(function(done) {
  fixtures(fixtureConf).load({
    env: 'test',
    username: null,
    password: null,
    dataset: 'basic'
  }, done)
});

describe("Nerm", function() {
  describe("GET", function() {
    it("returns all objects of the specified type", function(done) {
      request.get('/api/v0/resources')
        .expect(200)
        .expect(function(res) {
          res.body.resources.should.match([
              {_id: "ffffffffffffa00000000001", name: "Best Resource"},
              {_id: "ffffffffffffa00000000002", name: "Worst Resource"}
          ])
        })
        .end(done)
    })

    it("returns an individual item", function(done) {
      request.get('/api/v0/resources/ffffffffffffa00000000002')
        .expect(200)
        .expect(function(res) {
          res.body.resource.should.have.properties({
            name: "Worst Resource"
          })
        })
        .end(done)
    })
  })
})
