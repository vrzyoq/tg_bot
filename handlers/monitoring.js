const { reply, sendTyping } = require("../utils/telegram")
const si = require("systeminformation")
const { exec } = require("child_process");

function getPm2Processes() {
    return new Promise((resolve) => {
        exec("pm2 jlist", (err, stdout) => {
            if (err) return resolve("PM2 не установлен");

            try {
                const processes = JSON.parse(stdout);

                if (!processes.length)
                    return resolve("нет запущенных процессов");

                const text = processes.map(proc => {
                    const status = proc.pm2_env.status === "online"
                        ? "✔"
                        : "✖";

                    return `${status} ${proc.name} (${proc.pm2_env.status})`;
                }).join("\n");

                resolve(text);

            } catch {
                resolve("не удалось получить список процессов");
            }
        });
    });
}

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
        const cpu = await si.currentLoad()
        const mem = await si.mem()
        const disk = await si.fsSize()
        const time = await si.time()
        const pm2 = await getPm2Processes()

        const uptime = time.uptime;

        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const uptimeText = `${days}д ${hours}ч ${minutes}м ${seconds}с`;

        const text = `<i><b>сервер:</b></i>\n\n` +
            `<i><b>cpu:</b></i> <code>${cpu.currentLoad.toFixed(2)}%</code>\n` +
            `<i><b>ram:</b></i> <code>${((mem.active / mem.total) * 100).toFixed(2)}%</code>\n` +
            `<i><b>disk:</b></i> <code>${disk[0].use.toFixed(2)}%</code>\n` +
            `<i><b>uptime:</b></i> <code>${uptimeText}</code>\n` +
            `<i><b>pm2:</b></i>\n<code>${pm2}</code>`

        reply(ctx, text)
    });

    bot.hears("/назад", async (ctx) => {
        await sendTyping(ctx)
        reply(ctx, "<i><b>Главное меню:</b></i>", mainMenu)
    })
}

module.exports = {
    registerMonitoringHandlers,
}
