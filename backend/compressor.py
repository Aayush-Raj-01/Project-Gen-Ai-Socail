# Video compression using moviepy library
# change bitrate for different compression levels

from moviepy import VideoFileClip
def compress_video(input_path,output_path,bitrate="10k"):
  video_clip= VideoFileClip(input_path)
  video_clip.write_videofile(output_path,bitrate=bitrate)
  video_clip.close()
compress_video("vd.mp4","compressed1_video.mp4",bitrate="10k")