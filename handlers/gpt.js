const { reply, sendTyping } = require("../utils/telegram")
const { mainMenu } = require("../utils/keyboards")
const { askGPT } = require('../utils/askGPT')
const { Markup } = require("telegraf")


const waitingUsers = new Set();

function splitMessage(text, size = 4000) {
    const parts = [];

    for (let i = 0; i < text.length; i += size) {
        parts.push(text.slice(i, i + size));
    }

    return parts;
}

function registerCHATGPTHandlers(bot, { START_TIME }) {
    bot.hears("/чатгпт", async (ctx) => {
        try {
            waitingUsers.add(ctx.from.id);
        
            await sendTyping(ctx);

            await ctx.reply(
                "введи запрос.",
                Markup.keyboard([
                    ["/отмена"]
                ]).resize()
            );
        } catch (error) {
            console.error("Music command error:", error);
        }
        // const result = await askGPT(bot, ctx.message.text)
    });

    bot.hears("/отмена", async (ctx) => {
        if (!waitingUsers.has(ctx.from.id)) {
            return ctx.reply("сейчас нет активного запроса.");
        }

        waitingUsers.delete(ctx.from.id);
        await reply(ctx, "запрос отменен.", mainMenu)
    });

    bot.on("text", async (ctx, next) => {
        if (!waitingUsers.has(ctx.from.id)) {
            return next();
        }
        const prompt = ctx.message.text

        if (prompt === "/отмена") return;

        await reply(ctx, "жди ответ.")

        const result = await askGPT(bot, ctx, prompt);

        if (!result.success) {
            waitingUsers.delete(ctx.from.id);
            return reply(ctx, result.message, mainMenu)
        }

        const parts = splitMessage(result.message)

        for (const part of parts) {
            await reply(ctx, part)

            console.log(`[ЗАПРОС (CHATGPT)] ${prompt}`)
            console.log(`[ОТВЕТ (CHATGPT)] ${result.message}`)
        }
        await reply(ctx, "Запрос выполнен.", mainMenu)
        waitingUsers.delete(ctx.from.id);
    });
}

module.exports = {
    registerCHATGPTHandlers,
    splitMessage
}