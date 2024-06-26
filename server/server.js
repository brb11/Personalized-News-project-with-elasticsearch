const { Client } = require('@elastic/elasticsearch');
const client = require('./elasticsearch/client');
const express = require('express');
const cors = require('cors');

const app = express();

const data = require('./data_management/retrieve_and_ingest_data');

app.use('/ingest_data', data);

app.use(cors());

app.get('/results', (req, res) => {
  const passedKeyword = req.query.q;
  const passedCountry = req.query.country;
  const passedDateRange = req.query.dateRange;
  const passedSortOption = req.query.sortOption || 'desc';

  async function sendESRequest() {
    const query = {
      bool: {
        must: [],
        filter: [
          {
            range: {
              publishedAt: {
                gte: `now-${passedDateRange}d/d`,
                lt: 'now/d',
              },
            },
          },
        ],
      },
    };

    if (passedKeyword) {
      query.bool.must.push({
        multi_match: {
          query: passedKeyword,
          fields: ['title', 'sourceName', 'description', 'content', 'author'],
        },
      });
    }


    const body = await client.search({
      index: 'news',
      body: {
        sort: [
          {
            publishedAt: {
              order: passedSortOption,
            },
          },
        ],
        size: 300,
        query: query,
      },
    });
    res.json(body.hits.hits);
  }

  sendESRequest().catch((error) => {
    console.error(error);
    res.status(500).send('An error occurred while processing your request.');
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`Server started on ${PORT}`));
