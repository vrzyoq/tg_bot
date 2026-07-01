const { reply, sendTyping } = require("../utils/telegram")

function getSalaryDaysLeft(date = new Date()) {
    const now = new Date(date)
    now.setHours(0, 0, 0, 0)

    let salaryDate = new Date(now.getFullYear(), now.getMonth(), 15)
    salaryDate.setHours(0, 0, 0, 0)

    if (now > salaryDate) {
        salaryDate = new Date(now.getFullYear(), now.getMonth() + 1, 15)
        salaryDate.setHours(0, 0, 0, 0)
    }

    if (now.getTime() === salaryDate.getTime()) {
        return 0
    }

    let workdays = 0
    const currentDay = new Date(now)

    while (currentDay < salaryDate) {
        const day = currentDay.getDay()
        if (day !== 0 && day !== 6) {
            workdays += 1
        }
        currentDay.setDate(currentDay.getDate() + 1)
    }

    return workdays
}

function getSalaryLabel(days) {
    if (days === 0) return "зп сегодня"

    if (days === 1) return `${days} р. день`
    if (days >= 2 && days <= 4) return `${days} р. дня`
    return `${days} р. дней`
}

function registerCommonHandlers(bot, { START_TIME }) {
    bot.hears("/общее", async (ctx) => {
        await sendTyping(ctx)

        const diff = Math.floor((Date.now() - START_TIME) / 1000)
        const d = Math.floor(diff / 86400)
        const h = Math.floor(diff / 3600)
        const m = Math.floor((diff % 3600) / 60)
        const s = Math.floor(diff % 60)
        const salaryDays = getSalaryDaysLeft()

        reply(
            ctx,
            `<i><b>profile</b></i>\n\n` +
            `<i><b>айди: <code>${ctx.from.id}</code></b></i>\n` +
            `<i><b>аптайм: <code>${d}д. ${h}ч. ${m}м. ${s}с.</code></b></i>\n` +
            `<i><b>до зп: <code>${getSalaryLabel(salaryDays)}</code></b></i>`
        )
    })
}

module.exports = {
    registerCommonHandlers,
    getSalaryDaysLeft,
    getSalaryLabel
}
