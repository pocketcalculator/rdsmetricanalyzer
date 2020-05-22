const { RDS } = require('aws-sdk')

async function getRDSInstances() {
    let rds = new RDS({ apiVersion: '2014-10-31' })
    let rdsParameters = {}
    const rdsInstanceIdList = []
    const rdsdata = await rds.describeDBInstances(rdsParameters).promise()
    rdsdata.DBInstances.forEach((dbinstance) => {
        rdsInstanceIdList.push(dbinstance.DBInstanceIdentifier)
    })
    return rdsInstanceIdList
}

module.exports = { getRDSInstances }