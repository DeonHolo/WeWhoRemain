import https from 'https';
import fs from 'fs';

const options = {
  hostname: 'www.sounds-resource.com',
  path: '/download/447808/',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Referer': 'https://www.sounds-resource.com/pc_computer/discoelysium/sound/447808/',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  }
};

https.get(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  if (res.statusCode === 301 || res.statusCode === 302) {
    const redirectUrl = res.headers.location;
    console.log('Redirecting to:', redirectUrl);
    https.get(redirectUrl, { headers: options.headers }, (res2) => {
      const file = fs.createWriteStream('sounds.zip');
      res2.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Downloaded successfully to sounds.zip');
      });
    });
  } else {
    const file = fs.createWriteStream('sounds.zip');
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Downloaded successfully to sounds.zip');
    });
  }
}).on('error', (e) => {
  console.error(e);
});