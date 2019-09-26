const generateMessage = (username, text) => {
    return {
        username: username,
        text,
        createdAt: new Date().getTime()
    }
}

module.exports = { generateMessage }