import ffmpeg from "fluent-ffmpeg";
ffmpeg.setFfprobePath("/opt/homebrew/bin/ffprobe");

const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    console.log(`Attempting to get duration for video at path: ${videoPath}`);

    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error(
          `Error occurred while reading metadata for video at path: ${videoPath}`,
          err
        );
        return reject(err);
      }
      if (!metadata || !metadata.format) {
        const errorMessage = `Invalid metadata format for video at path: ${videoPath}`;
        console.error(errorMessage);
        return reject(new Error(errorMessage));
      }
      const duration = metadata.format.duration;
      console.log(`Video duration: ${duration} seconds`);
      resolve(duration);
    });
  });
};

export default getVideoDuration;
