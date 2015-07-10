ObjectId = require('mongoose').Types.ObjectId

module.exports = [
  {
    _id: ObjectId("ffffffffffffa00000000001"),
    name: "Best Resource",
    junk: 'Shiny Toys'
  },
  {
    _id: ObjectId("ffffffffffffa00000000002"),
    name: "Best Scoped Resource",
    junk: 'Trash Heap'
  },
  {
    _id: ObjectId("ffffffffffffa00000000003"),
    name: "Worst Scoped Resource",
    junk: 'Trash Heap'
  },
  {
    _id: ObjectId("ffffffffffffa00000000004"),
    name: "Worst Resource",
    junk: 'Trash Heap'
  }
]

