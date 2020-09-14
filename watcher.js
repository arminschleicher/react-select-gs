const npm = require('npm')
const fs = require('fs-extra')
const chokidar = require('chokidar')

const packagePaths = [
  '../web-app/node_modules/react-select-gs/lib',
  '../web-styleguide/node_modules/react-select-gs/lib',
]

const noop = () => {}

const watcher = chokidar.watch('./src', {
  persistent: true,
})

watcher
  .on('ready', onReady)
  .on('change', runCompileAndMoveFiles)
  .on('unlink', onDelete)

function onReady() {
  // only after 'ready' should we subscribe to 'add' events
  // if we do it before 'ready', each file in the project will
  // trigger an 'add' event
  watcher.on('add', runCompileAndMoveFiles)
  runCompileAndMoveFiles()
}

function onDelete(filePath) {
  const fileWithoutSrc = stripFirstDirectory(filePath)

  fs.removeSync(`./lib/${fileWithoutSrc}`, noop)
  runCompileAndMoveFiles()
}

function runCompileAndMoveFiles() {
  const options = { clobber: true } // overwrite directory
  console.log('runCompileAndMoveFiles')
  try {
    npm.load({}, () => {
      npm.commands.run(['build'], () => {
        packagePaths.forEach(path => {
          // source folder contents to dest folder
          console.log('copy libs')
          fs.copy('./lib', `${path}`, options, noop)
        //   // fs.copy('./package.json', `${path}/package.json`, options, noop);
        })
      })
    })
  } catch (e) {
    console.log(e)
  }
}

function stripFirstDirectory(filePath) {
  return filePath
    .split('/')
    .splice(1, filePath.length - 1)
    .join('/')
}

process.on('SIGINT', () => {
  console.log('Exiting...')
  watcher.close()
  console.log('Watcher stopped.')
})

process.setMaxListeners(0)
