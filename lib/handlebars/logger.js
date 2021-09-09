const { indexOf } = require('./utils'),
      logger = {
        methodMap: ['debug', 'info', 'warn', 'error'],
        level: 'info',

        // Maps a given level value to the `methodMap` indexes above.
        lookupLevel(level) {
          if (typeof level === 'string') {
            const levelMap = indexOf(logger.methodMap, level.toLowerCase())
            if (levelMap >= 0) {
              level = levelMap
            } else {
              level = parseInt(level, 10)
            }
          }

          return level
        },

        // Can be overridden in the host environment
        log(level, ...message) {
          level = logger.lookupLevel(level)

          if (
            typeof console !== 'undefined'
      && logger.lookupLevel(logger.level) <= level
          ) {
            let method = logger.methodMap[level]
            // eslint-disable-next-line no-console
            if (!console[method]) {
              method = 'log'
            }
            console[method](...message) // eslint-disable-line no-console
          }
        }
      }

module.exports = logger
