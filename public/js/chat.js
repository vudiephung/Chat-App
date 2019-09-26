const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageInput = document.querySelector('#message-input')
const $messageButton = document.querySelector('#message-button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message ele
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have i scroll
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('roomPeople', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


socket.on('message', (messageObj) => {
    // Render to browser
    const html = Mustache.render(messageTemplate, {
        username: messageObj.username,
        message: messageObj.text,
        createdAt: moment().format('h:mm a')
        //createdAt: message.createdAt
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (messageObj) => {
    const html = Mustache.render(locationTemplate, {
        username: messageObj.username,
        location: messageObj.text,
        createdAt: moment().format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageButton.setAttribute('disabled', 'disabled')

    //const message = e.target.elements.message.value
    const message = $messageInput.value

    socket.emit('sendMessage', message, (error) => {
        //enable
        $messageButton.removeAttribute('disabled')
        $messageInput.value = ''
        $messageInput.focus()

        if (error) console.log(error)
        else console.log('Message delivered!')
    })
})

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute('disabled', 'disabled')

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by yout Browser!')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('get_location', {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, () => {
            $locationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })

})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
