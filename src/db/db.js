const mongoose = require("mongoose");
const previewSchema = require("./previews-schema");
const filesSchema = require("./files-schema");

let fileId = "";

function connect(url, callback) {
    mongoose
        .connect(url, { useNewUrlParser: true })
        .then(() => {
            if (callback && typeof callback === "function") {
                callback();
            }
        })
        .catch((error) => {
            if (callback && typeof callback === "function") {
                callback(error);
            }
        });
}

function upsertFile(fileUrl, callback) {
    filesSchema.fileCollection.findOneAndUpdate(
        { url: fileUrl },
        { url: fileUrl },
        { upsert: true, new: true },
        (error, doc) => {
            if (error) {
                return callback(error, null);
            }
            fileId = doc._id.toString();
            return deleteCollection(callback);
        });
}

function insertRecords(records, callback) {
    if (!records || !records.length) {
        if (callback && typeof callback === "function") {
            callback();
        }
        return;
    }

    const previews = records.reduce((previews, record, index) => {
        previews.push({
            preview: record
        });
        return previews;
    }, []);

    const previewCollection = previewSchema.previewCollection(fileId);

    previewCollection.insertMany(previews, (error, docs) => {
        if (error) {
            if (callback && typeof callback === "function") {
                callback(error);
            }
            return;
        }
        return callback(null, docs);
    });

}

function deleteCollection(callback) {
    mongoose.connection.db.dropCollection(`previews_${fileId}`, (error, result) => {
        if (callback && typeof callback === "function") {
            callback(null, fileId);
        }
    });
}

module.exports = {
    connect: connect,
    upsertFile: upsertFile,
    insertRecords: insertRecords
};