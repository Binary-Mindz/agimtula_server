import * as fs from 'fs';
import * as path from 'path';
export function uploadPdf(file: Express.Multer.File) {
  try {
    // const savePdf = path.join(__dirname, '/public/pdf', 'imap.pdf');
    // const pdf = fs.writeFileSync(savePdf, file.buffer);

    const buffer = file.buffer; //.toString('base64');

    const savePath = path.join(
      __dirname,
      'uploads',
      'documents',
      `${Date.now()}.pdf`,
    );

    fs.mkdirSync(path.dirname(savePath), { recursive: true });

    fs.writeFileSync(savePath, buffer);

    return {
      mags: 'suces',
      res: savePath,
    };
  } catch (err) {
    console.log(err);
  }
}
