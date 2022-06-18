const AWS = require("aws-sdk");

const handleNoSize = require("./handleNoSize");
const handleResize = require("./handleResize");
const handleResized = require("./handleResized");

const S3 = new AWS.S3({
    apiVersion: "2006-03-01",
});

const COLD_BUCKET = process.env.COLD_BUCKET;
const RESIZED_BUCKET = process.env.RESIZED_BUCKET;
const ALLOWED_DIMENSIONS = new Set();

// Allowed dimensions format: "wxh,16x16,28x28"
if (process.env.ALLOWED_DIMENSIONS) {
    const dimensions = process.env.ALLOWED_DIMENSIONS.split(",");
    dimensions.forEach((dimension) => ALLOWED_DIMENSIONS.add(dimension));
}

exports.handler = async (event) => {
    const fileName = event.pathParameters.file;
    const size = event.queryStringParameters.size;

    if (!fileName) throw Error("No file name provided");
    if (!size) return handleNoSize(fileName, COLD_BUCKET, S3);

    if (ALLOWED_DIMENSIONS.size > 0 && !ALLOWED_DIMENSIONS.has(size))
        return {
            statusCode: "403",
            headers: {},
            body: "",
        };

    const resizedKey = size + "." + fileName;

    try {
        return handleResized(resizedKey, RESIZED_BUCKET, S3);
    } catch {
        const split = size.split("x");

        return handleResize(
            fileName,
            resizedKey,
            { width: parseInt(split[0]), height: parseInt(split[1]) },
            COLD_BUCKET,
            RESIZED_BUCKET,
            S3
        );
    }
};