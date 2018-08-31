'use strict';

var aws = require('aws-sdk');


exports.handler = function(event, context, callback) {
    var request = event.Records[0].cf.request;

    var s3 = new aws.S3();
    if (/\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[^\.\/]+\.jpg$/i.test(request.uri)) {
        request.uri = request.uri.replace(/\/[^\.\/]+\.jpg$/, '.jpg');
    }
    s3.headObject({
        Bucket: "cloudinary-cache",
        Key: request.uri.substr(1)
    }, function (err, _metadata) {
        if (err) {
            return fetchObject(callback, request);
        } else {
            return callback(null, request);
        }
    });
};

var fetchObject = function(callback, request){
    var lambda = new aws.Lambda({
        region: 'us-east-1'
    });

    lambda.invoke({
        FunctionName: 'CloudinaryCache-Fetch',
        Payload: JSON.stringify({path: request.uri.substr(1)}, null, 2)
    }, function(error, data) {
        if (error || data.error) {
            request.uri = "/not_found.jpg";
        }
        return callback(null, request);
    });
};
