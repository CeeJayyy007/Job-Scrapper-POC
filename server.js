const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const fs = require('fs');

const app = express();
const PORT = 3030;

const url = 'https://laborx.com/vacancies';


app.get('/', async (req, res) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Extract job details
        const jobs = [];
        $('div.page-content')
            .find('.vacancy-card')
            .each((index, element) => {
                const title = $(element).find('.card-content h3').text().trim();
                const description = $(element)
                    .find('.card-content .conditions-info .info-row .info')
                    .text()
                    .trim();
                const company = $(element)
                    .find('.card-content .name')
                    .text()
                    .trim();

                // Push job details to the jobs array
                jobs.push({ title, company, description });
            });

        // Write job details to a CSV file
        const csvContent = jobs
            .map((job) => `${job.title},${job.company},${job.description}`)
            .join('\n');
        fs.writeFileSync('job_details.csv', csvContent, 'utf-8');
        res.send('Job details saved to job_details.csv');
    } catch (error) {
        console.error(`Error scraping ${url}: ${error}`);
    }
     
});

// download the file
app.get('/download', (req, res) => {
    const filePath = '/Users/toheeb/Documents/Job-scraping-api/job_details.csv'; //replace with your file path
    res.download(filePath); 
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
