# nerm
![NERM!!!](/nerm.png)

RESTful API generator for Express and Mongoose. Nerm maps routes directly to your mongoose models.

Nerm came about because we needed a light weight API generator. Nerm's feature set is small but useful. If you need a more full featured generator, check out [Express Restify Mongoose](https://www.npmjs.com/package/express-restify-mongoose). 


## Installation
```bash
npm install nerm
```


## Basic Usage
```javascript
var Nerm = require('nerm')
var mongoose = require('mongoose')

mongoose.connect('mongodb://localhost')

var Schema = new mongoose.Schema({
  name: String,
  location: String
})

var User = mongoose.model('User', Schema)

Nerm.route(app, User)
```
```
GET    /api/v0/users
POST   /api/v0/users
GET    /api/v0/users/ffffffffffffb00000000001
PUT    /api/v0/users/ffffffffffffb00000000001
DELETE /api/v0/users/ffffffffffffb00000000001
```

## Queries
Queries in GET requests are made by passing a mongo query as a JSON string. To make a Regexp query, use the $like operator.

```javascript
var q = JSON.stringify({location: 'New York', $like: {name: 'john'}})
request.get('/api/v0/users?q=' + q)
// Translates to {location: 'New York', name: /john/i}
```

## Sort Select and Populate
GET requests can also be given sort, select, and populate options.
```javascript
request.get('/api/v0/users?select=name&sort=-name')
// Will return objects without location info and sorted by name in descending order
```

## Middleware
Middleware can be provided in order to restrict access to routes
```javascript
  //This will restrict access to a individual user unless that user makes the request
  Nerm.app.route(app, User, {
    middleware: function(req, res, next) {
      if (req.params.id && req.params.id !== req.user._id)
        res.status(401).send("Unauthorized")
      else
        next()
    }
  })
```

## Private Fields
Schemas can be decorated with a private option.
```javascript
var Schema = new mongoose.Schema({
  name: String,
  location: {type: String, nerm: {private: true}}
})

var User = mongoose.model('User', Schema)

Nerm.route(app, User, {
  privateAccess: function(req) { return req.user.admin }
})
// This will not allow nonadmins to filter or modify location,
// and will not return location fields in the responses.
```

## Readonly Fields
Schemas can be decorated with a readOnly option.
```javascript
var Schema = new mongoose.Schema({
  name: String,
  location: {type: String, nerm: {readOnly: true}}
})

var User = mongoose.model('User', Schema)

Nerm.route(app, User, {
  writeAccess: function(req) { return req.user.admin }
})
// This will allow location to be filtered, but not modified by nonadmins
```

## Scope
Sometimes a resource needs to be further restricted. To do that pass a scope function or literal.
Nerm.route(app, User, {
  scope: function(req) { return {location: req.user.location }}
})
// Callers will only be able to retrieve other users in their location.

## Defaults
Default options can be provided by calling Nerm.defaults, these will apply to all routes not given their own options

```javascript
Nerm.defaults({
  privateAccess: function() { return false; }
})

Nerm.route(app, User) //No callers will have access to private fields now
```
