const { createCanvas } = require('canvas');
const fs = require('fs');

function createIcon(width, height, isMaskable, isApple) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  if (isApple) {
    ctx.fillStyle = '#000000'; // Black background for apple-touch
    ctx.fillRect(0, 0, width, height);
  } else if (isMaskable) {
    ctx.fillStyle = '#000000'; // Black background for maskable
    ctx.fillRect(0, 0, width, height);
  } else {
    // Transparent or solid? Let's do solid
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw circle or something inside
  if (isApple || isMaskable) {
    ctx.fillStyle = '#ea580c';
    // Draw in center with padding
    const padding = isMaskable ? width * 0.2 : width * 0.1;
    ctx.beginPath();
    ctx.arc(width/2, height/2, (width/2) - padding, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Text "Z+"
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.floor(width * 0.4)}px sans-serif`;
  ctx.fillText('Z+', width/2, height/2);

  return canvas.toBuffer('image/png');
}

fs.writeFileSync('public/icon-192x192.png', createIcon(192, 192, false, false));
fs.writeFileSync('public/icon-512x512.png', createIcon(512, 512, false, false));
fs.writeFileSync('public/maskable-icon-192.png', createIcon(192, 192, true, false));
fs.writeFileSync('public/maskable-icon-512.png', createIcon(512, 512, true, false));
fs.writeFileSync('public/apple-touch-icon.png', createIcon(180, 180, false, true));

console.log('Icons generated successfully.');
