// download an image from a URL

// Sample Image URL - https://dhei5unw3vrsx.cloudfront.net/images/drive_resized.jpg
// e.g.
// {
//  "imageUrl": "<imageUrl>"   
// }

const fetch = require('node-fetch');
const Haikunator = require('haikunator');
const AWS = require('aws-sdk');

const haikunator = new Haikunator();
const s3 = new AWS.S3();

// handler function
module.exports.handler = (event, context, callback) => {
    const args = JSON.parse(event.body);
    const imageId = haikunator.haikunate(); // generate an ID
    return fetch(args.imageUrl) // Download image from URL
            .then((res) => {
                if (res.ok) {
                    return res;
                }
                return Promise.reject(new Error(`Failed to fetch ${res.url}: ${res.status} ${res.statusText}`));
            })
            .then(res => res.buffer())
            .then((buffer) => {
                // upload image to S3
                const bucketName = process.env.IMAGES_BUCKET_NAME;
                return s3.putObject({
                    Bucket: bucketName,
                    Key: `${process.env.ORIGINAL_FOLDER_NAME}/${imageId}.png`,
                    Body: buffer,
                    ACL: 'public-read'
                }).promise();
            })
            .then((res) => {
                // Success Response
                const response = {
                    statusCode: 200,
                    body: JSON.stringify({
                        id: imageId
                    }),
                }
                callback(null, response);
            })
            .catch((err) => {
                // Error Response
                const response = {
                    statusCode: 500,
                    error: err.message
                };
                callback(null, response)
            });
};