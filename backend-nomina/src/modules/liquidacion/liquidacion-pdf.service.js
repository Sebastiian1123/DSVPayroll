const puppeteer = require('puppeteer');
const { buildLiquidacionPdfTemplate } = require('./liquidacion-pdf.template');

const generateLiquidacionPdfBuffer = async ({ liquidacion, detalle, empleado }) => {
  let browser;

  try {
    const html = buildLiquidacionPdfTemplate({ liquidacion, detalle, empleado });

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = { generateLiquidacionPdfBuffer };
