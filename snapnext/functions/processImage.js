// process an image

// Note this doesn't work as ImageMagick
// no longer pre-installed with Lambda
// Nodejs 12.x runtime

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const gm = require('gm').subClass({ imageMagick: true });

const s3 = new AWS.S3();

module.exports.handler = (event, context, callback) => {
    console.log('Starting Image Processing...');
    const { facialAnalysis, id } = event.Records[0].dynamodb.NewImage;
    const fileName = id.S;
    const s3SourceKey = `${process.env.ORIGINAL_FOLDER_NAME}/${fileName}`;
    const s3DestinationKey = `${process.env.PROCESSED_FOLDER_NAME}/${fileName}`;

    console.log(facialAnalysis);
    console.log(id);
    console.log(s3SourceKey);
    console.log(s3DestinationKey);

    // Download an image from S3
    const params = {
        Bucket: process.env.IMAGES_BUCKET_NAME,
        Key: s3SourceKey
    };
    console.log(params);
    return s3.getObject(params).promise()
        .then((data) => {
            console.log('Retrieved Source Image from S3...');
            // Write buffer
            const buffer = data.Body;
            // Process Image
            return cropFace(buffer, facialAnalysis);
        })
        .then((outputBuffer) => {
            console.log('Uploading Target Image to S3...');
            return s3.putObject({
                Bucket: process.env.IMAGES_BUCKET_NAME,
                Key: s3DestinationKey,
                Body: outputBuffer
            }).promise();
        })
        .then((res) => {
            callback(null, { success: true });
        });
};

// Image Processing Helper Functions

// crop a face, if any
const cropFace = (buffer, facialAnalysis) => {
    console.log('Cropping Face...');
    console.log(buffer);
    console.log(facialAnalysis);
    return sizeImage(buffer)
        .then((image) => {
            const face = _.get(facialAnalysis, 'M.FaceDetails.L[0].M.BoundingBox.M', false);
            const faceWidth = face.Width.N * image.width;
            const faceHeight = face.Height.N * image.height;
            const faceX = face.Left.N * image.width;
            const faceY = face.Top.N * image.height;

            console.log('face: ', face);
            console.log('faceWidth: ', faceWidth);
            console.log('faceHeight: ', faceHeight);
            console.log('faceX: ', faceX);
            console.log('faceY: ', faceY);

            // If there is a face in the image, return a crop of the face
            return (face ? cropImage(buffer, faceWidth, faceHeight, faceX, faceY) : buffer);
        });
};

// Get the width and height of an image
const sizeImage = (buffer) => {
    console.log('Resizing Image...');
    return new Promise((resolve, reject) => {
        gm(buffer)
            .size((err, dimensions) => {
                console.log('sizeImage callback...');
                if (err) {
                    console.log('sizeImage callback err...');
                    console.log(err);
                    reject(err);
                } else {
                    console.log('sizeImage callback resolve...');
                    console.log(dimensions);
                    resolve(dimensions);
                }
            });
    });
};

// Crops an image starting from a given x and y coordinate
const cropImage = (buffer, width, height, x, y) => {
    console.log('Cropping Image...');
    return new Promise((resolve, reject) => {
        gm(buffer)
            .crop(width, height, x, y)
            .toBuffer((err, buf) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(buf);
                }
            });
    });
};