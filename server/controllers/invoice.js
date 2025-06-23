const pdf = require('html-pdf');
const fs = require('fs/promises');
const fsc = require('fs'); // for fileExistsSync
const path = require('path');
const DefaultTemplate = require('../invoices/index.js');
const { getNextInvoiceNumber } = require('../utils/invoiceUtils');

const publicTempDir = 'public/temp';
const rootDir = path.resolve(__dirname, '../');

const createInvoice = async (req, res) => {
  try {
    const invoiceData = JSON.parse(req.body.invoiceData || '{}');

    if (!invoiceData || Object.keys(invoiceData).length === 0) {
      return res.status(400).json({ message: 'Invalid or empty payload' });
    }

    // 🔢 Generate persistent invoice number
    const newInvoiceNumber = await getNextInvoiceNumber();
    invoiceData.details.invoiceNumber = newInvoiceNumber;

    // 🔧 Ensure public/temp directory exists
    const tempDirPath = path.join(rootDir, publicTempDir);
    if (!fsc.existsSync(tempDirPath)) {
      await fs.mkdir(tempDirPath, { recursive: true });
    }

    // 🖼️ Upload logo image if present
    if (req.files && req.files.companyLogo) {
      const companyLogo = req.files.companyLogo;
      const allowedExtensions = ['.png', '.jpg', '.jpeg'];
      const fileExtension = path.extname(companyLogo.name).toLowerCase();
      const fileName = `invoiceLogo${fileExtension}`;
      const savePath = path.join(tempDirPath, fileName);

      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ message: 'Unsupported file format' });
      }

      // Correct use of callback-style mv
      await new Promise((resolve, reject) => {
        companyLogo.mv(savePath, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      invoiceData.details.companyLogo = fileName;
    }

    // 📝 Write HTML file
    const htmlContent = DefaultTemplate(invoiceData).trim();
    const htmlPath = path.join(tempDirPath, 'invoice.html');
    await fs.writeFile(htmlPath, htmlContent, 'utf8');

    // 📄 Read HTML content
    const invoiceHtml = await fs.readFile(htmlPath, 'utf8');

    // 📄 PDF options
    const options = {
      width: '200mm',             // ~3.1 inches width (shop bill size)
      height: '230mm',            // ~8 inches tall, adjust as needed
      border: '5mm',
      base: `file:///${tempDirPath}/`,
      localUrlAccess: true,
      footer: {
        height: '10mm',
        contents:
          `<p style="text-align:center; margin: 0; font-size: 20px;">
             Thank you ! Visit us again.
           </p>`,
      },
    };

    // 🧾 Generate PDF
    const pdfPath = path.join(tempDirPath, 'invoice.pdf');
    pdf.create(invoiceHtml, options).toFile(pdfPath, (err) => {
      if (err) {
        console.error('PDF generation error:', err);
        return res.status(500).json({ message: 'Error generating PDF' });
      }

      res.json({
        message: 'Invoice created successfully',
        invoiceNumber: newInvoiceNumber,
      });
    });
  } catch (err) {
    console.error('Error in createInvoice:', err);
    res.status(500).json({ message: 'Server error creating invoice' });
  }
};

const sendInvoice = (req, res) => {
  const pdfPath = path.join(rootDir, publicTempDir, 'invoice.pdf');
  if (!fsc.existsSync(pdfPath)) {
    return res.status(404).json({ message: 'Invoice not found' });
  }
  res.sendFile(pdfPath);
};

module.exports = { createInvoice, sendInvoice };
