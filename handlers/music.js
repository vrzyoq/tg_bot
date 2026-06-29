const { reply, sendTyping, safeDeleteMessage, safeEditMessageText } = require("../utils/telegram");
const {
    searchMusic,
    downloadMusic,
    musicCache
} = require("../utils/music");

const waitingUsers = new Set();
const pendingSearchMessages = new Map();

function registerMusicHandlers(bot) {

    bot.hears("/музыка", async (ctx) => {
        try {
            waitingUsers.add(ctx.from.id);

            await sendTyping(ctx);

            await reply(ctx, "введи название песни.");
        } catch (error) {
            console.error("Music command error:", error);
        }
    });

    bot.on("text", async (ctx, next) => {
        if (!waitingUsers.has(ctx.from.id)) {
            return next();
        }

        waitingUsers.delete(ctx.from.id);

        const query = ctx.message?.text?.trim();

        if (!query) {
            return reply(ctx, "введи название песни.");
        }

        const key = `${ctx.chat.id}:${ctx.from.id}`;
        const searchMessage = await reply(ctx, `<i>ищу: ${query}</i>`);
        pendingSearchMessages.set(key, searchMessage.message_id);

        try {
            await searchMusic(ctx, query);
        } catch (error) {
            console.error("Search music error:", error);
            await reply(ctx, "⚠️ не удалось выполнить поиск.");
        } finally {
            const searchMessageId = pendingSearchMessages.get(key);
            if (searchMessageId) {
                await safeDeleteMessage(ctx, searchMessageId);
                pendingSearchMessages.delete(key);
            }
        }
    });

    bot.action(/^music_(\d+)$/, async (ctx) => {
        try {
            await ctx.answerCbQuery();

            const index = Number(ctx.match[1]);
            const list = musicCache.get(ctx.from.id);

            if (!list) {
                return ctx.reply("поиск устарел.");
            }

            const video = list[index];

            if (!video) {
                return ctx.reply("не найдено.");
            }

            await safeEditMessageText(ctx, `<i>загрузка...\n${video.title}</i>`);

            await downloadMusic(ctx, video);
        } catch (error) {
            console.error("Download music error:", error);
            await ctx.reply("⚠️ ошибка загрузки.");
        } finally {
            const key = `${ctx.chat.id}:${ctx.from.id}`;
            const searchMessageId = pendingSearchMessages.get(key);
            if (searchMessageId) {
                await safeDeleteMessage(ctx, searchMessageId);
                pendingSearchMessages.delete(key);
            }

            try {
                await ctx.deleteMessage();
            } catch (error) {
                // ignore delete errors
            }

            musicCache.delete(ctx.from.id);
        }
    });
}

module.exports = {
    registerMusicHandlers
};