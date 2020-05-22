const { config, CloudWatch, RDS, SharedIniFileCredentials } = require('aws-sdk')
const express = require('express')
const morgan = require('morgan')
const fs = require('fs')
const open = require('open')
const argv = require('yargs')
    .usage('Usage: $0 --region [str] --profile [str] --startTime [str] --endTime [str] --instance [str] --list')
    .argv

const app = express()
const port = process.env.PORT || "8080"
const rdsCPUUrl = 'http://localhost:8080/rds_writeiops.html'
let endTime = new Date()
let startTime = new Date()
startTime.setDate(endTime.getDate() - 1)

// Set the region
if (argv.region) {
    console.log('region: ' + argv.region)
    config.update({ region: argv.region })
} else {
    console.log('region: us-east-1')
    config.update({ region: 'us-east-1' })
}

// Set the account credentials
if (argv.profile) {
    const credentials = new SharedIniFileCredentials({ profile: argv.profile })
    config.credentials = credentials
    console.log('account: ' + argv.profile)
} else {
    console.log('account: default')
}

// Set period for data gathering
if (argv.startTime) {
    if (argv.endTime) {
        startTime = new Date(argv.startTime)
        endTime = new Date(argv.endTime)
        console.log('start time: ' + startTime)
        console.log('end time: ' + endTime)
    }
}

async function getRDSInstances() {
    let rds = new RDS({ apiVersion: '2014-10-31' })
    let rdsParameters = {}
    const rdsInstanceIdList = []
    const rdsdata = await rds.describeDBInstances(rdsParameters).promise()
    rdsdata.DBInstances.forEach((dbinstance) => {
        rdsInstanceIdList.push(dbinstance.DBInstanceIdentifier)
    })
    console.log(rdsInstanceIdList.length + ' RDS Instances found: ')
    console.log(rdsInstanceIdList)
    return rdsInstanceIdList
}

async function getCWMetrics(rdsInstance) {
    const metricsDataArray = []
    const cw = new CloudWatch({ apiVersion: '2010-08-01' })
    const cwParameters = {
        Dimensions: [
            {
                Name: 'DBInstanceIdentifier',
                Value: rdsInstance
            },
        ],
        MetricName: 'WriteIOPS',
        Namespace: 'AWS/RDS',
        Statistics: [
            'Sum'
        ],
        Period: 3600,
        StartTime: startTime,
        EndTime: endTime
    }
    const cwdata = await cw.getMetricStatistics(cwParameters).promise()
    cwdata.Datapoints.forEach((metric) => {
        metricsDataArray.push(
            {
                x: metric.Timestamp,
                y: metric.Sum
            }
        )
    })
    return {
        rdsInstance,
        metricsDataArray
    }
}

async function writeJSON(jsonFileData) {
    const jsonData = JSON.stringify(jsonFileData, null, 2);
    fs.writeFileSync(`./public/rds_writeiops.json`, jsonData)
}

getRDSInstances()
    .then((rdsInstanceIdList) => {
        if (!argv.list) {
            if (rdsInstanceIdList.includes(argv.instance)) {
                getCWMetrics(argv.instance)
                    .then((results) => writeJSON(results))
                    .then(() => {
                        app.use(express.static('public'))
                        app.use(morgan('common'))
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
                        app.use(function (error, req, res, next) {
                            res.status(500).json({ message: error.message })
                        })
                        // catch-all endpoint if client makes request to non-existent endpoint
                        app.use('*', function (req, res) {
                            res.status(404).json({ message: 'Not Found' })
                        })
                        app.listen(port, () => {
                            console.log(`Listening to requests on http://localhost:${port}`)
                        })
                    })
                    .then(() => open(rdsCPUUrl))
                    .catch((err) => console.log(err))
            } else {
                console.log('exiting.')
            }
        }
    })