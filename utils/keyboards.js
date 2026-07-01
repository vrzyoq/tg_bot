const { Markup } = require("telegraf")

const mainMenu = Markup.keyboard([
    ["/общее"],
    ["/мониторинг"],
    ["/чатгпт"],
]).resize()

const monitorMenu = Markup.keyboard([
    ["/сайт", "/сервер"],
    ["/назад"],
]).resize()

module.exports = {
    mainMenu,
    monitorMenu,
}