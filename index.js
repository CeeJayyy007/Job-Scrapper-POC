const express = require("express");
const puppeteer = require("puppeteer");
const { createObjectCsvWriter } = require("csv-writer");

const app = express();
const PORT = 3030;

const urls = ["https://laborx.com/vacancies", "https://aquent.com/find-work"];

console.log("urls", urls[1]);

// Function to scrape job details
const scrapeJobs = async (url, numOfJobsToScrape) => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();

    console.log("Scraping URL: ", url);

    await page.goto(url);

    if (url.includes("laborx.com")) {
      const jobs = await scrapeInfiniteScrollItems(page, numOfJobsToScrape);
      await browser.close();
      return jobs;
    } else if (url.includes("aquent.com")) {
      const jobs = await scrapeWithPagination(page, numOfJobsToScrape, url);
      await browser.close();
      return jobs;
    }
  } catch (error) {
    console.error(`Error scraping ${url}: ${error}`);
    throw error;
  }
};

// Function to handle pagination
const scrapeWithPagination = async (page, numOfJobsToScrape, baseUrl) => {
  let items = [];
  let currentPage = 1;
  let continueScraping = true;

  while (continueScraping && items.length < numOfJobsToScrape) {
    const url = `${baseUrl}?page=${currentPage}`;
    await page.goto(url, { waitUntil: "networkidle0" });

    const newItems = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(".job-card");
      const pageItems = [];

      jobElements.forEach((element) => {
        const title = element
          .querySelector(".job-card__title")
          .innerText.trim();

        const location = element
          .querySelector(".job-card__location")
          .innerText.trim();

        const url = element.href;

        pageItems.push({ title, location, url });
      });

      return pageItems;
    });

    items.push(...newItems);
    currentPage++;
    continueScraping = newItems.length > 0;

    // Delay between each page request
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return items.slice(0, numOfJobsToScrape);
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

        const url = element.querySelector(
          ".lx-button.lx-blue-btn.details-btn"
        ).href;

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

// Define route to scrape job details
app.get("/:numOfJobsToScrape", async (req, res) => {
  try {
    const numOfJobsToScrape = parseInt(req.params.numOfJobsToScrape);
    if (isNaN(numOfJobsToScrape)) {
      throw new Error("Invalid number of jobs to scrape.");
    }

    const jobsPerSite = numOfJobsToScrape / urls.length;

    let combinedJobs = [];

    // Initialize CSV writer
    const csvWriter = createObjectCsvWriter({
      path: "jobs.csv",
      header: [
        { id: "title", title: "Title" },
        { id: "company", title: "Company" },
        { id: "location", title: "Location" },
        { id: "description", title: "Description" },
        { id: "url", title: "URL" },
      ],
    });

    for (const url of urls) {
      const jobs = await scrapeJobs(url, jobsPerSite);
      combinedJobs = combinedJobs.concat(jobs);
    }

    await csvWriter.writeRecords(combinedJobs);

    res.json(combinedJobs);

    // res.status(200).send("CSV file created successfully.");
  } catch (error) {
    console.error(`Error scraping : ${error}`);
    res.status(500).send("Internal server error");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
