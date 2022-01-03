const socket = io();

// elements
const form = document.querySelector('#form1');
const locationButton = document.querySelector('#location-button');
const formInput = form.querySelector('input');
const formButton = form.querySelector('button');
const messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const messageTemplate2 = document.querySelector(
  '#message-template-2'
).innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  // new message element
  const $newMessage = messages.lastElementChild;

  // height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = messages.offsetHeight;

  // messages container height
  const containerHeight = messages.scrollHeight;

  // how far have i scrolled
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on('message', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });
  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('locationMessage', (message) => {
  const html = Mustache.render(messageTemplate2, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format('h:mm a'),
  });

  messages.insertAdjacentHTML('beforeend', html);
  autoScroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sideBarTemplate, {
    room,
    users,
  });
  document.querySelector('#sidebar').innerHTML = html;
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  // disable
  formButton.setAttribute('disabled', 'disabled');

  const message = e.target.elements.message.value;

  socket.emit('sendMessage', message, (error) => {
    // enable

    formButton.removeAttribute('disabled');
    formInput.value = '';
    formInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log('message delivered');
  });
});

locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('geolocation not supported');
  }

  locationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'send location',
      {
        location: position.coords.location,
        lat: position.coords.latitude,
        long: position.coords.longitude,
      },
      () => {
        locationButton.removeAttribute('disabled');
        console.log('location shared');
      }
    );
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
