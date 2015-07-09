ObjectId = require('mongoose').Types.ObjectId

module.exports = [
  {
    _id: ObjectId("ffffffffffffa00000000001"),
    _child: ObjectId("ffffffffffffb00000000002"),
    name: "Best Resource",
    junk: 'Shiny Toys'
  },
  {
    _id: ObjectId("ffffffffffffa00000000002"),
    _child: ObjectId("ffffffffffffb00000000001"),
    name: "Worst Resource",
    junk: 'Trash Heap'
  }
]
