require("coffee-script/register")
require('should')

var express = require('express'),
    fixtureConf = require("./fixtures/config"),
    fixtures = require('mongo-fixtures'),
    mongoose = require('mongoose'),
    Nerm = require("../.."),
    app = express(),
    supertest = require('supertest'),
    sinon = require('sinon')

mongoose.connect("mongodb://33.33.33.100:27017/nerm-test")

function hook(cb) { cb() }
function MW(req, res, next) {next()}

var schemaOpts = {
  'toJSON': { getters: true, virtuals: true },
  'toObject': { getters: true, virtuals: true }
}

var hookSpy = exports.hookSpy = sinon.spy(hook),
    MWSpy = exports.MWSpy = sinon.spy(MW),
    Schema = new mongoose.Schema({name: String}, schemaOpts)

Schema.virtual('secret').get(function() {
  return 'shhhh'
})

Schema.pre('save', hookSpy)

var Resource = exports.Resource = mongoose.model('Resource', Schema)

app.use(require('body-parser').json())
Nerm.route(app, Resource, {middleware: MWSpy})
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

