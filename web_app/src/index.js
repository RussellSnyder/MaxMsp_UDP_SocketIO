import './styles.scss';
import io from 'socket.io-client';
import Chance from 'chance';
import { kite, background } from "./spandau/index";

// Instantiate Chance so it can be used
const chance = new Chance();
const socket = io('http://localhost:8000');

socket.on('connect', function(){
  console.log('connected')
});
socket.on('message', function(data){
  runVisuals(data)
});
socket.on('disconnect', function(){
  console.log('disconnect')
});

const runVisuals = (data) => {
  const { type } = data;

  if (type === 'instrument') {
    if (data.id === "melody") {
      const { pitch, amplitude }  = data
      let melodyData = {
        pitch: pitch || null,
        amplitude: amplitude || null
      }
      kite(melodyData)
    }
    if (data.id === "kick") {
      const { attack, amplitude }  = data
      let kickData = {
        attack: attack || null,
        amplitude: amplitude || null
      }
      background(kickData)
    }
  }
}

// Melody-Strings 
// - Kite in the sky
//     - Pitch is height
//     - Amp is speed of tail
//     - Left and right a bit random and pan

// Kick
// - Pulse the color of the sky

// Hats
// - Triggers bird to move

// Snare
// - Trigger trees to shake a little

// Bass
// - Person walking

// Other imagery
// - Ice cream van?
// - Person walking to get ice cream

const $visual1 = document.getElementById('visual-1');
const screenSize = {
  width: window.width,
  height: window.innerHeight
}

const visual1 = {
  intensity: () => chance.floating({min: 0, max: 1}),
  height: {
    min: 14,
    max: 16
  },
  opacity: {
    min: 0.5,
    max: 0.6
  },
  getValue: function(prop) {
    let intensity = visual1.intensity();
    console.log(prop)
    const { min, max } = prop 
    const range = max - min;
    return range * intensity + min
  }
}

// visual1.run = (data) => {
//   const { rhythm } = data;
//   const { height, opacity, getValue } = visual1;

//   if (rhythm) {
//     $visual1.style.height = `${getValue(height)}vh`
//     $visual1.style.opacity = getValue(opacity)
//     visual1.count++
//   } else {
//     $visual1.style.opacity = visual1.opacity.min
//   }
// }