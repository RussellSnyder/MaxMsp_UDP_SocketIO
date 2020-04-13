import io from 'socket.io-client';
 
const socket = io('http://localhost:8000');

socket.on('connect', function(){
  console.log('connected')
});
socket.on('message', function(data){
  console.log(data)

});
socket.on('disconnect', function(){
  console.log('disconnect')

});