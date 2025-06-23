const fs = require('fs');
const path = require('path');

const logoPath = path.join(rootDir, 'public', 'temp', 'company_logo.jpg');

let logoBase64 = '';
try {
    const imageBuffer = fs.readFileSync(logoPath);
    const fileExtension = path.extname(logoFileName).toLowerCase();
    const mimeType = fileExtension === '.jpg' || fileExtension === '.jpeg'
        ? 'image/jpeg'
        : 'image/png';

    logoBase64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
} catch (err) {
    console.error('⚠️ Failed to load logo image. Check file path:', logoPath);
    logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...'; // Or provide a fallback base64 string if needed
}
