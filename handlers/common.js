const { reply, sendTyping } = require("../utils/telegram")

function registerCommonHandlers(bot, { START_TIME }) {
    bot.hears("/общее", async (ctx) => {
        await sendTyping(ctx)

        const diff = Math.floor((Date.now() - START_TIME) / 1000)
        const d = Math.floor(diff / 86400)
        const h = Math.floor(diff / 3600)
        const m = Math.floor((diff % 3600) / 60)
        const s = Math.floor(diff % 60)

        reply(
            ctx,
            `<i><b>profile</b></i>\n\n` +
            `<i><b>айди: <code>${ctx.from.id}</code></b></i>\n` +
            `<i><b>аптайм: <code>${d}д. ${h}ч. ${m}м. ${s}с.</code></b></i>`
        )
    })
}

module.exports = {
    registerCommonHandlers,
}
