# Job Scraper App - POC

This POC is a Node.js application scrapes job listings from a specified URL and given a number of jobs to scrape would aved the scraped job to a CSV file. It provides an API endpoint to initiate the scraping process and expects a parameter to be provided in the url.

## How to Use

### Clone the Repository

```bash
git clone -b puppeteer-scraper https://github.com/OlushesiToheeb/Job-Scrapper-POC.git
```

### Install Dependencies

```bash
npm install
```

### Run the Application

```bash
npm run dev
```

- Note: The server will start running on port 3030 by default.

## API Endpoint

### POST /scrape

```bash
localhost:3000/:numOfJobsToScrape

example: localhost:3000/100
```

Initiates the scraping process to extract job listings from the provided URL.

### Response

- Success: If the scraping process is successful, a CSV file named jobs.csv will be created in the root directory of the application and a success message "CSV file created successfully" will be logged in the console.

- Error: If an error occurs during the scraping process, an appropriate error message will be returned.
