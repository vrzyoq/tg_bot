const ytDlp = require("yt-dlp-exec");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ffmpegPath = require("ffmpeg-static");
const { reply } = require("../utils/telegram");

const { Markup } = require("telegraf");

const musicCache = new Map();

function sanitizeFileName(name) {
    return String(name || "music")
        .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);
}

async function searchMusic(ctx, query) {
    try {
        const results = await ytDlp("ytsearch5:" + query, {
            dumpSingleJson: true,
            noWarnings: true,
            noPlaylist: true,
        });

        if (!results?.entries?.length) {
            return ctx.reply("ничего не найдено.");
        }

        musicCache.set(ctx.from.id, results.entries);

        const buttons = results.entries.map((video, index) => [
            Markup.button.callback(
                `${index + 1}. ${video.title.slice(0, 45)}`,
                `music_${index}`
            )
        ]);

        await reply(ctx, "<i><b>выбери песню:</b></i>", Markup.inlineKeyboard(buttons));
    } catch (error) {
        console.error("Music search error:", error);
        await ctx.reply("⚠️ Сейчас YouTube не даёт доступ к поиску. Попробуйте позже.");
    }
}

async function downloadMusic(ctx, video) {
    const id = Date.now();
    const output = path.join(os.tmpdir(), `${id}.%(ext)s`);
    const file = path.join(os.tmpdir(), `${id}.mp3`);

    try {
        const options = {
            extractAudio: true,
            audioFormat: "mp3",
            output,
            quiet: true,
            noPlaylist: true,
            noWarnings: true,
            noCallHome: true,
            noCacheDir: true,
        };

        if (process.platform === "win32" && ffmpegPath) {
            options.ffmpegLocation = path.dirname(ffmpegPath);
        }

        await ytDlp(video.webpage_url, options);

        if (!fs.existsSync(file)) {
            throw new Error("Audio file was not created");
        }

        await ctx.replyWithAudio({
            source: fs.createReadStream(file),
            filename: `${sanitizeFileName(video.title)}.mp3`
        });
    } catch (error) {
        console.error("Music download error:", error);
        await ctx.reply("⚠️ Не удалось скачать трек. Возможно, YouTube сейчас ограничил доступ.");
    } finally {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    }
}

module.exports = {
    searchMusic,
    downloadMusic,
    musicCache
};