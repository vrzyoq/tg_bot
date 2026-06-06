const axios = require("axios")

async function checkSite(url) {

    const start = Date.now()

    try {

        const response = await axios.get(url, {
            timeout: 10000
        })

        const ping = Date.now() - start

        return {
            online: true,
            status: response.status,
            ping
        }

    } catch (error) {

        return {
            online: false,
            error: error.message
        }
    }
}

module.exports = {
    checkSite
}