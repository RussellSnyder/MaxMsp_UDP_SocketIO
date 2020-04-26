import { scaleLinear } from 'd3-scale'
import { select } from 'd3-selection'
import { transition } from 'd3-transition'
import { line, curveBasis } from 'd3-shape'
import { easeQuad } from 'd3-ease'
import { interpolateString } from 'd3-interpolate'
import Chance from 'chance';
import gsap from "gsap";

const chance = new Chance();
const namespace = "spandau";
const containerId = `${namespace}-container`

const kiteId = `${namespace}-kite`
const kiteContainerId = `${kiteId}-container`
const kiteDiamondId = `${kiteId}-diamond`
const kiteTailId = `${kiteId}-tail`

const PITCH_MAX = 523;
const PITCH_MIN = 260;
const HEIGHT_MAX = 98;
const HEIGHT_MIN = 50;

const scalePitchToHeight = scaleLinear()
  .domain([PITCH_MIN, PITCH_MAX]) // pitch - midi
  .range([HEIGHT_MIN, HEIGHT_MAX]); // unit: percentage

const pitchToHeight = (pitch) => {
  let scaledPitchToHeight = scalePitchToHeight(pitch)
  // remove outliers
  scaledPitchToHeight = scaledPitchToHeight > HEIGHT_MAX ? HEIGHT_MAX : scaledPitchToHeight 
  scaledPitchToHeight = scaledPitchToHeight < HEIGHT_MIN ? HEIGHT_MIN : scaledPitchToHeight 

  return scaledPitchToHeight;
}

let windSpeed = 1;
let swayAmount = 10;
let firstAmplitude = true
let tailWhipDuration = 3000;
let tailWhipAmount = 100; // 0 - taill stays same, 100 - lots of tail whip

export const kite = ({pitch, amplitude}) => {
  if (amplitude) {
    windSpeed = 1 - amplitude
    swayAmount = 15 * amplitude
    tailWhipDuration = 3000 * (1 - amplitude)
    tailWhipAmount = amplitude * 50;
  }

  if (pitch) {
    const newHight = 100 - pitchToHeight(pitch)

    gsap.to(`#${kiteId}`, {
      ease: "sine.inOut",
      y: `${newHight}%`,
      duration: 1
    });    
  }
  if (amplitude) {
    if (firstAmplitude) {
      swayKiteLeftToRight(50);
      swayTail()
      firstAmplitude = false;
    }
  }
}

const getNewX = (oldX) => {  
  const increment = parseInt(chance.integer({min: swayAmount * -1, max: swayAmount}))
  const newX = oldX + increment;
  if (newX > 50) {
    return 50
  }
  if (newX < -50) {
    return -50
  }
  return newX
}


let $kite;
let $kiteTail;


const initializeKiteSvg = () => {
  const $kiteContainer = select(`#${containerId}`)
    .append("svg")
    .attr("id", kiteContainerId)
    .attr("width", '100%')
    .attr("height", '100%');

  const $kiteDefs = $kiteContainer.append("defs");
  const kiteBackground = $kiteDefs .append("linearGradient")
    .attr("id", "kite-background")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")

  kiteBackground.append("stop")
    .attr("offset", "20%")
    .attr("stop-color", "#f8b500");

    kiteBackground.append("stop")
    .attr("offset", "90%")
    .attr("stop-color", "#fceabb");

  $kite = $kiteContainer.append("g")  
    .attr("id", kiteId)
    .attr('width', '100px')

  $kite
    .append("svg")
    .attr('viewBox', '0 0 500 1000')
    .append("path")
    .attr("d", "M 50 0 100 100 50 200 0 100 Z")
    .attr("id", kiteDiamondId)
    .style("stroke-width", 1)
    .style("stroke-dasharray", "1,0")
    .style("fill", "url('#kite-background')")
    .style("stroke", "rgba(255,255,255,0.5)")
    .style("stroke-width", 3);

  const kiteTaileContainer = $kite.append('svg')
    .attr('viewBox', '-10 -40 100 200')
    .attr('width', '100%')
    .attr('height', '100%')

  $kiteTail = kiteTaileContainer
    .append("path")
    .attr("id", kiteTailId)
    .attr('d', KiteTail.generateData())
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
}

const swayKiteLeftToRight = (currentX) => {
  const newX = getNewX(currentX);
  const rotationAmount = 1.5 * (newX - currentX);

  gsap.to('#' + kiteId, {
    ease: "sine.inOut",
    x: `${newX}%`,
    rotation: rotationAmount,
    duration: windSpeed * 2,
    onComplete() {
      swayKiteLeftToRight(newX)
    }
  });    
}

const KiteTail = {
  data: [],

  lineFunction: line()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .curve(curveBasis),

  generateData: function() {
    const newData = [{
      x: 0,
      y: 0
    }];
    
    const movementPoints = 10
    for (let i = 1; i <= movementPoints; i++) {
      // move likely to stay put toward the base of the tail
      const likelihood = parseInt(tailWhipAmount * (i / movementPoints))
      const shouldStayTheSame = chance.bool({likelihood});

      if (this.data.length && shouldStayTheSame) {
        newData.push(this.data[i])
        continue;
      }

      let y = i * 3.5;
      const lastX = newData[i - 1].x;
      // whip more towards the end
      const whipMax = i / movementPoints * 5;     
      let randomX = chance.integer({min: 0, max: whipMax});
    
      const x = lastX < 0 ? randomX : -randomX

      newData.push({x, y})
      continue;

    }
    
    this.data = newData

    return this.lineFunction(this.data)  
  }
}

initializeKiteSvg()

const swayTail = () => {
  $kiteTail
    .transition()
    .duration(tailWhipDuration)
    .attrTween('d', function() {
      const currentD = this.getAttribute('d');
      const newD = KiteTail.generateData()
      const d = interpolateString(currentD, newD) 

      return function(t) {
        return d(t)
      }
    })
    .on("end", function() {
      swayTail()
    })
}



let backgroundOpactityOnHit = 0.9;
export const background = ({attack, amplitude}) => {
  if (amplitude) {
    backgroundOpactityOnHit = 1 - (amplitude * 0.25)
  }

  if (attack) {
    gsap.fromTo(`#${namespace}-background`, 
      { opacity: backgroundOpactityOnHit },
      { opacity: 1, duration: 0.5 }
    );
  }

}
