const { reply, sendTyping } = require("../utils/telegram")

function registerMonitoringHandlers(bot, { SITE_URL, checkSite, mainMenu, monitorMenu }) {
    bot.hears("/мониторинг", async (ctx) => {
        await sendTyping(ctx)
        reply(ctx, "<i><b>Выбери чо мониторить:</b></i>", monitorMenu)
    })

    bot.hears("/сайт", async (ctx) => {
        await sendTyping(ctx)
        await reply(ctx, "<i><b>Проверяю состояние сайта...</b></i>")

        const result = await checkSite(SITE_URL)

        if (!result.online) {
            return reply(ctx, `<i><b>Сайт недоступен.</b></i>\n<b><i><code>${SITE_URL}</code></i></b>\n\n<code>${result.error}</code>`)
        }

        let status = "ok."

        if (result.ping > 1000) {
            status = "ping > 1000ms!"
        }

        reply(ctx, `<i><b>Сайт работает.</b></i>\n\n<i><b><code>${SITE_URL}</code></b></i>\n\n<i><b>ping: <code>${result.ping}ms</code></b></i>\n<i><b>http: <code>${result.status}</code></b></i>`)
    })

    bot.hears("/сервер", async (ctx) => {
        await sendTyping(ctx)
        reply(ctx, "<i><b>В разработке...</b></i>")
    })

    bot.hears("/назад", async (ctx) => {
        await sendTyping(ctx)
        reply(ctx, "<i><b>Главное меню:</b></i>", mainMenu)
    })
}

module.exports = {
    registerMonitoringHandlers,
}
