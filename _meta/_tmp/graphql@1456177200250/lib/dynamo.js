import Promise from 'bluebird';
import AWS from 'aws-sdk';
const dynamoConfig = {
  sessionToken:    process.env.AWS_SESSION_TOKEN,
  region:          process.env.AWS_REGION
};
const docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
const stage = process.env.SERVERLESS_STAGE;
const projectName = process.env.SERVERLESS_PROJECT_NAME;

const postsTable = projectName + '-posts-' + stage;
const authorsTable = projectName + '-authors-' + stage;
const commentsTable = projectName + '-comments-' + stage;
const eventsTable = projectName + '-events-' + stage;

export function createEvent(evt) {
    return new Promise(function(resolve,reject) {
        var params = {
            TableName: eventsTable,
            Item: evt
        };

        docClient.put(params, function(err,data) {
            if (err) return reject(err);
            return resolve(evt);
        });
    });
}

export function getEvents(user,start,end) {
    return new Promise(function(resolve,reject) {
        var params = {
            TableName: eventsTable,
            KeyConditionExpression: "user = :user and created >= :start and created <= :end",
            ExpressionAttributeValues: {
                ':user': user,
                ':start': start,
                ':end': end
            },
            Select: 'ALL_ATTRIBUTES'
        };

        docClient.query(params, function(err,data) {
            if (err) return reject(err);
            return resolve(data["Items"]);
        });

    });
}

export function createPost(post) {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: postsTable,
      Item: post
    };

    docClient.put(params, function(err, data) {
      if (err) return reject(err);
      return resolve(post);
    });

  });
}

export function getPosts() {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: postsTable,
      AttributesToGet: [
        'id',
        'title',
        'author',
        'bodyContent'
      ]
    };

    docClient.scan(params, function(err, data) {
      if (err) return reject(err);
      return resolve(data["Items"]);
    });

  });
}

export function getAuthor(id) {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: authorsTable,
      Key: {
        id: id
      },
      AttributesToGet: [
        'id',
        'name'
      ]
    };

    docClient.get(params, function(err, data) {
      if (err) return reject(err);
      return resolve(data["Item"]);
    });

  });
}

export function getAuthors() {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: authorsTable,
      AttributesToGet: [
        'id',
        'name'
      ]
    };

    docClient.scan(params, function(err, data) {
      if (err) return reject(err);
      return resolve(data["Items"]);
    });

  });
}

export function getComments() {
  return new Promise(function(resolve, reject) {
    var params = {
      TableName: commentsTable,
      AttributesToGet: [
        'id',
        'content',
        'author'
      ]
    };

    docClient.scan(params, function(err, data) {
      if (err) return reject(err);
      return resolve(data["Items"]);
    });

  });
}
