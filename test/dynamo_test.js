var AWS = require("aws-sdk");

var credentials = new AWS.SharedIniFileCredentials({profile: 'gtri'});
AWS.config.credentials = credentials;
AWS.config.update({
  region: "us-east-1"
});

var docClient = new AWS.DynamoDB.DocumentClient();

console.log("Querying for events");

var params = {
    TableName : "trackmymood-online-events-dev",
    KeyConditionExpression: "username = :uname and created between :start and :end",
    ExpressionAttributeValues: {
        ":uname":"camerooni@gmail.com",
        ":start": 0,
        ":end": 1456188455
    }
};

docClient.query(params, function(err, data) {
    if (err) {
        console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.",data.Items);
    }
});

