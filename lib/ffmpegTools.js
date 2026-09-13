const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

function tmpFile(ext) {
  return path.join(os.tmpdir(), `roan-${crypto.randomBytes(6).toString('hex')}.${ext}`);
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

module.exports = { videoBufferToMp3 };
