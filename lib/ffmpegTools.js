const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

function tmpFile(ext) {
  return path.join(os.tmpdir(), `roan-${crypto.randomBytes(6).toString('hex')}.${ext}`);
}

async function videoBufferToWebpSticker(buffer) {
  const inputPath = tmpFile('mp4');
  const outputPath = tmpFile('webp');
  fs.writeFileSync(inputPath, buffer);

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vcodec', 'libwebp',
        '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=10",
        '-loop', '0',
        '-preset', 'default',
        '-an',
        '-vsync', '0',
        '-t', '6',
      ])
      .toFormat('webp')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });

  const result = fs.readFileSync(outputPath);
  fs.unlinkSync(inputPath);
  fs.unlinkSync(outputPath);
  return result;
}

async function videoBufferToMp3(buffer) {
  const inputPath = tmpFile('mp4');
  const outputPath = tmpFile('mp3');
  fs.writeFileSync(inputPath, buffer);

  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });

  const result = fs.readFileSync(outputPath);
  fs.unlinkSync(inputPath);
  fs.unlinkSync(outputPath);
  return result;
}

module.exports = { videoBufferToWebpSticker, videoBufferToMp3 };
