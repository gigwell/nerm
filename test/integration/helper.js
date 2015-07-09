require("coffee-script/register")
require('should')

var express = require('express'),
    fixtureConf = require("./fixtures/config"),
    fixtures = require('mongo-fixtures'),
    mongoose = require('mongoose'),
    Nerm = require("../.."),
    app = express(),
    supertest = require('supertest')

mongoose.connect("mongodb://33.33.33.100:27017/nerm-test")

function hook(cb) { cb() }
function MW(req, res, next) {next()}

var schemaOpts = {
  'toJSON': { getters: true, virtuals: true },
  'toObject': { getters: true, virtuals: true }
}

var sinon = exports.sinon = require('sinon'),
    hookSpy = exports.hookSpy = sinon.spy(hook),
    MWSpy = exports.MWSpy = sinon.spy(MW),
    privateAccess = function(req) {
      return req.body.admin || req.query.admin
    }

var Schema = new mongoose.Schema({
  name: String,
  junk: {default: "Gunge", type: String, nerm: {private: true}},
  _child: {ref: 'ChildResource', type: mongoose.Schema.ObjectId}
}, schemaOpts)

var ChildSchema = new mongoose.Schema({
  name: String,
  hidden: { type: String, nerm: {private: true}}
})

var NestedSchema = new mongoose.Schema({
  name: String,
  address: {
    city: {default: "Boise", type: String, nerm: {private: true}},
    state: String
  }
}, schemaOpts)

Schema.virtual('secret').get(function() {
  return 'shhhh'
})

Schema.pre('save', hookSpy)

var Resource = exports.Resource = mongoose.model('Resource', Schema)
var NestedResource = mongoose.model('NestedResource', NestedSchema)
mongoose.model('ChildResource', ChildSchema)

app.use(require('body-parser').json())

Nerm.route(app, Resource, {
  middleware: MWSpy,
  privateAccess: privateAccess
})

Nerm.route(app, NestedResource, { privateAccess: privateAccess })

app.listen(5050)

exports.request = supertest.agent(app)
exports._ = require('lodash')


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

