const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/message')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('new Websocket connection')

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        if (error) return callback(error)

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomPeople', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('get_location', (location, callback) => {
        const user = getUser(socket.id)
        callback()
        io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://www.google.com/maps?q=${location.lat},${location.long}`))
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomPeople', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
})

server.listen(port, () => {
    console.log('Listening on port ' + port)
})