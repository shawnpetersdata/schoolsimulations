let stamen = []
let ovules = []
let interactives = []
let state = "move"
let button
let instructions
let orient
let scl
let pistil

let startCut = null
let endCut = null

class Interactive {
    constructor(x, y, img) {
        this.x = x
        this.y = y
        this.offsetX = 0
        this.offsetY = 0
        this.img = img
        this.angle = 0
        this.isClicked = false
    }

    update(x, y) {
        if (this.isClicked) {
            this.x = x - this.offsetX
            this.y = y - this.offsetY
        }
    }

    contains(x, y) {
        let dx = x - this.x
        let dy = y - this.y

        let c = cos(-this.angle)
        let s = sin(-this.angle)

        let localX = dx * c - dy * s
        let localY = dx * s + dy * c

        return (
            abs(localX) <= this.img.width / 2 &&
            abs(localY) <= this.img.height / 2
        )
    }

    draw() {
        push()
        translate(this.x, this.y)
        rotate(this.angle)

        image(this.img, 0, 0)

        pop()
    }
}

class Pistil extends Interactive {
    constructor(x, y, angle, img, img2) {
        super(x, y, img)
        this.angle = angle
        this.img2 = img2
        this.cut = false
        this.ovules = []
    }

    update(x, y) {
    let prevX = this.x
    let prevY = this.y

    super.update(x, y)

    let dx = this.x - prevX
    let dy = this.y - prevY

    this.ovules.forEach(ovule => {
        if (!ovule.removed) {
            ovule.x += dx
            ovule.y += dy
        }
    })
}
    dissect() {
        this.cut = true
        this.img = this.img2
    }
}

class Ovule extends Interactive {
    constructor(x, y, angle, img, pistil) {
        super(x, y, img)
        this.removed = false
        this.angle = angle
        this.pistil = pistil
    }
    update(x,y) {
        super.update(x,y)
        if(this.isClicked && !this.removed) {
            this.removed = true 
        }
        }

    draw() {
        if(this.pistil.cut) {
            super.draw()
        }
    }
}

class Stamen extends Interactive {
    constructor(x, y, angle, img) {
        super(x, y, img)
        this.h = img.height
        this.pollen = []
        this.angle = angle
    }

    update(x, y) {
        super.update(x, y)

        this.x = constrain(this.x, 0, width)
        this.y = constrain(this.y, 0, height)

        if (this.isClicked) {
            this.pollen.push({
                x: this.x +
                    this.h / 2 * sin(this.angle) +
                    randomGaussian(0, 10),
                y: this.y -
                    this.h / 2 * cos(this.angle) +
                    abs(randomGaussian(0, 10)),
                d: random(1, 3)
            })
        }

        for (let i = this.pollen.length - 1; i >= 0; i--) {
            if (random() > 0.99) {
                this.pollen.splice(i, 1)
            }
        }

        this.pollen.forEach(pollen => {
            pollen.y += abs(randomGaussian(1, 0.2))
            pollen.x += randomGaussian(0, 0.1)
        })
    }

    draw() {
        push()
        translate(this.x, this.y)
        rotate(this.angle)
        image(this.img, 0, 0)
        pop()
        noStroke()
        fill('yellow')

        this.pollen.forEach(pollen => {
            circle(pollen.x, pollen.y, pollen.d)
        })
    }
}

async function setup() {
    let dim
    let x, y
    if (windowWidth >= windowHeight) {
        orient = "horizontal"
        dim = min(windowWidth / 2, windowHeight)
        let canvas = createCanvas(dim * 2, dim)
        canvas.parent("sketch-holder")
        x = width/4 
        y = height/2
    } else {
        orient = "vertical"
        dim = min(windowWidth, windowHeight / 2)
        createCanvas(dim, dim * 2)
        x = width/2
        y = height/5
    }
    imageMode(CENTER)
    noStroke()

    scl = dim / 1500
    textSize(scl*50)
    await buildFlower(x,y,scl)
}

async function buildFlower(x0,y0,scl) {
    interactives = []
    stamen = []

    // Load stamen images
    for (let i = 0; i < 7; i++) {
        let img = await loadImage(
            `images/stamen${i}.png`
        )

        img.resize(img.width * scl*1.25, 0)
        stamen.push(img)
    }

    // Petal positions
    let petalData = [
        {id: 3, x: 0, y: -0.5},
        {id: 2, x: -0.5, y: -1 / 6},
        {id: 6, x: 0.5, y: -1 / 6},
        {id: 4, x: -0.5, y: -0.5},
        {id: 5, x: 0.5, y: -0.5},
        {id: 1, x: 0, y: 0.5},
        
    ]

    for (let data of petalData) {
        let img = await loadImage(
            `images/flowerPart${data.id}.png`
        )

        img.resize(img.width * scl, 0)

        let x = x0 + img.width * data.x
        let y = y0 + img.height * data.y

        interactives.push(
            new Interactive(x, y, img)
        )
    }

    // Randomize the stamen sprites
    shuffle(stamen, true)

    // Add six stamens
    for (let i = 0; i < 6; i++) {
        let angle = randomGaussian(
            PI / 6,
            PI / 10
        )

        if (i < 3) {
            angle *= -1
        }

        let h = stamen[i].height

        let x = x0 +
            h / 2 * sin(angle)

        let y = y0 -
            h / 2 * cos(angle)

        interactives.push(
            new Stamen(x, y, angle, stamen[i])
        )
    }

    //base
    let img = await loadImage('images/flowerPart0.png')
    img.resize(img.width*scl,0)
    interactives.splice(1,0,new Interactive(x0, y0+img.height/4, img))


    //pistil
    img = await loadImage('images/pistil.png')
    let img2 = await(loadImage('images/pistil_split.png'))
    img.resize(img.width*scl*2, 0)
    img2.resize(img2.width*scl*2, 0)
    
    pistil = new Pistil(x0, y0-img.height/5, 0,  img, img2)

    interactives.splice(2,0,pistil)
    let ovuleImgs = []
    for (let i = 0; i < 8; i++) {
        let img = await loadImage(
            `images/ovule${i}.png`
        )

        img.resize(img.width * scl*2, 0)
        ovuleImgs.push(img)
    }
    
    let amount = constrain(
        floor(randomGaussian(3,0.5)),
        2,
        4
    )
    console.log(amount)
    let xShifts = [
        -0.35*pistil.img2.width,
        -0.15*pistil.img2.width,
        0.15*pistil.img2.width,
        0.35*pistil.img2.width
    ]
    for (let xShift of xShifts) {
    for (let i = 0; i<amount; i++) {
            img = random(ovuleImgs)
            let ovule = new Ovule(
                    pistil.x+xShift,
                    pistil.y+0.35*pistil.img2.height- i*img.height,
                    random(TWO_PI),
                    img,
                    pistil
                )
            interactives.push(ovule)
            ovules.push(ovule)
            
            
        }
    }
    pistil.ovules = ovules
}

function draw() {
    if (state === "move") {
        background(200)
        
        
    }
    else {
        background(255,200,200)
        interactives.forEach(part => {
            part.update(mouseX, mouseY)
            part.draw()
        })
    }

    noFill()

    if (state === "move") {

    interactives.forEach(part => {
        part.update(mouseX, mouseY)
        part.draw()
    })
}
    noFill()
    
    if (orient == "horizontal") {
        noStroke()
        fill(0)
        text("Petals",width/2, height/25)
        text("Sepals",0.75*width, height/25)
        text("Pistil",width/2, 0.63 *height)
        text("Stamen",0.75*width, 0.63*height)
        text("Ovules",width/2, 0.83*height)
        text("Calyx",0.75*width, 0.83*height)
        strokeWeight(1)
        stroke(0)
        line(0.475*width,0.6*height,width,0.6*height)
        line(0.475*width,0.8*height,width,0.8*height)
        line(0.475*width,0,0.475*width,height)
        line(0.725*width,0,0.725*width,height)

        
    }

    else{
        noStroke()
        fill(0)
        text("Petals",width/25, 0.35*height)
        text("Sepals",width/2, 0.35*height)
        text("Pistil",width/25, 0.6*height)
        text("Stamen",width/2, 0.6*height)
        text("Ovules",width/25, 0.825*height)
        text("Calyx",width/2, 0.825*height)
        strokeWeight(1)
        stroke(0)
        line(0,0.33*height,width,0.33*height)
        line(0,0.58*height,width,0.58*height)
        line(0,0.8*height,width,0.8*height)
        line(0.475*width,0.33*height,0.475*width,height)


    }
    if (state === "cut" && startCut) {
        stroke(0)
        for (let i = 0; i < 5; i++) {
            let t1 = 2 * i / 10
            let t2 = (2 * i + 1) / 10

            let x1 = lerp(startCut.x, mouseX, t1)
            let x2 = lerp(startCut.x, mouseX, t2)
            let y1 = lerp(startCut.y, mouseY, t1)
            let y2 = lerp(startCut.y, mouseY, t2)

            line(x1, y1, x2, y2)
        }        
    }
}

function keyPressed() {
    if (key === 'c') {
        if (state === "move") state = "cut"
        else if (state === "cut") state = "move"
    }
    else if (key === 's') {
        if (orient == "horizontal") {
            save(get(0.475*width,0,0.6*width,height))
        }
        else {
            save(get(0,0.33*height,width,0.67*height))

        }
    }
}

function mousePressed() {
    if (state === "move") {
        let closest = null
        let minDist = Infinity

        interactives.forEach(part => {
            if (!part.contains(mouseX, mouseY)) {
                return
            }

            let d = dist(
                mouseX, mouseY,
                part.x, part.y
            )

            if (d < minDist) {
                minDist = d
                closest = part
            }
        })

        if (closest) {
            closest.isClicked = true

            closest.offsetX =
                mouseX - closest.x

            closest.offsetY =
                mouseY - closest.y
        }
    }
    else if (state === "cut") {
        startCut = createVector(mouseX, mouseY)
    }
}

function mouseReleased() {
    if (state === "cut") {
        endCut = createVector(mouseX, mouseY)
        let minY = min(startCut.y, endCut.y)
        let maxY = max(startCut.y, endCut.y)

        let cutX = (startCut.x + endCut.x) / 2

        if (
            abs(startCut.x - endCut.x) < scl * 100 &&
            abs(cutX - pistil.x) < pistil.img.width * 0.15 &&
            minY < pistil.y - pistil.img.height * 0.4 &&
            maxY > pistil.y + pistil.img.height * 0.4
        ) {
            pistil.dissect()
    state = "move"
}

        startCut = null
        endCut = null

    }
    interactives.forEach(part => {
        part.isClicked = false
    })
}