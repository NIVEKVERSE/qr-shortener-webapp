const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://nivekversedev:Kcc0092$$@cluster0.dyrqifm.mongodb.net/?appName=Cluster0';
const DB_NAME = 'qr_shortener';

let db = null;
let client = null;

const initialize = async () => {
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Create collections if they don't exist
    await db.createCollection('shortened_urls').catch(() => {});
    await db.createCollection('qr_codes').catch(() => {});
    
    // Create indexes
    await db.collection('shortened_urls').createIndex({ code: 1 }, { unique: true }).catch(() => {});
    await db.collection('shortened_urls').createIndex({ created: -1 }).catch(() => {});
    await db.collection('qr_codes').createIndex({ created: -1 }).catch(() => {});
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// ==================== SHORTENED URL FUNCTIONS ====================

const saveShortenedUrl = async (code, originalUrl) => {
  try {
    const result = await db.collection('shortened_urls').insertOne({
      code,
      originalUrl,
      clicks: 0,
      created: new Date(),
      updated: new Date()
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error saving URL:', error);
    throw error;
  }
};

const getUrlData = async (code) => {
  try {
    return await db.collection('shortened_urls').findOne({ code });
  } catch (error) {
    console.error('Error getting URL data:', error);
    throw error;
  }
};

const codeExists = async (code) => {
  try {
    const result = await db.collection('shortened_urls').findOne({ code });
    return !!result;
  } catch (error) {
    console.error('Error checking code:', error);
    throw error;
  }
};

const getAllUrls = async () => {
  try {
    return await db.collection('shortened_urls')
      .find({})
      .sort({ created: -1 })
      .toArray();
  } catch (error) {
    console.error('Error getting all URLs:', error);
    throw error;
  }
};

const incrementClicks = async (code) => {
  try {
    const result = await db.collection('shortened_urls').updateOne(
      { code },
      { 
        $inc: { clicks: 1 },
        $set: { updated: new Date() }
      }
    );
    return result.modifiedCount;
  } catch (error) {
    console.error('Error incrementing clicks:', error);
    throw error;
  }
};

const deleteShortenedUrl = async (code) => {
  try {
    const result = await db.collection('shortened_urls').deleteOne({ code });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting URL:', error);
    throw error;
  }
};

// ==================== QR CODE FUNCTIONS ====================

const saveQRCode = async (id, data, size) => {
  try {
    const result = await db.collection('qr_codes').insertOne({
      _id: id,
      data,
      size,
      created: new Date()
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error saving QR code:', error);
    throw error;
  }
};

const getQRCodeHistory = async () => {
  try {
    return await db.collection('qr_codes')
      .find({})
      .sort({ created: -1 })
      .limit(50)
      .toArray();
  } catch (error) {
    console.error('Error getting QR history:', error);
    throw error;
  }
};

// Close connection
const closeConnection = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
};

module.exports = {
  initialize,
  saveShortenedUrl,
  getUrlData,
  codeExists,
  getAllUrls,
  incrementClicks,
  deleteShortenedUrl,
  saveQRCode,
  getQRCodeHistory,
  closeConnection
};
