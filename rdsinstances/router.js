const router = require('express').Router()
const {
  getRDSInstances
} = require('./getRDSInstances.js')

router.get('/', (req, res) => {
    getRDSInstances()
      .then(data => {
        res.send((data))
      })
      .catch(err => {
        console.error(err)
        res.status(500).json({
          message: 'Internal server error'
        })
      })
  })

  module.exports = { router }