// process an image

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
    const s3SourceKey = `${process.env.ORIGINAL_FOLDER_NAME}/${fileName}}`;
    const s3DestinationKey = `${process.env.PROCESSED_FOLDER_NAME}/${fileName}}`;

    // Download an image from S3
    const params = {
        Bucket: process.env.IMAGES_BUCKET_NAME,
        Key: s3SourceKey
    };
    return s3.getObject(params).promise()
        .then((data) => {
            // Write buffer
            const buffer = data.Body;
            // Process Image
            return cropFace(buffer, facialAnalysis);
        })
        .then((outputBuffer) => {
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
    return sizeImage(buffer)
        .then((image) => {
            const face = _.get(facialAnalysis, 'M.FaceDetails.L[0].M.BoundingBox.M', false);
            const faceWidth = face.Width.N * image.width;
            const faceHeight = face.Height.N * image.height;
            const faceX = face.Left.N * image.width;
            const faceY = face.Top.N * image.height;

            // If there is a face in the image, return a crop of the face
            return (face ? cropImage(buffer, facWidth, faceHeight, faceX, faceY) : buffer);
        });
};

// Get the width and height of an image
const sizeImage = (buffer) => {
    return new Promise((resolve, reject) => {
        gm(buffer)
            .size((err, dimensions) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(dimensions);
                }
            });
    });
};

// Crops an image starting from a given x and y coordinate
const cropImage = (buffer, width, height, x, y) => {
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