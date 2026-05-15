const puppeteer = require('puppeteer');
const { buildPayrollReportPdfTemplate } = require('./payroll-report-pdf.template');

const generatePayrollReportPdfBuffer = async ({ rows, resumen, filtros }) => {
  let browser;

  try {
    const html = buildPayrollReportPdfTemplate({ rows, resumen, filtros });

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    return await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '18px',
        right: '18px',
        bottom: '18px',
        left: '18px'
      }
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  generatePayrollReportPdfBuffer
};
