import mongoose from "mongoose";

let connectionPromise;

const mongoStates = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export async function connectToMongo(mongodbUri) {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
  }

  try {
    await connectionPromise;
    return mongoose.connection;
  } catch (error) {
    connectionPromise = undefined;
    throw error;
  }
}

export function getMongoStatus() {
  return mongoStates[mongoose.connection.readyState] || "unknown";
}
