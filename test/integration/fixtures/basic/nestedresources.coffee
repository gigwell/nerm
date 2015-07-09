ObjectId = require('mongoose').Types.ObjectId

module.exports = [
  {
    _id: ObjectId("ffffffffffffa00000000001")
    name: "Best Nested Resource",
    address: {
      city: "New York",
      state: "New York"
    }
  },
  {
    _id: ObjectId("ffffffffffffa00000000002"),
    name: "Worst Nested Resource",
    address: {
      city: "Myrtle Beach",
      state: "Florida"
    }
  }
]

