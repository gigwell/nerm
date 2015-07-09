module.exports = {
  datasets: {
    basic: __dirname + "/basic"
  },
  envs: {
    test: {
      database: function() {
        return 'mongodb://33.33.33.100:27017/nerm-test'
      },
      collections: [
        'resources',
        'nestedresources',
        'childresources'
       ]
    }
  }
}
