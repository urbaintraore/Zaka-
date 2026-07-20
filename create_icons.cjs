const sharp = require('sharp');
sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 234, g: 88, b: 12, alpha: 1 } // orange-600
  }
})
.png()
.toFile('public/icon-512.png')
.then(() => console.log('icon-512.png created'));

sharp({
  create: {
    width: 192,
    height: 192,
    channels: 4,
    background: { r: 234, g: 88, b: 12, alpha: 1 }
  }
})
.png()
.toFile('public/icon-192.png')
.then(() => console.log('icon-192.png created'));
