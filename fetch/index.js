'use strict';

var aws = require('aws-sdk');
var request = require('request');
var s3 = new aws.S3();
var cloudinary = require('cloudinary');
var transformationMap = {
    product: ['xs','s','m','l','xl']
};

exports.handler = function(event, context, callback) {
    cloudinary.config({
        cloud_name: process.env.cloudinaryName,
        api_key: process.env.cloudinaryAPIKey,
        api_secret: process.env.cloudinaryAPISecret
    });

    var cloudinaryPath = event.path;
    var match = /product\/([^\/]+)\/.*/.exec(cloudinaryPath);
    if (match) {
        var size = match[1];
        if (transformationMap.product.indexOf(size) > -1) {
            var transformations = {transformation: 'product_'+size};
        } else {
            callback(null);
            return;
        }
    } else {
        transformations = {quality: process.env.cloudinaryQuality};
    }
    var url = cloudinary.url(cloudinaryPath, transformations);
    var requestOptions = {
        uri: url,
        encoding: null
    };

    request.get(requestOptions, function(error, response, body){
        if (error) {
            console.log('Failed to fetch url', url, response.statusCode);
            return callback(error);
        }
        var params = {
            ACL: "public-read",
            Body: body,
            Bucket: "cloudinary-cache",
            ContentType: response.headers['content-type'],
            Key: event.path
        };
        s3.upload(params, function (err, data) {
            callback(err, data);
        });
    });
};
