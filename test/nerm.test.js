require("coffee-script/register")
require('should')

var express = require('express'),
    fixtureConf = require("./fixtures/config"),
    fixtures = require('mongo-fixtures'),
    mongoose = require('mongoose'),
    Nerm = require(".."),
    app = express(),
    supertest = require('supertest'),
    sinon = require('sinon')

mongoose.connect("mongodb://33.33.33.100:27017/nerm-test")

function hook(cb) { cb() }
function MW(req, res, next) {next()}

var hookSpy = sinon.spy(hook),
    MWSpy = sinon.spy(MW),
    Schema = new mongoose.Schema({ name: String })

Schema.pre('save', hookSpy)
Schema.pre('remove', hookSpy)

var Resource = mongoose.model('Resource', Schema)

app.use(require('body-parser').json())
Nerm.route(app, Resource, {middleware: MWSpy})
app.listen(5050)

var request = supertest.agent(app)

describe("Nerm", function() {
  beforeEach(function(done) {
    fixtures(fixtureConf).load({
      env: 'test',
      username: null,
      password: null,
      dataset: 'basic'
    }, done)
  });

  afterEach(function() {
    hookSpy.reset()
    MWSpy.reset()
  })

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

    it("returns a filtered set", function(done) {
      request.get('/api/v0/resources')
        .query({q: JSON.stringify({name: "Worst Resource"})})
        .expect(200)
        .expect(function(res) {
          res.body.resources.length.should.eql(1)
          res.body.resources.should.match([
              {_id: "ffffffffffffa00000000002", name: "Worst Resource"}
          ])
        })
        .end(done)

    })
  })

  describe("POST", function() {
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
  })

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
          hookSpy.calledOnce.should.eql(true, "Hook not called once")
          done()
        })
    })
  })

  describe("DELETE", function() {
    it("will not let you delete multiple docs", function(done) {
      request.del('/api/v0/resources')
        .expect(400, {msg: "Missing ID in a DELETE url"})
        .end(done)
    })

    it('deletes a doc', function(done) {
      request.del('/api/v0/resources/ffffffffffffa00000000002')
        .expect(200)
        .end(function() {
          Resource.count().exec(function(err, count) {
            count.should.eql(1)
            done()
          })
        })
    })
  })

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
})
