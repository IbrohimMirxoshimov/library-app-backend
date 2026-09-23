const express = require("express");
const { Router } = require("express");
const { execFile } = require("child_process");
const { randomUUID } = require("crypto");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const middlewares = require("../middlewares");
const { isModerator } = require("../middlewares/permissions");
const { APP_ORIGIN } = require("../../config");
const HttpError = require("../../utils/HttpError");

const route = Router();

const MAX_IMAGE_SIZE = "10mb";
const MAX_IMAGE_SIDE = 1200;

function ffmpeg(args) {
	return new Promise((resolve, reject) =>
		execFile("ffmpeg", args, { timeout: 60000 }, (err) =>
			err ? reject(err) : resolve()
		)
	);
}

/**
 * Any image -> optimized jpg: longest side <= MAX_IMAGE_SIDE (no upscaling),
 * transparency flattened onto white, metadata dropped.
 */
async function optimizeToJpg(input, output) {
	await ffmpeg([
		"-v", "error", "-y",
		"-i", input,
		"-f", "lavfi", "-i", "color=white",
		"-filter_complex",
		`[0]scale='min(${MAX_IMAGE_SIDE},iw)':'min(${MAX_IMAGE_SIDE},ih)':force_original_aspect_ratio=decrease[fg];` +
			"[1][fg]scale2ref[bg][fg2];[bg][fg2]overlay=shortest=1:format=auto,format=yuvj420p",
		"-frames:v", "1",
		"-q:v", "4",
		"-map_metadata", "-1",
		output,
	]);
}

module.exports = (app) => {
	app.use("/files", middlewares.isAuth, isModerator, route);

	// body is the raw file (Content-Type: image/*)
	route.post(
		"/image",
		express.raw({ type: "image/*", limit: MAX_IMAGE_SIZE }),
		async (req, res, next) => {
			const tmp = path.join(os.tmpdir(), "upload-" + randomUUID());
			try {
				if (!Buffer.isBuffer(req.body) || !req.body.length) {
					throw HttpError(400, "Rasm yuborilmadi");
				}

				await fs.writeFile(tmp, req.body);

				const name = randomUUID() + ".jpg";
				await optimizeToJpg(tmp, path.resolve("files", name)).catch(() => {
					throw HttpError(400, "Rasm formati noto'g'ri");
				});

				return res.status(201).json({ url: `${APP_ORIGIN}/files/${name}` });
			} catch (e) {
				next(e);
			} finally {
				fs.rm(tmp, { force: true }).catch(() => {});
			}
		}
	);
};
