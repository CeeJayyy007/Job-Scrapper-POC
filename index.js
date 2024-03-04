const express = require("express");
const puppeteer = require("puppeteer");
const { createObjectCsvWriter } = require("csv-writer");

const app = express();
const PORT = 3030;

const url = "https://laborx.com/vacancies";

// Function to scrape job details
const scrapeJobs = async (numOfJobsToScrape) => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    await page.goto(url);

    // Simulate scrolling to load more content
    const jobs = await scrapeInfiniteScrollItems(page, numOfJobsToScrape);

    await browser.close();

    return jobs;
  } catch (error) {
    console.error(`Error scraping ${url}: ${error}`);
    throw error;
  }
};

// Auto-scroll function to simulate infinite scroll
const scrapeInfiniteScrollItems = async (page, numOfJobsToScrape) => {
  let items = [];

  while (numOfJobsToScrape > items.length) {
    items = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(".vacancy-card");
      const jobsData = [];

      jobElements.forEach((element) => {
        const title = element
          .querySelector(".card-content .vacancy-name")
          .innerText.trim();

        const description = element
          .querySelector(".card-content .conditions-info .description")
          .innerText.trim()
          .split(/\s+/)
          .slice(0, 20)
          .join(" ");

        const company = element
          .querySelector(".card-content .name")
          .innerText.trim();

        const url = element.querySelector(".card-content a").href;

        jobsData.push({ title, company, description, url });
      });

      return jobsData;
    });

    previousHeight = await page.evaluate("document.body.scrollHeight");
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    await page.waitForFunction(
      `document.body.scrollHeight > ${previousHeight}`
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return items;
};

// Endpoint to scrape job details
app.get("/:numOfJobsToScrape", async (req, res) => {
  try {
    const numOfJobsToScrape = req.params.numOfJobsToScrape;
    const jobs = await scrapeJobs(numOfJobsToScrape);

    // Initialize CSV writer
    const csvWriter = createObjectCsvWriter({
      path: "jobs.csv",
      header: [
        { id: "title", title: "Title" },
        { id: "company", title: "Company" },
        { id: "description", title: "Description" },
        { id: "url", title: "URL" },
      ],
    });

    // Write job details to a CSV file
    await csvWriter.writeRecords(jobs);

    res.status(200).send("CSV file created successfully.");
  } catch (error) {
    console.error(`Error scraping ${url}: ${error}`);
    res.status(500).send("Internal server error");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
