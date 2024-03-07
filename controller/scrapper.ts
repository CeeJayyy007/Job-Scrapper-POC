import puppeteer from "puppeteer";

interface ScrapeConfig {
  data: ScrapeData;
  pagination: unknown;
  infiniteScroll: unknown;
  noOfJobs: number;
}

interface ScrapeData {
  title: string;
  url: string;
  location: string;
  description: string;
  company: string;
}

class Scrapper {
  private config: ScrapeConfig;

  constructor(config: ScrapeConfig) {
    this.config = config;
  }

  async scrape(initialUrl: string) {
    const { infiniteScroll, pagination } = this.config;
    const browser = await puppeteer.launch({
      headless: false,
    });

    const page = await browser.newPage();
    await page.goto(initialUrl);

    let jobs = [];

    if (infiniteScroll) {
      // infinite thingy
    } else if (pagination) {
      // pagination thingy
    } else {
    }

    await browser.close();
    return jobs;
  }
}
