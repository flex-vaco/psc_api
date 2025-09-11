const { chromium } = require('playwright');
const https = require('https');
const http = require('http');

async function downloadPdfFromUrl(pdfUrl) {
  return new Promise((resolve, reject) => {
    const client = pdfUrl.startsWith('https:') ? https : http;
    
    const request = client.get(pdfUrl, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download PDF. Status code: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const base64String = buffer.toString('base64');
        
        resolve({
          base64: base64String,
          size: buffer.length,
          buffer: buffer
        });
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

async function extractPdfFromPage(pageUrl) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(pageUrl, { waitUntil: 'load' });
    await page.waitForTimeout(5000);
    const frames = page.frames();
    
    const frame = await page.frame({ name: 'mainFrame' });

    if (frame) {
      try {
        await frame.waitForLoadState('load', { timeout: 10000 });
      } catch (error) {
        // Frame load timeout, proceeding anyway
      }

      const frameContent = await frame.content();
      const urlMatch = frameContent.match(/https:\/\/pdfnet\.lockton\.com\/previewliabilityholder\.aspx\?[^"'<> ]+/);

      if (urlMatch && urlMatch[0]) {
        const pdfUrl = urlMatch[0];
        const pdfData = await downloadPdfFromUrl(pdfUrl);
        return {
          success: true,
          base64: pdfData.base64,
          size: pdfData.size,
          pdfUrl: pdfUrl
        };
      } else {
        throw new Error('Could not extract PDF URL from frame content.');
      }
    } else {
      throw new Error('mainFrame not found.');
    }
  } finally {
    await browser.close();
  }
}

const extractPdf = async (req, res) => {
  try {
    const { pageUrl } = req.body;
    
    if (!pageUrl) {
      return res.status(400).json({
        success: false,
        error: 'pageUrl is required in request body'
      });
    }

    const result = await extractPdfFromPage(pageUrl);
    
    res.json({
      success: true,
      data: {
        base64: result.base64,
        size: result.size,
        pdfUrl: result.pdfUrl
      }
    });
    
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  extractPdf
};
