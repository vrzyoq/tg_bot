const { reply, sendTyping } = require("../utils/telegram")
const { mainMenu } = require("../utils/keyboards")

function registerStartHandlers(bot, { START_TIME }) {
    bot.start((ctx) => {
        reply(ctx, "<i><b>Hi</b></i>", mainMenu)
    })
}

module.exports = {
    registerStartHandlers,
}