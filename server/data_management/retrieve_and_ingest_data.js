// in server/data_management/retrieve_and_ingest_data.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const client = require('../elasticsearch/client');
require('log-timestamp');

const NEWS_API_URL = 'https://newsapi.org/v2/everything';
const NEWS_API_KEY = '346ada762c194d03bc5bea5423448234'; // Replace with your actual News API key

router.get('/news', async function (req, res) {
  console.log('Loading Application...');
  res.json('Running Application...');

  const indexData = async () => {
    try {
      console.log('Retrieving data from the News API');

      const response = await axios.get(NEWS_API_URL, {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          q: 'latest', // Example query parameter; adjust based on your needs
          apiKey: NEWS_API_KEY,
        },
      });

      console.log('Data retrieved!');

      const results = response.data.articles;

      console.log('Indexing data...');

      results.map(
      async (results) => (
      (newsObject = {
          title: results.title,
          description: results.description,
          content: results.content,
          url: results.url,
          publishedAt: results.publishedAt,
          sourceName: results.source.name,
          author: results.author,
        }),
        await client.index({
          index: 'news',
          id: results.id,
          body: newsObject,
        })
      )
    );

    if (response.data.length) {
      indexData();
    } else {
      console.log('Data has been indexed successfully!');
    }
  } catch (err) {
    console.log(err);
  }

  console.log('Preparing for the next round of indexing...');
};
indexData();
});

module.exports = router;
