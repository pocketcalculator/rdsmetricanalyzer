const {
    RDS
} = require('aws-sdk')

async function getRDSdetails(instanceId) {
    let rds = new RDS({
        apiVersion: '2014-10-31'
    })
    let rdsParameters = {
        DBInstanceIdentifier:   instanceId
    }
    const rdsdata = await rds.describeDBInstances(rdsParameters).promise()
    return rdsdata.DBInstances
}

module.exports = {
    getRDSdetails
}