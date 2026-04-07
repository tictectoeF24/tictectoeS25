// scripts/generateProcessedJson.js
require('dotenv').config();
const { generateProcessedPaperJsonForDoi } = require('../controllers/paperController');

const doi = process.argv[2];
if (!doi) {
  console.error('Usage: node scripts/generateProcessedJson.js <doi>');
  process.exit(1);
}

generateProcessedPaperJsonForDoi(doi)
  .then((result) => {
    console.log('Processed JSON saved for DOI:', doi);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
