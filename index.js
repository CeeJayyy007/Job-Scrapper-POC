const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const { promisify } = require("util");

const app = express();
const PORT = 3030;

const url = "https://laborx.com/vacancies";

// Function to scrape job details
const scrapeJobs = async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    // Simulate scrolling to load more content
    await autoScroll(page);

    // Extract job details
    const jobs = await page.evaluate(() => {
      const jobElements = document.querySelectorAll(".vacancy-card");
      const jobsData = [];
      jobElements.forEach((element) => {
        const title = element
          .querySelector(".card-content h3")
          .innerText.trim();
        const description = element
          .querySelector(".card-content .conditions-info .info-row .info")
          .innerText.trim();
        const company = element
          .querySelector(".card-content .name")
          .innerText.trim();
        jobsData.push({ title, company, description });
      });
      return jobsData;
    });

    await browser.close();

    return jobs;
  } catch (error) {
    console.error(`Error scraping ${url}: ${error}`);
    throw error;
  }
};

// Auto-scroll function to simulate infinite scroll
const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const scrollInterval = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(scrollInterval);
          resolve();
        }
      }, 100); // Adjust scroll speed here
    });
  });
};

// Throttle function to limit the rate of scraping
const throttle = promisify(setTimeout);

// Endpoint to scrape job details
app.get("/", async (req, res) => {
  try {
    // Throttle the rate of scraping (e.g., scrape every 5 seconds)
    await throttle(5000);

    // Scrape job details
    const jobs = await scrapeJobs();

    // Write job details to a CSV file
    const csvContent = jobs
      .map((job) => `${job.title},${job.company},${job.description}`)
      .join("\n");
    fs.writeFileSync("job_details.csv", csvContent, "utf-8");
    res.send("Job details saved to job_details.csv");
  } catch (error) {
    console.error(`Error scraping ${url}: ${error}`);
    res.status(500).send("Internal server error");
  }
});

// Endpoint to download the CSV file
app.get("/download", (req, res) => {
  const filePath = "/path/to/job_details.csv"; // Replace with your file path
  res.download(filePath);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
