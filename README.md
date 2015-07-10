# nerm
RESTful API generator for Express and Mongoose. Nerm maps routes directly to your mongoose models.

Nerm came about because we needed a light weight API generator. Nerm's feature set is small but useful. If you need a more full featured generator, check out [Express Restify Mongoose](https://www.npmjs.com/package/express-restify-mongoose). 


# Installation
TBD

# Basic Usage
```javascript
var Nerm = require('nerm')
var mongoose = require('mongoose')

mongoose.connect('mongodb://localhost')

var Schema = new mongoose.Schema({
  name: String
})

var User = mongoose.model('User', Schema)

Nerm.route(app, User)
```
```
GET /api/v0/users
GET /api/v0/users/ffffffffffffb00000000001
POST /api/v0/users
PUT /api/v0/users/ffffffffffffb00000000001
DELETE /api/v0/users/ffffffffffffb00000000001
```

# Queries

# Sort Select and Populate

# Middleware

# Private Fields

# Private Field Override

# Handler Override
