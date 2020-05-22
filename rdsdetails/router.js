const router = require('express').Router()
const bodyParser = require('body-parser')
const querystring = require('querystring')

const {
  getRDSdetails
} = require('./getRDSdetails.js')

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json())
router.get('/', (req, res) => {
    const instanceId = req.query.instanceId
    getRDSdetails(instanceId)
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