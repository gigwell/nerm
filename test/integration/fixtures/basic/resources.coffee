ObjectId = require('mongoose').Types.ObjectId

module.exports = [
  {
    _id: ObjectId("ffffffffffffa00000000001"),
    _child: ObjectId("ffffffffffffb00000000002"),
    tags: ["nice", "good", "special"],
    name: "Best Resource",
    junk: 'Shiny Toys'
  },
  {
    _id: ObjectId("ffffffffffffa00000000002"),
    _child: ObjectId("ffffffffffffb00000000001"),
    tags: ["ugly", "common", "dumb"],
    name: "Worst Resource",
    junk: 'Trash Heap'
  }
]
