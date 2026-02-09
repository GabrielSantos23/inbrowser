try {
  const proc = Bun.spawn(["ffmpeg", "-version"], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const text = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  await Bun.write("ffmpeg_check.log", `STDOUT:\n${text}\nSTDERR:\n${err}`);
  console.log("Check complete");
} catch (e) {
  await Bun.write("ffmpeg_check.log", `ERROR: ${e.message}`);
}
