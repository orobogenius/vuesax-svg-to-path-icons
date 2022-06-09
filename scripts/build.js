const fs = require('fs')
const fsPromises = fs.promises
const jsdom = require('jsdom')
const { JSDOM } = jsdom

async function getIcons (style) {
  let files = await fsPromises.readdir(`./optimized/${style}`)

  return Promise.all(
    files.map(async file => ({
      svg: await fsPromises.readFile(`./optimized/${style}/${file}`, 'utf8'),
      name: file.replace('.svg', '')
    }))
  )
}

async function writeJs (file, content) {
  await fsPromises.writeFile(file, content, 'utf8')
}

async function buildIcons (style) {
  let icons = await getIcons(style)

  let iconsObj = {}

  await Promise.all(
    icons.map(async ({ svg, name }) => {
      const svgElement = new JSDOM(svg).window.document.querySelector('svg')
      const children = svgElement.children
      const path = []

      for (let child of children) {
        if (child.tagName === 'path') {
          child.setAttribute('fill', 'currentColor')
        }
        
        path.push(child.outerHTML)
      }

      iconsObj[name] = {
        path: path.join('')
      }
    })
  )

  writeJs(
    `./dist/${style}.js`,
    `const icons = ${JSON.stringify(iconsObj, null, 2)}; export default icons;`
  )
}

async function build (style) {
  console.log(`Building ${style} icons...`)

  const outputDir = `./dist/${style}.js`

  await fsPromises
    .access(outputDir, fs.constants.R_OK)
    .then(() => {
      fsPromises.unlink(outputDir)
    })
    .catch(() => {
      //
    })

  await Promise.all([buildIcons(style)])

  return console.log(`Finished building ${style} icons.`)
}

let [style] = process.argv.slice(2)

if (style) {
  build(style)
} else {
  for (let style of ['outline', 'bold']) {
    build(style)
  }
}
