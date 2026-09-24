let topPoint, bottomPoint
let points = []
let rider
let gates = []

let startButton
let resetButton

let sprite

const g = 9.8
const RAMP_LENGTH_M = 10.0
let pixelsPerMeter
let metersPerPixel

const DESIGN_SIZE = 400

let scl
let state = "setup"
let elaspedTime = 0


class Gate {
    constructor(t) {
        this.t = t
        this.time = null
        this.pos = createVector(0, 0)

        this.angle = 0
        this.distance = 0
        this.passed = false
    }

    update(pnt1, pnt2) {
    this.pos.x = lerp(
        pnt1.x,
        pnt2.x,
        this.t
    )

    this.pos.y = lerp(
        pnt1.y,
        pnt2.y,
        this.t
    )

    this.angle = atan2(
        pnt2.y - pnt1.y,
        pnt2.x - pnt1.x
    )

    let rampLength = dist(
        pnt1.x,
        pnt1.y,
        pnt2.x,
        pnt2.y
    )

    this.distance =
        rampLength * this.t

    this.distanceMeters =
        this.distance * metersPerPixel
}
    check(riderDistance, elaspedTime) {
        if (
            !this.passed &&
            riderDistance >= this.distance
        ) {
            this.passed = true
            this.time = floor(elaspedTime*100)/100
            return true
        }

        return false
    }

    draw() {
        push()

        
            noFill()
        
        translate(
            this.pos.x,
            this.pos.y
        )

        rotate(this.angle)

        rect(
            0,
            -20 * scl,
            5 * scl,
            40 * scl
        )

        

        if (this.passed) {
            translate(0,-60*scl)

            rotate(-this.angle)
            fill(0)
            text(`d = ${floor((this.distanceMeters*100))/100} m`, 0,0)
            text(`t = ${this.time} s`, 0,10*scl)
        }

        pop()
    }
}


class Rider {
    constructor(img) {
        this.img = img
        this.img.resize(30*scl, 0)
    }

    rampUpdate(pnt1, pnt2) {
        this.pos = createVector(
            pnt1.x,
            pnt1.y
        )

        this.angle = atan2(
            pnt2.y - pnt1.y,
            pnt2.x - pnt1.x
        )

        

        this.velo =
            p5.Vector.fromAngle(this.angle)

        this.velo.setMag(0)

        // Real acceleration down the incline
        // in m/s^2.
        let accelerationMS2 =
            g * sin(this.angle)

        // Convert m/s^2 to pixels/s^2.
        let accelerationPixels =
            accelerationMS2 *
            pixelsPerMeter

        this.acc =
            p5.Vector.fromAngle(this.angle)

        this.acc.setMag(
            accelerationPixels
        )
    }

    update(dt) {
        if(this.pos.y <= bottomPoint.y) {
            this.velo.add(
                p5.Vector.mult(
                    this.acc,
                    dt
                )
            )
        }
        else {
            this.velo.setHeading(0)
        }

        this.pos.add(
            p5.Vector.mult(
                this.velo,
                dt
            )
        )
    }

    draw() {
        push()

        translate(
            this.pos.x,
            this.pos.y
        )
        if(this.pos.y <= bottomPoint.y) {
            rotate(this.angle)
        }

        image(this.img, 0,-this.img.height/2)

        pop()
    }
}


class EditPoint {
    constructor(
        x,
        y,
        constrainX,
        constrainY
    ) {
        this.x = x
        this.y = y

        this.constrainX = constrainX
        this.constrainY = constrainY

        this.selected = false
    }

    move() {
        if (this.selected) {
            if (!this.constrainX) {
                this.x = constrain(mouseX, 10*scl, width-10*scl)
            }

            if (!this.constrainY) {
                this.y = constrain(mouseY, 10*scl, height - 10 * scl)
            }
        }
    }

    clicked(x, y) {
        if (
            dist(
                x,
                y,
                this.x,
                this.y
            ) < 10 * scl
        ) {
            this.selected = true
        }
        else {
            this.selected = false
        }
    }

    draw() {
        circle(
            this.x,
            this.y,
            10 * scl
        )
    }
}


async function setup() {
    let dim = min(
        windowWidth,
        windowHeight * 0.9
    )

    sprite = await loadImage("cart.png")

    scl = dim / DESIGN_SIZE

    createCanvas(dim, dim)

    startButton = createButton("start")

    startButton.mousePressed(
        startPressed
    )

    resetButton = createButton("reset")

    resetButton.mousePressed(
        resetPressed
    )

    rectMode(CENTER)
    imageMode(CENTER)

    resetPressed()
    

    textSize(scl*10)
}


function draw() {
    
    background(165, 166, 160)
    fill(125, 65, 72)
    rectMode(CORNER)
    rect(10*scl,height-10*scl,width-20*scl,scl*5)
    triangle(
        10 * scl,
        height - 10 * scl,

        topPoint.x,
        topPoint.y,

        bottomPoint.x,
        bottomPoint.y
    )
    rectMode(CENTER)
    fill(255)
    points.forEach(pnt => {
        pnt.move()
        pnt.draw()
    })

    if (state === "setup") {
        rider.rampUpdate(
            topPoint,
            bottomPoint
        )

        gates.forEach(gate => {
            gate.update(
                topPoint,
                bottomPoint
            )
        })
    }

    else if (state === "running") {
        const dt = deltaTime / 1000

        rider.update(dt)
        elaspedTime += dt
    }

    rider.draw()

    let riderDistance = dist(
        topPoint.x,
        topPoint.y,
        rider.pos.x,
        rider.pos.y
    )

    gates.forEach(gate => {
        gate.check(riderDistance, elaspedTime)
        gate.draw()
    })
}


function mousePressed() {
    if (state === "setup") {
        points.forEach(pnt => {
            pnt.clicked(
                mouseX,
                mouseY
            )
        })
    }
}


function mouseReleased() {
    points.forEach(pnt => {
        pnt.selected = false
    })
}


function startPressed() {
    if (state === "setup") {
        state = "running"
    }
}

function resetPressed() {
    state = "setup"

    topPoint = new EditPoint(
        10 * scl,
        randomGaussian(0.5, 0.1) *
            height,
        true,
        false
    )

    bottomPoint = new EditPoint(
        randomGaussian(0.5, 0.1) *
            width,
        height - 10 * scl,
        false,
        true
    )

    let defaultRampPixels = dist(
        topPoint.x,
        topPoint.y,
        bottomPoint.x,
        bottomPoint.y
    )

    pixelsPerMeter =
        defaultRampPixels / RAMP_LENGTH_M

    metersPerPixel =
        RAMP_LENGTH_M / defaultRampPixels

    points = [
        topPoint,
        bottomPoint
    ]

    rider = new Rider(sprite)
    gates = []
    elaspedTime = 0
    for (let i = 0; i<1; i+=0.2) {
        gates.push(new Gate(i))   
    }

}