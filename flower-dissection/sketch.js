let stamen = []
let interactives = []

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

class Petal extends Interactive {
    constructor(x, y, angle, img, img2) {
        super(x, y, img)
        this.angle = angle
        this.img2 = img2
        this.manipulated = false
    }

    update(x, y) {
        super.update(x, y)

        if (this.isClicked) {
            this.manipulated = true
        }
    }

    draw() {
        push()
        translate(this.x, this.y)
        rotate(this.angle)

        if (this.manipulated) {
            image(this.img2, 0, 0)
        } else {
            image(this.img, 0, 0)
        }

        pop()
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

        fill('yellow')

        this.pollen.forEach(pollen => {
            circle(pollen.x, pollen.y, pollen.d)
        })
    }
}

async function setup() {
    let dim = min(windowWidth, windowHeight)
    createCanvas(dim,dim)
    imageMode(CENTER)
    noStroke()
    let scl = 250 / dim
    await buildFlower(scl)
}

async function buildFlower(scl) {
    interactives = []
    stamen = []

    // Load stamen images
    for (let i = 0; i < 7; i++) {
        let img = await loadImage(
            `images/stamen${i}.png`
        )

        img.resize(img.width * scl, 0)
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

        let x = width / 2 + img.width * data.x
        let y = height / 2 + img.height * data.y

        interactives.push(
            new Petal(x, y, 0, img, img)
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

        let x = width / 2 +
            h / 2 * sin(angle)

        let y = height / 2 -
            h / 2 * cos(angle)

        interactives.push(
            new Stamen(x, y, angle, stamen[i])
        )
    }

    //base
    let img = await loadImage('images/flowerPart0.png')
    img.resize(img.width*scl,0)
    interactives.splice(1,0,new Interactive(width/2, height/2+img.height/4, img))


    //pistil
    img = await loadImage('images/pistil.png')
    img.resize(img.width*scl*1.5, 0)
    interactives.splice(2,0,new Interactive(width/2, height/2-img.height/5, img))


}

function draw() {
    clear()

    noFill()

    interactives.forEach(part => {
        part.update(mouseX, mouseY)
        part.draw()
    })
}

function mousePressed() {
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

function mouseReleased() {
    interactives.forEach(part => {
        part.isClicked = false
    })
}