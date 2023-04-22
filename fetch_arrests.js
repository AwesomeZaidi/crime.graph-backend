const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

// Replace the following with your MongoDB Atlas connection string
const mongoDBConnectionString = 'mongodb+srv://asimzaidi:Mdmr2ohIgPOKhzOs@cluster0.f6gxrln.mongodb.net/?retryWrites=true&w=majority';

// Function to fetch arrest data for a specific date
const fetchArrests = async () => {
    let allArrests = [];
    let offset = 0;
    const limit = 1000;
  
    while (true) {
      const url = `https://data.cityofchicago.org/resource/dpt3-jri9.json?$limit=${limit}&$offset=${offset}`;
      const response = await fetch(url);
      const arrests = await response.json();
  
      if (arrests.length === 0) {
        break;
      }
  
      console.log('arrests.length:', arrests.length);
      allArrests = allArrests.concat(arrests);
      offset += limit;
    }
  
    return allArrests;
};
// Function to store arrest data in MongoDB
const storeArrestsInMongoDB = async (arrests) => {
  const client = new MongoClient(mongoDBConnectionString, { useNewUrlParser: true, useUnifiedTopology: true });

  if (!Array.isArray(arrests)) {
    throw new TypeError('Arrests must be an array');
  }

  try {
    await client.connect();
    const db = client.db('your_db_name');
    const arrestsCollection = db.collection('arrests');

    // Upsert arrest data to avoid duplicate entries
    for (const arrest of arrests) {
      await arrestsCollection.updateOne(
        { case_number: arrest.case_number },
        { $set: arrest },
        { upsert: true }
      );
    }
  } finally {
    await client.close();
  }
};

// Main function to fetch and store arrest data
const main = async () => {
    try {
        const arrests = await fetchArrests();
        console.log(`Fetched ${arrests.length} arrest records`);
        await storeArrestsInMongoDB(arrests);
        console.log(`Stored ${arrests.length} arrest records in MongoDB`);
      } catch (error) {
        console.error(`An error occurred: ${error}`);
      }
}

main();
