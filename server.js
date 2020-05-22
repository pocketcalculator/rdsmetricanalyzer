const { config, SharedIniFileCredentials } = require('aws-sdk')
const bodyParser = require('body-parser')
const express = require('express')
const morgan = require('morgan')

const argv = require('yargs')
    .usage('Usage: $0 --region [str] --profile [str]')
    .argv

const app = express()
const port = process.env.PORT || "8080"
const { router: listRdsInstancesRouter } = require('./rdsinstances')
const { router: listRdsDetailsRouter } = require('./rdsdetails')
//const { router: showRdsCPUMetricsRouter } = require('./rdscpumetrics')

// Set the AWS region
if (argv.region) {
    console.log('region: ' + argv.region)
    config.update({ region: argv.region })
} else {
    console.log('region: us-east-1')
    config.update({ region: 'us-east-1' })
}

// Set the AWS account credentials
if (argv.profile) {
    const credentials = new SharedIniFileCredentials({ profile: argv.profile })
    config.credentials = credentials
    console.log('account: ' + argv.profile)
} else {
    console.log('account: default')
}

app.use(express.static('public'))
app.use(morgan('common'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE')
    if (req.method === 'OPTIONS') {
        return res.send(204)
    }
    next()
})

app.get('/', (request, res) => {
    res.sendFile(__dirname + '/public/index.html')
    res.status('200').json()
})

app.use('/api/rdsinstances/', listRdsInstancesRouter)
app.use('/api/rdsdetails', listRdsDetailsRouter)
//app.use('/api/rdscpumetrics/', showRdsCPUMetricsRouter)

app.use(function (error, req, res, next) {
    res.status(500).json({ message: error.message })
})

// catch-all endpoint if client makes request to non-existent endpoint
app.use('*', function (req, res) {
    res.status(404).json({ message: 'Not Found' })
})

const server = app.listen(port, () => {
    console.log(`Your app is listening on port ${port}`)
})

module.exports = { app, config }