// analyze an image loaded into S3 bucket

const AWS = require('aws-sdk');

// Initialize AWS SDK
const rek = new AWS.Rekognition();
const db = new AWS.DynamoDB.DocumentClient();

// handler
module.exports.handler = (event, context, callback) => {
    const s3Key = event.Records[0].s3.object.key;   // parse event
    const imageId = s3Key.replace(`${process.env.ORIGINAL_FOLDER_NAME}/`, '');

    const detectFacesParams = {
        Image: {
            S3Object: {
                Bucket: process.env.IMAGES_BUCKET_NAME,
                Name: s3Key
            },
        },
        Attributes: [
            'ALL',
        ],
    };

    // perform the recognition
    return rek.detectFaces(detectFacesParams).promise()
            .then((facialAnalysisResult) => {
                const putParams = {
                    Item: {
                        id: imageId,
                        facialAnalysis: facialAnalysisResult,
                        timestamp: Date.now()
                    },
                    TableName: process.env.IMAGES_TABLE_NAME
                };
                // save analysis results to DynamoDB
                return db.put(putParams).promise();
            })
            .then(() => {
                const response = {
                    statusCode: 201,
                    body: JSON.stringify({ success: true })
                };
                callback(null, response);
            });
};