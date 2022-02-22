class CanvasData {
    style
    stroke
    strokeWeight
    fill
    rectMode
    constructor(style, stroke, strokeWeight, fill, rectMode) {
        if(style instanceof CanvasData) {
            this.style = style.style
            this.stroke = style.stroke
            this.strokeWeight = style.strokeWeight
            this.fill = style.fill
            this.rectMode = style.rectMode

        } else {
            this.style = style
            this.stroke = stroke
            this.strokeWeight = strokeWeight
            this.fill = fill
            this.rectMode = rectMode
        }
    }
}

var canvas
var ctx
var RATIO = window.devicePixelRatio
var pixels;
var tempImageData;
var dataStack = []
var data
var key = '', keyCode = 0
var mouseX = 0, mouseY = 0
var shouldLoop = true

const STROKE = 1
const FILL = 2
const RectMode = {CENTER: "center", CORNER: "corner"}
const KeyCode = {TAB: 9, SHIFT: 16, CONTROL: 17, ALT: 18, LEFT_ARROW: 37, UP_ARROW: 38, RIGHT_ARROW: 39, DOWN_ARROW: 40}

let applyStroke = function() {
    if((data.style & STROKE) == STROKE) {
        if(data.stroke.a != 255) {
            ctx.globalAlpha = data.stroke.a / 255
            ctx.stroke()
            ctx.globalAlpha = 1
        } else {
            ctx.globalAlpha = 1
            ctx.stroke()
        }
    }
}
let applyFill = function() {
    if((data.style & FILL) == FILL) {
        if(data.fill.a != 255) {
            ctx.globalAlpha = data.fill.a / 255
            ctx.fill()
            ctx.globalAlpha = 1
        } else {
            ctx.globalAlpha = 1
            ctx.fill()
        }
    }
}
let applyStyle = function() {
    updateStyles()
    applyFill()
    applyStroke()
}

let updateStyles = function() {
    ctx.fillStyle = data.fillStyle
    ctx.strokeStyle = data.strokeStyle
}

var width = 0
var height = 0

function createCanvas(width1, height1) {
    width = width1
    height = height1
    canvas = document.createElement("canvas")
    document.body.append(canvas)
    ctx = canvas.getContext('2d')
    canvas.style.width = width + "px"
    canvas.style.height = height + "px"
    
    RATIO = window.devicePixelRatio
    
    canvas.width = Math.floor(width * RATIO)
    canvas.height = Math.floor(height * RATIO)
    
    ctx.scale(RATIO, RATIO)
    
    data = new CanvasData(3, color(0), ctx.lineWidth, color(0), "corner")
}

function resizeCanvas(w, h) {
    ctx.clearRect(0, 0, width, height)
    
    width = w
    height = h
    canvas.style.width = width + "px"
    canvas.style.height = height + "px"
    
    RATIO = window.devicePixelRatio
    
    canvas.width = Math.floor(width * RATIO)
    canvas.height = Math.floor(height * RATIO)
    
    ctx.scale(RATIO, RATIO)
}

function pixelDensity() {
    return RATIO
}

function loadPixels() {
    pixels = ctx.getImageData(0, 0, width, height)
}

function color(r, g, b, a) {
    if(isNaN(r)) { throw new Error("color(): 'r' must be a number") }
    if(g != undefined && isNaN(g)) { throw new Error("color(): 'g' must be a number or undefined") }
    if(b != undefined && isNaN(b)) { throw new Error("color(): 'b' must be a number or undefined") }
    if(a != undefined && isNaN(a)) { throw new Error("color(): 'a' must be a number or undefined") }
    if(!(this instanceof color)) {
        return new color(r, g, b, a)
    }
    this.r = r
    this.g = g
    this.b = b
    this.a = a
    if(g == undefined) {
        this.g = r
        this.b = r
        this.a = 255
        return;
    }
    if(g != undefined && b == undefined) {
        if(a != undefined) { throw new Error('color(): invalid constructor') }
        this.g = r
        this.b = r
        this.a = g
        return;
    }
    if(g != undefined && a == undefined) {
        if(b == undefined) { throw new Error('color(): invalid constructor') }
        this.a = 255
        return;
    }
    if(a != undefined && (g == undefined || b == undefined)) {
        throw new Error('color(): invalid constructor')
        return;
    }
}

color.prototype.toString = function() {
    if(this.a == 255) { return `rgb(${this.r}, ${this.g}, ${this.b})` }
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
}

function background(r, g, b, a) {
    let colour = color(r, g, b, a)
    let str = colour.toString()
    ctx.strokeStyle = str
    ctx.fillStyle = str
    ctx.beginPath()
    ctx.rect(0, 0, width, height)
    ctx.fill()
    ctx.stroke()
    ctx.closePath()
}

function fill(r, g, b, a) {
    let colour = color(r, g, b, a)
    data.fill = colour
    ctx.fillStyle = colour.toString()
    data.style = data.style | FILL
}

function noFill() {
    data.style = data.style & ~FILL
}

function stroke(r, g, b, a) {
    let colour = color(r, g, b, a)
    data.stroke = colour
    ctx.strokeStyle = colour.toString()
    data.style = data.style | STROKE
}

function noStroke() {
    data.style = data.style & ~STROKE
}

function strokeWeight(weight) {
    if(weight != undefined) {
        data.strokeWeight = weight
        ctx.lineWidth = weight
    }
}

function rect(x, y, w, h) {
    ctx.beginPath()
    if(data.rectMode == RectMode.CENTER) {
        x -= w / 2
        y -= h / 2
    }
    ctx.rect(x, y, w, h)
    applyStyle()
    ctx.closePath()
}

function line(x, y, toX, toY) {
    ctx.beginPath()
    updateStyles()
    ctx.moveTo(x, y)
    ctx.lineTo(toX, toY)
    applyStroke()
    ctx.closePath()
}

function circle(x, y, radius) {
    ctx.beginPath()
    updateStyles()
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    applyStyle()
    ctx.closePath()
}

function ellipse(x, y, radius) {
    circle(x, y, radius)
}

function push() {
    dataStack.push(data)
    data = new CanvasData(data)
}

function pop() {
    data = dataStack.pop()
}

function rectMode(mode) {
    data.rectMode = mode
}

function loadPixels() {
    let imageData = ctx.getImageData(0, 0, Math.floor(width * pixelDensity()), Math.floor(height * pixelDensity()))
    tempImageData = imageData
    pixels = new Uint8ClampedArray(imageData.data)
}

function updatePixels() {
    let imageData = new ImageData(pixels, Math.floor(width * pixelDensity()), Math.floor(height * pixelDensity()))
    imageData.colorSpace = tempImageData.colorSpace
    ctx.putImageData(imageData, 0, 0)
}

function noLoop() {
    shouldLoop = false
}

function loop() {
    if(shouldLoop == false) {
        setTimeout(redraw, 1)
    }
    shouldLoop = true
}

function redraw() {
    draw()
    if(shouldLoop) {
        setTimeout(redraw, 1)
    }
}

function setup() {}
function draw() {}
function keyPressed() {}

window.addEventListener('DOMContentLoaded', function() {
    setup()
    setTimeout(redraw, 1)
    window.addEventListener('keydown', function(e) {
        key = e.key
        keyCode = e.keyCode
        keyPressed()
    })
    window.addEventListener('mousemove', function(e) {
        mouseX = e.clientX
        mouseY = e.clientY
    })
})
